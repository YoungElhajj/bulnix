import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/bulnix-logo_f53aba21.png";

type Step = "login" | "otp" | "forgot" | "reset";

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
    <div className="min-h-screen bg-[#080c14] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#0a1628] to-[#080c14] border-r border-white/5">
        <Link href="/"><img src={LOGO_URL} alt="Bulnix" className="h-8 w-auto" /></Link>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#00B9E9]/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#00B9E9]" />
            </div>
            <span className="text-sm text-slate-400 font-medium">Secure & Encrypted</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Your digital accounts,<br />
            <span className="text-[#00B9E9]">always at hand.</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Sign in to manage your orders, track deliveries, and access your purchased digital accounts from anywhere.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: "50K+", desc: "Happy customers" },
              { label: "99.9%", desc: "Uptime guaranteed" },
              { label: "<4min", desc: "Avg. delivery time" },
              { label: "256-bit", desc: "SSL encryption" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-xl font-bold text-[#00B9E9]">{stat.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} Bulnix. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/"><img src={LOGO_URL} alt="Bulnix" className="h-8 w-auto" /></Link>
          </div>

          {step === "login" && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                <p className="text-slate-400 mt-1 text-sm">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-[#00B9E9] hover:underline font-medium">Create one free</Link>
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-300 text-sm">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 focus:border-[#00B9E9]" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                    <button type="button" onClick={() => setStep("forgot")} className="text-xs text-[#00B9E9] hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 pr-10 focus:border-[#00B9E9]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loginMutation.isPending}
                  className="w-full h-11 bg-[#00B9E9] hover:bg-[#00a0cc] text-white font-semibold">
                  {loginMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign in"}
                </Button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <button onClick={() => setStep("login")}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#00B9E9]/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#00B9E9]" />
                </div>
                <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
                <p className="text-slate-400 mt-1 text-sm">
                  We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-slate-300 text-sm">Verification code</Label>
                  <Input id="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                    placeholder="000000" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-14 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#00B9E9]" />
                </div>
                <Button type="submit" disabled={verifyMutation.isPending || otp.length !== 6}
                  className="w-full h-11 bg-[#00B9E9] hover:bg-[#00a0cc] text-white font-semibold">
                  {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & sign in"}
                </Button>
                <div className="text-center">
                  <span className="text-slate-500 text-sm">Didn't receive the code? </span>
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400 text-sm">Resend in {resendCooldown}s</span>
                  ) : (
                    <button type="button" onClick={() => resendMutation.mutate({ email, purpose: "login" })}
                      disabled={resendMutation.isPending}
                      className="text-[#00B9E9] text-sm hover:underline font-medium disabled:opacity-50">
                      {resendMutation.isPending ? "Sending..." : "Resend code"}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {step === "forgot" && (
            <>
              <button onClick={() => setStep("login")}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </button>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Reset your password</h1>
                <p className="text-slate-400 mt-1 text-sm">Enter your email and we'll send you a reset code.</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-slate-300 text-sm">Email address</Label>
                  <Input id="forgot-email" type="email" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 focus:border-[#00B9E9]" />
                </div>
                <Button type="submit" disabled={forgotMutation.isPending}
                  className="w-full h-11 bg-[#00B9E9] hover:bg-[#00a0cc] text-white font-semibold">
                  {forgotMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send reset code"}
                </Button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <button onClick={() => setStep("forgot")}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#00B9E9]/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#00B9E9]" />
                </div>
                <h1 className="text-2xl font-bold text-white">Set new password</h1>
                <p className="text-slate-400 mt-1 text-sm">
                  Enter the code sent to <span className="text-white font-medium">{email}</span> and your new password.
                </p>
              </div>
              <form onSubmit={handleReset} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-otp" className="text-slate-300 text-sm">Reset code</Label>
                  <Input id="reset-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                    placeholder="000000" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-14 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#00B9E9]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-slate-300 text-sm">New password</Label>
                  <div className="relative">
                    <Input id="new-password" type={showNewPassword ? "text" : "password"}
                      placeholder="Min. 8 characters" value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 pr-10 focus:border-[#00B9E9]" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={resetMutation.isPending || otp.length !== 6 || newPassword.length < 8}
                  className="w-full h-11 bg-[#00B9E9] hover:bg-[#00a0cc] text-white font-semibold">
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
