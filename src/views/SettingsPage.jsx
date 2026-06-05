import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Key, Eye, EyeOff, Check, X, Trash2, LogOut,
  AlertTriangle, CheckCircle2, Copy, Plus, User,
  Building2, Cpu, RefreshCw, ChevronRight,
} from 'lucide-react';
import { fetchSettings, syncProviderKeys } from '@/lib/generateApi';
import { startPlanCheckout } from '@/lib/billing';
import { getAllowedProvidersForPlan, isProviderAllowedForPlan, PLAN_LABELS } from '../../lib/planProviders.js';

const PROVIDERS = [
  { id:'openrouter', label:'OpenRouter',  note:'⭐ One key covers ALL 10 models — recommended', color:'#EF4444', recommended:true  },
  { id:'openai',     label:'OpenAI',      note:'GPT-5.5 (AppSpec) · GPT-5.4 Mini (fast tasks)', color:'#10A37F' },
  { id:'anthropic',  label:'Anthropic',   note:'Claude Sonnet 4.6 · Claude Opus 4.6',            color:'#D97706' },
  { id:'groq',       label:'Groq',        note:'Llama 4 Scout · Intent Extraction (FREE tier)',   color:'#8B5CF6' },
  { id:'gemini',     label:'Google Gemini', note:'Gemini 3.1 Pro · Gemini 3 Flash',              color:'#4285F4' },
  { id:'google_ai',  label:'Google AI',   note:'Same Gemini models (alternate key slot)',      color:'#34A853' },
  { id:'deepseek',   label:'DeepSeek',    note:'DeepSeek V4 · Schema generation',                color:'#0EA5E9' },
  { id:'mistral',    label:'Mistral',     note:'Mistral Small · Classification + repair',         color:'#FF7000' },
];

const MODELS = [
  { id:'auto',          label:'Automatic (platform-routed)' },
  { id:'gpt-5.5',       label:'GPT-5.5' },
  { id:'gpt-5.4-mini',  label:'GPT-5.4 Mini' },
  { id:'claude-sonnet', label:'Claude Sonnet 4.6' },
  { id:'claude-opus',   label:'Claude Opus 4.6' },
  { id:'gemini-pro',    label:'Gemini 3.1 Pro' },
  { id:'gemini-flash',  label:'Gemini 3 Flash' },
  { id:'deepseek-v4',   label:'DeepSeek V4' },
  { id:'llama-4-scout', label:'Llama 4 Scout' },
  { id:'mistral-small', label:'Mistral Small' },
];

const ORG_PLANS = [
  { id: 'explorer', name: 'Explorer', price: '$0', period: '/mo', desc: 'Test ideas and build your first apps', features: ['3 projects', 'Local engine', 'Community support'] },
  { id: 'studio', name: 'Studio', price: '$24', period: '/mo', desc: 'For founders shipping production apps', features: ['Unlimited projects', 'Groq, OpenRouter, Google, Mistral', 'Custom subdomains'], popular: false },
  { id: 'scale', name: 'Scale', price: '$48', period: '/mo', desc: 'Teams building serious AI software', features: ['Studio providers', 'DeepSeek & OpenAI', 'Integrations vault'], popular: true },
  { id: 'orbit', name: 'Orbit', price: '$99', period: '/mo', desc: 'Enterprise-grade scale and compliance', features: ['All providers incl. Anthropic', 'SSO', 'Dedicated support'], popular: false },
];

const TABS = [
  { id:'profile', label:'Profile',      icon:User },
  { id:'org',     label:'Organisation', icon:Building2 },
  { id:'keys',    label:'API Keys',     icon:Key },
  { id:'model',   label:'Default Model',icon:Cpu },
  { id:'danger',  label:'Danger Zone',  icon:AlertTriangle },
];

function KeyRow({ provider, value, onSave, onRemove, locked, lockReason }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const save = async () => {
    if (!draft.trim()) return;
    await onSave(draft.trim());
    setSaved(true); setEditing(false); setDraft('');
    setTimeout(() => setSaved(false), 2000);
  };

  const masked = value ? value.slice(0, 10) + '•'.repeat(12) + value.slice(-4) : null;

  if (locked) {
    return (
      <div className="py-4 border-b last:border-0 opacity-60" style={{ borderColor: '#ECECEC' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: provider.color }} />
          <span className="text-sm font-bold" style={{ color: '#111111' }}>{provider.label}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#F3F4F6', color: '#6B7280' }}>Plan locked</span>
        </div>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>{lockReason || 'Upgrade your organisation plan to use this provider.'}</p>
      </div>
    );
  }

  return (
    <div className="py-4 border-b last:border-0" style={{ borderColor: '#ECECEC' }}>
      <div className="flex items-start gap-4 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: provider.color }} />
            <span className="text-sm font-bold" style={{ color: '#111111' }}>{provider.label}</span>
            {provider.recommended && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#FFF3EB', color: '#FF6600', border: '1px solid #FFD0A6' }}>
                Recommended
              </span>
            )}
            {value && <CheckCircle2 size={12} style={{ color: '#10B981' }} />}
            {saved && <span className="text-xs font-bold" style={{ color: '#10B981' }}>Saved!</span>}
          </div>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{provider.note}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && save()}
                  placeholder="Paste key…" autoFocus
                  className="text-xs px-3 py-1.5 rounded-xl border outline-none pr-8"
                  style={{ borderColor: '#FF6600', background: '#FFFFFF', color: '#111111', width: 200 }} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                  {showPw ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              </div>
              <button onClick={save}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: '#FF6600' }}>
                <Check size={12} />
              </button>
              <button onClick={() => { setEditing(false); setDraft(''); }}
                className="px-2 py-1.5 rounded-xl text-xs border"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {masked && (
                <code className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: '#F9F9F6', color: '#6B7280' }}>
                  {masked}
                </code>
              )}
              <button onClick={() => { setEditing(true); setDraft(''); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                style={{ borderColor: '#E5E7EB', color: '#6B7280', background: '#FFFFFF' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.color = '#FF6600'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}>
                {value ? 'Edit' : '+ Add'}
              </button>
              {value && (
                <button onClick={() => onRemove(provider.id)}
                  className="p-1.5 rounded-lg transition-all" style={{ color: '#EF4444' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF0F0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { logout }  = useAuth();
  const navigate    = useNavigate();
  const user        = useStore(s => s.user);
  const providerKeys = useStore(s => s.providerKeys);
  const setProviderKey = useStore(s => s.setProviderKey);
  const removeProviderKey = useStore(s => s.removeProviderKey);
  const orgs = useStore(s => s.orgs);
  const activeOrgId = useStore(s => s.activeOrgId);
  const updateOrg = useStore(s => s.updateOrg);
  const selectedModel = useStore(s => s.selectedModel);
  const setSelectedModel = useStore(s => s.setSelectedModel);
  const profilePhoto = useStore(s => s.profilePhoto);
  const setProfilePhoto = useStore(s => s.setProfilePhoto);
  const setNotifications = useStore(s => s.setNotifications);
  const notificationsEnabled = useStore(s => s.notificationsEnabled);
  const photoInputRef = useRef(null);

  const [tab, setTab]               = useState('profile');
  const [keys, setKeys]             = useState(providerKeys);
  const [defaultModel, setDM]       = useState(selectedModel || 'auto');
  const [displayName, setDN]        = useState(user?.displayName || '');
  const activeOrg = orgs.find(o => o.id === activeOrgId) || orgs[0];
  const [orgName, setOrgName]       = useState(activeOrg?.name || 'My Organisation');
  const [deleteConfirm, setDC]      = useState('');
  const [platformKeys, setPlatformKeys] = useState([]);
  const [newKeyLabel, setNKL]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [savedMsg, setSavedMsg]     = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteLink = `${window.location.origin}/login?invite=${activeOrgId}`;

  useEffect(() => {
    setKeys(providerKeys);
  }, [providerKeys]);

  useEffect(() => {
    fetchSettings().then(d => {
      if (d?.providers) {
        const fromServer = {};
        d.providers.forEach(p => { if (p.configured && providerKeys[p.id]) fromServer[p.id] = providerKeys[p.id]; });
        if (Object.keys(fromServer).length) setKeys(prev => ({ ...prev, ...fromServer }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { setOrgName(activeOrg?.name || 'My Organisation'); }, [activeOrg?.name]);

  const saveKey  = async (id, k) => {
    const n = { ...keys, [id]: k };
    setKeys(n);
    setProviderKey(id, k);
    await syncProviderKeys(n).catch(() => {});
  };
  const removeKey = async (id) => {
    const n = { ...keys }; delete n[id];
    setKeys(n);
    removeProviderKey(id);
    await syncProviderKeys(n).catch(() => {});
  };

  const saveProfile = async () => {
    setSaving(true);
    try { localStorage.setItem('oa_display_name', displayName); } catch {}
    setSaving(false);
    setSavedMsg('Saved!');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePhoto(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const saveOrg = () => {
    if (activeOrgId) updateOrg(activeOrgId, { name: orgName });
    setSavedMsg('Organisation saved');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const saveDefaultModel = () => {
    setSelectedModel(defaultModel);
    setSavedMsg('Default model saved');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const enableBrowserNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifications(perm === 'granted');
  };

  const genPlatformKey = () => {
    if (!newKeyLabel.trim()) return;
    const raw = `oa_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    setPlatformKeys(p => [...p, { id: Date.now(), label: newKeyLabel.trim(), raw, masked: raw.slice(0,12)+'•'.repeat(20), createdAt: new Date().toISOString() }]);
    setNKL('');
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#F5F5EE' }}>
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 border-r p-3 space-y-0.5 overflow-y-auto"
          style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <p className="text-xs font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#9CA3AF' }}>Settings</p>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
              style={{
                background: tab === t.id ? (t.id === 'danger' ? '#FEE2E2' : '#FFF3EB') : 'transparent',
                color: tab === t.id ? (t.id === 'danger' ? '#DC2626' : '#FF6600') : '#6B7280',
              }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = '#F5F5EE'; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'transparent'; }}>
              <t.icon size={15} style={{ flexShrink: 0 }} />
              {t.label}
              {tab === t.id && <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'currentColor' }} />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* ── Profile ── */}
          {tab === 'profile' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: '#111111' }}>Profile</h2>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Update your display name and avatar.</p>
              </div>
              <div className="p-6 rounded-2xl border space-y-4" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={profilePhoto || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName||user?.email||'U')}&background=FF6600&color=fff&size=128`}
                      alt="avatar" className="w-16 h-16 rounded-2xl object-cover"
                      style={{ border: '3px solid #FFD0A6' }} />
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    <button type="button" onClick={() => photoInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white flex items-center justify-center"
                      style={{ background: '#FF6600' }}>
                      <RefreshCw size={10} />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#111111' }}>{displayName || user?.displayName || 'User'}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{user?.email}</p>
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="text-xs font-bold mt-1" style={{ color: '#FF6600' }}>Change photo</button>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={notificationsEnabled} onChange={e => { if (e.target.checked) enableBrowserNotifications(); else setNotifications(false); }} />
                  <span style={{ color: '#6B7280' }}>Notify me when app building completes</span>
                </label>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Display Name</label>
                  <input value={displayName} onChange={e => setDN(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all"
                    style={{ borderColor: '#E5E7EB', background: '#F9F9F6', color: '#111111' }}
                    onFocus={e => e.target.style.borderColor = '#FF6600'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Email</label>
                  <input value={user?.email || ''} disabled
                    className="w-full text-sm px-4 py-3 rounded-xl border"
                    style={{ borderColor: '#E5E7EB', background: '#F5F5EE', color: '#9CA3AF' }} />
                </div>
                <button onClick={saveProfile} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background: '#FF6600' }}>
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : savedMsg ? <Check size={13} /> : null}
                  {saving ? 'Saving…' : savedMsg || 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── Organisation ── */}
          {tab === 'org' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: '#111111' }}>Organisation</h2>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Manage your workspace and team members.</p>
              </div>
              <div className="p-6 rounded-2xl border space-y-4" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Organisation Name</label>
                  <input value={orgName} onChange={e => setOrgName(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl border outline-none"
                    style={{ borderColor: '#E5E7EB', background: '#F9F9F6', color: '#111111' }}
                    onFocus={e => e.target.style.borderColor = '#FF6600'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Choose a plan</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ORG_PLANS.map(plan => {
                      const active = (activeOrg?.plan || 'explorer') === plan.id;
                      return (
                        <button key={plan.id} type="button"
                          onClick={async () => {
                            if (plan.id === 'explorer') {
                              updateOrg(activeOrgId, { plan: plan.id });
                              setSavedMsg('Explorer plan active');
                              setTimeout(() => setSavedMsg(''), 2000);
                              return;
                            }
                            try {
                              await startPlanCheckout(plan.id, {
                                onSuccess: () => {
                                  updateOrg(activeOrgId, { plan: plan.id });
                                  setSavedMsg(`${plan.name} activated — thank you!`);
                                  setTimeout(() => setSavedMsg(''), 3000);
                                },
                              });
                            } catch (e) {
                              alert(e.message || 'Checkout failed');
                            }
                          }}
                          className="text-left p-4 rounded-2xl border transition-all"
                          style={{
                            background: active ? '#FFF3EB' : '#FFFFFF',
                            borderColor: active ? '#FF6600' : plan.popular ? '#FFD0A6' : '#E5E7EB',
                            borderWidth: active ? 2 : 1,
                          }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm" style={{ color: '#111111' }}>{plan.name}</span>
                            {plan.popular && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#FF6600', color: '#fff' }}>Popular</span>}
                          </div>
                          <p className="text-lg font-bold mb-1" style={{ color: '#FF6600' }}>{plan.price}<span className="text-xs font-normal text-slate-400">{plan.period}</span></p>
                          <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{plan.desc}</p>
                          <ul className="text-[10px] space-y-0.5" style={{ color: '#9CA3AF' }}>
                            {plan.features.map(f => <li key={f}>• {f}</li>)}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => navigate('/app/templates')} className="text-xs font-bold mt-3" style={{ color: '#FF6600' }}>Explore templates →</button>
                </div>
                <button type="button" onClick={saveOrg} className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#FF6600' }}>Save Organisation</button>
              </div>
              <div className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm" style={{ color: '#111111' }}>Team Members</h3>
                  <button type="button" onClick={() => setInviteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: '#FFF3EB', color: '#FF6600', border: '1px solid #FFD0A6' }}>
                    <Plus size={12} /> Invite
                  </button>
                </div>
                {inviteOpen && (
                  <div className="mb-4 p-4 rounded-xl border" style={{ background: '#F9F9F6', borderColor: '#E5E7EB' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#111111' }}>Invite link</p>
                    <div className="flex gap-2">
                      <input readOnly value={inviteLink} className="flex-1 text-xs px-3 py-2 rounded-lg border font-mono" style={{ borderColor: '#E5E7EB' }} />
                      <button type="button" onClick={() => navigator.clipboard.writeText(inviteLink).catch(() => {})}
                        className="px-3 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#FF6600' }}>
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F9F9F6' }}>
                  <div className="flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName||'U')}&background=FF6600&color=fff&size=64`}
                      alt="" className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#111111' }}>{user?.displayName || 'You'}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{user?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#F0FDF4', color: '#16A34A' }}>Owner</span>
                </div>
              </div>
            </div>
          )}

          {/* ── API Keys ── */}
          {tab === 'keys' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: '#111111' }}>API Keys</h2>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Add provider keys to power AI generation.</p>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
                <p className="text-xs font-semibold" style={{ color: '#166534' }}>
                  <strong>PostgreSQL:</strong> App data syncs to Postgres when <code>DATABASE_URL</code> is set (see <code>prisma/schema.prisma</code>). Run <code>npx prisma migrate dev</code>. Firebase is only used for optional auth until you switch to Clerk/Postgres auth.
                </p>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: '#FFF3EB', borderColor: '#FFD0A6' }}>
                <p className="text-xs font-semibold" style={{ color: '#C05500' }}>
                  💡 Add an <strong>OpenRouter</strong> key to cover all 10 models with a single key — it acts as a universal fallback if any primary provider returns an error.
                </p>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: '#EFF6FF', borderColor: '#93C5FD' }}>
                <p className="text-xs font-semibold" style={{ color: '#1E40AF' }}>
                  <strong>Your plan:</strong> {PLAN_LABELS[activeOrg?.plan || 'explorer'] || 'Explorer'}.{' '}
                  {(activeOrg?.plan || 'explorer') === 'explorer'
                    ? 'Upgrade to Studio ($24) under Organisation to unlock AI providers.'
                    : `Unlocked: ${getAllowedProvidersForPlan(activeOrg?.plan).join(', ') || 'none'}.`}
                </p>
              </div>
              <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                <div className="px-5 py-3.5 border-b" style={{ borderColor: '#ECECEC', background: '#F9F9F6' }}>
                  <p className="text-sm font-bold" style={{ color: '#111111' }}>Provider Keys</p>
                </div>
                <div className="px-5">
                  {PROVIDERS.map(p => {
                    const plan = activeOrg?.plan || 'explorer';
                    const allowed = isProviderAllowedForPlan(plan, p.id);
                    const needScale = ['deepseek', 'openai'].includes(p.id);
                    const needOrbit = p.id === 'anthropic';
                    const lockReason = !allowed && needOrbit
                      ? 'Requires Orbit ($99/mo) plan.'
                      : !allowed && needScale
                        ? 'Requires Scale ($48/mo) or Orbit plan.'
                        : !allowed
                          ? 'Requires Studio ($24/mo) or higher.'
                          : null;
                    return (
                      <KeyRow
                        key={p.id}
                        provider={p}
                        value={keys[p.id] || ''}
                        onSave={(k) => saveKey(p.id, k)}
                        onRemove={removeKey}
                        locked={!allowed}
                        lockReason={lockReason}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                <div className="px-5 py-3.5 border-b" style={{ borderColor: '#ECECEC', background: '#F9F9F6' }}>
                  <p className="text-sm font-bold" style={{ color: '#111111' }}>Platform API Keys</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>For programmatic access to OneAtlas</p>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <input value={newKeyLabel} onChange={e => setNKL(e.target.value)}
                      placeholder="Key label (e.g. Production, CI/CD)"
                      className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none"
                      style={{ borderColor: '#E5E7EB', background: '#F9F9F6', color: '#111111' }}
                      onFocus={e => e.target.style.borderColor = '#FF6600'}
                      onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                    <button onClick={genPlatformKey}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold flex-shrink-0"
                      style={{ background: '#FF6600' }}>
                      <Plus size={13} /> Generate
                    </button>
                  </div>
                  {platformKeys.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: '#9CA3AF' }}>No platform API keys yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {platformKeys.map(k => (
                        <div key={k.id} className="flex items-center justify-between p-3 rounded-xl border"
                          style={{ background: '#F9F9F6', borderColor: '#E5E7EB' }}>
                          <div>
                            <p className="text-xs font-bold" style={{ color: '#111111' }}>{k.label}</p>
                            <code className="text-xs font-mono" style={{ color: '#9CA3AF' }}>{k.masked}</code>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => navigator.clipboard.writeText(k.raw).catch(()=>{})}
                              className="p-1.5 rounded-lg transition-all" style={{ color: '#6B7280' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F0F0EE'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Copy size={13}/></button>
                            <button onClick={() => setPlatformKeys(p => p.filter(x => x.id !== k.id))}
                              className="p-1.5 rounded-lg transition-all" style={{ color: '#EF4444' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#FFF0F0'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Trash2 size={13}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Default Model ── */}
          {tab === 'model' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: '#111111' }}>Default AI Model</h2>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Set the org-level default for all new generations. Users can override per-generation.</p>
              </div>
              <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                {MODELS.map((m, i) => (
                  <label key={m.id}
                    className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all border-b last:border-0"
                    style={{ borderColor: '#ECECEC', background: defaultModel === m.id ? '#FFF3EB' : 'transparent' }}
                    onMouseEnter={e => { if (defaultModel !== m.id) e.currentTarget.style.background = '#F9F9F6'; }}
                    onMouseLeave={e => { if (defaultModel !== m.id) e.currentTarget.style.background = 'transparent'; }}>
                    <input type="radio" name="defModel" value={m.id} checked={defaultModel === m.id}
                      onChange={() => setDM(m.id)} style={{ accentColor: '#FF6600' }} />
                    <span className="text-sm font-semibold flex-1" style={{ color: defaultModel === m.id ? '#FF6600' : '#111111' }}>
                      {m.label}
                    </span>
                    {m.id === 'auto' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#FFF3EB', color: '#FF6600' }}>Recommended</span>
                    )}
                  </label>
                ))}
              </div>
              <button type="button" onClick={saveDefaultModel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: '#FF6600' }}>
                <Check size={14} /> Save Default
              </button>
            </div>
          )}

          {/* ── Danger Zone ── */}
          {tab === 'danger' && (
            <div className="max-w-lg space-y-5">
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: '#DC2626' }}>Danger Zone</h2>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>These actions are irreversible. Proceed with caution.</p>
              </div>
              <div className="p-5 rounded-2xl border flex items-center justify-between"
                style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#111111' }}>Sign out</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Sign out of your account on this device.</p>
                </div>
                <button onClick={async () => { await logout(); navigate('/'); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                  style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
              <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: '#FCA5A5' }}>
                <p className="font-semibold text-sm mb-1" style={{ color: '#DC2626' }}>Delete Organisation</p>
                <p className="text-xs mb-4" style={{ color: '#EF4444' }}>
                  Permanently delete your organisation and all its apps, data, and settings. This cannot be undone.
                </p>
                <input value={deleteConfirm} onChange={e => setDC(e.target.value)}
                  placeholder='Type "delete" to confirm'
                  className="w-full text-sm px-3 py-2 rounded-xl border outline-none mb-3"
                  style={{ borderColor: '#FCA5A5', background: '#FFFFFF', color: '#111111' }} />
                <button type="button" disabled={deleteConfirm !== 'delete'}
                  onClick={() => { if (deleteConfirm === 'delete') { updateOrg(activeOrgId, { name: 'Deleted Org' }); setDC(''); alert('Organisation reset. Your projects are still in this browser.'); } }}
                  className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all"
                  style={{ background: deleteConfirm === 'delete' ? '#DC2626' : '#D1D5DB', cursor: deleteConfirm === 'delete' ? 'pointer' : 'not-allowed' }}>
                  Delete Organisation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
