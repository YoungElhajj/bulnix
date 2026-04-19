import { useState, useEffect } from "react";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Bitcoin, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";

const PRESET_AMOUNTS = [5, 10, 20, 50, 100, 200];

const GATEWAYS = [
  {
    key: "paystack",
    label: "Paystack",
    desc: "Cards, Bank Transfer, USSD",
    region: "Nigeria / Africa",
    icon: CreditCard,
    color: "text-[#0050D0]",
    bg: "bg-[#EEF4FF]",
    border: "border-[#0050D0]/30",
    activeBg: "bg-[#EEF4FF]",
    activeBorder: "border-[#0050D0]",
  },
  {
    key: "flutterwave",
    label: "Flutterwave",
    desc: "Cards, Bank Transfer, Mobile Money",
    region: "Africa / Global",
    icon: Zap,
    color: "text-[#F5A623]",
    bg: "bg-[#FFF8EC]",
    border: "border-[#F5A623]/30",
    activeBg: "bg-[#FFF8EC]",
    activeBorder: "border-[#F5A623]",
  },
  {
    key: "nowpayments",
    label: "Crypto",
    desc: "BTC, ETH, USDT, and 100+ coins",
    region: "Global",
    icon: Bitcoin,
    color: "text-[#F7931A]",
    bg: "bg-[#FFF5E6]",
    border: "border-[#F7931A]/30",
    activeBg: "bg-[#FFF5E6]",
    activeBorder: "border-[#F7931A]",
  },
];

function TxIcon({ type }: { type: string }) {
  if (type === "deposit") return <ArrowDownLeft className="h-4 w-4 text-[#0050D0]" />;
  if (type === "refund") return <RefreshCw className="h-4 w-4 text-[#0050D0]" />;
  if (type === "spend") return <ArrowUpRight className="h-4 w-4 text-red-400" />;
  return <Wallet className="h-4 w-4 text-[#4A6080]" />;
}

function TxStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: any; label: string }> = {
    completed: { color: "text-[#0050D0] bg-[#EEF4FF] border-[#0050D0]/20", icon: CheckCircle, label: "Completed" },
    pending: { color: "text-yellow-600 bg-yellow-50 border-yellow-300/40", icon: Clock, label: "Pending" },
    failed: { color: "text-red-500 bg-red-50 border-red-300/40", icon: XCircle, label: "Failed" },
    reversed: { color: "text-[#4A6080] bg-slate-100 border-slate-300/40", icon: AlertCircle, label: "Reversed" },
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
  const [, setLocation] = useLocation();

  const { data: wallet, refetch: refetchWallet } = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: txData, refetch: refetchTx } = trpc.wallet.transactions.useQuery({ page: txPage, limit: 15 }, { enabled: isAuthenticated });

  const initTopup = trpc.wallet.initiateTopup.useMutation({
    onSuccess: (data) => {
      const paymentUrl = (data as any).paymentUrl;
      if (paymentUrl && !paymentUrl.startsWith("#")) {
        toast.success("Redirecting to payment page...", { duration: 3000 });
        // Open in same tab for redirect-based flows
        window.location.href = paymentUrl;
      } else {
        toast.success(`Top-up initiated! Reference: ${data.reference}`, {
          description: "You will be redirected to complete payment.",
          duration: 8000,
        });
      }
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

  // Handle redirect back from payment gateway
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topupRef = params.get("topup_ref");
    const status = params.get("status");
    if (topupRef && status === "success") {
      confirmTopup.mutate({ reference: topupRef });
      // Clean up URL
      window.history.replaceState({}, "", "/wallet");
    } else if (topupRef && status && status !== "success") {
      toast.error("Payment was not completed. Please try again.");
      window.history.replaceState({}, "", "/wallet");
    }
  }, []);

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
      <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Wallet className="h-16 w-16 text-[#4A6080] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#0D2137] mb-2">Sign in to access your wallet</h2>
            <p className="text-[#4A6080] mb-6">Top up your balance and pay for orders instantly.</p>
            <a href="/login"><Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white">Sign In</Button></a>
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
  const selectedGateway = GATEWAYS.find(g => g.key === gateway) ?? GATEWAYS[0];

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]">
      <Navbar />
      <div className="pt-24 pb-8 bg-gradient-to-b from-[#0A2540] to-[#061A2B] border-b border-[#D8E8F5]">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/dashboard" className="hover:text-[#00C2FF]">Dashboard</Link>
            <span>/</span>
            <span className="text-white/80">Wallet</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">My Wallet</h1>
          <p className="text-white/60">Manage your balance and top up to pay for orders</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Balance card + top-up form */}
          <div className="lg:col-span-1 space-y-5">
            {/* Balance Card */}
            <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00C2FF]/5 to-[#0050D0]/5 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-[#0050D0]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#4A6080]">Available Balance</p>
                    <p className="text-xs text-[#4A6080]">{user?.name ?? "My Wallet"}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-[#0D2137]">${balance.toFixed(2)}</span>
                  <span className="text-[#4A6080] ml-2 text-sm">USD</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#D8E8F5]">
                  <div>
                    <p className="text-xs text-[#4A6080] mb-0.5">Total Deposited</p>
                    <p className="text-sm font-semibold text-[#0050D0]">${totalDeposited.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4A6080] mb-0.5">Total Spent</p>
                    <p className="text-sm font-semibold text-red-400">${totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-up Form */}
            <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-2xl p-6">
              <h3 className="text-base font-bold text-[#0D2137] mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#0050D0]" /> Add Funds
              </h3>

              {/* Preset amounts */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESET_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className={`py-2 rounded-lg text-sm font-semibold border transition-all ${
                      amount === String(preset)
                        ? "bg-[#0050D0] border-[#0050D0] text-white"
                        : "bg-[#F5F9FF] border-[#D8E8F5] text-[#4A6080] hover:border-[#0050D0]/50 hover:text-[#0D2137]"
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="mb-4">
                <label className="text-xs text-[#4A6080] mb-1.5 block">Custom Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6080] font-semibold">$</span>
                  <Input
                    type="number"
                    min="3"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-7 bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0]"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-[#4A6080] mt-1">Minimum deposit: $3.00</p>
              </div>

              {/* Payment method selector */}
              <div className="mb-5">
                <label className="text-xs text-[#4A6080] mb-2 block">Payment Method</label>
                <div className="space-y-2">
                  {GATEWAYS.map(g => {
                    const GIcon = g.icon;
                    const isSelected = gateway === g.key;
                    return (
                      <button
                        key={g.key}
                        onClick={() => setGateway(g.key)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `${g.activeBg} ${g.activeBorder}`
                            : "bg-[#F5F9FF] border-[#D8E8F5] hover:border-[#0050D0]/30"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${g.bg}`}>
                          <GIcon className={`h-5 w-5 ${g.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isSelected ? "text-[#0D2137]" : "text-[#4A6080]"}`}>{g.label}</p>
                          <p className="text-xs text-[#4A6080] truncate">{g.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? `${g.activeBorder} ${g.color}` : "border-[#D8E8F5]"}`}>
                          {isSelected && <div className={`w-2 h-2 rounded-full ${g.color.replace("text-", "bg-")}`} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[#4A6080] mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4A6080]" />
                  {selectedGateway.region}
                </p>
              </div>

              <Button
                className="w-full bg-[#0050D0] hover:bg-[#0040b0] text-white font-semibold"
                onClick={handleTopup}
                disabled={initTopup.isPending}
              >
                {initTopup.isPending ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Redirecting...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Pay ${parseFloat(amount || "0").toFixed(2)} via {selectedGateway.label}
                  </span>
                )}
              </Button>

              <p className="text-xs text-[#4A6080] text-center mt-3">
                You will be redirected to {selectedGateway.label} to complete your payment securely.
              </p>
            </div>
          </div>

          {/* Right: Transaction history */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#D8E8F5] flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0D2137]">Transaction History</h3>
                <span className="text-xs text-[#4A6080]">{totalTx} transactions</span>
              </div>

              {transactions.length === 0 ? (
                <div className="py-16 text-center">
                  <Wallet className="h-12 w-12 text-[#4A6080] mx-auto mb-3" />
                  <p className="text-[#4A6080] text-sm">No transactions yet</p>
                  <p className="text-[#4A6080] text-xs mt-1">Top up your wallet to get started</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-[#F0F5FF]">
                    {transactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-[#F5F9FF]/50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-[#F5F9FF] flex items-center justify-center shrink-0">
                          <TxIcon type={tx.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0D2137] truncate">{tx.description}</p>
                          <p className="text-xs text-[#4A6080] mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            {tx.reference && <span className="ml-2 text-[#4A6080]">#{tx.reference}</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${tx.type === "spend" ? "text-red-400" : "text-[#0050D0]"}`}>
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
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-[#D8E8F5]">
                      <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF] h-8 text-xs" disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}>Previous</Button>
                      <span className="text-[#4A6080] text-xs px-3">Page {txPage} of {totalPages}</span>
                      <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF] h-8 text-xs" disabled={txPage === totalPages} onClick={() => setTxPage(p => p + 1)}>Next</Button>
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
