import { useState } from "react";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

const PRESET_AMOUNTS = [5, 10, 20, 50, 100, 200];

const GATEWAYS = [
  { key: "paystack", label: "Paystack", desc: "Cards, Bank Transfer, USSD (NGN)", region: "Nigeria" },
  { key: "monnify", label: "Monnify", desc: "Bank Transfer, USSD (NGN)", region: "Nigeria" },
  { key: "nowpayments", label: "Crypto", desc: "BTC, ETH, USDT, and 100+ coins", region: "Global" },
];

function TxIcon({ type }: { type: string }) {
  if (type === "deposit") return <ArrowDownLeft className="h-4 w-4 text-[#22C55E]" />;
  if (type === "refund") return <RefreshCw className="h-4 w-4 text-[#00B9E9]" />;
  if (type === "spend") return <ArrowUpRight className="h-4 w-4 text-red-400" />;
  return <Wallet className="h-4 w-4 text-slate-400" />;
}

function TxStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: any; label: string }> = {
    completed: { color: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20", icon: CheckCircle, label: "Completed" },
    pending: { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Clock, label: "Pending" },
    failed: { color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle, label: "Failed" },
    reversed: { color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: AlertCircle, label: "Reversed" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${s.color}`}>
      <s.icon className="h-3 w-3" /> {s.label}
    </span>
  );
}

export default function WalletPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [amount, setAmount] = useState<string>("10");
  const [gateway, setGateway] = useState("paystack");
  const [txPage, setTxPage] = useState(1);

  const { data: wallet, refetch: refetchWallet } = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: txData, refetch: refetchTx } = trpc.wallet.transactions.useQuery({ page: txPage, limit: 15 }, { enabled: isAuthenticated });

  const initTopup = trpc.wallet.initiateTopup.useMutation({
    onSuccess: (data) => {
      toast.success(`Top-up initiated! Reference: ${data.reference}`, {
        description: "In production, you will be redirected to complete payment. For now, use Confirm to simulate.",
        duration: 8000,
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const confirmTopup = trpc.wallet.confirmTopup.useMutation({
    onSuccess: () => {
      toast.success("Wallet topped up successfully!");
      refetchWallet();
      refetchTx();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleTopup = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 3) {
      toast.error("Minimum deposit is $3.00");
      return;
    }
    initTopup.mutate({ amountUSD: val, gateway: gateway as any });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00B9E9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Wallet className="h-16 w-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to access your wallet</h2>
            <p className="text-slate-400 mb-6">Top up your balance and pay for orders instantly.</p>
            <a href={getLoginUrl()}><Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white">Sign In</Button></a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const balance = Number(wallet?.balanceUSD ?? 0);
  const totalDeposited = Number(wallet?.totalDeposited ?? 0);
  const totalSpent = Number(wallet?.totalSpent ?? 0);
  const transactions = (txData as any)?.items ?? [];
  const totalTx = (txData as any)?.total ?? 0;
  const totalPages = Math.ceil(totalTx / 15);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <Navbar />
      <div className="pt-24 pb-8 bg-gradient-to-b from-[#0F172A] to-[#0B0F19] border-b border-white/5">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/dashboard" className="hover:text-[#00B9E9]">Dashboard</Link>
            <span>/</span>
            <span className="text-white">Wallet</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">My Wallet</h1>
          <p className="text-slate-500">Manage your balance and top up to pay for orders</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Balance card + top-up form */}
          <div className="lg:col-span-1 space-y-5">
            {/* Balance Card */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00B9E9]/5 to-[#22C55E]/5 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00B9E9]/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-[#00B9E9]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Available Balance</p>
                    <p className="text-xs text-slate-600">{user?.name ?? "My Wallet"}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">${balance.toFixed(2)}</span>
                  <span className="text-slate-500 ml-2 text-sm">USD</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Total Deposited</p>
                    <p className="text-sm font-semibold text-[#22C55E]">${totalDeposited.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Total Spent</p>
                    <p className="text-sm font-semibold text-red-400">${totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-up Form */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#22C55E]" /> Add Funds
              </h3>

              {/* Preset amounts */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESET_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className={`py-2 rounded-lg text-sm font-semibold border transition-all ${
                      amount === String(preset)
                        ? "bg-[#00B9E9] border-[#00B9E9] text-white"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-[#00B9E9]/50 hover:text-white"
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-1.5 block">Custom Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <Input
                    type="number"
                    min="3"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-7 bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9]"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">Minimum deposit: $3.00</p>
              </div>

              {/* Payment method */}
              <div className="mb-5">
                <label className="text-xs text-slate-500 mb-1.5 block">Payment Method</label>
                <Select value={gateway} onValueChange={setGateway}>
                  <SelectTrigger className="bg-[#0F172A] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border-white/10">
                    {GATEWAYS.map(g => (
                      <SelectItem key={g.key} value={g.key}>
                        <div>
                          <span className="font-medium">{g.label}</span>
                          <span className="text-slate-500 ml-2 text-xs">{g.region}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-600 mt-1">
                  {GATEWAYS.find(g => g.key === gateway)?.desc}
                </p>
              </div>

              <Button
                className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-semibold"
                onClick={handleTopup}
                disabled={initTopup.isPending}
              >
                {initTopup.isPending ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</span>
                ) : (
                  <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Top Up ${parseFloat(amount || "0").toFixed(2)}</span>
                )}
              </Button>

              <p className="text-xs text-slate-600 text-center mt-3">
                Payment integration coming soon. Funds will be credited after payment confirmation.
              </p>
            </div>
          </div>

          {/* Right: Transaction history */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Transaction History</h3>
                <span className="text-xs text-slate-500">{totalTx} transactions</span>
              </div>

              {transactions.length === 0 ? (
                <div className="py-16 text-center">
                  <Wallet className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No transactions yet</p>
                  <p className="text-slate-600 text-xs mt-1">Top up your wallet to get started</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-white/5">
                    {transactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          <TxIcon type={tx.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            {tx.reference && <span className="ml-2 text-slate-600">#{tx.reference}</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${tx.type === "spend" ? "text-red-400" : "text-[#22C55E]"}`}>
                            {tx.type === "spend" ? "-" : "+"}${Number(tx.amountUSD).toFixed(2)}
                          </p>
                          <div className="mt-1">
                            <TxStatusBadge status={tx.status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                      <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 h-8 text-xs" disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}>Previous</Button>
                      <span className="text-slate-500 text-xs px-3">Page {txPage} of {totalPages}</span>
                      <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 h-8 text-xs" disabled={txPage === totalPages} onClick={() => setTxPage(p => p + 1)}>Next</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
