"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useUserStore } from "@/store";

export default function SignupPage() {
  const router = useRouter();
  const { setUser, isAuthenticated } = useUserStore();
  const [step, setStep] = useState<"choose" | "form">("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated]);

  const doRegister = (n: string, e: string) => {
    setUser({
      userId: `user-${Date.now()}`,
      email: e,
      name: n,
      orgId: `org-${Date.now()}`,
      orgName: `${n.split(" ")[0]}'s Workspace`,
      orgSlug: n.split(" ")[0].toLowerCase(),
      plan: "free",
      defaultModel: "auto",
    });
    router.push("/dashboard");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Must be at least 8 characters";
    return e;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    doRegister(name, email);
  };

  const handleOAuth = async (provider: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    doRegister("Demo User", `demo@${provider}.com`);
  };

  const leftPanel = (
    <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #EEF0F8 0%, #E8EDF8 50%, #F0EFEB 100%)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 30% 50%, rgba(99,91,255,0.08), transparent 60%)" }} />
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
  );

  return (
    <div className="min-h-screen bg-[#F0EFEB] flex">
      {leftPanel}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            {step === "choose" ? (
              <>
                <h2 className="text-[22px] font-bold text-[#111111] text-center mb-1">Create your account</h2>
                <p className="text-sm text-[#9CA3AF] text-center mb-6">Start building with OneAtlas — free forever.</p>
                <div className="space-y-3 mb-4">
                  <button onClick={() => handleOAuth("google")} disabled={loading}
                    className="w-full flex items-center gap-3 px-4 h-11 border border-[#E5E7EB] rounded-[12px] text-sm font-medium text-[#111111] hover:bg-[#F9F9F7] transition-colors disabled:opacity-60">
                    <span className="text-base">🔵</span> Continue with Google
                  </button>
                  <button onClick={() => setStep("form")} disabled={loading}
                    className="w-full flex items-center gap-3 px-4 h-11 border border-[#E5E7EB] rounded-[12px] text-sm font-medium text-[#111111] hover:bg-[#F9F9F7] transition-colors disabled:opacity-60">
                    <Mail className="w-4 h-4 text-[#9CA3AF]" /> Continue with Email
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-[#E5E7EB]" /><span className="text-xs text-[#9CA3AF]">or</span><div className="flex-1 h-px bg-[#E5E7EB]" /></div>
                <div className="flex items-center justify-center gap-2 mb-5">
                  {[{id:"github",e:"🐙"},{id:"apple",e:"🍎"},{id:"microsoft",e:"🟦"},{id:"slack",e:"💬"},{id:"discord",e:"🎮"}].map(p => (
                    <button key={p.id} onClick={() => handleOAuth(p.id)} disabled={loading}
                      className="w-9 h-9 rounded-[9px] border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9F9F7] text-sm disabled:opacity-60">{p.e}</button>
                  ))}
                  <button className="w-9 h-9 rounded-[9px] border border-[#E5E7EB] flex items-center justify-center text-[11px] font-bold text-[#6B7280] hover:bg-[#F9F9F7]">SSO</button>
                </div>
                <p className="text-[11px] text-[#9CA3AF] text-center">
                  By signing up you agree to our <a href="#" className="text-[#FF6600]">Terms</a> and <a href="#" className="text-[#FF6600]">Privacy Policy</a>.
                </p>
                <p className="text-sm text-[#9CA3AF] text-center mt-4">
                  Already have an account? <Link href="/login" className="text-[#FF6600] font-medium hover:underline">Sign in</Link>
                </p>
              </>
            ) : (
              <>
                <button onClick={() => setStep("choose")} className="flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#111111] mb-5 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-[22px] font-bold text-[#111111] text-center mb-1">Create your account</h2>
                <p className="text-sm text-[#9CA3AF] text-center mb-6">Sign up with your email to get started.</p>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                        className={`w-full h-11 pl-10 pr-4 rounded-[12px] border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${errors.name ? "border-red-400" : "border-[#E5E7EB]"}`} />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                        className={`w-full h-11 pl-10 pr-4 rounded-[12px] border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${errors.email ? "border-red-400" : "border-[#E5E7EB]"}`} />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                        className={`w-full h-11 pl-10 pr-10 rounded-[12px] border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${errors.password ? "border-red-400" : "border-[#E5E7EB]"}`} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full h-11 bg-[#FF6600] text-white rounded-[12px] text-sm font-semibold hover:bg-[#E65C00] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</> : "Create account"}
                  </button>
                </form>
                <p className="text-sm text-[#9CA3AF] text-center mt-5">
                  Already have an account? <Link href="/login" className="text-[#FF6600] font-medium hover:underline">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
