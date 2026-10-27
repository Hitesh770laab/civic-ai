# Civic AI — Chandigarh

Civic AI is an open-source, local-first starter for reporting civic issues in Chandigarh. It brings a citizen's photo and location together with official tender and grievance links, and keeps a private tracker of the steps the citizen takes.

## What works in this starter

- Email/password registration and login, with passwords hashed using PBKDF2 and a same-site, HTTP-only session cookie.
- Private issue reports with a locally stored photo, GPS/time EXIF extraction, optional device geolocation, and a freshness indicator. Metadata is evidence to review, not proof that a photo is authentic.
- Live latest-tender listings scraped from the Chandigarh Administration's NIC e-Procurement portal, including estimated tender values and inviting-authority names where the official detail page publishes them. Awarded contractor, direct officer contacts, and final expenditure are not reliably included, so Civic AI does not invent those values.
- Issue categorization, a transparent office-routing suggestion, potential tender matches based on words in the title, and a private report timeline.
- Quick access to Chandigarh's official Jansampark grievance flow and a prefilled RTI draft that a citizen can copy into the official filing flow. External filings are not submitted or tracked automatically; enter the government reference number and update the status after filing.
- A small points and badge system for participation. Points are not money and do not imply government endorsement.

## Official sources used

- [Chandigarh e-Procurement](https://etenders.chd.nic.in/nicgep/app) — live tender listing.
- [Chandigarh Administration: How Do I](https://chandigarh.gov.in/how-do-i) — official grievance and RTI service links.
- [Chandigarh Administration: Submit RTI Application](https://chandigarh.gov.in/submit-rti-application) — filing guidance and online RTI link.
- [Chandigarh Right to Service notification](https://chandigarh.gov.in/sites/default/files/documents/dop19-14032.pdf) — published service standards, including 3 working days for a street-light/park fault and 10 working days for listed miscellaneous Building & Road complaints.
- [Chandigarh e-Jansampark grievance portal](https://admser.chd.nic.in/jansampark/) — official portal referenced by Chandigarh citizen charters.

The category-to-office suggestions are guidance and can be wrong for an issue on land managed by another authority. Confirm the recipient in the official portal. Public tender amount, award, and staff contact data are shown only when the official source explicitly provides them.

## Run locally

Requirements: Python 3.11+ and Node.js 20+.

### Backend

```powershell
cd outputs/civic-ai/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The database and private uploads are created under `backend/data/` on first run. Copy `backend/.env.example` to `backend/.env` and set a long random `CIVIC_SECRET` and the maintainer's contact email before public use.

### Frontend

In a second terminal:

```powershell
cd outputs/civic-ai/frontend
npm install
npm run dev
```

Open the Vite URL (normally <http://localhost:5173>). Vite proxies `/api` calls to the backend.

## Privacy and deployment notes

This is a development starter, not a public service. User accounts, report text, coordinates, and uploaded photos are stored locally. The current version has no email verification, password reset, malware scanning, backups, or production operations setup. Keep the app behind HTTPS, set a production secret, add abuse controls and retention/deletion controls, and complete a privacy/security review before exposing it publicly. Reverse geocoding uses OpenStreetMap's public Nominatim service only after the citizen asks to use their location; that sends coordinates to the service. Requests are cached and limited to at most one per second per backend process. The UI links to OpenStreetMap attribution and the maintainer contact in `.env` is used in the request User-Agent. No map tiles or paid map API are used.

## License

MIT — see `LICENSE`.
