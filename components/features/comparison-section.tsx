import { CheckCircle2, X } from "lucide-react";

const rows = [
  { feature: "Ease of Use", oneatlas: "No technical background needed", others: "Headache for non-coders" },
  { feature: "What You Can Build", oneatlas: "Full production-grade apps", others: "Basic apps only" },
  { feature: "All-in-one Platform", oneatlas: "Everything built-in", others: "Requires external services" },
  { feature: "AI Models", oneatlas: "All latest models, auto-selected", others: "Limited or locked models" },
  { feature: "Custom Domain", oneatlas: "Included on every plan", others: "Paid add-on or unavailable" },
  { feature: "Human Support", oneatlas: "Live chat & priority support", others: "Little to no support" },
  { feature: "Error Handling", oneatlas: "Smart & automatic correction", others: "Gets stuck often" },
  { feature: "Hosting & Scale", oneatlas: "Scales with you, built-in", others: "Limited or self-managed" },
];

export function ComparisonSection() {
  return (
    <section className="py-24 bg-white" id="compare">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-14">
          <h2
            className="font-[650] text-[#111111] tracking-[-0.03em] leading-[1] mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            How we stack up
          </h2>
          <p className="text-[18px] text-[#6B7280] max-w-xl mx-auto">
            See how OneAtlas compares to other app builders across the features that matter most.
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[24px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-3 bg-[#F9F9F7] border-b border-[#E5E7EB]">
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Feature</p>
            </div>
            <div className="px-6 py-4 border-l border-[#E5E7EB] bg-[#FFF8F5]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-[5px] bg-[#FF6600] flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">OA</span>
                </div>
                <p className="text-sm font-semibold text-[#111111]">OneAtlas</p>
              </div>
            </div>
            <div className="px-6 py-4 border-l border-[#E5E7EB]">
              <p className="text-sm font-semibold text-[#6B7280]">Others</p>
            </div>
          </div>

          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-b border-[#E5E7EB] last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}
            >
              <div className="px-6 py-4">
                <p className="text-sm font-medium text-[#111111]">{row.feature}</p>
              </div>
              <div className="px-6 py-4 border-l border-[#E5E7EB] bg-[#FFF8F5]/50">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6600] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#4B5563]">{row.oneatlas}</p>
                </div>
              </div>
              <div className="px-6 py-4 border-l border-[#E5E7EB]">
                <div className="flex items-start gap-2">
                  <X className="w-4 h-4 text-[#D1D5DB] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#9CA3AF]">{row.others}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
