"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, Sparkles } from "lucide-react";

const navItems = [
  { label: "Product", href: "#features", hasDropdown: true },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Templates", href: "/templates" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#resources", hasDropdown: true },
  { label: "Community", href: "#community" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300",
        scrolled
          ? "bg-[#F5F5EE]/95 backdrop-blur-[8px] border-b border-[#E5E7EB]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-[8px] bg-[#FF6600] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold text-[#111111] tracking-tight">OneAtlas</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-1 text-[15px] font-medium text-[#4B5563] hover:text-[#111111] transition-colors"
            >
              {item.label}
              {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-[15px] font-medium text-[#4B5563] hover:text-[#111111] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/dashboard"
            className="btn-primary text-sm px-5 h-10"
          >
            Start Building →
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-[8px] text-[#4B5563] hover:bg-[#E5E7EB] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E5E7EB] shadow-lg">
          <div className="px-6 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="py-2.5 text-[15px] font-medium text-[#4B5563] hover:text-[#111111] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
              <Link href="/login" className="py-2.5 text-[15px] font-medium text-[#4B5563]" onClick={() => setMobileOpen(false)}>Log In</Link>
              <Link href="/dashboard" className="btn-primary justify-center" onClick={() => setMobileOpen(false)}>Start Building →</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
