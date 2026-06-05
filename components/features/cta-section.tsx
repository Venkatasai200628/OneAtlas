import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 bg-[#F5F5EE]">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="bg-gradient-to-br from-[#111111] to-[#1a1a1a] rounded-[32px] p-12 md:p-16 text-center relative overflow-hidden">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white/70 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#FF6600] animate-pulse" />
              Ready to build the future with OneAtlas?
            </div>
            <h2
              className="font-bold text-white tracking-[-0.04em] leading-[0.95] mb-6"
              style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
            >
              From idea to production —<br />
              <span className="text-[#FF6600]">build, deploy, and scale</span><br />
              AI apps faster.
            </h2>
            <p className="text-[18px] text-white/60 max-w-lg mx-auto mb-10 leading-[1.7]">
              The all-in-one platform to build, deploy, and scale AI-powered applications without managing engineering complexity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-[#FF6600] text-white rounded-[14px] text-[16px] font-semibold hover:bg-[#E65C00] transition-all hover:-translate-y-px"
              >
                Start for Free →
              </Link>
              <Link
                href="#pricing"
                className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-[14px] text-[16px] font-semibold hover:bg-white/20 transition-all"
              >
                Talk to Sales
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/40">No credit card required · Deploy in under 60 seconds</p>
          </div>
        </div>

        {/* Trust logos */}
        <div className="mt-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-6">
            Trusted by builders at every stage
          </p>
          <div className="flex items-center justify-center gap-10 flex-wrap">
            {["ACME", "PULSE", "OVAL", "Layer", "Echo", "Cloudrail"].map(name => (
              <span key={name} className="text-sm font-semibold text-[#9CA3AF] tracking-wider">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
