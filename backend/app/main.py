from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Annotated, Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import ExifTags, Image, UnidentifiedImageError
from pydantic import BaseModel, EmailStr, Field


ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
DATA_DIR = Path(os.getenv("CIVIC_DATA_DIR", ROOT / "data")).resolve()
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "civic_ai.sqlite3"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SECRET = os.getenv("CIVIC_SECRET", "local-dev-only-change-me").encode("utf-8")
COOKIE_NAME = "civic_session"
SESSION_SECONDS = 60 * 60 * 24 * 14
MAX_UPLOAD_BYTES = 12 * 1024 * 1024
TENDER_URL = "https://etenders.chd.nic.in/nicgep/app"
GRIEVANCE_URL = "https://admser.chd.nic.in/jansampark/"
RTI_INFO_URL = "https://chandigarh.gov.in/submit-rti-application"
RTI_ONLINE_URL = "https://rtionline.gov.in/"
CONTACT_EMAIL = os.getenv("CIVIC_CONTACT_EMAIL", "").strip()
USER_AGENT = f"CivicAI-Chandigarh/0.1 ({CONTACT_EMAIL})" if CONTACT_EMAIL else "CivicAI-Chandigarh/0.1"

app = FastAPI(title="Civic AI Chandigarh API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type"],
)

_tender_cache: dict[str, Any] = {"fetched_at": 0, "items": [], "error": None}
_geo_cache: dict[str, tuple[float, str]] = {}
_last_geo_call = 0.0


@contextmanager
def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def init_db() -> None:
    with db() as con:
        con.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                points INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS issues (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                locality TEXT NOT NULL DEFAULT 'Chandigarh',
                latitude REAL,
                longitude REAL,
                photo_name TEXT,
                photo_taken_at TEXT,
                photo_freshness TEXT NOT NULL DEFAULT 'unknown',
                photo_metadata TEXT NOT NULL DEFAULT 'No EXIF capture metadata found',
                department TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'reported',
                official_reference TEXT,
                submitted_at TEXT,
                created_at TEXT NOT NULL,
                points_awarded INTEGER NOT NULL DEFAULT 20
            );
            CREATE TABLE IF NOT EXISTS issue_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
                status TEXT NOT NULL,
                note TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_issues_user_created ON issues(user_id, created_at DESC);
            """
        )


init_db()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def password_digest(password: str, salt: bytes) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000).hex()


def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def issue_token(user_id: str) -> str:
    payload = b64(json.dumps({"sub": user_id, "exp": int(time.time()) + SESSION_SECONDS}, separators=(",", ":")).encode())
    signature = b64(hmac.new(SECRET, payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{signature}"


def decode_token(token: str) -> str | None:
    try:
        payload, signature = token.split(".", 1)
        expected = b64(hmac.new(SECRET, payload.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            return None
        raw = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
        data = json.loads(raw)
        if int(data.get("exp", 0)) < time.time():
            return None
        return str(data["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None


def current_user(request: Request) -> dict[str, Any]:
    token = request.cookies.get(COOKIE_NAME)
    user_id = decode_token(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    with db() as con:
        row = con.execute("SELECT id, name, email, points FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Session is no longer valid.")
    return dict(row)


def set_session(response: Response, user_id: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        issue_token(user_id),
        max_age=SESSION_SECONDS,
        httponly=True,
        secure=os.getenv("CIVIC_COOKIE_SECURE", "0") == "1",
        samesite="lax",
        path="/",
    )


class AuthIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)


class StatusIn(BaseModel):
    status: str
    note: str = Field(default="", max_length=500)
    official_reference: str | None = Field(default=None, max_length=100)


ROUTING = {
    "Road damage": "Municipal Corporation · Engineering (Building & Road)",
    "Streetlight": "Municipal Corporation · Electrical Wing",
    "Waste & sanitation": "Municipal Corporation · Sanitation / Public Health",
    "Water & drainage": "Municipal Corporation · Public Health",
    "Parks & trees": "Municipal Corporation · Horticulture",
    "Other": "Chandigarh e-Jansampark · Public Grievance",
}

SERVICE_TARGETS = {
    "Road damage": "10 working days for listed miscellaneous Building & Road complaints; confirm applicability with the department.",
    "Streetlight": "3 working days for a street-light/park fault under the published Chandigarh Right to Service notification.",
}

DEPT_SOURCES = {
    "Road damage": "https://chandigarh.gov.in/sites/default/files/documents/dop19-14032.pdf",
    "Streetlight": "https://chandigarh.gov.in/sites/default/files/documents/dop19-14032.pdf",
    "Other": "https://chandigarh.gov.in/how-do-i",
}


def get_exif_metadata(content: bytes) -> dict[str, Any]:
    try:
        from io import BytesIO

        image = Image.open(BytesIO(content))
        exif = image.getexif()
        if not exif:
            return {"latitude": None, "longitude": None, "taken_at": None, "summary": "No EXIF capture metadata found"}
        exif_named = {ExifTags.TAGS.get(k, k): v for k, v in exif.items()}
        exif_ifd = exif.get_ifd(0x8769) if hasattr(exif, "get_ifd") else {}
        ifd_named = {ExifTags.TAGS.get(k, k): v for k, v in exif_ifd.items()}
        raw_date = ifd_named.get("DateTimeOriginal") or ifd_named.get("DateTimeDigitized") or exif_named.get("DateTime")
        taken_at = None
        if raw_date:
            try:
                taken_at = datetime.strptime(str(raw_date), "%Y:%m:%d %H:%M:%S").replace(tzinfo=timezone.utc).isoformat(timespec="seconds")
            except ValueError:
                pass
        gps_raw = exif.get_ifd(0x8825) if hasattr(exif, "get_ifd") else {}
        gps = {ExifTags.GPSTAGS.get(k, k): v for k, v in gps_raw.items()}

        def dms(value: Any, ref: Any) -> float | None:
            if not value or not ref:
                return None
            parts = [float(x) for x in value]
            deg = parts[0] + parts[1] / 60 + parts[2] / 3600
            if str(ref).upper() in ("S", "W"):
                deg = -deg
            return round(deg, 7)

        lat = dms(gps.get("GPSLatitude"), gps.get("GPSLatitudeRef"))
        lon = dms(gps.get("GPSLongitude"), gps.get("GPSLongitudeRef"))
        notes = []
        if taken_at:
            notes.append("capture time read from EXIF")
        if lat is not None and lon is not None:
            notes.append("GPS coordinates read from EXIF")
        return {"latitude": lat, "longitude": lon, "taken_at": taken_at, "summary": "; ".join(notes) if notes else "No EXIF capture time or GPS coordinates found"}
    except (UnidentifiedImageError, OSError, ValueError, TypeError, KeyError):
        return {"latitude": None, "longitude": None, "taken_at": None, "summary": "Could not read EXIF metadata"}


def freshness(taken_at: str | None) -> str:
    if not taken_at:
        return "unknown"
    try:
        value = datetime.fromisoformat(taken_at)
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        age_days = (datetime.now(timezone.utc) - value.astimezone(timezone.utc)).total_seconds() / 86400
        if age_days < -1:
            return "future"
        return "recent" if age_days <= 90 else "older"
    except ValueError:
        return "unknown"


def issue_payload(row: sqlite3.Row, events: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    data = dict(row)
    data["has_photo"] = bool(data.pop("photo_name", None))
    data["events"] = events or []
    data["service_target"] = SERVICE_TARGETS.get(data["category"])
    data["department_source"] = DEPT_SOURCES.get(data["category"], "https://chandigarh.gov.in/how-do-i")
    data["grievance_url"] = GRIEVANCE_URL
    data["rti_info_url"] = RTI_INFO_URL
    return data


def fetch_tenders(force: bool = False) -> dict[str, Any]:
    if not force and _tender_cache["fetched_at"] and time.time() - _tender_cache["fetched_at"] < 900:
        return _tender_cache
    try:
        with requests.Session() as session:
            response = session.get(TENDER_URL, headers={"User-Agent": USER_AGENT}, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            table = soup.find("table", id="activeTenders")
            items = []
            if table:
                for row in table.find_all("tr"):
                    cells = row.find_all("td", recursive=False)
                    if len(cells) < 3:
                        continue
                    anchor = cells[0].find("a")
                    title = " ".join(cells[0].get_text(" ", strip=True).split())
                    if re.match(r"^\d+\.\s*", title):
                        title = re.sub(r"^\d+\.\s*", "", title)
                    if not title:
                        continue
                    close_date = " ".join(cells[2].get_text(" ", strip=True).split())
                    try:
                        close_iso = datetime.strptime(close_date, "%d-%b-%Y %I:%M %p").replace(tzinfo=timezone.utc).isoformat(timespec="minutes")
                    except ValueError:
                        close_iso = None
                    item = {
                        "title": title,
                        "reference": " ".join(cells[1].get_text(" ", strip=True).split()),
                        "closing_date": close_date,
                        "closing_at": close_iso,
                        "opening_date": " ".join(cells[3].get_text(" ", strip=True).split()) if len(cells) > 3 else None,
                        # The portal's detail links are session-bound. Keep a durable public URL
                        # and show the reference number so citizens can find the live record.
                        "url": TENDER_URL,
                        "source": TENDER_URL,
                        "tender_id": None,
                        "organisation_chain": None,
                        "amount": None,
                        "amount_label": None,
                        "authority_name": None,
                        "authority_address": None,
                        "authority_phone": None,
                        "authority_email": None,
                        "awarded_vendor": None,
                    }
                    if anchor and anchor.get("href"):
                        try:
                            detail_response = session.get(urljoin(TENDER_URL, anchor["href"]), headers={"User-Agent": USER_AGENT}, timeout=10)
                            detail_response.raise_for_status()
                            detail = BeautifulSoup(detail_response.text, "html.parser")
                            detail_text = " ".join(detail.get_text(" ", strip=True).split())
                            if "Stale Session" not in detail_text and "Your session has timed out" not in detail_text:
                                def field_value(label: str) -> str | None:
                                    for detail_cell in detail.find_all("td"):
                                        cell_label = " ".join(detail_cell.get_text(" ", strip=True).split()).rstrip(":")
                                        if cell_label.casefold().startswith(label.casefold()):
                                            value_cell = detail_cell.find_next_sibling("td")
                                            if value_cell is None:
                                                siblings = detail_cell.find_parent("tr").find_all("td")
                                                try:
                                                    value_cell = siblings[siblings.index(detail_cell) + 1]
                                                except (ValueError, IndexError):
                                                    return None
                                            value = " ".join(value_cell.get_text(" ", strip=True).split())
                                            return value or None
                                    return None

                                item["tender_id"] = field_value("Tender ID")
                                item["organisation_chain"] = field_value("Organisation Chain")
                                raw_amount = field_value("Tender Value in")
                                if raw_amount:
                                    amount_match = re.search(r"[\d,]+(?:\.\d+)?", raw_amount)
                                    if amount_match:
                                        amount_value = float(amount_match.group(0).replace(",", ""))
                                        item["amount"] = int(amount_value) if amount_value.is_integer() else amount_value
                                        item["amount_label"] = "Estimated tender value"
                                authority = re.search(r"Tender Inviting Authority\s+Name\s+(.+?)\s+Address\s+(.+?)(?:\s+Back\b|$)", detail_text, re.IGNORECASE)
                                if authority:
                                    item["authority_name"] = authority.group(1).strip()
                                    item["authority_address"] = authority.group(2).strip()
                                item["authority_phone"] = field_value("Phone") or field_value("Telephone")
                                item["authority_email"] = field_value("Email") or field_value("E-mail")
                        except requests.RequestException:
                            pass
                    items.append(item)
        _tender_cache.update({"fetched_at": time.time(), "items": items, "error": None})
    except (requests.RequestException, ValueError) as exc:
        _tender_cache["error"] = str(exc)
        _tender_cache["fetched_at"] = time.time()
    return _tender_cache


def filtered_tenders(query: str = "", limit: int = 12) -> dict[str, Any]:
    cache = fetch_tenders()
    terms = [term for term in re.findall(r"[\w/-]+", query.lower()) if len(term) > 2]
    items = cache["items"]
    if terms:
        selected = [item for item in items if any(term in (item["title"] + " " + item["reference"]).lower() for term in terms)]
        items = selected or []
    return {"items": items[:limit], "source": TENDER_URL, "fetched_at": datetime.fromtimestamp(cache["fetched_at"], timezone.utc).isoformat(timespec="seconds") if cache["fetched_at"] else None, "error": cache["error"], "notice": "Estimated tender values and inviting-authority names are shown only when the official tender detail publishes them. Awarded contractors, final spending, and direct contacts are not inferred."}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "Civic AI Chandigarh API"}


@app.post("/api/auth/register")
def register(body: AuthIn, response: Response) -> dict[str, Any]:
    if not body.name:
        raise HTTPException(status_code=422, detail="Name is required to create an account.")
    salt = secrets.token_bytes(16)
    user_id = str(uuid.uuid4())
    try:
        with db() as con:
            con.execute("INSERT INTO users (id, name, email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)", (user_id, body.name.strip(), body.email.lower(), salt.hex(), password_digest(body.password, salt), now_iso()))
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    set_session(response, user_id)
    return {"id": user_id, "name": body.name.strip(), "email": body.email.lower(), "points": 0}


@app.post("/api/auth/login")
def login(body: AuthIn, response: Response) -> dict[str, Any]:
    with db() as con:
        row = con.execute("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (body.email,)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    expected = password_digest(body.password, bytes.fromhex(row["password_salt"]))
    if not hmac.compare_digest(expected, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    set_session(response, row["id"])
    return {"id": row["id"], "name": row["name"], "email": row["email"], "points": row["points"]}


@app.get("/api/auth/me")
def me(user: Annotated[dict[str, Any], Depends(current_user)]) -> dict[str, Any]:
    return user


@app.post("/api/auth/logout")
def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(COOKIE_NAME, path="/", httponly=True, samesite="lax")
    return {"ok": True}


@app.get("/api/issues")
def list_issues(user: Annotated[dict[str, Any], Depends(current_user)]) -> dict[str, Any]:
    with db() as con:
        rows = con.execute("SELECT * FROM issues WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
        issues = []
        for row in rows:
            events = [dict(event) for event in con.execute("SELECT status, note, created_at FROM issue_events WHERE issue_id = ? ORDER BY created_at ASC", (row["id"],)).fetchall()]
            issues.append(issue_payload(row, events))
    return {"items": issues}


@app.post("/api/issues")
async def create_issue(
    user: Annotated[dict[str, Any], Depends(current_user)],
    title: Annotated[str, Form(min_length=4, max_length=120)],
    category: Annotated[str, Form()],
    description: Annotated[str, Form(min_length=10, max_length=1800)],
    locality: Annotated[str, Form(max_length=120)] = "Chandigarh",
    latitude: Annotated[float | None, Form()] = None,
    longitude: Annotated[float | None, Form()] = None,
    photo: Annotated[UploadFile | None, File()] = None,
) -> dict[str, Any]:
    if category not in ROUTING:
        raise HTTPException(status_code=422, detail="Choose a supported issue category.")
    if (latitude is None) != (longitude is None):
        raise HTTPException(status_code=422, detail="Both latitude and longitude are needed for a location.")
    if latitude is not None and not (30.50 <= latitude <= 30.90 and 76.55 <= longitude <= 77.05):
        raise HTTPException(status_code=422, detail="Location is outside the Chandigarh region. Check the selected location.")
    photo_name = None
    taken_at = None
    freshness_label = "unknown"
    metadata_note = "No photo attached"
    exif: dict[str, Any] = {}
    if photo:
        content = await photo.read(MAX_UPLOAD_BYTES + 1)
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Photo must be 12 MB or smaller.")
        try:
            from io import BytesIO

            image = Image.open(BytesIO(content))
            if image.format not in {"JPEG", "PNG", "WEBP"}:
                raise HTTPException(status_code=415, detail="Use a JPEG, PNG, or WebP image.")
            image.verify()
        except HTTPException:
            raise
        except (UnidentifiedImageError, OSError, ValueError):
            raise HTTPException(status_code=415, detail="That file could not be read as an image.")
        exif = get_exif_metadata(content)
        taken_at = exif["taken_at"]
        freshness_label = freshness(taken_at)
        metadata_note = exif["summary"]
        # Prefer the device location unless the image itself carries GPS data.
        if exif["latitude"] is not None and exif["longitude"] is not None:
            latitude, longitude = exif["latitude"], exif["longitude"]
            if not (30.50 <= latitude <= 30.90 and 76.55 <= longitude <= 77.05):
                raise HTTPException(status_code=422, detail="Photo GPS metadata is outside the Chandigarh region.")
        suffix = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}[image.format]
        photo_name = f"{uuid.uuid4().hex}{suffix}"
        (UPLOAD_DIR / photo_name).write_bytes(content)
    issue_id = f"CA-{datetime.now().strftime('%y%m%d')}-{secrets.token_hex(3).upper()}"
    created_at = now_iso()
    department = ROUTING[category]
    with db() as con:
        con.execute(
            "INSERT INTO issues (id, user_id, title, category, description, locality, latitude, longitude, photo_name, photo_taken_at, photo_freshness, photo_metadata, department, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (issue_id, user["id"], title.strip(), category, description.strip(), locality.strip() or "Chandigarh", latitude, longitude, photo_name, taken_at, freshness_label, metadata_note, department, created_at),
        )
        con.execute("UPDATE users SET points = points + 20 WHERE id = ?", (user["id"],))
        con.execute("INSERT INTO issue_events (issue_id, status, note, created_at) VALUES (?, ?, ?, ?)", (issue_id, "reported", "Issue report created in Civic AI.", created_at))
        row = con.execute("SELECT * FROM issues WHERE id = ?", (issue_id,)).fetchone()
    return issue_payload(row, [{"status": "reported", "note": "Issue report created in Civic AI.", "created_at": created_at}])


@app.patch("/api/issues/{issue_id}/status")
def update_issue_status(issue_id: str, body: StatusIn, user: Annotated[dict[str, Any], Depends(current_user)]) -> dict[str, Any]:
    allowed = {"reported", "filed", "in_progress", "resolved"}
    if body.status not in allowed:
        raise HTTPException(status_code=422, detail="Choose a valid tracker status.")
    with db() as con:
        row = con.execute("SELECT * FROM issues WHERE id = ? AND user_id = ?", (issue_id, user["id"])).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Report not found.")
        old = row["status"]
        changed_at = now_iso()
        note = body.note.strip() or ("You marked the official complaint as submitted." if body.status == "filed" else f"You updated the status to {body.status.replace('_', ' ')}.")
        submitted_at = row["submitted_at"] or (changed_at if body.status == "filed" else None)
        reference = body.official_reference.strip() if body.official_reference else row["official_reference"]
        con.execute("UPDATE issues SET status = ?, official_reference = ?, submitted_at = ? WHERE id = ?", (body.status, reference, submitted_at, issue_id))
        if old != body.status or body.note.strip() or body.official_reference:
            con.execute("INSERT INTO issue_events (issue_id, status, note, created_at) VALUES (?, ?, ?, ?)", (issue_id, body.status, note, changed_at))
        updated = con.execute("SELECT * FROM issues WHERE id = ?", (issue_id,)).fetchone()
        events = [dict(event) for event in con.execute("SELECT status, note, created_at FROM issue_events WHERE issue_id = ? ORDER BY created_at ASC", (issue_id,)).fetchall()]
    return issue_payload(updated, events)


@app.get("/api/issues/{issue_id}/photo")
def issue_photo(issue_id: str, user: Annotated[dict[str, Any], Depends(current_user)]) -> FileResponse:
    with db() as con:
        row = con.execute("SELECT photo_name FROM issues WHERE id = ? AND user_id = ?", (issue_id, user["id"])).fetchone()
    if not row or not row["photo_name"]:
        raise HTTPException(status_code=404, detail="No photo is available for this report.")
    path = UPLOAD_DIR / row["photo_name"]
    if not path.exists():
        raise HTTPException(status_code=404, detail="The stored photo is missing.")
    return FileResponse(path, headers={"Cache-Control": "private, no-store"})


@app.get("/api/tenders")
def tenders(query: str = "", limit: int = 12, refresh: bool = False) -> dict[str, Any]:
    if refresh:
        fetch_tenders(force=True)
    return filtered_tenders(query, max(1, min(limit, 30)))


@app.get("/api/locality")
def locality(latitude: float, longitude: float) -> dict[str, str]:
    if not (30.50 <= latitude <= 30.90 and 76.55 <= longitude <= 77.05):
        raise HTTPException(status_code=422, detail="Location is outside the Chandigarh region.")
    key = f"{latitude:.3f},{longitude:.3f}"
    cached = _geo_cache.get(key)
    if cached and time.time() - cached[0] < 86400:
        return {"locality": cached[1], "source": "OpenStreetMap Nominatim"}
    global _last_geo_call
    wait = 1.1 - (time.time() - _last_geo_call)
    if wait > 0:
        time.sleep(wait)
    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"format": "jsonv2", "lat": latitude, "lon": longitude, "zoom": 16},
            headers={"User-Agent": USER_AGENT},
            timeout=8,
        )
        _last_geo_call = time.time()
        response.raise_for_status()
        address = response.json().get("address", {})
        locality_name = address.get("suburb") or address.get("neighbourhood") or address.get("quarter") or address.get("city_district") or address.get("town") or "Chandigarh"
        sector = re.search(r"sector\s*[- ]?\d+[A-Z]?(?:\s*(?:East|West))?", response.json().get("display_name", ""), re.I)
        if sector and "sector" not in locality_name.lower():
            locality_name = sector.group(0).title()
        _geo_cache[key] = (time.time(), locality_name)
        return {"locality": locality_name, "source": "OpenStreetMap Nominatim"}
    except (requests.RequestException, ValueError):
        raise HTTPException(status_code=503, detail="Locality lookup is unavailable; you can enter the locality yourself.")


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    return {
        "city": "Chandigarh",
        "sources": {
            "tenders": TENDER_URL,
            "grievance": GRIEVANCE_URL,
            "rti_info": RTI_INFO_URL,
            "rti_online": RTI_ONLINE_URL,
            "how_do_i": "https://chandigarh.gov.in/how-do-i",
            "service_standards": "https://chandigarh.gov.in/sites/default/files/documents/dop19-14032.pdf",
        },
        "departments": ROUTING,
        "service_targets": SERVICE_TARGETS,
    }


@app.get("/api/issues/{issue_id}/rti")
def rti_draft(issue_id: str, user: Annotated[dict[str, Any], Depends(current_user)]) -> dict[str, str]:
    with db() as con:
        issue = con.execute("SELECT * FROM issues WHERE id = ? AND user_id = ?", (issue_id, user["id"])).fetchone()
    if not issue:
        raise HTTPException(status_code=404, detail="Report not found.")
    ref = issue["official_reference"] or "[enter the government grievance reference, if available]"
    draft = (
        "To the Public Information Officer, Municipal Corporation, Chandigarh\n\n"
        "Subject: Information under the Right to Information Act, 2005 — civic grievance " + ref + "\n\n"
        "Please provide the following information for the civic issue described below:\n"
        f"Civic AI report: {issue['id']}\n"
        f"Issue: {issue['title']} ({issue['category']})\n"
        f"Location: {issue['locality']}\n"
        f"Date first reported in Civic AI: {issue['created_at'][:10]}\n\n"
        "1. The diary/reference number and date on which the attached grievance was received by the public authority.\n"
        "2. Copies of action-taken records, inspection notes, work orders, and correspondence on this grievance.\n"
        "3. The name/designation of the office responsible for handling it and the applicable service-delivery time limit.\n"
        "4. If the grievance was transferred or closed, copies of the transfer/closure record and the reasons recorded.\n\n"
        "I am an Indian citizen. Please provide the information in electronic form where available. I will pay any prescribed application fee through the official process.\n\n"
        f"Applicant: {user['name']}\nEmail: {user['email']}\n\n"
        "Please replace bracketed text, attach your grievance receipt, and confirm the correct public authority/PIO before filing."
    )
    return {"draft": draft, "online_url": RTI_ONLINE_URL, "information_url": RTI_INFO_URL}


@app.get("/api/issues/{issue_id}/complaint")
def complaint_draft(issue_id: str, user: Annotated[dict[str, Any], Depends(current_user)]) -> dict[str, str]:
    with db() as con:
        issue = con.execute("SELECT * FROM issues WHERE id = ? AND user_id = ?", (issue_id, user["id"])).fetchone()
    if not issue:
        raise HTTPException(status_code=404, detail="Report not found.")
    draft = (
        "Subject: Civic issue requiring attention — " + issue["title"] + "\n\n"
        "To the concerned public authority, Chandigarh\n\n"
        "Please register and address the following civic issue. I have included the location and description below. "
        "Please share the grievance reference/diary number and the responsible office.\n\n"
        f"Issue: {issue['title']}\n"
        f"Category: {issue['category']}\n"
        f"Location/locality: {issue['locality']}\n"
        f"Details: {issue['description']}\n\n"
        f"Suggested office: {issue['department']}\n"
        f"Civic AI private tracker ID: {issue['id']}\n"
        f"Reported in Civic AI on: {issue['created_at'][:10]}\n\n"
        "Please attach the original photo when submitting, if the official form supports attachments.\n\n"
        f"Name: {user['name']}\nEmail: {user['email']}\n\n"
        "This text is a draft. Review it, confirm the responsible authority, and submit it yourself on the official grievance portal."
    )
    return {"draft": draft, "official_url": GRIEVANCE_URL}
