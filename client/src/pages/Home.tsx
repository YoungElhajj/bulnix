import { Link } from "wouter";
import { ArrowRight, Zap, Shield, Globe, Star, ChevronRight, Package, CreditCard, CheckCircle, TrendingUp, Users, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

const HERO_CATEGORIES = [
  { name: "Social Media", icon: "📱", count: "500+", color: "#00C2FF" },
  { name: "Streaming", icon: "🎬", count: "200+", color: "#0319CB" },
  { name: "Gaming", icon: "🎮", count: "300+", color: "#00C2FF" },
  { name: "Email Accounts", icon: "📧", count: "150+", color: "#0F3D5E" },
  { name: "VPN & Proxy", icon: "🔒", count: "100+", color: "#0319CB" },
  { name: "Software Keys", icon: "🔑", count: "250+", color: "#00C2FF" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Browse & Select", desc: "Explore our catalog of premium digital products from verified suppliers.", icon: Package },
  { step: "02", title: "Secure Checkout", desc: "Pay with card, bank transfer, or crypto. All transactions are encrypted.", icon: CreditCard },
  { step: "03", title: "Instant Delivery", desc: "Receive your digital products instantly in your dashboard after payment.", icon: Zap },
];

const TRUST_STATS = [
  { value: "50K+", label: "Happy Customers", icon: Users },
  { value: "99.9%", label: "Uptime", icon: TrendingUp },
  { value: "<1min", label: "Avg. Delivery", icon: Clock },
  { value: "256-bit", label: "SSL Encryption", icon: Lock },
];

const PAYMENT_METHODS = [
  { name: "Paystack", desc: "Cards & Bank Transfer", region: "Nigeria / Africa", color: "#00C3F7" },
  { name: "Monnify", desc: "Bank Transfer & USSD", region: "Nigeria", color: "#0066CC" },
  { name: "Crypto", desc: "BTC, ETH, USDT & more", region: "Global", color: "#F7931A" },
  { name: "Card", desc: "Visa, Mastercard", region: "Global", color: "#00C2FF" },
];

const FAQ_ITEMS = [
  { q: "How fast is delivery?", a: "Most orders are fulfilled within seconds to minutes after payment confirmation." },
  { q: "Is my payment secure?", a: "Yes. All payments are processed through verified gateways with SSL encryption and webhook verification." },
  { q: "What currencies do you accept?", a: "We accept NGN, USD, EUR, and GBP, plus major cryptocurrencies." },
  { q: "What if my order fails?", a: "Failed orders are automatically retried. If unresolved, you receive a full refund within 24 hours." },
];

export default function Home() {
  const { data: featuredProducts } = trpc.products.getFeatured.useQuery(undefined, {
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
  const { data: categoriesData } = trpc.categories.listWithCounts.useQuery(undefined, {
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
  const SOCIAL_SLUGS = ["facebook-accounts", "instagram-accounts", "tiktok-accounts-followers", "whatsapp-accounts", "youtube-accounts-channels", "twitter-x-accounts", "telegram-accounts", "snapchat-accounts", "linkedin-accounts", "google-voice-accounts", "gmail-accounts", "discord-accounts"];

  return (
    <div className="min-h-screen bg-[#061A2B] text-white">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-hero">
        {/* Background glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#00C2FF]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#0319CB]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/25 px-4 py-1.5 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              The Central Hub for Bulk Digital Supply
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Buy Premium{" "}
              <span className="text-gradient-primary">Digital Accounts</span>
              {" "}at Scale
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Bulnix connects you to thousands of verified digital products including social media accounts, streaming services, gaming credits, and more. Instant delivery, global payments, enterprise-grade security.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/products">
                <Button size="lg" className="bg-[#00C2FF] hover:bg-[#00aee0] text-[#061A2B] font-bold px-8 h-12 text-base" style={{ boxShadow: "0 0 28px rgba(0,194,255,0.40)" }}>
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="border-[#0F3D5E] text-slate-300 hover:text-white hover:bg-[#0F3D5E]/40 px-8 h-12 text-base">
                  Create Free Account
                </Button>
              </Link>
            </div>

            {/* Trust Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TRUST_STATS.map(stat => (
                <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                  <stat.icon className="h-5 w-5 text-[#00C2FF] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Categories ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Browse Categories</h2>
              <p className="text-slate-500">Thousands of digital products across every category</p>
            </div>
            <Link href="/categories">
              <Button variant="ghost" className="text-[#00C2FF] hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(() => {
              const allCats = (categoriesData as any[] | undefined ?? []).filter((c: any) => !c.parentId);
              const social = allCats.filter((c: any) => SOCIAL_SLUGS.includes(c.slug));
              const others = allCats.filter((c: any) => !SOCIAL_SLUGS.includes(c.slug));
              const sorted = [
                ...social.sort((a: any, b: any) => SOCIAL_SLUGS.indexOf(a.slug) - SOCIAL_SLUGS.indexOf(b.slug)),
                ...others,
              ];
              return sorted.slice(0, 12).map((cat: any, i: number) => (
                <Link key={i} href={`/categories/${cat.slug}`}>
                  <div className="glass-card rounded-xl p-5 text-center cursor-pointer group hover:border-[#00C2FF]/40 transition-all duration-200 hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-xl bg-[#0A2540] border border-[#0F3D5E] flex items-center justify-center mx-auto mb-3 overflow-hidden">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-9 h-9 object-contain" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-white group-hover:text-[#00C2FF] transition-colors line-clamp-2">{cat.name}</div>
                    {(cat.productCount ?? 0) > 0 && (
                      <div className="text-xs text-slate-500 mt-1">{cat.productCount} items</div>
                    )}
                  </div>
                </Link>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#040f1a]">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Featured Products</h2>
              <p className="text-slate-500">Hand-picked top sellers with instant delivery</p>
            </div>
            <Link href="/products?featured=true">
              <Button variant="ghost" className="text-[#00C2FF] hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.slice(0, 8).map((product: any) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="product-card cursor-pointer">
                    <div className="aspect-[4/3] bg-gradient-to-br from-[#0A2540] to-[#0F3D5E] flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-12 w-12 text-slate-600" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2">{product.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[#00C2FF] font-bold">${Number(product.customerPriceUSD).toFixed(2)}</span>
                        <Badge className="bg-[#00C2FF]/10 text-[#00C2FF] border-[#00C2FF]/20 text-xs">
                          {product.stockUnlimited ? "In Stock" : `${product.stockQuantity} left`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card animate-pulse">
                  <div className="aspect-[4/3] bg-[#0A2540]" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-[#0A2540] rounded w-3/4" />
                    <div className="h-4 bg-[#0A2540] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How Bulnix Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From browsing to delivery in under 60 seconds</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#00C2FF]/30 to-transparent" />

            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#00C2FF]/10 border border-[#00C2FF]/25 flex items-center justify-center mx-auto mb-5" style={{ boxShadow: "0 0 24px rgba(0,194,255,0.12)" }}>
                  <step.icon className="h-9 w-9 text-[#00C2FF]" />
                </div>
                <div className="text-xs font-bold text-[#00C2FF] tracking-widest mb-2">STEP {step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Propositions ───────────────────────────────────────────────── */}
      <section className="py-20 bg-[#040f1a]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-5 bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20 px-3 py-1 text-xs">
                Why Choose Bulnix
              </Badge>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Built for Resellers,<br />
                <span className="text-gradient-primary">Trusted by Buyers</span>
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Bulnix is the nexus between premium digital suppliers and buyers worldwide. We handle the complexity so you get instant, verified digital products every time.
              </p>
              <div className="space-y-4">
                {[
                  { title: "Verified Product Network", desc: "Every product is sourced from vetted, trusted suppliers and quality-checked before listing." },
                  { title: "Real-time Stock Sync", desc: "Inventory updated every 30 minutes. No overselling, no disappointments." },
                  { title: "Multi-Currency Support", desc: "Pay in NGN, USD, EUR, GBP, or crypto. We handle the conversion." },
                  { title: "24/7 Support", desc: "Ticket-based support with fast response times for every order." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#00C2FF] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/signup">
                  <Button className="bg-[#00C2FF] hover:bg-[#00aee0] text-[#061A2B] font-bold px-6">
                    Start Buying Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Secure Payments", desc: "All transactions verified via webhook", color: "#00C2FF" },
                { icon: Zap, title: "Instant Delivery", desc: "Automated fulfillment in seconds", color: "#0319CB" },
                { icon: Globe, title: "Global Access", desc: "Available in 150+ countries", color: "#00C2FF" },
                { icon: Star, title: "Premium Quality", desc: "Verified accounts, guaranteed", color: "#0319CB" },
              ].map((item, i) => (
                <div key={i} className="glass-card rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Payment Methods ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Global Payment Options</h2>
            <p className="text-slate-500">Pay your way with cards, bank transfer, or crypto</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PAYMENT_METHODS.map((method, i) => (
              <div key={i} className="glass-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${method.color}15`, border: `1px solid ${method.color}25` }}>
                  <CreditCard className="h-6 w-6" style={{ color: method.color }} />
                </div>
                <h3 className="text-base font-bold text-white mb-1">{method.name}</h3>
                <p className="text-sm text-slate-400 mb-2">{method.desc}</p>
                <Badge className="text-xs" style={{ background: `${method.color}15`, color: method.color, border: `1px solid ${method.color}25` }}>
                  {method.region}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Currencies supported: <span className="text-slate-300 font-medium">NGN · USD · EUR · GBP · BTC · ETH · USDT</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ Preview ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#040f1a]">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
              <p className="text-slate-500">Quick answers to common questions</p>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="glass-card rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center text-[#00C2FF] text-xs font-bold shrink-0">{i + 1}</span>
                    {item.q}
                  </h4>
                  <p className="text-sm text-slate-400 pl-7">{item.a}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/faq">
                <Button variant="outline" className="border-[#0F3D5E] text-slate-300 hover:text-white hover:bg-[#0F3D5E]/40">
                  View All FAQs <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Become a Supplier ──────────────────────────────────────────────── */}
      <section className="py-20 bg-[#040f1a]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <Badge className="mb-4 bg-[#0319CB]/15 text-[#00C2FF] border border-[#0319CB]/30 text-xs font-semibold px-3 py-1">
                SUPPLIER PROGRAM
              </Badge>
              <h2 className="text-4xl font-bold text-white mb-5 leading-tight">
                Become a <span className="text-[#00C2FF]">Bulnix</span> Supplier
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Have digital products to sell? Partner with Bulnix and reach thousands of buyers across Africa and globally. We handle payments, delivery, and customer support so you can focus on supply.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: TrendingUp, title: "Grow Your Revenue", desc: "Access our established buyer network and sell at volume" },
                  { icon: Shield, title: "Secure Payouts", desc: "Get paid reliably in NGN, USD, or crypto on your schedule" },
                  { icon: Globe, title: "Global Reach", desc: "Sell to buyers in 50+ countries through our platform" },
                  { icon: Zap, title: "Easy Integration", desc: "Simple API or dashboard-based product listing and management" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-[#00C2FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button size="lg" className="bg-[#0319CB] hover:bg-[#0215a8] text-white font-bold px-8 h-12" style={{ boxShadow: "0 0 28px rgba(3,25,203,0.40)" }}>
                  Apply to Become a Supplier
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Right: Stats card */}
            <div className="relative">
              <div className="glass-card rounded-2xl p-8" style={{ border: "1px solid rgba(34,197,94,0.15)" }}>
                <h3 className="text-lg font-bold text-white mb-6">Why Suppliers Choose Bulnix</h3>
                <div className="grid grid-cols-2 gap-5 mb-6">
                  {[
                    { value: "50K+", label: "Active Buyers", color: "#00C2FF" },
                    { value: "99.9%", label: "Platform Uptime", color: "#00C2FF" },
                    { value: "24h", label: "Onboarding Time", color: "#0319CB" },
                    { value: "0%", label: "Setup Fee", color: "#0319CB" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 rounded-xl" style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}15` }}>
                      <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    "Dedicated supplier dashboard",
                    "Real-time order & payout tracking",
                    "Automated order fulfillment",
                    "Priority support channel",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-[#00C2FF] shrink-0" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[#0319CB]/12 rounded-full blur-[60px] pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="relative rounded-2xl overflow-hidden p-10 md:p-16 text-center" style={{ background: "linear-gradient(135deg, rgba(0,194,255,0.12) 0%, rgba(3,25,203,0.10) 100%)", border: "1px solid rgba(0,194,255,0.20)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#00C2FF]/5 to-[#0319CB]/5 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Buy at Scale?
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of buyers on Bulnix. Create your free account and start purchasing premium digital products today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-[#00C2FF] hover:bg-[#00aee0] text-[#061A2B] font-bold px-10 h-12" style={{ boxShadow: "0 0 28px rgba(0,194,255,0.40)" }}>
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="border-[#0F3D5E] text-slate-300 hover:text-white hover:bg-[#0F3D5E]/40 px-10 h-12">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
