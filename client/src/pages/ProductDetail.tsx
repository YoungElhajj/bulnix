import { useState } from "react";
import { Link, useParams } from "wouter";
import { Package, ShoppingCart, Shield, Zap, ChevronRight, Minus, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: params.slug ?? "" },
    { retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) }
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <div className="bg-[#0F3D5E] h-24" />
      <div className="container pt-10 pb-16 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-[#E0EEFF] rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-[#E0EEFF] rounded w-3/4"/>
            <div className="h-6 bg-[#E0EEFF] rounded w-1/4"/>
            <div className="h-32 bg-[#E0EEFF] rounded"/>
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <div className="bg-[#0F3D5E] h-24" />
      <div className="container pt-16 pb-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#F0F8FF] border border-[#D8E8F5] flex items-center justify-center mx-auto mb-4">
          <Package className="h-10 w-10 text-[#4A6080]"/>
        </div>
        <h2 className="text-2xl font-bold text-[#0D2137] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Product Not Found</h2>
        <p className="text-[#4A6080] mb-6">This product doesn't exist or may have been removed.</p>
        <Link href="/products">
          <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6">Browse Products</Button>
        </Link>
      </div>
    </div>
  );

  const p = product as any;
  const inStock = p.stockUnlimited || p.stockQuantity > 0;

  const handleAdd = () => {
    if (!inStock) { toast.error("Out of stock"); return; }
    for (let i = 0; i < qty; i++) {
      addItem({
        id: p.id, slug: p.slug, title: p.title, imageUrl: p.imageUrl,
        priceUSD: Number(p.customerPriceUSD), providerKey: p.providerKey,
        supplierProductId: p.supplierProductId ? String(p.supplierProductId) : undefined,
        stockQuantity: p.stockQuantity, stockUnlimited: p.stockUnlimited
      });
    }
    toast.success(`${qty}x ${p.title} added to cart`);
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      {/* Header */}
      <div className="bg-[#0F3D5E] pt-24 pb-6">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Link href="/" className="hover:text-[#00C2FF] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/products" className="hover:text-[#00C2FF] transition-colors">Products</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white line-clamp-1">{p.title}</span>
          </div>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square bg-gradient-to-br from-[#F0F8FF] to-[#E0EEFF] rounded-2xl flex items-center justify-center overflow-hidden border border-[#D8E8F5] shadow-sm">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"/>
            ) : (
              <Package className="h-24 w-24 text-[#0050D0]/30"/>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {p.isFeatured && (
                <Badge className="bg-[#00C2FF] text-[#0F3D5E] border-0 text-xs font-bold">Featured</Badge>
              )}
              <Badge className={inStock
                ? "bg-green-50 text-green-700 border-green-200 text-xs"
                : "bg-red-50 text-red-600 border-red-200 text-xs"
              }>
                {inStock ? (p.stockUnlimited ? "In Stock" : `${p.stockQuantity} available`) : "Out of Stock"}
              </Badge>
              {p.category?.name && (
                <Badge className="bg-[#F0F8FF] text-[#0050D0] border-[#D8E8F5] text-xs">
                  {p.category.name}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {p.title}
            </h1>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-[#0050D0]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ${Number(p.customerPriceUSD).toFixed(2)}
              </span>
              <span className="text-[#4A6080] text-sm">USD</span>
            </div>

            {p.description && (
              <p className="text-[#4A6080] leading-relaxed mb-8 text-base">{p.description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[#4A6080] text-sm font-medium">Quantity:</span>
              <div className="flex items-center gap-2 bg-white border border-[#D8E8F5] rounded-xl px-3 py-2 shadow-sm">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="text-[#4A6080] hover:text-[#0D2137] transition-colors"
                >
                  <Minus className="h-4 w-4"/>
                </button>
                <span className="text-[#0D2137] font-semibold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(p.stockUnlimited ? 99 : p.stockQuantity, q + 1))}
                  className="text-[#4A6080] hover:text-[#0D2137] transition-colors"
                >
                  <Plus className="h-4 w-4"/>
                </button>
              </div>
              <span className="text-[#4A6080] text-sm">
                Total: <span className="text-[#0050D0] font-bold">${(qty * Number(p.customerPriceUSD)).toFixed(2)}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
              <Button
                className="flex-1 h-12 bg-[#0050D0] hover:bg-[#0040b0] text-white font-semibold rounded-xl shadow-lg shadow-[#0050D0]/20 hover:shadow-xl hover:shadow-[#0050D0]/30 transition-all"
                onClick={handleAdd}
                disabled={!inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2"/> Add to Cart
              </Button>
              <Link href="/cart" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full h-12 border-[#D8E8F5] bg-white text-[#0D2137] hover:border-[#00C2FF]/50 hover:bg-[#F0F8FF] rounded-xl font-semibold transition-all"
                  onClick={handleAdd}
                  disabled={!inStock}
                >
                  Buy Now
                </Button>
              </Link>
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: Zap, text: "Instant Delivery" },
                { icon: Shield, text: "Secure Payment" },
                { icon: Package, text: "Digital Product" },
                { icon: CheckCircle, text: "24/7 Support" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#4A6080]">
                  <f.icon className="h-4 w-4 text-[#00C2FF]"/>
                  {f.text}
                </div>
              ))}
            </div>

            {/* Delivery Note */}
            {p.deliveryNote && (
              <div className="p-4 bg-[#F0F8FF] rounded-xl border-l-4 border-[#00C2FF] border border-[#D8E8F5]">
                <p className="text-sm text-[#4A6080]">{p.deliveryNote}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
