import { MODEL_REGISTRY, PROVIDER_COLORS } from "@/lib/models";

export function ModelsSection() {
  return (
    <section className="py-24 bg-white" id="models">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-3">The Model Universe</p>
          <h2
            className="font-[650] text-[#111111] tracking-[-0.03em] leading-[1] mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Every frontier model.{" "}
            <span className="text-[#FF6600]">One atlas.</span>
          </h2>
          <p className="text-[18px] text-[#6B7280] max-w-xl mx-auto">
            Access 10 leading AI models through a single platform. OneAtlas routes each task to the optimal model automatically.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {MODEL_REGISTRY.map((model) => {
            const color = PROVIDER_COLORS[model.provider] || "#6B7280";
            return (
              <div
                key={model.id}
                className="bg-[#F9F9F7] border border-[#E5E7EB] rounded-[20px] p-4 hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center text-center"
              >
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white font-bold text-sm mb-3"
                  style={{ background: color }}
                >
                  {model.name.charAt(0)}
                </div>
                <p className="text-xs font-semibold text-[#111111] leading-tight mb-1">{model.name}</p>
                <p className="text-[11px] text-[#9CA3AF]">{model.provider}</p>
                {model.badge && (
                  <span className="mt-2 text-[10px] font-semibold text-[#FF6600] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    {model.badge}
                  </span>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    model.tier === "powerful" ? "bg-purple-50 text-purple-600" :
                    model.tier === "fast" ? "bg-green-50 text-green-600" :
                    "bg-blue-50 text-blue-600"
                  }`}>
                    {model.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-[#9CA3AF] mt-6">
          OpenRouter acts as universal fallback — if any provider returns a 429 or 5xx, OneAtlas routes to an equivalent model automatically.
        </p>
      </div>
    </section>
  );
}
