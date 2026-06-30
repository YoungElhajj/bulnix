import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { Package, CheckCircle, Clock, ArrowLeft, Copy, RefreshCw, AlertCircle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Known credential field labels for common platforms
const FIELD_LABELS: Record<string, string> = {
  login: "Username / Login",
  username: "Username",
  email: "Email",
  password: "Password",
  email_password: "Email Password",
  "2fa": "2FA Key",
  "2fa_key": "2FA Key",
  totp: "2FA Key",
  backup_codes: "Backup Codes",
  token: "Token",
  id: "Account ID",
  facebook_id: "Facebook ID",
  data: "Data",
  credential: "Credential",
  phone: "Phone Number",
  recovery_email: "Recovery Email",
};

function labelKey(key: string): string {
  return FIELD_LABELS[key.toLowerCase()] ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Parse a colon-separated string like "email:pass:2fa" into labeled fields
function parseColonString(line: string): Record<string, string> {
  const parts = line.split(":").map(p => p.trim());
  if (parts.length === 1) return { credential: parts[0] };
  const fieldMaps: Record<number, string[]> = {
    2: ["login", "password"],
    3: ["email", "password", "email_password"],
    4: ["email", "password", "email_password", "2fa"],
    5: ["login", "password", "email", "email_password", "2fa"],
    6: ["login", "password", "email", "email_password", "2fa", "id"],
  };
  const keys = fieldMaps[parts.length] ?? parts.map((_, i) => `field_${i + 1}`);
  const result: Record<string, string> = {};
  parts.forEach((val, i) => { if (val) result[keys[i] ?? `field_${i + 1}`] = val; });
  return result;
}

function parseDeliveryData(raw: string | null | undefined): Array<Record<string, string>> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((item) => {
      if (typeof item === "string") {
        return item.includes(":") ? parseColonString(item) : { credential: item };
      }
      // AccsZone account object: { login, password, email, data, ... }
      const acc = item as Record<string, unknown>;
      const result: Record<string, string> = {};
      for (const [k, v] of Object.entries(acc)) {
        if (v !== null && v !== undefined && v !== "") result[k] = String(v);
      }
      return result;
    });
    if (typeof parsed === "object" && parsed !== null) return [parsed as Record<string, string>];
    return [{ credential: String(parsed) }];
  } catch {
    return raw.split("\n").filter(Boolean).map((line) => {
      const trimmed = line.trim();
      return trimmed.includes(":") ? parseColonString(trimmed) : { credential: trimmed };
    });
  }
}
function CredentialCard({ account, index, onCopy }: { account: Record<string, string>; index: number; onCopy: (text: string) => void }) {
  const entries = Object.entries(account).filter(([, v]) => v);
  const fullText = entries.map(([k, v]) => `${labelKey(k)}: ${v}`).join("\n");
  return (
    <div className="p-4 bg-[#F0F8FF] border border-[#0050D0]/20 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-[#0050D0]" />
          <span className="text-xs font-semibold text-[#0050D0]">Account #{index + 1}</span>
        </div>
        <button
          onClick={() => onCopy(fullText)}
          className="flex items-center gap-1 text-xs text-[#4A6080] hover:text-[#0050D0] transition-colors px-2 py-1 rounded hover:bg-[#E0F0FF]"
        >
          <Copy className="h-3 w-3" /> Copy All
        </button>
      </div>
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2.5 border border-[#D8E8F5]">
            <span className="text-xs text-[#4A6080] font-semibold min-w-[120px] shrink-0 mt-0.5">{labelKey(key)}</span>
            <span className="font-mono text-sm text-[#0D2137] flex-1 break-all leading-snug">{value}</span>
            <button
              onClick={() => onCopy(value)}
              className="flex-shrink-0 p-1.5 rounded hover:bg-[#F0F8FF] text-[#4A6080] hover:text-[#0050D0] transition-colors mt-0.5"
              title={`Copy ${labelKey(key)}`}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const orderId = parseInt(params.id ?? "0");
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const { data: order, isLoading, refetch: refetchOrder } = trpc.orders.getById.useQuery(
    { id: orderId },
    {
      enabled: isAuthenticated && !!orderId,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchInterval: pollingEnabled ? 5000 : false,
    }
  );

  const { data: delivery, refetch: refetchDelivery } = trpc.orders.getDelivery.useQuery(
    { orderId },
    {
      enabled: isAuthenticated && !!orderId,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchInterval: pollingEnabled ? 5000 : false,
    }
  );

  const o = order as any;
  const deliveries = (delivery as any[]) ?? [];

  // Stop polling once order is in a terminal state
  useEffect(() => {
    if (o?.status && ["fulfilled", "failed", "partial", "completed"].includes(o.status)) {
      setPollingEnabled(false);
    }
  }, [o?.status]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleManualRefresh = () => {
    refetchOrder();
    refetchDelivery();
    toast.info("Refreshing order status...");
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137] flex items-center justify-center">
      <div className="text-center">
        <Package className="h-12 w-12 text-[#4A6080] mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Order not found</h2>
        <Link href="/orders"><Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white mt-3">Back to Orders</Button></Link>
      </div>
    </div>
  );

  const statusConfig: Record<string, { badge: string; label: string }> = {
    pending_payment: { badge: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Awaiting Payment" },
    pending: { badge: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Pending" },
    processing: { badge: "bg-blue-100 text-blue-700 border-blue-200", label: "Processing" },
    fulfilled: { badge: "bg-green-100 text-green-700 border-green-200", label: "Fulfilled" },
    completed: { badge: "bg-green-100 text-green-700 border-green-200", label: "Completed" },
    partial: { badge: "bg-orange-100 text-orange-700 border-orange-200", label: "Partially Fulfilled" },
    failed: { badge: "bg-red-100 text-red-700 border-red-200", label: "Failed" },
    cancelled: { badge: "bg-slate-100 text-slate-600 border-slate-200", label: "Cancelled" },
  };
  const sc = statusConfig[o.status] ?? { badge: "bg-slate-100 text-slate-600", label: o.status };

  // Parse all delivery credentials
  const allCredentials = deliveries.flatMap((d: any) => parseDeliveryData(d.deliveryData));
  const hasDelivery = allCredentials.length > 0;
  const isProcessing = ["processing", "pending"].includes(o.status);
  const isFulfilled = ["fulfilled", "completed", "partial"].includes(o.status);
  const isFailed = o.status === "failed";

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]">
      <Navbar />
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container">
          <BackButton href="/orders" label="Back to Orders" className="mb-4" />
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-white">Order #{o.orderNumber ?? o.id}</h1>
            <Badge className={"border " + sc.badge}>{sc.label}</Badge>
            {isProcessing && (
              <button onClick={handleManualRefresh} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
                <RefreshCw className="h-4 w-4 animate-spin" /> Auto-refreshing...
              </button>
            )}
          </div>
          <p className="text-white/60 mt-1">{new Date(o.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Order Items */}
            <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6">
              <h2 className="text-lg font-bold text-[#0D2137] mb-4">Order Items</h2>
              <div className="space-y-3">
                {(o.items ?? []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-[#EEF4FF] bg-[#FAFCFF]">
                    <Package className="h-8 w-8 text-[#4A6080] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#0D2137]">{item.productTitle ?? "Product #" + item.productId}</div>
                      <div className="text-xs text-[#4A6080]">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold text-[#0D2137]">${Number(item.unitPriceUSD * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivered Credentials */}
            {hasDelivery && (
              <div className="bg-white border border-green-200 shadow-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#0D2137] flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" /> Delivered Accounts
                  </h2>
                  <button
                    onClick={() => copyToClipboard(allCredentials.map(a => Object.entries(a).map(([k, v]) => `${k}: ${v}`).join(" | ")).join("\n"))}
                    className="text-xs text-[#4A6080] hover:text-[#0050D0] flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F0F8FF] transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Copy All Accounts
                  </button>
                </div>
                <div className="space-y-3">
                  {allCredentials.map((account, i) => (
                    <CredentialCard key={i} account={account} index={i} onCopy={copyToClipboard} />
                  ))}
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && !hasDelivery && (
              <div className="bg-white border border-blue-200 shadow-sm rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-[#0D2137] text-sm">Fulfilling your order...</div>
                    <div className="text-xs text-[#4A6080] mt-0.5">We are retrieving your accounts from our supplier. This usually takes 5 to 30 seconds.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Awaiting Payment */}
            {o.status === "pending_payment" && (
              <div className="bg-white border border-yellow-200 shadow-sm rounded-xl p-5 border-l-4 border-l-yellow-400">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-semibold text-[#0D2137] text-sm">Awaiting Payment</div>
                    <div className="text-xs text-[#4A6080]">Complete payment to receive your order</div>
                  </div>
                </div>
              </div>
            )}

            {/* Failed State */}
            {isFailed && !hasDelivery && (
              <div className="bg-white border border-red-200 shadow-sm rounded-xl p-5 border-l-4 border-l-red-400">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-semibold text-[#0D2137] text-sm">Fulfillment Failed</div>
                    <div className="text-xs text-[#4A6080]">There was an issue delivering your order. Please open a support ticket and we will resolve it promptly.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Partial Fulfillment */}
            {o.status === "partial" && (
              <div className="bg-white border border-orange-200 shadow-sm rounded-xl p-5 border-l-4 border-l-orange-400">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-semibold text-[#0D2137] text-sm">Partially Fulfilled</div>
                    <div className="text-xs text-[#4A6080]">Some items could not be delivered. Please open a support ticket for the missing items.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6 h-fit">
            <h2 className="text-lg font-bold text-[#0D2137] mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#4A6080]">Order ID</span>
                <span className="text-[#0D2137] font-mono">#{o.orderNumber ?? o.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4A6080]">Status</span>
                <Badge className={"text-xs border " + sc.badge}>{sc.label}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A6080]">Currency</span>
                <span className="text-[#0D2137]">{o.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A6080]">Payment</span>
                <span className="text-[#0D2137] capitalize">{o.paymentGateway ?? "—"}</span>
              </div>
              <div className="border-t border-[#D8E8F5] pt-3 flex justify-between font-bold">
                <span className="text-[#0D2137]">Total</span>
                <span className="text-[#0050D0]">${Number(o.totalUSD).toFixed(2)}</span>
              </div>
            </div>
            {isFulfilled && hasDelivery && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-green-700 font-medium">Order delivered successfully</p>
              </div>
            )}
            <Link href="/tickets">
              <Button variant="outline" className="w-full mt-5 border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF] text-sm">
                Need Help? Open Ticket
              </Button>
            </Link>
            <button onClick={handleManualRefresh} className="w-full mt-2 text-xs text-[#4A6080] hover:text-[#0050D0] flex items-center justify-center gap-1 py-1 transition-colors">
              <RefreshCw className="h-3 w-3" /> Refresh Status
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
