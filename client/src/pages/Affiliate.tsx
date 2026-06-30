import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Users, DollarSign, ArrowDownToLine, Wallet, Share2, TrendingUp, ExternalLink, Gift, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";

export default function Affiliate() {
  const { user } = useAuth();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertAmount, setConvertAmount] = useState("");
  const [withdrawForm, setWithdrawForm] = useState({ amountUSD: "", bankName: "", accountNumber: "", accountName: "" });
  const [localReferralCode, setLocalReferralCode] = useState("");
  const utils = trpc.useUtils();

  const { data: balance, refetch: refetchBalance } = trpc.affiliate.getBalance.useQuery();
  const { data: txns } = trpc.affiliate.getTransactions.useQuery();

  // Auto-generate referral code if user doesn't have one yet
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const generateCode = trpc.auth.generateReferralCode.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data.referralCode);
      utils.auth.me.invalidate();
    },
  });
  useEffect(() => {
    if (user && !user.referralCode && !generatedCode && !generateCode.isPending) {
      generateCode.mutate();
    }
  }, [user, generatedCode]);

  const referralCode = generatedCode ?? user?.referralCode ?? "";
  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : "";

  const withdrawMutation = trpc.affiliate.requestWithdrawal.useMutation({
    onSuccess: () => { toast.success("Withdrawal request submitted. We'll process it within 24–48 hours."); setShowWithdrawDialog(false); refetchBalance(); },
    onError: (e) => toast.error(e.message),
  });
  const convertMutation = trpc.affiliate.convertToWallet.useMutation({
    onSuccess: (r) => { toast.success(`$${Number(convertAmount).toFixed(2)} moved to your wallet`); setShowConvertDialog(false); setConvertAmount(""); refetchBalance(); utils.wallet.get.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  }

  const affiliateBalance = Number(balance?.balanceUSD ?? 0);
  const totalEarned = Number(balance?.totalEarned ?? 0);
  const totalReferrals = txns?.filter((t: any) => t.type === "signup_bonus").length ?? 0;

  const steps = [
    { icon: <Share2 className="w-5 h-5 text-cyan-400" />, title: "Share your link", desc: "Share your unique referral link with friends, on social media, or your website." },
    { icon: <Users className="w-5 h-5 text-green-400" />, title: "They sign up", desc: "When someone clicks your link and creates a Bulnix account, they're tracked as your referral." },
    { icon: <DollarSign className="w-5 h-5 text-yellow-400" />, title: "You earn $0.50", desc: "You automatically receive $0.50 in your affiliate balance for every successful signup." },
    { icon: <Wallet className="w-5 h-5 text-purple-400" />, title: "Cash out", desc: "Withdraw to your bank account or move earnings to your Bulnix wallet for purchases." },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <SEO
        title="Affiliate Program | Bulnix"
        description="Earn $0.50 for every user you refer to Bulnix. Share your unique link and earn unlimited referral commissions."
        canonical="https://bulnix.com/affiliate"
      />
      <Navbar />
      <div className="container max-w-3xl py-8 space-y-8 pt-28">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs text-cyan-400 font-medium mb-2">
            <Gift className="w-3.5 h-3.5" /> Affiliate Program
          </div>
          <h1 className="text-3xl font-extrabold text-white">Earn up to <span className="text-cyan-400">$500</span> referring users</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Share your unique link. Earn $0.50 for every person who signs up. No limits. The more you share, the more you earn.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-green-400">${affiliateBalance.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Available Balance</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-cyan-400">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Total Earned</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-white">{totalReferrals}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Referrals</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-white">Your Referral Link</h2>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={referralLink || (generateCode.isPending ? "Generating your link..." : "Click to generate your link")} className="bg-slate-900 border-slate-600 text-slate-300 text-xs font-mono" />
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white shrink-0" onClick={copyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500">Share this link. When someone signs up using it, you earn $0.50 automatically.</p>
        </div>

        {/* How it works */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h2 className="font-semibold text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">{step.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-400">Program Terms</p>
          <p>• Earn $0.50 for each new user who signs up using your referral link and verifies their email.</p>
          <p>• Minimum withdrawal: $10.00. Payouts processed within 24 to 48 hours.</p>
          <p>• Self-referrals and fraudulent signups will be disqualified.</p>
          <p>• Bulnix reserves the right to modify or terminate the program at any time.</p>
        </div>

        {/* Payout Actions */}
        {affiliateBalance > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold h-12" onClick={() => setShowWithdrawDialog(true)}>
              <ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw to Bank
            </Button>
            <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 h-12 font-semibold" onClick={() => setShowConvertDialog(true)}>
              <Wallet className="w-4 h-4 mr-2" /> Move to Wallet
            </Button>
          </div>
        )}

        {/* Transaction History */}
        <div className="space-y-3">
          <h2 className="font-semibold text-white">Earnings History</h2>
          {!txns || txns.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm bg-slate-800/30 border border-slate-700/50 rounded-2xl">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No earnings yet.</p>
              <p className="text-xs mt-1">Share your link above to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {txns.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-bold text-sm ${Number(t.amountUSD) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {Number(t.amountUSD) >= 0 ? "+" : ""}${Math.abs(Number(t.amountUSD)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Withdraw to Bank</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Amount (USD) *</Label>
              <Input type="number" step="0.01" min="1" max={affiliateBalance} value={withdrawForm.amountUSD}
                onChange={e => setWithdrawForm(f => ({ ...f, amountUSD: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white" placeholder={`Max $${affiliateBalance.toFixed(2)}`} /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Bank Name *</Label>
              <Input value={withdrawForm.bankName} onChange={e => setWithdrawForm(f => ({ ...f, bankName: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" placeholder="e.g. GTBank" /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Account Number *</Label>
              <Input value={withdrawForm.accountNumber} onChange={e => setWithdrawForm(f => ({ ...f, accountNumber: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Account Name *</Label>
              <Input value={withdrawForm.accountName} onChange={e => setWithdrawForm(f => ({ ...f, accountName: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowWithdrawDialog(false)} className="text-slate-400">Cancel</Button>
            <Button className="bg-green-500 hover:bg-green-600 text-black" disabled={withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate({ amountUSD: Number(withdrawForm.amountUSD), bankName: withdrawForm.bankName, accountNumber: withdrawForm.accountNumber, accountName: withdrawForm.accountName })}>
              {withdrawMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Wallet Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>Move to Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-400">Available: <span className="text-white font-medium">${affiliateBalance.toFixed(2)}</span></p>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Amount (USD)</Label>
              <Input type="number" step="0.01" min="0.01" max={affiliateBalance} value={convertAmount}
                onChange={e => setConvertAmount(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white" placeholder={`Max $${affiliateBalance.toFixed(2)}`} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConvertDialog(false)} className="text-slate-400">Cancel</Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black" disabled={convertMutation.isPending || !convertAmount}
              onClick={() => convertMutation.mutate({ amountUSD: Number(convertAmount) })}>
              {convertMutation.isPending ? "Moving..." : "Move to Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
