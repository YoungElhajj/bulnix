import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { KeyRound, ShieldCheck, ShieldOff, Eye, EyeOff, Copy, Check, RefreshCw } from "lucide-react";

export default function AdminAccountSettings() {
  // ── Change Password state ──────────────────────────────────────────────────
  const [cpForm, setCpForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);

  const changePasswordMut = trpc.auth.changeAdminPassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCpForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (cpForm.newPassword !== cpForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    changePasswordMut.mutate({ currentPassword: cpForm.currentPassword, newPassword: cpForm.newPassword });
  }

  // ── 2FA state ─────────────────────────────────────────────────────────────
  const totpStatusQuery = trpc.auth.getTotpStatus.useQuery();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const utils = trpc.useUtils();

  const setupTotpMut = trpc.auth.setupTotp.useMutation({
    onSuccess: (data) => {
      setQrDataUrl(data.qrDataUrl);
      setTotpSecret(data.secret);
      setVerifyToken("");
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyTotpMut = trpc.auth.verifyTotp.useMutation({
    onSuccess: () => {
      toast.success("2FA enabled successfully! Your account is now protected.");
      setQrDataUrl(null);
      setTotpSecret(null);
      setVerifyToken("");
      utils.auth.getTotpStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const disableTotpMut = trpc.auth.disableTotp.useMutation({
    onSuccess: () => {
      toast.success("2FA has been disabled");
      setDisablePassword("");
      utils.auth.getTotpStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function copySecret() {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }

  const is2FAEnabled = totpStatusQuery.data?.enabled ?? false;

  return (
    <AdminLayout title="Account Settings">
      <div className="max-w-2xl space-y-6">

        {/* ── Change Password ──────────────────────────────────────────────── */}
        <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Change Password</h2>
              <p className="text-xs text-slate-500">Update your admin account password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={cpShowCurrent ? "text" : "password"}
                  value={cpForm.currentPassword}
                  onChange={e => setCpForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  required
                  className="w-full bg-[#0d1117] border border-emerald-900/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 pr-10"
                />
                <button type="button" onClick={() => setCpShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {cpShowCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={cpShowNew ? "text" : "password"}
                  value={cpForm.newPassword}
                  onChange={e => setCpForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full bg-[#0d1117] border border-emerald-900/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 pr-10"
                />
                <button type="button" onClick={() => setCpShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {cpShowNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={cpForm.confirmPassword}
                onChange={e => setCpForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat new password"
                required
                className="w-full bg-[#0d1117] border border-emerald-900/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={changePasswordMut.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {changePasswordMut.isPending ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* ── 2FA Setup ────────────────────────────────────────────────────── */}
        <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${is2FAEnabled ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-800/50 border-slate-700/50"}`}>
              {is2FAEnabled
                ? <ShieldCheck className="h-4 w-4 text-emerald-400" />
                : <ShieldOff className="h-4 w-4 text-slate-500" />
              }
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Two-Factor Authentication</h2>
              <p className="text-xs text-slate-500">
                {is2FAEnabled
                  ? "2FA is active — your account is protected with Google Authenticator"
                  : "Add an extra layer of security using Google Authenticator"}
              </p>
            </div>
            <div className={`ml-auto px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${is2FAEnabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"}`}>
              {is2FAEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>

          {/* 2FA disabled — setup flow */}
          {!is2FAEnabled && (
            <div className="space-y-4">
              {!qrDataUrl ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400 mb-4">
                    Scan a QR code with Google Authenticator, Authy, or any TOTP app to enable 2FA.
                  </p>
                  <button
                    onClick={() => setupTotpMut.mutate()}
                    disabled={setupTotpMut.isPending}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                  >
                    {setupTotpMut.isPending ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      <><ShieldCheck className="h-4 w-4" /> Set Up 2FA</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-sm text-slate-300 space-y-1">
                    <p className="font-medium text-white">Step 1: Scan the QR code</p>
                    <p className="text-slate-400 text-xs">Open Google Authenticator (or Authy) and scan the code below.</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-3 bg-white rounded-xl inline-block shadow-lg shadow-emerald-900/20">
                      <img src={qrDataUrl} alt="TOTP QR Code" className="w-44 h-44" />
                    </div>
                  </div>

                  {totpSecret && (
                    <div className="bg-[#0d1117] border border-emerald-900/30 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider font-semibold">Manual entry key</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs text-emerald-300 font-mono break-all">{totpSecret}</code>
                        <button onClick={copySecret} className="flex-shrink-0 text-slate-500 hover:text-emerald-400 transition-colors p-1">
                          {copiedSecret ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-white mb-1.5">Step 2: Enter the 6-digit code</p>
                    <p className="text-xs text-slate-400 mb-3">Enter the code from your authenticator app to confirm setup.</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verifyToken}
                        onChange={e => setVerifyToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="flex-1 bg-[#0d1117] border border-emerald-900/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 font-mono tracking-widest text-center text-lg"
                      />
                      <button
                        onClick={() => verifyTotpMut.mutate({ token: verifyToken })}
                        disabled={verifyToken.length !== 6 || verifyTotpMut.isPending}
                        className="px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        {verifyTotpMut.isPending ? "Verifying..." : "Verify & Enable"}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => { setQrDataUrl(null); setTotpSecret(null); }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Cancel setup
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2FA enabled — disable flow */}
          {is2FAEnabled && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-300">
                  Two-factor authentication is active. Your admin account requires a Google Authenticator code on every login attempt.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-white mb-1.5">Disable 2FA</p>
                <p className="text-xs text-slate-400 mb-3">Enter your current password to disable two-factor authentication.</p>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={e => setDisablePassword(e.target.value)}
                    placeholder="Your current password"
                    className="flex-1 bg-[#0d1117] border border-red-900/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                  />
                  <button
                    onClick={() => disableTotpMut.mutate({ password: disablePassword })}
                    disabled={!disablePassword || disableTotpMut.isPending}
                    className="px-5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ShieldOff className="h-4 w-4" />
                    {disableTotpMut.isPending ? "Disabling..." : "Disable"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
