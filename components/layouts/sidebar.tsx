"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FolderOpen, Layers, Rocket, Plug, Settings,
  ChevronLeft, ChevronRight, Sparkles, ChevronDown
} from "lucide-react";

const navItems = [
  { label: "Projects", href: "/dashboard", icon: LayoutDashboard },
  { label: "Templates", href: "/templates", icon: Layers },
  { label: "Deployments", href: "/dashboard/deployments", icon: Rocket },
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-300 shrink-0",
        collapsed ? "w-[64px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="h-[64px] flex items-center px-4 border-b border-[#E5E7EB]">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-[8px] bg-[#FF6600] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-[16px] font-semibold text-[#111111] tracking-tight whitespace-nowrap">
              OneAtlas
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 h-9 rounded-[10px] px-3 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-[#FF6600]/10 text-[#FF6600]"
                  : "text-[#4B5563] hover:bg-[#F5F5EE] hover:text-[#111111]"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-[#E5E7EB]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center h-9 rounded-[10px] text-[#9CA3AF] hover:bg-[#F5F5EE] hover:text-[#6B7280] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
