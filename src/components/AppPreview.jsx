
import { useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, Briefcase, ShoppingBag, Package, BarChart2,
  Settings, DollarSign, TrendingUp, Search, Plus, Home, FileText,
  Tag, Inbox, X, Trash2, Sun, Moon, Menu,
} from 'lucide-react';
import clsx from 'clsx';
import { resolveDesignSystem } from '../../lib/designSystem.js';

const ICONS = {
  dashboard:LayoutDashboard, home:Home, overview:LayoutDashboard,
  users:Users, user:Users, customers:Users, customer:Users, clients:Users,
  client:Users, leads:Users, lead:Users, contacts:Users, contact:Users,
  agents:Users, agent:Users, employees:Users, employee:Users, staff:Users,
  deals:Briefcase, deal:Briefcase, opportunities:Briefcase, pipeline:Briefcase,
  orders:ShoppingBag, order:ShoppingBag, sales:ShoppingBag, purchases:ShoppingBag,
  products:Package, product:Package, inventory:Package, items:Package, catalog:Package,
  analytics:BarChart2, reports:BarChart2, stats:BarChart2, metrics:BarChart2,
  settings:Settings, config:Settings,
  dollar:DollarSign, revenue:DollarSign, finance:DollarSign, billing:DollarSign,
  trending:TrendingUp, growth:TrendingUp,
  tasks:FileText, task:FileText, projects:FileText, project:FileText, tickets:FileText,
  properties:Home, property:Home, listings:Home, listing:Home, assets:Home,
  inbox:Inbox, messages:Inbox, notifications:Inbox,
  drone:Package, drones:Package, fleet:Package, mission:FileText, missions:FileText,
  maintenance:Settings, incidents:Inbox, deliveries:ShoppingBag, delivery:ShoppingBag,
  default:Tag,
};
function getIcon(key = '') {
  const k = String(key).toLowerCase().replace(/\s+/g, '').replace(/s$/, '');
  return ICONS[k + 's'] || ICONS[k] || ICONS.default;
}

const STATUS_MAP = {
  active:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800',
  enabled:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800',
  approved:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800',
  completed:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800',
  won:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800',
  closed_won:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800',
  paid:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800',
  published:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800',
  new:'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-900/20 dark:border-sky-800',
  open:'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800',
  lead:'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800',
  prospect:'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800',
  contacted:'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-800',
  qualified:'text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-900/20 dark:border-violet-800',
  proposal:'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800',
  negotiation:'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800',
  pending:'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800',
  in_progress:'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800',
  review:'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800',
  inactive:'text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
  closed:'text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
  lost:'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
  closed_lost:'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
  cancelled:'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
  rejected:'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
};
const STATUS_NAMES = new Set(['status','stage','state','type','priority','phase']);
function isStatusField(name) { return STATUS_NAMES.has(String(name).toLowerCase()); }
function StatusBadge({ value }) {
  const key = String(value ?? '').toLowerCase().replace(/[\s-]/g, '_');
  const cls = STATUS_MAP[key] || 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
  return <span className={clsx('text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap', cls)}>{String(value)}</span>;
}

// ── Field formatting ───────────────────────────────────────────────────────────
const MONEY_PATTERN = /amount|value|price|revenue|cost|salary|budget|total|fee|billing|mrr|arr/i;
const DATE_PATTERN  = /createdat|updatedat|date|time|at$/i;

function formatCell(val, fieldName) {
  if (val === null || val === undefined) return <span className="text-slate-300 dark:text-slate-600">—</span>;
  if (isStatusField(fieldName)) return <StatusBadge value={val}/>;
  if (MONEY_PATTERN.test(fieldName || '')) {
    const n = Number(val); if (!isNaN(n)) return '$' + n.toLocaleString();
  }
  if (DATE_PATTERN.test(fieldName || '')) {
    try { return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch {}
  }
  if (typeof val === 'boolean') return val
    ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">Yes</span>
    : <span className="text-slate-400 dark:text-slate-500">No</span>;
  if (typeof val === 'object') return <span className="text-slate-400 dark:text-slate-500 text-xs italic">object</span>;
  const s = String(val);
  return s.length > 38 ? s.slice(0, 38) + '…' : s;
}

// ── Add Item Modal ─────────────────────────────────────────────────────────────
const SYSTEM_FIELDS = new Set(['id', 'tenantId', 'createdAt', 'updatedAt', 'deletedAt', 'passwordHash']);

function AddItemModal({ entityName, schema, onAdd, onClose, embedded = false }) {
  const entity = schema?.entities?.find(e => e.name === entityName);
  const editableFields = useMemo(() => (entity?.fields || []).filter(f => !SYSTEM_FIELDS.has(f.name)), [entity]);

  const [form, setForm] = useState(() => {
    const init = {};
    editableFields.forEach(f => {
      if (f.type === 'boolean') init[f.name] = false;
      else if (f.type === 'enum' && f.enumValues?.length) init[f.name] = f.enumValues[0];
      else init[f.name] = '';
    });
    return init;
  });

  const handleSubmit = () => {
    const record = {
      id: `preview-${Date.now()}`,
      tenantId: 'tenant-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...form,
    };
    editableFields.forEach(f => {
      if ((f.type === 'number' || f.type === 'decimal' || f.type === 'integer') && record[f.name] !== '') {
        const n = Number(record[f.name]);
        if (!isNaN(n)) record[f.name] = n;
      }
    });
    onAdd(record);
    onClose();
  };

  const labelFor = (name) => name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

  const panel = (
      <div className={clsx('bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full flex flex-col border border-slate-200 dark:border-slate-700', embedded ? 'max-w-2xl' : 'max-w-lg max-h-[80vh]')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add {entityName}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Fill in the fields below to add a record</p>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={16}/>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {editableFields.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No editable fields found for this entity.</p>
          ) : (
            editableFields.map(field => (
              <div key={field.name}>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {labelFor(field.name)}
                  {field.nullable === false && <span className="text-red-400 ml-1">*</span>}
                  <span className="ml-1.5 text-[10px] text-slate-300 dark:text-slate-600 font-normal">{field.type}</span>
                </label>
                {field.type === 'enum' && Array.isArray(field.enumValues) ? (
                  <select value={form[field.name]} onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 text-slate-800 dark:text-slate-200">
                    {field.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : field.type === 'boolean' ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setForm({ ...form, [field.name]: !form[field.name] })}
                      className={clsx(
                        'relative w-10 h-5 rounded-full transition-colors',
                        form[field.name] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600',
                      )}>
                      <span className={clsx(
                        'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                        form[field.name] && 'translate-x-5',
                      )}/>
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{form[field.name] ? 'Yes' : 'No'}</span>
                  </div>
                ) : (field.type === 'number' || field.type === 'decimal' || field.type === 'integer') ? (
                  <input type="number" value={form[field.name]}
                    onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder={`Enter ${field.name}…`}/>
                ) : (
                  <input type="text" value={form[field.name]}
                    onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder={`Enter ${field.name}…`}/>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900">
            Add {entityName}
          </button>
        </div>
      </div>
  );
  if (embedded) return <div className="w-full">{panel}</div>;
  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
      {panel}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function matchFilter(r, filter) {
  const [k, v] = filter.split('=');
  return String(r?.[k] ?? '').toLowerCase() === String(v).toLowerCase();
}

function StatCard({ stat, sampleData }) {
  const Icon = getIcon(stat.icon || stat.label);
  const records = sampleData[stat.valueKey] || [];
  let value = '—';
  try {
    if (stat.format === 'count') {
      value = stat.filter ? records.filter(r => matchFilter(r, stat.filter)).length : records.length;
    } else {
      const filtered = stat.filter ? records.filter(r => matchFilter(r, stat.filter)) : records;
      const field = stat.field || Object.keys(filtered[0] || {}).find(k => MONEY_PATTERN.test(k)) || 'amount';
      const sum = filtered.reduce((a, r) => a + (Number(r?.[field]) || 0), 0);
      value = '$' + sum.toLocaleString();
    }
  } catch {}
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-5 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-indigo-600 dark:text-indigo-400"/>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function DashboardView({ appSpec, sampleData }) {
  const stats = appSpec.appPreview?.dashboardStats || [];
  const skip = new Set(['user','tenant','role','permission','setting','config']);
  const [mainKey, mainRecords] = useMemo(() => {
    const candidates = Object.entries(sampleData)
      .filter(([k]) => !skip.has(k.toLowerCase()))
      .sort((a, b) => b[1].length - a[1].length);
    return candidates[0] || [null, []];
  }, [sampleData]);

  const recent = (mainRecords || []).slice(0, 5);
  const cols = useMemo(() => {
    if (!recent[0]) return [];
    return Object.keys(recent[0]).filter(k => !['id','tenantId','createdAt','updatedAt','passwordHash'].includes(k)).slice(0, 4);
  }, [recent]);
  const nameCol  = cols[0];
  const subCol   = cols.find(c => ['email','phone','company','source','owner','agent','assignee'].includes(c.toLowerCase()));
  const moneyCol = cols.find(c => MONEY_PATTERN.test(c));
  const statCol  = cols.find(c => isStatusField(c));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {appSpec.pages?.find(p => p.layout === 'dashboard')?.description || 'Overview of your application'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.length > 0
          ? stats.map((s, i) => <StatCard key={i} stat={s} sampleData={sampleData}/>)
          : Object.entries(sampleData).slice(0, 4).map(([name], i) => (
            <StatCard key={i} stat={{ label: name.toUpperCase() + 'S', valueKey: name, icon: name.toLowerCase(), format: 'count' }} sampleData={sampleData}/>
          ))
        }
      </div>
      {mainKey && recent.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent {mainKey}s</h2>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">View all</button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {recent.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{nameCol ? String(item[nameCol] ?? '—') : `Record ${i + 1}`}</p>
                  {subCol && item[subCol] != null && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{String(item[subCol])}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {moneyCol && item[moneyCol] != null && <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCell(item[moneyCol], moneyCol)}</span>}
                  {statCol && item[statCol] != null && <StatusBadge value={item[statCol]}/>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── List view with working Add/Delete ─────────────────────────────────────────
function ListView({ entityName, records, schema, onAdd, onDelete }) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const entity = schema?.entities?.find(e => e.name === entityName);
  const listTitle = entity?.tableName
    ? entity.tableName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : `${entityName}s`;

  const columns = useMemo(() => {
    const skip = ['id','tenantId','createdAt','updatedAt','passwordHash','deletedAt'];
    if (entity?.fields) {
      return entity.fields.filter(f => !skip.includes(f.name) && !f.isRelation).slice(0, 5);
    }
    if (records[0]) return Object.keys(records[0]).filter(k => !skip.includes(k)).slice(0, 5).map(k => ({ name: k, type: 'string' }));
    return [];
  }, [entity, records]);

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter(r => columns.some(c => String(r[c.name] ?? '').toLowerCase().includes(q)));
  }, [records, search, columns]);

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{listTitle}</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{records.length} total · {filtered.length} shown</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900">
          <Plus size={15}/> Add {entityName}
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${entityName.toLowerCase()}s…`}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-300 dark:focus:border-indigo-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"/>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              {columns.map(col => (
                <th key={col.name} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{col.name}</th>
              ))}
              <th className="px-3 py-3.5 w-10"/>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {filtered.map((record, i) => (
              <tr key={record.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors group">
                {columns.map((col, ci) => (
                  <td key={col.name} className={clsx('px-5 py-4',
                    ci === 0 ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  )}>
                    {formatCell(record[col.name], col.name)}
                  </td>
                ))}
                <td className="px-3 py-4">
                  <button
                    onClick={() => onDelete(record.id || i)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-500 transition-all p-1 rounded"
                    title="Delete record">
                    <Trash2 size={13}/>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                  {search ? `No ${entityName.toLowerCase()}s match "${search}"` : `No ${entityName.toLowerCase()}s yet — click "Add ${entityName}" to create one`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddItemModal
          entityName={entityName}
          schema={schema}
          onAdd={rec => onAdd(entityName, rec)}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

// ── Kanban board ─────────────────────────────────────────────────────────────
function KanbanView({ entityName, records, schema, kanbanConfig, onAdd, primaryColor }) {
  const columnField = kanbanConfig?.columnField || 'status';
  const columns = kanbanConfig?.columns || ['todo', 'in_progress', 'done'];
  const label = (c) => String(c).replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());

  const grouped = useMemo(() => {
    const map = Object.fromEntries(columns.map(c => [c, []]));
    records.forEach(r => {
      const key = String(r[columnField] || columns[0]).toLowerCase();
      const col = columns.find(c => c === key) || columns[0];
      map[col].push(r);
    });
    return map;
  }, [records, columns, columnField]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{entityName} Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Drag-style columns by {columnField}</p>
        </div>
        <button onClick={() => onAdd(entityName, {
          id: `preview-${Date.now()}`,
          tenantId: 'tenant-001',
          createdAt: new Date().toISOString(),
          name: 'New item',
          status: columns[0],
          stage: columns[0],
          [columnField]: columns[0],
        })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm"
          style={{ backgroundColor: primaryColor }}>
          <Plus size={15}/> Add
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map(col => (
          <div key={col} className="min-w-[240px] flex-1 bg-slate-100/80 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label(col)}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300">{grouped[col]?.length || 0}</span>
            </div>
            <div className="space-y-2">
              {(grouped[col] || []).map((card, i) => (
                <div key={card.id || i} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{card.name || card.title || `Item ${i + 1}`}</p>
                  {card.priority && <p className="text-[10px] text-slate-400 mt-1 capitalize">{card.priority} priority</p>}
                  {card.value != null && <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>${Number(card.value).toLocaleString()}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline form page ───────────────────────────────────────────────────────────
function FormPageView({ entityName, schema, onAddRecord, primaryColor }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">New {entityName}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Fill in the details below — saved to your live preview data.</p>
      {!saved ? (
        <AddItemModal
          embedded
          entityName={entityName}
          schema={schema}
          onAdd={rec => { onAddRecord(rec); setSaved(true); }}
          onClose={() => {}}
        />
      ) : (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-3">✓ {entityName} saved successfully</p>
          <button type="button" onClick={() => setSaved(false)} className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: primaryColor }}>Add another</button>
        </div>
      )}
    </div>
  );
}

function SettingsView({ appInstanceId, profile, setProfile, theme, setTheme, primaryColor, team, setTeam }) {
  const [memberEmail, setMemberEmail] = useState('');
  const saveProfile = () => {
    try { localStorage.setItem(`oa_app_profile_${appInstanceId}`, JSON.stringify(profile)); } catch {}
    try { localStorage.setItem(`oa_gen_app_theme_${appInstanceId}`, theme); } catch {}
    try { localStorage.setItem(`oa_app_team_${appInstanceId}`, JSON.stringify(team)); } catch {}
  };
  return (
    <div className="p-8 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Profile</h2>
        <label className="block text-xs font-semibold text-slate-500">Display name</label>
        <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white" />
        <label className="block text-xs font-semibold text-slate-500">Email</label>
        <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white" />
      </section>
      <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Appearance</h2>
        <div className="flex gap-2">
          {['light', 'dark'].map(t => (
            <button key={t} type="button" onClick={() => setTheme(t)}
              className={clsx('flex-1 py-2 rounded-xl text-sm font-semibold capitalize border', theme === t ? 'text-white border-transparent' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300')}
              style={theme === t ? { backgroundColor: primaryColor } : {}}>
              {t} mode
            </button>
          ))}
        </div>
      </section>
      <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Team</h2>
        <div className="flex gap-2">
          <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="colleague@company.com"
            className="flex-1 px-3 py-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
          <button type="button" onClick={() => { if (memberEmail.trim()) { setTeam(t => [...t, memberEmail.trim()]); setMemberEmail(''); } }}
            className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>Invite</button>
        </div>
        <ul className="text-xs text-slate-500 space-y-1">{team.map(e => <li key={e}>• {e}</li>)}</ul>
      </section>
      <button type="button" onClick={saveProfile} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>Save settings</button>
    </div>
  );
}

function shortNavLabel(label, max = 10) {
  const s = String(label || '');
  if (s.length <= max) return s;
  const words = s.split(/\s+/);
  if (words.length > 1 && words[0].length <= max) return words[0];
  return s.slice(0, max);
}

function PaymentsView({ records, primaryColor, stripeConfigured }) {
  const rows = records || [];
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stripe integration — checkout and payment intents</p>
      </div>
      <div className={clsx('p-4 rounded-xl border text-sm', stripeConfigured ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 text-amber-800 dark:text-amber-300')}>
        {stripeConfigured
          ? 'Stripe key detected in OneAtlas Integrations — preview simulates charges (no live API call from preview).'
          : 'Add your Stripe secret key (sk_test_…) in Integrations → Stripe, then rebuild an app that mentions Stripe in the prompt.'}
      </div>
      <button type="button" className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm" style={{ backgroundColor: primaryColor }}>
        Test checkout — $24.00
      </button>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold uppercase text-slate-400">Recent payments</div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {rows.length ? rows.map((r, i) => (
            <div key={r.id || i} className="flex justify-between px-5 py-3 text-sm">
              <span className="font-medium text-slate-800 dark:text-slate-200">{r.name || `Payment ${i + 1}`}</span>
              <span className="text-slate-500">${((Number(r.amount) || 0) / 100).toFixed(2)} · {r.status || 'pending'}</span>
            </div>
          )) : (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">No payments yet — connect Stripe to go live.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationsHubView({ hooks, workflows, primaryColor }) {
  const items = [...(hooks || []), ...(workflows || []).map(w => ({ integration: w.integration, action: w.action, entity: w.triggerEntity }))];
  const unique = [...new Map(items.map(i => [i.integration, i])).values()];
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Workflow hooks generated from your build prompt</p>
      {unique.length === 0 ? (
        <p className="text-sm text-slate-400">No integrations — mention Stripe, Slack, or Gmail in your prompt.</p>
      ) : (
        <div className="grid gap-3">
          {unique.map(h => (
            <div key={h.integration} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">{h.integration}</p>
                <p className="text-xs text-slate-500 mt-0.5">{h.action} · {h.entity || 'Record'}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: primaryColor + '22', color: primaryColor }}>Active</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main shell ─────────────────────────────────────────────────────────────────
export default function AppPreview({ intent, appSpec, schema, currentUser = null, appInstanceId = 'default', viewport = 'desktop', integrationKeys = {} }) {
  const isPhone = viewport === 'mobile' || viewport === 'phone';
  const isTablet = viewport === 'tablet';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const storageKey = appInstanceId || 'default';
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(`oa_gen_app_theme_${storageKey}`) || localStorage.getItem('oa_gen_app_theme') || 'light'; } catch { return 'light'; }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(`oa_app_profile_${storageKey}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { name: currentUser?.name || 'You', email: currentUser?.email || 'user@app.local' };
  });
  const [team, setTeam] = useState(() => {
    try { const raw = localStorage.getItem(`oa_app_team_${storageKey}`); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  // Local mutable copy of sampleData so Add/Delete works
  const [localData, setLocalData] = useState(() => {
    const sd = appSpec?.sampleData || {};
    return JSON.parse(JSON.stringify(sd));
  });

  const preview      = appSpec?.appPreview || {};
  const resolvedDesign = useMemo(() => resolveDesignSystem({
    prompt: intent?.tagline || '',
    appType: intent?.appType || 'custom',
    templateName: preview.templateName || intent?.templateName || null,
    templateCategory: preview.templateCategory || intent?.templateCategory || null,
    appName: intent?.appName || 'App',
  }), [intent, preview.templateName, preview.templateCategory]);
  const primaryColor = preview.primaryColor || resolvedDesign.primaryColor || '#6366f1';
  const surfaceColor = preview.surfaceColor || resolvedDesign.surfaceColor;

  const handleAdd = (entityName, record) => {
    setLocalData(prev => ({
      ...prev,
      [entityName]: [record, ...(prev[entityName] || [])],
    }));
  };

  const handleDelete = (entityName, idOrIndex) => {
    setLocalData(prev => {
      const list = prev[entityName] || [];
      const newList = typeof idOrIndex === 'number' && idOrIndex < list.length && !list[idOrIndex]?.id?.startsWith('preview-')
        ? list.filter((_, i) => i !== idOrIndex)
        : list.filter(r => r.id !== idOrIndex);
      return { ...prev, [entityName]: newList };
    });
  };

  // Build sidebar
  const sidebar = useMemo(() => {
    const raw = preview.sidebar;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    const pages = (appSpec?.pages || []).filter(p => !p.route?.includes(':'));
    if (pages.length > 0) return pages.slice(0, 6).map(p => ({
      label: p.name, route: p.route, icon: (p.boundEntity || p.name).toLowerCase()
    }));
    const keys = Object.keys(localData).slice(0, 5);
    return [
      { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
      ...keys.map(k => ({ label: k + 's', route: '/' + k.toLowerCase() + 's', icon: k.toLowerCase() })),
    ];
  }, [preview.sidebar, appSpec?.pages, localData]);

  const defaultRoute = preview.defaultRoute || sidebar[0]?.route || '/';
  const [activePage, setActivePage] = useState(defaultRoute);
  const isSettings = activePage === '__settings__';
  const isPaymentsPage = activePage === '/payments';
  const isIntegrationsPage = activePage === '/notifications';
  const activeItem = sidebar.find(s => s.route === activePage) || sidebar[0];
  const stripeRaw = integrationKeys?.stripe;
  const stripeKey = typeof stripeRaw === 'string'
    ? stripeRaw
    : stripeRaw?.secretKey || stripeRaw?.apiKey;
  const stripeConfigured = !!(String(stripeKey || '').trim() || stripeRaw?.publishableKey);

  const activePageDef = useMemo(() => (appSpec?.pages || []).find(p => p.route === activePage), [activePage, appSpec?.pages]);
  const pageLayout = activePageDef?.layout || 'list';
  const isDashboard = pageLayout === 'dashboard';
  const isKanban = pageLayout === 'kanban';
  const isForm = pageLayout === 'form';

  const { entityName, entityRecords } = useMemo(() => {
    const page = (appSpec?.pages || []).find(p => p.route === activePage);
    const bound = page?.boundEntity || activeItem?.label?.replace(/s$/i, '');
    const keys = Object.keys(localData);
    const found = keys.find(k => k === bound)
      || keys.find(k => k.toLowerCase() === bound?.toLowerCase())
      || keys.find(k => k.toLowerCase() === bound?.toLowerCase() + 's')
      || keys.find(k => bound?.toLowerCase() === k.toLowerCase() + 's')
      || keys[1] || keys[0];
    return { entityName: found || bound || 'Record', entityRecords: localData[found] || [] };
  }, [activePage, appSpec?.pages, activeItem, localData]);

  const navItem = (item, opts = {}) => {
    const Icon = getIcon(item.icon || item.label);
    const active = activePage === item.route;
    const { iconOnly = false, onNavigate } = opts;
    return (
      <button
        key={item.route}
        type="button"
        title={item.label}
        onClick={() => { setActivePage(item.route); setMobileNavOpen(false); onNavigate?.(); }}
        className={clsx(
          'transition-all duration-100',
          iconOnly
            ? clsx('flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 px-0.5', active ? 'font-semibold' : 'text-slate-500 dark:text-slate-400')
            : clsx('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left', active ? 'font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'),
        )}
        style={active ? { backgroundColor: iconOnly ? 'transparent' : primaryColor + '18', color: primaryColor } : {}}>
        <Icon size={iconOnly ? 18 : 15} strokeWidth={active ? 2.5 : 2}/>
        {!iconOnly && <span className="truncate">{item.label}</span>}
        {iconOnly && <span className="text-[9px] leading-tight truncate max-w-full px-0.5">{shortNavLabel(item.label, 8)}</span>}
      </button>
    );
  };

  const bottomNavItems = sidebar.slice(0, 5);

  return (
    <div className={clsx('flex h-full overflow-hidden flex-col', isPhone && 'relative', theme === 'dark' && 'dark')} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {isPhone && (
        <header className="h-12 flex-shrink-0 flex items-center gap-2 px-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-20">
          <button type="button" onClick={() => setMobileNavOpen(o => !o)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Menu">
            <Menu size={18}/>
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: primaryColor }}>
            {String(intent?.appName || 'A')[0].toUpperCase()}
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white truncate flex-1">{activeItem?.label || intent?.appName || 'App'}</span>
          <button type="button" onClick={toggleTheme} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500">
            {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
          </button>
        </header>
      )}

      <div className={clsx('flex flex-1 min-h-0 overflow-hidden', isPhone && 'flex-col')}>
      {!isPhone && (
      <aside className={clsx(
        'flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col',
        isTablet ? 'w-16' : 'w-[220px]',
      )}>
        <div className={clsx('h-14 flex items-center border-b border-slate-100 dark:border-slate-800', isTablet ? 'justify-center px-2' : 'px-4 gap-2.5')}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
            {String(intent?.appName || 'A')[0].toUpperCase()}
          </div>
          {!isTablet && (
            <div className="min-w-0 flex-1">
              <span className="font-bold text-slate-900 dark:text-white text-sm truncate block">{intent?.appName || 'App'}</span>
              {preview.tagline && <span className="text-[10px] text-slate-400 truncate block">{preview.tagline}</span>}
            </div>
          )}
          {!isTablet && (
            <button type="button" onClick={toggleTheme} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800" title="Toggle theme">
              {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
            </button>
          )}
        </div>
        <nav className={clsx('flex-1 overflow-y-auto', isTablet ? 'py-2 px-1 space-y-1' : 'py-3 px-2 space-y-0.5')}>
          {sidebar.map(item => navItem(item, { iconOnly: isTablet }))}
        </nav>
        <div className={clsx('border-t border-slate-50 dark:border-slate-800 space-y-1', isTablet ? 'px-1 pb-2 pt-1' : 'px-3 pb-3 pt-2')}>
          <button type="button" onClick={() => setActivePage('__settings__')}
            className={clsx('w-full flex items-center rounded-lg text-sm text-left', isTablet ? 'justify-center p-2' : 'gap-2 px-3 py-2', isSettings ? 'font-semibold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800')}
            style={isSettings ? { backgroundColor: primaryColor + '18', color: primaryColor } : {}} title="Settings">
            <Settings size={15} /> {!isTablet && 'Settings'}
          </button>
          {!isTablet && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                {(profile.name || '?')[0].toUpperCase()}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{profile.name}</span>
            </div>
          )}
        </div>
      </aside>
      )}

      {isPhone && mobileNavOpen && (
        <>
          <button type="button" className="absolute inset-0 z-30 bg-black/40" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute top-12 left-0 bottom-0 z-40 w-[min(280px,88vw)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{intent?.appName || 'App'}</p>
              {preview.tagline && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{preview.tagline}</p>}
            </div>
            <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
              {sidebar.map(item => navItem(item))}
            </nav>
            <div className="px-3 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => { setActivePage('__settings__'); setMobileNavOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300">
                <Settings size={15}/> Settings
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Content */}
      <main className={clsx(
        'flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-900 dark:to-slate-950',
        isPhone && 'pb-14',
      )} style={{ backgroundColor: surfaceColor || preview.surfaceColor }}>
        {isSettings && (
          <SettingsView appInstanceId={storageKey} profile={profile} setProfile={setProfile} theme={theme} setTheme={setTheme} primaryColor={primaryColor} team={team} setTeam={setTeam} />
        )}
        {!isSettings && isPaymentsPage && (
          <PaymentsView records={localData.Payment} primaryColor={primaryColor} stripeConfigured={stripeConfigured} />
        )}
        {!isSettings && isIntegrationsPage && (
          <IntegrationsHubView hooks={appSpec?.integrationHooks} workflows={appSpec?.workflowStubs} primaryColor={primaryColor} />
        )}
        {!isSettings && !isPaymentsPage && !isIntegrationsPage && isDashboard && <DashboardView appSpec={appSpec} sampleData={localData}/>}
        {isKanban && (
          <KanbanView
            entityName={activePageDef?.boundEntity || entityName}
            records={localData[activePageDef?.boundEntity || entityName] || entityRecords}
            schema={schema}
            kanbanConfig={preview.kanban || appSpec?.appPreview?.kanban}
            onAdd={(en, rec) => handleAdd(en, rec)}
            primaryColor={primaryColor}
          />
        )}
        {isForm && (
          <FormPageView
            entityName={activePageDef?.boundEntity || entityName}
            schema={schema}
            onAddRecord={rec => handleAdd(activePageDef?.boundEntity || entityName, rec)}
            primaryColor={primaryColor}
          />
        )}
        {!isSettings && !isPaymentsPage && !isIntegrationsPage && !isDashboard && !isKanban && !isForm && (
          <ListView
            entityName={entityName}
            records={entityRecords}
            schema={schema}
            onAdd={handleAdd}
            onDelete={(id) => handleDelete(entityName, id)}
          />
        )}
      </main>
      </div>

      {isPhone && (
        <nav className="flex-shrink-0 h-14 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-stretch px-1 z-20">
          {bottomNavItems.map(item => navItem(item, { iconOnly: true }))}
        </nav>
      )}
    </div>
  );
}
