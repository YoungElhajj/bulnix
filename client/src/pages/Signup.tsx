import Navbar from "@/components/Navbar";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Zap, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

type Step = "form" | "otp";

// Floating platform icons for the left panel
const platforms = [
  { name: "Netflix", color: "#E50914", icon: "N", x: "12%", y: "20%", delay: "0s", size: 48 },
  { name: "Spotify", color: "#1DB954", icon: "S", x: "74%", y: "16%", delay: "0.5s", size: 44 },
  { name: "YouTube", color: "#FF0000", icon: "▶", x: "6%", y: "58%", delay: "1s", size: 42 },
  { name: "Disney+", color: "#0063E5", icon: "D+", x: "76%", y: "54%", delay: "0.7s", size: 40 },
  { name: "Amazon", color: "#FF9900", icon: "a", x: "18%", y: "80%", delay: "1.3s", size: 38 },
  { name: "Apple TV", color: "#555", icon: "", x: "70%", y: "78%", delay: "0.9s", size: 36 },
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

export default function SignUp() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const utils = trpc.useUtils();

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setEmail(data.email);
      setStep("otp");
      startCooldown();
      toast.success(`Verification code sent to ${data.email}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Account created! Welcome to Bulnix.");
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (!agreedToTerms) { toast.error("Please agree to the Terms & Conditions to continue."); return; }
    registerMutation.mutate({ name, email, password });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ email, otp, purpose: "register" });
  };

  const handleGoogleSignup = () => {
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
                <span className="text-white/80 text-sm font-medium uppercase tracking-widest">Join Bulnix Today</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Premium digital<br />
                <span className="text-[#00C2FF]">accounts delivered.</span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Join thousands of customers who trust Bulnix for Netflix, Spotify, YouTube Premium, and 200+ more accounts.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 w-full justify-center">
              {[
                { icon: <Users className="w-4 h-4" />, v: "50K+", l: "Customers" },
                { icon: <Clock className="w-4 h-4" />, v: "<4min", l: "Delivery" },
                { icon: <ShieldCheck className="w-4 h-4" />, v: "256-bit", l: "Encryption" },
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
            <div className="lg:hidden mb-8">
              <Link href="/">
                <img src={LOGO_URL} alt="Bulnix" className="h-9 w-auto rounded-lg" />
              </Link>
            </div>

            {/* ── Registration form step ── */}
            {step === "form" && (
              <>
                <div className="mb-6">
                  <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Create Account</h1>
                  <p className="text-slate-500 mt-1.5 text-sm">Start your journey — it only takes a minute.</p>
                </div>

                {/* Google OAuth button */}
                <button type="button" onClick={handleGoogleSignup}
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
                  <span className="text-xs text-slate-400 font-medium">or sign up with email</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-slate-700 text-sm font-medium">Full Name</Label>
                    <Input id="name" type="text" placeholder="Enter your full name" value={name}
                      onChange={(e) => setName(e.target.value)} required minLength={2}
                      className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email Address</Label>
                    <Input id="email" type="email" placeholder="Enter your email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required
                      className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-700 text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a password (min. 8 chars)"
                        value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                        className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-slate-700 text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                        className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(!!v)}
                      className="mt-0.5 border-slate-300 data-[state=checked]:bg-[#0050D0] data-[state=checked]:border-[#0050D0]" />
                    <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                      By creating an account you agree to our{" "}
                      <Link href="/terms" className="text-[#0050D0] hover:underline font-medium">Terms & Conditions</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-[#0050D0] hover:underline font-medium">Privacy Policy</Link>
                    </label>
                  </div>

                  <Button type="submit" disabled={registerMutation.isPending}
                    className="w-full h-12 bg-gradient-to-r from-[#0F3D5E] to-[#0050D0] hover:from-[#0a2d47] hover:to-[#003db5] text-white font-semibold text-base rounded-xl shadow-lg shadow-[#0050D0]/25 mt-1">
                    {registerMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account"}
                  </Button>

                  <p className="text-center text-sm text-slate-500 pt-1">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#0050D0] font-semibold hover:underline">Sign In here</Link>
                  </p>
                </form>
              </>
            )}

            {/* ── OTP verification step ── */}
            {step === "otp" && (
              <>
                <button onClick={() => setStep("form")}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Verify your email</h1>
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
                    {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Create Account"}
                  </Button>
                  <div className="text-center">
                    <span className="text-slate-500 text-sm">Didn't receive the code? </span>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 text-sm">Resend in {resendCooldown}s</span>
                    ) : (
                      <button type="button" onClick={() => resendMutation.mutate({ email, purpose: "register" })}
                        disabled={resendMutation.isPending}
                        className="text-[#0050D0] text-sm hover:underline font-medium disabled:opacity-50">
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
    </div>
  );
}
