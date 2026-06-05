import { useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { generateWithSSE } from '@/lib/generateApi';
import { EVAL_PROMPTS } from '../../lib/evalPrompts.js';
import { openProjectPreview, getAppSubdomain } from '@/lib/projectNavigation';
import GeneratedAppWorkspace from '@/components/GeneratedAppWorkspace';
import {
  Play, Square, RotateCcw, Eye, FileCode, Loader2, CheckCircle2,
  XCircle, Clock, Globe, Copy, ExternalLink, RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';

function CatalogCaseRow({ item, result, isRunning, isSelected, onRun, onSelect }) {
  const ok = result?.status === 'complete' && (result?.appSpec || result?.schema);
  const latency = result?.latency ? `${(result.latency / 1000).toFixed(1)}s` : '—';
  const pages = result?.appSpec?.pages?.length ?? '—';

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-colors',
        isSelected && 'ring-2 ring-inset ring-orange-400',
      )}
      style={{
        borderColor: '#ECECEC',
        background: isSelected ? '#FFF7ED' : 'transparent',
      }}
      onClick={() => result && onSelect(item, result)}
    >
      <span className="text-xs font-mono w-6 shrink-0" style={{ color: '#9CA3AF' }}>{item.id}</span>
      <span className={clsx(
        'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
        item.cat === 'edge' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800',
      )}>
        {item.cat}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: '#111111' }}>{item.label}</p>
        <p className="text-[10px] truncate font-mono" style={{ color: '#9CA3AF' }}>{item.prompt}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 text-xs" style={{ color: '#9CA3AF' }}>
        {isRunning ? (
          <Loader2 size={14} className="animate-spin text-orange-500" />
        ) : ok ? (
          <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
        ) : result?.error ? (
          <XCircle size={14} style={{ color: '#DC2626' }} />
        ) : null}
        <span>{latency}</span>
        <span>{pages} pg</span>
      </div>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onRun(item); }}
        disabled={isRunning}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0 disabled:opacity-50"
        style={{ background: '#FF6600' }}
      >
        {isRunning ? '…' : 'Run'}
      </button>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); result && onSelect(item, result); }}
        disabled={!ok}
        className="px-2 py-1.5 rounded-lg text-xs font-bold border shrink-0 disabled:opacity-40"
        style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
      >
        <Eye size={12} />
      </button>
    </div>
  );
}

function InlineSpecView({ intent, schema, appSpec }) {
  const pages = appSpec?.pages || [];
  return (
    <div className="p-4 space-y-3 overflow-auto h-full text-sm">
      <div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#FFF3EB', color: '#FF6600' }}>{intent?.appType}</span>
        <h3 className="font-bold mt-1" style={{ color: '#111111' }}>{intent?.appName}</h3>
      </div>
      <p className="text-xs font-bold" style={{ color: '#6B7280' }}>Pages ({pages.length})</p>
      {pages.map((p, i) => (
        <div key={i} className="p-2 rounded-lg border text-xs" style={{ borderColor: '#E5E7EB' }}>
          <strong>{p.name}</strong> <code className="text-[10px] text-slate-400">{p.route}</code> · {p.layout}
        </div>
      ))}
      <p className="text-xs font-bold pt-2" style={{ color: '#6B7280' }}>Entities ({schema?.entities?.length || 0})</p>
      <div className="flex flex-wrap gap-1">
        {(schema?.entities || []).map(e => (
          <span key={e.name} className="text-[10px] px-2 py-0.5 rounded-full border font-mono">{e.name}</span>
        ))}
      </div>
    </div>
  );
}

export default function DeploymentsPage() {
  const providerKeys = useStore(s => s.providerKeys);
  const storeApps = useStore(s => s.apps) || [];
  const updateApp = useStore(s => s.updateApp);
  const navigate = useNavigate();

  const [results, setResults] = useState({});
  const [runningIds, setRunningIds] = useState(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkStep, setBulkStep] = useState(null);
  const [selected, setSelected] = useState(null);
  const [viewTab, setViewTab] = useState('preview');
  const abortRef = useRef(false);

  const runSingle = useCallback(async (item) => {
    setRunningIds(prev => new Set([...prev, item.id]));
    setBulkStep(item);
    const res = await generateWithSSE(item.prompt, providerKeys || {}, null);
    setResults(prev => ({ ...prev, [item.id]: res }));
    setRunningIds(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    if (res?.status === 'complete') setSelected({ item, result: res });
    setBulkStep(null);
    return res;
  }, [providerKeys]);

  const runAll = async () => {
    abortRef.current = false;
    setBulkRunning(true);
    setResults({});
    setSelected(null);
    for (let i = 0; i < EVAL_PROMPTS.length; i++) {
      if (abortRef.current) break;
      const item = EVAL_PROMPTS[i];
      setBulkStep({ ...item, index: i + 1, total: EVAL_PROMPTS.length });
      await runSingle(item);
      if (i < EVAL_PROMPTS.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 800));
      }
    }
    setBulkRunning(false);
    setBulkStep(null);
  };

  const userDeps = storeApps
    .filter(a => !String(a.id || '').startsWith('catalog_'))
    .map((a, i) => ({
      id: a.id || `user_${i}`,
      name: a.name || a.intent?.appName || 'Untitled',
      subdomain: a.subdomain || getAppSubdomain(a),
      app: a,
    }));

  const completed = Object.values(results).filter(r => r?.status === 'complete').length;

  return (
    <div className="h-full flex flex-col" style={{ background: '#F5F5EE' }}>
      <div className="shrink-0 px-8 pt-6 pb-4 border-b" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-bold" style={{ fontSize: 28, color: '#111111', letterSpacing: '-0.02em' }}>Deployments</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              Run all 12 certification cases (step-by-step), or run / view each one inline — no need to leave this page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {completed > 0 && (
              <button type="button" onClick={() => { setResults({}); setSelected(null); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold"
                style={{ borderColor: '#E5E7EB', color: '#6B7280', background: '#FFFFFF' }}>
                <RotateCcw size={12} /> Reset
              </button>
            )}
            {bulkRunning ? (
              <button type="button" onClick={() => { abortRef.current = true; setBulkRunning(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: '#DC2626' }}>
                <Square size={13} /> Stop
              </button>
            ) : (
              <button type="button" onClick={runAll} disabled={runningIds.size > 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ background: '#FF6600' }}>
                <Play size={13} /> Run All 12
              </button>
            )}
          </div>
        </div>
        {bulkStep && (
          <div className="mt-3 p-3 rounded-xl flex items-center gap-3" style={{ background: '#FFF3EB', border: '1px solid #FFD0A6' }}>
            <Loader2 size={16} className="animate-spin text-orange-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: '#C05500' }}>
                {bulkRunning && bulkStep.index
                  ? `Step ${bulkStep.index} of ${bulkStep.total}: ${bulkStep.label}`
                  : `Running: ${bulkStep.label}`}
              </p>
              <p className="text-[10px] truncate font-mono" style={{ color: '#92400E' }}>{bulkStep.prompt}</p>
            </div>
          </div>
        )}
        {completed > 0 && (
          <p className="text-xs mt-2" style={{ color: '#16A34A' }}>
            {completed}/12 complete — click a row or <Eye size={10} className="inline" /> to view preview / AppSpec on the right
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Case list */}
        <div className="w-[min(440px,42vw)] shrink-0 border-r overflow-auto" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="px-4 py-2 border-b text-xs font-bold uppercase tracking-wider" style={{ borderColor: '#ECECEC', color: '#9CA3AF' }}>
            Certification catalog (6 normal + 6 edge)
          </div>
          {EVAL_PROMPTS.map(item => (
            <CatalogCaseRow
              key={item.id}
              item={item}
              result={results[item.id]}
              isRunning={runningIds.has(item.id)}
              isSelected={selected?.item?.id === item.id}
              onRun={runSingle}
              onSelect={(it, res) => { setSelected({ item: it, result: res }); setViewTab('preview'); }}
            />
          ))}

          <div className="px-4 py-3 border-t mt-2" style={{ borderColor: '#ECECEC' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#111111' }}>Your builds ({userDeps.length})</p>
            {userDeps.length === 0 ? (
              <button type="button" onClick={() => navigate('/app/generate')}
                className="text-xs font-bold" style={{ color: '#FF6600' }}>Build an app →</button>
            ) : (
              userDeps.map(dep => (
                <div key={dep.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{dep.name}</p>
                    <p className="text-[10px] font-mono truncate" style={{ color: '#9CA3AF' }}>{dep.subdomain}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" title="Open" onClick={() => openProjectPreview(navigate, dep.app)}
                      className="p-1.5 rounded-lg border" style={{ borderColor: '#E5E7EB' }}>
                      <ExternalLink size={11} />
                    </button>
                    <button type="button" title="Copy URL" onClick={() => navigator.clipboard?.writeText(`https://${dep.subdomain}`)}
                      className="p-1.5 rounded-lg border" style={{ borderColor: '#E5E7EB' }}>
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inline viewer */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ background: '#FAFAF8' }}>
          {!selected?.result ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Globe size={40} style={{ color: '#D1D5DB', marginBottom: 12 }} />
              <p className="text-sm font-bold" style={{ color: '#6B7280' }}>No deployment selected</p>
              <p className="text-xs mt-2 max-w-sm" style={{ color: '#9CA3AF' }}>
                Click <strong>Run All 12</strong> to execute every case step-by-step, or <strong>Run</strong> on a single row, then view the app here.
              </p>
            </div>
          ) : (
            <>
              <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#111111' }}>
                    #{selected.item.id} {selected.item.label}
                  </p>
                  <p className="text-[10px] flex items-center gap-2" style={{ color: '#9CA3AF' }}>
                    <Clock size={10} /> {((selected.result.latency || 0) / 1000).toFixed(1)}s
                    · {selected.result.appSpec?.pages?.length || 0} pages
                    · {selected.result.schema?.entities?.length || 0} entities
                  </p>
                </div>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: '#F3F4F6' }}>
                  {[
                    { id: 'preview', icon: Eye, label: 'Preview' },
                    { id: 'spec', icon: FileCode, label: 'AppSpec' },
                  ].map(t => (
                    <button key={t.id} type="button" onClick={() => setViewTab(t.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold"
                      style={{
                        background: viewTab === t.id ? '#FFFFFF' : 'transparent',
                        color: viewTab === t.id ? '#FF6600' : '#6B7280',
                        boxShadow: viewTab === t.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      }}>
                      <t.icon size={11} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {viewTab === 'preview' && selected.result.appSpec && selected.result.intent ? (
                  <GeneratedAppWorkspace
                    intent={selected.result.intent}
                    appSpec={selected.result.appSpec}
                    schema={selected.result.schema}
                    projectMeta={{ evalId: selected.item.id }}
                  />
                ) : (
                  <InlineSpecView
                    intent={selected.result.intent}
                    schema={selected.result.schema}
                    appSpec={selected.result.appSpec}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
