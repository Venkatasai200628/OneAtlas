
import { useState, useMemo, useEffect } from 'react';
import { loadAppAdminConfig, saveAppAdminConfig } from '@/lib/appAdminConfig';
import { persistInvitePayload } from '@/lib/appInvitePayload';
import AppPreview from '@/components/AppPreview';
import GeneratedAppAdminPanel from '@/components/GeneratedAppAdminPanel';
import { useStore } from '@/lib/store';
import { getAppSessionUsers, recordAppSessionUser } from '@/lib/appSessionUsers';
import { INTEGRATION_REGISTRY } from '@/lib/integrationRegistry';
import {
  loadIntegrationKeys,
  saveIntegrationKey,
  removeIntegrationKey,
  syncIntegrationKeysToServer,
} from '@/lib/integrationKeys';
import clsx from 'clsx';
import { Chrome, Lock, LogOut, Monitor, Smartphone, Tablet } from 'lucide-react';

const VIEWPORT_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '390px' };

function MockLogin({ appName, primaryColor, onLogin, email, password, onEmail, onPassword, error, onUsePlatformAccount, platformEmail }) {
  return (
    <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg space-y-5">
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, #8b5cf6)` }}
          >
            {String(appName || 'A')[0]}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to {appName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preview login for this generated app only — separate from your One Atlas platform account.
          </p>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); onLogin(); }}
          className="space-y-3"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => onEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => onPassword(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Sign in with Email
          </button>
        </form>
        {platformEmail && onUsePlatformAccount && (
          <button
            type="button"
            onClick={onUsePlatformAccount}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-700 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Chrome size={14} /> Use my One Atlas account ({platformEmail})
          </button>
        )}
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
          Default app admin: <code className="font-mono">admin@{String(appName).toLowerCase().replace(/[^a-z0-9]+/g, '')}.com</code> / password
        </p>
      </div>
    </div>
  );
}

export default function GeneratedAppWorkspace({
  intent,
  appSpec,
  schema,
  projectMeta = null,
  fullscreen = false,
}) {
  const [workspaceTab, setWorkspaceTab] = useState('preview');
  const [viewport, setViewport] = useState('desktop');
  const [requireLogin, setRequireLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState(() =>
    `admin@${(intent?.appName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
  );
  const [loginPassword, setLoginPassword] = useState('password');
  const [loginError, setLoginError] = useState('');
  const [integrationKeys, setIntegrationKeys] = useState(() => loadIntegrationKeys());
  const [keyDraft, setKeyDraft] = useState({});
  const [editingIntegration, setEditingIntegration] = useState(null);

  const firebaseUser = useStore(s => s.user);
  const history = useStore(s => s.history);

  const appName = intent?.appName || 'App';
  const primaryColor = appSpec?.appPreview?.primaryColor || '#6366f1';
  const appInstanceId = projectMeta?.instanceId
    || (projectMeta?.evalId ? `eval-${projectMeta.evalId}` : null)
    || `${(intent?.appName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(appSpec?.pages?.length || 0)}`;

  const [appSessionUsers, setAppSessionUsers] = useState(() => getAppSessionUsers(appInstanceId));
  const [adminConfig, setAdminConfig] = useState(() => loadAppAdminConfig(appInstanceId));
  const [previewPasswordInput, setPreviewPasswordInput] = useState('');
  const [previewPasswordOk, setPreviewPasswordOk] = useState(false);

  useEffect(() => {
    const cfg = loadAppAdminConfig(appInstanceId);
    setAdminConfig(cfg);
    setPreviewPasswordOk(false);
    if (typeof cfg.requireLogin === 'boolean') setRequireLogin(cfg.requireLogin);
  }, [appInstanceId]);

  useEffect(() => {
    if (!intent || !appSpec || !firebaseUser?.uid) return;
    persistInvitePayload(appInstanceId, {
      intent,
      appSpec,
      schema,
      appName,
      ownerUid: firebaseUser.uid,
    });
  }, [appInstanceId, intent, appSpec, schema, appName, firebaseUser?.uid]);

  const updateAdminConfig = (patch) => {
    const next = saveAppAdminConfig(appInstanceId, patch);
    setAdminConfig(next);
    if (typeof patch.requireLogin === 'boolean') setRequireLogin(patch.requireLogin);
    return next;
  };

  const hooks = appSpec?.integrationHooks || [];
  const workflowIntegrations = (appSpec?.workflowStubs || []).map(w => w.integration).filter(Boolean);
  const requestedIds = [...new Set([
    ...(intent?.integrations_requested || []),
    ...hooks.map(h => h.integration),
    ...workflowIntegrations,
  ])].filter(id => INTEGRATION_REGISTRY[id]);

  const billingRows = useMemo(() => {
    const sd = appSpec?.sampleData || {};
    const rows = sd.billing || sd.orders || sd.invoices || [];
    return Array.isArray(rows) ? rows : [];
  }, [appSpec?.sampleData]);

  const usageForApp = useMemo(() => {
    const name = intent?.appName?.toLowerCase();
    return (history || []).filter(
      h => !name || (h.appName || '').toLowerCase() === name,
    );
  }, [history, intent?.appName]);

  const needsAppPassword = adminConfig.visibility === 'Password Protected'
    && adminConfig.security?.previewPassword
    && !previewPasswordOk;

  const handleLogin = () => {
    setLoginError('');
    if (adminConfig.visibility === 'Password Protected' && adminConfig.security?.previewPassword) {
      if (loginPassword !== adminConfig.security.previewPassword) {
        setLoginError('Incorrect app password (set in Admin → Security).');
        return;
      }
    }
    const name = loginEmail.split('@')[0];
    const next = recordAppSessionUser(appInstanceId, { email: loginEmail, name, role: 'User' });
    setAppSessionUsers(next);
    setIsLoggedIn(true);
  };

  const handleUsePlatformAccount = () => {
    if (!firebaseUser?.email) return;
    setLoginEmail(firebaseUser.email);
    setLoginPassword('');
    const next = recordAppSessionUser(appInstanceId, {
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      role: 'Owner',
    });
    setAppSessionUsers(next);
    setIsLoggedIn(true);
  };

  const saveIntegration = async (id) => {
    const draft = keyDraft[id] || {};
    const saved = saveIntegrationKey(id, draft);
    setIntegrationKeys(saved);
    setEditingIntegration(null);
    await syncIntegrationKeysToServer(saved);
  };

  const disconnectIntegration = async (id) => {
    const saved = removeIntegrationKey(id);
    setIntegrationKeys(saved);
    await syncIntegrationKeysToServer(saved);
  };

  const demoUser = { email: loginEmail, name: loginEmail.split('@')[0] };

  return (
    <div className={clsx('flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden', !fullscreen && 'rounded-xl border border-slate-200 dark:border-slate-700')}>
      {}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <button
            type="button"
            onClick={() => setWorkspaceTab('preview')}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              workspaceTab === 'preview'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400',
            )}
          >
            App preview
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab('admin')}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              workspaceTab === 'admin'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400',
            )}
          >
            Admin panel
          </button>
        </div>
        <div className="flex items-center gap-3">
          {workspaceTab === 'preview' && (
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
              {[
                { id: 'desktop', icon: Monitor, title: 'Desktop' },
                { id: 'tablet', icon: Tablet, title: 'Tablet' },
                { id: 'mobile', icon: Smartphone, title: 'Phone' },
              ].map(({ id, icon: Icon, title }) => (
                <button
                  key={id}
                  type="button"
                  title={title}
                  onClick={() => setViewport(id)}
                  className={clsx(
                    'p-1.5 rounded-md transition-all',
                    viewport === id
                      ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                  )}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
            <Lock size={10} className="text-emerald-500 shrink-0" />
            <span className="truncate">
              {workspaceTab === 'admin' ? '/admin' : requireLogin && !isLoggedIn ? '/login' : '/app'}
            </span>
          </div>
        </div>
      </div>

      {workspaceTab === 'preview' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {needsAppPassword && !previewPasswordOk ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (previewPasswordInput === adminConfig.security.previewPassword) {
                    setPreviewPasswordOk(true);
                    setPreviewPasswordInput('');
                  } else {
                    setLoginError('Incorrect password');
                  }
                }}
                className="w-full max-w-sm space-y-3 bg-white dark:bg-slate-800 p-6 rounded-2xl border"
              >
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Password protected app</h2>
                <p className="text-xs text-slate-500">Enter the preview password from Admin → Security.</p>
                <input
                  type="password"
                  value={previewPasswordInput}
                  onChange={e => setPreviewPasswordInput(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border dark:bg-slate-900"
                  placeholder="App password"
                />
                {loginError && <p className="text-xs text-red-500">{loginError}</p>}
                <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold">Continue</button>
              </form>
            </div>
          ) : requireLogin && !isLoggedIn ? (
            <MockLogin
              appName={appName}
              primaryColor={primaryColor}
              email={loginEmail}
              password={loginPassword}
              onEmail={setLoginEmail}
              onPassword={setLoginPassword}
              error={loginError}
              onLogin={handleLogin}
              platformEmail={firebaseUser?.email}
              onUsePlatformAccount={firebaseUser?.email ? handleUsePlatformAccount : undefined}
            />
          ) : (
            <div className="flex-1 min-h-0 relative flex flex-col items-center bg-slate-100/80 dark:bg-slate-950/80 overflow-auto">
              <div
                className={clsx(
                  'flex-1 min-h-0 w-full transition-all duration-300 mx-auto',
                  viewport !== 'desktop' && 'my-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden',
                )}
                style={{ maxWidth: VIEWPORT_WIDTHS[viewport] }}
              >
                <AppPreview
                  intent={intent}
                  appSpec={appSpec}
                  schema={schema}
                  viewport={viewport}
                  integrationKeys={integrationKeys}
                  appInstanceId={appInstanceId}
                  currentUser={isLoggedIn || !requireLogin ? {
                    email: loginEmail,
                    name: appSessionUsers.find(u => u.email === loginEmail)?.name || demoUser.name,
                  } : null}
                />
              </div>
              {requireLogin && isLoggedIn && (
              <button
                type="button"
                onClick={() => setIsLoggedIn(false)}
                className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-red-500 z-10 shadow-sm"
              >
                <LogOut size={11} /> Sign out
              </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <GeneratedAppAdminPanel
          appName={appName}
          intent={intent}
          appSpec={appSpec}
          schema={schema}
          primaryColor={primaryColor}
          appInstanceId={appInstanceId}
          adminConfig={adminConfig}
          updateAdminConfig={updateAdminConfig}
          appSessionUsers={appSessionUsers}
          requireLogin={requireLogin}
          setRequireLogin={setRequireLogin}
          projectMeta={projectMeta}
          loginEmail={loginEmail}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          onOpenPreview={() => setWorkspaceTab('preview')}
          integrationKeys={integrationKeys}
          keyDraft={keyDraft}
          setKeyDraft={setKeyDraft}
          editingIntegration={editingIntegration}
          setEditingIntegration={setEditingIntegration}
          requestedIds={requestedIds}
          saveIntegration={saveIntegration}
          disconnectIntegration={disconnectIntegration}
          usageForApp={usageForApp}
          billingRows={billingRows}
        />
      )}
    </div>
  );
}
