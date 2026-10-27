import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertCircle, ArrowRight, ArrowUpRight, Award, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, Copy,
  ExternalLink, FileCheck2, FileText, Filter, Globe2, HeartHandshake,
  Lightbulb, LogOut, MapPin, Menu, Navigation, Phone, Plus, RefreshCw,
  Search, ShieldCheck, Sparkles, Sun, Trash2, UploadCloud, UserRound,
  WalletCards, Wrench, X, Zap,
} from 'lucide-react'

const SOURCES = {
  tenders: 'https://etenders.chd.nic.in/nicgep/app',
  grievance: 'https://admser.chd.nic.in/jansampark/',
  rtiInfo: 'https://chandigarh.gov.in/submit-rti-application',
  rtiOnline: 'https://rtionline.gov.in/',
  service: 'https://chandigarh.gov.in/sites/default/files/documents/dop19-14032.pdf',
  how: 'https://chandigarh.gov.in/how-do-i',
  mccHelp: 'tel:01722787200',
  powerHelp: 'tel:01724639999',
}

const CATEGORIES = [
  { id: 'Road damage', label: 'Road damage & potholes', icon: Wrench, dept: 'MCC — B&R Engineering Wing', rts: '10 working days', tone: 'amber' },
  { id: 'Streetlight', label: 'Streetlight fault', icon: Lightbulb, dept: 'MCC — Electrical Division', rts: '3 working days', tone: 'gold' },
  { id: 'Waste & sanitation', label: 'Waste & sanitation', icon: Trash2, dept: 'MCC — Medical Officer of Health (MOH)', rts: '24-48 hours', tone: 'teal' },
  { id: 'Water & drainage', label: 'Water & drainage', icon: Activity, dept: 'MCC — Public Health Department', rts: '3-7 working days', tone: 'blue' },
  { id: 'Parks & trees', label: 'Parks & green spaces', icon: Sun, dept: 'Department of Horticulture, Chandigarh', rts: '3 working days', tone: 'sage' },
  { id: 'Other', label: 'General municipal issue', icon: AlertCircle, dept: 'Chandigarh Jan Sampark / Respective Wing', rts: 'As per RTS Act', tone: 'neutral' },
]

const QUICK_SECTORS = [
  'Sector 17', 'Sector 22', 'Sector 35', 'Sector 43',
  'Sector 15', 'Sector 26', 'Sector 34', 'Manimajra',
]

const STATUS_CONFIG = {
  reported: { label: 'Report Created', step: 1, tone: 'amber', badge: 'Drafted in Civic AI' },
  filed: { label: 'Filed with Govt', step: 2, tone: 'blue', badge: 'Jansampark Reference Added' },
  in_progress: { label: 'Under Review', step: 3, tone: 'purple', badge: 'Official Action Pending' },
  resolved: { label: 'Resolved', step: 4, tone: 'emerald', badge: 'Issue Closed' },
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api'

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) throw new Error(body?.detail || `Request failed (${response.status})`)
  return body
}

function fmtDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('en-IN', options).format(d)
}

function inr(value) {
  if (value === null || value === undefined || value === '') return null
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase()
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'CA'
}

function Brand({ light = false }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <div className="brand-text">
        <span className="brand-word">civic<span>ai</span></span>
        <span className="brand-city">CHANDIGARH</span>
      </div>
    </div>
  )
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await api(`/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: mode === 'register' ? name : undefined, email, password }),
      })
      onAuth(user)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Brand light />
        <div className="auth-story-copy">
          <span className="eyebrow light-eyebrow">
            <span className="live-dot" /> CITIZEN CIVIC PLATFORM · CHANDIGARH
          </span>
          <h1>Make your<br /><em>sector</em> count.</h1>
          <p>
            Spot an issue. Document the evidence. Get the official Jansampark grievance
            reference, and track municipal follow-through under the Right to Service Act.
          </p>

          <div className="auth-proof-badges">
            <div className="proof-card">
              <span className="proof-icon"><MapPin size={18} /></span>
              <div>
                <b>Chandigarh Sector Level</b>
                <span>Geotagged & verified reports</span>
              </div>
            </div>
            <div className="proof-card">
              <span className="proof-icon"><FileCheck2 size={18} /></span>
              <div>
                <b>Automated RTI & Grievances</b>
                <span>Ready-to-submit official drafts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-bottom">
          <span className="triad"><i /><i /><i /></span>
          <span>Open citizen intelligence · Chandigarh Union Territory</span>
          <span className="auth-tag">UT CHD</span>
        </div>
        <div className="story-orb orb-one" />
        <div className="story-orb orb-two" />
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand"><Brand /></div>
        <div className="auth-form-wrap">
          <span className="eyebrow">CHANDIGARH RESIDENT ACCESS</span>
          <h2>{mode === 'login' ? 'Welcome back' : 'Join your neighbourhood'}</h2>
          <p className="muted auth-intro">
            {mode === 'login'
              ? 'Sign in to access your civic tracking dossiers and follow up on municipal issues.'
              : 'Create an account to report issues, audit city tenders, and build civic karma.'}
          </p>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <label>
                Your Full Name
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Hitesh Sharma"
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="At least 10 characters"
                required
                minLength={10}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && <div className="form-error">{error}</div>}

            <button className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in to Civic AI' : 'Create Resident Account'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'New to Civic AI Chandigarh?' : 'Already registered?'}
            {' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in here'}
            </button>
          </p>

          <div className="auth-privacy">
            <ShieldCheck size={18} />
            <span>Reports and photos remain secure in your private account until submitted.</span>
          </div>
          <div className="auth-source">
            <span className="tiny-flag"><i /><i /><i /></span>
            Independent civic platform · Connects to Chandigarh Jansampark & e-Tenders
          </div>
        </div>
      </section>
    </main>
  )
}

function ReportModal({ initialCategory, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(initialCategory || 'Road damage')
  const [description, setDescription] = useState('')
  const [locality, setLocality] = useState('Sector 17, Chandigarh')
  const [coords, setCoords] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [locating, setLocating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const activeCategoryMeta = useMemo(() => {
    return CATEGORIES.find(c => c.id === category) || CATEGORIES[0]
  }, [category])

  const pickPhoto = event => {
    const f = event.target.files?.[0]
    if (!f) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    if (f.size > 12 * 1024 * 1024) {
      setError('Photo must be 12 MB or smaller.')
      return
    }
    setPhoto(f)
    setPhotoUrl(URL.createObjectURL(f))
    setError('')
  }

  const useLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in your browser. Select a Sector manually.')
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async position => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        setCoords({ latitude, longitude })
        setLocality('Locating your sector…')
        try {
          const result = await api(`/locality?latitude=${latitude}&longitude=${longitude}`)
          setLocality(result.locality || 'Chandigarh')
        } catch {
          setLocality('Chandigarh')
        } finally {
          setLocating(false)
        }
      },
      () => {
        setError('Location access was denied. You can click any sector button below.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('category', category)
      form.append('description', description)
      form.append('locality', locality || 'Chandigarh')
      if (coords) {
        form.append('latitude', coords.latitude)
        form.append('longitude', coords.longitude)
      }
      if (photo) form.append('photo', photo)
      const issue = await api('/issues', { method: 'POST', body: form })
      onCreated(issue)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <header className="modal-head">
          <div>
            <span className="eyebrow"><Sparkles size={13} /> STEP 1 OF 2 · LOG CIVIC ISSUE</span>
            <h2 id="report-modal-title">Report a City Problem</h2>
            <p className="modal-sub">Document clear evidence. Civic AI routes this to the correct Chandigarh department.</p>
          </div>
          <button className="icon-button modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="report-flow">
            {/* Category visual picker */}
            <div className="field-group">
              <label className="field-label">
                <span>Select Issue Category</span>
                <small>Auto-determines department & statutory response window</small>
              </label>
              <div className="category-grid">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  const isSelected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-pill-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      <span className={`cat-icon-wrap ${cat.tone}`}><Icon size={18} /></span>
                      <span className="cat-btn-text">{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Smart Routing Preview banner */}
              <div className="smart-routing-card">
                <div className="routing-badge">
                  <Zap size={14} />
                  <span>Smart Municipal Routing</span>
                </div>
                <div className="routing-details">
                  <b>{activeCategoryMeta.dept}</b>
                  <span>Published RTS resolution standard: <strong>{activeCategoryMeta.rts}</strong></span>
                </div>
              </div>
            </div>

            <div className="report-main-columns">
              {/* Left Column: Photo Upload */}
              <div className="upload-side">
                <label className="field-label">
                  <span>Photo Evidence</span>
                  <small>Improves resolution speed by 70%</small>
                </label>
                <label className={`upload-zone ${photoUrl ? 'has-preview' : ''}`}>
                  {photoUrl ? (
                    <div className="preview-container">
                      <img src={photoUrl} alt="Issue preview" />
                      <div className="preview-change-overlay">
                        <UploadCloud size={16} />
                        <span>Replace Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon-circle"><UploadCloud size={28} /></span>
                      <b>Upload or Take Photo</b>
                      <span>JPG, PNG or WebP up to 12 MB</span>
                      <small>GPS & timestamp extracted automatically</small>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} />
                </label>
                <div className="photo-trust-note">
                  <ShieldCheck size={15} />
                  <span>Your photo remains private to your report until filed.</span>
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="fields-side">
                <label className="field-label">
                  <span>Issue Headline</span>
                  <input
                    required
                    minLength={4}
                    maxLength={120}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Deep pothole on V4 road near Sector 22 market"
                  />
                </label>

                <label className="field-label">
                  <span>Specific Location / Sector</span>
                  <div className="location-input-row">
                    <input
                      required
                      value={locality}
                      onChange={e => setLocality(e.target.value)}
                      placeholder="e.g. Sector 22-B, near Kiran Cinema"
                    />
                    <button
                      type="button"
                      className="btn-locate"
                      onClick={useLocation}
                      disabled={locating}
                      title="Use my current GPS position"
                    >
                      <Navigation size={15} className={locating ? 'spin' : ''} />
                      {locating ? 'Detecting…' : 'Use GPS'}
                    </button>
                  </div>
                </label>

                {/* Quick Sector Selector Chips */}
                <div className="quick-sectors-wrap">
                  <span className="quick-label">Quick Sectors:</span>
                  <div className="quick-chips">
                    {QUICK_SECTORS.map(sec => (
                      <button
                        key={sec}
                        type="button"
                        className={`sector-chip ${locality.includes(sec) ? 'active' : ''}`}
                        onClick={() => setLocality(`${sec}, Chandigarh`)}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field-label">
                  <span>Description & Landmarks</span>
                  <textarea
                    required
                    minLength={10}
                    maxLength={1800}
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe exact spot, hazards, how long it has been broken, or nearest booth/house number."
                  />
                </label>
              </div>
            </div>
          </div>

          {error && <div className="form-error modal-error-banner">{error}</div>}

          <footer className="modal-foot">
            <div className="points-reward-pill">
              <Sparkles size={16} />
              <span>You earn <strong>+20 Civic Points</strong> for this report</span>
            </div>
            <div className="foot-actions">
              <button type="button" className="btn btn-quiet" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary btn-save" disabled={busy}>
                {busy ? 'Saving Report…' : 'Save & Prepare Filing'}
                <ArrowRight size={17} />
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}

function StatusModal({ issue, onClose, onSave }) {
  const [reference, setReference] = useState(issue.official_reference || '')
  const [busy, setBusy] = useState(false)

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal small-modal" role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <span className="eyebrow">STEP 2 · UPDATE TRACKER</span>
            <h2>Save Official Grievance Reference</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="modal-body-padded">
          <p className="modal-explainer">
            Once you submit your complaint on Chandigarh’s official Jansampark portal, enter your receipt / grievance number below.
            Civic AI links it to your dossier so you can enforce the Right to Service Act timeline.
          </p>

          <label className="field-label">
            <span>Official Grievance / Diary Number</span>
            <input
              autoFocus
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. CHD/2026/104829 or JAN-9218"
            />
          </label>

          <div className="portal-callout-note">
            <Globe2 size={18} />
            <div>
              <b>Independent citizen record</b>
              <p>Reference numbers are securely stored in your personal account to track future RTI escalations.</p>
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          <button className="btn btn-quiet" onClick={onClose}>
            Skip for now
          </button>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await onSave(reference)
              setBusy(false)
            }}
          >
            Mark as Officially Filed
            <Check size={17} />
          </button>
        </footer>
      </section>
    </div>
  )
}

function ComplaintModal({ issue, onClose, onFiled }) {
  const [draft, setDraft] = useState('Generating official complaint draft…')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/issues/${issue.id}/complaint`)
      .then(data => setDraft(data.draft))
      .catch(e => setError(e.message))
  }, [issue.id])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Clipboard permission denied. Please copy manually from the box below.')
    }
  }

  const copyAndOpen = async () => {
    await copy()
    const portal = window.open(SOURCES.grievance, '_blank', 'noopener,noreferrer')
    if (!portal) {
      setError('Pop-up was blocked. Click "Open Jansampark Portal" directly.')
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal rti-modal" role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <span className="eyebrow"><HeartHandshake size={14} /> CHANDIGARH JANSAMPARK GRIEVANCE</span>
            <h2>Formatted Complaint Draft</h2>
            <p className="modal-sub">Pre-formatted with exact locality details, departmental routing, and evidence description.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="modal-body-padded">
          <div className="helper-banner">
            <CheckCircle2 size={18} />
            <div>
              <b>Step 1: Copy draft ➔ Step 2: Paste in Jansampark portal</b>
              <p>Chandigarh Administration requires grievance submission on their official website. We have formulated your complaint ready to paste.</p>
            </div>
          </div>

          <div className="draft-container">
            <div className="draft-head">
              <span>Official Submission Text</span>
              <button className="btn-copy-small" onClick={copy}>
                <Copy size={14} /> {copied ? 'Copied to Clipboard!' : 'Copy Text'}
              </button>
            </div>
            <textarea className="formatted-draft-box" readOnly value={draft} />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="guidance-strip">
            <span>Official Portal: <strong>admser.chd.nic.in/jansampark</strong></span>
            <a href={SOURCES.how} target="_blank" rel="noreferrer">
              Official Grievance Guide <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <footer className="modal-foot">
          <button className="btn btn-outline" onClick={copy}>
            <Copy size={16} /> {copied ? 'Copied!' : 'Copy Draft'}
          </button>
          <div className="foot-actions">
            <button className="btn btn-primary" onClick={copyAndOpen}>
              Copy & Open Jansampark Portal
              <ArrowUpRight size={16} />
            </button>
          </div>
        </footer>

        {issue.status === 'reported' && (
          <div className="modal-foot-confirm">
            <span>Submitted already on the official site?</span>
            <button type="button" onClick={onFiled}>
              Save grievance reference number <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function RtiModal({ issue, onClose }) {
  const [draft, setDraft] = useState('Preparing statutory RTI draft…')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/issues/${issue.id}/rti`)
      .then(data => setDraft(data.draft))
      .catch(e => setError(e.message))
  }, [issue.id])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Clipboard permission denied. Please copy manually.')
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal rti-modal" role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <span className="eyebrow"><FileCheck2 size={14} /> RIGHT TO INFORMATION ACT, 2005</span>
            <h2>Statutory RTI Application (Form A)</h2>
            <p className="modal-sub">Use this if the grievance remains unattended past statutory Right to Service limits.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="modal-body-padded">
          <div className="helper-banner rti-banner">
            <FileText size={18} />
            <div>
              <b>Direct inquiries for accountability</b>
              <p>Asks for work orders, allocated municipal funds, inspected reports, and designated officer names for this exact spot.</p>
            </div>
          </div>

          <div className="draft-container">
            <div className="draft-head">
              <span>Form A Application Draft</span>
              <button className="btn-copy-small" onClick={copy}>
                <Copy size={14} /> {copied ? 'Copied!' : 'Copy Application'}
              </button>
            </div>
            <textarea className="formatted-draft-box" readOnly value={draft} />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="guidance-strip">
            <span>Prescribed fee: ₹10 via Court Fee Stamp or IPO payable to Chandigarh Administration</span>
            <a href={SOURCES.rtiInfo} target="_blank" rel="noreferrer">
              Chandigarh RTI Instructions <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <footer className="modal-foot">
          <button className="btn btn-outline" onClick={copy}>
            <Copy size={16} /> {copied ? 'Copied' : 'Copy Application'}
          </button>
          <a className="btn btn-primary" href={SOURCES.rtiOnline} target="_blank" rel="noreferrer">
            Submit on Central RTI Online Portal
            <ArrowUpRight size={16} />
          </a>
        </footer>
      </section>
    </div>
  )
}

function IssueDetail({ issue, onClose, onMarkFiled, onComplaint, onRti, tenders }) {
  const matches = useMemo(() => {
    const words = issue.title.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3)
    return tenders.filter(t =>
      words.some(w => t.title.toLowerCase().includes(w)) ||
      (issue.locality && t.title.toLowerCase().includes(issue.locality.toLowerCase()))
    ).slice(0, 3)
  }, [issue, tenders])

  const statusInfo = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported
  const catMeta = CATEGORIES.find(c => c.id === issue.category) || CATEGORIES[0]

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal detail-modal" role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <div className="detail-eyebrow-row">
              <span className="eyebrow">{issue.id} · RECORDED {fmtDate(issue.created_at)}</span>
              <span className={`status-pill ${statusInfo.tone}`}>
                <span className="dot" /> {statusInfo.label}
              </span>
            </div>
            <h2>{issue.title}</h2>
            <div className="detail-location-bar">
              <MapPin size={15} />
              <span>{issue.locality || 'Chandigarh'}</span>
              <span className="sep">•</span>
              <span>Category: <strong>{issue.category}</strong></span>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {/* 4-Stage Resolution Stepper */}
        <div className="resolution-stepper">
          {[
            { step: 1, label: 'Logged in Civic AI' },
            { step: 2, label: 'Filed with Jansampark' },
            { step: 3, label: 'Department Action' },
            { step: 4, label: 'Verified Resolved' },
          ].map(s => {
            const isCompleted = statusInfo.step >= s.step
            const isCurrent = statusInfo.step === s.step
            return (
              <div key={s.step} className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="step-circle">
                  {isCompleted ? <Check size={13} strokeWidth={3} /> : s.step}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
            )
          })}
        </div>

        <div className="detail-content">
          {/* Main Dossier Column */}
          <div className="detail-main">
            <div className="dossier-card">
              <h3>Citizen Description</h3>
              <p className="detail-description">{issue.description}</p>
            </div>

            <div className="dossier-card">
              <h3>Photo Evidence & EXIF Verification</h3>
              <div className="detail-photo-wrap">
                {issue.has_photo ? (
                  <img src={`${API_BASE}/issues/${issue.id}/photo`} alt="Issue evidence" />
                ) : (
                  <div className="photo-empty">
                    <UploadCloud size={32} />
                    <span>No photographic evidence attached</span>
                  </div>
                )}
              </div>
              <div className="meta-grid">
                <div>
                  <span className="meta-lbl">Locality / Sector</span>
                  <b className="meta-val"><MapPin size={15} /> {issue.locality || 'Chandigarh'}</b>
                </div>
                <div>
                  <span className="meta-lbl">EXIF Capture Check</span>
                  <b className={`meta-val freshness-${issue.photo_freshness}`}>
                    {issue.photo_freshness === 'recent' ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
                    {issue.photo_freshness === 'recent' ? 'Verified recent capture' : 'Standard capture'}
                  </b>
                </div>
              </div>
            </div>

            {/* Timeline history */}
            <div className="dossier-card">
              <h3>Dossier Activity Log</h3>
              <div className="timeline-track">
                {(issue.events || []).map((ev, i) => (
                  <div className="timeline-step-row" key={`${ev.created_at}-${i}`}>
                    <span className="timeline-bullet" />
                    <div className="timeline-step-content">
                      <b>{ev.note}</b>
                      <time>{fmtDate(ev.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                  </div>
                ))}
              </div>
              {issue.official_reference && (
                <div className="reference-badge-box">
                  <span className="ref-title">Official Government Reference:</span>
                  <strong className="ref-number">{issue.official_reference}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Action & Department Routing Sidebar */}
          <aside className="detail-aside">
            {/* Department Routing Card */}
            <div className="routing-sidebar-card">
              <span className="eyebrow">RESPONSIBLE CHANDIGARH DEPARTMENT</span>
              <div className="dept-highlight">
                <Wrench size={18} />
                <b>{issue.department || catMeta.dept}</b>
              </div>
              <p className="dept-note">
                Auto-assigned by Civic AI. Confirm with Jansampark during official filing.
              </p>
              {issue.service_target && (
                <div className="service-target-badge">
                  <Clock3 size={15} />
                  <span>RTS Standard: <strong>{issue.service_target}</strong></span>
                </div>
              )}
              {issue.department_source && (
                <a className="dept-source-link" href={issue.department_source} target="_blank" rel="noreferrer">
                  Official Service Charter <ArrowUpRight size={14} />
                </a>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="action-button-deck">
              <button className="btn btn-primary btn-full" onClick={onComplaint}>
                <FileText size={17} />
                <span>Prepare Jansampark Complaint</span>
                <ArrowRight size={16} />
              </button>

              <button className="btn btn-outline btn-full" onClick={onMarkFiled}>
                <Check size={16} />
                <span>Save Grievance Reference #</span>
              </button>

              <button className="btn btn-quiet btn-full" onClick={onRti}>
                <FileCheck2 size={16} />
                <span>Generate Statutory RTI Form A</span>
              </button>
            </div>

            {/* Matched Tenders Nearby */}
            {matches.length > 0 && (
              <div className="matched-tenders-box">
                <div className="match-head">
                  <WalletCards size={16} />
                  <b>Related Public Tenders Nearby</b>
                </div>
                <small>Public works recently announced near this locality</small>
                <div className="match-list">
                  {matches.map(t => (
                    <a key={t.reference} href={t.url} target="_blank" rel="noreferrer" className="matched-tender-link">
                      <b>{t.title}</b>
                      <div className="tender-sub">
                        <span>{t.reference}</span>
                        {t.amount != null && <strong className="tender-val">{inr(t.amount)}</strong>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}

function Sidebar({ page, setPage, user, onLogout, openReport, mobileOpen, setMobileOpen }) {
  const nav = [
    { id: 'overview', text: 'Civic Overview', icon: Activity },
    { id: 'reports', text: 'My Reports', icon: FileCheck2, count: user.reportCount },
    { id: 'spending', text: 'Public Tenders Radar', icon: WalletCards },
    { id: 'guide', text: 'Civic & RTI Guide', icon: CircleHelp },
  ]

  return (
    <>
      {mobileOpen && <div className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="side-brand-row">
          <Brand />
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* City Scope Pill */}
        <div className="city-status-badge">
          <span className="city-pin-icon"><MapPin size={16} /></span>
          <div className="city-info">
            <b>Chandigarh UT</b>
            <span>Jansampark & Tenders Live</span>
          </div>
          <span className="live-indicator" title="Connected to public portals" />
        </div>

        {/* Primary Action Button */}
        <button
          className="side-action-btn"
          onClick={() => { openReport(); setMobileOpen(false) }}
        >
          <span className="plus-icon-bubble"><Plus size={18} strokeWidth={2.4} /></span>
          <span>Report an Issue</span>
        </button>

        <div className="side-nav-group">
          <span className="side-group-label">WORKSPACE</span>
          <nav className="main-nav">
            {nav.map(item => {
              const Icon = item.icon
              const isActive = page === item.id
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => { setPage(item.id); setMobileOpen(false) }}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.text}</span>
                  {item.count > 0 && <span className="nav-badge">{item.count}</span>}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="side-nav-group">
          <span className="side-group-label">OFFICIAL PORTALS</span>
          <div className="side-portal-links">
            <a className="portal-quick-link" href={SOURCES.grievance} target="_blank" rel="noreferrer">
              <HeartHandshake size={16} />
              <span>Jansampark Portal</span>
              <ExternalLink size={13} className="ext-icon" />
            </a>
            <a className="portal-quick-link" href={SOURCES.tenders} target="_blank" rel="noreferrer">
              <Globe2 size={16} />
              <span>Chandigarh e-Tenders</span>
              <ExternalLink size={13} className="ext-icon" />
            </a>
          </div>
        </div>

        <div className="side-spacer" />

        {/* User Card at Bottom */}
        <div className="user-profile-widget">
          <div className="user-avatar-bubble">{initials(user.name)}</div>
          <div className="user-details">
            <b title={user.name}>{user.name}</b>
            <span>{user.points || 0} Civic Points</span>
          </div>
          <button className="icon-button logout-btn" onClick={onLogout} title="Sign Out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  )
}

function TenderCard({ tender, compact = false }) {
  return (
    <a
      className={`tender-card ${compact ? 'compact' : ''}`}
      href={tender.url || SOURCES.tenders}
      target="_blank"
      rel="noreferrer"
    >
      <div className="tender-icon-block">
        <WalletCards size={18} />
      </div>

      <div className="tender-center">
        <div className="tender-top-row">
          <span className="tender-ref-pill">{tender.reference || 'NICGEP'}</span>
          {tender.amount != null && (
            <span className="tender-cost-badge">{inr(tender.amount)}</span>
          )}
        </div>
        <h4 className="tender-title">{tender.title}</h4>
        {tender.authority_name && (
          <span className="tender-dept">
            Inviting Authority: <strong>{tender.authority_name}</strong>
          </span>
        )}
      </div>

      <div className="tender-right">
        <div className="closing-meta">
          <small>Closes</small>
          <b>{tender.closing_date || 'See Portal'}</b>
        </div>
        <span className="open-arrow-btn">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </a>
  )
}

function Dashboard({ user, issues, tenders, onReport, onOpenIssue, onPage }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const openCount = issues.filter(i => i.status !== 'resolved').length
  const resolvedCount = issues.filter(i => i.status === 'resolved').length

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return issues
    if (activeFilter === 'action') return issues.filter(i => i.status === 'reported')
    if (activeFilter === 'filed') return issues.filter(i => i.status === 'filed' || i.status === 'in_progress')
    if (activeFilter === 'resolved') return issues.filter(i => i.status === 'resolved')
    return issues
  }, [issues, activeFilter])

  return (
    <>
      {/* Top Banner / Welcome Row */}
      <section className="welcome-banner">
        <div className="welcome-headline">
          <div className="city-pulse-chip">
            <span className="pulse-dot" />
            <span>CHANDIGARH MUNICIPAL GRID ACTIVE · RTS ACT ENFORCED</span>
          </div>
          <h1>Good day, {user.name.split(' ')[0]}</h1>
          <p className="welcome-subtitle">
            Document civic issues, enforce municipal repair standards, and keep public infrastructure accountable.
          </p>
        </div>

        <div className="welcome-actions">
          <div className="today-date-badge">
            <CalendarDays size={16} />
            <span>{todayLabel()}</span>
          </div>
        </div>
      </section>

      {/* Hero Section with Chandigarh City Art & Contour Ripples */}
      <section className="hero-card">
        {/* Concentric ripple rings */}
        <div className="hero-ripples" aria-hidden="true">
          <span className="ripple r1" />
          <span className="ripple r2" />
          <span className="ripple r3" />
          <span className="ripple r4" />
        </div>

        <div className="hero-content">
          <span className="hero-kicker">
            <span className="tiny-flag"><i /><i /><i /></span>
            CITIZEN-POWERED. CHANDIGARH-FOCUSED.
          </span>
          <h2>Good cities start<br />with <em>people who care.</em></h2>
          <p>
            Spot an issue, send it to the right place, and keep a record of every step.
          </p>

          <div className="hero-cta-wrapper">
            <button className="hero-cta" onClick={() => onReport()}>
              <span>Start a report</span>
              <ArrowRight size={17} />
            </button>
            <div className="hero-category-pills">
              {CATEGORIES.slice(0, 3).map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    className="hero-cat-chip"
                    onClick={() => onReport(cat.id)}
                    title={`Start a report for ${cat.label}`}
                  >
                    <Icon size={13} />
                    <span>{cat.id}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Vector City Illustration from Reference */}
        <div className="hero-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-horizon" />
          <div className="building b1" />
          <div className="building b2" />
          <div className="building b3" />
          <div className="building b4" />
          <div className="building b5" />
          <div className="art-road" />
          <div className="art-tree t1"><i /><b /></div>
          <div className="art-tree t2"><i /><b /></div>
          <div className="art-tree t3"><i /><b /></div>
          <div className="art-person p1" />
          <div className="art-person p2" />
          <span className="art-label"><span /> YOUR CITY, IN VIEW</span>
        </div>
      </section>

      {/* Metrics Row: 4 Clear, Actionable Cards */}
      <section className="metrics-deck">
        <div className="metric-card" onClick={() => onPage('reports')}>
          <div className="metric-top">
            <span className="metric-label">My Reports</span>
            <span className="metric-icon-badge sage"><FileCheck2 size={18} /></span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{issues.length}</span>
            <span className="metric-sub">{issues.length === 1 ? 'total record' : 'total records'}</span>
          </div>
          <div className="metric-foot">
            <span className="status-indicator green" />
            <span>{resolvedCount} resolved so far</span>
          </div>
        </div>

        <div className="metric-card highlight-amber" onClick={() => setActiveFilter('action')}>
          <div className="metric-top">
            <span className="metric-label">Needs Follow-Up</span>
            <span className="metric-icon-badge amber"><Clock3 size={18} /></span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{openCount}</span>
            <span className="metric-sub">{openCount === 1 ? 'action pending' : 'actions pending'}</span>
          </div>
          <div className="metric-foot">
            <span className="status-indicator amber" />
            <span>Ready to file in Jansampark</span>
          </div>
        </div>

        <div className="metric-card points-card">
          <div className="metric-top">
            <span className="metric-label">Civic Karma Score</span>
            <span className="metric-icon-badge coral"><Award size={18} /></span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{user.points || 0}</span>
            <span className="metric-sub">points earned</span>
          </div>
          <div className="metric-foot">
            <Sparkles size={13} className="sparkle-icon" />
            <span>
              {(user.points || 0) >= 300
                ? 'Chandigarh Champion'
                : (user.points || 0) >= 100
                ? 'Neighbourhood Voice'
                : 'Sector Scout (Tier 1)'}
            </span>
          </div>
        </div>

        <div className="metric-card" onClick={() => onPage('spending')}>
          <div className="metric-top">
            <span className="metric-label">Live City Tenders</span>
            <span className="metric-icon-badge blue"><WalletCards size={18} /></span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{tenders.length}</span>
            <span className="metric-sub">public works tracked</span>
          </div>
          <div className="metric-foot">
            <span className="status-indicator blue" />
            <span>Chandigarh e-Procurement feed</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <section className="dashboard-columns">
        {/* Left Column: Recent Activity with Filter Tabs */}
        <div className="content-card activity-feed-card">
          <div className="card-header">
            <div>
              <span className="eyebrow">YOUR RECENT ACTIVITY</span>
              <h2>Tracked Civic Issues</h2>
            </div>
            <button className="btn-text-action" onClick={() => onPage('reports')}>
              View all reports <ArrowRight size={15} />
            </button>
          </div>

          {/* Quick Filter Tabs */}
          <div className="filter-pill-row">
            <button
              className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({issues.length})
            </button>
            <button
              className={`filter-pill ${activeFilter === 'action' ? 'active' : ''}`}
              onClick={() => setActiveFilter('action')}
            >
              Needs Filing ({issues.filter(i => i.status === 'reported').length})
            </button>
            <button
              className={`filter-pill ${activeFilter === 'filed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('filed')}
            >
              Filed ({issues.filter(i => i.status === 'filed' || i.status === 'in_progress').length})
            </button>
            <button
              className={`filter-pill ${activeFilter === 'resolved' ? 'active' : ''}`}
              onClick={() => setActiveFilter('resolved')}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-feed-box">
              <span className="empty-bubble"><FileCheck2 size={28} /></span>
              <h3>No issues in this filter</h3>
              <p>When you notice a problem in your sector, create a report to build your tracking record.</p>
              <button className="btn btn-primary" onClick={() => onReport()}>
                <Plus size={16} /> Create Report (+20 Pts)
              </button>
            </div>
          ) : (
            <div className="issue-feed-list">
              {filtered.slice(0, 5).map(issue => {
                const statusMeta = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported
                const catMeta = CATEGORIES.find(c => c.id === issue.category) || CATEGORIES[0]
                const Icon = catMeta.icon
                return (
                  <button
                    key={issue.id}
                    className="issue-row-item"
                    onClick={() => onOpenIssue(issue)}
                  >
                    <div className={`issue-cat-icon ${catMeta.tone}`}>
                      <Icon size={18} />
                    </div>
                    <div className="issue-row-meta">
                      <b>{issue.title}</b>
                      <div className="issue-sub-line">
                        <span className="locality-tag"><MapPin size={13} /> {issue.locality}</span>
                        <span className="dot-sep">•</span>
                        <span>{fmtDate(issue.created_at)}</span>
                      </div>
                    </div>
                    <span className={`status-pill ${statusMeta.tone}`}>
                      {statusMeta.label}
                    </span>
                    <ChevronRight size={17} className="chevron-icon" />
                  </button>
                )
              })}
            </div>
          )}

          <div className="card-footer-note">
            <ShieldCheck size={16} />
            <span>All reports are stored privately in your account. You decide when to submit them to government.</span>
          </div>
        </div>

        {/* Right Column: Civic Points & Tier Progression */}
        <div className="content-card progression-card">
          <div className="progression-head">
            <span className="metric-icon-badge coral"><Award size={20} /></span>
            <div>
              <span className="eyebrow">COMMUNITY REPUTATION</span>
              <h3>Civic Karma</h3>
            </div>
          </div>

          <p className="progression-desc">
            Earn civic points by documenting verified municipal issues in Chandigarh and following through to resolution.
          </p>

          <div className="karma-score-box">
            <span className="score-val">{user.points || 0}</span>
            <span className="score-lbl">CIVIC POINTS</span>
          </div>

          {/* Progress bar */}
          <div className="tier-progress-track">
            <div
              className="tier-progress-bar"
              style={{
                width: `${Math.min(100, Math.max(10, ((user.points || 0) / 300) * 100))}%`,
              }}
            />
          </div>

          <div className="tier-milestones">
            <div className="milestone-current">
              <span className="lbl">Current Badge:</span>
              <b>
                {(user.points || 0) >= 300
                  ? '🏅 Chandigarh Champion'
                  : (user.points || 0) >= 100
                  ? '🥈 Neighbourhood Voice'
                  : '🥉 Sector Scout'}
              </b>
            </div>
            <div className="milestone-next">
              <span className="lbl">Next Tier:</span>
              <span>
                {(user.points || 0) >= 300
                  ? 'Top Civic Rank Unlocked'
                  : (user.points || 0) >= 100
                  ? `${300 - (user.points || 0)} pts to Chandigarh Champion`
                  : `${100 - (user.points || 0)} pts to Neighbourhood Voice`}
              </span>
            </div>
          </div>

          {/* Quick Helplines Box */}
          <div className="helpline-quick-box">
            <span className="eyebrow">CHANDIGARH QUICK HELPLINES</span>
            <div className="helpline-row">
              <span>MCC Municipal Control Room</span>
              <a href={SOURCES.mccHelp}><Phone size={13} /> 0172-2787200</a>
            </div>
            <div className="helpline-row">
              <span>Electricity Breakdown</span>
              <a href={SOURCES.powerHelp}><Phone size={13} /> 0172-4639999</a>
            </div>
          </div>
        </div>
      </section>

      {/* Public Tenders Radar Strip */}
      <section className="content-card tenders-radar-card">
        <div className="card-header">
          <div>
            <div className="radar-live-indicator">
              <span className="live-dot" />
              <span className="eyebrow">PUBLIC MONEY & TENDER RADAR</span>
            </div>
            <h2>Active Chandigarh Public Works</h2>
          </div>
          <button className="btn-text-action" onClick={() => onPage('spending')}>
            Explore all {tenders.length} tenders <ArrowRight size={15} />
          </button>
        </div>

        <div className="tenders-feed-grid">
          {tenders.slice(0, 3).map(tender => (
            <TenderCard key={tender.reference} tender={tender} compact />
          ))}
        </div>
      </section>
    </>
  )
}

function ReportsPage({ issues, onReport, onOpenIssue }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return issues.filter(issue => {
      const matchFilter = filter === 'all' || issue.status === filter
      const matchSearch =
        search.trim() === '' ||
        `${issue.title} ${issue.locality} ${issue.category} ${issue.id}`
          .toLowerCase()
          .includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [issues, filter, search])

  return (
    <>
      <section className="page-intro-header">
        <div>
          <span className="eyebrow">YOUR CIVIC DOSSIERS</span>
          <h1>My Reports ({issues.length})</h1>
          <p className="intro-sub">
            Track each documented issue from photo evidence to official government resolution.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onReport()}>
          <Plus size={18} strokeWidth={2.4} />
          <span>New Civic Report</span>
        </button>
      </section>

      {/* Filter and Search Bar */}
      <div className="reports-filter-bar">
        <div className="search-field-box">
          <Search size={16} />
          <input
            placeholder="Search by title, sector, category or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="btn-clear-search" onClick={() => setSearch('')}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="filter-pill-row">
          <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({issues.length})
          </button>
          <button className={`filter-pill ${filter === 'reported' ? 'active' : ''}`} onClick={() => setFilter('reported')}>
            Drafted ({issues.filter(i => i.status === 'reported').length})
          </button>
          <button className={`filter-pill ${filter === 'filed' ? 'active' : ''}`} onClick={() => setFilter('filed')}>
            Filed with Govt ({issues.filter(i => i.status === 'filed').length})
          </button>
          <button className={`filter-pill ${filter === 'resolved' ? 'active' : ''}`} onClick={() => setFilter('resolved')}>
            Resolved ({issues.filter(i => i.status === 'resolved').length})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon-wrap"><FileCheck2 size={36} /></span>
          <h3>No reports matching your criteria</h3>
          <p>Document any infrastructure deficiency or hazard in your area to begin tracking.</p>
          <button className="btn btn-primary" onClick={() => onReport()}>
            <Plus size={16} /> Report an Issue
          </button>
        </div>
      ) : (
        <div className="reports-dossier-grid">
          {filtered.map(issue => {
            const statusInfo = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported
            const catMeta = CATEGORIES.find(c => c.id === issue.category) || CATEGORIES[0]
            const Icon = catMeta.icon

            return (
              <div
                key={issue.id}
                className="report-dossier-card"
                onClick={() => onOpenIssue(issue)}
              >
                <div className="dossier-top-meta">
                  <span className={`cat-tag ${catMeta.tone}`}>
                    <Icon size={14} /> {issue.category}
                  </span>
                  <span className={`status-pill ${statusInfo.tone}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <h3 className="dossier-title">{issue.title}</h3>
                <p className="dossier-desc">{issue.description}</p>

                <div className="dossier-foot">
                  <span className="foot-locality">
                    <MapPin size={14} /> {issue.locality || 'Chandigarh'}
                  </span>
                  <span className="foot-date">
                    {fmtDate(issue.created_at)}
                  </span>
                </div>

                {issue.official_reference && (
                  <div className="dossier-ref-tag">
                    <span>Govt Ref: <strong>{issue.official_reference}</strong></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="privacy-reassurance-banner">
        <ShieldCheck size={18} />
        <div>
          <b>Privacy Assurance</b>
          <p>Your reports and photos remain private in your personal Civic AI account until you decide to submit them to government portals.</p>
        </div>
      </div>
    </>
  )
}

function TendersPage({ tenders, tendersUpdated, onRefresh, refreshBusy }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return tenders
    const q = search.toLowerCase()
    return tenders.filter(t =>
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.reference && t.reference.toLowerCase().includes(q)) ||
      (t.authority_name && t.authority_name.toLowerCase().includes(q))
    )
  }, [tenders, search])

  return (
    <>
      <section className="page-intro-header">
        <div>
          <span className="eyebrow">TRANSPARENCY RADAR · CHANDIGARH</span>
          <h1>Public Tenders ({tenders.length})</h1>
          <p className="intro-sub">
            Real-time feed from Chandigarh Administration e-Procurement portal (etenders.chd.nic.in).
          </p>
        </div>
        <button className="btn btn-outline" onClick={onRefresh} disabled={refreshBusy}>
          <RefreshCw size={16} className={refreshBusy ? 'spin' : ''} />
          <span>{refreshBusy ? 'Refreshing Feed…' : 'Refresh Feed'}</span>
        </button>
      </section>

      {/* Information Callout */}
      <div className="tender-info-banner">
        <div className="banner-icon-circle"><WalletCards size={22} /></div>
        <div className="banner-text">
          <b>Auditing Public Infrastructure Budgets</b>
          <p>
            When a department advertises a public tender for road resurfacing, LED streetlights, or drainage,
            the estimated value is pulled directly from the official tender notice.
          </p>
        </div>
        <a className="btn-portal-link" href={SOURCES.tenders} target="_blank" rel="noreferrer">
          Official Portal <ArrowUpRight size={15} />
        </a>
      </div>

      {/* Search Input */}
      <div className="tenders-search-bar">
        <Search size={16} />
        <input
          placeholder="Search tenders by keyword, sector, or department (e.g. Sector 17, Road, Electricity)…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="btn-clear-search" onClick={() => setSearch('')}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Tenders List */}
      <div className="tenders-container-card">
        <div className="card-header">
          <div>
            <span className="eyebrow">OPEN PUBLIC PROCUREMENT</span>
            <h2>{filtered.length} Tenders Currently Displayed</h2>
          </div>
          <div className="feed-timestamp">
            <span className="live-dot" />
            <span>{tendersUpdated ? `Updated ${fmtDate(tendersUpdated, { hour: 'numeric', minute: '2-digit' })}` : 'Live Feed'}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state-card">
            <h3>No tenders match your search</h3>
            <p>Try searching for broader terms like "Road", "Sector", or "Repair".</p>
          </div>
        ) : (
          <div className="tender-cards-list">
            {filtered.map(tender => (
              <TenderCard key={tender.reference} tender={tender} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function GuidePage() {
  const steps = [
    {
      num: '01',
      title: 'Spot & Document Evidence',
      desc: 'Take a clear photograph of the defect. Note down landmarks or Sector numbers. Geotagged photos ensure the municipal team knows exactly where to go.',
      icon: Lightbulb,
      tone: 'amber',
      action: 'Create a report in Civic AI',
    },
    {
      num: '02',
      title: 'Submit on Jansampark Portal',
      desc: 'Chandigarh’s official grievance mechanism is Jansampark. Civic AI formats your complaint letter with all required fields so you can copy and submit in under 60 seconds.',
      icon: HeartHandshake,
      tone: 'teal',
      action: 'Open Jansampark Grievance',
      url: SOURCES.grievance,
    },
    {
      num: '03',
      title: 'Record Government Reference #',
      desc: 'After submitting, you will receive a diary/reference number. Save this in your Civic AI report dossier to establish a verifiable timeline.',
      icon: FileCheck2,
      tone: 'blue',
      action: 'Saved in your report tracker',
    },
    {
      num: '04',
      title: 'Enforce Right to Service (RTS)',
      desc: 'Under the Chandigarh Right to Service Act, streetlights must be fixed within 3 working days, and road repairs within 10 working days.',
      icon: Clock3,
      tone: 'sage',
      action: 'Read RTS Notification',
      url: SOURCES.service,
    },
    {
      num: '05',
      title: 'Escalate via Statutory RTI (Form A)',
      desc: 'If the department fails to resolve the issue within the RTS timeline, click "Generate RTI Application" in your dossier to demand work orders and officer accountability.',
      icon: FileText,
      tone: 'purple',
      action: 'Read RTI Guidelines',
      url: SOURCES.rtiInfo,
    },
  ]

  return (
    <>
      <section className="page-intro-header">
        <div>
          <span className="eyebrow">CITIZEN EMPOWERMENT ROADMAP</span>
          <h1>Civic & RTI Guide</h1>
          <p className="intro-sub">
            A practical, step-by-step framework to get municipal issues fixed in Chandigarh.
          </p>
        </div>
      </section>

      {/* Guide Steps Roadmap */}
      <div className="guide-roadmap-grid">
        {steps.map(step => {
          const Icon = step.icon
          return (
            <div key={step.num} className="guide-card">
              <div className="guide-card-head">
                <span className="step-badge">{step.num}</span>
                <span className={`guide-icon ${step.tone}`}><Icon size={20} /></span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <div className="guide-card-foot">
                {step.url ? (
                  <a href={step.url} target="_blank" rel="noreferrer" className="guide-link">
                    {step.action} <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <span className="guide-foot-text">
                    <CheckCircle2 size={14} /> {step.action}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Official Helplines Directory */}
      <div className="content-card helplines-card">
        <div className="card-header">
          <div>
            <span className="eyebrow">DIRECT CONTACTS</span>
            <h2>Chandigarh Emergency & Municipal Directory</h2>
          </div>
        </div>

        <div className="helpline-directory-grid">
          <div className="dir-item">
            <span className="dir-icon"><Phone size={18} /></span>
            <div>
              <b>MC Chandigarh Control Room</b>
              <span>Potholes, water leaks, sanitation</span>
            </div>
            <a href="tel:01722787200" className="dir-num">0172-2787200</a>
          </div>

          <div className="dir-item">
            <span className="dir-icon"><Lightbulb size={18} /></span>
            <div>
              <b>Electricity Department Faults</b>
              <span>Streetlights, phase breakdown</span>
            </div>
            <a href="tel:01724639999" className="dir-num">0172-4639999</a>
          </div>

          <div className="dir-item">
            <span className="dir-icon"><Globe2 size={18} /></span>
            <div>
              <b>Chandigarh Police Control Room</b>
              <span>Traffic & public emergencies</span>
            </div>
            <a href="tel:112" className="dir-num">112</a>
          </div>

          <div className="dir-item">
            <span className="dir-icon"><ShieldCheck size={18} /></span>
            <div>
              <b>Chandigarh RTS Commission</b>
              <span>Appeals against service delays</span>
            </div>
            <a href="https://chdrts.gov.in" target="_blank" rel="noreferrer" className="dir-num">chdrts.gov.in</a>
          </div>
        </div>
      </div>
    </>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [issues, setIssues] = useState([])
  const [tenderData, setTenderData] = useState({ items: [], fetched_at: null })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('overview')
  const [showReport, setShowReport] = useState(false)
  const [reportCategory, setReportCategory] = useState('')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [statusIssue, setStatusIssue] = useState(null)
  const [rtiIssue, setRtiIssue] = useState(null)
  const [complaintIssue, setComplaintIssue] = useState(null)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [refreshBusy, setRefreshBusy] = useState(false)
  const [topSearch, setTopSearch] = useState('')

  const refreshIssues = useCallback(async () => {
    const data = await api('/issues')
    setIssues(data.items || [])
    return data.items || []
  }, [])

  const refreshTenders = useCallback(async (force = false) => {
    const data = await api(`/tenders?limit=20${force ? '&refresh=true' : ''}`)
    setTenderData(data)
    return data
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([api('/auth/me'), api('/tenders?limit=20')])
      .then(async ([me, td]) => {
        if (!active) return
        setUser(me)
        setTenderData(td)
        const issueData = await api('/issues')
        if (active) setIssues(issueData.items || [])
      })
      .catch(err => {
        if (active && !String(err.message).includes('Please sign in')) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const onAuth = async nextUser => {
    setUser(nextUser)
    try {
      const [issueData, td] = await Promise.all([api('/issues'), api('/tenders?limit=20')])
      setIssues(issueData.items || [])
      setTenderData(td)
    } catch (e) {
      setError(e.message)
    }
  }

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setIssues([])
    }
  }

  const handleOpenReport = (category = '') => {
    setReportCategory(category)
    setShowReport(true)
  }

  const created = async issue => {
    setShowReport(false)
    setUser(u => ({ ...u, points: (u?.points || 0) + 20 }))
    await refreshIssues()
    setToast('Your report is saved. +20 Civic points awarded!')
    setSelectedIssue(issue)
  }

  const saveFiled = async reference => {
    const updated = await api(`/issues/${statusIssue.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'filed',
        official_reference: reference,
        note: 'Grievance officially submitted with Jansampark.',
      }),
    })
    await refreshIssues()
    setSelectedIssue(updated)
    setStatusIssue(null)
    setToast('Official Jansampark reference saved to your dossier')
  }

  const refreshAllTenders = async () => {
    setRefreshBusy(true)
    try {
      const data = await refreshTenders(true)
      setToast(`${data.items?.length || 0} Chandigarh tenders refreshed`)
    } catch (e) {
      setError(e.message)
    } finally {
      setRefreshBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <Brand />
        <span className="loading-pulse" />
        <span className="loading-caption">Connecting to Chandigarh Civic Network…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {error && (
          <div className="toast error-toast">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={15} /></button>
          </div>
        )}
        <AuthScreen onAuth={onAuth} />
      </>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        user={{ ...user, reportCount: issues.length }}
        onLogout={logout}
        openReport={() => handleOpenReport()}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-content">
        {/* Sticky Topbar */}
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Navigation"
          >
            <Menu size={22} />
          </button>

          <div className="topbar-left">
            <span className="topbar-breadcrumb">
              Civic AI Chandigarh <i>/</i> <b>{page === 'overview' ? 'Overview' : page === 'reports' ? 'My Reports' : page === 'spending' ? 'Public Tenders' : 'Civic Guide'}</b>
            </span>
          </div>

          <div className="topbar-actions">
            <div className="topbar-location-pill">
              <MapPin size={15} />
              <span>Chandigarh (UT)</span>
            </div>

            <button
              className="btn btn-primary topbar-new-btn"
              onClick={() => handleOpenReport()}
            >
              <Plus size={16} strokeWidth={2.4} />
              <span>Report Issue</span>
            </button>

            <button className="top-avatar-btn" title={user.email}>
              {initials(user.name)}
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="content-wrap">
          {error && (
            <div className="inline-error">
              <span>{error}</span>
              <button onClick={() => setError('')}><X size={16} /></button>
            </div>
          )}

          {page === 'overview' && (
            <Dashboard
              user={user}
              issues={issues}
              tenders={tenderData.items || []}
              onReport={handleOpenReport}
              onOpenIssue={setSelectedIssue}
              onPage={setPage}
            />
          )}

          {page === 'reports' && (
            <ReportsPage
              issues={issues}
              onReport={handleOpenReport}
              onOpenIssue={setSelectedIssue}
            />
          )}

          {page === 'spending' && (
            <TendersPage
              tenders={tenderData.items || []}
              tendersUpdated={tenderData.fetched_at}
              onRefresh={refreshAllTenders}
              refreshBusy={refreshBusy}
            />
          )}

          {page === 'guide' && <GuidePage />}

          <footer className="app-footer">
            <div className="footer-left">
              <Brand />
              <span>Independent resident civic intelligence · Not an official government department</span>
            </div>
            <div className="footer-right">
              <span>Public data synchronized with Jansampark & NICGEP e-Tenders</span>
            </div>
          </footer>
        </div>
      </main>

      {/* Modals */}
      {showReport && (
        <ReportModal
          initialCategory={reportCategory}
          onClose={() => setShowReport(false)}
          onCreated={created}
        />
      )}

      {selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onMarkFiled={() => {
            setStatusIssue(selectedIssue)
            setSelectedIssue(null)
          }}
          onComplaint={() => {
            setComplaintIssue(selectedIssue)
            setSelectedIssue(null)
          }}
          onRti={() => {
            setRtiIssue(selectedIssue)
            setSelectedIssue(null)
          }}
          tenders={tenderData.items || []}
        />
      )}

      {statusIssue && (
        <StatusModal
          issue={statusIssue}
          onClose={() => setStatusIssue(null)}
          onSave={saveFiled}
        />
      )}

      {rtiIssue && (
        <RtiModal
          issue={rtiIssue}
          onClose={() => setRtiIssue(null)}
        />
      )}

      {complaintIssue && (
        <ComplaintModal
          issue={complaintIssue}
          onClose={() => setComplaintIssue(null)}
          onFiled={() => {
            setStatusIssue(complaintIssue)
            setComplaintIssue(null)
          }}
        />
      )}

      {toast && (
        <div className="toast">
          <span className="toast-check"><Check size={16} /></span>
          <span>{toast}</span>
          <button onClick={() => setToast('')}><X size={15} /></button>
        </div>
      )}
    </div>
  )
}

export default App
