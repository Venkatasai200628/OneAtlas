
import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { generateWithSSE } from '@/lib/generateApi';
import GeneratedAppWorkspace from '@/components/GeneratedAppWorkspace';
import AppOperatorPanel from '@/components/AppOperatorPanel';
import {
  Play, Square, Download, CheckCircle2, XCircle, Loader2, Clock,
  DollarSign, Wrench, Plug, RotateCcw, Eye, X, ChevronDown, ChevronUp,
  Layers, Database, GitBranch,
} from 'lucide-react';
import clsx from 'clsx';

import { EVAL_PROMPTS } from '../../lib/evalPrompts.js';

function AppPreviewModal({ result, item, onClose }) {
  const [tab, setTab] = useState('preview');
  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700">
        {}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">#{item.id} — {item.label}</span>
                <span className={clsx('text-xs px-2 py-0.5 rounded font-medium',
                  item.cat === 'edge'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                )}>{item.cat}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><Clock size={10}/>{((result.latency || 0) / 1000).toFixed(1)}s</span>
                <span className="flex items-center gap-1"><DollarSign size={10}/>${(result.totalCostUSD || 0).toFixed(5)}</span>
                {result.schema?.entities?.length > 0 && <span className="flex items-center gap-1"><Database size={10}/>{result.schema.entities.length} entities</span>}
                {result.appSpec?.pages?.length > 0 && <span className="flex items-center gap-1"><Layers size={10}/>{result.appSpec.pages.length} pages</span>}
                {(result.repairLogs || []).length > 0 && (
                  <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                    <Wrench size={10}/>{result.repairLogs.length} repair{result.repairLogs.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View tabs */}
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {[{ id: 'preview', label: 'App', icon: Eye }, { id: 'admin', label: 'Admin', icon: Layers }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    tab === t.id
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  )}>
                  <t.icon size={11}/>{t.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
          {tab === 'preview' && result.appSpec && result.intent ? (
            <GeneratedAppWorkspace
              intent={result.intent}
              appSpec={result.appSpec}
              schema={result.schema}
              projectMeta={{ latency: result.latency, totalCostUSD: result.totalCostUSD, repairLogs: result.repairLogs, evalId: item.id }}
            />
          ) : tab === 'admin' && (
            <AppOperatorPanel
              intent={result.intent}
              schema={result.schema}
              appSpec={result.appSpec}
              repairLogs={result.repairLogs}
              validations={result.validations}
            />
          )}
          </div>
        </div>

        {/* Prompt footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">Prompt: {item.prompt}</p>
        </div>
      </div>
    </div>
  );
}

// ── Result row ─────────────────────────────────────────────────────────────────
function ResultRow({ item, result, isRunning, onRun, onView }) {
  const success = result?.status === 'complete' || (result?.appSpec && result?.intent && !result?.error);
  const latency  = result?.latency ? ((result.latency) / 1000).toFixed(1) + 's' : '—';
  const cost     = result?.totalCostUSD != null ? '$' + result.totalCostUSD.toFixed(5) : '—';
  const repairs  = result ? (result.repairLogs || []).map(r => r.strategy).filter(Boolean) : [];
  const detected = result?.appSpec?.integrationHooks?.map(h => h.integration) || [];
  const workflows = result?.appSpec?.workflowStubs?.map(s => s.integration).filter(Boolean) || [];
  const allIntegrations = [...new Set([...detected, ...workflows])];

  return (
    <tr className={clsx('border-b border-slate-50 dark:border-slate-700/50 group transition-colors',
      isRunning && 'bg-indigo-50/30 dark:bg-indigo-900/10',
      result && !success && 'bg-red-50/30 dark:bg-red-900/10',
    )}>
      <td className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 font-mono">#{item.id}</td>
      <td className="px-3 py-3">
        <span className={clsx('text-xs px-2 py-0.5 rounded font-medium',
          item.cat === 'edge'
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        )}>{item.cat}</span>
      </td>
      <td className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{item.label}</td>
      <td className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 max-w-[220px] truncate">{item.prompt.slice(0, 80)}{item.prompt.length > 80 && '…'}</td>
      <td className="px-3 py-3 text-center">
        {isRunning
          ? <Loader2 size={13} className="animate-spin text-indigo-500 mx-auto"/>
          : result
            ? (success
                ? <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400 mx-auto"/>
                : <XCircle size={13} className="text-red-500 dark:text-red-400 mx-auto"/>)
            : <span className="text-slate-300 dark:text-slate-600">—</span>
        }
      </td>
      <td className="px-3 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
        {isRunning ? <span className="text-indigo-400 dark:text-indigo-500 animate-pulse">…</span> : latency}
      </td>
      <td className="px-3 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
        {isRunning ? <span className="text-indigo-400 dark:text-indigo-500 animate-pulse">…</span> : cost}
      </td>
      <td className="px-3 py-3">
        {repairs.length > 0
          ? <div className="flex flex-wrap gap-1">{[...new Set(repairs)].map(s => (
              <span key={s} className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">{s}</span>
            ))}</div>
          : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
      </td>
      <td className="px-3 py-3">
        {allIntegrations.length > 0
          ? <div className="flex flex-wrap gap-1">{allIntegrations.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">{s}</span>
            ))}</div>
          : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          {/* Run button */}
          <button onClick={() => onRun(item)} disabled={isRunning}
            className={clsx('flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
              isRunning
                ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                : 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
            )}>
            {isRunning ? <Loader2 size={10} className="animate-spin"/> : <Play size={10}/>} Run
          </button>
          {/* View button — only when complete */}
          {success && (
            <button onClick={() => onView(item, result)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
              <Eye size={10}/> View
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Summary stats bar ──────────────────────────────────────────────────────────
function SummaryBar({ results }) {
  const all       = Object.values(results);
  const completed = all.length;
  const passed    = all.filter(r =>
    r.status === 'complete' || (r.appSpec && r.intent && !r.error)
  ).length;
  const repaired  = all.filter(r => r.repairLogs?.length > 0).length;
  const avgLatency = completed > 0
    ? (all.reduce((s, r) => s + (r.latency || 0), 0) / completed / 1000).toFixed(1)
    : '—';
  const totalCost = all.reduce((s, r) => s + (r.totalCostUSD || 0), 0).toFixed(4);

  const strategies = {};
  all.forEach(r => (r.repairLogs || []).forEach(l => {
    if (l.strategy) strategies[l.strategy] = (strategies[l.strategy] || 0) + 1;
  }));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {[
        { label: 'Passed', value: `${passed}/${completed}`, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Avg Latency', value: `${avgLatency}s`, color: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'Total Cost', value: `$${totalCost}`, color: 'text-slate-600 dark:text-slate-300' },
        { label: 'Repaired', value: `${repaired}/${completed}`, color: 'text-amber-600 dark:text-amber-400' },
        { label: 'Repair Calls', value: Object.values(strategies).reduce((a, b) => a + b, 0), color: 'text-purple-600 dark:text-purple-400' },
      ].map(s => (
        <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
          <p className={clsx('text-xl font-bold', s.color)}>{s.value}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BenchmarkPage() {
  const providerKeys = useStore(s => s.providerKeys);
  const [results, setResults]       = useState({});
  const [runningIds, setRunningIds] = useState(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [viewing, setViewing]       = useState(null); // { item, result }
  const abortRef = useRef(false);

  const runSingle = async (item) => {
    setRunningIds(prev => new Set([...prev, item.id]));
    const res = await generateWithSSE(item.prompt, providerKeys || {}, null);
    setResults(prev => ({ ...prev, [item.id]: res }));
    setRunningIds(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    return res;
  };

  const runAll = async () => {
    abortRef.current = false; setBulkRunning(true); setResults({});
    for (const item of EVAL_PROMPTS) {
      if (abortRef.current) break;
      await runSingle(item);
      await new Promise(r => setTimeout(r, 2500));
    }
    setBulkRunning(false);
  };

  const reset = () => { setResults({}); setRunningIds(new Set()); };

  const downloadLog = () => {
    const log = EVAL_PROMPTS.map(item => {
      const r = results[item.id];
      if (!r) return { id: item.id, cat: item.cat, label: item.label, prompt: item.prompt, status: 'not_run' };
      return {
        id: item.id, cat: item.cat, label: item.label, prompt: item.prompt,
        status: r.status, latencyMs: r.latency, latencySec: ((r.latency || 0) / 1000).toFixed(2),
        totalCostUSD: (r.totalCostUSD || 0).toFixed(6),
        repairStrategies: (r.repairLogs || []).map(l => l.strategy).filter(Boolean),
        repairCount: (r.repairLogs || []).length,
        detectedIntegrations: (r.appSpec?.integrationHooks || []).map(h => h.integration),
        workflowIntegrations: (r.appSpec?.workflowStubs || []).map(s => s.integration).filter(Boolean),
        integrationsRequested: r.intent?.integrations_requested || [],
        entities: r.schema?.entities?.map(e => e.name) || [],
        pageCount: r.appSpec?.pages?.length || 0,
        endpointCount: r.appSpec?.apiEndpoints?.length || 0,
        validationErrors: Object.values(r.validations || {}).flatMap(v => (v?.errors || []).map(e => e.type)),
        error: r.error || null,
      };
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ runAt: new Date().toISOString(), results: log }, null, 2)], { type: 'application/json' }));
    a.download = 'oneatlas-eval-log.json'; a.click();
  };

  const completed = Object.values(results).length;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Evaluation</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              12 prompts (6 normal · 6 edge cases) — click Run or Run All, then View to inspect generated apps
            </p>
          </div>
          <div className="flex items-center gap-2">
            {completed > 0 && (
              <>
                <button onClick={downloadLog}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-800">
                  <Download size={11}/> Export Log
                </button>
                <button onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-800">
                  <RotateCcw size={11}/> Reset
                </button>
              </>
            )}
            {bulkRunning
              ? <button onClick={() => { abortRef.current = true; setBulkRunning(false); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                  <Square size={13}/> Stop
                </button>
              : <button onClick={runAll} disabled={runningIds.size > 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900">
                  <Play size={13}/> Run All 12
                </button>
            }
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-6 space-y-5">
        {/* Summary stats */}
        {completed > 0 && <SummaryBar results={results}/>}

        {/* Results table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
              <thead>
                <tr className="text-xs text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-700 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="text-left px-3 py-3">#</th>
                  <th className="text-left px-3 py-3">Type</th>
                  <th className="text-left px-3 py-3">Test</th>
                  <th className="text-left px-3 py-3">Prompt</th>
                  <th className="text-center px-3 py-3">Pass</th>
                  <th className="text-left px-3 py-3 flex items-center gap-1"><Clock size={9}/>Latency</th>
                  <th className="text-left px-3 py-3">Cost</th>
                  <th className="text-left px-3 py-3"><Wrench size={9} className="inline mr-0.5"/>Repair</th>
                  <th className="text-left px-3 py-3"><Plug size={9} className="inline mr-0.5"/>Integrations</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {EVAL_PROMPTS.map(item => (
                  <ResultRow key={item.id} item={item}
                    result={results[item.id]}
                    isRunning={runningIds.has(item.id)}
                    onRun={runSingle}
                    onView={(item, result) => setViewing({ item, result })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-slate-400 dark:text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 dark:bg-blue-600 inline-block"/>
            <span>Normal — typical app prompts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-600 inline-block"/>
            <span>Edge — vague, complex, or unusual prompts testing pipeline resilience</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Eye size={10}/>
            <span>Click View after running to see the generated app preview</span>
          </div>
        </div>
      </div>

      {/* App Preview Modal */}
      {viewing && (
        <AppPreviewModal
          result={viewing.result}
          item={viewing.item}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
