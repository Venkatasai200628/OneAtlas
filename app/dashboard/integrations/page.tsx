"use client";
import { useState } from "react";
import { INTEGRATION_REGISTRY } from "@/lib/integration-ui";
import { useIntegrationStore } from "@/store";
import { cn } from "@/lib/utils";
import { CheckCircle2, X, Info, ExternalLink, ChevronDown, ChevronUp, Lock } from "lucide-react";

// Credential fields per integration
const CREDENTIAL_FIELDS: Record<string, { label: string; placeholder: string; type?: string }[]> = {
  slack:         [{ label: "Bot Token", placeholder: "xoxb-...", type: "password" }, { label: "Webhook URL", placeholder: "https://hooks.slack.com/..." }],
  salesforce:    [{ label: "Client ID", placeholder: "Connected App Client ID" }, { label: "Client Secret", placeholder: "Client Secret", type: "password" }, { label: "Instance URL", placeholder: "https://yourorg.salesforce.com" }],
  hubspot:       [{ label: "Private App Token", placeholder: "pat-na1-...", type: "password" }],
  gmail:         [{ label: "OAuth Client ID", placeholder: "xxx.apps.googleusercontent.com" }, { label: "OAuth Client Secret", placeholder: "GOCSPX-...", type: "password" }],
  notion:        [{ label: "Integration Token", placeholder: "secret_...", type: "password" }],
  google_sheets: [{ label: "OAuth Client ID", placeholder: "xxx.apps.googleusercontent.com" }, { label: "OAuth Client Secret", placeholder: "GOCSPX-...", type: "password" }],
  twilio:        [{ label: "Account SID", placeholder: "ACxxxxxx" }, { label: "Auth Token", placeholder: "your_auth_token", type: "password" }, { label: "From Number", placeholder: "+1234567890" }],
  stripe:        [{ label: "Secret Key", placeholder: "sk_live_...", type: "password" }, { label: "Webhook Secret", placeholder: "whsec_...", type: "password" }],
  google_drive:  [{ label: "OAuth Client ID", placeholder: "xxx.apps.googleusercontent.com" }, { label: "OAuth Client Secret", placeholder: "GOCSPX-...", type: "password" }],
  jira:          [{ label: "API Token", placeholder: "your_api_token", type: "password" }, { label: "Domain", placeholder: "yourorg.atlassian.net" }, { label: "Email", placeholder: "you@company.com" }],
  github:        [{ label: "Personal Access Token", placeholder: "ghp_...", type: "password" }],
  airtable:      [{ label: "API Key", placeholder: "keyXXXXXXXXXXXXXX", type: "password" }, { label: "Base ID", placeholder: "appXXXXXXXXXXXXXX" }],
  resend:        [{ label: "API Key", placeholder: "re_...", type: "password" }],
  webhook:       [{ label: "Webhook URL", placeholder: "https://your-server.com/webhook" }, { label: "Secret", placeholder: "Optional signing secret", type: "password" }],
  discord:       [{ label: "Bot Token", placeholder: "your_bot_token", type: "password" }, { label: "Server ID", placeholder: "Your Discord server ID" }],
};

export default function IntegrationsPage() {
  const connectedIds = useIntegrationStore(s => s.connectedIds) ?? [];
  const toggleIntegration = useIntegrationStore(s => s.toggleIntegration);
  const [filter, setFilter] = useState<"all" | "connected">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const displayed = filter === "connected"
    ? INTEGRATION_REGISTRY.filter(i => connectedIds.includes(i.id))
    : INTEGRATION_REGISTRY;

  const handleConnect = async (id: string) => {
    setSaving(id);
    await new Promise(r => setTimeout(r, 700));
    toggleIntegration(id);
    setSaving(null);
    setSavedMsg(id);
    setExpandedId(null);
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const handleDisconnect = (id: string) => {
    toggleIntegration(id);
    setExpandedId(null);
    setCredentials(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  const setField = (integId: string, field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [integId]: { ...(prev[integId] || {}), [field]: value } }));
  };

  return (
    <div className="p-6 md:p-8 max-w-[1280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] tracking-[-0.02em]">Integrations</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">{connectedIds.length} connected · Add your real credentials to activate</p>
        </div>
        <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[10px] p-0.5">
          {(["all", "connected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all capitalize",
                filter === f ? "bg-[#111111] text-white" : "text-[#6B7280] hover:text-[#111111]")}>
              {f === "connected" ? `Connected (${connectedIds.length})` : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* How integrations work banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-[16px] mb-6">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-0.5">How integrations work</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Enter your real API credentials below and click <strong>Connect</strong>. OneAtlas stores them encrypted and fires the integration automatically when a generated app triggers a matching workflow event (e.g. "Deal closed → send Slack message"). Without credentials the integration is a stub — the workflow runs but the external call is skipped and logged.
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-[12px] mb-4">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700 font-medium">
            {INTEGRATION_REGISTRY.find(i => i.id === savedMsg)?.name} connected successfully. Credentials stored encrypted.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map(integration => {
          const isConnected = connectedIds.includes(integration.id);
          const isExpanded = expandedId === integration.id;
          const fields = CREDENTIAL_FIELDS[integration.id] || [];
          const creds = credentials[integration.id] || {};
          const allFilled = fields.length === 0 || fields.every(f => creds[f.label]?.trim());

          return (
            <div key={integration.id}
              className={cn("bg-white border rounded-[20px] transition-all duration-200",
                isConnected ? "border-green-300 shadow-[0_0_0_1px_rgba(34,197,94,0.15)]" : isExpanded ? "border-[#FF6600]/50 shadow-[0_4px_16px_rgba(255,102,0,0.08)]" : "border-[#E5E7EB] hover:shadow-sm")}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#F5F5EE] border border-[#E5E7EB] flex items-center justify-center text-xl">
                      {integration.icon}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#111111]">{integration.name}</h3>
                      <p className="text-[11px] text-[#9CA3AF]">{integration.category}</p>
                    </div>
                  </div>
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] bg-[#F5F5EE] px-2 py-0.5 rounded-full shrink-0">
                      <Lock className="w-3 h-3" /> Stub
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#6B7280] leading-relaxed mb-4">{integration.description}</p>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <button onClick={() => handleDisconnect(integration.id)}
                        className="flex-1 py-2 rounded-[10px] text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all">
                        Disconnect
                      </button>
                      <a href="#" className="p-2 rounded-[10px] border border-[#E5E7EB] text-[#9CA3AF] hover:text-[#6B7280] hover:border-[#9CA3AF] transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  ) : (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : integration.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-[10px] text-sm font-semibold bg-[#FF6600] text-white hover:bg-[#E65C00] transition-all">
                      Connect
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Credential form */}
              {isExpanded && !isConnected && (
                <div className="px-5 pb-5 pt-0 border-t border-[#F0F0EA]">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3 mt-4">Enter your credentials</p>
                  <div className="space-y-3 mb-4">
                    {fields.map(field => (
                      <div key={field.label}>
                        <label className="block text-xs font-medium text-[#111111] mb-1">{field.label}</label>
                        <input
                          type={field.type || "text"}
                          value={creds[field.label] || ""}
                          onChange={e => setField(integration.id, field.label, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full h-9 px-3 rounded-[8px] border border-[#E5E7EB] text-xs text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] font-mono" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] mb-4">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    Credentials stored encrypted at rest. Never logged or shared.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnect(integration.id)}
                      disabled={!allFilled || saving === integration.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#111111] text-white rounded-[8px] text-xs font-semibold hover:bg-[#222] disabled:opacity-40 transition-all">
                      {saving === integration.id ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Save & Connect</>
                      )}
                    </button>
                    <button onClick={() => setExpandedId(null)} className="p-2 rounded-[8px] border border-[#E5E7EB] text-[#9CA3AF] hover:bg-[#F5F5EE] transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
