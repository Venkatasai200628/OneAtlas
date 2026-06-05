const integrations = [
  { name: "Salesforce", category: "Customer Operations", desc: "Sync pipeline data, automate workflows, and build internal tools directly on top of your CRM." },
  { name: "Slack", category: "Team Communication", desc: "Trigger alerts, approvals, and live updates directly inside the channels your team already uses." },
  { name: "Notion", category: "Knowledge & Workspaces", desc: "Connect docs and databases to power portals, dashboards, internal systems, and AI workflows." },
  { name: "Google Sheets", category: "Live Spreadsheet Data", desc: "Turn spreadsheets into connected app data for reporting, operations, and workflow automation." },
  { name: "HubSpot", category: "Revenue Workflows", desc: "Manage leads, automate customer journeys, and streamline sales operations across teams." },
  { name: "Gmail", category: "Automated Email Flows", desc: "Send onboarding emails, notifications, summaries, and customer communication automatically." },
  { name: "Twilio", category: "Customer Messaging", desc: "Build OTPs, reminders, alerts, and SMS workflows directly into your product experience." },
  { name: "Google Drive", category: "Documents & Storage", desc: "Store files, sync exports, and manage app-generated documents from one connected workspace." },
];

export function IntegrationsSection() {
  return (
    <section className="py-24 bg-[#F5F5EE]" id="integrations">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#FF6600] mb-3">Integrations</p>
          <h2
            className="font-[650] text-[#111111] tracking-[-0.03em] leading-[1] mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Plug into the tools{" "}
            <span className="text-[#FF6600]">you already run</span>
          </h2>
          <p className="text-[18px] text-[#6B7280] max-w-2xl mx-auto">
            OneAtlas works with the systems your team already depends on — CRM, communication, spreadsheets, documents, and customer workflows. Connect your stack instantly without rebuilding infrastructure or managing APIs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((int) => (
            <div
              key={int.name}
              className="bg-white border border-[#ECECEC] rounded-[28px] p-6 hover:-translate-y-1 hover:border-[#D1D5DB] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-200 min-h-[220px]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-1">{int.category}</p>
              <h3 className="text-[16px] font-semibold text-[#111111] mb-2">{int.name}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{int.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#9CA3AF] mt-8">
          Also connects to{" "}
          <span className="text-[#6B7280]">Stripe, Discord, LinkedIn, Google Calendar, TikTok, Resend, REST APIs, Webhooks</span>, and more.
        </p>
      </div>
    </section>
  );
}
