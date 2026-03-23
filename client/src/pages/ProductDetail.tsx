import { useState } from "react";
import { Link, useParams } from "wouter";
import { Package, ShoppingCart, Shield, Zap, ChevronRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { data: product, isLoading } = trpc.products.getBySlug.useQuery({ slug: params.slug ?? "" }, { retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar />
      <div className="container pt-28 pb-16 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-[#1e293b] rounded-2xl" />
          <div className="space-y-4"><div className="h-8 bg-[#1e293b] rounded w-3/4"/><div className="h-6 bg-[#1e293b] rounded w-1/4"/><div className="h-32 bg-[#1e293b] rounded"/></div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar />
      <div className="container pt-28 pb-16 text-center">
        <Package className="h-16 w-16 text-slate-700 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <Link href="/products"><Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white mt-4">Browse Products</Button></Link>
      </div>
    </div>
  );

  const p = product as any;
  const inStock = p.stockUnlimited || p.stockQuantity > 0;

  const handleAdd = () => {
    if (!inStock) { toast.error("Out of stock"); return; }
    for (let i = 0; i < qty; i++) {
      addItem({ id: p.id, slug: p.slug, title: p.title, imageUrl: p.imageUrl, priceUSD: Number(p.customerPriceUSD), providerKey: p.providerKey, supplierProductId: p.supplierProductId ? String(p.supplierProductId) : undefined, stockQuantity: p.stockQuantity, stockUnlimited: p.stockUnlimited });
    }
    toast.success(`${qty}x ${p.title} added to cart`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar />
      <div className="pt-24 pb-8 border-b border-white/5">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-[#00B9E9]">Home</Link><span>/</span>
            <Link href="/products" className="hover:text-[#00B9E9]">Products</Link><span>/</span>
            <span className="text-white line-clamp-1">{p.title}</span>
          </div>
        </div>
      </div>
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-2xl flex items-center justify-center overflow-hidden border border-white/5">
            {p.imageUrl ? <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"/> : <Package className="h-24 w-24 text-slate-600"/>}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              {p.isFeatured && <Badge className="bg-[#00B9E9] text-white border-0 text-xs">Featured</Badge>}
              <Badge className={inStock ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                {inStock ? (p.stockUnlimited ? "In Stock" : `${p.stockQuantity} available`) : "Out of Stock"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">{p.title}</h1>
            <div className="text-4xl font-bold text-[#22C55E] mb-6">${Number(p.customerPriceUSD).toFixed(2)} <span className="text-base text-slate-500 font-normal">USD</span></div>
            {p.description && <p className="text-slate-400 leading-relaxed mb-8">{p.description}</p>}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-slate-400 text-sm">Quantity:</span>
              <div className="flex items-center gap-2 glass-card rounded-lg px-3 py-1.5">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-slate-400 hover:text-white"><Minus className="h-4 w-4"/></button>
                <span className="text-white font-semibold w-8 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(p.stockUnlimited ? 99 : p.stockQuantity, q + 1))} className="text-slate-400 hover:text-white"><Plus className="h-4 w-4"/></button>
              </div>
              <span className="text-slate-500 text-sm">= <span className="text-white font-semibold">${(qty * Number(p.customerPriceUSD)).toFixed(2)}</span></span>
            </div>
            <div className="flex gap-3 mb-8">
              <Button className="flex-1 h-12 bg-[#00B9E9] hover:bg-[#00a8d4] text-white font-semibold" onClick={handleAdd} disabled={!inStock} style={{boxShadow:"0 0 20px rgba(0,185,233,0.3)"}}>
                <ShoppingCart className="h-5 w-5 mr-2"/> Add to Cart
              </Button>
              <Link href="/cart" className="flex-1">
                <Button variant="outline" className="w-full h-12 border-white/10 text-slate-300 hover:text-white hover:bg-white/5" onClick={handleAdd} disabled={!inStock}>
                  Buy Now
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[{icon:Zap,text:"Instant Delivery"},{icon:Shield,text:"Secure Payment"},{icon:Package,text:"Digital Product"},{icon:Zap,text:"24/7 Support"}].map((f,i)=>(
                <div key={i} className="flex items-center gap-2 text-sm text-slate-400"><f.icon className="h-4 w-4 text-[#00B9E9]"/>{f.text}</div>
              ))}
            </div>
            {p.deliveryNote && <div className="mt-6 p-4 glass-card rounded-xl border-l-4 border-[#00B9E9]"><p className="text-sm text-slate-300">{p.deliveryNote}</p></div>}
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
