
import { create } from 'zustand';
import { loadLocalProjects, saveLocalProjects } from '@/lib/projectsStorage';

const safe = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v !== null ? v : fallback; }
  catch { return fallback; }
};

const safeJson = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export const useStore = create((set, get) => ({

  theme: safe('theme', 'light'),
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch {}
    set({ theme: next });
  },

  user: null,
  authLoading: true,
  setUser: (user) => set({ user }),
  setAuthLoading: (v) => set({ authLoading: v }),

  anthropicKey: safe('af_key', ''),
  setAnthropicKey: (key) => {
    try { localStorage.setItem('af_key', key); } catch {}
    set({ anthropicKey: key });
  },

  groqModel: safe('af_model', 'llama-3.3-70b-versatile'),
  setGroqModel: (m) => {
    try { localStorage.setItem('af_model', m); } catch {}
    set({ groqModel: m });
  },

  customInstructions: safe('af_instructions', ''),
  setCustomInstructions: (v) => {
    try { localStorage.setItem('af_instructions', v); } catch {}
    set({ customInstructions: v });
  },

  isGenerating: false,
  pipelineProgress: safeJson('af_pipeline_progress', []),
  generationResult: safeJson('af_generation_result', null),
  generatePrompt: safe('af_generate_prompt', ''),
  abortController: null,
  pendingIntent: null,
  registeredUsers: [],

  setGenerating: (v) => set({ isGenerating: v }),
  addProgress: (step) => set(s => {
    const pipelineProgress = [...s.pipelineProgress, { ...step, ts: Date.now() }];
    try { localStorage.setItem('af_pipeline_progress', JSON.stringify(pipelineProgress)); } catch {}
    return { pipelineProgress };
  }),
  clearProgress: () => {
    try {
      localStorage.removeItem('af_pipeline_progress');
      localStorage.removeItem('af_generation_result');
      localStorage.removeItem('af_generate_prompt');
    } catch {}
    set({ pipelineProgress: [], generationResult: null, pendingIntent: null, generatePrompt: '' });
  },
  setResult: (r) => {
    try { localStorage.setItem('af_generation_result', JSON.stringify(r)); } catch {}
    set({ generationResult: r });
  },
  setGeneratePrompt: (prompt) => {
    try { localStorage.setItem('af_generate_prompt', prompt); } catch {}
    set({ generatePrompt: prompt });
  },
  setRegisteredUsers: (users) => set({ registeredUsers: users }),
  setAbortController: (ac) => set({ abortController: ac }),
  stopGeneration: () => {
    get().abortController?.abort();
    set({ isGenerating: false, abortController: null });
  },
  setPendingIntent: (intent) => set({ pendingIntent: intent }),

  apps: [],
  setApps: (apps) => {
    const uid = get().user?.uid || 'guest';
    saveLocalProjects(uid, apps);
    set({ apps });
  },
  addApp: (app) => set(s => {
    const apps = [app, ...s.apps.filter(a => a.id !== app.id)];
    saveLocalProjects(get().user?.uid || 'guest', apps);
    return { apps };
  }),
  updateApp: (id, patch) => set(s => {
    const apps = s.apps.map(a => (a.id === id ? { ...a, ...patch, id } : a));
    saveLocalProjects(get().user?.uid || 'guest', apps);
    return { apps };
  }),
  deleteApp: (id) => set(s => {
    const apps = s.apps.filter(a => a.id !== id);
    saveLocalProjects(get().user?.uid || 'guest', apps);
    return { apps };
  }),
  hydrateAppsFromLocal: (uid) => {
    const apps = loadLocalProjects(uid || 'guest');
    set({ apps });
    return apps;
  },

  providerKeys: safeJson('oa_provider_keys', {}),
  setProviderKey: (provider, key) => {
    const keys = { ...get().providerKeys, [provider]: key };
    try { localStorage.setItem('oa_provider_keys', JSON.stringify(keys)); } catch {}
    set({ providerKeys: keys });
  },
  removeProviderKey: (provider) => {
    const keys = { ...get().providerKeys };
    delete keys[provider];
    try { localStorage.setItem('oa_provider_keys', JSON.stringify(keys)); } catch {}
    set({ providerKeys: keys });
  },

  history: safeJson('oa_usage_history', []),
  addHistory: (item) => set(s => {
    const history = [{ ...item, at: item.at || new Date().toISOString() }, ...s.history].slice(0, 100);
    try { localStorage.setItem('oa_usage_history', JSON.stringify(history)); } catch {}
    return { history };
  }),
  clearHistory: () => {
    try { localStorage.removeItem('oa_usage_history'); } catch {}
    set({ history: [] });
  },

  notificationsEnabled: safe('af_notifs', 'false') === 'true',
  setNotifications: (v) => {
    try { localStorage.setItem('af_notifs', String(v)); } catch {}
    set({ notificationsEnabled: v });
  },

  benchmarkResults: [],
  benchmarkRunning: false,
  benchmarkRunningId: null,
  setBenchmarkResults: (r) => set({ benchmarkResults: r }),
  addBenchmarkResult: (r) => set(s => {
    const existing = s.benchmarkResults.filter(x => x.id !== r.id);
    return { benchmarkResults: [...existing, r] };
  }),
  setBenchmarkRunning: (v) => set({ benchmarkRunning: v }),
  setBenchmarkRunningId: (id) => set({ benchmarkRunningId: id }),

  orgs: safeJson('oa_orgs', [
    { id: 'acme', name: 'Acme Corp', plan: 'explorer' },
    { id: 'personal', name: 'Personal', plan: 'explorer' },
  ]),
  activeOrgId: safe('oa_active_org', 'acme'),
  setActiveOrg: (id) => {
    try { localStorage.setItem('oa_active_org', id); } catch {}
    set({ activeOrgId: id });
  },
  addOrg: (name) => {
    const id = `org_${Date.now()}`;
    const orgs = [...get().orgs, { id, name, plan: 'explorer' }];
    try { localStorage.setItem('oa_orgs', JSON.stringify(orgs)); } catch {}
    set({ orgs, activeOrgId: id });
    return id;
  },
  updateOrg: (id, patch) => {
    const orgs = get().orgs.map(o => (o.id === id ? { ...o, ...patch } : o));
    try { localStorage.setItem('oa_orgs', JSON.stringify(orgs)); } catch {}
    set({ orgs });
  },

  selectedModel: safe('oa_selected_model', 'auto'),
  setSelectedModel: (m) => {
    try { localStorage.setItem('oa_selected_model', m); } catch {}
    set({ selectedModel: m });
  },

  profilePhoto: safe('oa_profile_photo', ''),
  setProfilePhoto: (url) => {
    try { localStorage.setItem('oa_profile_photo', url); } catch {}
    set({ profilePhoto: url });
  },

  inAppNotifications: safeJson('oa_in_app_notifications', []),
  addInAppNotification: (item) => set(s => {
    const note = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      at: new Date().toISOString(),
      ...item,
    };
    const inAppNotifications = [note, ...s.inAppNotifications].slice(0, 50);
    try { localStorage.setItem('oa_in_app_notifications', JSON.stringify(inAppNotifications)); } catch {}
    return { inAppNotifications };
  }),
  markNotificationRead: (id) => set(s => {
    const inAppNotifications = s.inAppNotifications.map(n => (n.id === id ? { ...n, read: true } : n));
    try { localStorage.setItem('oa_in_app_notifications', JSON.stringify(inAppNotifications)); } catch {}
    return { inAppNotifications };
  }),
  markAllNotificationsRead: () => set(s => {
    const inAppNotifications = s.inAppNotifications.map(n => ({ ...n, read: true }));
    try { localStorage.setItem('oa_in_app_notifications', JSON.stringify(inAppNotifications)); } catch {}
    return { inAppNotifications };
  }),

  integrationKeys: safeJson('oa_integration_keys', {}),
  setIntegrationKey: (id, key) => {
    const integrationKeys = { ...get().integrationKeys, [id]: key };
    try { localStorage.setItem('oa_integration_keys', JSON.stringify(integrationKeys)); } catch {}
    set({ integrationKeys });
  },
  removeIntegrationKey: (id) => {
    const integrationKeys = { ...get().integrationKeys };
    delete integrationKeys[id];
    try { localStorage.setItem('oa_integration_keys', JSON.stringify(integrationKeys)); } catch {}
    set({ integrationKeys });
  },
}));
