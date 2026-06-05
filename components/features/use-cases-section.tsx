const useCases = [
  {
    audience: "Startup teams",
    tagline: "Ship before momentum fades",
    desc: "Launch new products, validate concepts, and iterate quickly without slowing down on development.",
    detail: "Generate complete applications, databases, authentication, and interfaces from simple instructions.",
  },
  {
    audience: "Product & innovation teams",
    tagline: "Test ideas in real environments",
    desc: "Explore new features, workflows, and experiments without waiting through engineering backlogs.",
    detail: "Turn rough concepts into usable software your team can review, refine, and deploy instantly.",
  },
  {
    audience: "Marketing & growth teams",
    tagline: "Launch without dependencies",
    desc: "Create launch pages, acquisition funnels, and branded web experiences at the speed campaigns move.",
    detail: "Publish optimized pages with hosting, analytics, SEO, and forms already connected.",
  },
  {
    audience: "Agencies & service businesses",
    tagline: "Deliver custom software at scale",
    desc: "Build client-facing platforms, dashboards, and workflows faster while handling more projects simultaneously.",
    detail: "Reduce repetitive setup work and accelerate delivery using AI-assisted app generation.",
  },
  {
    audience: "Operations & business teams",
    tagline: "Automate the work behind the scenes",
    desc: "Replace fragmented tools and manual processes with software built around how your company actually works.",
    detail: "Create approval systems, CRMs, onboarding tools, reporting dashboards, and operational workflows visually.",
  },
  {
    audience: "Independent builders",
    tagline: "Create products without technical overhead",
    desc: "Bring side projects, AI ideas, and business concepts to life without becoming a full-stack engineer.",
    detail: "Design, customize, and launch production-ready applications from a single workspace.",
  },
];

export function UseCasesSection() {
  return (
    <section className="py-24 bg-white" id="use-cases">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#FF6600] mb-3">Built for people who move fast</p>
          <h2
            className="font-[650] text-[#111111] tracking-[-0.03em] leading-[1] mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            OneAtlas turns ideas into{" "}
            <span className="text-[#FF6600]">working software</span>
          </h2>
          <p className="text-[18px] text-[#6B7280] max-w-2xl mx-auto">
            Create AI apps, internal tools, customer portals, automations, and full products — without managing codebases, infrastructure, or complex workflows.
          </p>
        </div>

        <div className="space-y-4">
          {useCases.map((uc, i) => (
            <div
              key={uc.audience}
              className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-[24px] border border-[#E5E7EB] overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-200"
            >
              <div
                className="lg:col-span-1 flex lg:flex-col items-center justify-center py-4 lg:py-8 px-4"
                style={{ background: i % 2 === 0 ? "#FFF3EB" : "#F9F9F6" }}
              >
                <span className="text-2xl font-bold text-[#FF6600] tracking-tight">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="lg:col-span-5 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-[#ECECEC]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-2">{uc.audience}</p>
                <h3 className="text-[20px] font-semibold text-[#111111] mb-3">{uc.tagline}</h3>
                <p className="text-[15px] text-[#6B7280] leading-relaxed">{uc.desc}</p>
              </div>
              <div className="lg:col-span-6 p-6 lg:p-8 flex items-center border-t lg:border-t-0 lg:border-l border-[#ECECEC] bg-[#FAFAF8]">
                <p className="text-sm text-[#4B5563] leading-relaxed">{uc.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
