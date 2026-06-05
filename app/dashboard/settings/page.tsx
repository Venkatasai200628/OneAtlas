"use client";
import { useState } from "react";
import { useUserStore, type ApiKeyEntry } from "@/store";
import { MODEL_REGISTRY } from "@/lib/models";
import { cn, generateId, formatRelativeTime } from "@/lib/utils";
import { User, Building2, Key, Cpu, AlertTriangle, Copy, Check, Eye, EyeOff, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "org", label: "Organisation", icon: Building2 },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "model", label: "Default Model", icon: Cpu },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export default function SettingsPage() {
  const {
    userName, userEmail, userAvatar, orgName, plan, defaultModel,
    apiKeys, updateProfile, updateOrg, setDefaultModel, addApiKey, removeApiKey
  } = useUserStore();

  const [tab, setTab] = useState("profile");
  const [copied, setCopied] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Profile form state
  const [editName, setEditName] = useState(userName || "");
  const [editEmail, setEditEmail] = useState(userEmail || "");
  const [editOrgName, setEditOrgName] = useState(orgName || "");

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    updateProfile({ name: editName, email: editEmail });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveOrg = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    updateOrg({ name: editOrgName });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleGenerateKey = () => {
    if (!newKeyLabel.trim()) return;
    const raw = `sk-oa-${generateId()}-${generateId()}`;
    const newKey: ApiKeyEntry = {
      id: generateId(),
      label: newKeyLabel.trim(),
      keyHash: raw,
      keyMasked: `sk-oa-${raw.substring(6, 14)}${"•".repeat(20)}`,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
    };
    addApiKey(newKey);
    setShowNewKey(raw);
    setNewKeyLabel("");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const members = [
    { name: userName || "You", email: userEmail || "you@example.com", role: "owner", joined: "Jan 2026" },
    { name: "Sarah Chen", email: "sarah@acme.com", role: "admin", joined: "Feb 2026" },
    { name: "Marcus Rodriguez", email: "marcus@acme.com", role: "member", joined: "Mar 2026" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#111111] tracking-[-0.02em]">Settings</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Manage your account, organisation, and preferences</p>
      </div>
      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-44 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium mb-1 transition-all text-left",
                tab === id ? "bg-[#F5F5EE] text-[#111111]" : "text-[#6B7280] hover:bg-[#F9F9F7] hover:text-[#111111]")}>
              <Icon className={cn("w-4 h-4", id === "danger" && "text-red-500")} />
              <span className={id === "danger" ? "text-red-600" : ""}>{label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6">
              <h2 className="text-[17px] font-semibold text-[#111111] mb-5">Profile</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6600] to-[#FF8533] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {(editName || "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#111111]">Profile photo</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">JPG, PNG or WebP. Max 2MB.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1.5">Display Name</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full h-11 px-4 rounded-[12px] border border-[#E5E7EB] bg-white text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1.5">Email Address</label>
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-4 rounded-[12px] border border-[#E5E7EB] bg-white text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-[#E5E7EB] flex items-center gap-3">
                <button onClick={handleSaveProfile} disabled={saving}
                  className="flex items-center gap-2 px-5 h-11 bg-[#FF6600] text-white rounded-[12px] text-sm font-semibold hover:bg-[#E65C00] transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
                  {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
                </button>
                {saved && <p className="text-sm text-green-600">Profile updated successfully</p>}
              </div>
            </div>
          )}

          {/* ── ORGANISATION ── */}
          {tab === "org" && (
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6">
              <h2 className="text-[17px] font-semibold text-[#111111] mb-5">Organisation</h2>
              <div className="flex items-center gap-3 mb-6 p-3 bg-[#F5F5EE] rounded-[12px]">
                <div className="w-9 h-9 rounded-[10px] bg-[#FF6600] flex items-center justify-center text-white font-bold">
                  {(editOrgName || "A")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{orgName || "Your Organisation"}</p>
                  <span className="text-[11px] font-medium text-[#FF6600] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">{plan}</span>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#111111] mb-1.5">Organisation Name</label>
                <input value={editOrgName} onChange={e => setEditOrgName(e.target.value)}
                  className="w-full h-11 px-4 rounded-[12px] border border-[#E5E7EB] bg-white text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
              </div>
              <button onClick={handleSaveOrg} disabled={saving}
                className="flex items-center gap-2 px-5 h-11 bg-[#FF6600] text-white rounded-[12px] text-sm font-semibold hover:bg-[#E65C00] transition-colors disabled:opacity-60 mb-8">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
                {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
              </button>

              <h3 className="text-[15px] font-semibold text-[#111111] mb-4">Members</h3>
              <div className="divide-y divide-[#F0F0EA] mb-5">
                {members.map(m => (
                  <div key={m.email} className="flex items-center gap-3 py-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">{m.name}</p>
                      <p className="text-xs text-[#9CA3AF] truncate">{m.email} · Joined {m.joined}</p>
                    </div>
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border",
                      m.role === "owner" ? "text-[#FF6600] bg-orange-50 border-orange-200" :
                      m.role === "admin" ? "text-blue-600 bg-blue-50 border-blue-200" :
                      "text-gray-600 bg-gray-50 border-gray-200")}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1.5">Invite member</label>
                <div className="flex gap-2">
                  <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 h-11 px-4 rounded-[12px] border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
                  <button onClick={() => { if (inviteEmail) { alert(`Invite sent to ${inviteEmail}`); setInviteEmail(""); }}}
                    className="flex items-center gap-1.5 px-4 h-11 bg-white border border-[#E5E7EB] rounded-[12px] text-sm font-semibold text-[#111111] hover:bg-[#F5F5EE] transition-colors">
                    <Plus className="w-4 h-4" /> Invite
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── API KEYS ── */}
          {tab === "api-keys" && (
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6">
              <h2 className="text-[17px] font-semibold text-[#111111] mb-1">API Keys</h2>
              <p className="text-sm text-[#9CA3AF] mb-5">Keys are hashed — the raw value is shown once on creation.</p>

              {/* New key shown after creation */}
              {showNewKey && (
                <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-[14px]">
                  <p className="text-sm font-semibold text-green-700 mb-2">✓ Key created — copy it now, it won't be shown again</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-white border border-green-200 rounded-[8px] px-3 py-2 text-green-800 break-all">{showNewKey}</code>
                    <button onClick={() => copyToClipboard(showNewKey, "new")}
                      className="p-2 rounded-[8px] bg-green-100 text-green-700 hover:bg-green-200 transition-colors shrink-0">
                      {copied === "new" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={() => setShowNewKey(null)} className="mt-2 text-xs text-green-600 hover:underline">Dismiss</button>
                </div>
              )}

              {/* Generate new key */}
              <div className="mb-5 p-4 bg-[#F9F9F7] border border-[#E5E7EB] rounded-[14px]">
                <p className="text-sm font-semibold text-[#111111] mb-3">Generate new key</p>
                <div className="flex gap-2">
                  <input value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)}
                    placeholder="Key label (e.g. Production, CI/CD)"
                    className="flex-1 h-10 px-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
                  <button onClick={handleGenerateKey} disabled={!newKeyLabel.trim()}
                    className="flex items-center gap-1.5 px-4 h-10 bg-[#FF6600] text-white rounded-[10px] text-sm font-semibold hover:bg-[#E65C00] disabled:opacity-40 transition-colors">
                    <Plus className="w-4 h-4" /> Generate
                  </button>
                </div>
              </div>

              {/* Existing keys */}
              <div className="space-y-3">
                {apiKeys.map(k => (
                  <div key={k.id} className="flex items-start gap-3 p-4 border border-[#E5E7EB] rounded-[14px] hover:border-[#9CA3AF] transition-colors">
                    <Key className="w-4 h-4 text-[#9CA3AF] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111111]">{k.label}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <code className="text-xs font-mono text-[#6B7280] bg-[#F5F5EE] px-2 py-0.5 rounded">
                          {showKeys[k.id] ? k.keyHash : k.keyMasked}
                        </code>
                        <button onClick={() => setShowKeys(p => ({ ...p, [k.id]: !p[k.id] }))}
                          className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                          {showKeys[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyToClipboard(k.keyMasked, k.id)}
                          className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                          {copied === k.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                        Last used: {k.lastUsedAt ? formatRelativeTime(k.lastUsedAt) : "Never"} ·
                        Expires: {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                    <button onClick={() => removeApiKey(k.id)}
                      className="text-[#9CA3AF] hover:text-red-500 transition-colors shrink-0 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DEFAULT MODEL ── */}
          {tab === "model" && (
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6">
              <h2 className="text-[17px] font-semibold text-[#111111] mb-1">Default Model</h2>
              <p className="text-sm text-[#9CA3AF] mb-5">Org-level default for all new generations. Projects can override.</p>
              <div className="space-y-2">
                {MODEL_REGISTRY.map(m => (
                  <button key={m.id} onClick={() => setDefaultModel(m.id)}
                    className={cn("w-full flex items-center gap-3 p-3.5 rounded-[14px] border transition-all text-left",
                      defaultModel === m.id ? "border-[#FF6600] bg-orange-50" : "border-[#E5E7EB] hover:border-[#9CA3AF]")}>
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      defaultModel === m.id ? "border-[#FF6600]" : "border-[#D1D5DB]")}>
                      {defaultModel === m.id && <div className="w-2 h-2 rounded-full bg-[#FF6600]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#111111]">{m.name}</span>
                        {m.badge && <span className="text-[10px] font-semibold text-[#FF6600] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">{m.badge}</span>}
                      </div>
                      <p className="text-xs text-[#9CA3AF] truncate">{m.description}</p>
                    </div>
                    <span className="text-xs text-[#9CA3AF] shrink-0">{m.provider}</span>
                  </button>
                ))}
              </div>
              {saved && <p className="mt-3 text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Default model updated</p>}
            </div>
          )}

          {/* ── DANGER ZONE ── */}
          {tab === "danger" && (
            <div className="bg-white border border-red-200 rounded-[20px] p-6">
              <h2 className="text-[17px] font-semibold text-red-600 mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-[14px]">
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">Delete all projects</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Permanently delete all projects and their data.</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-[10px] text-sm font-semibold hover:bg-red-700 transition-colors">
                    Delete all
                  </button>
                </div>
                <div className="p-4 border border-red-200 rounded-[14px] bg-red-50">
                  <p className="text-sm font-semibold text-red-700 mb-1">Delete account</p>
                  <p className="text-xs text-red-500 mb-3">Type <strong>DELETE</strong> to confirm. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="flex-1 h-9 px-3 rounded-[8px] border border-red-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400/20" />
                    <button disabled={deleteConfirm !== "DELETE"}
                      className="px-4 h-9 bg-red-600 text-white rounded-[8px] text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
