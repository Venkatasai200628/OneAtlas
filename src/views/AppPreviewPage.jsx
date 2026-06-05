import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/lib/store';
import GeneratedAppWorkspace from '@/components/GeneratedAppWorkspace';
import { ArrowLeft, Maximize2 } from 'lucide-react';

export default function AppPreviewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const apps = useStore(s => s.apps) || [];
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    const fromStore = apps.find(a => a.id === projectId);
    if (fromStore?.intent && fromStore?.appSpec) {
      setPayload(fromStore);
      return;
    }
    try {
      const raw = sessionStorage.getItem('oa_open_project');
      if (raw) {
        const data = JSON.parse(raw);
        if (!projectId || data.projectId === projectId) {
          setPayload(data);
        }
      }
    } catch {}
  }, [projectId, apps]);

  if (!payload?.intent || !payload?.appSpec) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#F5F5EE' }}>
        <p className="text-sm" style={{ color: '#6B7280' }}>App not found. Build or open a project first.</p>
        <button onClick={() => navigate('/app/generate')} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: '#FF6600' }}>
          Go to Build
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0f172a' }}>
      <header className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-700" style={{ background: '#1e293b' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> Back to OneAtlas
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Maximize2 size={14} style={{ color: '#FF6600' }} />
          {payload.name || payload.intent?.appName}
        </div>
        <span className="text-xs font-mono text-slate-500">{payload.subdomain || 'preview.oneatlas.dev'}</span>
      </header>
      <main className="flex-1 min-h-0 p-3">
        <GeneratedAppWorkspace
          intent={payload.intent}
          appSpec={payload.appSpec}
          schema={payload.schema}
          projectMeta={{ instanceId: payload.id || projectId, createdAt: payload.createdAt }}
          fullscreen
        />
      </main>
    </div>
  );
}
