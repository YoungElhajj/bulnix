import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Users, DollarSign, ArrowDownToLine, Wallet } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Affiliate() {
  const { user } = useAuth();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertAmount, setConvertAmount] = useState("");
  const [withdrawForm, setWithdrawForm] = useState({ amountUSD: "", bankName: "", accountNumber: "", accountName: "" });
  const utils = trpc.useUtils();

  const { data: balance, refetch: refetchBalance } = trpc.affiliate.getBalance.useQuery();
  const { data: txns } = trpc.affiliate.getTransactions.useQuery();

  const referralCode = user?.referralCode ?? "";
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
  const totalReferrals = 0; // tracked via transactions count

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <div className="container max-w-2xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold text-white">Affiliate Program</h1>
            <p className="text-sm text-slate-400">Earn $0.50 for every new user who signs up with your link</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">${affiliateBalance.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Available</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Total Earned</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalReferrals}</p>
            <p className="text-xs text-slate-400 mt-1">Referrals</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Your Referral Link</h2>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={referralLink || "Loading..."} className="bg-slate-900 border-slate-600 text-slate-300 text-xs font-mono" />
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white shrink-0" onClick={copyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500">Share this link. When someone signs up using it, you earn $0.50 automatically.</p>
        </div>

        {/* Actions */}
        {affiliateBalance > 0 && (
          <div className="flex gap-3">
            <Button className="flex-1 bg-green-500 hover:bg-green-600 text-black" onClick={() => setShowWithdrawDialog(true)}>
              <ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw to Bank
            </Button>
            <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black" onClick={() => setShowConvertDialog(true)}>
              <Wallet className="w-4 h-4 mr-2" /> Move to Wallet
            </Button>
          </div>
        )}

        {/* Transaction History */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white">Earnings History</h2>
          {!txns || txns.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No earnings yet. Share your link to start earning!
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
