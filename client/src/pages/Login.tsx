import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Lock, Zap, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

type Step = "login" | "otp" | "forgot" | "reset";

// Floating social platform icons for the left panel
const platforms = [
  { name: "Netflix", color: "#E50914", icon: "N", x: "15%", y: "22%", delay: "0s", size: 48 },
  { name: "Spotify", color: "#1DB954", icon: "S", x: "72%", y: "18%", delay: "0.4s", size: 44 },
  { name: "YouTube", color: "#FF0000", icon: "▶", x: "8%", y: "55%", delay: "0.8s", size: 42 },
  { name: "Disney+", color: "#0063E5", icon: "D+", x: "78%", y: "52%", delay: "0.6s", size: 40 },
  { name: "Amazon", color: "#FF9900", icon: "a", x: "20%", y: "78%", delay: "1.2s", size: 38 },
  { name: "Apple TV", color: "#555", icon: "", x: "68%", y: "75%", delay: "1s", size: 36 },
];

function FloatingPlatforms() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {platforms.map((p) => (
        <div
          key={p.name}
          className="absolute flex items-center justify-center rounded-2xl shadow-lg text-white font-bold"
          style={{
            left: p.x, top: p.y,
            width: p.size, height: p.size,
            background: p.color,
            fontSize: p.size * 0.38,
            animation: `float 4s ease-in-out infinite`,
            animationDelay: p.delay,
            opacity: 0.9,
          }}
        >
          {p.icon}
        </div>
      ))}
    </div>
  );
}

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
    onSuccess: (data) => {
      setEmail(data.email);
      setStep("otp");
      startCooldown();
      toast.success("Verification code sent to " + data.email);
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Welcome back!");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const resendMutation = trpc.auth.resendOtp.useMutation({
    onSuccess: () => {
      toast.success("A new code has been sent to your inbox.");
      startCooldown();
    },
    onError: (err) => toast.error(err.message),
  });

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setStep("reset");
      toast.success("If that email exists, a reset code has been sent.");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Password reset! You are now signed in.");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ email, otp, purpose: "login" });
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    forgotMutation.mutate({ email });
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    resetMutation.mutate({ email, otp, newPassword });
  };

  const handleGoogleLogin = () => {
    window.location.href = getLoginUrl("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        {/* ── Left panel ── */}
        <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0F3D5E 0%, #0050D0 60%, #00C2FF 100%)" }}>
          {/* Animated grid overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          {/* Floating platform icons */}
          <FloatingPlatforms />

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-md">
            <Link href="/">
              <img src={LOGO_URL} alt="Bulnix" className="h-14 w-auto rounded-xl mb-8 shadow-xl" />
            </Link>

            {/* Central glowing card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8 w-full shadow-2xl">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#00C2FF]" />
                <span className="text-white/80 text-sm font-medium uppercase tracking-widest">Instant Delivery</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Premium digital<br />
                <span className="text-[#00C2FF]">accounts delivered.</span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Netflix, Spotify, YouTube Premium, and 200+ more. Secure, instant, and always working.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 w-full justify-center">
              {[
                { icon: <Star className="w-4 h-4" />, v: "50K+", l: "Customers" },
                { icon: <Globe className="w-4 h-4" />, v: "200+", l: "Products" },
                { icon: <ShieldCheck className="w-4 h-4" />, v: "99.9%", l: "Uptime" },
              ].map((s) => (
                <div key={s.v} className="flex flex-col items-center bg-white/10 rounded-2xl px-4 py-3">
                  <div className="text-[#00C2FF] mb-1">{s.icon}</div>
                  <div className="text-lg font-bold text-white">{s.v}</div>
                  <div className="text-xs text-white/50">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="absolute bottom-6 text-xs text-white/30">© {new Date().getFullYear()} Bulnix. All rights reserved.</p>
        </div>

        {/* ── Right panel — form ── */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F8FAFF]">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <Link href="/">
                <img src={LOGO_URL} alt="Bulnix" className="h-9 w-auto rounded-lg" />
              </Link>
            </div>

            {/* ── Login step ── */}
            {step === "login" && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Sign In</h1>
                  <p className="text-slate-500 mt-1.5 text-sm">Welcome back! Enter your details to continue.</p>
                </div>

                {/* Google OAuth button */}
                <button type="button" onClick={handleGoogleLogin}
                  className="w-full h-12 flex items-center justify-center gap-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-medium text-sm transition-all shadow-sm mb-5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

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
                      <button type="button" onClick={() => setStep("forgot")}
                        className="text-xs text-[#0050D0] hover:underline font-medium">
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
                    className="w-full h-12 bg-gradient-to-r from-[#0F3D5E] to-[#0050D0] hover:from-[#0a2d47] hover:to-[#003db5] text-white font-semibold text-base rounded-xl shadow-lg shadow-[#0050D0]/25 mt-1">
                    {loginMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
                  </Button>
                  <p className="text-center text-sm text-slate-500 pt-1">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[#0050D0] font-semibold hover:underline">Create account</Link>
                  </p>
                </form>
              </>
            )}

            {/* ── OTP step ── */}
            {step === "otp" && (
              <>
                <button onClick={() => setStep("login")}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Check your inbox</h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    We sent a 6-digit code to <span className="text-slate-800 font-medium">{email}</span>
                  </p>
                </div>
                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp" className="text-slate-700 text-sm font-medium">Verification code</Label>
                    <Input id="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      placeholder="000000" value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required
                      className="h-14 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                  </div>
                  <Button type="submit" disabled={verifyMutation.isPending || otp.length !== 6}
                    className="w-full h-12 bg-gradient-to-r from-[#0F3D5E] to-[#0050D0] hover:from-[#0a2d47] hover:to-[#003db5] text-white font-semibold rounded-xl shadow-lg shadow-[#0050D0]/25">
                    {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Sign In"}
                  </Button>
                  <div className="text-center">
                    <span className="text-slate-500 text-sm">Didn't receive the code? </span>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 text-sm">Resend in {resendCooldown}s</span>
                    ) : (
                      <button type="button" onClick={() => resendMutation.mutate({ email, purpose: "login" })}
                        disabled={resendMutation.isPending}
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
                <button onClick={() => setStep("login")}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Forgot password?</h1>
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
                    className="w-full h-12 bg-gradient-to-r from-[#0F3D5E] to-[#0050D0] hover:from-[#0a2d47] hover:to-[#003db5] text-white font-semibold rounded-xl shadow-lg shadow-[#0050D0]/25">
                    {forgotMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send reset code"}
                  </Button>
                </form>
              </>
            )}

            {/* ── Reset password step ── */}
            {step === "reset" && (
              <>
                <button onClick={() => setStep("forgot")}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Set new password</h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    Enter the code sent to <span className="text-slate-800 font-medium">{email}</span> and your new password.
                  </p>
                </div>
                <form onSubmit={handleReset} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-otp" className="text-slate-700 text-sm font-medium">Reset code</Label>
                    <Input id="reset-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      placeholder="000000" value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required
                      className="h-14 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-slate-700 text-sm font-medium">New password</Label>
                    <div className="relative">
                      <Input id="new-password" type={showNewPassword ? "text" : "password"}
                        placeholder="Min. 8 characters" value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                        className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={resetMutation.isPending || otp.length !== 6 || newPassword.length < 8}
                    className="w-full h-12 bg-gradient-to-r from-[#0F3D5E] to-[#0050D0] hover:from-[#0a2d47] hover:to-[#003db5] text-white font-semibold rounded-xl shadow-lg shadow-[#0050D0]/25">
                    {resetMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : "Reset password & sign in"}
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
