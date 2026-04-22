import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Lock, ArrowLeft, Loader2 } from "lucide-react";

type Step = "login" | "otp";

export default function SecureAdminLogin() {
  const utils = trpc.useUtils();
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
      if ((data as any).requiresOtp) {
        setEmail(data.email);
        setStep("otp");
        startCooldown();
        toast.success("Verification code sent to " + data.email);
      } else {
        // Non-admin somehow reached this page — redirect to normal dashboard
        window.location.href = "/dashboard";
      }
    },
    onError: (err) => toast.error(err.message || "Invalid credentials"),
  });

  const verifyMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Welcome back, Admin!");
      setTimeout(() => { window.location.href = "/admin"; }, 300);
    },
    onError: (err) => toast.error(err.message),
  });

  const resendMutation = trpc.auth.resendOtp.useMutation({
    onSuccess: () => { toast.success("A new code has been sent."); startCooldown(); },
    onError: (err) => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter your email and password"); return; }
    loginMutation.mutate({ email, password });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ email, otp, purpose: "login" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-[#111118] border border-[#0F3D5E] rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Access</h1>
            <p className="text-sm text-white/40 mt-1">Restricted area — authorised personnel only</p>
          </div>

          {/* Step 1: Email + Password */}
          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70 text-sm">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@bulnix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="bg-[#0F3D5E]/30 border-[#0F3D5E] text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-cyan-500/20 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="bg-[#0F3D5E]/30 border-[#0F3D5E] text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-cyan-500/20 h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-all"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Continue
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <>
              <button
                onClick={() => setStep("login")}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <p className="text-white/60 text-sm mb-6">
                A 6-digit verification code was sent to <span className="text-white font-medium">{email}</span>
              </p>
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-white/70 text-sm">Verification code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="bg-[#0F3D5E]/30 border-[#0F3D5E] text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-cyan-500/20 h-14 text-center text-2xl font-mono tracking-[0.5em]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={verifyMutation.isPending || otp.length !== 6}
                  className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg"
                >
                  {verifyMutation.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Verifying...</span>
                  ) : "Verify & Sign In"}
                </Button>
                <div className="text-center">
                  <span className="text-white/40 text-sm">Didn't receive the code? </span>
                  {resendCooldown > 0 ? (
                    <span className="text-white/30 text-sm">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => resendMutation.mutate({ email, purpose: "login" })}
                      disabled={resendMutation.isPending}
                      className="text-cyan-400 text-sm hover:underline disabled:opacity-50"
                    >
                      {resendMutation.isPending ? "Sending..." : "Resend code"}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          <p className="text-center text-xs text-white/20 mt-6">
            This page is not publicly listed. Unauthorised access attempts are logged.
          </p>
        </div>

        <p className="text-center mt-4">
          <a href="/" className="text-xs text-white/20 hover:text-white/40 transition-colors">
            ← Return to Bulnix
          </a>
        </p>
      </div>
    </div>
  );
}
