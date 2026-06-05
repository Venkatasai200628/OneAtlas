import { Lightbulb, Cog, Rocket, Users } from "lucide-react";

const steps = [
  {
    num: "01 / 04",
    icon: Lightbulb,
    title: "From idea to working software",
    desc: "Tell OneAtlas what you want to build, and watch it generate a real product foundation — interfaces, workflows, data models, and app logic included from the very first prompt.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    num: "02 / 04",
    icon: Cog,
    title: "Your backend, already in motion",
    desc: "Authentication, databases, APIs, permissions, storage, and operational logic are automatically structured behind the scenes, so your app behaves like production software from day one.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    num: "03 / 04",
    icon: Rocket,
    title: "Built to go live fast",
    desc: "OneAtlas comes with hosting, deployment, analytics, custom domains, environments, and scaling built in — eliminating the setup work between building and launching.",
    color: "text-[#FF6600]",
    bg: "bg-orange-50",
  },
  {
    num: "04 / 04",
    icon: Users,
    title: "AI-native by default",
    desc: "Use the latest AI models, agents, and workflows inside your product without managing providers or integrations. OneAtlas intelligently routes tasks to the right models so your team can focus on building, not configuring.",
    color: "text-green-500",
    bg: "bg-green-50",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-[#F5F5EE]" id="how-it-works">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#FF6600] mb-3">Meet OneAtlas</p>
          <h2
            className="font-[650] text-[#111111] tracking-[-0.03em] leading-[1]"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            From idea to live app in 4 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white border border-[#E5E7EB] rounded-[24px] p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-4">{step.num}</p>
                <div className={`w-10 h-10 rounded-[12px] ${step.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <h3 className="text-[17px] font-semibold text-[#111111] mb-3 leading-tight">{step.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
