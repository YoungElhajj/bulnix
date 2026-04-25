import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Shield, Lock, ArrowLeft, CheckCircle, Loader2, ChevronRight, Wallet, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotalUSD, clearCart } = useCart();
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  const walletQuery = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated });
  const walletBalance = Number(walletQuery.data?.balanceUSD ?? 0);

  const createOrder = trpc.orders.create.useMutation();
  const payWithWallet = trpc.payments.payWithWallet.useMutation();
  const validateCoupon = trpc.cart.validateCoupon.useMutation();

  const finalTotal = Math.max(0, subtotalUSD - couponDiscount);
  const hasEnoughBalance = walletBalance >= finalTotal;
  const shortfall = Math.max(0, finalTotal - walletBalance);

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <Navbar />
      <div className="text-center bg-[#0F2035] rounded-2xl p-10 border border-[#1E3A5F] shadow-lg max-w-sm w-full mx-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0A1628] border border-[#1E3A5F] flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-[#00C2FF]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to Checkout</h2>
        <p className="text-[#8BA5C0] mb-6">You need an account to complete your purchase</p>
        <Button className="bg-[#00C2FF] hover:bg-[#00a8e0] text-[#0A1628] font-bold rounded-full px-6 w-full" onClick={() => { window.location.href = '/login'; }}>Sign In</Button>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <div className="text-center bg-[#0F2035] rounded-2xl p-10 border border-[#1E3A5F] shadow-lg max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
        <Link href="/products">
          <Button className="bg-[#00C2FF] hover:bg-[#00a8e0] text-[#0A1628] font-bold rounded-full px-6 w-full">Browse Products</Button>
        </Link>
      </div>
    </div>
  );

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const result = await validateCoupon.mutateAsync({ code: coupon.trim().toUpperCase(), subtotalUSD });
      const discount = (result as any).discountUSD ?? 0;
      setCouponDiscount(discount);
      setCouponCode(coupon.trim().toUpperCase());
      toast.success(`Coupon applied! You save $${discount.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err.message ?? "Invalid coupon code");
      setCouponDiscount(0);
      setCouponCode("");
    }
  };

  const handlePlaceOrder = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    if (!hasEnoughBalance) {
      toast.error(`Insufficient wallet balance. Please top up $${shortfall.toFixed(2)} more.`);
      return;
    }
    setLoading(true);
    try {
      const order = await createOrder.mutateAsync({
        items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
        currency: "USD",
        billingEmail: email,
        billingCountry: country || undefined,
        couponCode: couponCode || undefined,
      });
      const newOrderId = (order as any).orderId ?? (order as any).id;
      const newOrderNumber = (order as any).orderNumber;
      setOrderNumber(newOrderNumber);
      setPlacedOrderId(newOrderId);

      // Always pay from wallet — no direct gateway checkout
      const result = await payWithWallet.mutateAsync({ orderId: newOrderId });
      clearCart();
      setSuccess(true);
      toast.success(`Order placed! $${(result as any).amountDeducted?.toFixed(2)} deducted from wallet.`);
      // Auto-redirect to order detail after 2 seconds
      setTimeout(() => setLocation(`/orders/${newOrderId}`), 2000);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <div className="text-center bg-[#0F2035] rounded-2xl p-10 border border-[#1E3A5F] shadow-lg max-w-md w-full mx-4">
        <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
        <p className="text-[#8BA5C0] mb-4">Your order <span className="text-[#00C2FF] font-mono">{orderNumber}</span> has been placed and paid from your wallet.</p>
        <p className="text-[#4A6080] text-sm mb-6">Redirecting to your order details in a moment...</p>
        <div className="flex gap-3">
          <Button className="bg-[#00C2FF] hover:bg-[#00a8e0] text-[#0A1628] font-bold rounded-full flex-1" onClick={() => setLocation(`/orders/${placedOrderId}`)}>
            View Order Now
          </Button>
          <Link href="/products" className="flex-1">
            <Button variant="outline" className="border-[#1E3A5F] text-[#8BA5C0] hover:text-white rounded-full w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <Navbar />
      {/* Header */}
      <div className="bg-[#0F2035] border-b border-[#1E3A5F] pt-24 pb-8">
        <div className="container">
          <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-white/60 hover:text-[#00C2FF] text-sm mb-3 transition-colors">
            ← Back
          </button>
          <div className="flex items-center gap-2 text-sm text-[#8BA5C0] mb-3">
            <Link href="/" className="hover:text-[#00C2FF] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/cart" className="hover:text-[#00C2FF] transition-colors">Cart</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">Checkout</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
          <p className="text-[#8BA5C0] mt-1">All orders are paid securely from your Bulnix wallet</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Wallet Balance Banner */}
            <div className={`rounded-2xl p-5 border flex items-center gap-4 ${hasEnoughBalance
              ? "bg-green-900/20 border-green-500/30"
              : "bg-red-900/20 border-red-500/30"
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${hasEnoughBalance ? "bg-green-900/40" : "bg-red-900/40"}`}>
                <Wallet className={`h-6 w-6 ${hasEnoughBalance ? "text-green-400" : "text-red-400"}`} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-base ${hasEnoughBalance ? "text-green-300" : "text-red-300"}`}>
                  Wallet Balance: ${walletBalance.toFixed(2)} USD
                </p>
                {hasEnoughBalance ? (
                  <p className="text-green-400/70 text-sm">You have sufficient balance to complete this order.</p>
                ) : (
                  <p className="text-red-400/70 text-sm">
                    You need <span className="font-bold text-red-300">${shortfall.toFixed(2)} more</span> to complete this order.
                  </p>
                )}
              </div>
              {!hasEnoughBalance && (
                <Link href="/wallet">
                  <Button className="bg-[#00C2FF] hover:bg-[#00a8e0] text-[#0A1628] font-bold rounded-xl shrink-0 gap-2">
                    <Plus className="h-4 w-4" /> Top Up
                  </Button>
                </Link>
              )}
            </div>

            {/* Insufficient balance warning */}
            {!hasEnoughBalance && (
              <div className="rounded-2xl p-5 bg-amber-900/20 border border-amber-500/30 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300 font-semibold text-sm">Wallet top-up required</p>
                  <p className="text-amber-400/70 text-sm mt-1">
                    All orders on Bulnix are paid from your wallet balance. Please top up at least <strong>${shortfall.toFixed(2)}</strong> to proceed.
                    Your payment to Bulnix is private. No payment gateway can see what products you purchase.
                  </p>
                  <Link href="/wallet" className="inline-block mt-3">
                    <Button className="bg-amber-500 hover:bg-amber-400 text-[#0A1628] font-bold rounded-xl gap-2 h-9 text-sm">
                      <Plus className="h-4 w-4" /> Fund My Wallet
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-[#0F2035] rounded-2xl p-6 border border-[#1E3A5F]">
              <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#8BA5C0] text-sm mb-1.5 block font-medium">Email Address *</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                    className="bg-[#0A1628] border-[#1E3A5F] text-white placeholder:text-[#4A6080] focus:border-[#00C2FF] h-10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-[#8BA5C0] text-sm mb-1.5 block font-medium">Country (optional)</Label>
                  <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Nigeria"
                    className="bg-[#0A1628] border-[#1E3A5F] text-white placeholder:text-[#4A6080] focus:border-[#00C2FF] h-10 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-[#0F2035] rounded-2xl p-6 border border-[#1E3A5F]">
              <h3 className="text-lg font-bold text-white mb-4">Coupon Code</h3>
              <div className="flex gap-3">
                <Input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code"
                  className="bg-[#0A1628] border-[#1E3A5F] text-white placeholder:text-[#4A6080] focus:border-[#00C2FF] h-10 rounded-xl flex-1" />
                <Button variant="outline" onClick={handleApplyCoupon} disabled={validateCoupon.isPending}
                  className="border-[#1E3A5F] text-[#8BA5C0] hover:text-white hover:border-[#00C2FF] rounded-xl shrink-0">
                  {validateCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
              {couponDiscount > 0 && (
                <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Coupon <strong>{couponCode}</strong> applied. You are saving ${couponDiscount.toFixed(2)}
                </p>
              )}
            </div>

            {/* Payment note */}
            <div className="bg-[#0F2035] rounded-2xl p-5 border border-[#1E3A5F] flex gap-3">
              <Shield className="h-5 w-5 text-[#00C2FF] shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Private & Secure Checkout</p>
                <p className="text-[#8BA5C0] text-sm mt-1">
                  Your order is paid from your Bulnix wallet balance. Payment gateways only see your wallet top-up. They cannot track which products you purchase.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-4">
            <div className="bg-[#0F2035] rounded-2xl border border-[#1E3A5F] overflow-hidden sticky top-24">
              <div className="p-5 border-b border-[#1E3A5F]">
                <h3 className="text-base font-bold text-white">Order Summary</h3>
              </div>
              <div className="p-5 space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover bg-white shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#0A1628] border border-[#1E3A5F] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      <p className="text-[#8BA5C0] text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white text-sm font-semibold shrink-0">${(item.priceUSD * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-[#1E3A5F] space-y-2">
                <div className="flex justify-between text-sm text-[#8BA5C0]">
                  <span>Subtotal</span>
                  <span>${subtotalUSD.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Discount ({couponCode})</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-[#1E3A5F]">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#8BA5C0]">
                  <span>Wallet Balance</span>
                  <span className={hasEnoughBalance ? "text-green-400" : "text-red-400"}>${walletBalance.toFixed(2)}</span>
                </div>
                {!hasEnoughBalance && (
                  <div className="flex justify-between text-xs text-red-400 font-semibold">
                    <span>Shortfall</span>
                    <span>-${shortfall.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="p-5 pt-0">
                <Button
                  className="w-full bg-[#00C2FF] hover:bg-[#00a8e0] text-[#0A1628] font-bold rounded-xl h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePlaceOrder}
                  disabled={loading || !hasEnoughBalance || walletQuery.isLoading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Processing...</span>
                  ) : !hasEnoughBalance ? (
                    <span className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Insufficient Balance</span>
                  ) : (
                    <span className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Pay ${finalTotal.toFixed(2)} from Wallet</span>
                  )}
                </Button>
                {!hasEnoughBalance && (
                  <Link href="/wallet" className="block mt-3">
                    <Button variant="outline" className="w-full border-[#00C2FF]/50 text-[#00C2FF] hover:bg-[#00C2FF]/10 rounded-xl h-10 gap-2">
                      <Plus className="h-4 w-4" /> Top Up Wallet
                    </Button>
                  </Link>
                )}
                <p className="text-xs text-[#4A6080] text-center mt-3 flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3 text-[#00C2FF]" /> Secured by Bulnix · No card data stored
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
