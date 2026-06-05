import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import {
  Zap, FolderOpen, Plug, Settings, LogOut, BookOpen,
  LayoutGrid, ChevronLeft, Rocket, Bell, Search, ChevronDown,
  Plus, Command,
} from 'lucide-react';

const NAV = [
  { to: '/app/generate',     icon: Zap,         label: 'Build' },
  { to: '/app/projects',     icon: FolderOpen,  label: 'Projects' },
  { to: '/app/templates',    icon: LayoutGrid,  label: 'Templates' },
  { to: '/app/deployments',  icon: Rocket,      label: 'Deployments' },
  { to: '/app/integrations', icon: Plug,        label: 'Integrations' },
  { to: '/app/instructions', icon: BookOpen,    label: 'Docs' },
];

const MODELS = [
  { id: 'auto',         label: 'Automatic',         color: '#FF6600' },
  { id: 'gpt-5.5',     label: 'GPT-5.5',           color: '#10A37F' },
  { id: 'gpt-mini',    label: 'GPT-5.4 Mini',       color: '#10A37F' },
  { id: 'sonnet',      label: 'Claude Sonnet 4.6',  color: '#D97706' },
  { id: 'opus',        label: 'Claude Opus 4.6',    color: '#D97706' },
  { id: 'gemini-pro',  label: 'Gemini 3.1 Pro',     color: '#4285F4' },
  { id: 'gemini-flash',label: 'Gemini 3 Flash',     color: '#4285F4' },
  { id: 'deepseek',    label: 'DeepSeek V4',        color: '#0EA5E9' },
  { id: 'llama',       label: 'Llama 4 Scout',      color: '#8B5CF6' },
  { id: 'mistral',     label: 'Mistral Small',      color: '#EF4444' },
];

function ModelPicker() {
  const selectedModel = useStore(s => s.selectedModel);
  const setSelectedModel = useStore(s => s.setSelectedModel);
  const [open, setOpen] = useState(false);
  const cur = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
        style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: cur.color }} />
        {cur.label}
        <ChevronDown size={11} style={{ color: '#9CA3AF' }} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 rounded-xl border shadow-hover overflow-hidden w-52"
          style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
          {MODELS.map(m => (
            <button key={m.id} onClick={() => { setSelectedModel(m.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-all"
              style={{ color: m.id === selectedModel ? '#FF6600' : '#111111', background: m.id === selectedModel ? '#FFF3EB' : 'transparent' }}
              onMouseEnter={e => { if (m.id !== selectedModel) e.currentTarget.style.background = '#F9F9F6'; }}
              onMouseLeave={e => { if (m.id !== selectedModel) e.currentTarget.style.background = 'transparent'; }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
              <span className="font-semibold flex-1">{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrgSwitcher() {
  const orgs = useStore(s => s.orgs);
  const activeOrgId = useStore(s => s.activeOrgId);
  const setActiveOrg = useStore(s => s.setActiveOrg);
  const addOrg = useStore(s => s.addOrg);
  const [open, setOpen] = useState(false);
  const org = orgs.find(o => o.id === activeOrgId) || orgs[0];
  const orgName = org?.name || 'Organisation';
  const initials = orgName.slice(0, 1).toUpperCase();

  const handleSelect = (item) => {
    if (item === '+ New Organisation') {
      const name = window.prompt('Organisation name');
      if (name?.trim()) addOrg(name.trim());
      setOpen(false);
      return;
    }
    const found = orgs.find(o => o.name === item);
    if (found) setActiveOrg(found.id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all"
        style={{ color: '#111111' }}
        onMouseEnter={e => e.currentTarget.style.background = '#F5F5EE'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: '#FF6600' }}>{initials}</div>
        <span className="text-sm font-semibold">{orgName}</span>
        <ChevronDown size={13} style={{ color: '#9CA3AF' }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border shadow-hover w-44 overflow-hidden"
          style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}
          onMouseLeave={() => setOpen(false)}>
          {[...orgs.map(o => o.name), '+ New Organisation'].map(o => (
            <button key={o} onClick={() => handleSelect(o)}
              className="w-full text-left px-3 py-2.5 text-xs font-semibold transition-all"
              style={{ color: o === orgName ? '#FF6600' : '#111111', background: o === orgName ? '#FFF3EB' : 'transparent' }}
              onMouseEnter={e => { if (o !== orgName) e.currentTarget.style.background = '#F9F9F6'; }}
              onMouseLeave={e => { if (o !== orgName) e.currentTarget.style.background = 'transparent'; }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { logout } = useAuth();
  const user = useStore(s => s.user);
  const profilePhoto = useStore(s => s.profilePhoto);
  const apps = useStore(s => s.apps) || [];
  const inAppNotifications = useStore(s => s.inAppNotifications) || [];
  const markNotificationRead = useStore(s => s.markNotificationRead);
  const markAllNotificationsRead = useStore(s => s.markAllNotificationsRead);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = inAppNotifications.filter(n => !n.read).length;
  const avatarSrc = profilePhoto || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'U')}&background=FF6600&color=fff&size=64`;

  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const navHits = NAV.filter(n => n.label.toLowerCase().includes(q)).map(n => ({
      type: 'nav', label: n.label, desc: `Go to ${n.label}`, action: () => { navigate(n.to); setSearchOpen(false); },
    }));
    const appHits = apps.filter(a => (a.name || '').toLowerCase().includes(q) || (a.prompt || '').toLowerCase().includes(q)).map(a => ({
      type: 'project', label: a.name, desc: a.prompt?.slice(0, 60) || 'Open project', action: () => {
        sessionStorage.setItem('oa_open_project', JSON.stringify({ projectId: a.id, prompt: a.prompt, intent: a.intent, schema: a.schema, appSpec: a.appSpec }));
        navigate('/app/generate'); setSearchOpen(false);
      },
    }));
    return [...appHits, ...navHits].slice(0, 8);
  })();

  // Cmd+K to open search, Escape to close
  useEffect(() => {
    const fn = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); }
    };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F5EE' }}>
      {/* ── Sidebar ── */}
      <aside className="flex-shrink-0 flex flex-col transition-all duration-200"
        style={{ width: collapsed ? 56 : 204, background: '#FFFFFF', borderRight: '1px solid #E5E7EB' }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FF6600' }}>
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-bold text-base" style={{ color: '#111111', letterSpacing: '-0.02em' }}>OneAtlas</span>
              </div>
              <button onClick={() => setCollapsed(true)} className="p-1 rounded-lg transition-all"
                style={{ color: '#D1D5DB' }}
                onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
                onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}>
                <ChevronLeft size={15} />
              </button>
            </div>
          ) : (
            <button onClick={() => setCollapsed(false)} className="mx-auto">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FF6600' }}>
                <Zap size={14} className="text-white" />
              </div>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 9,
                padding: collapsed ? '9px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 12, transition: 'all 0.15s', fontSize: 14, fontWeight: 600,
                background: isActive ? '#FFF3EB' : 'transparent',
                color: isActive ? '#FF6600' : '#6B7280',
                textDecoration: 'none',
              })}>
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t space-y-0.5" style={{ borderColor: '#E5E7EB' }}>
          <NavLink to="/app/settings" title={collapsed ? 'Settings' : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 9,
              padding: collapsed ? '9px 0' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 12, transition: 'all 0.15s', fontSize: 14, fontWeight: 600,
              background: isActive ? '#FFF3EB' : 'transparent',
              color: isActive ? '#FF6600' : '#6B7280',
              textDecoration: 'none',
            })}>
            {({ isActive }) => (
              <>
                <Settings size={16} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {!collapsed && <span>Settings</span>}
              </>
            )}
          </NavLink>

          {user && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all group"
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F5EE'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <img
                src={avatarSrc}
                alt="avatar" className="flex-shrink-0 object-cover"
                style={{ width: 28, height: 28, borderRadius: 8, border: '2px solid #FFD0A6' }} />
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: '#111111' }}>
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                  </div>
                  <button onClick={async () => { await logout(); navigate('/'); }}
                    title="Sign out"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                    style={{ color: '#9CA3AF' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
                    <LogOut size={13} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-6 border-b"
          style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
          {/* Left — org switcher */}
          <OrgSwitcher />

          {/* Center — search */}
          <button onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all"
            style={{ background: '#F9F9F6', borderColor: '#E5E7EB', color: '#9CA3AF', minWidth: 220 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#D1D5DB'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
            <Search size={14} />
            <span>Search...</span>
            <span className="ml-auto flex items-center gap-0.5 text-[10px] font-bold" style={{ color: '#C4C4BC' }}>
              <Command size={10} /> K
            </span>
          </button>

          {/* Right */}
          <div className="flex items-center gap-3">
            <ModelPicker />
            <div className="relative">
              <button onClick={() => setNotifOpen(o => !o)} className="relative w-8 h-8 flex items-center justify-center rounded-xl border transition-all"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#111111'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}>
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full border-2 border-white" style={{ background: '#FF6600' }} />
                )}
              </button>
              {notifOpen && (
                <div className="absolute top-full right-0 mt-1 z-50 w-80 rounded-xl border shadow-hover overflow-hidden"
                  style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#ECECEC' }}>
                    <span className="text-sm font-bold" style={{ color: '#111111' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={() => markAllNotificationsRead()} className="text-xs font-bold" style={{ color: '#FF6600' }}>Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {inAppNotifications.length === 0 ? (
                      <p className="text-xs text-center py-8" style={{ color: '#9CA3AF' }}>No notifications yet. Build an app to get started.</p>
                    ) : inAppNotifications.map(n => (
                      <button key={n.id} onClick={() => markNotificationRead(n.id)}
                        className="w-full text-left px-4 py-3 border-b transition-all"
                        style={{ borderColor: '#F5F5EE', background: n.read ? 'transparent' : '#FFF3EB' }}>
                        <p className="text-xs font-bold mb-0.5" style={{ color: '#111111' }}>{n.title}</p>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{n.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {user && (
              <img src={avatarSrc}
                alt="avatar" className="w-8 h-8 rounded-full object-cover cursor-pointer"
                style={{ border: '2px solid #FFD0A6' }}
                onClick={() => navigate('/app/settings')} />
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border shadow-hover overflow-hidden"
            style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#ECECEC' }}>
              <Search size={16} style={{ color: '#9CA3AF' }} />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects, templates, integrations…"
                className="flex-1 text-sm bg-transparent outline-none" style={{ color: '#111111' }} />
              <kbd className="text-xs px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>esc</kbd>
            </div>
            <div className="p-4">
              {searchQuery.trim() && searchResults.length > 0 ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Results</p>
                  {searchResults.map((item, i) => (
                    <button key={i} onClick={item.action}
                      className="w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left mb-1"
                      onMouseEnter={e => e.currentTarget.style.background = '#FFF3EB'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Plus size={14} style={{ color: '#FF6600', marginTop: 1 }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#111111' }}>{item.label}</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Quick actions</p>
              {[
                { label: 'New App', desc: 'Start building a new application', action: () => { navigate('/app/generate'); setSearchOpen(false); } },
                { label: 'Browse Templates', desc: 'Browse 60+ ready-made templates', action: () => { navigate('/app/templates'); setSearchOpen(false); } },
                { label: 'View Deployments', desc: 'Check deployment status', action: () => { navigate('/app/deployments'); setSearchOpen(false); } },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left mb-1"
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF3EB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Plus size={14} style={{ color: '#FF6600', marginTop: 1 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#111111' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.desc}</p>
                  </div>
                </button>
              ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
