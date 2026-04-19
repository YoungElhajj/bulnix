import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

type Step = "signup" | "otp";

const socialIcons = [
  { name: "Netflix", bg: "#E50914", letter: "N", top: "10%", left: "10%", delay: "0s" },
  { name: "Spotify", bg: "#1DB954", letter: "S", top: "8%", left: "60%", delay: "0.7s" },
  { name: "YouTube", bg: "#FF0000", letter: "▶", top: "40%", left: "5%", delay: "1.4s" },
  { name: "Disney+", bg: "#0063E5", letter: "D", top: "72%", left: "65%", delay: "0.4s" },
  { name: "Instagram", bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", letter: "📷", top: "75%", left: "20%", delay: "1.1s" },
  { name: "TikTok", bg: "#010101", letter: "♪", top: "30%", left: "72%", delay: "0.2s" },
];

const perks = [
  "200+ premium digital accounts available",
  "Instant delivery to your email",
  "Secure payments — Paystack & crypto",
  "24/7 live support via WhatsApp & Telegram",
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
    onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Account created! Welcome to Bulnix!"); navigate("/dashboard"); },
    onError: (err) => toast.error(err.message),
  });

  const resendMutation = trpc.auth.resendOtp.useMutation({
    onSuccess: () => { toast.success("A new code has been sent."); startCooldown(); },
    onError: (err) => toast.error(err.message),
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (!agreed) { toast.error("Please agree to the Terms & Conditions"); return; }
    registerMutation.mutate({ name, email, password });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ email, otp, purpose: "register" });
  };

  const handleGoogleSignup = () => { window.location.href = getLoginUrl("/dashboard"); };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-[48%] flex-col justify-between relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0a0f1e 0%, #0d1f3c 40%, #0a2a5e 70%, #0050D0 100%)" }}>

          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #00C2FF, transparent 70%)" }} />
          <div className="absolute bottom-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #0050D0, transparent 70%)" }} />

          <div className="absolute inset-0 pointer-events-none">
            {socialIcons.map((s) => (
              <div key={s.name}
                className="absolute flex items-center justify-center rounded-full shadow-2xl text-white font-bold text-sm"
                style={{
                  top: s.top, left: s.left,
                  width: 52, height: 52,
                  background: s.bg,
                  animation: "float 4s ease-in-out infinite",
                  animationDelay: s.delay,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}>
                {s.letter}
              </div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col justify-center flex-1 px-10 py-12">
            <Link href="/" className="inline-block mb-10">
              <img src={LOGO_URL} alt="Bulnix" className="h-12 w-auto rounded-xl shadow-xl" />
            </Link>

            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 w-fit mb-6">
              <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
              <span className="text-white/80 text-xs font-medium tracking-wider uppercase">Join the elite 1%</span>
            </div>

            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Elevate your<br />
              <span className="text-[#00C2FF]">digital access.</span>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-10">
              The world's most trusted marketplace for premium digital accounts. Verified products, instant delivery, and unparalleled reach.
            </p>

            <div className="space-y-3 mb-10">
              {perks.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C2FF]/20 border border-[#00C2FF]/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-[#00C2FF]" />
                  </div>
                  <span className="text-white/70 text-sm">{p}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/8 border border-white/15 rounded-2xl p-4 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["#E50914","#1DB954","#FF0000","#0063E5"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: c }}>
                    {["N","S","▶","D"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-xs">★</span>)}
                  <span className="text-white font-bold text-sm ml-1">4.9/5</span>
                </div>
                <div className="text-white/50 text-xs">Trusted by 50K+ customers worldwide</div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-center text-xs text-white/25 pb-6">© {new Date().getFullYear()} Bulnix. All rights reserved.</p>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F8FAFF]">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
              <Link href="/"><img src={LOGO_URL} alt="Bulnix" className="h-9 w-auto rounded-lg" /></Link>
            </div>

            {step === "signup" && (
              <>
                <div className="mb-7">
                  <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Create Account</h1>
                  <p className="text-slate-500 mt-1.5 text-sm">It's not late — let's start your journey now.</p>
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
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create password (min. 8 chars)"
                        value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                        className="h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm" className="text-slate-700 text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirm" type={showConfirm ? "text" : "password"} placeholder="Confirm your password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                        className={"h-12 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#0050D0] focus:ring-[#0050D0]/20 rounded-xl shadow-sm" + (confirmPassword && password !== confirmPassword ? " border-red-300" : "")} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <input id="agree" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#0050D0]" />
                    <label htmlFor="agree" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link href="/terms" className="text-[#0050D0] hover:underline font-medium">Terms & Conditions</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-[#0050D0] hover:underline font-medium">Privacy Policy</Link>
                    </label>
                  </div>
                  <Button type="submit" disabled={registerMutation.isPending}
                    className="w-full h-12 bg-gradient-to-r from-[#0F3D5E] to-[#0050D0] hover:from-[#0a2d47] hover:to-[#003db5] text-white font-semibold text-base rounded-xl shadow-lg shadow-[#0050D0]/25">
                    {registerMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account"}
                  </Button>
                  <p className="text-center text-sm text-slate-500 pt-1">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#0050D0] font-semibold hover:underline">Sign in here</Link>
                  </p>
                </form>
              </>
            )}

            {step === "otp" && (
              <>
                <button onClick={() => setStep("signup")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-[#0050D0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Verify your email</h1>
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
                    className="w-full h-12 bg-gradient-to-r from-[#0F3D5E] to-[#0050D0] hover:from-[#0a2d47] hover:to-[#003db5] text-white font-semibold rounded-xl shadow-lg shadow-[#0050D0]/25">
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
