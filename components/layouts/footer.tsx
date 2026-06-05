import Link from "next/link";
import { Sparkles } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Templates", "Integrations", "Pricing", "Changelog"],
  Solutions: ["Startups", "Role Developers", "Agencies", "Enterprise"],
  Resources: ["Docs", "Guides", "Blog", "Help Center"],
  Company: ["About", "Careers", "Contact", "Blog"],
  Legal: ["Privacy Policy", "Terms of Service", "Security"],
};

export function Footer() {
  return (
    <footer className="bg-[#F5F5EE] border-t border-[#E5E7EB] pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[8px] bg-[#FF6600] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-[17px] font-semibold text-[#111111]">OneAtlas</span>
            </div>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-[180px]">
              The all-in-one platform to build, deploy, and scale AI-powered applications.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {["𝕏", "𝔾", "in", "⬡"].map((icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-[8px] bg-white border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111111] hover:border-[#9CA3AF] transition-colors text-sm font-bold">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-4">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#6B7280] hover:text-[#111111] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-[#9CA3AF]">
            © 2026 OneAtlas, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="mailto:security@oneatlas.dev" className="text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              security@oneatlas.dev
            </a>
            <a href="#" className="text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Report a vulnerability
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
