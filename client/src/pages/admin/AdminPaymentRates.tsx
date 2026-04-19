import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { DollarSign, TrendingUp, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CURRENCY_PAIRS = [
  { from: "USD", to: "NGN", label: "USD → NGN", description: "Used by Paystack & Flutterwave for NGN charges. Set higher than market rate to earn profit on currency conversion.", defaultRate: 1600 },
  { from: "USD", to: "EUR", label: "USD → EUR", description: "Used for EUR-denominated product pricing.", defaultRate: 0.92 },
  { from: "USD", to: "GBP", label: "USD → GBP", description: "Used for GBP-denominated product pricing.", defaultRate: 0.79 },
];

export default function AdminPaymentRates() {
  const { data: rates, isLoading, refetch } = trpc.rates.list.useQuery();
  const updateRate = trpc.admin.rates.update.useMutation({
    onSuccess: () => {
      toast.success("Exchange rate updated successfully");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  function getRate(from: string, to: string): string {
    const row = (rates as any[])?.find((r: any) => r.fromCurrency === from && r.toCurrency === to);
    return row ? Number(row.rate).toFixed(from === "USD" && to === "NGN" ? 2 : 4) : "";
  }

  function getEditKey(from: string, to: string) {
    return `${from}_${to}`;
  }

  function handleSave(from: string, to: string, defaultRate: number) {
    const key = getEditKey(from, to);
    const rawVal = editValues[key] ?? getRate(from, to);
    const rate = parseFloat(rawVal);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid positive rate");
      return;
    }
    updateRate.mutate({ fromCurrency: from, toCurrency: to, rate });
  }

  // NGN profit calculator
  const ngnKey = getEditKey("USD", "NGN");
  const ngnRateStr = editValues[ngnKey] ?? getRate("USD", "NGN");
  const ngnRate = parseFloat(ngnRateStr) || 1600;
  const marketRate = 1580; // approximate market rate for display
  const markupPct = ((ngnRate - marketRate) / marketRate * 100).toFixed(1);
  const profitPer100USD = ((ngnRate - marketRate) * 100 / 100).toFixed(0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Payment Rates</h1>
          <p className="text-slate-400 mt-1">Configure currency conversion rates used by payment gateways. Set the NGN rate higher than market to earn profit on each transaction.</p>
        </div>

        {/* NGN Profit Calculator */}
        <Card className="bg-emerald-900/20 border-emerald-700/40 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-emerald-400 flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              NGN Rate Profit Calculator
            </CardTitle>
            <CardDescription className="text-slate-400">
              Approximate market rate today: <span className="text-white font-semibold">₦{marketRate.toLocaleString()}/USD</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#0d1117] rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Your Rate</div>
                <div className="text-xl font-bold text-white">₦{ngnRate.toLocaleString()}</div>
                <div className="text-xs text-slate-500">per USD</div>
              </div>
              <div className="bg-[#0d1117] rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Your Markup</div>
                <div className={`text-xl font-bold ${Number(markupPct) > 0 ? "text-emerald-400" : "text-red-400"}`}>+{markupPct}%</div>
                <div className="text-xs text-slate-500">above market</div>
              </div>
              <div className="bg-[#0d1117] rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Profit / $100</div>
                <div className="text-xl font-bold text-emerald-400">₦{Number(profitPer100USD).toLocaleString()}</div>
                <div className="text-xs text-slate-500">extra revenue</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              Example: if you set ₦1,650/USD and market is ₦1,580, you earn ₦70 extra on every $1 a customer deposits. On a $30 top-up that's ₦2,100 extra profit.
            </p>
          </CardContent>
        </Card>

        {/* Rate Cards */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-slate-400">Loading rates...</div>
          ) : (
            CURRENCY_PAIRS.map(({ from, to, label, description, defaultRate }) => {
              const key = getEditKey(from, to);
              const currentRate = getRate(from, to);
              const displayValue = editValues[key] ?? currentRate ?? String(defaultRate);
              return (
                <Card key={key} className="bg-[#0d1117] border-emerald-900/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        {label}
                      </CardTitle>
                      {currentRate && (
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                          Current: {currentRate}
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-slate-400 text-xs">{description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label className="text-slate-300 text-sm mb-1.5 block">
                          Rate ({to} per {from})
                        </Label>
                        <Input
                          type="number"
                          step={to === "NGN" ? "1" : "0.0001"}
                          min="0"
                          value={displayValue}
                          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                          className="bg-[#161b22] border-emerald-900/40 text-white"
                          placeholder={String(defaultRate)}
                        />
                      </div>
                      <Button
                        onClick={() => handleSave(from, to, defaultRate)}
                        disabled={updateRate.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {updateRate.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                    {to === "NGN" && displayValue && (
                      <p className="text-xs text-slate-500 mt-2">
                        $3 deposit = ₦{(parseFloat(displayValue) * 3).toLocaleString(undefined, { maximumFractionDigits: 0 })} &nbsp;|&nbsp;
                        $30 deposit = ₦{(parseFloat(displayValue) * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })} &nbsp;|&nbsp;
                        $100 deposit = ₦{(parseFloat(displayValue) * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
