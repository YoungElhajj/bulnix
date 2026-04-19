import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  Package, ShoppingCart, Shield, Zap, ChevronRight, Minus, Plus,
  CheckCircle, Info, LogIn, Truck, RefreshCw, Star, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type Tab = "description" | "how-to-login" | "delivery" | "refund";

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: params.slug ?? "" },
    { retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) }
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <Navbar/>
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
        <h2 className="text-2xl font-bold text-[#0D2137] mb-2">Product Not Found</h2>
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

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "description", label: "Description", icon: Info },
    { id: "how-to-login", label: "How to Login", icon: LogIn },
    { id: "delivery", label: "Delivery Info", icon: Truck },
    { id: "refund", label: "Refund Policy", icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      {/* Breadcrumb Header */}
      <div className="bg-[#0F3D5E] pt-24 pb-6">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-white/50 flex-wrap">
            <Link href="/" className="hover:text-[#00C2FF] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/products" className="hover:text-[#00C2FF] transition-colors">Products</Link>
            {p.category?.name && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <Link href={`/categories/${p.category.slug ?? ""}`} className="hover:text-[#00C2FF] transition-colors">
                  {p.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-white line-clamp-1">{p.title}</span>
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        {/* Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 mb-10">

          {/* Product Image */}
          <div className="aspect-square bg-gradient-to-br from-[#F0F8FF] to-[#E0EEFF] rounded-2xl flex items-center justify-center overflow-hidden border border-[#D8E8F5] shadow-sm max-h-[480px] w-full">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.title} className="w-full h-full object-contain p-8"/>
            ) : (
              <div className="flex flex-col items-center gap-3 text-[#0050D0]/30">
                <Package className="h-20 w-20"/>
                <span className="text-sm font-medium text-[#4A6080]">Digital Product</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {p.isFeatured && (
                <Badge className="bg-[#00C2FF] text-[#0F3D5E] border-0 text-xs font-bold">⭐ Featured</Badge>
              )}
              <Badge className={inStock
                ? "bg-green-50 text-green-700 border-green-200 text-xs"
                : "bg-red-50 text-red-600 border-red-200 text-xs"
              }>
                {inStock ? (p.stockUnlimited ? "✓ In Stock" : `✓ ${p.stockQuantity} available`) : "✗ Out of Stock"}
              </Badge>
              {p.category?.name && (
                <Badge className="bg-[#F0F8FF] text-[#0050D0] border-[#D8E8F5] text-xs">
                  {p.category.name}
                </Badge>
              )}
              {p.isDigital && (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Digital</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0D2137] mb-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {p.title}
            </h1>

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-4 w-4 ${i <= 4 ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
                ))}
              </div>
              <span className="text-sm text-[#4A6080]">4.8 (124 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-5 p-4 bg-white rounded-xl border border-[#D8E8F5]">
              <span className="text-4xl font-bold text-[#0050D0]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ${Number(p.customerPriceUSD).toFixed(2)}
              </span>
              <span className="text-[#4A6080] text-sm">USD</span>
              {p.customerPriceNGN && (
                <span className="text-[#4A6080] text-sm ml-2">≈ ₦{Number(p.customerPriceNGN).toLocaleString()}</span>
              )}
            </div>

            {/* Short description */}
            {(p.shortDescription || p.description) && (
              <p className="text-[#4A6080] leading-relaxed mb-5 text-sm">
                {p.shortDescription || (p.description?.slice(0, 200) + (p.description?.length > 200 ? "..." : ""))}
              </p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-[#4A6080] text-sm font-medium shrink-0">Quantity:</span>
              <div className="flex items-center gap-2 bg-white border border-[#D8E8F5] rounded-xl px-3 py-2 shadow-sm">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="text-[#4A6080] hover:text-[#0D2137] transition-colors p-0.5"
                >
                  <Minus className="h-4 w-4"/>
                </button>
                <span className="text-[#0D2137] font-semibold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(p.stockUnlimited ? 99 : p.stockQuantity, q + 1))}
                  className="text-[#4A6080] hover:text-[#0D2137] transition-colors p-0.5"
                >
                  <Plus className="h-4 w-4"/>
                </button>
              </div>
              <span className="text-[#4A6080] text-sm">
                Total: <span className="text-[#0050D0] font-bold">${(qty * Number(p.customerPriceUSD)).toFixed(2)}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-5">
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
              <Button
                variant="outline"
                size="icon"
                className={`h-12 w-12 rounded-xl border-[#D8E8F5] bg-white transition-all ${wishlisted ? "text-red-500 border-red-200" : "text-[#4A6080] hover:text-red-500 hover:border-red-200"}`}
                onClick={() => { setWishlisted(!wishlisted); toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist"); }}
              >
                <Heart className={`h-5 w-5 ${wishlisted ? "fill-red-500" : ""}`} />
              </Button>
            </div>

            {/* Login prompt for guests */}
            {!isAuthenticated && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 mb-4 flex items-center gap-3">
                <LogIn className="h-5 w-5 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-700">
                  <a href={getLoginUrl()} className="font-semibold underline">Sign in</a> or{" "}
                  <Link href="/signup" className="font-semibold underline">create an account</Link> to purchase this product.
                </p>
              </div>
            )}

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Zap, text: "Instant Delivery" },
                { icon: Shield, text: "Secure Payment" },
                { icon: Package, text: "Digital Product" },
                { icon: CheckCircle, text: "24/7 Support" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#4A6080] bg-white rounded-lg px-3 py-2 border border-[#D8E8F5]">
                  <f.icon className="h-4 w-4 text-[#00C2FF] shrink-0"/>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl border border-[#D8E8F5] shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-[#D8E8F5] overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-[#0050D0] text-[#0050D0] bg-blue-50/50"
                    : "border-transparent text-[#4A6080] hover:text-[#0D2137] hover:bg-slate-50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === "description" && (
              <div className="prose prose-slate max-w-none">
                <h3 className="text-lg font-semibold text-[#0D2137] mb-3">About This Product</h3>
                {p.description ? (
                  <p className="text-[#4A6080] leading-relaxed whitespace-pre-line">{p.description}</p>
                ) : (
                  <div className="space-y-3 text-[#4A6080]">
                    <p>
                      <strong className="text-[#0D2137]">{p.title}</strong> is a premium digital product available for instant delivery after purchase.
                      This is a verified, high-quality account or service that has been tested and confirmed to work.
                    </p>
                    <p>
                      All products on Bulnix are sourced from trusted suppliers and delivered automatically to your account dashboard
                      within minutes of payment confirmation. No waiting, no hassle.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>100% genuine and verified product</li>
                      <li>Instant digital delivery to your dashboard</li>
                      <li>Full account credentials provided</li>
                      <li>Support available if you encounter any issues</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "how-to-login" && (
              <div>
                <h3 className="text-lg font-semibold text-[#0D2137] mb-4">How to Access Your Product</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#0050D0] text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-[#0D2137] mb-1">Purchase &amp; Pay</p>
                      <p className="text-sm text-[#4A6080]">Add the product to your cart and complete checkout. We accept card payments, crypto, and bank transfers.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#0050D0] text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <div>
                      <p className="font-semibold text-[#0D2137] mb-1">Check Your Dashboard</p>
                      <p className="text-sm text-[#4A6080]">After payment confirmation, go to <Link href="/orders" className="text-[#0050D0] underline">My Orders</Link> in your dashboard. Your order will show as "Fulfilled" with the account credentials.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#0050D0] text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                    <div>
                      <p className="font-semibold text-[#0D2137] mb-1">Use Your Credentials</p>
                      <p className="text-sm text-[#4A6080]">Copy the login details from your order. Visit the service's official website and log in using the provided email and password.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#00C2FF] text-[#0F3D5E] flex items-center justify-center text-sm font-bold shrink-0">4</div>
                    <div>
                      <p className="font-semibold text-[#0D2137] mb-1">Change Password (Recommended)</p>
                      <p className="text-sm text-[#4A6080]">For security, change the account password immediately after first login. Keep your new password safe.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800 font-medium mb-1">⚠️ Important Notes</p>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                    <li>Do not share your credentials with others</li>
                    <li>Do not log in from multiple devices simultaneously</li>
                    <li>Contact support within 24 hours if credentials don't work</li>
                    <li>Some accounts may require email verification — check your spam folder</li>
                  </ul>
                </div>

                {!isAuthenticated && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                    <p className="text-sm text-blue-700 mb-3">You need an account to purchase and access products.</p>
                    <div className="flex gap-3 justify-center">
                      <Link href="/signup">
                        <Button size="sm" className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-5">Create Account</Button>
                      </Link>
                      <Link href="/login">
                        <Button size="sm" variant="outline" className="border-[#0050D0] text-[#0050D0] rounded-full px-5">Sign In</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "delivery" && (
              <div>
                <h3 className="text-lg font-semibold text-[#0D2137] mb-4">Delivery Information</h3>
                {p.deliveryNote ? (
                  <div className="p-4 bg-[#F0F8FF] rounded-xl border-l-4 border-[#00C2FF] border border-[#D8E8F5] mb-4">
                    <p className="text-sm text-[#4A6080] whitespace-pre-line">{p.deliveryNote}</p>
                  </div>
                ) : null}
                <div className="space-y-3 text-sm text-[#4A6080]">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Zap className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">Instant Digital Delivery</p>
                      <p className="text-green-700">Your product credentials are delivered automatically to your order dashboard within minutes of payment confirmation.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#F0F8FF] rounded-lg border border-[#D8E8F5]">
                    <Package className="h-4 w-4 text-[#0050D0] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0D2137]">No Physical Shipping</p>
                      <p>This is a digital product. No physical items are shipped. All credentials are delivered electronically.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#F0F8FF] rounded-lg border border-[#D8E8F5]">
                    <CheckCircle className="h-4 w-4 text-[#0050D0] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0D2137]">Order Confirmation</p>
                      <p>You will receive an email confirmation once your order is placed. Check your spam folder if you don't see it.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "refund" && (
              <div>
                <h3 className="text-lg font-semibold text-[#0D2137] mb-4">Refund Policy</h3>
                {p.refundPolicy ? (
                  <p className="text-[#4A6080] leading-relaxed whitespace-pre-line mb-4">{p.refundPolicy}</p>
                ) : null}
                <div className="space-y-3 text-sm text-[#4A6080]">
                  <div className="p-4 bg-[#F0F8FF] rounded-xl border border-[#D8E8F5]">
                    <p className="font-semibold text-[#0D2137] mb-2">Our Refund Guarantee</p>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Full refund if credentials are invalid or don't work on delivery</li>
                      <li>Replacement provided if account becomes inaccessible within 24 hours</li>
                      <li>No refunds for accounts that worked at delivery but were later suspended due to misuse</li>
                      <li>Refund requests must be submitted within 24 hours of purchase</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-amber-800 font-medium mb-1">How to Request a Refund</p>
                    <p className="text-amber-700">Open a support ticket from your dashboard with your order ID and a description of the issue. Our team responds within 2–4 hours.</p>
                  </div>
                  <p>
                    For full details, see our <Link href="/refund" className="text-[#0050D0] underline">Refund Policy page</Link>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
