"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    category: "PLATFORM",
    items: [
      {
        q: "What is OneAtlas?",
        a: "OneAtlas is an AI-native platform for building full-stack apps, internal tools, client portals, and AI workflows without managing engineering complexity.",
      },
      {
        q: "Who is OneAtlas built for?",
        a: "OneAtlas is built for founders, startups, agencies, operators, product teams, and businesses that want to ship software faster with smaller teams.",
      },
      {
        q: "Do I need to know how to code?",
        a: "No. You can build and launch applications using prompts, visual editing, and AI-assisted workflows.",
      },
      {
        q: "What makes OneAtlas different from no-code tools?",
        a: "OneAtlas combines AI generation, backend infrastructure, database, authentication, workflows, hosting, and deployment in one platform — instead of stitching multiple tools together.",
      },
    ],
  },
  {
    category: "BUILDING APPS",
    items: [
      {
        q: "What can I build with OneAtlas?",
        a: "You can build CRMs, dashboards, AI assistants, admin panels, customer portals, workflow systems, onboarding tools, support platforms, and custom business software.",
      },
      {
        q: "Can I build AI-powered products?",
        a: "Yes. OneAtlas supports AI agents, copilots, document analysis, automated workflows, conversational interfaces, and AI-driven business operations.",
      },
      {
        q: "Can I edit the app after it's generated?",
        a: "Yes. You can continuously modify layouts, workflows, logic, data structures, permissions, and UI as your product evolves.",
      },
      {
        q: "Can I connect external APIs and services?",
        a: "Yes. OneAtlas supports integrations with APIs, payment providers, CRMs, analytics tools, databases, and third-party platforms.",
      },
    ],
  },
  {
    category: "DEPLOYMENT & SCALE",
    items: [
      {
        q: "Does OneAtlas handle hosting and deployment?",
        a: "Yes. Hosting, deployment, scaling, infrastructure, and environment setup are managed automatically.",
      },
      {
        q: "Does OneAtlas include a database and backend?",
        a: "Yes. Every app includes a built-in database, backend logic, APIs, authentication, and storage layer.",
      },
      {
        q: "Can I use OneAtlas for production applications?",
        a: "Yes. OneAtlas is designed for real-world business applications, not just prototypes or demos.",
      },
      {
        q: "Can teams collaborate inside OneAtlas?",
        a: "Yes. Teams can collaborate across apps, workflows, operations, and shared workspaces with role-based access control.",
      },
    ],
  },
  {
    category: "SECURITY & OWNERSHIP",
    items: [
      {
        q: "Is my business data secure?",
        a: "Yes. OneAtlas includes authentication, permissions, protected infrastructure, and secure access controls built into the platform.",
      },
      {
        q: "Do I own the apps I create?",
        a: "Yes. You retain ownership of your applications, workflows, data, and operational logic.",
      },
      {
        q: "Can I export or extend my application outside OneAtlas?",
        a: "Yes. OneAtlas gives teams the flexibility to extend, evolve, and scale applications beyond the platform when needed.",
      },
    ],
  },
];

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState("PLATFORM");
  const [open, setOpen] = useState<string | null>(null);
  const activeSection = faqs.find((f) => f.category === activeCategory) || faqs[0];

  return (
    <section className="py-24 bg-white" id="faq">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-14">
          <h2
            className="font-[650] text-[#111111] tracking-[-0.03em] leading-[1] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Frequently asked questions
          </h2>
          <p className="text-[#6B7280]">
            Everything you need to know about OneAtlas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <nav className="space-y-1">
            {faqs.map((section) => (
              <button
                key={section.category}
                onClick={() => { setActiveCategory(section.category); setOpen(null); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-[10px] text-xs font-semibold uppercase tracking-[0.08em] transition-all",
                  activeCategory === section.category
                    ? "bg-[#FFF3EB] text-[#FF6600]"
                    : "text-[#6B7280] hover:text-[#111111]"
                )}
              >
                {section.category}
              </button>
            ))}
          </nav>

          <div className="lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-4">
              {activeSection.category}
            </p>
            <div className="border-t border-[#E5E7EB]">
              {activeSection.items.map((item) => {
                const key = `${activeSection.category}-${item.q}`;
                const isOpen = open === key;
                return (
                  <div key={item.q} className="border-b border-[#ECECEC]">
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="w-full flex items-center justify-between py-5 text-left gap-4"
                    >
                      <span className="text-[15px] font-medium text-[#111111]">{item.q}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <p className="text-sm text-[#6B7280] pb-5 leading-relaxed -mt-1">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
