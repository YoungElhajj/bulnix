import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Step = "login" | "otp" | "forgot" | "reset";

// Inline SVG illustration — person with lock/security theme
function LoginIllustration() {
  return (
    <svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
      {/* Background blob */}
      <ellipse cx="240" cy="300" rx="200" ry="140" fill="#e0f2fe" opacity="0.6" />
      {/* Large shield */}
      <path d="M240 100 L340 140 L340 260 Q340 320 240 360 Q140 320 140 260 L140 140 Z" fill="white" stroke="#bae6fd" strokeWidth="3" />
      {/* Shield inner */}
      <path d="M240 130 L316 163 L316 258 Q316 305 240 336 Q164 305 164 258 L164 163 Z" fill="#f0f8ff" />
      {/* Lock icon on shield */}
      <rect x="210" y="210" width="60" height="50" rx="8" fill="#0319CB" />
      <path d="M220 210 L220 196 Q220 176 240 176 Q260 176 260 196 L260 210" stroke="#0319CB" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="240" cy="232" r="8" fill="white" />
      <rect x="237" y="232" width="6" height="14" rx="3" fill="white" />
      {/* Check mark */}
      <path d="M210 290 L228 308 L270 266" stroke="#0319CB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Person left */}
      <circle cx="100" cy="310" r="22" fill="#f9a8d4" />
      <path d="M88 300 Q92 290 100 290 Q108 290 112 300" fill="#1e3a5f" />
      <rect x="80" y="330" width="40" height="60" rx="10" fill="#374151" />
      <rect x="74" y="370" width="14" height="36" rx="7" fill="#1e3a5f" />
      <rect x="92" y="370" width="14" height="36" rx="7" fill="#1e3a5f" />
      <ellipse cx="81" cy="406" rx="10" ry="5" fill="#0f172a" />
      <ellipse cx="99" cy="406" rx="10" ry="5" fill="#0f172a" />
      {/* Arm reaching up */}
      <path d="M116 345 Q145 310 165 295" stroke="#f9a8d4" strokeWidth="10" strokeLinecap="round" />
      <circle cx="167" cy="293" r="8" fill="#f9a8d4" />
      {/* Person right */}
      <circle cx="380" cy="310" r="22" fill="#fcd34d" />
      <path d="M368 300 Q372 290 380 290 Q388 290 392 300" fill="#92400e" />
      <rect x="360" y="330" width="40" height="60" rx="10" fill="#6366f1" />
      <rect x="354" y="370" width="14" height="36" rx="7" fill="#92400e" />
      <rect x="372" y="370" width="14" height="36" rx="7" fill="#92400e" />
      <ellipse cx="361" cy="406" rx="10" ry="5" fill="#0f172a" />
      <ellipse cx="379" cy="406" rx="10" ry="5" fill="#0f172a" />
      {/* Arm reaching up */}
      <path d="M364 345 Q335 310 315 295" stroke="#fcd34d" strokeWidth="10" strokeLinecap="round" />
      <circle cx="313" cy="293" r="8" fill="#fcd34d" />
      {/* Floating decorations */}
      <circle cx="80" cy="160" r="12" fill="#bfdbfe" opacity="0.7" />
      <circle cx="60" cy="240" r="8" fill="#93c5fd" opacity="0.5" />
      <circle cx="420" cy="180" r="10" fill="#bfdbfe" opacity="0.6" />
      <circle cx="440" cy="260" r="6" fill="#93c5fd" opacity="0.4" />
      {/* Stars */}
      <text x="60" y="130" fill="#fbbf24" fontSize="20">✦</text>
      <text x="400" y="140" fill="#fbbf24" fontSize="14">✦</text>
      <text x="420" y="380" fill="#fbbf24" fontSize="10">✦</text>
    </svg>
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

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel — illustration ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[#e0f4ff] to-[#f0f8ff] p-12 relative overflow-hidden">
        {/* Logo */}
        <Link href="/" className="absolute top-8 left-8">
          <img src={`${import.meta.env.VITE_APP_LOGO}`} alt="Bulnix" className="h-10 w-auto" />
        </Link>

        <div className="flex flex-col items-center text-center mt-12">
          <LoginIllustration />
          <h2 className="text-2xl font-bold text-slate-800 mt-6">
            Your digital accounts,<br />
            <span className="text-[#0319CB]">always at hand.</span>
          </h2>
          <p className="text-slate-500 text-sm mt-3 max-w-xs leading-relaxed">
            Sign in to manage your orders, track deliveries, and access your purchased digital accounts from anywhere.
          </p>
          <div className="flex gap-6 mt-8">
            {[{ v: "50K+", l: "Customers" }, { v: "99.9%", l: "Uptime" }, { v: "256-bit", l: "Encryption" }].map((s) => (
              <div key={s.v} className="text-center">
                <div className="text-lg font-bold text-[#0319CB]">{s.v}</div>
                <div className="text-xs text-slate-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-6 text-xs text-slate-400">© {new Date().getFullYear()} Bulnix. All rights reserved.</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <img src={`${import.meta.env.VITE_APP_LOGO}`} alt="Bulnix" className="h-8 w-auto" />
            </Link>
          </div>

          {/* ── Login step ── */}
          {step === "login" && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Sign In</h1>
                <p className="text-slate-500 mt-1 text-sm">Welcome back! Please enter your details.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="h-12 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-[#00C2FF] focus:ring-[#00C2FF]/20 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 text-sm font-medium">Password</Label>
                    <button type="button" onClick={() => setStep("forgot")}
                      className="text-xs text-[#0319CB] hover:underline font-medium">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password"
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      className="h-12 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#00C2FF] focus:ring-[#00C2FF]/20 rounded-lg" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loginMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-[#0319CB] to-[#00C2FF] hover:from-[#0210a0] hover:to-[#00a8e0] text-white font-semibold text-base rounded-lg shadow-md shadow-[#00C2FF]/30 mt-2">
                  {loginMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
                </Button>
                <p className="text-center text-sm text-slate-500">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-[#0319CB] font-semibold hover:underline">Sign Up here</Link>
                </p>
              </form>
            </>
          )}

          {/* ── OTP verification step ── */}
          {step === "otp" && (
            <>
              <button onClick={() => setStep("login")}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#e0f4ff] flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#0319CB]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Check your inbox</h1>
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
                    className="h-14 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#00C2FF] focus:ring-[#00C2FF]/20 rounded-lg" />
                </div>
                <Button type="submit" disabled={verifyMutation.isPending || otp.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-[#0319CB] to-[#00C2FF] hover:from-[#0210a0] hover:to-[#00a8e0] text-white font-semibold rounded-lg shadow-md shadow-[#00C2FF]/30">
                  {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & sign in"}
                </Button>
                <div className="text-center">
                  <span className="text-slate-500 text-sm">Didn't receive the code? </span>
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400 text-sm">Resend in {resendCooldown}s</span>
                  ) : (
                    <button type="button" onClick={() => resendMutation.mutate({ email, purpose: "login" })}
                      disabled={resendMutation.isPending}
                      className="text-[#0319CB] text-sm hover:underline font-medium disabled:opacity-50">
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
                <div className="w-14 h-14 rounded-2xl bg-[#e0f4ff] flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-[#0319CB]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Forgot password?</h1>
                <p className="text-slate-500 mt-1 text-sm">Enter your email and we'll send you a reset code.</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-slate-700 text-sm font-medium">Email Address</Label>
                  <Input id="forgot-email" type="email" placeholder="Enter your email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="h-12 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-[#00C2FF] focus:ring-[#00C2FF]/20 rounded-lg" />
                </div>
                <Button type="submit" disabled={forgotMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-[#0319CB] to-[#00C2FF] hover:from-[#0210a0] hover:to-[#00a8e0] text-white font-semibold rounded-lg shadow-md shadow-[#00C2FF]/30">
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
                <div className="w-14 h-14 rounded-2xl bg-[#e0f4ff] flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#0319CB]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Set new password</h1>
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
                    className="h-14 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#00C2FF] focus:ring-[#00C2FF]/20 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-slate-700 text-sm font-medium">New password</Label>
                  <div className="relative">
                    <Input id="new-password" type={showNewPassword ? "text" : "password"}
                      placeholder="Min. 8 characters" value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                      className="h-12 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#00C2FF] focus:ring-[#00C2FF]/20 rounded-lg" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={resetMutation.isPending || otp.length !== 6 || newPassword.length < 8}
                  className="w-full h-12 bg-gradient-to-r from-[#0319CB] to-[#00C2FF] hover:from-[#0210a0] hover:to-[#00a8e0] text-white font-semibold rounded-lg shadow-md shadow-[#00C2FF]/30">
                  {resetMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : "Reset password & sign in"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
