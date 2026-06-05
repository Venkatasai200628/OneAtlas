
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import { getGeneratedAppInviteLink, getAppShareLink } from '@/lib/appUrl';
import { getInviteSyncStatus, persistInvitePayload } from '@/lib/appInvitePayload';
import { getAppInvitations, addAppInvitation, removeAppInvitation } from '@/lib/appInvitations';
import {
  getDefaultPlatformDomain,
  slugifyAppName,
} from '@/lib/appAdminConfig';
import { INTEGRATION_REGISTRY } from '@/lib/integrationRegistry';
import {
  CORE_INTEGRATIONS,
  isIntegrationConfigured,
  maskSecret,
} from '@/lib/integrationKeys';
import {
  Layout, Users, Mail, Database, Link2, Globe, Settings, Shield,
  ExternalLink, Share2, Copy, Check, LogOut, Send, Trash2, AlertCircle,
} from 'lucide-react';

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: Layout },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'invitations', label: 'Invitations', icon: Mail },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'security', label: 'Security', icon: Shield },
];

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export default function GeneratedAppAdminPanel({
  appName,
  intent,
  appSpec,
  schema,
  primaryColor,
  appInstanceId,
  adminConfig,
  updateAdminConfig,
  appSessionUsers,
  requireLogin,
  setRequireLogin,
  projectMeta,
  loginEmail,
  setIsLoggedIn,
  onOpenPreview,
  integrationKeys,
  keyDraft,
  setKeyDraft,
  editingIntegration,
  setEditingIntegration,
  requestedIds,
  saveIntegration,
  disconnectIntegration,
}) {
  const firebaseUser = useStore(s => s.user);
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteEmails, setInviteEmails] = useState([]);
  const [invitations, setInvitations] = useState(() => getAppInvitations(appInstanceId));
  const [selectedTable, setSelectedTable] = useState(() => Object.keys(appSpec?.sampleData || {})[0] || '');

  const [domainInput, setDomainInput] = useState('');
  const [settingsDraft, setSettingsDraft] = useState(() => ({
    ...adminConfig.settings,
    displayName: adminConfig.settings?.displayName || appName,
    supportEmail: adminConfig.settings?.supportEmail || loginEmail,
    appDescription: adminConfig.settings?.appDescription || intent?.tagline || '',
  }));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const inviteLink = getGeneratedAppInviteLink(appInstanceId, firebaseUser?.uid, appName);
  const shareLink = getAppShareLink(appInstanceId);
  const [inviteSync, setInviteSync] = useState(() => getInviteSyncStatus(appInstanceId));
  const sampleData = appSpec?.sampleData || {};
  const tableKeys = Object.keys(sampleData);
  const platformDomain = getDefaultPlatformDomain(appName);

  useEffect(() => {
    setSettingsDraft({
      ...adminConfig.settings,
      displayName: adminConfig.settings?.displayName || appName,
      supportEmail: adminConfig.settings?.supportEmail || loginEmail,
      appDescription: adminConfig.settings?.appDescription || intent?.tagline || '',
    });
  }, [adminConfig, appName, loginEmail, intent?.tagline]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDeploy = () => {
    const next = updateAdminConfig({
      deployed: true,
      deployedAt: new Date().toISOString(),
      domains: adminConfig.domains?.length
        ? adminConfig.domains
        : [{
          id: 'platform_default',
          hostname: platformDomain,
          recordType: 'CNAME',
          target: `${slugifyAppName(appName)}.dns.oneatlas.app`,
          sslStatus: 'active',
          connectedAt: new Date().toISOString(),
        }],
    });
    showToast(`Deployed ${appName} · ${next.domains.length} domain(s) active`);
  };

  const handleUndeploy = () => {
    updateAdminConfig({ deployed: false, deployedAt: null });
    showToast('App marked as not deployed');
  };

  const handleVisibilityChange = (value) => {
    updateAdminConfig({ visibility: value });
    if (value === 'Public') setRequireLogin(false);
    if (value === 'Private' || value === 'Password Protected') setRequireLogin(true);
    showToast(`Visibility set to ${value}`);
  };

  const handleConnectDomain = () => {
    const host = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!host || !host.includes('.')) {
      showToast('Enter a valid domain (e.g. app.mycompany.com)');
      return;
    }
    if (!adminConfig.deployed) {
      showToast('Deploy the app first (Overview → Mark as deployed)');
      return;
    }
    const entry = {
      id: `dom_${Date.now()}`,
      hostname: host,
      recordType: 'CNAME',
      target: `${slugifyAppName(appName)}.dns.oneatlas.app`,
      sslStatus: 'pending',
      connectedAt: new Date().toISOString(),
    };
    const newDomains = [...(adminConfig.domains || []), entry];
    updateAdminConfig({ domains: newDomains });
    setDomainInput('');
    showToast(`Domain ${host} added — SSL provisioning (simulated)`);
    setTimeout(() => {
      updateAdminConfig({
        domains: newDomains.map(d => (d.hostname === host ? { ...d, sslStatus: 'active' } : d)),
      });
    }, 1500);
  };

  const handleRemoveDomain = (id) => {
    if (id === 'platform_default') {
      showToast('Cannot remove the default platform domain');
      return;
    }
    updateAdminConfig({ domains: (adminConfig.domains || []).filter(d => d.id !== id) });
    showToast('Domain removed');
  };

  const handleSaveSettings = () => {
    updateAdminConfig({
      settings: {
        ...adminConfig.settings,
        ...settingsDraft,
        notifications: { ...adminConfig.settings?.notifications, ...settingsDraft.notifications },
      },
    });
    showToast('Settings saved');
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 4) {
      showToast('Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    if (adminConfig.security?.previewPassword && currentPassword !== adminConfig.security.previewPassword) {
      showToast('Current password is incorrect');
      return;
    }
    updateAdminConfig({
      security: {
        ...adminConfig.security,
        previewPassword: newPassword,
        lastPasswordChange: new Date().toISOString(),
      },
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('App preview password updated');
  };

  const handleToggle2FA = () => {
    const next = !adminConfig.security?.twoFactorEnabled;
    updateAdminConfig({
      security: { ...adminConfig.security, twoFactorEnabled: next },
    });
    showToast(next ? '2FA enabled for app preview' : '2FA disabled');
  };

  const handleSyncInvite = async () => {
    if (!firebaseUser?.uid || !intent || !appSpec) {
      showToast('Sign in and generate an app before sharing invites');
      return;
    }
    const res = await persistInvitePayload(appInstanceId, {
      intent,
      appSpec,
      schema,
      appName,
      ownerUid: firebaseUser.uid,
    });
    setInviteSync(getInviteSyncStatus(appInstanceId));
    showToast(res.ok ? 'Invite synced to cloud — safe to copy link' : (res.error || 'Sync failed'));
  };

  const handleCopyInvite = async () => {
    if (firebaseUser?.uid && intent && appSpec) {
      await persistInvitePayload(appInstanceId, {
        intent,
        appSpec,
        schema,
        appName,
        ownerUid: firebaseUser.uid,
      });
      setInviteSync(getInviteSyncStatus(appInstanceId));
    }
    const ok = await copyText(inviteLink);
    setCopiedInvite(ok);
    const synced = getInviteSyncStatus(appInstanceId) === 'ok';
    showToast(
      ok
        ? (synced ? 'Invite link copied (synced)' : 'Copied — tap Sync to cloud if recipients cannot open it')
        : 'Could not copy — select link manually'
    );
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleCopyShare = async () => {
    const ok = await copyText(shareLink);
    setCopiedShare(ok);
    showToast(ok ? 'Share link copied' : 'Could not copy');
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleSendInvites = () => {
    const list = inviteEmails.length ? inviteEmails : (inviteEmail.includes('@') ? [inviteEmail.trim()] : []);
    if (!list.length) {
      showToast('Add at least one email');
      return;
    }
    let next = invitations;
    list.forEach(email => { next = addAppInvitation(appInstanceId, email); });
    setInvitations(next);
    const subject = encodeURIComponent(`You're invited to ${appName}`);
    const body = encodeURIComponent(
      `You've been invited to ${appName} on One Atlas.\n\nOpen this link after signing in:\n${inviteLink}\n\nOr direct share:\n${shareLink}`,
    );
    window.open(`mailto:${list.join(',')}?subject=${subject}&body=${body}`);
    setInviteEmails([]);
    setInviteEmail('');
    showToast(`Invite sent to ${list.length} recipient(s)`);
  };

  const allDomains = adminConfig.domains?.length
    ? adminConfig.domains
    : (adminConfig.deployed ? [{
      id: 'platform_default',
      hostname: platformDomain,
      recordType: 'CNAME',
      target: `${slugifyAppName(appName)}.dns.oneatlas.app`,
      sslStatus: 'active',
      connectedAt: adminConfig.deployedAt,
    }] : []);

  const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700';
  const heading = 'text-xs font-bold text-slate-800 dark:text-slate-100';
  const headingSm = 'text-sm font-bold text-slate-800 dark:text-slate-100';
  const labelCls = 'text-xs font-semibold text-slate-700 dark:text-slate-200';
  const inputCls = 'w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100';
  const btnOutline = 'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 relative">
      {toast && (
        <div className="absolute top-3 right-3 z-20 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-lg">
          {toast}
        </div>
      )}

      <aside className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2 overflow-y-auto">
        <nav className="space-y-0.5">
          {ADMIN_TABS.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all',
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                <Icon size={13} style={active ? { color: primaryColor } : undefined} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-h-0 overflow-auto p-5 bg-slate-50/50 dark:bg-slate-950 space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4 max-w-3xl">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, #8b5cf6)` }}
              >
                {appName[0]}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 dark:text-white">{settingsDraft.displayName || appName}</h2>
                <p className={clsx('text-[10px] uppercase font-bold mt-1', adminConfig.deployed ? 'text-emerald-600' : 'text-slate-400')}>
                  {adminConfig.deployed
                    ? `Deployed · ${adminConfig.deployedAt ? new Date(adminConfig.deployedAt).toLocaleString() : 'Live'}`
                    : 'Not deployed · Preview only'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {!adminConfig.deployed ? (
                    <button type="button" onClick={handleDeploy} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold">
                      Mark as deployed
                    </button>
                  ) : (
                    <button type="button" onClick={handleUndeploy} className="px-3 py-1.5 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Undeploy
                    </button>
                  )}
                  <button type="button" onClick={onOpenPreview} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
                    <ExternalLink size={11} /> Open app preview
                  </button>
                  <button type="button" onClick={handleCopyShare} className={clsx('flex items-center gap-1', btnOutline)}>
                    <Share2 size={11} /> {copiedShare ? 'Copied!' : 'Share link'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className={clsx(card, 'p-4 space-y-3')}>
                <h3 className={heading}>App visibility</h3>
                <select
                  value={adminConfig.visibility}
                  onChange={e => handleVisibilityChange(e.target.value)}
                  className={inputCls}
                >
                  <option>Public</option>
                  <option>Private</option>
                  <option>Password Protected</option>
                </select>
                <label className={clsx('flex items-center gap-2 cursor-pointer', labelCls)}>
                  <input
                    type="checkbox"
                    checked={requireLogin}
                    onChange={e => {
                      setRequireLogin(e.target.checked);
                      updateAdminConfig({ requireLogin: e.target.checked });
                    }}
                    className="rounded text-indigo-600"
                  />
                  Require login before app preview
                </label>
                {adminConfig.visibility === 'Password Protected' && !adminConfig.security?.previewPassword && (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                    <AlertCircle size={10} /> Set a password in Security tab
                  </p>
                )}
              </div>
              <div className={clsx(card, 'p-4 space-y-3')}>
                <h3 className={heading}>Invite users</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-mono">{inviteLink}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={handleCopyInvite} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    {copiedInvite ? 'Copied!' : 'Copy invite link'}
                  </button>
                  <button type="button" onClick={() => window.open(inviteLink, '_blank')} className={btnOutline}>
                    Open
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="max-w-xl space-y-4">
            <div className={clsx(card, 'p-4 space-y-3')}>
              <p className={heading}>Working invite link</p>
              <p className="text-[11px] text-slate-500">Recipients sign in, then land on this app preview automatically.</p>
              {inviteSync === 'ok' && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Synced to cloud — link works on other devices.</p>
              )}
              {inviteSync.startsWith('error:') && (
                <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                  Cloud sync failed ({inviteSync.replace(/^error:/, '')}). Fix Firestore rules (see firestore.rules in repo) and tap Sync again.
                </p>
              )}
              {!firebaseUser?.uid && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Sign in to save invites for other users.</p>
              )}
              <input readOnly value={inviteLink} className={clsx(inputCls, 'font-mono bg-slate-50')} onClick={e => e.target.select()} />
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={handleSyncInvite} className="flex-1 min-w-[120px] py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  Sync to cloud
                </button>
                <button type="button" onClick={handleCopyInvite} className="flex-1 min-w-[120px] py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                  {copiedInvite ? 'Copied!' : 'Copy invite link'}
                </button>
                <button type="button" onClick={() => window.open(inviteLink, '_blank')} className={btnOutline}>Test link</button>
              </div>
            </div>
            <div className={clsx(card, 'p-4 space-y-3')}>
              <p className={heading}>Invite by email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && inviteEmail.includes('@')) {
                      setInviteEmails(em => [...em, inviteEmail.trim()]);
                      setInviteEmail('');
                    }
                  }}
                  placeholder="colleague@company.com"
                  className={clsx(inputCls, 'flex-1')}
                />
                <button type="button" onClick={() => { if (inviteEmail.includes('@')) { setInviteEmails(em => [...em, inviteEmail.trim()]); setInviteEmail(''); } }} className={btnOutline}>Add</button>
              </div>
              {inviteEmails.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {inviteEmails.map(e => (
                    <span key={e} className="text-[10px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                      {e}
                      <button type="button" className="ml-1" onClick={() => setInviteEmails(em => em.filter(x => x !== e))}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" onClick={handleSendInvites} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                <Send size={12} /> Send invites (opens email with link)
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <th className="text-left px-4 py-2">Email</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv.id} className="border-t">
                      <td className="px-4 py-2.5 font-mono">{inv.email}</td>
                      <td className="px-4 py-2.5 text-amber-600 font-bold">{inv.status}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button type="button" onClick={() => setInvitations(removeAppInvitation(appInstanceId, inv.id))} className="text-red-400"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  {invitations.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No invitations yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden max-w-3xl">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className={headingSm}>Registered users</h3>
              <p className="text-xs text-slate-500">App preview sign-ins</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {appSessionUsers.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-3 font-semibold">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-indigo-500 font-bold">{u.role}</td>
                  </tr>
                ))}
                {appSessionUsers.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No sign-ins yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border p-4 max-w-4xl space-y-3">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className={headingSm}>Database explorer</h3>
              {tableKeys.length > 0 && (
                <select value={selectedTable || tableKeys[0]} onChange={e => setSelectedTable(e.target.value)} className="text-xs px-3 py-1.5 rounded-xl border">
                  {tableKeys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              )}
            </div>
            {(() => {
              const key = selectedTable || tableKeys[0];
              const rows = sampleData[key] || [];
              if (!rows.length) return <p className="text-sm text-slate-400 text-center py-6">No data</p>;
              const cols = Object.keys(rows[0]).filter(c => c !== 'id').slice(0, 6);
              return (
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800">
                        <th className="px-3 py-2 text-left">id</th>
                        {cols.map(c => <th key={c} className="px-3 py-2 text-left">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 25).map((row, i) => (
                        <tr key={row.id || i} className="border-t">
                          <td className="px-3 py-2 font-mono text-[10px]">{row.id}</td>
                          {cols.map(c => <td key={c} className="px-3 py-2 truncate max-w-[120px]">{String(row[c] ?? '')}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
            {CORE_INTEGRATIONS.map(id => {
              const meta = INTEGRATION_REGISTRY[id];
              if (!meta) return null;
              const configured = isIntegrationConfigured(id);
              const editing = editingIntegration === id;
              return (
                <div key={id} className="p-4 rounded-xl border bg-white dark:bg-slate-900">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{meta.displayName}</p>
                  {configured && !editing && <p className="text-[10px] text-emerald-600 font-mono mt-1">Key: {maskSecret(integrationKeys[id]?.apiKey || integrationKeys[id]?.token)}</p>}
                  {editing ? (
                    <div className="space-y-2 mt-2">
                      <input type="password" className="w-full text-xs px-2 py-1.5 border rounded-lg" value={keyDraft[id]?.apiKey || keyDraft[id]?.token || ''} onChange={e => setKeyDraft(d => ({ ...d, [id]: { apiKey: e.target.value, token: e.target.value } }))} />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveIntegration(id)} className="flex-1 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded-lg">Save</button>
                        <button type="button" onClick={() => setEditingIntegration(null)} className="px-2 text-[10px] border rounded-lg">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setEditingIntegration(id); setKeyDraft(d => ({ ...d, [id]: integrationKeys[id] || {} })); }} className="mt-2 w-full py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded-lg">
                      {configured ? 'Update key' : 'Add key'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 max-w-2xl space-y-4">
            {!adminConfig.deployed ? (
              <div className="text-center space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <p className="text-sm font-semibold">Deploy required</p>
                <p className="text-xs text-slate-500">Mark the app as deployed from Overview first.</p>
                <button type="button" onClick={() => { handleDeploy(); setActiveTab('domains'); }} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                  Deploy now
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className={headingSm}>Custom domain</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Point your domain to this app</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">https://</span>
                    <input
                      value={domainInput}
                      onChange={e => setDomainInput(e.target.value)}
                      placeholder="app.myorganization.com"
                      className="w-full pl-14 pr-3 py-2.5 rounded-xl border text-xs dark:bg-slate-800"
                    />
                  </div>
                  <button type="button" onClick={handleConnectDomain} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shrink-0">
                    Connect domain
                  </button>
                </div>
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                        <th className="px-4 py-2 text-left">Domain</th>
                        <th className="px-4 py-2 text-left">DNS</th>
                        <th className="px-4 py-2 text-left">Points to</th>
                        <th className="px-4 py-2 text-left">SSL</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {allDomains.map(d => (
                        <tr key={d.id} className="border-t">
                          <td className="px-4 py-3 font-semibold">{d.hostname}</td>
                          <td className="px-4 py-3 font-mono text-indigo-500">{d.recordType}</td>
                          <td className="px-4 py-3 font-mono text-slate-400 text-[10px]">{d.target}</td>
                          <td className="px-4 py-3">
                            <span className={clsx('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border',
                              d.sslStatus === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200',
                            )}>
                              {d.sslStatus === 'active' ? 'SSL active' : 'SSL pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {d.id !== 'platform_default' && (
                              <button type="button" onClick={() => handleRemoveDomain(d.id)} className="text-red-400 text-[10px] font-bold">Remove</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Direct share: {shareLink}</p>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-4">
              <h3 className={clsx(headingSm, 'uppercase tracking-wider')}>Profile</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Display name</label>
                <input value={settingsDraft.displayName} onChange={e => setSettingsDraft(s => ({ ...s, displayName: e.target.value }))} className="w-full mt-1 text-xs px-3 py-2 rounded-xl border dark:bg-slate-800" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Support email</label>
                <input value={settingsDraft.supportEmail} onChange={e => setSettingsDraft(s => ({ ...s, supportEmail: e.target.value }))} className="w-full mt-1 text-xs px-3 py-2 rounded-xl border dark:bg-slate-800" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                <textarea value={settingsDraft.appDescription} onChange={e => setSettingsDraft(s => ({ ...s, appDescription: e.target.value }))} rows={2} className="w-full mt-1 text-xs px-3 py-2 rounded-xl border dark:bg-slate-800 resize-none" />
              </div>
              <button type="button" onClick={() => setIsLoggedIn(false)} className="w-full flex items-center justify-center gap-1 py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-200">
                <LogOut size={12} /> Sign out of app preview
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-3">
              <h3 className={clsx(headingSm, 'uppercase tracking-wider')}>Notifications</h3>
              {[
                ['emailDigests', 'Email digests'],
                ['recordAlerts', 'New record alerts'],
                ['weeklySummary', 'Weekly summary'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!settingsDraft.notifications?.[key]}
                    onChange={e => setSettingsDraft(s => ({
                      ...s,
                      notifications: { ...s.notifications, [key]: e.target.checked },
                    }))}
                    className="rounded text-indigo-600"
                  />
                  {label}
                </label>
              ))}
            </div>
            <button type="button" onClick={handleSaveSettings} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
              Save settings
            </button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-md space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-4">
              <h3 className={headingSm}>Change app preview password</h3>
              <p className="text-xs text-slate-500">Used when visibility is &quot;Password Protected&quot;</p>
              {adminConfig.security?.previewPassword && (
                <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full text-xs px-3 py-2 rounded-xl border dark:bg-slate-800" />
              )}
              <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full text-xs px-3 py-2 rounded-xl border dark:bg-slate-800" />
              <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full text-xs px-3 py-2 rounded-xl border dark:bg-slate-800" />
              <button type="button" onClick={handleChangePassword} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                Update password
              </button>
              {adminConfig.security?.lastPasswordChange && (
                <p className="text-[10px] text-slate-400">Last changed: {new Date(adminConfig.security.lastPasswordChange).toLocaleString()}</p>
              )}
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-3">
              <h3 className={headingSm}>Two-factor authentication</h3>
              <p className="text-xs text-slate-500">Simulated 2FA gate for the app preview</p>
              <button
                type="button"
                onClick={handleToggle2FA}
                className={clsx('w-full py-2.5 rounded-xl text-xs font-bold border',
                  adminConfig.security?.twoFactorEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800',
                )}
              >
                {adminConfig.security?.twoFactorEnabled ? '2FA enabled — click to disable' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
