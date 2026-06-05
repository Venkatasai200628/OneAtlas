
import clsx from 'clsx';
import {
  Layers, Globe, GitBranch, Plug, Wrench, Shield, Database,
  CheckCircle2, XCircle, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { INTEGRATION_REGISTRY } from '@/lib/integrationRegistry';

function Section({ title, icon: Icon, children, badge }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function AppOperatorPanel({ intent, schema, appSpec, repairLogs = [], validations = {} }) {
  const pages = appSpec?.pages || [];
  const endpoints = appSpec?.apiEndpoints || [];
  const workflows = appSpec?.workflowStubs || [];
  const hooks = appSpec?.integrationHooks || [];
  const entities = schema?.entities || [];

  const repairs = repairLogs || [];
  const authRoles = appSpec?.authRules?.roles || appSpec?.authRules || [];

  return (
    <div className="h-full overflow-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-900">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{intent?.appName || 'Your application'}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          This is how your app is structured — screens users see, data it stores, and automations that run when events happen.
          Developers use the JSON export; this panel is the human-readable blueprint.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: 'Data tables', value: entities.length, sub: 'entities with tenantId' },
          { label: 'Screens', value: pages.length, sub: 'pages & dashboards' },
          { label: 'Automations', value: workflows.length + hooks.length, sub: 'workflows + hooks' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">{c.label}</p>
            <p className="text-[10px] text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      <Section title="Screens & navigation" icon={Layers}>
        <div className="space-y-2">
          {pages.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.name}</p>
                <p className="text-xs text-slate-500">{p.route} · {p.layout} layout{p.boundEntity ? ` · manages ${p.boundEntity}` : ''}</p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                {p.layout}
              </span>
            </div>
          ))}
          {pages.length === 0 && <p className="text-sm text-slate-400">No pages defined.</p>}
        </div>
      </Section>

      <Section title="API endpoints" icon={Globe} badge={
        <span className="text-[10px] text-slate-400">{endpoints.length} routes</span>
      }>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <th className="text-left py-2 font-semibold">Method</th>
              <th className="text-left py-2 font-semibold">Path</th>
              <th className="text-left py-2 font-semibold">Purpose</th>
              <th className="text-left py-2 font-semibold">Auth</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                <td className="py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{ep.method}</td>
                <td className="py-2.5 font-mono text-slate-700 dark:text-slate-300">{ep.path}</td>
                <td className="py-2.5 text-slate-500 max-w-[200px] truncate">{ep.description || ep.boundEntity || '—'}</td>
                <td className="py-2.5">{ep.authRequired ? <span className="text-amber-600">Required</span> : <span className="text-slate-400">Public</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Data model" icon={Database}>
        <div className="space-y-3">
          {entities.map(ent => (
            <div key={ent.name}>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{ent.name} <span className="text-slate-400 font-normal font-mono text-xs">({ent.tableName})</span></p>
              <p className="text-xs text-slate-500 mt-1">
                {(ent.fields || []).slice(0, 8).map(f => f.name).join(', ')}
                {(ent.fields || []).length > 8 ? '…' : ''}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {(workflows.length > 0 || hooks.length > 0) && (
        <Section title="Automations & integrations" icon={GitBranch}>
          <div className="space-y-3">
            {workflows.map((w, i) => (
              <div key={`w-${i}`} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{w.name}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                  When <strong>{w.trigger?.entity}</strong> is {w.trigger?.event}
                  {w.trigger?.condition && <span className="text-amber-600"> ({w.trigger.condition})</span>}
                  <ArrowRight size={10} className="text-slate-400" />
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {INTEGRATION_REGISTRY[w.integration]?.displayName || w.integration} → {w.action}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Configure API keys in Settings → Integrations to execute this in production.
                </p>
              </div>
            ))}
            {hooks.map((h, i) => (
              <div key={`h-${i}`} className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-600 text-xs text-slate-500">
                Hook: {h.integrationId || h.integration} / {h.action} on {h.trigger?.entity} {h.trigger?.event}
              </div>
            ))}
          </div>
        </Section>
      )}

      {Array.isArray(authRoles) && authRoles.length > 0 && (
        <Section title="Roles & permissions" icon={Shield}>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(authRoles) ? authRoles : []).map((r, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-medium">
                {r.name || r.role || r}
              </span>
            ))}
          </div>
        </Section>
      )}

      {repairs.length > 0 && (
        <Section title="Repair engine activity" icon={Wrench} badge={
          <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
            {repairs.length} fix{repairs.length !== 1 ? 'es' : ''}
          </span>
        }>
          <p className="text-xs text-slate-500 mb-3">
            When the AI returned invalid JSON or broken references, the repair engine applied targeted fixes (not blind retries).
          </p>
          <div className="space-y-2">
            {repairs.map((r, i) => (
              <div key={i} className={clsx(
                'flex items-start gap-3 p-3 rounded-lg border text-xs',
                r.outcome === 'repaired' || r.outcome === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'
                  : r.outcome === 'escalated' || r.outcome === 'failed'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
              )}>
                {r.outcome === 'repaired' || r.outcome === 'success'
                  ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  : r.outcome === 'failed'
                    ? <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    : <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                    {r.strategy || 'repair'} · {r.outcome || 'unknown'}
                    {r.stage && <span className="text-slate-400 font-normal normal-case ml-2">@ {r.stage}</span>}
                  </p>
                  {r.fixes?.length > 0 && <p className="text-slate-600 dark:text-slate-400 mt-0.5">{r.fixes.join(' · ')}</p>}
                  {r.reason && <p className="text-slate-400 italic mt-0.5">{r.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(validations).length > 0 && (
        <Section title="Validation summary" icon={CheckCircle2}>
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            {Object.entries(validations).map(([stage, v]) => (
              <div key={stage} className={clsx(
                'p-2.5 rounded-lg border',
                v?.isValid ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20',
              )}>
                <p className="font-bold capitalize">{stage.replace(/_/g, ' ')}</p>
                <p className="text-slate-500">{v?.errors?.length || 0} errors · {v?.warnings?.length || 0} warnings</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
