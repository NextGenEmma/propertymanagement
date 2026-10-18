import { useEffect, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Building2, CalendarDays, Check,
  ChevronDown, CircleHelp, ClipboardList, Copy, CreditCard, DoorOpen, Home,
  KeyRound, LayoutDashboard, LoaderCircle, LogOut, Menu, Plus, Search, ShieldCheck,
  Sparkles, Users, Wrench, X
} from 'lucide-react';
import { apiRequest, clearSession, saveSession } from './api.js';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'properties', label: 'Properties', icon: Building2 },
  { id: 'tenants', label: 'Tenants & leases', icon: Users },
  { id: 'rent', label: 'Rent ledger', icon: CreditCard },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench }
];

const emptyData = { tenants: [], payments: [], maintenance: [] };

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('propertyDeskUser') || 'null');
  } catch {
    return null;
  }
}

function money(amount = 0, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

function dateLabel(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function shortId(value = '') {
  return String(value).slice(-6).toUpperCase();
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NR';
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? 'login' : mode === 'managerInvite' ? 'accept-manager-invite' : 'register';
      const session = await apiRequest(`/api/auth/${endpoint}`, {
        method: 'POST', body: JSON.stringify(form)
      });
      onAuthenticated(session);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand brand-light"><span className="brand-mark"><Home size={17} /></span><span>FIELDNOTE <small>PROPERTY DESK</small></span></div>
        <div className="story-copy">
          <p className="eyebrow eyebrow-light">YOUR INDIA PORTFOLIO, IN VIEW</p>
          <h1>Home is closer<br />than the miles.</h1>
          <p className="story-description">Keep tenants, rent and on-the-ground work moving, wherever you happen to be.</p>
          <div className="story-stats"><div><strong>01</strong><span>One clear portfolio</span></div><div><strong>24/7</strong><span>Your view, on your time</span></div></div>
        </div>
        <div className="story-bottom"><span>Built for owners abroad</span><span>INR <span className="dot-separator">·</span> IST</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-topline"><span>FIELDNOTE / 01</span><span>SECURE OWNER ACCESS</span></div>
        <div className="auth-card">
          <div className="auth-icon"><KeyRound size={19} /></div>
          <p className="eyebrow">PORTFOLIO ACCESS</p>
          <h2>{mode === 'login' ? 'Welcome back.' : mode === 'managerInvite' ? 'Join a property.' : 'Set up your account.'}</h2>
          <p className="muted">{mode === 'login' ? 'Sign in to your property desk.' : mode === 'managerInvite' ? 'Accept your owner’s invitation to manage a property.' : 'Create an owner account to get started.'}</p>
          <form className="form-stack auth-form" onSubmit={submit}>
            {mode !== 'login' && <Field label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} placeholder="Your name" required />}
            <Field label="Email address" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="you@example.com" required />
            {mode === 'managerInvite' && <Field label="Invitation token" value={form.inviteToken || ''} onChange={(value) => setForm({ ...form, inviteToken: value })} placeholder="Paste the token from your property owner" required />}
            <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} placeholder={mode === 'login' ? 'Your password' : 'At least 8 characters'} minLength={mode === 'login' ? undefined : 8} required />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary button-full" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={17} /> : null}{mode === 'login' ? 'Sign in' : mode === 'managerInvite' ? 'Accept invitation' : 'Create owner account'}<ArrowRight size={16} />
            </button>
          </form>
          <p className="auth-switch">
            {mode === 'login' ? <>New to Fieldnote? <button onClick={() => { setMode('register'); setError(''); }}>Create an account</button><span className="auth-divider">·</span><button onClick={() => { setMode('managerInvite'); setError(''); }}>Accept manager invite</button></> : mode === 'register' ? <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button><span className="auth-divider">·</span><button onClick={() => { setMode('managerInvite'); setError(''); }}>Accept manager invite</button></> : <>Already accepted? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>}
          </p>
          <p className="auth-footnote"><ShieldCheck size={14} /> Your account is protected with encrypted sign-in.</p>
        </div>
        <div className="auth-legal">© 2026 FIELDNOTE <span>Privacy</span><span>Support</span></div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, required, min, max, minLength, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} min={min} max={max} minLength={minLength} />
      )}
    </label>
  );
}

function Metric({ label, value, note, icon: Icon, tone = 'green', trend }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{label}</span><span className={`metric-icon metric-${tone}`}><Icon size={17} /></span></div>
      <strong>{value}</strong>
      <div className="metric-note">{trend && <span className="trend-mark"><ArrowUpRight size={14} /></span>}{note}</div>
    </article>
  );
}

function Status({ value }) {
  const label = String(value || 'pending').replace('_', ' ');
  return <span className={`status status-${String(value || 'pending').replace('_', '-')}`}><i />{label}</span>;
}

function EmptyState({ icon: Icon, title, detail, action, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={21} /></span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action && <button className="button button-secondary" onClick={onAction}><Plus size={16} />{action}</button>}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('propertyDeskToken') || '');
  const [user, setUser] = useState(readStoredUser);
  const [activeSection, setActiveSection] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [records, setRecords] = useState(emptyData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState('');
  const [form, setForm] = useState({});
  const [inviteResult, setInviteResult] = useState(null);
  const [search, setSearch] = useState('');

  const selectedProperty = properties.find((property) => property._id === selectedId) || null;
  const ownerCanEdit = user?.role === 'owner';
  const sectionLabel = navigation.find((item) => item.id === activeSection)?.label || 'Overview';

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    setLoading(true);
    apiRequest('/api/properties', { token })
      .then((result) => {
        if (!active) return;
        const list = Array.isArray(result) ? result : [];
        setProperties(list);
        setSelectedId((current) => list.some((property) => property._id === current) ? current : list[0]?._id || '');
        setError('');
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, refreshKey]);

  useEffect(() => {
    if (!token || !selectedId) {
      setRecords(emptyData);
      return undefined;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      apiRequest(`/api/properties/${selectedId}/tenants`, { token }),
      apiRequest(`/api/properties/${selectedId}/rent-payments`, { token }),
      apiRequest(`/api/properties/${selectedId}/maintenance`, { token })
    ]).then(([tenants, payments, maintenance]) => {
      if (active) setRecords({ tenants, payments, maintenance });
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, selectedId, refreshKey]);

  function authenticate(session) {
    saveSession(session.token, session.user);
    setToken(session.token);
    setUser(session.user);
    setError('');
  }

  function signOut() {
    clearSession();
    setToken('');
    setUser(null);
    setProperties([]);
    setSelectedId('');
    setRecords(emptyData);
  }

  function showDialog(type) {
    setInviteResult(null);
    setError('');
    setForm({
      propertyType: 'apartment', currency: 'INR', priority: 'medium',
      leaseStart: '', leaseEnd: '', dueDate: '', period: new Date().toISOString().slice(0, 7),
      status: 'vacant'
    });
    setDialog(type);
  }

  function closeDialog() {
    setDialog('');
    setInviteResult(null);
    setError('');
  }

  async function submitDialog(event) {
    event.preventDefault();
    if (!selectedProperty && dialog !== 'property') return;
    setBusy(true);
    setError('');
    try {
      let result;
      if (dialog === 'property') {
        result = await apiRequest('/api/properties', { token, method: 'POST', body: JSON.stringify({
          name: form.name, propertyType: form.propertyType,
          address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, postalCode: form.postalCode, country: form.country || 'India' },
          monthlyRent: Number(form.monthlyRent || 0), currency: form.currency, notes: form.notes || ''
        }) });
        setSelectedId(result._id);
        setNotice('Property added to your portfolio.');
      } else if (dialog === 'tenant') {
        await apiRequest(`/api/properties/${selectedId}/tenants`, { token, method: 'POST', body: JSON.stringify({
          fullName: form.fullName, email: form.email || '', phone: form.phone,
          leaseStart: form.leaseStart, leaseEnd: form.leaseEnd,
          monthlyRent: Number(form.monthlyRent), securityDeposit: Number(form.securityDeposit || 0), currency: form.currency
        }) });
        setNotice('Tenant and lease saved.');
      } else if (dialog === 'rent') {
        await apiRequest(`/api/properties/${selectedId}/rent-payments`, { token, method: 'POST', body: JSON.stringify({
          tenantId: form.tenantId, period: form.period, amount: Number(form.amount), dueDate: form.dueDate, currency: form.currency
        }) });
        setNotice('Rent entry added to the ledger.');
      } else if (dialog === 'maintenance') {
        await apiRequest(`/api/properties/${selectedId}/maintenance`, { token, method: 'POST', body: JSON.stringify({
          title: form.title, description: form.description, priority: form.priority,
          cost: Number(form.cost || 0), currency: form.currency, vendorName: form.vendorName || ''
        }) });
        setNotice('Maintenance request created.');
      } else if (dialog === 'manager') {
        result = await apiRequest(`/api/properties/${selectedId}/managers`, { token, method: 'POST', body: JSON.stringify({ email: form.email }) });
        setInviteResult(result);
        setNotice('Manager invitation created.');
        setBusy(false);
        return;
      }

      setRefreshKey((value) => value + 1);
      closeDialog();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(paymentId) {
    try {
      await apiRequest(`/api/properties/${selectedId}/rent-payments/${paymentId}/paid`, {
        token, method: 'PATCH', body: JSON.stringify({})
      });
      setNotice('Rent payment marked as paid.');
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function updateMaintenance(request, status) {
    try {
      await apiRequest(`/api/properties/${selectedId}/maintenance/${request._id}`, {
        token, method: 'PATCH', body: JSON.stringify({ status })
      });
      setNotice('Maintenance status updated.');
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function copyInvite() {
    if (!inviteResult?.inviteToken) return;
    await navigator.clipboard.writeText(inviteResult.inviteToken);
    setNotice('Invitation token copied. Share it with the manager securely.');
  }

  if (!token) return <AuthScreen onAuthenticated={authenticate} />;

  const openMaintenance = records.maintenance.filter((item) => !['resolved', 'cancelled'].includes(item.status));
  const occupiedCount = properties.filter((property) => property.status === 'occupied').length;
  const expectedRent = properties.reduce((sum, property) => sum + Number(property.monthlyRent || 0), 0);
  const pendingRent = records.payments.filter((payment) => payment.status !== 'paid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const filteredProperties = properties.filter((property) => `${property.name} ${property.address?.city} ${property.address?.state}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); setActiveSection('overview'); }}>
          <span className="brand-mark"><Home size={17} /></span><span>FIELDNOTE<small>PROPERTY DESK</small></span>
        </a>
        <div className="portfolio-label"><span>YOUR PORTFOLIO</span><span className="portfolio-count">{String(properties.length).padStart(2, '0')}</span></div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${activeSection === id ? 'active' : ''}`} onClick={() => setActiveSection(id)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {id === 'maintenance' && openMaintenance.length > 0 && <span className="nav-count">{openMaintenance.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="timezone-card"><span className="timezone-icon"><CalendarDays size={15} /></span><div><span>INDIA TIME</span><strong>{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date())}</strong></div><span className="live-dot" /></div>
          <button className="help-link" onClick={() => setNotice('For account access or service questions, contact your portfolio administrator.')}><CircleHelp size={16} />Help & support</button>
          <button className="profile-row" onClick={signOut} title="Sign out"><span className="avatar">{initials(user?.fullName)}</span><span className="profile-copy"><strong>{user?.fullName || 'Property owner'}</strong><small>{user?.role === 'manager' ? 'Portfolio manager' : 'Owner account'}</small></span><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>PORTFOLIO</span><span>/</span><strong>{sectionLabel.toUpperCase()}</strong></div>
          <div className="top-actions">
            {properties.length > 0 && <label className="property-select-wrap"><Building2 size={15} /><select aria-label="Selected property" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">All properties</option>{properties.map((property) => <option key={property._id} value={property._id}>{property.name}</option>)}</select><ChevronDown size={14} /></label>}
            <span className="top-date">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date())}</span>
            <button className="icon-button notification-button" aria-label="Notifications" title="Notifications"><Bell size={18} /><i /></button>
            <button className="button button-primary top-add" onClick={() => showDialog('property')}><Plus size={16} />Add property</button>
          </div>
        </header>

        <div className="content-wrap">
          {error && <div className="notice notice-error" role="alert"><span>{error}</span><button className="icon-button" onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
          {notice && <div className="notice notice-success" role="status"><Check size={16} /><span>{notice}</span><button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
          {loading && <div className="loading-line"><LoaderCircle size={15} className="spin" /> Syncing your portfolio</div>}

          {activeSection === 'overview' && <Overview properties={properties} selectedProperty={selectedProperty} tenants={records.tenants} payments={records.payments} maintenance={records.maintenance} occupiedCount={occupiedCount} expectedRent={expectedRent} pendingRent={pendingRent} onNavigate={setActiveSection} onAddProperty={() => showDialog('property')} onAddMaintenance={() => showDialog('maintenance')} />}
          {activeSection === 'properties' && <PropertiesView properties={filteredProperties} selectedProperty={selectedProperty} search={search} setSearch={setSearch} onSelect={setSelectedId} onAdd={() => showDialog('property')} onInvite={() => showDialog('manager')} ownerCanEdit={ownerCanEdit} />}
          {activeSection === 'tenants' && <TenantsView property={selectedProperty} tenants={records.tenants} onAdd={() => showDialog('tenant')} />}
          {activeSection === 'rent' && <RentView property={selectedProperty} tenants={records.tenants} payments={records.payments} onAdd={() => showDialog('rent')} onMarkPaid={markPaid} />}
          {activeSection === 'maintenance' && <MaintenanceView property={selectedProperty} items={records.maintenance} onAdd={() => showDialog('maintenance')} onUpdate={updateMaintenance} />}
        </div>
        <footer className="main-footer"><span>FIELDNOTE <i>•</i> PRIVATE PROPERTY OPERATIONS</span><span>INR <i>•</i> ASIA/KOLKATA</span></footer>
      </main>

      {dialog && <Dialog type={dialog} form={form} setForm={setForm} busy={busy} error={error} result={inviteResult} tenants={records.tenants} onSubmit={submitDialog} onClose={closeDialog} onCopy={copyInvite} />}
      <MobileNav active={activeSection} onChange={setActiveSection} />
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, action, actionLabel, actionIcon: ActionIcon = Plus, onAction }) {
  return (
    <div className="page-heading">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>
      {action && <button className="button button-primary" onClick={onAction}><ActionIcon size={16} />{actionLabel}</button>}
    </div>
  );
}

function Overview({ properties, selectedProperty, tenants, payments, maintenance, occupiedCount, expectedRent, pendingRent, onNavigate, onAddProperty, onAddMaintenance }) {
  const recentMaintenance = maintenance.slice(0, 4);
  const latestPayments = payments.slice(0, 4);
  return (
    <>
      <PageHeading eyebrow="MONDAY, ON YOUR TERMS" title="Your portfolio, in view." subtitle="A clear read on the homes and work waiting back in India." action actionLabel="Add property" onAction={onAddProperty} />
      {properties.length === 0 ? <EmptyState icon={Home} title="Start with your first property" detail="Add a home in India to bring leases, rent and maintenance into one view." action="Add your first property" onAction={onAddProperty} /> : <>
        <section className="metrics-grid">
          <Metric label="TOTAL PROPERTIES" value={String(properties.length).padStart(2, '0')} note={`${occupiedCount} currently occupied`} icon={Building2} />
          <Metric label="EXPECTED MONTHLY RENT" value={money(expectedRent)} note="Across your portfolio" icon={CreditCard} tone="gold" trend />
          <Metric label="ACTIVE TENANTS" value={String(tenants.filter((tenant) => tenant.status === 'active').length).padStart(2, '0')} note="Current lease holders" icon={Users} tone="blue" />
          <Metric label="OPEN MAINTENANCE" value={String(maintenance.filter((item) => !['resolved', 'cancelled'].includes(item.status)).length).padStart(2, '0')} note="Requests to follow up" icon={Wrench} tone="coral" />
        </section>
        <section className="overview-grid">
          <div className="panel portfolio-panel">
            <div className="panel-heading"><div><p className="eyebrow">AT A GLANCE</p><h2>Property portfolio</h2></div><button className="text-button" onClick={() => onNavigate('properties')}>View all <ArrowRight size={15} /></button></div>
            <div className="portfolio-list">
              {properties.slice(0, 4).map((property, index) => <button className="portfolio-row" key={property._id} onClick={() => onNavigate('properties')}>
                <span className={`property-thumb thumb-${index % 4}`}><Building2 size={19} /></span>
                <span className="property-row-copy"><strong>{property.name}</strong><small>{property.address?.city}, {property.address?.state}</small></span>
                <span className="property-row-rent"><strong>{money(property.monthlyRent, property.currency)}</strong><small>per month</small></span>
                <Status value={property.status} /><ArrowRight className="row-arrow" size={16} />
              </button>)}
            </div>
            {properties.length > 4 && <button className="list-footer" onClick={() => onNavigate('properties')}>See all {properties.length} properties <ArrowRight size={14} /></button>}
          </div>
          <div className="panel rent-summary-panel">
            <div className="panel-heading"><div><p className="eyebrow">THIS PROPERTY</p><h2>{selectedProperty?.name || 'Portfolio rent'}</h2></div><span className="round-icon"><CreditCard size={17} /></span></div>
            <p className="summary-caption">Outstanding rent entries</p>
            <div className="rent-total">{money(pendingRent, selectedProperty?.currency || 'INR')}</div>
            <div className="rent-meter"><span style={{ width: `${payments.length ? Math.max(8, ((payments.length - payments.filter((item) => item.status !== 'paid').length) / payments.length) * 100) : 8}%` }} /></div>
            <div className="rent-meter-labels"><span>{payments.filter((item) => item.status === 'paid').length} paid</span><span>{payments.filter((item) => item.status !== 'paid').length} pending</span></div>
            <button className="button button-secondary button-full" onClick={() => onNavigate('rent')}>Open rent ledger <ArrowRight size={15} /></button>
          </div>
        </section>
        <section className="lower-grid">
          <div className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Rent ledger</h2></div><button className="text-button" onClick={() => onNavigate('rent')}>Full ledger <ArrowRight size={15} /></button></div>
            {latestPayments.length ? <div className="mini-list">{latestPayments.map((payment) => <div className="mini-row" key={payment._id}><span className="activity-icon paid-icon"><CreditCard size={16} /></span><span className="mini-copy"><strong>{payment.tenant?.fullName || `Tenant ${shortId(payment.tenant)}`}</strong><small>{payment.period} <i>•</i> due {dateLabel(payment.dueDate)}</small></span><span className="mini-amount">{money(payment.amount, payment.currency)}</span><Status value={payment.status} /></div>)}</div> : <div className="inline-empty">No rent entries yet. <button onClick={() => onNavigate('rent')}>Open ledger</button></div>}
          </div>
          <div className="panel maintenance-panel"><div className="panel-heading"><div><p className="eyebrow">ON THE GROUND</p><h2>Maintenance</h2></div><button className="icon-button" onClick={onAddMaintenance} aria-label="Add maintenance request"><Plus size={17} /></button></div>
            {recentMaintenance.length ? <div className="mini-list">{recentMaintenance.map((item) => <div className="maintenance-row" key={item._id}><span className={`priority-marker priority-${item.priority || 'medium'}`} /><span className="mini-copy"><strong>{item.title}</strong><small>{item.vendorName || 'Vendor not assigned'} <i>•</i> {dateLabel(item.createdAt)}</small></span><Status value={item.status} /></div>)}</div> : <div className="small-empty"><Wrench size={18} /><span>No active requests</span><button onClick={onAddMaintenance}>Log a repair</button></div>}
            <button className="list-footer" onClick={() => onNavigate('maintenance')}>Maintenance board <ArrowRight size={14} /></button>
          </div>
        </section>
        <div className="dashboard-note"><span className="note-icon"><Sparkles size={16} /></span><span><strong>Designed for distance.</strong> Your portfolio is shown in Indian rupees and local property time.</span><span className="note-time">IST · {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())}</span></div>
      </>}
    </>
  );
}

function PropertiesView({ properties, selectedProperty, search, setSearch, onSelect, onAdd, onInvite, ownerCanEdit }) {
  return (
    <>
      <PageHeading eyebrow="YOUR INDIA HOMES" title="Properties" subtitle="A single view of every place you call yours." action actionLabel="Add property" onAction={onAdd} />
      {properties.length === 0 ? <EmptyState icon={Building2} title="No matching properties" detail="Add a property or try a different search." action="Add property" onAction={onAdd} /> : <div className="properties-layout">
        <section className="panel properties-list-panel">
          <div className="search-field"><Search size={16} /><input aria-label="Search properties" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search homes or cities" /></div>
          <div className="property-select-list">{properties.map((property, index) => <button key={property._id} className={`property-select-row ${selectedProperty?._id === property._id ? 'selected' : ''}`} onClick={() => onSelect(property._id)}><span className={`property-thumb thumb-${index % 4}`}><Building2 size={19} /></span><span className="property-row-copy"><strong>{property.name}</strong><small>{property.address?.city}, {property.address?.state}</small></span><Status value={property.status} /></button>)}</div>
        </section>
        {selectedProperty && <section className="panel property-detail-panel">
          <div className="detail-banner"><div><span className="detail-type">{String(selectedProperty.propertyType || 'property').toUpperCase()}</span><h2>{selectedProperty.name}</h2><p>{selectedProperty.address?.line1}{selectedProperty.address?.line2 ? `, ${selectedProperty.address.line2}` : ''}</p><p>{selectedProperty.address?.city}, {selectedProperty.address?.state} {selectedProperty.address?.postalCode}</p></div><Status value={selectedProperty.status} /></div>
          <div className="detail-facts"><div><span>MONTHLY RENT</span><strong>{money(selectedProperty.monthlyRent, selectedProperty.currency)}</strong></div><div><span>LOCAL TIMEZONE</span><strong>{selectedProperty.timezone || 'Asia/Kolkata'}</strong></div><div><span>PROPERTY ID</span><strong>#{shortId(selectedProperty._id)}</strong></div></div>
          {selectedProperty.notes && <div className="property-notes"><span>OWNER NOTES</span><p>{selectedProperty.notes}</p></div>}
          <div className="detail-actions"><button className="button button-secondary" onClick={() => onSelect(selectedProperty._id)}>Refresh details</button>{ownerCanEdit && <button className="button button-primary" onClick={onInvite}><Users size={16} />Invite a manager</button>}</div>
        </section>}
      </div>}
    </>
  );
}

function TenantsView({ property, tenants, onAdd }) {
  return <>
    <PageHeading eyebrow="PEOPLE & AGREEMENTS" title="Tenants & leases" subtitle={property ? `Lease records for ${property.name}.` : 'Choose a property to view its tenants.'} action={Boolean(property)} actionLabel="Add tenant" onAction={onAdd} />
    {!property ? <EmptyState icon={Building2} title="Select a property first" detail="Choose a property from the selector above to view its leases." /> : tenants.length === 0 ? <EmptyState icon={Users} title="No tenants on file" detail="Add a tenant and lease to keep occupancy details close at hand." action="Add tenant" onAction={onAdd} /> : <div className="panel table-panel full-table"><div className="table-scroll"><table><thead><tr><th>TENANT</th><th>LEASE PERIOD</th><th>MONTHLY RENT</th><th>DEPOSIT</th><th>STATUS</th></tr></thead><tbody>{tenants.map((tenant) => <tr key={tenant._id}><td><div className="table-person"><span className="avatar avatar-small">{initials(tenant.fullName)}</span><span><strong>{tenant.fullName}</strong><small>{tenant.email || tenant.phone}</small></span></div></td><td>{dateLabel(tenant.leaseStart)} <span className="date-separator">to</span> {dateLabel(tenant.leaseEnd)}</td><td className="table-money">{money(tenant.monthlyRent, tenant.currency)}</td><td>{money(tenant.securityDeposit, tenant.currency)}</td><td><Status value={tenant.status} /></td></tr>)}</tbody></table></div></div>}
  </>;
}

function RentView({ property, tenants, payments, onAdd, onMarkPaid }) {
  const paidTotal = payments.filter((payment) => payment.status === 'paid').reduce((sum, item) => sum + Number(item.amount), 0);
  const pendingTotal = payments.filter((payment) => payment.status !== 'paid').reduce((sum, item) => sum + Number(item.amount), 0);
  return <>
    <PageHeading eyebrow="INCOME TRACKING" title="Rent ledger" subtitle={property ? `Monthly collections for ${property.name}.` : 'Choose a property to review rent.'} action={Boolean(property && tenants.some((tenant) => tenant.status === 'active'))} actionLabel="Record rent" onAction={onAdd} />
    {!property ? <EmptyState icon={Building2} title="Select a property first" detail="Choose a property from the selector above to open its rent ledger." /> : <>
      <div className="ledger-summary"><div className="ledger-card ledger-paid"><span>RECORDED AS PAID</span><strong>{money(paidTotal, property.currency)}</strong><small>{payments.filter((item) => item.status === 'paid').length} entries</small></div><div className="ledger-card ledger-pending"><span>AWAITING PAYMENT</span><strong>{money(pendingTotal, property.currency)}</strong><small>{payments.filter((item) => item.status !== 'paid').length} entries</small></div><div className="ledger-card ledger-rate"><span>DEFAULT CURRENCY</span><strong>{property.currency || 'INR'}</strong><small>Property rent ledger</small></div></div>
      {payments.length === 0 ? <EmptyState icon={CreditCard} title="No rent entries yet" detail="Add a monthly rent record for an active tenant." action={tenants.some((item) => item.status === 'active') ? 'Record rent' : undefined} onAction={onAdd} /> : <div className="panel table-panel full-table"><div className="table-scroll"><table><thead><tr><th>PERIOD</th><th>TENANT</th><th>DUE DATE</th><th>AMOUNT</th><th>STATUS</th><th></th></tr></thead><tbody>{payments.map((payment) => <tr key={payment._id}><td className="period-cell">{payment.period}</td><td>{payment.tenant?.fullName || `Tenant ${shortId(payment.tenant)}`}</td><td>{dateLabel(payment.dueDate)}</td><td className="table-money">{money(payment.amount, payment.currency)}</td><td><Status value={payment.status} /></td><td>{payment.status !== 'paid' && <button className="table-action" onClick={() => onMarkPaid(payment._id)}><Check size={14} />Mark paid</button>}</td></tr>)}</tbody></table></div></div>}
    </>}
  </>;
}

function MaintenanceView({ property, items, onAdd, onUpdate }) {
  const openItems = items.filter((item) => !['resolved', 'cancelled'].includes(item.status));
  return <>
    <PageHeading eyebrow="LOCAL FOLLOW-THROUGH" title="Maintenance" subtitle={property ? `Repairs and vendors for ${property.name}.` : 'Choose a property to review requests.'} action={Boolean(property)} actionLabel="Log a request" onAction={onAdd} />
    {!property ? <EmptyState icon={Building2} title="Select a property first" detail="Choose a property from the selector above to view maintenance." /> : items.length === 0 ? <EmptyState icon={Wrench} title="Nothing on the board" detail="Log a request when a repair or inspection needs attention." action="Log a request" onAction={onAdd} /> : <>
      <div className="maintenance-board-heading"><span>{openItems.length} OPEN REQUEST{openItems.length === 1 ? '' : 'S'}</span><span>LOCAL CURRENCY · {property.currency || 'INR'}</span></div>
      <div className="maintenance-board">{items.map((item) => <article className="maintenance-card" key={item._id}><div className="maintenance-card-top"><span className={`priority-pill priority-pill-${item.priority || 'medium'}`}><i />{item.priority || 'medium'} priority</span><Status value={item.status} /></div><h3>{item.title}</h3><p className="maintenance-description">{item.description}</p><div className="maintenance-card-meta"><span><CalendarDays size={14} />{dateLabel(item.createdAt)}</span><span><Wrench size={14} />{item.vendorName || 'Vendor not assigned'}</span></div><div className="maintenance-card-bottom"><strong>{money(item.cost, item.currency)}</strong>{item.status !== 'resolved' && item.status !== 'cancelled' && <select aria-label={`Update ${item.title} status`} value={item.status} onChange={(event) => onUpdate(item, event.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="cancelled">Cancelled</option></select>}</div></article>)}</div>
    </>}
  </>;
}

function Dialog({ type, form, setForm, busy, error, result, tenants, onSubmit, onClose, onCopy }) {
  const titles = { property: 'Add a property', tenant: 'Add a tenant', rent: 'Record monthly rent', maintenance: 'Log maintenance', manager: 'Invite a property manager' };
  const subtitles = { property: 'Add a home to your India portfolio.', tenant: 'Keep lease and contact details together.', rent: 'Add a rent due entry to the property ledger.', maintenance: 'Give your local team a clear next action.', manager: 'Create a secure, expiring invitation for this home.' };
  function change(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  const set = (key) => (value) => change(key, value);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="modal-heading"><div><p className="eyebrow">PORTFOLIO ACTION</p><h2 id="dialog-title">{titles[type]}</h2><p>{subtitles[type]}</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        {result?.inviteToken ? <div className="invite-result"><span className="invite-success"><Check size={16} /> Invitation created for {result.email}</span><label>ONE-TIME INVITATION TOKEN</label><code>{result.inviteToken}</code><button className="button button-secondary button-full" onClick={onCopy}><Copy size={15} />Copy token</button><p>Share this token securely. It expires {dateLabel(result.expiresAt)} and is only usable once.</p><button className="button button-primary button-full" onClick={onClose}>Done</button></div> : <form className="form-stack modal-form" onSubmit={onSubmit}>
          {type === 'property' && <>
            <Field label="Property name" value={form.name || ''} onChange={set('name')} placeholder="e.g. Chennai Apartment" required />
            <Field label="Property type" value={form.propertyType} onChange={set('propertyType')} options={[{ value: 'apartment', label: 'Apartment' }, { value: 'house', label: 'House' }, { value: 'commercial', label: 'Commercial' }, { value: 'land', label: 'Land' }, { value: 'other', label: 'Other' }]} />
            <Field label="Address line 1" value={form.line1 || ''} onChange={set('line1')} placeholder="Street and building" required />
            <Field label="Address line 2" value={form.line2 || ''} onChange={set('line2')} placeholder="Unit, floor (optional)" />
            <div className="form-grid"><Field label="City" value={form.city || ''} onChange={set('city')} required /><Field label="State" value={form.state || ''} onChange={set('state')} required /></div>
            <div className="form-grid"><Field label="Postal code" value={form.postalCode || ''} onChange={set('postalCode')} required /><Field label="Monthly rent" type="number" min="0" value={form.monthlyRent || ''} onChange={set('monthlyRent')} required /></div>
          </>}
          {type === 'tenant' && <>
            <Field label="Tenant full name" value={form.fullName || ''} onChange={set('fullName')} required />
            <div className="form-grid"><Field label="Email" type="email" value={form.email || ''} onChange={set('email')} /><Field label="Phone" type="tel" value={form.phone || ''} onChange={set('phone')} required /></div>
            <div className="form-grid"><Field label="Lease starts" type="date" value={form.leaseStart} onChange={set('leaseStart')} required /><Field label="Lease ends" type="date" value={form.leaseEnd} onChange={set('leaseEnd')} required /></div>
            <div className="form-grid"><Field label="Monthly rent" type="number" min="0" value={form.monthlyRent || ''} onChange={set('monthlyRent')} required /><Field label="Security deposit" type="number" min="0" value={form.securityDeposit || ''} onChange={set('securityDeposit')} /></div>
          </>}
          {type === 'rent' && <>
            <Field label="Tenant" value={form.tenantId || ''} onChange={set('tenantId')} required options={tenants.filter((tenant) => tenant.status === 'active').map((tenant) => ({ value: tenant._id, label: tenant.fullName }))} />
            <div className="form-grid"><Field label="Rent month" type="month" value={form.period} onChange={set('period')} required /><Field label="Due date" type="date" value={form.dueDate} onChange={set('dueDate')} required /></div>
            <Field label="Amount (INR)" type="number" min="0.01" value={form.amount || ''} onChange={set('amount')} required />
          </>}
          {type === 'maintenance' && <>
            <Field label="Request title" value={form.title || ''} onChange={set('title')} placeholder="e.g. Kitchen tap leak" required />
            <label className="field"><span>Description</span><textarea rows="3" value={form.description || ''} onChange={(event) => change('description', event.target.value)} placeholder="What needs attention?" required /></label>
            <div className="form-grid"><Field label="Priority" value={form.priority} onChange={set('priority')} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} /><Field label="Estimated cost (INR)" type="number" min="0" value={form.cost || ''} onChange={set('cost')} /></div>
            <Field label="Vendor name" value={form.vendorName || ''} onChange={set('vendorName')} placeholder="Optional" />
          </>}
          {type === 'manager' && <Field label="Manager email address" type="email" value={form.email || ''} onChange={set('email')} placeholder="manager@example.com" required />}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{type === 'manager' ? 'Create invitation' : type === 'property' ? 'Save property' : type === 'tenant' ? 'Save lease' : type === 'rent' ? 'Add to ledger' : 'Create request'}</button></div>
        </form>}
      </section>
    </div>
  );
}

function MobileNav({ active, onChange }) {
  return <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)}><Icon size={18} /><span>{label.split(' ')[0]}</span></button>)}</nav>;
}

export default App;