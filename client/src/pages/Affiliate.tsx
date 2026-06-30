import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Users, DollarSign, ArrowDownToLine, Wallet, Share2, TrendingUp, Gift, ArrowLeft, Sparkles, CheckCircle2, Clock } from "lucide-react";
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
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: balance, refetch: refetchBalance } = trpc.affiliate.getBalance.useQuery();
  const { data: txns } = trpc.affiliate.getTransactions.useQuery();

  const generateCode = trpc.auth.generateReferralCode.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data.referralCode);
      utils.auth.me.invalidate();
      toast.success("Your referral link has been generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  // Use existing code from user profile OR newly generated code
  const referralCode = generatedCode ?? user?.referralCode ?? "";
  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : "";
  const hasLink = !!referralCode;

  const withdrawMutation = trpc.affiliate.requestWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal request submitted. We'll process it within 24 to 48 hours.");
      setShowWithdrawDialog(false);
      refetchBalance();
    },
    onError: (e) => toast.error(e.message),
  });

  const convertMutation = trpc.affiliate.convertToWallet.useMutation({
    onSuccess: () => {
      toast.success(`$${Number(convertAmount).toFixed(2)} moved to your wallet`);
      setShowConvertDialog(false);
      setConvertAmount("");
      refetchBalance();
      utils.wallet.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  }

  const affiliateBalance = Number(balance?.balanceUSD ?? 0);
  const totalEarned = Number(balance?.totalEarned ?? 0);
  const totalReferrals = txns?.filter((t: any) => t.type === "signup_bonus").length ?? 0;

  const steps = [
    {
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      title: "Generate your link",
      desc: "Click the button below to get your unique referral link. You only need to do this once.",
    },
    {
      icon: <Share2 className="w-5 h-5 text-green-400" />,
      title: "Share it",
      desc: "Share your link on social media, WhatsApp, Telegram, or with friends who need digital accounts.",
    },
    {
      icon: <Users className="w-5 h-5 text-yellow-400" />,
      title: "They sign up and deposit",
      desc: "When someone signs up using your link and makes their first deposit, you earn $0.50 automatically.",
    },
    {
      icon: <Wallet className="w-5 h-5 text-purple-400" />,
      title: "Cash out",
      desc: "Withdraw to your bank account or move your earnings to your Bulnix wallet for purchases.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <SEO
        title="Affiliate Program | Bulnix"
        description="Earn $0.50 for every user you refer to Bulnix who makes a deposit. Share your unique link and earn unlimited referral commissions."
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
          <h1 className="text-3xl font-extrabold text-white">
            Earn <span className="text-cyan-400">$0.50</span> per referral
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Share your unique link. Earn $0.50 when each person you refer makes their first deposit. No limits.
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

        {/* Referral Link Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-white">Your Referral Link</h2>
          </div>

          {!hasLink ? (
            /* No link yet — show generate button */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">You don't have a referral link yet</p>
                <p className="text-slate-400 text-sm">Click the button below to generate your unique referral link.</p>
              </div>
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-[#0F3D5E] font-bold px-8 h-11"
                onClick={() => generateCode.mutate()}
                disabled={generateCode.isPending}
              >
                {generateCode.isPending ? (
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Generating...</span>
                ) : (
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate Referral Link</span>
                )}
              </Button>
            </div>
          ) : (
            /* Link exists — show it */
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralLink}
                  className="bg-slate-900 border-slate-600 text-slate-300 text-xs font-mono"
                />
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:text-white shrink-0"
                  onClick={copyLink}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-start gap-2 bg-green-500/5 border border-green-500/20 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400">
                  Your link is active. Share it anywhere. You earn <span className="text-green-400 font-medium">$0.50</span> when each referred user makes their first deposit.
                </p>
              </div>
            </div>
          )}
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
                <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                  {step.icon}
                </div>
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
          <p>Earn $0.50 for each new user who signs up using your referral link and makes their first deposit.</p>
          <p>Minimum withdrawal: $10.00. Payouts processed within 24 to 48 hours.</p>
          <p>Self-referrals and fraudulent signups will be disqualified.</p>
          <p>Bulnix reserves the right to modify or terminate the program at any time.</p>
        </div>

        {/* Payout Actions */}
        {affiliateBalance > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              className="bg-green-500 hover:bg-green-600 text-black font-semibold h-12"
              onClick={() => setShowWithdrawDialog(true)}
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw to Bank
            </Button>
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 h-12 font-semibold"
              onClick={() => setShowConvertDialog(true)}
            >
              <Wallet className="w-4 h-4 mr-2" /> Move to Wallet
            </Button>
          </div>
        )}

        {/* Transaction History */}
        <div className="space-y-3">
          <h2 className="font-semibold text-white">Earnings History</h2>
          {!txns || txns.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm bg-slate-800/30 border border-slate-700/50 rounded-2xl">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No earnings yet.</p>
              <p className="text-xs mt-1">Share your link to start earning!</p>
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
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Amount (USD) *</Label>
              <Input
                type="number" step="0.01" min="1" max={affiliateBalance}
                value={withdrawForm.amountUSD}
                onChange={e => setWithdrawForm(f => ({ ...f, amountUSD: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder={`Max $${affiliateBalance.toFixed(2)}`}
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Bank Name *</Label>
              <Input value={withdrawForm.bankName} onChange={e => setWithdrawForm(f => ({ ...f, bankName: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" placeholder="e.g. GTBank" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Account Number *</Label>
              <Input value={withdrawForm.accountNumber} onChange={e => setWithdrawForm(f => ({ ...f, accountNumber: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Account Name *</Label>
              <Input value={withdrawForm.accountName} onChange={e => setWithdrawForm(f => ({ ...f, accountName: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowWithdrawDialog(false)} className="text-slate-400">Cancel</Button>
            <Button
              className="bg-green-500 hover:bg-green-600 text-black"
              disabled={withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate({
                amountUSD: Number(withdrawForm.amountUSD),
                bankName: withdrawForm.bankName,
                accountNumber: withdrawForm.accountNumber,
                accountName: withdrawForm.accountName,
              })}
            >
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
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Amount (USD)</Label>
              <Input
                type="number" step="0.01" min="0.01" max={affiliateBalance}
                value={convertAmount}
                onChange={e => setConvertAmount(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder={`Max $${affiliateBalance.toFixed(2)}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConvertDialog(false)} className="text-slate-400">Cancel</Button>
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-black"
              disabled={convertMutation.isPending || !convertAmount}
              onClick={() => convertMutation.mutate({ amountUSD: Number(convertAmount) })}
            >
              {convertMutation.isPending ? "Moving..." : "Move to Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
