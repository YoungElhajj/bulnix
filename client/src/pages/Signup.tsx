import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Step = "form" | "otp";

export default function SignUp() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setEmail(data.email);
      setStep("otp");
      toast.success(`Verification code sent to ${data.email}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const verifyMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Account created! Welcome to Bulnix.");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const resendMutation = trpc.auth.resendOtp.useMutation({
    onSuccess: () => {
      toast.success("A new code has been sent to your inbox.");
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ name, email, password });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ email, otp, purpose: "register" });
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#0a1628] to-[#080c14] border-r border-white/5">
        <Link href="/">
          <img src={`${import.meta.env.VITE_APP_LOGO}`} alt="Bulnix" className="h-8 w-auto" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#00B9E9]/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#00B9E9]" />
            </div>
            <span className="text-sm text-slate-400 font-medium">Secure & Encrypted</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Premium digital accounts,<br />
            <span className="text-[#00B9E9]">delivered instantly.</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Join thousands of customers who trust Bulnix for bulk digital account purchases. Secure payments, instant delivery, 24/7 support.
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

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <img src={`${import.meta.env.VITE_APP_LOGO}`} alt="Bulnix" className="h-8 w-auto" />
            </Link>
          </div>

          {step === "form" ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Create your account</h1>
                <p className="text-slate-400 mt-1 text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#00B9E9] hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-300 text-sm">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 focus:border-[#00B9E9] focus:ring-[#00B9E9]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-300 text-sm">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 focus:border-[#00B9E9] focus:ring-[#00B9E9]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 pr-10 focus:border-[#00B9E9] focus:ring-[#00B9E9]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full h-11 bg-[#00B9E9] hover:bg-[#00a0cc] text-white font-semibold"
                >
                  {registerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                  ) : "Create account"}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-slate-400 hover:text-white underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-slate-400 hover:text-white underline">Privacy Policy</Link>.
                </p>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("form")}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#00B9E9]/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#00B9E9]" />
                </div>
                <h1 className="text-2xl font-bold text-white">Verify your email</h1>
                <p className="text-slate-400 mt-1 text-sm">
                  We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-slate-300 text-sm">Verification code</Label>
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-14 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#00B9E9] focus:ring-[#00B9E9]/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={verifyMutation.isPending || otp.length !== 6}
                  className="w-full h-11 bg-[#00B9E9] hover:bg-[#00a0cc] text-white font-semibold"
                >
                  {verifyMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : "Verify & create account"}
                </Button>

                <div className="text-center">
                  <span className="text-slate-500 text-sm">Didn't receive the code? </span>
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400 text-sm">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => resendMutation.mutate({ email, purpose: "register" })}
                      disabled={resendMutation.isPending}
                      className="text-[#00B9E9] text-sm hover:underline font-medium disabled:opacity-50"
                    >
                      {resendMutation.isPending ? "Sending..." : "Resend code"}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
