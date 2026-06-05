import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ModelId, GenerationStage, AppSpec, GenerationJob } from "@/types";

// ── Project Store ────────────────────────────────────────────────────────────
import type { Project } from "@/types";

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProjectId: (id: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      selectedProjectId: null,
      setProjects: (projects) => set({ projects }),
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),
      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "oneatlas-projects",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ── Builder Store ─────────────────────────────────────────────────────────────
interface BuilderState {
  prompt: string;
  model: ModelId;
  mode: "build" | "plan";
  currentJob: GenerationJob | null;
  stages: GenerationStage[];
  appSpec: AppSpec | null;
  sseEvents: unknown[];
  isStreaming: boolean;
  streamError: string | null;
  viewMode: "preview" | "spec";
  viewport: "desktop" | "tablet" | "mobile";
  attachedFiles: File[];
  promptHistory: string[];
  setPrompt: (prompt: string) => void;
  setModel: (model: ModelId) => void;
  setMode: (mode: "build" | "plan") => void;
  setCurrentJob: (job: GenerationJob | null) => void;
  addSSEEvent: (event: unknown) => void;
  updateStage: (name: string, updates: Partial<GenerationStage>) => void;
  setAppSpec: (spec: AppSpec | null) => void;
  setIsStreaming: (s: boolean) => void;
  setStreamError: (e: string | null) => void;
  setViewMode: (m: "preview" | "spec") => void;
  setViewport: (v: "desktop" | "tablet" | "mobile") => void;
  addAttachedFile: (file: File) => void;
  removeAttachedFile: (index: number) => void;
  clearAttachedFiles: () => void;
  addToHistory: (prompt: string) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      prompt: "",
      model: "auto",
      mode: "build",
      currentJob: null,
      stages: [],
      appSpec: null,
      sseEvents: [],
      isStreaming: false,
      streamError: null,
      viewMode: "preview",
      viewport: "desktop",
      attachedFiles: [],
      promptHistory: [],
      setPrompt: (prompt) => set({ prompt }),
      setModel: (model) => set({ model }),
      setMode: (mode) => set({ mode }),
      setCurrentJob: (currentJob) => set({ currentJob }),
      addSSEEvent: (event) =>
        set((state) => ({ sseEvents: [...state.sseEvents, event] })),
      updateStage: (name, updates) =>
        set((state) => ({
          stages: state.stages.map((s) =>
            s.name === name ? { ...s, ...updates } : s
          ),
        })),
      setAppSpec: (appSpec) => set({ appSpec }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      setStreamError: (streamError) => set({ streamError }),
      setViewMode: (viewMode) => set({ viewMode }),
      setViewport: (viewport) => set({ viewport }),
      addAttachedFile: (file) =>
        set((state) => ({ attachedFiles: [...state.attachedFiles, file] })),
      removeAttachedFile: (index) =>
        set((state) => ({
          attachedFiles: state.attachedFiles.filter((_, i) => i !== index),
        })),
      clearAttachedFiles: () => set({ attachedFiles: [] }),
      addToHistory: (prompt) =>
        set((state) => ({
          promptHistory: [prompt, ...state.promptHistory.slice(0, 19)],
        })),
      reset: () =>
        set({
          currentJob: null,
          stages: [],
          appSpec: null,
          sseEvents: [],
          isStreaming: false,
          streamError: null,
        }),
    }),
    {
      name: "oneatlas-builder",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        model: state.model,
        mode: state.mode,
        promptHistory: state.promptHistory,
        viewport: state.viewport,
      }),
    }
  )
);

// ── User Store ────────────────────────────────────────────────────────────────
interface UserState {
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  orgId: string | null;
  orgName: string | null;
  orgSlug: string | null;
  plan: string;
  defaultModel: ModelId;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiKeys: ApiKeyEntry[];
  setUser: (user: {
    userId: string; email: string; name: string;
    orgId: string; orgName: string; orgSlug: string;
    plan: string; defaultModel: ModelId;
  }) => void;
  updateProfile: (updates: { name?: string; email?: string; avatar?: string }) => void;
  updateOrg: (updates: { name?: string }) => void;
  setDefaultModel: (model: ModelId) => void;
  setIsLoading: (loading: boolean) => void;
  addApiKey: (key: ApiKeyEntry) => void;
  removeApiKey: (id: string) => void;
  logout: () => void;
}

export interface ApiKeyEntry {
  id: string;
  label: string;
  keyHash: string;
  keyMasked: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      userEmail: null,
      userName: null,
      userAvatar: null,
      orgId: null,
      orgName: null,
      orgSlug: null,
      plan: "free",
      defaultModel: "auto",
      isAuthenticated: false,
      isLoading: false,
      apiKeys: [
        {
          id: "key-1",
          label: "Production Key",
          keyHash: "hash-prod",
          keyMasked: "sk-oa-prod-••••••••••••••••••••••",
          lastUsedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          expiresAt: "2026-12-31T00:00:00.000Z",
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
        {
          id: "key-2",
          label: "Development Key",
          keyHash: "hash-dev",
          keyMasked: "sk-oa-dev-•••••••••••••••••••••••",
          lastUsedAt: new Date(Date.now() - 86400000).toISOString(),
          expiresAt: null,
          createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        },
      ],
      setUser: (user) =>
        set({
          userId: user.userId,
          userEmail: user.email,
          userName: user.name,
          orgId: user.orgId,
          orgName: user.orgName,
          orgSlug: user.orgSlug,
          plan: user.plan,
          defaultModel: user.defaultModel,
          isAuthenticated: true,
          isLoading: false,
        }),
      updateProfile: (updates) =>
        set((state) => ({
          userName: updates.name ?? state.userName,
          userEmail: updates.email ?? state.userEmail,
          userAvatar: updates.avatar ?? state.userAvatar,
        })),
      updateOrg: (updates) =>
        set((state) => ({
          orgName: updates.name ?? state.orgName,
        })),
      setDefaultModel: (defaultModel) => set({ defaultModel }),
      setIsLoading: (isLoading) => set({ isLoading }),
      addApiKey: (key) =>
        set((state) => ({ apiKeys: [key, ...state.apiKeys] })),
      removeApiKey: (id) =>
        set((state) => ({
          apiKeys: state.apiKeys.filter((k) => k.id !== id),
        })),
      logout: () =>
        set({
          userId: null, userEmail: null, userName: null, userAvatar: null,
          orgId: null, orgName: null, orgSlug: null,
          plan: "free", defaultModel: "auto",
          isAuthenticated: false, isLoading: false,
        }),
    }),
    {
      name: "oneatlas-user",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ── Integration Store ─────────────────────────────────────────────────────────
interface IntegrationState {
  connectedIds: string[];
  toggleIntegration: (id: string) => void;
  isConnected: (id: string) => boolean;
}

export const useIntegrationStore = create<IntegrationState>()(
  persist(
    (set, get) => ({
      connectedIds: ["slack", "github"],
      toggleIntegration: (id) =>
        set((state) => {
          const exists = state.connectedIds.includes(id);
          return {
            connectedIds: exists
              ? state.connectedIds.filter((c) => c !== id)
              : [...state.connectedIds, id],
          };
        }),
      isConnected: (id) => get().connectedIds.includes(id),
    }),
    {
      name: "oneatlas-integrations",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
