import { Link } from "wouter";
import { Heart, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { getLoginUrl } from "@/const";

export default function Wishlist() {
  const { isAuthenticated, loading } = useAuth();
  const { addItem } = useCart();
  const utils = trpc.useUtils();
  const { data: saved, isLoading } = trpc.user.getSavedProducts.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const toggle = trpc.user.toggleSavedProduct.useMutation({ onSuccess: () => utils.user.getSavedProducts.invalidate() });

  if (loading || !isAuthenticated) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-white mb-4">Sign in to view wishlist</h2>
        <Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white" onClick={() => { window.location.href = getLoginUrl(); }}>Sign In</Button></div>
    </div>
  );

  const products = (saved as any[]) ?? [];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5"><div className="container"><h1 className="text-3xl font-bold text-white">Wishlist</h1><p className="text-slate-500 mt-1">{products.length} saved items</p></div></div>
      <div className="container py-8">
        {isLoading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">{[...Array(4)].map((_,i)=><div key={i} className="glass-card rounded-xl h-48 animate-pulse"/>)}</div>
        : products.length === 0 ? (
          <div className="text-center py-20"><Heart className="h-16 w-16 text-slate-700 mx-auto mb-4"/><h3 className="text-xl font-semibold text-white mb-2">No saved items</h3><Link href="/products"><Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white mt-4">Browse Products</Button></Link></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p: any) => (
              <div key={p.id} className="product-card group">
                <div className="aspect-[4/3] bg-gradient-to-br from-[#0F172A] to-[#1e293b] flex items-center justify-center relative overflow-hidden">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"/> : <Package className="h-12 w-12 text-slate-600"/>}
                  <button onClick={()=>toggle.mutate({productId:p.id})} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"><Heart className="h-4 w-4 text-red-400 fill-red-400"/></button>
                </div>
                <div className="p-4">
                  <Link href={"/products/" + p.slug}><h3 className="text-sm font-semibold text-white line-clamp-2 mb-3 hover:text-[#00B9E9] transition-colors">{p.title}</h3></Link>
                  <div className="flex items-center justify-between mb-3"><span className="text-[#22C55E] font-bold">${Number(p.customerPriceUSD).toFixed(2)}</span></div>
                  <Button size="sm" className="w-full bg-[#00B9E9]/10 hover:bg-[#00B9E9] text-[#00B9E9] hover:text-white border border-[#00B9E9]/20 hover:border-[#00B9E9] transition-all text-xs"
                    onClick={()=>{addItem({id:p.id,slug:p.slug,title:p.title,imageUrl:p.imageUrl,priceUSD:Number(p.customerPriceUSD),providerKey:p.providerKey,stockQuantity:p.stockQuantity,stockUnlimited:p.stockUnlimited});toast.success("Added to cart");}}>
                    <ShoppingCart className="h-3.5 w-3.5 mr-1.5"/> Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
