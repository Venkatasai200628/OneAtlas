import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Link, useNavigate } from 'react-router-dom';
import { openProjectPreview } from '@/lib/projectNavigation';
import {
  Plus, Search, Globe, RefreshCw, ExternalLink, Trash2,
  Clock,
} from 'lucide-react';

const STATUS = {
  live:     { label:'live',     bg:'#DCFCE7', color:'#16A34A', border:'#86EFAC' },
  building: { label:'building', bg:'#FFF3EB', color:'#FF6600', border:'#FFD0A6' },
  failed:   { label:'failed',   bg:'#FEE2E2', color:'#DC2626', border:'#FCA5A5' },
  idle:     { label:'idle',     bg:'#F1F5F9', color:'#64748B', border:'#CBD5E1' },
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff/60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

function ProjectCard({ app, onDelete, onOpen, onRedeploy }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const s = STATUS[app.status] || STATUS.idle;
  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
            style={{ background: '#F1F5F9', borderColor: '#E2E8F0', color: '#475569' }}>
            {app.appType}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
            style={{ background: s.bg, borderColor: s.border, color: s.color }}>
            {s.label}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-bold text-lg mb-2" style={{ color: '#111111', letterSpacing: '-0.01em' }}>
          {app.name}
        </h3>

        {/* Prompt */}
        <p className="text-sm mb-4" style={{ color: '#6B7280', lineHeight: 1.55 }}>
          {app.prompt?.length > 90 ? app.prompt.slice(0, 90) + '…' : app.prompt}
        </p>

        {/* Subdomain */}
        {app.subdomain && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl mb-4" style={{ background: '#F5F5EE' }}>
            <Globe size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <span className="text-xs font-mono truncate" style={{ color: '#6B7280' }}>{app.subdomain}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs flex items-center gap-1" style={{ color: '#9CA3AF' }}>
            <Clock size={11} /> Updated {timeAgo(app.updatedAt || Date.now())}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => onRedeploy?.(app)} className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.color = '#FF6600'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
              title="Redeploy">
              <RefreshCw size={13} />
            </button>
            <button onClick={() => onOpen?.(app)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-sm transition-all"
              style={{ background: '#FFF3EB', borderColor: '#FFD0A6', color: '#FF6600' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFD0A6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFF3EB'; }}>
              <ExternalLink size={12} /> Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const storeApps = useStore(s => s.apps) || [];
  const removeApp = useStore(s => s.deleteApp);
  const updateApp = useStore(s => s.updateApp);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const allApps = storeApps;

  const handleOpen = (app) => openProjectPreview(navigate, app);
  const handleRedeploy = (app) => {
    updateApp(app.id, { status: 'live', updatedAt: Date.now() });
    openProjectPreview(navigate, app);
  };
  const handleDelete = (id) => {
    if (window.confirm('Delete this project?')) removeApp(id);
  };

  const filtered = allApps.filter(a => {
    const q = search.toLowerCase();
    const match = !q || a.name?.toLowerCase().includes(q) || a.prompt?.toLowerCase().includes(q);
    const flt = filter === 'all' || a.status === filter;
    return match && flt;
  });

  return (
    <div className="h-full flex flex-col" style={{ background: '#F5F5EE' }}>
      {/* Toolbar */}
      <div className="shrink-0 px-6 py-4 flex items-center justify-between gap-4 border-b"
        style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border max-w-xs w-full"
            style={{ background: '#F9F9F6', borderColor: '#E5E7EB' }}>
            <Search size={13} style={{ color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
              className="text-sm bg-transparent outline-none flex-1" style={{ color: '#111111' }} />
          </div>
          {['all','live','building','failed','idle'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border"
              style={{
                background: filter === f ? '#FF6600' : '#FFFFFF',
                color: filter === f ? '#FFFFFF' : '#6B7280',
                borderColor: filter === f ? '#FF6600' : '#E5E7EB',
              }}>
              {f}
            </button>
          ))}
        </div>
        <Link to="/app/generate"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all flex-shrink-0"
          style={{ background: '#FF6600', borderRadius: 12, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = '#E65C00'}
          onMouseLeave={e => e.currentTarget.style.background = '#FF6600'}>
          <Plus size={14} /> New App
        </Link>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#FFF3EB' }}>
              <Plus size={28} style={{ color: '#FF6600' }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>No projects yet</h3>
            <p className="text-sm mb-6 max-w-sm" style={{ color: '#6B7280', lineHeight: 1.6 }}>
              Describe what you want to build and OneAtlas generates a production-ready application instantly.
            </p>
            <Link to="/app/generate"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: '#FF6600', textDecoration: 'none' }}>
              <Plus size={16} /> Build Your First App
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(app => (
              <ProjectCard key={app.id} app={app} onDelete={handleDelete} onOpen={handleOpen} onRedeploy={handleRedeploy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
