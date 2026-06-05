
function slug(n) { return (n||'app').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function camel(n) { return n.charAt(0).toLowerCase()+n.slice(1); }
function plural(n) { return n.endsWith('s')||n.endsWith('x')||n.endsWith('z')?n+'es':n.endsWith('y')?n.slice(0,-1)+'ies':n+'s'; }
function toSnake(n) { return n.replace(/([A-Z])/g,'_$1').toLowerCase().replace(/^_/,'').replace(/\s+/g,'_'); }

const SYS = new Set(['id','tenantId','createdAt','updatedAt','tenant_id','created_at','updated_at']);
const displayFields = e => e.fields.filter(f=>!SYS.has(f.name)&&!f.isRelation);
const formFields    = e => e.fields.filter(f=>!SYS.has(f.name)&&!f.isPrimary&&!f.isRelation);
function primaryLabel(e) {
  return e.fields.find(f=>['name','title','email','username','label','fullName','firstName','subject','heading'].includes(f.name))?.name||e.fields[1]?.name||'id';
}
function secondaryLabel(e) {
  return e.fields.find(f=>['company','organization','email','subtitle','description','category'].includes(f.name))?.name||null;
}
function statusField(e) {
  return e.fields.find(f=>['status','stage','state','type','priority','category'].includes(f.name));
}
function amountField(e) {
  return e.fields.find(f=>['amount','value','price','revenue','total','salary','budget','cost'].includes(f.name));
}

function statusColor(val) {
  const v = (val||'').toLowerCase();
  if (['active','open','won','completed','approved','published','done','enabled'].includes(v)) return 'emerald';
  if (['lead','prospect','pending','review','draft','scheduled'].includes(v)) return 'blue';
  if (['inactive','closed','lost','cancelled','archived','disabled','expired'].includes(v)) return 'slate';
  if (['negotiation','in_progress','processing','interviewing'].includes(v)) return 'violet';
  if (['urgent','overdue','blocked','rejected','failed'].includes(v)) return 'red';
  if (['warning','on_hold','paused','deferred'].includes(v)) return 'amber';
  return 'indigo';
}

function genSeedData(entity) {
  const label = primaryLabel(entity);
  const second = secondaryLabel(entity);
  const status = statusField(entity);
  const amount = amountField(entity);
  const df = displayFields(entity);

  const namesets = {
    customer:   [['Sarah Chen','Marcus Johnson','Emily Rodriguez','James O\'Brien','Aisha Patel'],['TechVault Inc.','Greenleaf Co.','BrightPath Solutions','NorthStar Dev','Luminary AI']],
    contact:    [['Sarah Chen','Marcus Johnson','Emily Rodriguez','James O\'Brien','Aisha Patel'],['TechVault Inc.','Greenleaf Co.','BrightPath Solutions','NorthStar Dev','Luminary AI']],
    deal:       [['Enterprise Platform License','Pro Suite Renewal','Implementation Services','Consulting Package','Annual Subscription'],['Sarah Chen','Marcus Johnson','Emily Rodriguez','James O\'Brien','Aisha Patel']],
    employee:   [['Jordan Lee','Maya Patel','Alex Rivera','Sam Kim','Taylor Brooks'],['Engineering','Product','Design','Sales','Marketing']],
    user:       [['Alice Wang','Bob Smith','Carol Jones','Dan Park','Eve Miller'],['Admin','Manager','Viewer','Editor','Owner']],
    product:    [['Premium Widget','Starter Pack','Enterprise Suite','Basic Plan','Pro Bundle'],[null]],
    order:      [['ORD-2024-001','ORD-2024-002','ORD-2024-003','ORD-2024-004','ORD-2024-005'],[null]],
    task:       [['Design new landing page','Fix authentication bug','Write Q4 report','Review pull requests','Update documentation'],['Sarah Chen','Marcus Johnson','Emily Rodriguez','James O\'Brien','Aisha Patel']],
    project:    [['Website Redesign','Mobile App v2','Data Migration','API Integration','Brand Refresh'],['Sarah Chen','Marcus Johnson','Emily Rodriguez','James O\'Brien','Aisha Patel']],
    issue:      [['Login fails on Safari','Dashboard slow loading','Missing export button','Email not sending','Payment gateway error'],['Bug','Enhancement','Feature','Support','Bug']],
    ticket:     [['Account setup assistance','Billing inquiry','Feature request','Technical issue','Password reset'],['High','Medium','Low','Critical','Low']],
    candidate:  [['Sarah Chen','Marcus Johnson','Emily Rodriguez','James O\'Brien','Aisha Patel'],['Engineering','Product','Design','Sales','Marketing']],
    application:[['Sarah Chen - Senior Dev','Marcus - Product Lead','Emily - UX Designer','James - Backend Eng','Aisha - Data Sci'],['Engineering','Product','Design','Engineering','Data']],
    invoice:    [['INV-2024-001','INV-2024-002','INV-2024-003','INV-2024-004','INV-2024-005'],[null]],
    item:       [['MacBook Pro 16"','Standing Desk','Ergonomic Chair','Monitor 4K','Webcam HD'],[null]],
    asset:      [['MacBook Pro 16"','Standing Desk','Ergonomic Chair','Monitor 4K','Webcam HD'],['IT','Facilities','IT','IT','IT']],
  };

  const entityKey = entity.name.toLowerCase();
  const names = namesets[entityKey]?.[0] || ['Alpha','Beta','Gamma','Delta','Epsilon'];
  const seconds = namesets[entityKey]?.[1] || [null,null,null,null,null];
  const statuses = status?.enumValues || ['Active','Lead','Inactive','Active','Lead'];
  const amounts  = [48000,27500,15000,82000,34500];
  const emails   = ['sarah@techvault.io','marcus@greenleaf.co','emily@brightpath.com','james@northstar.dev','aisha@luminary.ai'];
  const phones   = ['+1 415-555-0142','+1 212-555-0198','+1 310-555-0167','+1 617-555-0123','+1 512-555-0199'];

  return names.map((name,i) => {
    const rec = { id: `seed_${i+1}`, tenantId: 'tenant_local', createdAt: new Date(Date.now()-i*86400000*3).toISOString(), updatedAt: new Date().toISOString() };
    if (df.some(f=>f.name===label)) rec[label] = name;
    if (second && df.some(f=>f.name===second)) rec[second] = seconds[i]||null;
    if (status) rec[status.name] = statuses[i%statuses.length];
    if (amount) rec[amount.name] = amounts[i];
    df.filter(f=>f.name!==label&&f.name!==second&&f.name!==status?.name&&f.name!==amount?.name).forEach(f=>{
      if (f.name.toLowerCase().includes('email'))        rec[f.name] = emails[i];
      else if (f.name.toLowerCase().includes('phone'))   rec[f.name] = phones[i];
      else if (f.name==='firstName')                     rec[f.name] = name.split(' ')[0];
      else if (f.name==='lastName')                      rec[f.name] = name.split(' ')[1]||'';
      else if (f.type==='boolean')                       rec[f.name] = i%2===0;
      else if (f.type==='integer'||f.type==='float')     rec[f.name] = [1,2,3,5,4][i];
      else if (f.type==='date')                          rec[f.name] = new Date(Date.now()+i*86400000*7).toISOString().split('T')[0];
      else                                               rec[f.name] = null;
    });
    return rec;
  });
}

function genPackageJson(appName) {
  return JSON.stringify({
    name: slug(appName), version: '1.0.0', private: true, type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: {
      'react': '^18.3.1', 'react-dom': '^18.3.1',
      'react-router-dom': '^6.22.0', 'lucide-react': '^0.344.0',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.2.1', 'autoprefixer': '^10.4.17',
      'postcss': '^8.4.35', 'tailwindcss': '^3.4.1', 'vite': '^5.1.4',
    },
  }, null, 2);
}

function genViteConfig() {
  return `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`;
}
function genTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */\nexport default {\n  darkMode: 'class',\n  content: ['./index.html','./src/**/*.{js,jsx}'],\n  theme: { extend: {\n    colors: {\n      brand: { DEFAULT:'#4f46e5', hover:'#4338ca', light:'#ede9fe', dark:'#3730a3' }\n    }\n  }},\n  plugins: [],\n}\n`;
}
function genPostcssConfig() {
  return `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\n`;
}

function genIndexHtml(appName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${appName}</title>
</head>
<body class="antialiased">
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`;
}

function genIndexCss(appName) {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  body { @apply bg-slate-50 text-slate-900; }
  .dark body { @apply bg-slate-950 text-slate-100; }
}

@layer components {
  .btn-primary { @apply inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow; }
  .btn-secondary { @apply inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-all; }
  .card { @apply bg-white border border-slate-200 rounded-2xl shadow-sm; }
  .input { @apply w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all; }
  .badge { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium; }
  .badge-emerald { @apply badge bg-emerald-50 text-emerald-700 border border-emerald-200; }
  .badge-blue    { @apply badge bg-blue-50   text-blue-700   border border-blue-200;    }
  .badge-violet  { @apply badge bg-violet-50 text-violet-700 border border-violet-200;  }
  .badge-amber   { @apply badge bg-amber-50  text-amber-700  border border-amber-200;   }
  .badge-red     { @apply badge bg-red-50    text-red-700    border border-red-200;      }
  .badge-slate   { @apply badge bg-slate-100 text-slate-600  border border-slate-200;   }
  .badge-indigo  { @apply badge bg-indigo-50 text-indigo-700 border border-indigo-200;  }
  .nav-link      { @apply flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all; }
  .nav-link.active { @apply bg-brand/10 text-brand font-semibold; }
}
`;
}

function genMainJsx() {
  return `import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport './index.css'\nimport App from './App.jsx'\n\ncreateRoot(document.getElementById('root')).render(\n  <StrictMode><App /></StrictMode>\n)\n`;
}

function genStore(entities) {
  const seedBlocks = entities.map(e => {
    const seed = genSeedData(e);
    return `  '${e.name}': ${JSON.stringify(seed, null, 4)},`;
  }).join('\n');

  return `// OneAtlas Generated Store — localStorage-backed data layer
// Replace the read/write functions with your API calls to connect a real backend.

const SEED = {
${seedBlocks}
};

const KEYS = {
${entities.map(e=>`  '${e.name}': 'oa_${slug(e.name)}'`).join(',\n')}
};

function raw(entity) {
  try {
    const stored = localStorage.getItem(KEYS[entity]);
    if (stored) return JSON.parse(stored);
    // First run: seed with demo data
    const seed = SEED[entity] || [];
    localStorage.setItem(KEYS[entity], JSON.stringify(seed));
    return seed;
  } catch { return SEED[entity] || []; }
}
function save(entity, data) {
  try { localStorage.setItem(KEYS[entity], JSON.stringify(data)); } catch {}
}

export const getAll  = (entity) => raw(entity);
export const getById = (entity, id) => raw(entity).find(r => r.id === id) || null;

export function create(entity, data) {
  const records = raw(entity);
  const record = {
    id: 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    tenantId: 'tenant_local',
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  save(entity, [record, ...records]);
  return record;
}
export function update(entity, id, data) {
  const records = raw(entity);
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() };
  save(entity, records);
  return records[idx];
}
export function remove(entity, id) {
  save(entity, raw(entity).filter(r => r.id !== id));
}
export function resetToSeed(entity) {
  save(entity, SEED[entity] || []);
}
`;
}

function genAuthContext(appName) {
  const email = `admin@${slug(appName)}.com`;
  return `import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'oa_app_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {}
  }, [])

  const login = (email, password) => {
    const expected = '${email}'
    if (email === expected && password === 'password') {
      const u = { email, name: email.split('@')[0], role: 'admin' }
      localStorage.setItem(SESSION_KEY, JSON.stringify(u))
      setUser(u)
      return { ok: true }
    }
    return { ok: false, error: 'Invalid email or password' }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
`;
}

function genLoginPage(appName) {
  return `import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@${slug(appName)}.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const res = login(email, password)
    if (res.ok) navigate('/')
    else setError(res.error || 'Login failed')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm card p-8 space-y-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign in to ${appName}</h1>
        <p className="text-xs text-slate-500">Default: admin@${slug(appName)}.com / password</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="btn-primary w-full justify-center">Sign in</button>
      </form>
    </div>
  )
}
`;
}

function genProtectedRoute() {
  return `import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}
`;
}

function genSettingsPage(appName, integrations) {
  const ids = [...new Set(integrations)].filter(id => ['slack','whatsapp','gmail','stripe','webhook'].includes(id));
  const rows = ids.length ? ids : ['slack', 'stripe'];
  const fields = rows.map(id => `
        <IntegrationKeyRow id="${id}" label="${id}" />`).join('');
  return `import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE = 'oa_integration_keys_${slug(appName)}'

function loadKeys() {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '{}') } catch { return {} }
}

function IntegrationKeyRow({ id, label }) {
  const [value, setValue] = useState(() => loadKeys()[id]?.apiKey || loadKeys()[id]?.token || '')
  const [saved, setSaved] = useState(false)
  const save = () => {
    const all = loadKeys()
    all[id] = { apiKey: value, token: value, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE, JSON.stringify(all))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return (
    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
      <p className="text-sm font-bold capitalize">{label}</p>
      <input type="password" className="input" placeholder="API key or token" value={value} onChange={e => setValue(e.target.value)} />
      <button type="button" onClick={save} className="btn-secondary text-xs">{saved ? 'Saved' : 'Save key'}</button>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link to="/" className="text-sm text-brand font-medium">← Back</Link>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-sm text-slate-500">Store integration API keys locally. Wire your backend to read these keys and call Slack, Stripe, etc.</p>
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-slate-400">Integrations</h2>
        ${fields}
      </section>
      <section className="card p-4">
        <h2 className="text-sm font-bold mb-2">Profile</h2>
        <p className="text-xs text-slate-500">Session is stored in localStorage. Replace with Firebase or your auth provider for production.</p>
      </section>
    </div>
  )
}
`;
}

function genAppJsx(intent, entities) {
  const imports = entities.map(e =>
    `import ${e.name}List   from './pages/${e.name}List.jsx'\nimport ${e.name}Detail from './pages/${e.name}Detail.jsx'`
  ).join('\n');
  const routes = entities.map(e =>
    `          <Route path="${e.tableName}" element={<${e.name}List />} />\n          <Route path="${e.tableName}/:id" element={<${e.name}Detail />} />`
  ).join('\n');
  const integrations = intent.integrations_requested || [];
  return `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
${imports}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
${routes}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
`;
}

function genLayout(intent, entities) {
  const navIcons = ['LayoutDashboard','Users','Briefcase','Package','FileText','BarChart2','Settings','Star','Tag','Globe'];
  const navItems = [
    `{ label: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true }`,
    ...entities.slice(0,7).map((e,i)=>`{ label: '${plural(e.name)}', path: '/${e.tableName}', icon: ${navIcons[(i+1)%navIcons.length]} }`),
    `{ label: 'Settings', path: '/settings', icon: Settings }`,
  ].join(',\n  ');

  const usedIcons = ['LayoutDashboard', 'Settings', ...entities.slice(0,7).map((_,i)=>navIcons[(i+1)%navIcons.length])];
  const uniqueIcons = [...new Set(usedIcons)];

  return `import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ${uniqueIcons.join(', ')}, Sun, Moon, Menu, X, ChevronRight } from 'lucide-react'

const NAV = [
  ${navItems}
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const location = useLocation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const current = NAV.find(n => n.exact ? location.pathname==='/' : location.pathname.startsWith(n.path))

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className={\`\${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-200\`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">{('${intent.appName}'.charAt(0)||'A').toUpperCase()}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">${intent.appName}</p>
              <p className="text-xs text-slate-400 truncate capitalize">${(intent.appType||'custom').replace(/_/g,' ')}</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex-shrink-0">
            {collapsed ? <Menu size={16}/> : <X size={16}/>}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = item.exact ? location.pathname==='/' : location.pathname.startsWith(item.path)
            return (
              <NavLink key={item.path} to={item.path}
                className={\`nav-link \${active ? 'active' : ''} \${collapsed ? 'justify-center' : ''}\`}
                title={collapsed ? item.label : undefined}>
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setTheme(t => t==='dark'?'light':'dark')}
            className={\`nav-link w-full \${collapsed ? 'justify-center' : ''}\`}>
            {theme==='dark' ? <Sun size={16}/> : <Moon size={16}/>}
            {!collapsed && <span>{theme==='dark' ? 'Light mode' : 'Dark mode'}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-6 gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 text-sm text-slate-400">
            <span>${intent.appName}</span>
            {current && <><ChevronRight size={14}/><span className="text-slate-700 dark:text-slate-300 font-medium">{current.label}</span></>}
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
`;
}

function genDashboard(intent, entities) {
  const primary = entities[0];
  const secondary = entities[1];

  const statCards = entities.slice(0,4).map((e,i) => {
    const sf = statusField(e);
    const af = amountField(e);
    const icons = ['Users','Briefcase','Package','FileText','BarChart2','Star'];
    const colors = [
      'bg-brand/10 text-brand',
      'bg-emerald-100 text-emerald-600',
      'bg-violet-100 text-violet-600',
      'bg-amber-100 text-amber-600',
    ];
    const icon = icons[i%icons.length];

    if (af) {

      return `    {
      label: 'Total ${plural(e.name)}',
      getValue: (data) => data.${camel(e.name)}s?.length || 0,
      getExtra: (data) => '$' + (data.${camel(e.name)}s||[]).reduce((s,r)=>s+(Number(r.${af.name})||0),0).toLocaleString(),
      extraLabel: 'total value',
      icon: '${icon}',
      color: '${colors[i]}',
    }`;
    }
    if (sf) {
      const positive = sf.enumValues?.find(v=>['active','open','won','completed','approved'].includes(v.toLowerCase()))||sf.enumValues?.[0];
      return `    {
      label: '${plural(e.name)}',
      getValue: (data) => data.${camel(e.name)}s?.length || 0,
      getExtra: (data) => (data.${camel(e.name)}s||[]).filter(r=>r.${sf.name}==='${positive||'Active'}').length + ' ${positive||'active'}',
      extraLabel: null,
      icon: '${icon}',
      color: '${colors[i]}',
    }`;
    }
    return `    {
      label: '${plural(e.name)}',
      getValue: (data) => data.${camel(e.name)}s?.length || 0,
      getExtra: () => null,
      extraLabel: null,
      icon: '${icon}',
      color: '${colors[i]}',
    }`;
  }).join(',\n');

  const icons = ['Users','Briefcase','Package','FileText','BarChart2','Star'];
  const usedIcons = [...new Set(entities.slice(0,4).map((_,i)=>icons[i%icons.length]))];

  return `import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ${usedIcons.join(', ')}, ArrowUpRight, TrendingUp } from 'lucide-react'
import { getAll } from '../store.js'

const ICON_MAP = { ${usedIcons.map(i=>`${i}`).join(', ')} }

const STAT_DEFS = [
${statCards}
]

${primary ? `function StatusBadge({ value }) {
  const colors = {
    ${(statusField(primary)?.enumValues||['Active','Lead','Inactive']).map(v=>`'${v}': '${statusColor(v)}'`).join(', ')}
  }
  const c = colors[value] || 'slate'
  return <span className={\`badge badge-\${c}\`}>{value}</span>
}` : ''}

export default function Dashboard() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const d = {}
    ${entities.map(e=>`d['${camel(e.name)}s'] = getAll('${e.name}')`).join('\n    ')}
    setData(d)
    setLoading(false)
  }, [])

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">${intent.appName}</h1>
        <p className="text-slate-500 mt-0.5">Overview of your ${(intent.appType||'application').replace(/_/g,' ')}</p>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_DEFS.map((stat, i) => {
          const IconComp = { ${usedIcons.map(ic=>`${ic}`).join(', ')} }[stat.icon] || Users
          const val = stat.getValue(data)
          const extra = stat.getExtra(data)
          return (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${stat.color}\`}>
                  <IconComp size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{val}</p>
              {extra && <p className="text-sm text-slate-500 mt-1 font-medium">{extra}</p>}
            </div>
          )
        })}
      </div>

      ${primary ? `{}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent ${plural(primary.name)}</h2>
          <Link to="/${primary.tableName}" className="text-sm text-brand hover:text-brand-hover font-medium flex items-center gap-1">
            View all <ArrowUpRight size={14}/>
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(data['${camel(primary.name)}s']||[]).slice(0,5).map(r => (
            <Link key={r.id} to={\`/${primary.tableName}/\${r.id}\`}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand transition-colors">
                  {r['${primaryLabel(primary)}'] || r.id?.slice(0,8)}
                </p>
                ${secondaryLabel(primary) ? `{r['${secondaryLabel(primary)}'] && <p className="text-sm text-slate-500 mt-0.5">{r['${secondaryLabel(primary)}']}</p>}` : ''}
              </div>
              <div className="flex items-center gap-3">
                ${amountField(primary) ? `{r['${amountField(primary)?.name}'] && <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">\${Number(r['${amountField(primary)?.name}']).toLocaleString()}</span>}` : ''}
                ${statusField(primary) ? `{r['${statusField(primary)?.name}'] && <StatusBadge value={r['${statusField(primary)?.name}']} />}` : ''}
              </div>
            </Link>
          ))}
          {!(data['${camel(primary.name)}s']?.length) && (
            <div className="px-6 py-12 text-center text-slate-400">
              <p>No ${primary.name.toLowerCase()}s yet</p>
              <Link to="/${primary.tableName}" className="text-brand text-sm mt-1 inline-block hover:underline">Create your first →</Link>
            </div>
          )}
        </div>
      </div>` : ''}
    </div>
  )
}
`;
}

function genEntityList(entity) {
  const df = displayFields(entity);
  const sf = statusField(entity);
  const af = amountField(entity);
  const label = primaryLabel(entity);
  const second = secondaryLabel(entity);
  const cols = df.slice(0, 5);

  const statusColors = sf ? (sf.enumValues||['Active']).map(v=>`'${v}': '${statusColor(v)}'`).join(', ') : '';

  const headerCells = cols.map(f =>
    `              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">${f.name.replace(/([A-Z])/g,' $1').trim()}</th>`
  ).join('\n');

  const bodyCells = cols.map(f => {
    if (f.name === sf?.name) return `              <td className="px-5 py-4"><span className={\`badge badge-\${statusColors[r.${f.name}] || 'slate'}\`}>{r.${f.name}||'—'}</span></td>`;
    if (f.name === af?.name) return `              <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{r.${f.name} ? '$'+Number(r.${f.name}).toLocaleString() : '—'}</td>`;
    if (f.type==='boolean') return `              <td className="px-5 py-4"><span className={\`badge \${r.${f.name}?'badge-emerald':'badge-slate'}\`}>{r.${f.name}?'Yes':'No'}</span></td>`;
    if (f.type==='datetime'||f.type==='date') return `              <td className="px-5 py-4 text-slate-500 text-sm">{r.${f.name}?new Date(r.${f.name}).toLocaleDateString():'—'}</td>`;
    if (f.name===label) return `              <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{r.${f.name}||'—'}</td>`;
    return `              <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{r.${f.name}||'—'}</td>`;
  }).join('\n');

  const statusColorMap = sf ? `const STATUS_COLORS = { ${statusColors} }` : '';

  return `import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2, Eye, RefreshCw } from 'lucide-react'
import { getAll, remove } from '../store.js'
import ${entity.name}Form from '../components/${entity.name}Form.jsx'

${statusColorMap}

export default function ${entity.name}List() {
  const [records,  setRecords]  = useState([])
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => setRecords(getAll('${entity.name}')), [])
  useEffect(load, [load])

  const filtered = search
    ? records.filter(r => Object.values(r).some(v => String(v||'').toLowerCase().includes(search.toLowerCase())))
    : records

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this ${entity.name.toLowerCase()}? This cannot be undone.')) return
    remove('${entity.name}', id)
    load()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">${plural(entity.name)}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{records.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary !px-2.5 !py-2.5"><RefreshCw size={15}/></button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={15}/> Add ${entity.name}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search ${plural(entity.name).toLowerCase()}…"
          className="input pl-9 max-w-sm" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500">{search ? 'No results for "'+search+'"' : 'No ${entity.name.toLowerCase()}s yet'}</p>
            {!search && <button onClick={() => setShowForm(true)} className="text-brand text-sm mt-2 hover:underline">Create your first ${entity.name.toLowerCase()} →</button>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <tr>
${headerCells}
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
${bodyCells}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={\`/${entity.tableName}/\${r.id}\`}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
                        <Eye size={15}/>
                      </Link>
                      <button onClick={e => handleDelete(e, r.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <${entity.name}Form onClose={() => { setShowForm(false); load() }} />}
    </div>
  )
}
`;
}

function genEntityDetail(entity) {
  const df = displayFields(entity);
  const sf = statusField(entity);
  const af = amountField(entity);
  const label = primaryLabel(entity);
  const statusColorMap = sf ? `const STATUS_COLORS = { ${(sf.enumValues||[]).map(v=>`'${v}': '${statusColor(v)}'`).join(', ')} }` : '';

  const fields = df.map(f => {
    let val;
    if (f.name === sf?.name) val = `{record.${f.name} ? <span className={\`badge badge-\${STATUS_COLORS[record.${f.name}]||'slate'}\`}>{record.${f.name}}</span> : '—'}`;
    else if (f.name === af?.name) val = `{record.${f.name} ? '$'+Number(record.${f.name}).toLocaleString() : '—'}`;
    else if (f.type==='boolean') val = `{record.${f.name} ? <span className="badge badge-emerald">Yes</span> : <span className="badge badge-slate">No</span>}`;
    else if (f.type==='datetime'||f.type==='date') val = `{record.${f.name} ? new Date(record.${f.name}).toLocaleString() : '—'}`;
    else val = `{record.${f.name} ?? '—'}`;
    const fLabel = f.name.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
    return `          <div className="flex py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <dt className="w-44 flex-shrink-0 text-sm text-slate-500 font-medium">${fLabel}</dt>
            <dd className="text-sm text-slate-900 dark:text-slate-100 font-medium">${val}</dd>
          </div>`;
  }).join('\n');

  return `import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { getById, remove } from '../store.js'
import ${entity.name}Form from '../components/${entity.name}Form.jsx'

${statusColorMap}

export default function ${entity.name}Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [editing, setEditing] = useState(false)

  const load = () => {
    const r = getById('${entity.name}', id)
    if (!r) { navigate('/${entity.tableName}'); return }
    setRecord(r)
  }
  useEffect(load, [id])

  if (!record) return <div className="p-8 text-slate-400">Loading…</div>

  const handleDelete = () => {
    if (!confirm('Delete this ${entity.name.toLowerCase()}?')) return
    remove('${entity.name}', id)
    navigate('/${entity.tableName}')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link to="/${entity.tableName}" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 font-medium">
        <ArrowLeft size={15}/> ${plural(entity.name)}
      </Link>

      <div className="card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {record['${label}'] || '${entity.name} Detail'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">ID: {record.id?.slice(0,16)}…</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="btn-secondary gap-1.5">
              <Pencil size={14}/> Edit
            </button>
            <button onClick={handleDelete} className="btn-secondary !text-red-500 !border-red-200 !hover:bg-red-50 gap-1.5">
              <Trash2 size={14}/> Delete
            </button>
          </div>
        </div>

        {/* Fields */}
        <dl className="px-6">
${fields}
          <div className="flex py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <dt className="w-44 flex-shrink-0 text-sm text-slate-500 font-medium">Created</dt>
            <dd className="text-sm text-slate-900 dark:text-slate-100">{record.createdAt ? new Date(record.createdAt).toLocaleString() : '—'}</dd>
          </div>
        </dl>
      </div>

      {editing && <${entity.name}Form record={record} onClose={() => { setEditing(false); load() }} />}
    </div>
  )
}
`;
}

function genEntityForm(entity) {
  const ff = formFields(entity);
  const label = primaryLabel(entity);

  const initialState = ff.map(f => {
    const def = f.type==='boolean' ? 'false' : f.type==='integer'||f.type==='float' ? "''" : "''";
    return `    ${f.name}: record?.${f.name} ?? ${def}`;
  }).join(',\n');

  const inputs = ff.map(f => {
    const fLabel = f.name.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
    const required = !f.nullable;

    if (f.type==='boolean') return `
          <label className="flex items-center gap-3 py-1.5 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={!!form.${f.name}}
                onChange={e => setForm(p=>({...p,${f.name}:e.target.checked}))} />
              <div className="w-10 h-6 bg-slate-200 peer-checked:bg-brand rounded-full transition-colors"></div>
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">${fLabel}</span>
          </label>`;

    if (f.type==='text') return `
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">${fLabel}${required?' *':''}</label>
            <textarea rows={3} value={form.${f.name}||''} onChange={e=>setForm(p=>({...p,${f.name}:e.target.value}))}
              className="input resize-none" placeholder="${fLabel}…" />
          </div>`;

    if ((f.type==='enum'||f.name===label+'Type') && f.enumValues?.length) return `
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">${fLabel}${required?' *':''}</label>
            <select value={form.${f.name}||''} onChange={e=>setForm(p=>({...p,${f.name}:e.target.value}))} className="input">
              <option value="">Select ${fLabel}…</option>
              ${f.enumValues.map(v=>`<option value="${v}">${v}</option>`).join('\n              ')}
            </select>
          </div>`;

    const inputType = f.type==='integer'||f.type==='float'?'number':f.type==='date'?'date':f.type==='datetime'?'datetime-local':f.name.toLowerCase().includes('email')?'email':f.name.toLowerCase().includes('password')?'password':'text';
    return `
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">${fLabel}${required?' *':''}</label>
            <input type="${inputType}" value={form.${f.name}||''} onChange={e=>setForm(p=>({...p,${f.name}:e.target.value}))}
              className="input" placeholder="${fLabel}…" ${required?'required':''} />
          </div>`;
  }).join('\n');

  return `import { useState } from 'react'
import { X } from 'lucide-react'
import { create, update } from '../store.js'

export default function ${entity.name}Form({ record, onClose }) {
  const [form, setForm] = useState({
${initialState}
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (record?.id) {
        update('${entity.name}', record.id, form)
      } else {
        create('${entity.name}', form)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {record ? 'Edit' : 'New'} ${entity.name}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={18}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
${inputs}
        </form>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : record ? 'Save Changes' : 'Create ${entity.name}'}
          </button>
        </div>
      </div>
    </div>
  )
}
`;
}

function genReadme(appName, entities) {
  return `# ${appName}

Generated by [OneAtlas](https://oneatlas.app) — AI-native app generation.

## Quick Start

\`\`\`bash
npm install
npm run dev
# → http://localhost:5173
\`\`\`

## Build & Deploy

\`\`\`bash
npm run build
# Upload dist/ to Vercel, Netlify, or Cloudflare Pages
\`\`\`

## Entities

${entities.map(e=>`- **${e.name}** (${e.tableName}) — ${e.fields.map(f=>f.name).join(', ')}`).join('\n')}

## Backend Integration

Replace \`src/store.js\` functions with API calls:
- \`getAll(entity)\` → GET /api/:entity
- \`getById(entity, id)\` → GET /api/:entity/:id
- \`create(entity, data)\` → POST /api/:entity
- \`update(entity, id, data)\` → PUT /api/:entity/:id
- \`remove(entity, id)\` → DELETE /api/:entity/:id
`;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateApp(intent, dataSchema, appSpec) {
  const { entities } = dataSchema;
  const appSlug = slug(intent.appName);
  const files = {};

  files['package.json']               = genPackageJson(intent.appName);
  files['vite.config.js']             = genViteConfig();
  files['tailwind.config.js']         = genTailwindConfig();
  files['postcss.config.js']          = genPostcssConfig();
  files['index.html']                 = genIndexHtml(intent.appName);
  files['README.md']                  = genReadme(intent.appName, entities);
  files['src/main.jsx']               = genMainJsx();
  files['src/index.css']              = genIndexCss(intent.appName);
  files['src/App.jsx']                = genAppJsx(intent, entities);
  files['src/auth/AuthContext.jsx']   = genAuthContext(intent.appName);
  files['src/auth/ProtectedRoute.jsx']= genProtectedRoute();
  files['src/pages/LoginPage.jsx']    = genLoginPage(intent.appName);
  files['src/pages/SettingsPage.jsx'] = genSettingsPage(intent.appName, intent.integrations_requested || []);
  files['src/store.js']               = genStore(entities);
  files['src/components/Layout.jsx']  = genLayout(intent, entities);
  files['src/pages/Dashboard.jsx']    = genDashboard(intent, entities);

  for (const entity of entities) {
    files[`src/pages/${entity.name}List.jsx`]      = genEntityList(entity);
    files[`src/pages/${entity.name}Detail.jsx`]    = genEntityDetail(entity);
    files[`src/components/${entity.name}Form.jsx`] = genEntityForm(entity);
  }

  return { files, appSlug };
}
