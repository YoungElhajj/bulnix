import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, ArrowDownToLine, Gift, TrendingUp } from "lucide-react";
import BackButton from "@/components/BackButton";

const POINT_VALUE_USD = 0.01; // 1 point = $0.01

export default function Rewards() {
  const [redeemAmount, setRedeemAmount] = useState("");
  const { data: points, refetch: refetchPoints } = trpc.rewards.getPoints.useQuery();
  const { data: txns } = trpc.rewards.getTransactions.useQuery();
  const utils = trpc.useUtils();

  const redeemMutation = trpc.rewards.redeem.useMutation({
    onSuccess: (r) => {
      toast.success(`Redeemed ${redeemPoints} points → $${r.amountUSD.toFixed(2)} added to wallet`);
      setRedeemAmount("");
      refetchPoints();
      utils.wallet.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalPoints = points?.points ?? 0;
  const walletValue = (totalPoints * POINT_VALUE_USD).toFixed(2);
  const redeemPoints = Math.max(0, Math.min(Number(redeemAmount) || 0, totalPoints));
  const redeemValue = (redeemPoints * POINT_VALUE_USD).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <div className="container max-w-2xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold text-white">Reward Points</h1>
            <p className="text-sm text-slate-400">Earn points on every purchase and redeem for wallet credit</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Your Points Balance</p>
              <p className="text-3xl font-bold text-yellow-400">{totalPoints.toLocaleString()} pts</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">≈ <span className="text-white font-medium">${walletValue}</span> wallet value</p>
        </div>

        {/* How to Earn */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">How to Earn Points</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { tier: "Bronze", rate: "0%", color: "text-orange-400" },
              { tier: "Silver", rate: "0%", color: "text-slate-300" },
              { tier: "Gold", rate: "0.5%", color: "text-yellow-400" },
              { tier: "Platinum", rate: "0.75%", color: "text-cyan-400" },
              { tier: "Diamond", rate: "1%", color: "text-purple-400" },
            ].map(t => (
              <div key={t.tier} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                <span className={`font-medium ${t.color}`}>{t.tier}</span>
                <span className="text-slate-300">{t.rate} cashback</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Points are awarded automatically after each completed purchase. 100 points = $1.00</p>
        </div>

        {/* Redeem */}
        {totalPoints > 0 && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-semibold text-white">Redeem Points</h2>
            </div>
            <div className="flex gap-2">
              <Input
                type="number" min={1} max={totalPoints} value={redeemAmount}
                onChange={e => setRedeemAmount(e.target.value)}
                placeholder={`Max ${totalPoints} pts`}
                className="bg-slate-800 border-slate-600 text-white"
              />
              <Button className="bg-green-500 hover:bg-green-600 text-black shrink-0" disabled={redeemMutation.isPending || redeemPoints < 1}
                onClick={() => redeemMutation.mutate({ points: redeemPoints })}>
                <ArrowDownToLine className="w-4 h-4 mr-1" />
                {redeemMutation.isPending ? "..." : `Redeem $${redeemValue}`}
              </Button>
            </div>
            <p className="text-xs text-slate-500">Minimum 100 points to redeem. Points are converted to wallet credit instantly.</p>
          </div>
        )}

        {/* Transaction History */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white">Points History</h2>
          {!txns || txns.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No points earned yet. Start shopping to earn rewards!
            </div>
          ) : (
            <div className="space-y-2">
              {txns.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-bold text-sm ${t.points > 0 ? "text-yellow-400" : "text-red-400"}`}>
                    {t.points > 0 ? "+" : ""}{t.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
