import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotalUSD, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5">
        <div className="container"><h1 className="text-3xl font-bold text-white">Shopping Cart</h1><p className="text-slate-500 mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p></div>
      </div>
      <div className="container py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 text-slate-700 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
            <p className="text-slate-500 mb-6">Browse our products and add items to your cart</p>
            <Link href="/products"><Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white">Browse Products</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#1e293b] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover"/> : <Package className="h-8 w-8 text-slate-600"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={"/products/" + item.slug}><h3 className="text-sm font-semibold text-white hover:text-[#00B9E9] line-clamp-2 transition-colors">{item.title}</h3></Link>
                    <p className="text-[#22C55E] font-bold mt-1">${item.priceUSD.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"><Minus className="h-3 w-3"/></button>
                    <span className="text-white font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"><Plus className="h-3 w-3"/></button>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${(item.priceUSD * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 mt-1"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              ))}
              <button onClick={clearCart} className="text-sm text-slate-500 hover:text-red-400 transition-colors">Clear cart</button>
            </div>
            <div className="glass-card rounded-xl p-6 h-fit sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-400 truncate mr-2">{item.title} x{item.quantity}</span>
                    <span className="text-white font-medium flex-shrink-0">${(item.priceUSD * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-[#22C55E]">${subtotalUSD.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Prices in USD. Local currency calculated at checkout.</p>
              </div>
              <Link href="/checkout">
                <Button className="w-full h-12 bg-[#00B9E9] hover:bg-[#00a8d4] text-white font-semibold" style={{boxShadow:"0 0 20px rgba(0,185,233,0.3)"}}>
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
              <Link href="/products"><Button variant="ghost" className="w-full mt-2 text-slate-400 hover:text-white">Continue Shopping</Button></Link>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
