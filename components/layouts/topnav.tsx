"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Search, LogOut, Settings, User } from "lucide-react";
import { MODEL_REGISTRY } from "@/lib/models";
import { useBuilderStore, useUserStore } from "@/store";
import { cn } from "@/lib/utils";

export function DashboardTopnav() {
  const router = useRouter();
  const { model, setModel } = useBuilderStore();
  const { userName, userEmail, orgName, plan, logout } = useUserStore();
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const currentModel = MODEL_REGISTRY.find(m => m.id === model);

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <header className="h-[64px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0">
      {/* Org switcher */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-[#FF6600] to-[#FF8533] flex items-center justify-center text-white text-xs font-bold">
          {(orgName || "A")[0].toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-[#111111]">{orgName || "My Workspace"}</span>
        <span className="text-[11px] font-medium text-[#FF6600] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">{plan}</span>
      </div>

      {/* Search trigger */}
      <button className="hidden md:flex items-center gap-2 h-9 px-4 rounded-[10px] border border-[#E5E7EB] bg-[#F5F5EE] text-[#9CA3AF] text-sm hover:border-[#9CA3AF] transition-colors">
        <Search className="w-4 h-4" />
        <span>Search projects…</span>
        <div className="flex items-center gap-0.5 ml-2">
          <kbd className="px-1.5 py-0.5 text-[11px] bg-white border border-[#E5E7EB] rounded text-[#6B7280]">⌘</kbd>
          <kbd className="px-1.5 py-0.5 text-[11px] bg-white border border-[#E5E7EB] rounded text-[#6B7280]">K</kbd>
        </div>
      </button>

      {/* Right: model badge + notifications + avatar */}
      <div className="flex items-center gap-3">
        {/* Model selector */}
        <div className="relative">
          <button onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-xs font-medium text-[#6B7280] hover:border-[#9CA3AF] transition-colors">
            <div className="w-2 h-2 rounded-full bg-[#FF6600]" />
            {currentModel?.name || "Automatic"}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showModelPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50 overflow-hidden">
                {MODEL_REGISTRY.map(m => (
                  <button key={m.id} onClick={() => { setModel(m.id); setShowModelPicker(false); }}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#F5F5EE]",
                      model === m.id ? "bg-[#FFF5EE] text-[#FF6600]" : "text-[#111111]")}>
                    <div className={cn("w-2 h-2 rounded-full shrink-0", model === m.id ? "bg-[#FF6600]" : "bg-[#E5E7EB]")} />
                    <span className="truncate">{m.name}</span>
                    {m.badge && <span className="ml-auto text-[10px] font-semibold text-[#FF6600]">{m.badge}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="relative p-1.5 rounded-[8px] text-[#9CA3AF] hover:bg-[#F5F5EE] transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        {/* User avatar + menu */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-[10px] hover:bg-[#F5F5EE] transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6600] to-[#FF8533] flex items-center justify-center text-white text-sm font-semibold">
              {(userName || "U")[0].toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#111111] leading-none">{userName || "User"}</p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate max-w-[120px]">{userEmail || ""}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] hidden sm:block" />
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50 overflow-hidden">
                <div className="px-3 py-3 border-b border-[#E5E7EB]">
                  <p className="text-sm font-semibold text-[#111111] truncate">{userName || "User"}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">{userEmail || ""}</p>
                </div>
                <button onClick={() => { router.push("/dashboard/settings"); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#4B5563] hover:bg-[#F5F5EE] transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
