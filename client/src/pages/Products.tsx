import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { Search, SlidersHorizontal, Package, ShoppingCart, X, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD" },
  { code: "NGN", symbol: "₦", label: "NGN" },
  { code: "EUR", symbol: "€", label: "EUR" },
  { code: "GBP", symbol: "£", label: "GBP" },
];

const RATES: Record<string, number> = { USD: 1, NGN: 1600, EUR: 0.92, GBP: 0.79 };

function formatPrice(usd: number, currency: string): string {
  const cur = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const converted = usd * (RATES[currency] ?? 1);
  if (currency === "NGN") return `${cur.symbol}${converted.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  return `${cur.symbol}${converted.toFixed(2)}`;
}

// Simple image area — show supplier image as-is on a neutral background
function ProductImageArea({ product }: { product: any }) {
  return (
    <div className="relative h-36 sm:h-44 overflow-hidden flex items-center justify-center bg-white">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-20 sm:h-32 max-w-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
        />
      ) : (
        <Package className="h-12 w-12 text-[#0050D0]/30" />
      )}

      {/* Badges */}
      {product.isFeatured && (
        <Badge className="absolute top-2 left-2 z-20 bg-[#00C2FF] text-[#0F3D5E] text-xs border-0 font-bold shadow">
          <Star className="h-3 w-3 mr-0.5 fill-current" /> Featured
        </Badge>
      )}
      {!product.stockUnlimited && product.stockQuantity <= 5 && product.stockQuantity > 0 && (
        <Badge className="absolute top-2 right-2 z-20 bg-orange-500 text-white text-xs border-0 shadow">Low Stock</Badge>
      )}
      {!product.stockUnlimited && product.stockQuantity === 0 && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <span className="text-white font-semibold text-sm bg-black/50 px-3 py-1 rounded-full">Out of Stock</span>
        </div>
      )}
    </div>
  );
}

export default function Products() {
  const params = useParams<{ slug?: string }>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("price_asc");
  const [currency, setCurrency] = useState("USD");
  const [page, setPage] = useState(1);
  const { addItem } = useCart();

  const { data: category } = trpc.categories.getBySlug.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug, retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) }
  );
  const catId = (category as any)?.id;
  const isParentCat = !!(category as any)?.id && !(category as any)?.parentId;
  const { data: subcategories } = trpc.categories.getSubcategories.useQuery(
    { parentId: catId ?? 0 },
    { enabled: !!catId && isParentCat, retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) }
  );

  const { data, isLoading } = trpc.products.list.useQuery({
    categorySlug: params.slug,
    search: search || undefined,
    sort,
    page,
    limit: 24,
  }, { retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) });

  const products = (data as any)?.items ?? [];
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar/>

      {/* Page Header */}
      <div className="bg-[#0F3D5E] pt-24 pb-10">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
            <Link href="/" className="hover:text-[#00C2FF] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {params.slug ? (
              <>
                <Link href="/categories" className="hover:text-[#00C2FF] transition-colors">Categories</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white">{(category as any)?.name ?? params.slug}</span>
              </>
            ) : (
              <span className="text-white">All Products</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {(category as any)?.name ?? "All Products"}
          </h1>
          <p className="text-white/60">{total} products available</p>
        </div>
      </div>

      {/* Subcategory Pills */}
      {isParentCat && subcategories && (subcategories as any[]).length > 0 && (
        <div className="bg-card border-b border-border">
          <div className="container py-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Browse subcategories</p>
            <div className="flex flex-wrap gap-2">
              {(subcategories as any[]).map((sub: any) => (
                <Link key={sub.id} href={`/categories/${sub.slug}`}>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border cursor-pointer hover:border-[#00C2FF]/50 hover:bg-[#00C2FF]/10 hover:text-[#00C2FF] transition-all text-sm font-medium text-foreground">
                    {sub.imageUrl ? (
                      <img src={sub.imageUrl} alt={sub.name} className="w-5 h-5 object-contain rounded" />
                    ) : (
                      <span className="text-base">📦</span>
                    )}
                    {sub.name}
                    {(sub.productCount ?? 0) > 0 && (
                      <span className="text-muted-foreground text-xs">({sub.productCount})</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container py-8">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-[#00C2FF] h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={sort} onValueChange={(v: any) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] bg-card border-border text-foreground h-10 rounded-xl">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-[110px] bg-card border-border text-foreground h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.symbol} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="h-36 sm:h-44 bg-muted" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>No products found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or browse all categories</p>
            <Link href="/categories">
              <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6">Browse Categories</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Result count */}
            <p className="text-muted-foreground text-sm mb-4">
              Showing {products.length} of {total} products
            </p>

            {/* Product Grid — responsive: 2 cols mobile, 3 tablet, 4 desktop, 5 xl */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {products.map((product: any) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="product-card cursor-pointer group bg-card rounded-2xl overflow-hidden border border-border hover:border-[#00C2FF]/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00C2FF]/10">
                    <ProductImageArea product={product} />
                    <div className="p-2.5 sm:p-3.5">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-[#00C2FF] transition-colors leading-snug">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[#00C2FF] font-bold text-sm sm:text-base">
                          {formatPrice(Number(product.customerPriceUSD), currency)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {product.stockUnlimited ? "∞ stock" : `${product.stockQuantity} left`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-[#00C2FF]/10 hover:bg-[#00C2FF] text-[#00C2FF] hover:text-[#0F3D5E] border border-[#00C2FF]/30 hover:border-[#00C2FF] transition-all duration-200 text-xs rounded-lg font-semibold h-8"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={!product.stockUnlimited && product.stockQuantity === 0}
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Add to Cart
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  className="border-border bg-card text-muted-foreground hover:text-foreground hover:border-[#00C2FF]/50 rounded-full"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm px-4">Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  className="border-border bg-card text-muted-foreground hover:text-foreground hover:border-[#00C2FF]/50 rounded-full"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer/>
    </div>
  );
}
