import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";

export default function SecureAdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const adminLogin = trpc.auth.adminLogin.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name || "Admin"}!`);
      // Small delay to let the session cookie settle
      setTimeout(() => {
        window.location.href = "/admin";
      }, 300);
    },
    onError: (err) => {
      toast.error(err.message || "Invalid credentials");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    adminLogin.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#111118] border border-[#0F3D5E] rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Access</h1>
            <p className="text-sm text-white/40 mt-1">Restricted area — authorised personnel only</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              disabled={adminLogin.isPending}
              className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-all"
            >
              {adminLogin.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Sign In to Admin Panel
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-white/20 mt-6">
            This page is not publicly listed. Unauthorised access attempts are logged.
          </p>
        </div>

        {/* Subtle back link */}
        <p className="text-center mt-4">
          <a href="/" className="text-xs text-white/20 hover:text-white/40 transition-colors">
            ← Return to Bulnix
          </a>
        </p>
      </div>
    </div>
  );
}
