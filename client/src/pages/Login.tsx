import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/bulnix-logo_f53aba21.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showPass, setShowPass] = useState(false);

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00B9E9]/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/"><img src={LOGO_URL} alt="Bulnix" className="h-10 w-auto mx-auto mb-4" /></Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your Bulnix account</p>
        </div>
        <div className="glass-card rounded-2xl p-8">
          <div className="space-y-5">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Email address</Label>
              <Input type="email" placeholder="you@example.com" className="bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] h-11" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-slate-300 text-sm">Password</Label>
                <Link href="/forgot-password" className="text-xs text-[#00B9E9] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input type={showPass ? "text" : "password"} placeholder="••••••••" className="bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] h-11 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full h-11 bg-[#00B9E9] hover:bg-[#00a8d4] text-white font-semibold" style={{ boxShadow: "0 0 20px rgba(0,185,233,0.3)" }}
              onClick={() => { window.location.href = getLoginUrl(); }}>
              <LogIn className="h-4 w-4 mr-2" /> Sign In
            </Button>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#16213a] px-3 text-slate-500">or continue with</span></div>
          </div>
          <Button variant="outline" className="w-full h-11 border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
            onClick={() => { window.location.href = getLoginUrl(); }}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/></svg>
            Continue with Manus
          </Button>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#00B9E9] hover:underline font-medium">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
