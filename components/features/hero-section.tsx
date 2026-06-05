"use client";
import Link from "next/link";
import { PromptInterface } from "./prompt-interface";
import { Sparkles, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-[#F5F5EE]" id="hero">
      {/* Subtle background dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #E5E7EB 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-8">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-full text-sm text-[#6B7280] shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>Now in public beta</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-10">
          <h1
            className="font-bold text-[#111111] mb-6 leading-[0.95] tracking-[-0.04em]"
            style={{ fontSize: "clamp(40px, 7vw, 72px)" }}
          >
            Where ideas become{" "}
            <span className="text-[#FF6600]">tools</span>
          </h1>
          <p className="text-[18px] text-[#6B7280] max-w-xl mx-auto leading-[1.7]">
            Describe what your team needs. OneAtlas generates a production-ready internal tool and deploys it instantly.
          </p>
        </div>

        {/* Prompt Interface */}
        <div className="flex justify-center">
          <PromptInterface />
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-[#9CA3AF]">
          {[
            "No credit card required",
            "Deploy in under 60 seconds",
            "10 AI models included",
            "Enterprise-grade security",
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
