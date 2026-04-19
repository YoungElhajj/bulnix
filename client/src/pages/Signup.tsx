import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, CheckCircle2, ShieldIcon, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

type Step = "signup" | "otp";

const whyBulnix = [
  {
    icon: <Truck className="w-5 h-5 text-[#00C2FF]" />,
    title: "Instant Delivery",
    desc: "Account credentials sent to your email within minutes of payment confirmation.",
  },
  {
    icon: <ShieldIcon className="w-5 h-5 text-[#00C2FF]" />,
    title: "Verified Products",
    desc: "Every product is tested and verified before listing. Quality you can count on.",
  },
  {
    icon: <CreditCard className="w-5 h-5 text-[#00C2FF]" />,
    title: "Secure Payments",
    desc: "Pay via Paystack, Monnify, or crypto. All transactions are SSL-encrypted.",
  },
  {
    icon: <CheckCircle2 className="w-5 h-5 text-[#00C2FF]" />,
    title: "Refund Protection",
    desc: "Not satisfied? Raise a support ticket and we will sort it out within 24 hours.",
  },
];

const platforms = [
  { name: "Facebook", color: "#1877F2" },
  { name: "Instagram", color: "#E1306C" },
  { name: "Netflix", color: "#E50914" },
  { name: "Spotify", color: "#1DB954" },
  { name: "Discord", color: "#5865F2" },
  { name: "Gmail", color: "#EA4335" },
  { name: "YouTube", color: "#FF0000" },
  { name: "Telegram", color: "#229ED9" },
  { name: "Reddit", color: "#FF4500" },
  { name: "Twitter/X", color: "#000000" },
  { name: "WhatsApp", color: "#25D366" },
  { name: "TikTok", color: "#010101" },
];

export default function SignUp() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [step, setStep] = useState<Step>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [passwordError, setPasswordError] = useState("");

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

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => { setEmail(data.email); setStep("otp"); startCooldown(); toast.success("Verification code sent to " + data.email); },
    onError: (err) => toast.error(err.message),
  });

  const verifyMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Account created! Welcome to Bulnix."); navigate("/dashboard"); },
    onError: (err) => toast.error(err.message),
  });

  const resendMutation = trpc.auth.resendOtp.useMutation({
    onSuccess: () => { toast.success("A new code has been sent."); startCooldown(); },
    onError: (err) => toast.error(err.message),
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    if (password.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
    if (!agreed) { toast.error("Please agree to the Terms & Conditions"); return; }
    setPasswordError("");
    registerMutation.mutate({ name, email, password });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ email, otp, purpose: "register" });
  };

  const handleGoogleSignup = () => { window.location.href = getLoginUrl("/dashboard"); };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden bg-[#0F3D5E]">
          {/* Subtle diagonal stripe overlay */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00C2FF] via-[#0050D0] to-[#00C2FF]" />

          {/* Glow accents */}
          <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00C2FF, transparent 70%)" }} />
          <div className="absolute bottom-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full opacity-8"
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
                Create your free account<br />
                <span className="text-[#00C2FF]">and start buying today</span>
              </h2>
              <p className="text-white/55 text-sm leading-relaxed max-w-sm">
                Join thousands of customers who trust Bulnix for premium digital accounts. No subscription fees, no hidden charges.
              </p>
            </div>

            {/* Why Bulnix feature list */}
            <div className="space-y-5 mb-8">
              {whyBulnix.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{item.title}</div>
                    <div className="text-white/45 text-xs leading-relaxed mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform tags */}
            <div className="mt-auto">
              <p className="text-white/35 text-xs uppercase tracking-wider font-medium mb-3">Platforms available</p>
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <span key={p.name}
                    className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-2.5 py-1 text-white/60 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
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

            {/* ── Register step ── */}
            {step === "signup" && (
              <>
                <div className="mb-7">
                  <h1 className="text-3xl font-extrabold text-[#0F3D5E]" style={{ fontFamily: "'Poppins', sans-serif" }}>Create Account</h1>
                  <p className="text-slate-500 mt-1.5 text-sm">It's free. Let's get you started.</p>
                </div>

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

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-slate-700 text-sm font-medium">Full Name</Label>
                    <Input id="name" type="text" placeholder="Enter your full name" value={name}
                      onChange={(e) => setName(e.target.value)} required
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
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
                        value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                        className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-slate-700 text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Re-enter your password"
                        value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }} required
                        className={`h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm ${passwordError ? "border-red-400" : ""}`} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0050D0] focus:ring-[#0050D0]/20 cursor-pointer" />
                    <label htmlFor="terms" className="text-slate-500 text-sm leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link href="/terms" className="text-[#0050D0] hover:underline font-medium">Terms & Conditions</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-[#0050D0] hover:underline font-medium">Privacy Policy</Link>
                    </label>
                  </div>
                  <Button type="submit" disabled={registerMutation.isPending || !agreed}
                    className="w-full h-12 bg-[#0F3D5E] hover:bg-[#0a2d47] text-white font-semibold text-base rounded-xl shadow-md disabled:opacity-60">
                    {registerMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Sign Up"}
                  </Button>
                  <p className="text-center text-sm text-slate-500 pt-1">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#0050D0] font-semibold hover:underline">Sign in here</Link>
                  </p>
                </form>
              </>
            )}

            {/* ── OTP step ── */}
            {step === "otp" && (
              <>
                <button onClick={() => setStep("signup")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#0F3D5E]" style={{ fontFamily: "'Poppins', sans-serif" }}>Verify your email</h1>
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
                    {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Create Account"}
                  </Button>
                  <div className="text-center">
                    <span className="text-slate-500 text-sm">Didn't receive the code? </span>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 text-sm">Resend in {resendCooldown}s</span>
                    ) : (
                      <button type="button" onClick={() => resendMutation.mutate({ email, purpose: "register" })} disabled={resendMutation.isPending}
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
