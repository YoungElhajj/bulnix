import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotalUSD, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      {/* Header */}
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-3">
            <Link href="/" className="hover:text-[#00C2FF] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">Shopping Cart</span>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Shopping Cart</h1>
          <p className="text-white/60 mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="container py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-[#F0F8FF] border border-[#D8E8F5] flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-10 w-10 text-[#4A6080]"/>
            </div>
            <h3 className="text-xl font-bold text-[#0D2137] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Your cart is empty</h3>
            <p className="text-[#4A6080] mb-6">Browse our products and add items to your cart</p>
            <Link href="/products">
              <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-[#D8E8F5] shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#F0F8FF] to-[#E0EEFF] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#D8E8F5]">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover"/>
                    ) : (
                      <Package className="h-8 w-8 text-[#0050D0]/30"/>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={"/products/" + item.slug}>
                      <h3 className="text-sm font-semibold text-[#0D2137] hover:text-[#0050D0] line-clamp-2 transition-colors">{item.title}</h3>
                    </Link>
                    <p className="text-[#0050D0] font-bold mt-1 text-sm">${item.priceUSD.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-[#F0F8FF] border border-[#D8E8F5] hover:bg-[#E0EEFF] flex items-center justify-center text-[#4A6080] hover:text-[#0D2137] transition-all"
                    >
                      <Minus className="h-3 w-3"/>
                    </button>
                    <span className="text-[#0D2137] font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-[#F0F8FF] border border-[#D8E8F5] hover:bg-[#E0EEFF] flex items-center justify-center text-[#4A6080] hover:text-[#0D2137] transition-all"
                    >
                      <Plus className="h-3 w-3"/>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[#0D2137] font-bold">${(item.priceUSD * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 mt-1 transition-colors"
                    >
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={clearCart}
                className="text-sm text-[#4A6080] hover:text-red-500 transition-colors"
              >
                Clear cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 h-fit sticky top-24 border border-[#D8E8F5] shadow-sm">
              <h3 className="text-lg font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#4A6080] truncate mr-2">{item.title} x{item.quantity}</span>
                    <span className="text-[#0D2137] font-medium flex-shrink-0">${(item.priceUSD * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#D8E8F5] pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[#0D2137]">Total</span>
                  <span className="text-[#0050D0]">${subtotalUSD.toFixed(2)}</span>
                </div>
                <p className="text-xs text-[#4A6080] mt-1">Prices in USD. Local currency calculated at checkout.</p>
              </div>
              <Link href="/checkout">
                <Button className="w-full h-12 bg-[#0050D0] hover:bg-[#0040b0] text-white font-semibold rounded-xl shadow-lg shadow-[#0050D0]/20 hover:shadow-xl transition-all">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" className="w-full mt-2 text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F0F8FF]">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
