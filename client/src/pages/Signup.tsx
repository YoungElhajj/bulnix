import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

type Step = "signup" | "otp";

// Floating social icons for left panel (real SVG icons)
const floatingIcons = [
  {
    name: "Instagram", top: "8%", left: "12%", delay: "0s",
    bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    svg: <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  },
  {
    name: "TikTok", top: "6%", left: "60%", delay: "0.8s",
    bg: "#010101",
    svg: <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
  },
  {
    name: "Facebook", top: "40%", left: "5%", delay: "1.6s",
    bg: "#1877F2",
    svg: <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  },
  {
    name: "YouTube", top: "72%", left: "65%", delay: "0.4s",
    bg: "#FF0000",
    svg: <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  },
  {
    name: "WhatsApp", top: "78%", left: "18%", delay: "1.2s",
    bg: "#25D366",
    svg: <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  },
  {
    name: "Telegram", top: "30%", left: "72%", delay: "2s",
    bg: "#229ED9",
    svg: <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  },
];

// Avatar colors for trust row
const avatarColors = ["#7C3AED", "#0050D0", "#059669", "#DC2626", "#D97706"];

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
      setResendCooldown((c) => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
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
    <div className="min-h-screen flex" style={{ background: "#0d0d0d" }}>
      {/* ══════════ LEFT PANEL — dark green/navy Goviraa style ══════════ */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0a1a0f 0%, #0f2d1a 30%, #0d2137 60%, #0a1628 100%)" }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Glow blobs */}
        <div className="absolute top-[-5%] right-[-5%] w-[50%] h-[50%] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #22c55e, transparent 70%)" }} />
        <div className="absolute bottom-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #00C2FF, transparent 70%)" }} />

        {/* Floating social icons */}
        {floatingIcons.map((icon) => (
          <div
            key={icon.name}
            className="absolute flex items-center justify-center rounded-full shadow-2xl"
            style={{
              top: icon.top, left: icon.left,
              width: 56, height: 56,
              background: icon.bg,
              animation: "float 5s ease-in-out infinite",
              animationDelay: icon.delay,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              zIndex: 10,
            }}
          >
            {icon.svg}
          </div>
        ))}

        {/* Main content */}
        <div className="relative z-20 flex flex-col justify-center flex-1 px-12 py-16">
          {/* Logo */}
          <Link href="/" className="inline-block mb-10">
            <img src={LOGO_URL} alt="Bulnix" className="h-11 w-auto rounded-xl shadow-2xl" />
          </Link>

          {/* Badge — "JOIN THE ELITE 1%" */}
          <div className="inline-flex items-center gap-2 border border-green-500/30 rounded-full px-4 py-1.5 w-fit mb-6"
            style={{ background: "rgba(34,197,94,0.1)" }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-xs font-semibold tracking-widest uppercase">Join the elite 1%</span>
          </div>

          {/* Headline — Goviraa style */}
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Elevate your<br />
            <span className="text-green-400">digital influence.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-10">
            The world's most powerful social growth engine. Verified results, premium accounts, and unparalleled reach.
          </p>

          {/* Trust row with real avatars + stars — Goviraa style */}
          <div className="border border-white/10 rounded-2xl p-4 flex items-center gap-4 mb-8"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="flex -space-x-2">
              {avatarColors.map((color, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: color }}>
                  {["A","B","C","D","E"][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                {[1,2,3,4,5].map(i => <span key={i} className="text-green-400 text-sm">★</span>)}
                <span className="text-white font-bold text-sm ml-1">4.9/5</span>
              </div>
              <div className="text-white/50 text-xs">Trusted by 60K+ influencers</div>
            </div>
          </div>

          {/* Stats row — like the Bulnix reference */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "50K+", label: "Customers" },
              { value: "99.9%", label: "Uptime" },
              { value: "<4min", label: "Delivery" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-extrabold text-green-400" style={{ fontFamily: "'Poppins', sans-serif" }}>{stat.value}</div>
                <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-20 text-center text-xs text-white/25 pb-6">© {new Date().getFullYear()} Bulnix. All rights reserved.</p>
      </div>

      {/* ══════════ RIGHT PANEL — clean white/light form ══════════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <img src={LOGO_URL} alt="Bulnix" className="h-9 w-auto rounded-lg" />
          </div>

          {/* ── Signup step ── */}
          {step === "signup" && (
            <>
              <div className="mb-7">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Sign Up</h1>
                <p className="text-gray-500 text-sm">Sign up For Open account</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-gray-700 text-sm font-medium">Full Name</Label>
                  <Input id="name" type="text" placeholder="Enter your full name" value={name}
                    onChange={(e) => setName(e.target.value)} required
                    className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-gray-700 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create password (min. 8 chars)"
                      value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 pr-10 focus:border-green-500 focus:ring-green-500/20 rounded-xl" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-gray-700 text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input id="confirm" type={showConfirm ? "text" : "password"} placeholder="Confirm your password"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                      className={"h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 pr-10 focus:border-green-500 focus:ring-green-500/20 rounded-xl" + (confirmPassword && password !== confirmPassword ? " border-red-300" : "")} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input id="agree" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-green-600" />
                  <label htmlFor="agree" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                    By creating an account you agree to our{" "}
                    <Link href="/terms" className="text-green-600 font-semibold hover:underline">Terms & Conditions</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-green-600 font-semibold hover:underline">Privacy Policy</Link>.
                  </label>
                </div>

                <Button type="submit" disabled={registerMutation.isPending || !agreed}
                  className="w-full h-12 rounded-xl text-white font-bold text-base shadow-lg"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 20px rgba(5,150,105,0.35)" }}>
                  {registerMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Sign up"}
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button type="button" onClick={handleGoogleSignup}
                  className="w-full h-12 flex items-center justify-center gap-3 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-gray-700 font-medium text-sm transition-all shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-sm text-gray-500 pt-1">
                  Already have an account?{" "}
                  <Link href="/login" className="text-green-600 font-semibold hover:underline">Sign In here</Link>
                </p>
              </form>
            </>
          )}

          {/* ── OTP step ── */}
          {step === "otp" && (
            <>
              <button onClick={() => setStep("signup")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Verify your email</h1>
                <p className="text-gray-500 text-sm">We sent a 6-digit code to <span className="text-gray-900 font-medium">{email}</span></p>
              </div>
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-gray-700 text-sm font-medium">Verification code</Label>
                  <Input id="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                    placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required
                    className="h-14 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-center text-2xl font-mono tracking-[0.5em] focus:border-green-500 focus:ring-green-500/20 rounded-xl" />
                </div>
                <Button type="submit" disabled={verifyMutation.isPending || otp.length !== 6}
                  className="w-full h-12 rounded-xl text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                  {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Create Account"}
                </Button>
                <div className="text-center">
                  <span className="text-gray-500 text-sm">Didn't receive the code? </span>
                  {resendCooldown > 0 ? (
                    <span className="text-gray-400 text-sm">Resend in {resendCooldown}s</span>
                  ) : (
                    <button type="button" onClick={() => resendMutation.mutate({ email, purpose: "register" })} disabled={resendMutation.isPending}
                      className="text-green-600 text-sm hover:underline font-medium disabled:opacity-50">
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
