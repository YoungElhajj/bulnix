import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, ArrowDownToLine, Gift, TrendingUp, ShoppingBag, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";

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
      <SEO
        title="Reward Points | Bulnix"
        description="Earn reward points on every purchase at Bulnix. Redeem points for wallet credit and save on your next order."
        canonical="https://bulnix.com/rewards"
      />
      <Navbar />
      <div className="container max-w-3xl py-8 space-y-8 pt-28">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 text-xs text-yellow-400 font-medium mb-2">
            <Star className="w-3.5 h-3.5" /> Reward Points
          </div>
          <h1 className="text-3xl font-extrabold text-white">Earn points on every <span className="text-yellow-400">purchase</span></h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Shop on Bulnix and earn reward points automatically. Redeem them for wallet credit anytime.</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-yellow-500/15 to-amber-500/5 border border-yellow-500/30 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                <Star className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Your Points Balance</p>
                <p className="text-4xl font-black text-yellow-400">{totalPoints.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5">pts ≈ <span className="text-white font-medium">${walletValue}</span> wallet value</p>
              </div>
            </div>
            {totalPoints >= 100 && (
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Ready to redeem</p>
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5 text-green-400 text-sm font-semibold">
                  Redeem below ↓
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How to Earn */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-white">Loyalty Tiers & Cashback</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { tier: "Bronze", rate: "0%", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", desc: "New members" },
              { tier: "Silver", rate: "0%", color: "text-slate-300", bg: "bg-slate-600/20 border-slate-500/20", desc: "$50+ spent" },
              { tier: "Gold", rate: "0.5%", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", desc: "$200+ spent" },
              { tier: "Platinum", rate: "0.75%", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", desc: "$500+ spent" },
              { tier: "Diamond", rate: "1%", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", desc: "$1,000+ spent" },
            ].map(t => (
              <div key={t.tier} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${t.bg}`}>
                <div>
                  <span className={`font-semibold text-sm ${t.color}`}>{t.tier}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </div>
                <span className={`font-bold text-sm ${t.color}`}>{t.rate} cashback</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 bg-slate-700/30 rounded-lg p-3">
            <ShoppingBag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">Points are awarded automatically after each completed purchase. <strong className="text-white">100 points = $1.00</strong> wallet credit.</p>
          </div>
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
        <div className="space-y-3">
          <h2 className="font-semibold text-white">Points History</h2>
          {!txns || txns.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm bg-slate-800/30 border border-slate-700/50 rounded-2xl">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No points earned yet.</p>
              <p className="text-xs mt-1">Start shopping to earn rewards!</p>
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
