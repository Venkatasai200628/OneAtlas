import { Rocket, Database, Shield, Bot, Plug, Globe } from "lucide-react";

const features = [
  {
    icon: Rocket,
    title: "One-Click Launch",
    desc: "Ship AI products globally in seconds — hosting, scaling, and infrastructure already handled.",
    color: "text-[#FF6600]",
    bg: "bg-orange-50",
  },
  {
    icon: Database,
    title: "Visual Database & Content Layer",
    desc: "Manage your app's data, content, and workflows visually without touching backend code.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "AI-Native Backend",
    desc: "Generate APIs, logic, automations, and storage instantly — no servers or boilerplate required.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Globe,
    title: "Authentication & Access Control",
    desc: "Built-in auth, permissions, and user roles ready from day one — protected by default.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Bot,
    title: "Agents & Automated Workflows",
    desc: "Let AI agents and automations run your operations in the background 24/7.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: Plug,
    title: "Deep Integrations",
    desc: "Connect AI models, payments, CRMs, email, and thousands of tools in just a few clicks.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white" id="features">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-3">Platform</p>
          <h2
            className="font-[650] text-[#111111] tracking-[-0.03em] leading-[1] mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Everything you need,{" "}
            <span className="text-[#FF6600]">built-in.</span>
          </h2>
          <p className="text-[18px] text-[#6B7280] max-w-xl mx-auto">
            15+ integrations. 500+ components. 0 infrastructure to manage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-[#F9F9F7] border border-[#E5E7EB] rounded-[24px] p-7 hover:bg-white hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-[12px] ${f.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-[17px] font-semibold text-[#111111] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
