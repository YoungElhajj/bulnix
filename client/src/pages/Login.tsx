import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Lock, Package, Zap, Globe, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://static-assets.manus.space/manus-storage/bulnix-new-logo_9cb6900b.jpg";

type Step = "login" | "otp" | "forgot" | "reset";

// Bulnix-specific product categories shown as showcase cards
const productCategories = [
  { name: "Facebook Accounts", count: "192+", color: "#1877F2", icon: (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  )},
  { name: "Instagram Accounts", count: "150+", color: "#E1306C", icon: (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  )},
  { name: "Netflix Accounts", count: "80+", color: "#E50914", icon: (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/></svg>
  )},
  { name: "Gmail Accounts", count: "37+", color: "#EA4335", icon: (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
  )},
  { name: "Discord Accounts", count: "27+", color: "#5865F2", icon: (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
  )},
  { name: "Spotify Accounts", count: "60+", color: "#1DB954", icon: (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
  )},
];

// Key stats for Bulnix
const stats = [
  { label: "Products", value: "449+" },
  { label: "Orders", value: "45K+" },
  { label: "Customers", value: "9K+" },
  { label: "Countries", value: "72+" },
];

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const loginMutation = trpc.auth.loginRequest.useMutation({
    onSuccess: async (data) => {
      setEmail(data.email);
      if ((data as any).requiresOtp) {
        // Admin: show OTP step
        setStep("otp");
        startCooldown();
        toast.success("Verification code sent to " + data.email);
      } else {
        // Regular user: session already set, redirect
        await utils.auth.me.invalidate();
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Welcome back!"); navigate("/dashboard"); },
    onError: (err) => toast.error(err.message),
  });

  const resendMutation = trpc.auth.resendOtp.useMutation({
    onSuccess: () => { toast.success("A new code has been sent."); startCooldown(); },
    onError: (err) => toast.error(err.message),
  });

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => { setStep("reset"); toast.success("If that email exists, a reset code has been sent."); },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Password reset! You are now signed in."); navigate("/dashboard"); },
    onError: (err) => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); loginMutation.mutate({ email, password }); };
  const handleVerify = (e: React.FormEvent) => { e.preventDefault(); verifyMutation.mutate({ email, otp, purpose: "login" }); };
  const handleForgot = (e: React.FormEvent) => { e.preventDefault(); forgotMutation.mutate({ email }); };
  const handleReset = (e: React.FormEvent) => { e.preventDefault(); resetMutation.mutate({ email, otp, newPassword }); };
  const handleGoogleLogin = () => {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
    if (!oauthPortalUrl) { toast.error("Google login is not configured."); return; }
    const callbackUrl = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(callbackUrl);
    window.location.href = `${oauthPortalUrl}?appId=${import.meta.env.VITE_APP_ID}&state=${encodeURIComponent(state)}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden bg-[#0F3D5E]">
          {/* Subtle diagonal stripe overlay */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00C2FF] via-[#0050D0] to-[#00C2FF]" />

          {/* Glow accents */}
          <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00C2FF, transparent 70%)" }} />
          <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #0050D0, transparent 70%)" }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full px-10 py-10">
            {/* Logo */}
            <Link href="/" className="inline-block mb-10">
              <img src={LOGO_URL} alt="Bulnix" className="h-10 w-auto" />
            </Link>

            {/* Headline */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white leading-snug mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Your one-stop shop for<br />
                <span className="text-[#00C2FF]">premium digital accounts</span>
              </h2>
              <p className="text-white/55 text-sm leading-relaxed max-w-sm">
                Browse 449+ verified products across social media, streaming, gaming, and software. Instant delivery, secure payments.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/8 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-[#00C2FF] font-bold text-lg leading-tight">{s.value}</div>
                  <div className="text-white/45 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Product category grid */}
            <div className="mb-8">
              <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-3">Available categories</p>
              <div className="grid grid-cols-2 gap-2.5">
                {productCategories.map((cat) => (
                  <div key={cat.name}
                    className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 hover:bg-white/12 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: cat.color }}>
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-xs font-medium truncate">{cat.name}</div>
                      <div className="text-white/40 text-xs">{cat.count} products</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {[
                { icon: <Zap className="w-3.5 h-3.5" />, text: "Instant delivery" },
                { icon: <Globe className="w-3.5 h-3.5" />, text: "72+ countries" },
                { icon: <HeadphonesIcon className="w-3.5 h-3.5" />, text: "24/7 support" },
                { icon: <Package className="w-3.5 h-3.5" />, text: "449+ products" },
              ].map((pill) => (
                <div key={pill.text}
                  className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-white/60 text-xs">
                  {pill.icon}
                  {pill.text}
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-center text-xs text-white/20 pb-5">© {new Date().getFullYear()} Bulnix. All rights reserved.</p>
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F8FAFF]">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <Link href="/"><img src={LOGO_URL} alt="Bulnix" className="h-9 w-auto rounded-lg" /></Link>
            </div>

            {/* ── Login step ── */}
            {step === "login" && (
              <>
                <div className="mb-7">
                  <h1 className="text-3xl font-extrabold text-[#0F3D5E]" style={{ fontFamily: "'Poppins', sans-serif" }}>Sign In</h1>
                  <p className="text-slate-500 mt-1.5 text-sm">Welcome back! Enter your details to continue.</p>
                </div>

                {/* Google sign-in */}
                <a href={`/api/auth/google?return=${encodeURIComponent(window.location.pathname)}`}
                  className="w-full h-12 flex items-center justify-center gap-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-medium text-sm transition-all shadow-sm mb-5 no-underline">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </a>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">or sign in with email</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email Address</Label>
                    <Input id="email" type="email" placeholder="Enter your email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required
                      className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-700 text-sm font-medium">Password</Label>
                      <button type="button" onClick={() => setStep("forgot")} className="text-xs text-[#0050D0] hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password"
                        value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loginMutation.isPending}
                    className="w-full h-12 bg-[#0F3D5E] hover:bg-[#0a2d47] text-white font-semibold text-base rounded-xl shadow-md">
                    {loginMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
                  </Button>
                  <p className="text-center text-sm text-slate-500 pt-1">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[#0050D0] font-semibold hover:underline">Sign up</Link>
                  </p>
                </form>
              </>
            )}

            {/* ── OTP step ── */}
            {step === "otp" && (
              <>
                <button onClick={() => setStep("login")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#0F3D5E]" style={{ fontFamily: "'Poppins', sans-serif" }}>Check your email</h1>
                  <p className="text-slate-500 mt-1 text-sm">We sent a 6-digit code to <span className="text-slate-800 font-medium">{email}</span></p>
                </div>
                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp" className="text-slate-700 text-sm font-medium">Verification code</Label>
                    <Input id="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required
                      className="h-14 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                  </div>
                  <Button type="submit" disabled={verifyMutation.isPending || otp.length !== 6}
                    className="w-full h-12 bg-[#0F3D5E] hover:bg-[#0a2d47] text-white font-semibold rounded-xl shadow-md">
                    {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Sign In"}
                  </Button>
                  <div className="text-center">
                    <span className="text-slate-500 text-sm">Didn't receive the code? </span>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 text-sm">Resend in {resendCooldown}s</span>
                    ) : (
                      <button type="button" onClick={() => resendMutation.mutate({ email, purpose: "login" })} disabled={resendMutation.isPending}
                        className="text-[#0050D0] text-sm hover:underline font-medium disabled:opacity-50">
                        {resendMutation.isPending ? "Sending..." : "Resend code"}
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}

            {/* ── Forgot password step ── */}
            {step === "forgot" && (
              <>
                <button onClick={() => setStep("login")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#0F3D5E]" style={{ fontFamily: "'Poppins', sans-serif" }}>Forgot password?</h1>
                  <p className="text-slate-500 mt-1 text-sm">Enter your email and we'll send you a reset code.</p>
                </div>
                <form onSubmit={handleForgot} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-slate-700 text-sm font-medium">Email Address</Label>
                    <Input id="forgot-email" type="email" placeholder="Enter your email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required
                      className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                  </div>
                  <Button type="submit" disabled={forgotMutation.isPending}
                    className="w-full h-12 bg-[#0F3D5E] hover:bg-[#0a2d47] text-white font-semibold rounded-xl shadow-md">
                    {forgotMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send Reset Code"}
                  </Button>
                </form>
              </>
            )}

            {/* ── Reset password step ── */}
            {step === "reset" && (
              <>
                <button onClick={() => setStep("forgot")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#0F3D5E]" style={{ fontFamily: "'Poppins', sans-serif" }}>Reset password</h1>
                  <p className="text-slate-500 mt-1 text-sm">Enter the code sent to <span className="text-slate-800 font-medium">{email}</span> and your new password.</p>
                </div>
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-otp" className="text-slate-700 text-sm font-medium">Reset code</Label>
                    <Input id="reset-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required
                      className="h-14 border-slate-200 bg-white text-slate-800 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-slate-700 text-sm font-medium">New Password</Label>
                    <div className="relative">
                      <Input id="new-password" type={showNewPassword ? "text" : "password"} placeholder="Enter new password"
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                        className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={resetMutation.isPending}
                    className="w-full h-12 bg-[#0F3D5E] hover:bg-[#0a2d47] text-white font-semibold rounded-xl shadow-md">
                    {resetMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : "Reset Password"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
