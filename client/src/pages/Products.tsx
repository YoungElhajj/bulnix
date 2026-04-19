import { useState } from "react";
import { Link, useParams } from "wouter";
import { Search, SlidersHorizontal, Package, ShoppingCart, X, ChevronRight } from "lucide-react";
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

export default function Products() {
  const params = useParams<{ slug?: string }>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");
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
    <div className="min-h-screen bg-[#F5F9FF]">
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
        <div className="bg-white border-b border-[#D8E8F5]">
          <div className="container py-4">
            <p className="text-[#4A6080] text-xs font-semibold uppercase tracking-wider mb-3">Browse subcategories</p>
            <div className="flex flex-wrap gap-2">
              {(subcategories as any[]).map((sub: any) => (
                <Link key={sub.id} href={`/categories/${sub.slug}`}>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F9FF] border border-[#D8E8F5] cursor-pointer hover:border-[#00C2FF]/50 hover:bg-[#E8F4FF] hover:text-[#0050D0] transition-all text-sm font-medium text-[#0D2137]">
                    {sub.imageUrl ? (
                      <img src={sub.imageUrl} alt={sub.name} className="w-5 h-5 object-contain rounded" />
                    ) : (
                      <span className="text-base">📦</span>
                    )}
                    {sub.name}
                    {(sub.productCount ?? 0) > 0 && (
                      <span className="text-[#4A6080] text-xs">({sub.productCount})</span>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A6080]" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080]/60 focus:border-[#00C2FF] h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6080] hover:text-[#0D2137]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={sort} onValueChange={(v: any) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] bg-white border-[#D8E8F5] text-[#0D2137] h-10 rounded-xl">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-[#4A6080]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D8E8F5]">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-[110px] bg-white border-[#D8E8F5] text-[#0D2137] h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D8E8F5]">
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.symbol} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#D8E8F5] animate-pulse">
                <div className="aspect-[4/3] bg-[#F0F8FF]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#F0F8FF] rounded w-3/4" />
                  <div className="h-4 bg-[#F0F8FF] rounded w-1/2" />
                  <div className="h-8 bg-[#F0F8FF] rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-[#F0F8FF] border border-[#D8E8F5] flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-[#4A6080]" />
            </div>
            <h3 className="text-xl font-bold text-[#0D2137] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>No products found</h3>
            <p className="text-[#4A6080] mb-6">Try adjusting your search or browse all categories</p>
            <Link href="/categories">
              <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6">Browse Categories</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((product: any) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="product-card cursor-pointer group bg-white">
                    <div className="aspect-[4/3] bg-gradient-to-br from-[#F0F8FF] to-[#E0EEFF] flex items-center justify-center overflow-hidden relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="h-12 w-12 text-[#0050D0]/30" />
                      )}
                      {product.isFeatured && (
                        <Badge className="absolute top-2 left-2 bg-[#00C2FF] text-[#0F3D5E] text-xs border-0 font-bold">Featured</Badge>
                      )}
                      {!product.stockUnlimited && product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                        <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs border-0">Low Stock</Badge>
                      )}
                      {!product.stockUnlimited && product.stockQuantity === 0 && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <span className="text-[#0D2137] font-semibold text-sm">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-[#0D2137] line-clamp-2 mb-3 group-hover:text-[#0050D0] transition-colors">{product.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#0050D0] font-bold text-lg">
                          {formatPrice(Number(product.customerPriceUSD), currency)}
                        </span>
                        <span className="text-xs text-[#4A6080]">
                          {product.stockUnlimited ? "In Stock" : `${product.stockQuantity} left`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-[#0050D0]/10 hover:bg-[#0050D0] text-[#0050D0] hover:text-white border border-[#0050D0]/20 hover:border-[#0050D0] transition-all duration-200 text-xs rounded-lg"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  className="border-[#D8E8F5] bg-white text-[#4A6080] hover:text-[#0D2137] hover:border-[#00C2FF]/50 rounded-full"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-[#4A6080] text-sm px-4">Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  className="border-[#D8E8F5] bg-white text-[#4A6080] hover:text-[#0D2137] hover:border-[#00C2FF]/50 rounded-full"
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
    </div>
  );
}
