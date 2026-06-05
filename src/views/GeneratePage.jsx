import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { generateWithSSE } from '@/lib/generateApi';
import { CHIP_PROMPTS, CATEGORY_PROMPTS } from '@/lib/promptPresets';
import { syncProjectToDb } from '@/lib/projectApi';
import { getTemplateVisual } from '../../lib/templateCatalog.js';
import { useNavigate, Link } from 'react-router-dom';
import { Maximize2 } from 'lucide-react';
import { getAppSubdomain } from '@/lib/projectNavigation';
import { sendAppNotification } from '@/lib/notifications';
import GeneratedAppWorkspace from '@/components/GeneratedAppWorkspace';
import AppOperatorPanel from '@/components/AppOperatorPanel';
import {
  Zap, Send, CheckCircle2, XCircle, Loader2, AlertTriangle,
  DollarSign, Clock, Layers, Database, Code2, Eye, Download,
  Copy, Check, Wrench, ChevronDown, ChevronUp, ArrowRight,
  Info, Paperclip, Image, Mic, MicOff, X,
  BarChart3, Users, Settings2, Layout, Workflow, History,
  Globe, Shield, Play, AlertCircle, FileCode, ZapOff, Plug,
} from 'lucide-react';

/* ─── Config ────────────────────────────────────────────────── */
const MODELS = [
  { id:'auto',          label:'Automatic',         badge:'Platform',  color:'#FF6600' },
  { id:'gpt-5.5',       label:'GPT-5.5',           badge:'OpenAI',    color:'#10A37F' },
  { id:'gpt-5.4-mini',  label:'GPT-5.4 Mini',      badge:'OpenAI',    color:'#10A37F' },
  { id:'claude-sonnet', label:'Claude Sonnet 4.6', badge:'Anthropic', color:'#D97706' },
  { id:'claude-opus',   label:'Claude Opus 4.6',   badge:'Anthropic', color:'#D97706' },
  { id:'gemini-pro',    label:'Gemini 3.1 Pro',    badge:'Google',    color:'#4285F4' },
  { id:'gemini-flash',  label:'Gemini 3 Flash',    badge:'Google',    color:'#4285F4' },
  { id:'deepseek-v4',   label:'DeepSeek V4',       badge:'DeepSeek',  color:'#0EA5E9' },
  { id:'llama-4-scout', label:'Llama 4 Scout',     badge:'Groq',      color:'#8B5CF6' },
  { id:'mistral-small', label:'Mistral Small',     badge:'Mistral',   color:'#EF4444' },
];

const CATEGORIES = [
  { id:'internal_tool', label:'Internal Tool', icon:Settings2, color:'#FF6600' },
  { id:'dashboard',     label:'Dashboard',     icon:BarChart3,  color:'#4285F4' },
  { id:'client_portal', label:'Client Portal', icon:Users,      color:'#10B981' },
  { id:'crm',           label:'CRM App',       icon:Database,   color:'#8B5CF6' },
  { id:'ai_workflow',   label:'AI Workflow',   icon:Workflow,   color:'#F59E0B' },
  { id:'admin_panel',   label:'Admin Panel',   icon:Layout,     color:'#EF4444' },
];

const CHIPS = [
  'Sales CRM','KPI Dashboard','Employee Onboarding App',
  'Customer Support Portal','Inventory Tracker','Approval Workflow',
];

const STAGE_META = {
  intent_extraction:  { label:'Intent',  icon:Zap,      color:'#FF6600' },
  schema_generation:  { label:'Schema',  icon:Database, color:'#4285F4' },
  appspec_generation: { label:'AppSpec', icon:Layers,   color:'#10B981' },
};

/* ─── Sub-components ────────────────────────────────────────── */
function ModelPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const cur = MODELS.find(m => m.id === value) || MODELS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold"
        style={{ background:'#FFFFFF', borderColor:'#E5E7EB', color:'#111111' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background:cur.color }} />
        {cur.label} <ChevronDown size={11} style={{ color:'#9CA3AF' }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border shadow-hover w-52 overflow-hidden"
          style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}
          onMouseLeave={() => setOpen(false)}>
          {MODELS.map(m => (
            <button key={m.id} onClick={() => { onChange(m.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-all"
              style={{ color:m.id===value?'#FF6600':'#111111', background:m.id===value?'#FFF3EB':'transparent' }}
              onMouseEnter={e => { if(m.id!==value) e.currentTarget.style.background='#F9F9F6'; }}
              onMouseLeave={e => { if(m.id!==value) e.currentTarget.style.background='transparent'; }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:m.color }} />
              <span className="font-bold flex-1">{m.label}</span>
              <span style={{ color:'#9CA3AF' }}>{m.badge}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* 1. Prompt History panel */
function PromptHistory({ history, onSelect }) {
  if (!history.length) return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <History size={28} style={{ color:'#D1D5DB', marginBottom:8 }} />
      <p className="text-xs font-semibold" style={{ color:'#9CA3AF' }}>No history yet</p>
      <p className="text-xs mt-1" style={{ color:'#C4C4BC' }}>Your past generations appear here</p>
    </div>
  );
  return (
    <div className="flex-1 overflow-auto">
      {history.map((h, i) => (
        <button key={i} onClick={() => onSelect(h.prompt)}
          className="w-full text-left px-4 py-3 border-b transition-all"
          style={{ borderColor:'#ECECEC' }}
          onMouseEnter={e => e.currentTarget.style.background='#FFF3EB'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <p className="text-xs font-semibold truncate mb-1" style={{ color:'#111111' }}>{h.appName||'Untitled'}</p>
          <p className="text-[11px] line-clamp-2 mb-1.5" style={{ color:'#9CA3AF', lineHeight:1.4 }}>{h.prompt}</p>
          <div className="flex items-center gap-2 text-[10px]" style={{ color:'#C4C4BC' }}>
            {h.latency && <span>{(h.latency/1000).toFixed(1)}s</span>}
            {h.totalCostUSD != null && <span>${h.totalCostUSD.toFixed(5)}</span>}
            {h.status && <span className={h.status==='complete'?'text-green-500':'text-red-500'}>{h.status}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

/* 2+3. Generation Timeline + Stage Progress */
function GenerationTimeline({ stages, providerLog, running }) {
  const ORDER = ['intent_extraction','schema_generation','appspec_generation'];
  return (
    <div className="space-y-3 p-4">
      {/* Stage progress */}
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'#9CA3AF' }}>Stage Progress</p>
      <div className="space-y-2">
        {ORDER.map(id => {
          const s = stages[id]; const st = s?.status||'pending';
          const meta = STAGE_META[id];
          return (
            <div key={id} className="flex items-center gap-3 p-3 rounded-xl border transition-all"
              style={{
                background: st==='complete'?'#F0FDF4':st==='running'?'#FFF3EB':st==='error'?'#FEF2F2':'#F9F9F6',
                borderColor: st==='complete'?'#86EFAC':st==='running'?'#FFD0A6':st==='error'?'#FCA5A5':'#E5E7EB',
              }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: st==='complete'?'#DCFCE7':st==='running'?'#FFF3EB':st==='error'?'#FEE2E2':'#F1F5F9' }}>
                {st==='running'  && <Loader2 size={13} style={{ color:'#FF6600' }} className="animate-spin" />}
                {st==='complete' && <Check    size={13} style={{ color:'#16A34A' }} />}
                {st==='error'    && <X        size={13} style={{ color:'#DC2626' }} />}
                {st==='pending'  && <meta.icon size={13} style={{ color:'#D1D5DB' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color:st==='pending'?'#9CA3AF':'#111111' }}>{meta.label}</p>
                {s?.message && <p className="text-[10px] truncate mt-0.5 pulse-soft" style={{ color:'#9CA3AF' }}>{s.message}</p>}
                {st==='complete' && s?.data && (
                  <p className="text-[10px] mt-0.5" style={{ color:'#059669' }}>
                    {id==='intent_extraction' && `${s.data.entities?.length||0} entities`}
                    {id==='schema_generation' && `${s.data.entities?.length||0} tables`}
                    {id==='appspec_generation' && `${s.data.pages?.length||0} pages`}
                  </p>
                )}
              </div>
              {s?.latency && <span className="text-[10px] flex-shrink-0" style={{ color:'#9CA3AF' }}>{(s.latency/1000).toFixed(1)}s</span>}
            </div>
          );
        })}
      </div>

      {/* Provider fallback log */}
      {providerLog.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2 mt-4" style={{ color:'#9CA3AF' }}>Provider Chain</p>
          <div className="flex flex-wrap gap-1">
            {providerLog.map((e,i) => (
              <span key={i} title={e.error||''}
                className="text-[10px] px-2 py-0.5 rounded font-mono border"
                style={{
                  background: e.success?'#F0FDF4':e.skipped?'#F9F9F6':'#FEF2F2',
                  borderColor: e.success?'#86EFAC':e.skipped?'#E5E7EB':'#FCA5A5',
                  color: e.success?'#059669':e.skipped?'#9CA3AF':'#DC2626',
                }}>
                {e.provider}/{(e.model||'').split('/').pop()}
                {e.success&&' ✓'}{e.skipped&&' (skip)'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* 6. Error Diagnostics */
function ErrorDiagnostics({ result }) {
  if (!result) return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <Shield size={28} style={{ color:'#D1D5DB', marginBottom:8 }} />
      <p className="text-xs font-semibold" style={{ color:'#9CA3AF' }}>No errors</p>
      <p className="text-xs mt-1" style={{ color:'#C4C4BC' }}>Validation errors and repair logs appear here</p>
    </div>
  );

  const allErrors = Object.entries(result.validations||{}).flatMap(([st,v])=>(v?.errors||[]).map(e=>({...e,stage:st})));
  const repairs = result.repairLogs || [];
  const allWarns = Object.entries(result.validations||{}).flatMap(([st,v])=>(v?.warnings||[]).map(w=>({...w,stage:st})));

  return (
    <div className="p-4 space-y-4 overflow-auto">
      {result.status === 'error' && (
        <div className="p-3 rounded-xl border" style={{ background:'#FEF2F2', borderColor:'#FCA5A5' }}>
          <div className="flex items-center gap-2 mb-1"><XCircle size={13} style={{ color:'#DC2626' }} /><span className="text-xs font-bold" style={{ color:'#DC2626' }}>Generation Failed</span></div>
          <p className="text-xs" style={{ color:'#DC2626' }}>{result.error}</p>
          {result.error?.includes('No API keys') && (
            <p className="text-xs mt-2 font-semibold" style={{ color:'#9CA3AF' }}>→ Go to Settings → API Keys and add at least one key.</p>
          )}
        </div>
      )}

      {allErrors.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'#9CA3AF' }}>Validation Errors</p>
          <div className="space-y-1.5">
            {allErrors.map((e,i) => (
              <div key={i} className="p-2.5 rounded-lg border text-xs" style={{ background:'#FEF2F2', borderColor:'#FCA5A5' }}>
                <span className="font-bold" style={{ color:'#DC2626' }}>[{e.stage}] {e.type}</span>
                <span style={{ color:'#DC2626', marginLeft:6 }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {repairs.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'#9CA3AF' }}>Repair Log</p>
          <div className="space-y-1.5">
            {repairs.map((r,i) => (
              <div key={i} className="p-2.5 rounded-lg border text-xs"
                style={{ background:r.outcome==='repaired'?'#F0FDF4':'#FFFBEB', borderColor:r.outcome==='repaired'?'#86EFAC':'#FDE68A' }}>
                <span className="font-bold px-1.5 py-0.5 rounded text-[10px] mr-2"
                  style={{ background:'#E0F2FE', color:'#0369A1' }}>{r.strategy}</span>
                <span style={{ color:r.outcome==='repaired'?'#059669':'#D97706' }}>{r.outcome}</span>
                {r.fixes?.length > 0 && <span style={{ color:'#9CA3AF', marginLeft:6 }}>{r.fixes.join(' · ')}</span>}
                {r.detail && !r.fixes?.length && <span style={{ color:'#9CA3AF', marginLeft:6 }}>{r.detail}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {allWarns.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'#9CA3AF' }}>Warnings</p>
          {allWarns.map((w,i) => (
            <div key={i} className="p-2 rounded-lg border text-xs mb-1.5" style={{ background:'#FFFBEB', borderColor:'#FDE68A', color:'#D97706' }}>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {!allErrors.length && !repairs.length && !allWarns.length && result.status !== 'error' && (
        <div className="text-center py-6">
          <CheckCircle2 size={24} style={{ color:'#10B981', margin:'0 auto 8px' }} />
          <p className="text-xs font-semibold" style={{ color:'#059669' }}>All validations passed</p>
        </div>
      )}
    </div>
  );
}

function asSpecArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatSpecLabel(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.type) return value.id ? `${value.type} (${value.id})` : String(value.type);
    try { return JSON.stringify(value); } catch { return '[object]'; }
  }
  return String(value);
}

/* 5. AppSpec Viewer */
function SpecViewer({ intent, schema, appSpec }) {
  const [tab, setTab] = useState('pages');
  const TABS = [
    { id:'pages',     label:'Pages',     count:appSpec?.pages?.length },
    { id:'endpoints', label:'Endpoints', count:appSpec?.apiEndpoints?.length },
    { id:'schema',    label:'Schema',    count:schema?.entities?.length },
    { id:'auth',      label:'Auth',      count:appSpec?.authPolicy?.roles?.length || (Array.isArray(appSpec?.authRules) ? appSpec.authRules.length : 0) },
    { id:'rules',     label:'Rules',     count:appSpec?.authPolicy?.businessRules?.length || appSpec?.businessRules?.length },
    { id:'workflows', label:'Workflows', count:(appSpec?.workflowStubs?.length||0) },
  ];
  const MC = { GET:'#10B981',POST:'#3B82F6',PUT:'#F59E0B',PATCH:'#F59E0B',DELETE:'#EF4444' };

  const pageCount = appSpec?.pages?.length || 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      {/* Intent summary */}
      <div className="px-5 py-4 border-b" style={{ borderColor:'#ECECEC' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background:'#FFF3EB', color:'#FF6600' }}>{intent?.appType}</span>
        </div>
        <h3 className="font-bold" style={{ fontSize:15, color:'#111111' }}>{intent?.appName}</h3>
        {intent?.tagline && <p className="text-xs mt-0.5" style={{ color:'#9CA3AF' }}>{intent.tagline}</p>}
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor:'#ECECEC' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1 px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex-shrink-0"
            style={{ borderColor:tab===t.id?'#FF6600':'transparent', color:tab===t.id?'#FF6600':'#9CA3AF' }}>
            {t.label}
            {t.count != null && (
              <span className="text-[10px] px-1 py-0.5 rounded" style={{ background:tab===t.id?'#FFF3EB':'#F1F5F9', color:tab===t.id?'#FF6600':'#9CA3AF' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4">
        {tab === 'pages' && (
          <div className="space-y-2">
            {pageCount === 0 && (
              <div className="text-center py-10 px-4 rounded-xl border" style={{ borderColor:'#E5E7EB', background:'#F9F9F6' }}>
                <Layers size={28} style={{ color:'#D1D5DB', margin:'0 auto 8px' }} />
                <p className="text-sm font-semibold" style={{ color:'#6B7280' }}>No pages in AppSpec</p>
                <p className="text-xs mt-1" style={{ color:'#9CA3AF' }}>Use Build mode to generate a full app with pages.</p>
              </div>
            )}
            {(appSpec?.pages||[]).map((p,i) => (
              <div key={i} className="p-3 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm" style={{ color:'#111111' }}>{p.name}</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background:'#F9F9F6', color:'#9CA3AF' }}>{p.route}</code>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ background:'#FFF3EB', borderColor:'#FFD0A6', color:'#FF6600' }}>{p.layout}</span>
                  {asSpecArray(p.components).map((c,j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded border" style={{ background:'#F9F9F6', borderColor:'#E5E7EB', color:'#6B7280' }}>{formatSpecLabel(c)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'endpoints' && (
          <div className="space-y-1.5">
            {(appSpec?.apiEndpoints||[]).map((ep,i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0" style={{ background:MC[ep.method]||'#6B7280' }}>{ep.method}</span>
                <code className="text-xs font-mono flex-1 truncate" style={{ color:'#6B7280' }}>{ep.path}</code>
                {ep.authRequired && <Shield size={11} style={{ color:'#FF6600', flexShrink:0 }} />}
              </div>
            ))}
          </div>
        )}
        {tab === 'schema' && (
          <div className="space-y-2">
            {(schema?.entities||[]).map(e => (
              <div key={e.name} className="p-3 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
                <p className="font-bold text-sm mb-2" style={{ color:'#111111' }}>{e.name}</p>
                <div className="flex flex-wrap gap-1">
                  {(e.fields||[]).map(f => (
                    <span key={f.name} className="text-[10px] px-1.5 py-0.5 rounded border font-mono"
                      style={{ background:f.name==='tenantId'?'#F3E8FF':f.isPrimary?'#EEF2FF':'#F9F9F6', borderColor:f.name==='tenantId'?'#E9D5FF':f.isPrimary?'#C7D2FE':'#E5E7EB', color:f.name==='tenantId'?'#9333EA':f.isPrimary?'#4F46E5':'#6B7280' }}>
                      {f.name}:{f.type}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'auth' && (
          <div className="space-y-3">
            {asSpecArray(appSpec?.authPolicy?.authentication).length > 0 && (
              <div className="p-3 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
                <p className="text-[10px] font-bold uppercase mb-2" style={{ color:'#9CA3AF' }}>Authentication</p>
                {asSpecArray(appSpec?.authPolicy?.authentication).map((a, i) => (
                  <p key={i} className="text-xs" style={{ color:'#374151' }}>• {formatSpecLabel(a)}</p>
                ))}
              </div>
            )}
            {asSpecArray(appSpec?.authPolicy?.roles).map(r => (
              <div key={r.name} className="p-3 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
                <span className="font-bold text-sm" style={{ color:'#111111' }}>{r.name}</span>
                {r.description && <p className="text-xs mt-1" style={{ color:'#9CA3AF' }}>{r.description}</p>}
              </div>
            ))}
            {asSpecArray(appSpec?.authPolicy?.permissions).map((p, i) => (
              <div key={i} className="p-2.5 rounded-lg border text-xs" style={{ background:'#F9F9F6', borderColor:'#E5E7EB', color:'#6B7280' }}>
                <strong style={{ color:'#111111' }}>{p.role}</strong> → {p.scope}
              </div>
            ))}
            {!(appSpec?.authPolicy?.roles?.length) && Array.isArray(appSpec?.authRules) && appSpec.authRules.map(r => (
              <div key={r.role} className="p-3 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
                <span className="font-bold text-sm" style={{ color:'#111111' }}>{r.role}</span>
              </div>
            ))}
            {!(appSpec?.authPolicy?.roles?.length) && !(appSpec?.authRules?.length) && <p className="text-xs" style={{ color:'#9CA3AF' }}>No auth rules defined.</p>}
          </div>
        )}
        {tab === 'rules' && (
          <div className="space-y-2">
            {[...asSpecArray(appSpec?.authPolicy?.businessRules), ...asSpecArray(appSpec?.businessRules)].map((rule, i) => (
              <div key={i} className="p-3 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
                <p className="text-xs" style={{ color:'#374151' }}>{formatSpecLabel(rule)}</p>
              </div>
            ))}
            {asSpecArray(appSpec?.authPolicy?.validationConstraints).map((vc) => (
              <div key={vc.id} className="p-2.5 rounded-lg border text-[10px] font-mono" style={{ background:'#FFF3EB', borderColor:'#FFD0A6', color:'#C05500' }}>
                {vc.rule}
              </div>
            ))}
            {!(appSpec?.authPolicy?.businessRules?.length) && !(appSpec?.businessRules?.length) && (
              <p className="text-xs" style={{ color:'#9CA3AF' }}>Add Business Rules in your prompt to see them here.</p>
            )}
          </div>
        )}
        {tab === 'workflows' && (
          <div className="space-y-2">
            {(appSpec?.workflowStubs||[]).length === 0 ? (
              <div className="text-center py-8">
                <Globe size={24} style={{ color:'#D1D5DB', margin:'0 auto 8px' }} />
                <p className="text-xs" style={{ color:'#9CA3AF' }}>No workflows. Add integration keywords: "Slack notifications", "WhatsApp alerts".</p>
              </div>
            ) : (appSpec.workflowStubs||[]).map((s,i) => (
              <div key={i} className="p-3 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs" style={{ color:'#111111' }}>{s.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background:'#FFF3EB', color:'#FF6600' }}>{s.integration}</span>
                </div>
                <p className="text-[10px] font-mono" style={{ color:'#9CA3AF' }}>{s.trigger?.entity}.{s.trigger?.event}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Plan viewer — architecture only (Plan mode) */
function PlanViewer({ plan, intent, schema, onBuild }) {
  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-xs" style={{ color:'#9CA3AF' }}>No plan data. Use Plan mode and click Plan.</p>
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0 overflow-auto p-5 space-y-4">
      <div className="p-4 rounded-2xl border" style={{ background:'#FFF7ED', borderColor:'#FDBA74' }}>
        <p className="text-xs font-bold uppercase mb-1" style={{ color:'#C2410C' }}>Plan mode</p>
        <p className="text-sm font-semibold" style={{ color:'#111111' }}>{plan.appName}</p>
        <p className="text-xs mt-1" style={{ color:'#6B7280' }}>{plan.summary}</p>
        <button type="button" onClick={onBuild}
          className="mt-3 px-4 py-2 rounded-xl text-white text-xs font-bold"
          style={{ background:'#FF6600' }}>
          Build app from this plan →
        </button>
      </div>
      {[
        ['Planned pages', plan.pages],
        ['Roles', plan.roles],
        ['Features', plan.features],
        ['Entities', plan.entities],
        ['Business rules', plan.businessRules],
        ['Integrations', plan.integrations],
      ].map(([title, items]) => (
        (items?.length > 0) && (
          <div key={title} className="p-4 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
            <p className="text-xs font-bold mb-2" style={{ color:'#111111' }}>{title}</p>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-xs flex items-start gap-2" style={{ color:'#374151' }}>
                  <span style={{ color:'#FF6600' }}>•</span> {typeof item === 'string' ? item : item.name || JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </div>
        )
      ))}
      {schema?.entities?.length > 0 && (
        <div className="p-4 rounded-xl border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
          <p className="text-xs font-bold mb-2" style={{ color:'#111111' }}>Database schema ({schema.entities.length} tables)</p>
          <div className="flex flex-wrap gap-1">
            {schema.entities.map(e => (
              <span key={e.name} className="text-[10px] px-2 py-1 rounded-full border font-mono" style={{ borderColor:'#E5E7EB', color:'#6B7280' }}>{e.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* 4. Live Preview */
function LivePreview({ intent, appSpec, schema, projectId, templateName, templateCategory }) {
  const enrichedIntent = useMemo(() => ({
    ...intent,
    templateName: intent?.templateName || templateName || appSpec?.appPreview?.templateName,
    templateCategory: intent?.templateCategory || templateCategory || appSpec?.appPreview?.templateCategory,
  }), [intent, templateName, templateCategory, appSpec]);
  return (
    <div className="h-full">
      <GeneratedAppWorkspace intent={enrichedIntent} appSpec={appSpec} schema={schema}
        projectMeta={{ instanceId:projectId, createdAt:new Date().toISOString() }} />
    </div>
  );
}

/* JSON Viewer */
function JsonViewer({ data, filename }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const text = JSON.stringify(data, null, 2);
  const copy = async () => { await navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const dl = () => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/json'})); a.download=filename; a.click(); };
  return (
    <div className="border rounded-xl overflow-hidden mb-3" style={{ borderColor:'#E5E7EB' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background:'#F9F9F6', borderColor:'#E5E7EB' }}>
        <button onClick={() => setCollapsed(c=>!c)} className="flex items-center gap-2 flex-1">
          <code className="text-xs font-bold" style={{ color:'#111111' }}>{filename}</code>
          {collapsed ? <ChevronDown size={11} style={{ color:'#9CA3AF' }} /> : <ChevronUp size={11} style={{ color:'#9CA3AF' }} />}
        </button>
        <div className="flex gap-1.5">
          <button onClick={copy} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border" style={{ background:'#FFFFFF', borderColor:'#E5E7EB', color:'#6B7280' }}>
            {copied ? <><Check size={10} style={{ color:'#10B981' }} /> Copied</> : <><Copy size={10} /> Copy</>}
          </button>
          <button onClick={dl} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-white" style={{ background:'#FF6600' }}>
            <Download size={10} /> Save
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre className="max-h-64 overflow-auto p-4 text-xs font-mono leading-relaxed" style={{ background:'#111111', color:'#E2E8F0' }}>{text}</pre>
      )}
    </div>
  );
}

/* ─── Main GeneratePage ─────────────────────────────────────── */
export default function GeneratePage() {
  const navigate = useNavigate();
  const providerKeys  = useStore(s => s.providerKeys);
  const activeOrgId   = useStore(s => s.activeOrgId);
  const orgs          = useStore(s => s.orgs);
  const activeOrgPlan = orgs.find(o => o.id === activeOrgId)?.plan || 'explorer';
  const addApp        = useStore(s => s.addApp);
  const historyStore  = useStore(s => s.history) || [];
  const addHistory    = useStore(s => s.addHistory);
  const addInAppNotification = useStore(s => s.addInAppNotification);
  const selectedModel = useStore(s => s.selectedModel);
  const setSelectedModel = useStore(s => s.setSelectedModel);

  const [prompt, setPrompt]           = useState('');
  const [model, setModel]             = useState(selectedModel || 'auto');
  const [mode, setMode]               = useState('build');
  const [running, setRunning]         = useState(false);
  const [result, setResult]           = useState(null);
  const [stages, setStages]           = useState({});
  const [providerLog, setProviderLog] = useState([]);
  const [rightTab, setRightTab]       = useState('timeline');   // 'history'|'timeline'|'preview'|'spec'|'json'|'errors'
  const [attachedFiles, setAttachedFiles]   = useState([]);
  const [attachedImages, setAttachedImages] = useState([]);
  const [isRecording, setIsRecording]       = useState(false);
  const fileRef  = useRef();
  const imageRef = useRef();
  const [autoStartPending, setAutoStartPending] = useState(false);
  const [templateName, setTemplateName] = useState(null);
  const [templateCategory, setTemplateCategory] = useState(null);
  const [previewWide, setPreviewWide] = useState(false);

  useEffect(() => {
    try {
      const openRaw = sessionStorage.getItem('oa_open_project');
      if (openRaw) {
        sessionStorage.removeItem('oa_open_project');
        const data = JSON.parse(openRaw);
        if (data.prompt) setPrompt(data.prompt);
        if (data.intent && data.schema && data.appSpec) {
          setResult({
            status: 'complete',
            projectId: data.projectId,
            intent: data.intent,
            schema: data.schema,
            appSpec: data.appSpec,
            validations: {},
            repairLogs: [],
            totalCostUSD: 0,
            latency: 0,
          });
          setRightTab('preview');
          return;
        }
        if (data.needsGeneration) {
          setAutoStartPending(true);
          return;
        }
      }

      const templateRaw = sessionStorage.getItem('oa_selected_template');
      if (templateRaw) {
        sessionStorage.removeItem('oa_selected_template');
        const tpl = JSON.parse(templateRaw);
        if (tpl.templateName) setTemplateName(tpl.templateName);
        if (tpl.templateCategory) setTemplateCategory(tpl.templateCategory);
        if (tpl.model) setModel(tpl.model);
        if (tpl.mode) setMode(tpl.mode);
        setPrompt('');
        setResult(null);
        setRightTab('timeline');
        return;
      }

      const raw = sessionStorage.getItem('oa_pending_generation');
      if (!raw) return;
      sessionStorage.removeItem('oa_pending_generation');
      const data = JSON.parse(raw);
      if (data.prompt) setPrompt(data.prompt);
      if (data.model) setModel(data.model);
      if (data.mode) setMode(data.mode);
      if (data.autoStart && data.prompt?.trim()) setAutoStartPending(true);
    } catch {}
  }, []);

  useEffect(() => { setSelectedModel(model); }, [model, setSelectedModel]);

  const prevTemplateRef = useRef(templateName);
  // Switching templates must not keep the previous app's preview
  useEffect(() => {
    if (templateName && prevTemplateRef.current !== templateName) {
      setResult(null);
      setStages({});
      setPreviewWide(false);
    }
    prevTemplateRef.current = templateName;
  }, [templateName]);

  const clearTemplate = () => {
    setTemplateName(null);
    setPrompt(p => p.replace(/^\[Template:\s*.+?\]\s*/i, '').trimStart());
  };

  const handleProgress = useCallback(evt => {
    setStages(prev => ({
      ...prev,
      [evt.stage]: { ...prev[evt.stage], status:evt.status, message:evt.message, data:evt.data, latency:evt.latency },
    }));
    if (evt.attempted?.length) {
      setProviderLog(prev => {
        const seen = new Set(prev.map(p=>`${p.provider}/${p.model}`));
        return [...prev, ...evt.attempted.filter(a=>!seen.has(`${a.provider}/${a.model}`))];
      });
    } else if (evt.provider) {
      setProviderLog(prev => [...prev, evt.provider]);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || running) return;
    setRunning(true); setResult(null); setStages({}); setProviderLog([]);
    setRightTab('timeline');
    let res;
    try {
      res = await generateWithSSE(prompt.trim(), providerKeys || {}, handleProgress, {
        templateName,
        templateCategory,
        mode,
        orgPlan: activeOrgPlan,
      });
    } catch (err) {
      res = { status: 'error', error: err?.message || 'Generation failed unexpectedly.' };
    } finally {
      setRunning(false);
    }
    if (res?.status === 'plan_complete') {
      setResult(res);
      setRightTab('plan');
      setPreviewWide(true);
      return;
    }

    const appSlug = (res.intent?.appName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'app';
    const projectId = res?.status === 'complete' ? `app_${appSlug}` : null;
    const finalRes = projectId ? {
      ...res,
      projectId,
      intent: {
        ...(res.intent || {}),
        templateName: templateName || res.intent?.templateName,
        templateCategory: templateCategory || res.intent?.templateCategory,
      },
    } : res;
    setResult(finalRes);
    if (res?.status === 'complete' && projectId) {
      setRightTab('spec');
      setPreviewWide(true);
      const appName = res.intent?.appName || 'Untitled';
      const subdomain = getAppSubdomain({ name: appName });
      addApp({
        id: projectId,
        name: appName,
        prompt: prompt.trim(),
        templateName: templateName || res.intent?.templateName || null,
        templateCategory: templateCategory || res.intent?.templateCategory || null,
        appType: res.intent?.appType || 'custom',
        tagline: res.intent?.tagline || '',
        createdAt: new Date().toISOString(),
        updatedAt: Date.now(),
        intent: res.intent,
        schema: res.schema,
        appSpec: res.appSpec,
        validations: res.validations,
        costLog: res.costLog,
        repairLogs: res.repairLogs,
        totalCostUSD: res.totalCostUSD,
        latency: res.latency,
        status: 'live',
        subdomain,
        localEngine: !!res.localEngine,
      });
      addHistory({
        appName,
        prompt: prompt.trim(),
        latency: res.latency,
        totalCostUSD: res.totalCostUSD,
        repairCount: (res.repairLogs || []).length,
        status: 'complete',
      });
      addInAppNotification({
        type: 'generation_complete',
        title: 'App build complete',
        message: `"${appName}" is ready — open Preview or Deployments to view it.`,
      });
      sendAppNotification('generation_complete', { appName });
      syncProjectToDb(
        { id: projectId, name: appName, prompt: prompt.trim(), appType: res.intent?.appType, status: 'live', intent: res.intent, schema: res.schema, appSpec: res.appSpec },
        activeOrgId || 'default-org',
      );
    } else if (res?.status === 'error') {
      setRightTab('errors');
    }
  }, [prompt, running, providerKeys, handleProgress, addApp, addHistory, addInAppNotification, templateName, templateCategory, mode, activeOrgPlan, activeOrgId]);

  const buildFromPlan = useCallback(() => {
    setMode('build');
    setTimeout(() => handleGenerate(), 0);
  }, [handleGenerate]);

  useEffect(() => {
    if (autoStartPending && prompt.trim() && !running) {
      setAutoStartPending(false);
      handleGenerate();
    }
  }, [autoStartPending, prompt, running, handleGenerate]);

  const speechRef = useRef(null);

  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addInAppNotification({
        type: 'info',
        title: 'Voice input unavailable',
        message: 'Your browser does not support speech recognition. Type your prompt instead.',
      });
      return;
    }
    if (isRecording) {
      speechRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    speechRef.current = rec;
    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      if (text) setPrompt(p => (p ? `${p} ${text}` : text));
      setIsRecording(false);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    rec.start();
    setIsRecording(true);
  };

  const hasPreviewResult = result?.status === 'complete' && result?.appSpec;
  const hasBuildResult = result?.status === 'complete' && (result?.appSpec || result?.schema);
  const specAppSpec = result?.appSpec || { pages: [], apiEndpoints: [], workflowStubs: [] };
  const hasPlanResult = result?.status === 'plan_complete';
  const hasResult = hasBuildResult || hasPlanResult;
  const appName   = result?.intent?.appName || 'app';

  const RIGHT_TABS = [
    { id:'history',  icon:History,  label:'History' },
    { id:'timeline', icon:Zap,      label:'Timeline' },
    { id:'plan',     icon:Layout,   label:'Plan',     disabled:!hasPlanResult },
    { id:'preview',  icon:Eye,      label:'Preview',  disabled:!hasPreviewResult },
    { id:'spec',     icon:FileCode, label:'AppSpec',  disabled:!hasBuildResult },
    { id:'json',     icon:Code2,    label:'JSON',     disabled:!hasBuildResult },
    { id:'errors',   icon:AlertCircle, label:'Errors' },
  ];

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'#F5F5EE' }}>
      {/* ── Left: Prompt area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b" style={{ background:'#FFFFFF', borderColor:'#E5E7EB' }}>
          <div>
            <h1 className="font-bold text-base" style={{ color:'#111111' }}>Build</h1>
            <p className="text-xs" style={{ color:'#9CA3AF' }}>
              {templateName
                ? (
                  <>
                    Template: <strong style={{ color:'#FF6600' }}>{templateName}</strong>
                    {templateCategory ? ` (${templateCategory})` : ''} — layout & colors from this template. Describe your app below, then click Build.
                    {(() => {
                      const vis = getTemplateVisual(templateName, templateCategory);
                      return (
                        <span className="inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: vis.surface, color: vis.primary, border: `1px solid ${vis.primary}44` }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: vis.primary }} /> Theme
                        </span>
                      );
                    })()}
                    <button type="button" onClick={clearTemplate} className="ml-2 underline" style={{ color:'#6B7280' }}>Clear</button>
                  </>
                )
                : 'Describe your app — OneAtlas handles the rest'}
            </p>
          </div>
          {hasResult && (
            <div className="flex items-center gap-3 text-xs" style={{ color:'#9CA3AF' }}>
              <span className="flex items-center gap-1"><Clock size={11}/>{((result.latency||0)/1000).toFixed(1)}s</span>
              <span className="flex items-center gap-1"><DollarSign size={11}/>${(result.totalCostUSD||0).toFixed(5)}</span>
              {(result.repairLogs||[]).length > 0 && <span className="flex items-center gap-1" style={{ color:'#F59E0B' }}><Wrench size={11}/>{result.repairLogs.length} repair{result.repairLogs.length!==1?'s':''}</span>}
              <span className="flex items-center gap-1" style={{ color:'#10B981' }}><CheckCircle2 size={11}/> Saved</span>
              {result.localEngine && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background:'#FEF3C7', color:'#B45309', fontSize:10, fontWeight:700 }}>Local engine</span>
              )}
              {!result.localEngine && (result.totalCostUSD || 0) > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background:'#ECFDF5', color:'#059669', fontSize:10, fontWeight:700 }}>AI powered</span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* ── Prompt box ── */}
          <div className="rounded-2xl border shadow-card" style={{ background:'#FFFFFF', borderColor:'#E5E7EB', borderRadius:24 }}>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if((e.metaKey||e.ctrlKey)&&e.key==='Enter') handleGenerate(); }}
              placeholder={templateName
                ? `Describe what to build with the "${templateName}" template… e.g. "CRM for a dental clinic with appointments, patient records, and SMS reminders."`
                : 'Describe your app… e.g. "Build a CRM for a real estate agency. Agents manage leads, properties and deals. Admin sees analytics. WhatsApp notification when a deal closes."'}
              className="w-full h-24 text-sm resize-none bg-transparent px-5 pt-5 focus:outline-none"
              style={{ color:'#111111' }}/>

            {/* Attachments */}
            {(attachedFiles.length > 0 || attachedImages.length > 0) && (
              <div className="px-5 flex flex-wrap gap-2 mb-2">
                {attachedFiles.map((f,i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs"
                    style={{ background:'#F9F9F6', borderColor:'#E5E7EB', color:'#6B7280' }}>
                    <Paperclip size={10}/> {f.name}
                    <button onClick={()=>setAttachedFiles(p=>p.filter((_,j)=>j!==i))} style={{ color:'#9CA3AF' }}><X size={9}/></button>
                  </span>
                ))}
                {attachedImages.map((f,i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs"
                    style={{ background:'#FFF3EB', borderColor:'#FFD0A6', color:'#FF6600' }}>
                    <Image size={10}/> {f.name}
                    <button onClick={()=>setAttachedImages(p=>p.filter((_,j)=>j!==i))} style={{ color:'#FF9966' }}><X size={9}/></button>
                  </span>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-t flex-wrap gap-2" style={{ borderColor:'#ECECEC' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <input ref={fileRef} type="file" multiple className="hidden" onChange={e=>{ setAttachedFiles(p=>[...p,...Array.from(e.target.files||[]).map(f=>({name:f.name}))]); e.target.value=''; }}/>
                <button onClick={()=>fileRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all"
                  style={{ background:'#FFFFFF', borderColor:'#E5E7EB', color:'#6B7280' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#D1D5DB';e.currentTarget.style.color='#111111';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#6B7280';}}>
                  <Paperclip size={12}/> File
                </button>
                <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>{ setAttachedImages(p=>[...p,...Array.from(e.target.files||[]).map(f=>({name:f.name}))]); e.target.value=''; }}/>
                <button onClick={()=>imageRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all"
                  style={{ background:'#FFFFFF', borderColor:'#E5E7EB', color:'#6B7280' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#D1D5DB';e.currentTarget.style.color='#111111';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#6B7280';}}>
                  <Image size={12}/> Image
                </button>
                <div className="flex rounded-xl border overflow-hidden" style={{ borderColor:'#E5E7EB' }}>
                  {['build','plan'].map(m=>(
                    <button key={m} onClick={()=>setMode(m)}
                      className="px-3 py-1.5 text-xs font-bold capitalize"
                      style={{ background:mode===m?'#111111':'#FFFFFF', color:mode===m?'#FFFFFF':'#6B7280' }}>
                      {m}
                    </button>
                  ))}
                </div>
                <ModelPicker value={model} onChange={setModel}/>
                <span className="text-xs" style={{ color:'#D1D5DB' }}>{prompt.length}/4000</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleRecording}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border transition-all"
                  style={{ background:isRecording?'#FEE2E2':'#FFFFFF', borderColor:isRecording?'#FCA5A5':'#E5E7EB' }}>
                  {isRecording ? <MicOff size={13} style={{ color:'#EF4444' }} className="recording"/> : <Mic size={13} style={{ color:'#9CA3AF' }}/>}
                </button>
                <button onClick={handleGenerate} disabled={running||!prompt.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm font-bold transition-all"
                  style={{
                    background: running || !prompt.trim() ? '#D1D5DB' : (mode === 'plan' ? '#111111' : '#FF6600'),
                    cursor: running || !prompt.trim() ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e=>{ if(!running&&prompt.trim()) e.currentTarget.style.background=mode==='plan'?'#333':'#E65C00'; }}
                  onMouseLeave={e=>{ if(!running&&prompt.trim()) e.currentTarget.style.background=mode==='plan'?'#111111':'#FF6600'; }}>
                  {running ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                  {running ? (mode === 'plan' ? 'Planning…' : 'Generating…') : (mode === 'plan' ? 'Plan' : 'Build')}
                  {!running && <span className="text-[10px] opacity-50">⌘↵</span>}
                </button>
              </div>
            </div>
          </div>

          {/* ── 6 Category Cards ── */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={()=>setPrompt(CATEGORY_PROMPTS[cat.id] || `Build a ${cat.label}`)}
                className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border transition-all"
                style={{ background:'#FFFFFF', borderColor:'#E5E7EB', borderRadius:16 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.transform='translateY(0)';}}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:`${cat.color}18` }}>
                  <cat.icon size={14} style={{ color:cat.color }}/>
                </div>
                <span className="text-[11px] font-bold text-center leading-tight" style={{ color:'#111111' }}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* ── 6 Chips ── */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold" style={{ color:'#9CA3AF' }}>Try:</span>
            {Object.keys(CHIP_PROMPTS).map(label => (
              <button key={label} onClick={() => setPrompt(CHIP_PROMPTS[label])}
                className="px-3 py-1.5 rounded-full border text-xs font-semibold transition-all"
                style={{ background:'#FFFFFF', borderColor:'#E5E7EB', color:'#6B7280' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#FF6600';e.currentTarget.style.color='#FF6600';e.currentTarget.style.background='#FFF3EB';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#6B7280';e.currentTarget.style.background='#FFFFFF';}}
                title={CHIP_PROMPTS[label]}>
                {label}
              </button>
            ))}
          </div>

          {/* Clarification */}
          {result?.status === 'complete' && (result.intent?.integrations_requested?.length > 0 || result.appSpec?.integrationHooks?.length > 0) && (
            <div className="p-4 rounded-2xl border flex flex-wrap items-center gap-2" style={{ background:'#F0FDF4', borderColor:'#86EFAC' }}>
              <Plug size={14} style={{ color:'#16A34A' }}/>
              <span className="text-xs font-bold" style={{ color:'#166534' }}>Integrations in this app:</span>
              {[...new Set([
                ...(result.intent?.integrations_requested || []),
                ...(result.appSpec?.integrationHooks || []).map(h => h.integration),
              ])].map(id => (
                <span key={id} className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background:'#DCFCE7', color:'#15803D' }}>{id}</span>
              ))}
              <Link to="/app/integrations" className="text-[10px] font-bold ml-auto" style={{ color:'#FF6600' }}>Add keys →</Link>
              {result.intent?.integrations_requested?.includes('stripe') && (
                <span className="text-[10px] w-full" style={{ color:'#166534' }}>Open Preview → sidebar <strong>Payments</strong> after build.</span>
              )}
            </div>
          )}

          {result?.status === 'clarification_required' && (
            <div className="p-4 rounded-2xl border" style={{ background:'#FFFBEB', borderColor:'#FDE68A' }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} style={{ color:'#F59E0B' }}/>
                <span className="text-sm font-bold" style={{ color:'#92400E' }}>Clarification Needed</span>
              </div>
              <p className="text-sm" style={{ color:'#92400E' }}>{result.clarificationQuestion}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: all 6 feature panels ── */}
      <div className={previewWide || ['preview','spec','json','plan'].includes(rightTab) ? 'w-[min(52vw,780px)]' : 'w-80'} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #E5E7EB', background:'#FFFFFF' }}>
        {/* Tab bar */}
        <div className="flex border-b overflow-x-auto flex-shrink-0" style={{ borderColor:'#E5E7EB' }}>
          {RIGHT_TABS.map(t => (
            <button key={t.id} onClick={()=>!t.disabled&&setRightTab(t.id)} title={t.label}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 border-b-2 transition-all min-w-0"
              style={{
                borderColor: rightTab===t.id?'#FF6600':'transparent',
                color: rightTab===t.id?'#FF6600':t.disabled?'#D1D5DB':'#9CA3AF',
                cursor: t.disabled?'not-allowed':'pointer',
                opacity: t.disabled?0.4:1,
              }}>
              <t.icon size={13}/>
              <span className="text-[9px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 1. Prompt History */}
          {rightTab === 'history' && (
            <PromptHistory history={historyStore} onSelect={(p)=>{ setPrompt(p); setRightTab('timeline'); }}/>
          )}

          {/* 2+3. Generation Timeline + Stage Progress */}
          {rightTab === 'timeline' && (
            <div className="flex-1 overflow-auto">
              {!running && !Object.keys(stages).length ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Play size={28} style={{ color:'#D1D5DB', marginBottom:8 }}/>
                  <p className="text-xs font-semibold" style={{ color:'#9CA3AF' }}>Ready to generate</p>
                  <p className="text-xs mt-1" style={{ color:'#C4C4BC' }}>Stage progress appears here in real time</p>
                </div>
              ) : (
                <GenerationTimeline stages={stages} providerLog={providerLog} running={running}/>
              )}
            </div>
          )}

          {/* 4. Live Preview */}
          {rightTab === 'plan' && hasPlanResult && (
            <PlanViewer plan={result.plan} intent={result.intent} schema={result.schema} onBuild={buildFromPlan} />
          )}

          {rightTab === 'preview' && hasPreviewResult && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="shrink-0 flex justify-end px-2 py-1.5 border-b" style={{ borderColor:'#ECECEC' }}>
                <button type="button" onClick={() => navigate(`/app/preview/${result.projectId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background:'#FFF3EB', color:'#FF6600', border:'1px solid #FFD0A6' }}>
                  <Maximize2 size={12}/> Open fullscreen
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <LivePreview intent={result.intent} appSpec={result.appSpec} schema={result.schema} projectId={result.projectId}
                  templateName={templateName} templateCategory={templateCategory}/>
              </div>
            </div>
          )}

          {/* 5. AppSpec Viewer */}
          {rightTab === 'spec' && hasBuildResult && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <SpecViewer intent={result.intent} schema={result.schema} appSpec={specAppSpec}/>
            </div>
          )}

          {/* JSON Output */}
          {rightTab === 'json' && hasBuildResult && (
            <div className="flex-1 overflow-auto p-4">
              <div className="p-3 rounded-xl border mb-3" style={{ background:'#FFF3EB', borderColor:'#FFD0A6' }}>
                <p className="text-xs font-semibold" style={{ color:'#C05500' }}>3 JSON artifacts — one per pipeline stage</p>
              </div>
              <JsonViewer data={result.intent}  filename={`${appName}-intent.json`}/>
              <JsonViewer data={result.schema}  filename={`${appName}-schema.json`}/>
              <JsonViewer data={result.appSpec} filename={`${appName}-appspec.json`}/>
            </div>
          )}

          {/* 6. Error Diagnostics */}
          {rightTab === 'errors' && (
            <ErrorDiagnostics result={result}/>
          )}
        </div>
      </div>
    </div>
  );
}
