import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/lib/store';
import { Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { consumeLoginRedirect, consumePendingAppInvite } from '@/lib/appInvitePayload';

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const user = useStore(s => s.user);
  const authLoading = useStore(s => s.authLoading);
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const afterAuth = () => {
    const redirect = consumeLoginRedirect();
    if (redirect) return redirect;
    const inviteId = consumePendingAppInvite();
    if (inviteId) return `/app/projects?open=${encodeURIComponent(inviteId)}`;
    return '/app/generate';
  };

  useEffect(() => {
    try {
      const authErr = sessionStorage.getItem('oa_auth_error');
      if (authErr) {
        sessionStorage.removeItem('oa_auth_error');
        setError(authErr);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && user) navigate(afterAuth(), { replace: true });
  }, [user, authLoading, navigate]);

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      await loginWithGoogle();
      // Popup path: stay on page; AuthContext onAuthStateChanged sets user → useEffect navigates
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError('Google sign-in was cancelled.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('This email is already registered with password. Sign in with email instead.');
      } else {
        setError(e.message || 'Google sign-in failed. Try email login or allow popups for this site.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      if (isSignUp) await signUpWithEmail(email, password, { name: name.trim() || undefined });
      else await loginWithEmail(email, password);
    } catch (e) {
      setError(e.message || 'Authentication failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F5EE' }}>
      {/* Left — dark panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden dark-panel">
        {/* Ambient glow */}
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FF6600 0%, transparent 70%)', transform: 'translate(-30%,30%)' }}/>
        <div className="absolute top-0 right-0 w-60 h-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FF6600 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}/>

        <Link to="/" className="flex items-center gap-2.5 z-10">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FF6600' }}>
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">OneAtlas</span>
        </Link>

        <div className="z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,102,0,0.18)', color: '#FF6600' }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-soft" style={{ background: '#FF6600' }} />
            Now in public beta
          </div>
          <h2 className="font-bold mb-4 text-white" style={{ fontSize: 38, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Software creation<br />for{' '}
            <span style={{ color: '#FF6600' }}>modern teams</span>
          </h2>
          <p style={{ color: '#9CA3AF', lineHeight: 1.7, fontSize: 15 }}>
            Describe workflows, dashboards, or internal tools. OneAtlas builds and deploys them for you.
          </p>
        </div>
        <div className="z-10 text-xs" style={{ color: '#4B5563' }}>© 2026 OneAtlas, Inc.</div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: '#FFFFFF' }}>
        <div className="w-full max-w-[360px]">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors" style={{ color: '#9CA3AF' }}
            onMouseEnter={e => e.currentTarget.style.color = '#111111'}
            onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
            <ArrowLeft size={13} /> Back
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FF6600' }}>
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-bold" style={{ color: '#111111' }}>OneAtlas</span>
          </div>

          <h1 className="font-bold mb-1" style={{ fontSize: 26, color: '#111111', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mb-7 text-sm" style={{ color: '#6B7280' }}>
            {isSignUp ? 'Start building with OneAtlas.' : 'Sign in to continue to OneAtlas.'}
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl border text-sm" style={{ background: '#FFF0F0', borderColor: '#FCA5A5', color: '#DC2626' }}>
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border font-semibold text-sm mb-4 transition-all"
            style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', borderRadius: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = '#F9F9F6'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}>
            {loading
              ? <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              : <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            }
            Continue with Google
          </button>

          {/* Email */}
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm mb-5 transition-all"
            style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', borderRadius: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = '#F9F9F6'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}>
            ✉️ Continue with Email
          </button>

          <div className="relative flex items-center my-5">
            <div className="flex-1 border-t" style={{ borderColor: '#E5E7EB' }} />
            <span className="px-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>or continue with</span>
            <div className="flex-1 border-t" style={{ borderColor: '#E5E7EB' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name"
                  className="w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all"
                  style={{ borderColor: '#E5E7EB', background: '#F9F9F6', color: '#111111', borderRadius: 12 }}
                  onFocus={e => e.target.style.borderColor = '#FF6600'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all"
                style={{ borderColor: '#E5E7EB', background: '#F9F9F6', color: '#111111', borderRadius: 12 }}
                onFocus={e => e.target.style.borderColor = '#FF6600'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                  className="w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all pr-10"
                  style={{ borderColor: '#E5E7EB', background: '#F9F9F6', color: '#111111', borderRadius: 12 }}
                  onFocus={e => e.target.style.borderColor = '#FF6600'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {isSignUp && <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>Must be at least 8 characters with a mix of letters, numbers, and symbols.</p>}
            </div>
            {!isSignUp && (
              <div className="text-right">
                <button type="button" className="text-xs font-bold" style={{ color: '#FF6600' }}>Forgot password?</button>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all"
              style={{ background: '#FF6600', borderRadius: 12 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E65C00'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#FF6600'}>
              {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Social icons */}
          <div className="flex items-center justify-center gap-3 mb-5">
            {[
              { icon: '🐙', label: 'GitHub' },
              { icon: '🍎', label: 'Apple' },
              { icon: '🪟', label: 'Microsoft' },
              { icon: '💬', label: 'Slack' },
              { icon: '🎮', label: 'Discord' },
              { icon: '🔒', label: 'SSO' },
            ].map(o => (
              <button key={o.label} title={o.label} disabled
                className="w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-all opacity-40 cursor-not-allowed"
                style={{ borderColor: '#E5E7EB', background: '#F9F9F6' }}>
                {o.icon}
              </button>
            ))}
          </div>

          <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>
            By creating an account, you agree to our{' '}
            <span className="font-bold cursor-pointer" style={{ color: '#FF6600' }}>Terms of Service</span>
            {' '}and{' '}
            <span className="font-bold cursor-pointer" style={{ color: '#FF6600' }}>Privacy Policy</span>.
          </p>

          <p className="text-center text-sm mt-5" style={{ color: '#6B7280' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignUp(s => !s); setError(''); }}
              className="font-bold" style={{ color: '#FF6600' }}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
