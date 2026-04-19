import { useState } from "react";
import { Link, useLocation } from "wouter";
import { CreditCard, Bitcoin, Banknote, Shield, Lock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";

const GATEWAYS = [
  { id: "paystack", name: "Paystack", desc: "Cards & Bank Transfer (NGN/Africa)", icon: CreditCard, color: "#00C3F7", currencies: ["NGN"] },
  { id: "monnify", name: "Monnify", desc: "Bank Transfer & USSD (NGN)", icon: Banknote, color: "#0066CC", currencies: ["NGN"] },
  { id: "nowpayments", name: "Crypto", desc: "BTC, ETH, USDT & 50+ coins", icon: Bitcoin, color: "#F7931A", currencies: ["USD"] },
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotalUSD, clearCart } = useCart();
  const [gateway, setGateway] = useState("paystack");
  const [currency, setCurrency] = useState<"NGN"|"USD"|"EUR"|"GBP">("USD");
  const [coupon, setCoupon] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [country, setCountry] = useState("");
  const [step, setStep] = useState<"review"|"payment"|"success">("review");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number|null>(null);

  const createOrder = trpc.orders.create.useMutation();
  const initiatePayment = trpc.payments.initiate.useMutation();
  const validateCoupon = trpc.cart.validateCoupon.useMutation();

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#061A2B] text-white flex items-center justify-center">
      <div className="text-center">
        <Lock className="h-12 w-12 text-[#00C2FF] mx-auto mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Sign in to Checkout</h2>
        <p className="text-slate-400 mb-6">You need an account to complete your purchase</p>
        <Button className="bg-[#00C2FF] hover:bg-[#00a8d4] text-white" onClick={() => { window.location.href = '/login'; }}>Sign In</Button>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-screen bg-[#061A2B] text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link href="/products"><Button className="bg-[#00C2FF] hover:bg-[#00a8d4] text-white">Browse Products</Button></Link>
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
      setOrderId((order as any).id);
      const payment = await initiatePayment.mutateAsync({
        orderId: (order as any).id,
        gateway: gateway as any,
        currency,
      });
      const payUrl = (payment as any).paymentUrl;
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        toast.info("Payment gateway is being set up. Your order has been created.", { duration: 5000 });
        setStep("success");
        clearCart();
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") return (
    <div className="min-h-screen bg-[#061A2B] text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-[#00C2FF] mx-auto mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
        <p className="text-slate-400 mb-6">Your order #{orderId} has been created. You will receive delivery details once payment is confirmed.</p>
        <Link href="/orders"><Button className="bg-[#00C2FF] hover:bg-[#00a8d4] text-white">View My Orders</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#061A2B] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5">
        <div className="container"><h1 className="text-3xl font-bold text-white">Checkout</h1></div>
      </div>
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Email Address *</Label>
                  <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" className="bg-[#0A2540] border-[#0F3D5E] text-white placeholder:text-slate-600 focus:border-[#00C2FF] h-10"/>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Country</Label>
                  <Input value={country} onChange={e=>setCountry(e.target.value)} placeholder="e.g. Nigeria" className="bg-[#0A2540] border-[#0F3D5E] text-white placeholder:text-slate-600 focus:border-[#00C2FF] h-10"/>
                </div>
              </div>
            </div>

            {/* Currency */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Currency</h3>
              <div className="grid grid-cols-4 gap-3">
                {(["USD","NGN","EUR","GBP"] as const).map(c => (
                  <button key={c} onClick={()=>setCurrency(c)} className={"rounded-lg p-3 border text-sm font-semibold transition-all " + (currency===c ? "border-[#00C2FF] bg-[#00C2FF]/10 text-[#00C2FF]" : "border-[#0F3D5E] text-slate-400 hover:border-white/20")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Payment Method</h3>
              <div className="space-y-3">
                {GATEWAYS.map(gw => (
                  <button key={gw.id} onClick={()=>setGateway(gw.id)} className={"w-full flex items-center gap-4 p-4 rounded-xl border transition-all " + (gateway===gw.id ? "border-[#00C2FF] bg-[#00C2FF]/5" : "border-[#0F3D5E] hover:border-white/20")}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{background:gw.color+"20"}}>
                      <gw.icon className="h-5 w-5" style={{color:gw.color}}/>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white text-sm">{gw.name}</div>
                      <div className="text-xs text-slate-500">{gw.desc}</div>
                    </div>
                    <div className={"w-4 h-4 rounded-full border-2 flex items-center justify-center " + (gateway===gw.id ? "border-[#00C2FF]" : "border-slate-600")}>
                      {gateway===gw.id && <div className="w-2 h-2 rounded-full bg-[#00C2FF]"/>}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1"><Shield className="h-3 w-3"/> All payments are encrypted and secure</p>
            </div>

            {/* Coupon */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Coupon Code</h3>
              <div className="flex gap-3">
                <Input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="bg-[#0A2540] border-[#0F3D5E] text-white placeholder:text-slate-600 focus:border-[#00C2FF] h-10 flex-1"/>
                <Button variant="outline" className="border-[#0F3D5E] text-slate-300 hover:text-white hover:bg-[#0F3D5E]/30 h-10">Apply</Button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card rounded-xl p-6 h-fit sticky top-24">
            <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-400 truncate mr-2">{item.title} x{item.quantity}</span>
                  <span className="text-white flex-shrink-0">${(item.priceUSD * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#0F3D5E] pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-[#00C2FF]">${subtotalUSD.toFixed(2)} {currency}</span>
              </div>
            </div>
            <Button className="w-full h-12 bg-[#00C2FF] hover:bg-[#00a8d4] text-white font-semibold" onClick={handlePlaceOrder} disabled={loading} style={{boxShadow:"0 0 20px rgba(0,194,255,0.3)"}}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Lock className="h-4 w-4 mr-2"/>}
              Place Order
            </Button>
            <Link href="/cart"><Button variant="ghost" className="w-full mt-2 text-slate-400 hover:text-white text-sm"><ArrowLeft className="h-4 w-4 mr-1"/>Back to Cart</Button></Link>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
