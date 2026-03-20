import { useState } from "react";
import { Link, useParams } from "wouter";
import { Search, SlidersHorizontal, Package, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";

export default function Products() {
  const params = useParams<{ slug?: string }>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");
  const [page, setPage] = useState(1);
  const { addItem } = useCart();

  const { data: category } = trpc.categories.getBySlug.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug, retry: false }
  );

  const { data, isLoading } = trpc.products.list.useQuery({
    categorySlug: params.slug,
    search: search || undefined,
    sort,
    page,
    limit: 24,
  }, { retry: false });

  const products = (data as any)?.products ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 24);

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.stockUnlimited && product.stockQuantity <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    addItem({
      id: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: product.imageUrl,
      priceUSD: Number(product.customerPriceUSD),
      providerKey: product.providerKey,
      supplierProductId: product.supplierProductId ? String(product.supplierProductId) : undefined,
      stockQuantity: product.stockQuantity,
      stockUnlimited: product.stockUnlimited,
    });
    toast.success(`${product.title} added to cart`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <Navbar />
      <div className="pt-24 pb-8 bg-gradient-to-b from-[#0F172A] to-[#0B0F19] border-b border-white/5">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-[#00B9E9]">Home</Link>
            <span>/</span>
            {params.slug ? (
              <>
                <Link href="/categories" className="hover:text-[#00B9E9]">Categories</Link>
                <span>/</span>
                <span className="text-white">{category?.name ?? params.slug}</span>
              </>
            ) : (
              <span className="text-white">All Products</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{category?.name ?? "All Products"}</h1>
          <p className="text-slate-500">{total} products available</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] h-10" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}
          </div>
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-[180px] bg-[#0F172A] border-white/10 text-white h-10">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#1e293b]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#1e293b] rounded w-3/4" />
                  <div className="h-4 bg-[#1e293b] rounded w-1/2" />
                  <div className="h-8 bg-[#1e293b] rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your search or browse all categories</p>
            <Link href="/categories"><Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white">Browse Categories</Button></Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((product: any) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="product-card cursor-pointer group">
                    <div className="aspect-[4/3] bg-gradient-to-br from-[#0F172A] to-[#1e293b] flex items-center justify-center overflow-hidden relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="h-12 w-12 text-slate-600" />
                      )}
                      {product.isFeatured && <Badge className="absolute top-2 left-2 bg-[#00B9E9] text-white text-xs border-0">Featured</Badge>}
                      {!product.stockUnlimited && product.stockQuantity <= 5 && product.stockQuantity > 0 && <Badge className="absolute top-2 right-2 bg-orange-500/90 text-white text-xs border-0">Low Stock</Badge>}
                      {!product.stockUnlimited && product.stockQuantity === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 mb-3 group-hover:text-[#00B9E9] transition-colors">{product.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#22C55E] font-bold text-lg">${Number(product.customerPriceUSD).toFixed(2)}</span>
                        <span className="text-xs text-slate-500">{product.stockUnlimited ? "∞ In Stock" : `${product.stockQuantity} left`}</span>
                      </div>
                      <Button size="sm" className="w-full bg-[#00B9E9]/10 hover:bg-[#00B9E9] text-[#00B9E9] hover:text-white border border-[#00B9E9]/20 hover:border-[#00B9E9] transition-all duration-200 text-xs"
                        onClick={(e) => handleAddToCart(product, e)} disabled={!product.stockUnlimited && product.stockQuantity === 0}>
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Add to Cart
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-slate-500 text-sm px-4">Page {page} of {totalPages}</span>
                <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
