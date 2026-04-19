import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { CreditCard, Bitcoin, Zap, Shield, Lock, ArrowLeft, CheckCircle, Loader2, ChevronRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";

const GATEWAYS = [
  { id: "wallet", name: "Wallet Balance", desc: "Pay instantly from your Bulnix wallet", icon: Wallet, color: "#10B981" },
  { id: "paystack", name: "Paystack", desc: "Cards, Bank Transfer, USSD (NGN/Africa)", icon: CreditCard, color: "#0050D0" },
  { id: "flutterwave", name: "Flutterwave", desc: "Cards, Bank Transfer, Mobile Money", icon: Zap, color: "#F5A623" },
  { id: "nowpayments", name: "Crypto", desc: "BTC, ETH, USDT & 100+ coins", icon: Bitcoin, color: "#F7931A" },
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotalUSD, clearCart } = useCart();
  const [gateway, setGateway] = useState("wallet");
  const [currency, setCurrency] = useState<"NGN"|"USD"|"EUR"|"GBP">("USD");
  const [coupon, setCoupon] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number|null>(null);
  const [orderNumber, setOrderNumber] = useState<string|null>(null);
  const [success, setSuccess] = useState(false);

  const walletQuery = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated });
  const walletBalance = Number(walletQuery.data?.balanceUSD ?? 0);

  const createOrder = trpc.orders.create.useMutation();
  const initiatePayment = trpc.payments.initiate.useMutation();
  const payWithWallet = trpc.payments.payWithWallet.useMutation();
  const validateCoupon = trpc.cart.validateCoupon.useMutation();

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <Navbar/>
      <div className="text-center bg-white rounded-2xl p-10 border border-[#D8E8F5] shadow-sm max-w-sm w-full mx-4">
        <div className="w-16 h-16 rounded-2xl bg-[#F0F8FF] border border-[#D8E8F5] flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-[#0050D0]"/>
        </div>
        <h2 className="text-2xl font-bold text-[#0D2137] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Sign in to Checkout</h2>
        <p className="text-[#4A6080] mb-6">You need an account to complete your purchase</p>
        <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6 w-full" onClick={() => { window.location.href = '/login'; }}>Sign In</Button>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl p-10 border border-[#D8E8F5] shadow-sm max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Your cart is empty</h2>
        <Link href="/products">
          <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6 w-full">Browse Products</Button>
        </Link>
      </div>
    </div>
  );

  const handlePlaceOrder = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      const order = await createOrder.mutateAsync({
        items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
        currency,
        billingEmail: email,
        billingCountry: country || undefined,
        couponCode: coupon || undefined,
      });
      const newOrderId = (order as any).orderId ?? (order as any).id;
      const newOrderNumber = (order as any).orderNumber;
      setOrderId(newOrderId);
      setOrderNumber(newOrderNumber);

      if (gateway === "wallet") {
        // Pay directly from wallet balance
        const result = await payWithWallet.mutateAsync({ orderId: newOrderId });
        clearCart();
        setSuccess(true);
        toast.success(`Order paid! $${(result as any).amountDeducted?.toFixed(2)} deducted from wallet.`);
      } else {
        // Redirect to payment gateway
        const payment = await initiatePayment.mutateAsync({
          orderId: newOrderId,
          gateway: gateway as any,
          currency,
        });
        const payUrl = (payment as any).paymentUrl;
        if (payUrl && payUrl.startsWith("http")) {
          window.location.href = payUrl;
        } else {
          toast.error("Could not connect to payment gateway. Please try again or choose a different payment method.");
        }
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl p-10 border border-[#D8E8F5] shadow-sm max-w-md w-full mx-4">
        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600"/>
        </div>
        <h2 className="text-2xl font-bold text-[#0D2137] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Order Placed!</h2>
        <p className="text-[#4A6080] mb-6">Your order {orderNumber} has been created and paid. Delivery details will appear in your orders page shortly.</p>
        <Link href="/orders">
          <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6 w-full">View My Orders</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      {/* Header */}
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-3">
            <Link href="/" className="hover:text-[#00C2FF] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/cart" className="hover:text-[#00C2FF] transition-colors">Cart</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">Checkout</span>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Checkout</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-2xl p-6 border border-[#D8E8F5] shadow-sm">
              <h3 className="text-lg font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#4A6080] text-sm mb-1.5 block font-medium">Email Address *</Label>
                  <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
                    className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080]/60 focus:border-[#00C2FF] h-10 rounded-xl"/>
                </div>
                <div>
                  <Label className="text-[#4A6080] text-sm mb-1.5 block font-medium">Country</Label>
                  <Input value={country} onChange={e=>setCountry(e.target.value)} placeholder="e.g. Nigeria"
                    className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080]/60 focus:border-[#00C2FF] h-10 rounded-xl"/>
                </div>
              </div>
            </div>

            {/* Currency (only relevant for gateway payments) */}
            {gateway !== "wallet" && (
              <div className="bg-white rounded-2xl p-6 border border-[#D8E8F5] shadow-sm">
                <h3 className="text-lg font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Currency</h3>
                <div className="grid grid-cols-4 gap-3">
                  {(["USD","NGN","EUR","GBP"] as const).map(c => (
                    <button key={c} onClick={()=>setCurrency(c)}
                      className={"rounded-xl p-3 border text-sm font-semibold transition-all " + (currency===c
                        ? "border-[#0050D0] bg-[#0050D0]/10 text-[#0050D0]"
                        : "border-[#D8E8F5] text-[#4A6080] hover:border-[#00C2FF]/50 bg-[#F5F9FF]")}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 border border-[#D8E8F5] shadow-sm">
              <h3 className="text-lg font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Payment Method</h3>
              <div className="space-y-3">
                {GATEWAYS.map(gw => {
                  const isWallet = gw.id === "wallet";
                  const insufficientBalance = isWallet && walletBalance < subtotalUSD;
                  return (
                    <button key={gw.id} onClick={()=>!insufficientBalance && setGateway(gw.id)}
                      disabled={insufficientBalance}
                      className={"w-full flex items-center gap-4 p-4 rounded-xl border transition-all " + (
                        insufficientBalance
                          ? "border-[#D8E8F5] bg-[#F5F9FF] opacity-50 cursor-not-allowed"
                          : gateway===gw.id
                            ? "border-[#0050D0] bg-[#0050D0]/5"
                            : "border-[#D8E8F5] hover:border-[#00C2FF]/40 bg-[#F5F9FF]"
                      )}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:gw.color+"20"}}>
                        <gw.icon className="h-5 w-5" style={{color:gw.color}}/>
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-[#0D2137] text-sm flex items-center gap-2">
                          {gw.name}
                          {isWallet && (
                            <span className={"text-xs font-normal px-2 py-0.5 rounded-full " + (insufficientBalance ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600")}>
                              ${walletBalance.toFixed(2)} available
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#4A6080]">
                          {isWallet && insufficientBalance ? `Need $${subtotalUSD.toFixed(2)} — top up your wallet first` : gw.desc}
                        </div>
                      </div>
                      <div className={"w-4 h-4 rounded-full border-2 flex items-center justify-center " + (gateway===gw.id ? "border-[#0050D0]" : "border-[#D8E8F5]")}>
                        {gateway===gw.id && <div className="w-2 h-2 rounded-full bg-[#0050D0]"/>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#4A6080] mt-3 flex items-center gap-1">
                <Shield className="h-3 w-3 text-[#00C2FF]"/> All payments are encrypted and secure
              </p>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-2xl p-6 border border-[#D8E8F5] shadow-sm">
              <h3 className="text-lg font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Coupon Code</h3>
              <div className="flex gap-3">
                <Input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code"
                  className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080]/60 focus:border-[#00C2FF] h-10 flex-1 rounded-xl"/>
                <Button variant="outline" className="border-[#D8E8F5] bg-white text-[#0D2137] hover:border-[#00C2FF]/50 hover:bg-[#F0F8FF] h-10 rounded-xl">Apply</Button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-6 h-fit sticky top-24 border border-[#D8E8F5] shadow-sm">
            <h3 className="text-lg font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Order Summary</h3>
            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[#4A6080] truncate mr-2">{item.title} x{item.quantity}</span>
                  <span className="text-[#0D2137] font-medium flex-shrink-0">${(item.priceUSD * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#D8E8F5] pt-4 mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-[#0D2137]">Total</span>
                <span className="text-[#0050D0]">${subtotalUSD.toFixed(2)} USD</span>
              </div>
            </div>
            {gateway === "wallet" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm">
                <div className="flex justify-between text-green-800">
                  <span>Wallet balance</span>
                  <span className="font-semibold">${walletBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700 mt-1">
                  <span>After payment</span>
                  <span className="font-semibold">${Math.max(0, walletBalance - subtotalUSD).toFixed(2)}</span>
                </div>
              </div>
            )}
            <Button
              className="w-full h-12 bg-[#0050D0] hover:bg-[#0040b0] text-white font-semibold rounded-xl shadow-lg shadow-[#0050D0]/20 hover:shadow-xl transition-all"
              onClick={handlePlaceOrder}
              disabled={loading || (gateway === "wallet" && walletBalance < subtotalUSD)}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Lock className="h-4 w-4 mr-2"/>}
              {gateway === "wallet" ? "Pay with Wallet" : "Place Order"}
            </Button>
            <Link href="/cart">
              <Button variant="ghost" className="w-full mt-2 text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F0F8FF] text-sm">
                <ArrowLeft className="h-4 w-4 mr-1"/>Back to Cart
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
