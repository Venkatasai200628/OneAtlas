"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const plans = [
  {
    name: "Explorer",
    price: { monthly: 0, annual: 0 },
    desc: "Perfect for testing ideas, learning the platform, and building your first AI-powered products.",
    cta: "Start Building Free",
    ctaHref: "/signup",
    highlighted: false,
    features: [
      "30 AI build credits / month",
      "200 automation credits / month",
      "Unlimited projects",
      "Visual app builder",
      "Built-in database & authentication",
      "One-click deployment",
      "Hosted on OneAtlas domain",
      "Core AI generation tools",
    ],
  },
  {
    name: "Studio",
    price: { monthly: 29, annual: 24 },
    desc: "Built for founders and creators launching production-ready applications.",
    cta: "Upgrade to Studio",
    ctaHref: "/signup?plan=studio",
    highlighted: false,
    features: [
      "150 AI build credits / month",
      "5,000 automation credits / month",
      "Unlimited projects",
      "Custom domains",
      "Backend functions & API workflows",
      "In-app code editing",
      "GitHub synchronization",
      "Remove OneAtlas branding",
      "Faster build & deployment performance",
      "Standard support",
    ],
  },
  {
    name: "Scale",
    price: { monthly: 79, annual: 59 },
    desc: "Designed for startups and fast-moving teams building serious AI software.",
    cta: "Start Scaling",
    ctaHref: "/signup?plan=scale",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "500 AI build credits / month",
      "20,000 automation credits / month",
      "Advanced AI model access",
      "Production-grade hosting infrastructure",
      "Shared team workspace",
      "App analytics & monitoring",
      "SEO & performance optimization",
      "Staging environments",
      "Priority support",
      "Early access to new features",
    ],
  },
  {
    name: "Orbit",
    price: { monthly: 199, annual: 149 },
    desc: "For high-growth companies running AI products at scale.",
    cta: "Contact Sales",
    ctaHref: "/signup?plan=orbit",
    highlighted: false,
    features: [
      "1,500 AI build credits / month",
      "75,000 automation credits / month",
      "Premium AI model routing",
      "Dedicated infrastructure priority",
      "Advanced permissions & access controls",
      "Enterprise authentication (SSO/SAML)",
      "Audit logs & usage insights",
      "Dedicated onboarding",
      "Slack-based support",
      "White-glove migration support",
    ],
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="py-24 bg-[#F5F5EE]" id="pricing">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#FF6600] mb-3">Pricing</p>
          <h2
            className="font-[650] text-[#111111] tracking-[-0.03em] leading-[1] mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Flexible plans for{" "}
            <span className="text-[#FF6600]">builders, startups, and growing teams.</span>
          </h2>
          <p className="text-[18px] text-[#6B7280] max-w-xl mx-auto mb-8">
            Start free and scale as your team grows.
          </p>

          <div className="inline-flex items-center bg-white border border-[#E5E7EB] rounded-[12px] p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-2 rounded-[9px] text-sm font-medium transition-all",
                !annual ? "bg-[#111111] text-white" : "text-[#6B7280] hover:text-[#111111]"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-2 rounded-[9px] text-sm font-medium transition-all flex items-center gap-2",
                annual ? "bg-[#111111] text-white" : "text-[#6B7280] hover:text-[#111111]"
              )}
            >
              Yearly
              <span className="text-[10px] font-semibold text-[#FF6600] bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "bg-white rounded-[24px] p-6 flex flex-col transition-all duration-200",
                plan.highlighted
                  ? "border-[1.5px] border-[#FF6600]"
                  : "border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              )}
            >
              {plan.badge && (
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-[#FF6600] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <h3 className="text-[17px] font-semibold text-[#111111] mb-1">{plan.name}</h3>
              <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">{plan.desc}</p>

              <div className="mb-5">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-[#111111]">
                    ${annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {(plan.price.monthly > 0 || plan.price.annual > 0) && (
                    <span className="text-sm text-[#9CA3AF] mb-1">/mo</span>
                  )}
                </div>
                {annual && plan.price.monthly > 0 && (
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Billed annually</p>
                )}
              </div>

              <Link
                href={plan.ctaHref}
                className={cn(
                  "block text-center py-2.5 rounded-[12px] text-sm font-semibold transition-all mb-5",
                  plan.highlighted
                    ? "bg-[#FF6600] text-white hover:bg-[#E65C00]"
                    : "bg-[#111111] text-white hover:opacity-90"
                )}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6600] mt-0.5 shrink-0" />
                    <span className="text-xs text-[#4B5563] leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-[#111111] rounded-[24px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-[20px] font-semibold text-white mb-1">Enterprise</h3>
            <p className="text-sm text-[#9CA3AF] max-w-md">
              Custom infrastructure, governance, and deployment solutions for modern organizations. Private cloud, compliance controls, dedicated account management, and SLA-backed uptime.
            </p>
          </div>
          <Link
            href="/signup?plan=enterprise"
            className="shrink-0 px-6 py-3 bg-white text-[#111111] rounded-[12px] text-sm font-semibold hover:bg-[#F5F5EE] transition-colors"
          >
            Talk to Enterprise Sales →
          </Link>
        </div>
      </div>
    </section>
  );
}
