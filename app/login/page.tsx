"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useUserStore } from "@/store";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated]);

  const doLogin = (name: string, emailVal: string, plan = "studio") => {
    setUser({
      userId: `user-${Date.now()}`,
      email: emailVal,
      name,
      orgId: "org-demo",
      orgName: `${name.split(" ")[0]}'s Workspace`,
      orgSlug: name.split(" ")[0].toLowerCase(),
      plan,
      defaultModel: "auto",
    });
    router.push("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 700));
    doLogin(email.split("@")[0], email);
  };

  const handleOAuth = async (provider: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    doLogin("Demo User", `demo@${provider}.com`);
  };

  return (
    <div className="min-h-screen bg-[#F0EFEB] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #EEF0F8 0%, #E8EDF8 50%, #F0EFEB 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 30% 50%, rgba(99,91,255,0.08), transparent 60%), radial-gradient(circle at 70% 80%, rgba(255,102,0,0.06), transparent 50%)" }} />
        <Link href="/" className="relative flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#FF6600] flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
          <span className="text-[17px] font-semibold text-[#111111]">OneAtlas</span>
        </Link>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 border border-white/80 rounded-full text-xs text-[#6B7280] mb-8">
            <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse" /> Now in public beta
          </div>
          <h1 className="text-[42px] font-bold text-[#111111] leading-[1.1] tracking-[-0.03em] mb-4">
            Software creation<br />for <span className="text-[#FF6600]">modern teams</span>
          </h1>
          <p className="text-[16px] text-[#6B7280] leading-relaxed max-w-sm">
            Describe workflows, dashboards, or internal tools. OneAtlas builds and deploys them for you.
          </p>
          <div className="mt-10 w-64 h-64 rounded-full opacity-50 blur-2xl"
            style={{ background: "radial-gradient(circle, #C4B5FD, #F9A8D4, #FCA5A5)" }} />
        </div>
        <div />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <h2 className="text-[22px] font-bold text-[#111111] text-center mb-1">Welcome back</h2>
            <p className="text-sm text-[#9CA3AF] text-center mb-6">Sign in to continue to OneAtlas.</p>

            <button onClick={() => handleOAuth("google")} disabled={loading}
              className="w-full flex items-center gap-3 px-4 h-11 border border-[#E5E7EB] rounded-[12px] text-sm font-medium text-[#111111] hover:bg-[#F9F9F7] transition-colors disabled:opacity-60 mb-4">
              <span className="text-base">🔵</span> Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E5E7EB]" /><span className="text-xs text-[#9CA3AF]">or</span><div className="flex-1 h-px bg-[#E5E7EB]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full h-11 pl-10 pr-4 rounded-[12px] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-[#111111]">Password</label>
                  <button type="button" className="text-xs text-[#FF6600] hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                    className="w-full h-11 pl-10 pr-10 rounded-[12px] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-[#FF6600] text-white rounded-[12px] text-sm font-semibold hover:bg-[#E65C00] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</> : "Sign in"}
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 mt-4">
              {[{id:"github",e:"🐙"},{id:"apple",e:"🍎"},{id:"microsoft",e:"🟦"},{id:"slack",e:"💬"},{id:"discord",e:"🎮"}].map(p => (
                <button key={p.id} onClick={() => handleOAuth(p.id)} disabled={loading}
                  className="w-9 h-9 rounded-[9px] border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9F9F7] transition-colors text-sm disabled:opacity-60">
                  {p.e}
                </button>
              ))}
              <button className="w-9 h-9 rounded-[9px] border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9F9F7] text-[11px] font-bold text-[#6B7280]">SSO</button>
            </div>

            <p className="text-sm text-[#9CA3AF] text-center mt-5">
              No account? <Link href="/signup" className="text-[#FF6600] font-medium hover:underline">Sign up free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
