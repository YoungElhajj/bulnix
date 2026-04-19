import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Step = "form" | "otp";

// Inline SVG illustration — person interacting with a large form/phone
function SignupIllustration() {
  return (
    <svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
      {/* Background blob */}
      <ellipse cx="240" cy="300" rx="200" ry="140" fill="#dbeafe" opacity="0.6" />
      {/* Phone/form card */}
      <rect x="130" y="80" width="200" height="280" rx="20" fill="white" stroke="#bfdbfe" strokeWidth="2" />
      <rect x="148" y="110" width="164" height="14" rx="7" fill="#93c5fd" />
      <rect x="148" y="136" width="120" height="10" rx="5" fill="#bfdbfe" />
      <rect x="148" y="162" width="164" height="14" rx="7" fill="#93c5fd" />
      <rect x="148" y="188" width="100" height="10" rx="5" fill="#bfdbfe" />
      <rect x="148" y="214" width="164" height="14" rx="7" fill="#93c5fd" />
      <rect x="148" y="240" width="80" height="10" rx="5" fill="#bfdbfe" />
      {/* OTP dots */}
      <circle cx="162" cy="278" r="8" fill="#3b82f6" />
      <circle cx="186" cy="278" r="8" fill="#3b82f6" />
      <circle cx="210" cy="278" r="8" fill="#3b82f6" />
      <circle cx="234" cy="278" r="8" fill="#bfdbfe" />
      {/* Person body */}
      <ellipse cx="370" cy="400" rx="40" ry="12" fill="#bfdbfe" opacity="0.5" />
      {/* Legs */}
      <rect x="354" y="360" width="14" height="44" rx="7" fill="#1e3a5f" />
      <rect x="374" y="360" width="14" height="44" rx="7" fill="#1e3a5f" />
      {/* Shoes */}
      <ellipse cx="361" cy="404" rx="12" ry="6" fill="#0f172a" />
      <ellipse cx="381" cy="404" rx="12" ry="6" fill="#0f172a" />
      {/* Torso */}
      <rect x="345" y="280" width="52" height="84" rx="10" fill="#374151" />
      {/* Arm reaching to phone */}
      <path d="M345 310 Q290 290 270 290" stroke="#f9a8d4" strokeWidth="12" strokeLinecap="round" />
      {/* Hand */}
      <circle cx="268" cy="290" r="10" fill="#f9a8d4" />
      {/* Other arm */}
      <path d="M397 310 Q420 330 415 350" stroke="#f9a8d4" strokeWidth="12" strokeLinecap="round" />
      {/* Head */}
      <circle cx="371" cy="258" r="28" fill="#f9a8d4" />
      {/* Hair */}
      <path d="M343 250 Q350 228 371 230 Q392 228 399 250" fill="#1e3a5f" />
      {/* Eyes */}
      <circle cx="362" cy="258" r="3" fill="#1e3a5f" />
      <circle cx="380" cy="258" r="3" fill="#1e3a5f" />
      {/* Smile */}
      <path d="M362 270 Q371 278 380 270" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Floating decorations */}
      <circle cx="80" cy="160" r="12" fill="#bfdbfe" opacity="0.7" />
      <circle cx="60" cy="320" r="8" fill="#93c5fd" opacity="0.5" />
      <circle cx="430" cy="180" r="10" fill="#bfdbfe" opacity="0.6" />
      <circle cx="450" cy="340" r="6" fill="#93c5fd" opacity="0.4" />
      {/* Dollar sign floating */}
      <rect x="68" y="380" width="36" height="36" rx="8" fill="#d1fae5" />
      <text x="86" y="403" textAnchor="middle" fill="#059669" fontSize="18" fontWeight="bold">$</text>
    </svg>
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
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms & Conditions to continue.");
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ email, otp, purpose: "register" });
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel — illustration ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#eff6ff] p-12 relative overflow-hidden">
        {/* Logo */}
        <Link href="/" className="absolute top-8 left-8">
          <img src={`${import.meta.env.VITE_APP_LOGO}`} alt="Bulnix" className="h-10 w-auto" />
        </Link>

        <div className="flex flex-col items-center text-center mt-12">
          <SignupIllustration />
          <h2 className="text-2xl font-bold text-slate-800 mt-6">
            Premium digital accounts,<br />
            <span className="text-[#3b82f6]">delivered instantly.</span>
          </h2>
          <p className="text-slate-500 text-sm mt-3 max-w-xs leading-relaxed">
            Join thousands of customers who trust Bulnix for bulk digital account purchases. Secure payments, instant delivery.
          </p>
          {/* Trust badges */}
          <div className="flex gap-6 mt-8">
            {[{ v: "50K+", l: "Customers" }, { v: "99.9%", l: "Uptime" }, { v: "<4min", l: "Delivery" }].map((s) => (
              <div key={s.v} className="text-center">
                <div className="text-lg font-bold text-[#3b82f6]">{s.v}</div>
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

          {step === "form" ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Sign Up</h1>
                <p className="text-slate-500 mt-1 text-sm">It's not late, let's start your journey now</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-700 text-sm font-medium">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className="h-12 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20 rounded-lg"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20 rounded-lg"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-12 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-slate-700 text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className={`h-12 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 pr-10 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20 rounded-lg ${
                        confirmPassword && confirmPassword !== password ? "border-red-400 focus:border-red-400" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-3 pt-1">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(v) => setAgreedToTerms(Boolean(v))}
                    className="mt-0.5 border-slate-300 data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6]"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600 leading-snug cursor-pointer">
                    I agree with the{" "}
                    <Link href="/terms" className="text-[#3b82f6] font-semibold hover:underline">Terms & Conditions</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-[#3b82f6] font-semibold hover:underline">Privacy Policy</Link>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={registerMutation.isPending || (confirmPassword.length > 0 && confirmPassword !== password)}
                  className="w-full h-12 bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] hover:from-[#2563eb] hover:to-[#0891b2] text-white font-semibold text-base rounded-lg shadow-md shadow-blue-200 mt-2"
                >
                  {registerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                  ) : "Sign Up"}
                </Button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#3b82f6] font-semibold hover:underline">Sign In here</Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("form")}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#3b82f6]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Verify your email</h1>
                <p className="text-slate-500 mt-1 text-sm">
                  We sent a 6-digit code to <span className="text-slate-800 font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-slate-700 text-sm font-medium">Verification code</Label>
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
                    className="h-14 border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#3b82f6] focus:ring-[#3b82f6]/20 rounded-lg"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={verifyMutation.isPending || otp.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] hover:from-[#2563eb] hover:to-[#0891b2] text-white font-semibold rounded-lg shadow-md shadow-blue-200"
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
                      className="text-[#3b82f6] text-sm hover:underline font-medium disabled:opacity-50"
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
