import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Zap, Shield, Globe, Star, ChevronRight, Package, CreditCard, CheckCircle, TrendingUp, Users, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const SOCIAL_SLUGS = ["facebook-accounts","instagram-accounts","tiktok-accounts-followers","whatsapp-accounts","youtube-accounts-channels","twitter-x-accounts","telegram-accounts","snapchat-accounts","linkedin-accounts","google-voice-accounts","gmail-accounts","discord-accounts"];

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
  { name: "Card", desc: "Visa, Mastercard", region: "Global", color: "#0319CB" },
];

const FAQ_ITEMS = [
  { q: "How fast is delivery?", a: "Most orders are fulfilled within seconds to minutes after payment confirmation." },
  { q: "Is my payment secure?", a: "Yes. All payments are processed through verified gateways with SSL encryption and webhook verification." },
  { q: "What currencies do you accept?", a: "We accept NGN, USD, EUR, and GBP, plus major cryptocurrencies." },
  { q: "What if my order fails?", a: "Failed orders are automatically retried. If unresolved, you receive a full refund within 24 hours." },
];

// ── Reveal Section wrapper ──────────────────────────────────────────────────
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { data: featuredProducts } = trpc.products.getFeatured.useQuery(undefined, { retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) });
  const { data: categoriesData } = trpc.categories.listWithCounts.useQuery(undefined, { retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) });

  // Hero text animation
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 overflow-hidden" style={{ background: "linear-gradient(160deg, #e8f4ff 0%, #f0f8ff 40%, #ffffff 100%)" }}>
        {/* Floating decorative orbs */}
        <div className="absolute top-16 right-[8%] w-16 h-16 rounded-full bg-[#00C2FF]/20 blur-sm animate-float pointer-events-none" />
        <div className="absolute top-40 right-[18%] w-8 h-8 rounded-full bg-[#0319CB]/25 blur-sm animate-float-slow pointer-events-none" />
        <div className="absolute bottom-20 left-[6%] w-12 h-12 rounded-full bg-[#00C2FF]/15 blur-sm animate-float-reverse pointer-events-none" />
        <div className="absolute top-24 left-[12%] w-6 h-6 rounded-full bg-[#0319CB]/20 blur-sm animate-float pointer-events-none" />
        {/* Background gradient blob */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00C2FF]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0319CB]/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.7s ease, transform 0.7s ease",
              }}
            >
              <Badge className="mb-6 bg-[#00C2FF]/10 text-[#0319CB] border border-[#00C2FF]/30 px-4 py-1.5 text-sm font-medium">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                The Central Hub for Bulk Digital Supply
              </Badge>
            </div>

            <div
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(32px)",
                transition: "opacity 0.75s ease 120ms, transform 0.75s ease 120ms",
              }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 text-[#0F3D5E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Buy Premium{" "}
                <span style={{ background: "linear-gradient(90deg, #00C2FF, #0319CB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Digital Accounts
                </span>
                {" "}at Scale
              </h1>
            </div>

            <div
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(32px)",
                transition: "opacity 0.75s ease 220ms, transform 0.75s ease 220ms",
              }}
            >
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                Bulnix connects you to thousands of verified digital products — social media accounts, streaming, gaming credits, and more. Instant delivery, global payments, enterprise-grade security.
              </p>
            </div>

            <div
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.75s ease 320ms, transform 0.75s ease 320ms",
              }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link href="/products">
                  <Button size="lg" className="bg-[#0319CB] hover:bg-[#0215a8] text-white font-bold px-8 h-12 text-base shadow-lg hover:shadow-[#0319CB]/30 hover:shadow-xl transition-all duration-200">
                    Browse Products
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="border-[#00C2FF] text-[#0319CB] hover:bg-[#00C2FF]/10 px-8 h-12 text-base font-semibold">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust Stats */}
            <div
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.75s ease 420ms, transform 0.75s ease 420ms",
              }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {TRUST_STATS.map(stat => (
                  <div key={stat.label} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm border border-[#00C2FF]/15 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <stat.icon className="h-5 w-5 text-[#00C2FF] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[#0F3D5E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Categories ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container">
          <RevealSection>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[#0F3D5E] mb-2">Browse Categories</h2>
                <p className="text-slate-500">Thousands of digital products across every category</p>
              </div>
              <Link href="/categories">
                <Button variant="ghost" className="text-[#0319CB] hover:text-[#0319CB] hover:bg-[#0319CB]/8 gap-1 font-semibold">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </RevealSection>

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
                <RevealSection key={i} delay={i * 40}>
                  <Link href={`/categories/${cat.slug}`}>
                    <div className="bg-white rounded-xl p-5 text-center cursor-pointer group border border-slate-100 hover:border-[#00C2FF]/50 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-250 shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-[#e8f4ff] flex items-center justify-center mx-auto mb-3 overflow-hidden group-hover:bg-[#00C2FF]/15 transition-colors">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-9 h-9 object-contain" />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-[#0F3D5E] group-hover:text-[#0319CB] transition-colors line-clamp-2">{cat.name}</div>
                      {(cat.productCount ?? 0) > 0 && (
                        <div className="text-xs text-slate-400 mt-1">{cat.productCount} items</div>
                      )}
                    </div>
                  </Link>
                </RevealSection>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #f0f8ff 0%, #ffffff 100%)" }}>
        <div className="container">
          <RevealSection>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[#0F3D5E] mb-2">Featured Products</h2>
                <p className="text-slate-500">Hand-picked top sellers with instant delivery</p>
              </div>
              <Link href="/products?featured=true">
                <Button variant="ghost" className="text-[#0319CB] hover:text-[#0319CB] hover:bg-[#0319CB]/8 gap-1 font-semibold">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </RevealSection>

          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.slice(0, 8).map((product: any, i: number) => (
                <RevealSection key={product.id} delay={i * 50}>
                  <Link href={`/products/${product.slug}`}>
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-[#00C2FF]/40 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-250 shadow-sm cursor-pointer group">
                      <div className="aspect-[4/3] bg-gradient-to-br from-[#e8f4ff] to-[#dbeafe] flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <Package className="h-12 w-12 text-[#00C2FF]/50" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-[#0F3D5E] line-clamp-2 mb-2">{product.title}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[#0319CB] font-bold">${Number(product.customerPriceUSD).toFixed(2)}</span>
                          <Badge className="bg-[#00C2FF]/10 text-[#0319CB] border-[#00C2FF]/20 text-xs">
                            {product.stockUnlimited ? "In Stock" : `${product.stockQuantity} left`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
                  <div className="aspect-[4/3] bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container">
          <RevealSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#0F3D5E] mb-3">How Bulnix Works</h2>
              <p className="text-slate-500 max-w-xl mx-auto">From browsing to delivery in under 60 seconds</p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#00C2FF]/40 to-transparent" />
            {HOW_IT_WORKS.map((step, i) => (
              <RevealSection key={i} delay={i * 120} className="relative text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00C2FF]/15 to-[#0319CB]/10 border border-[#00C2FF]/25 flex items-center justify-center mx-auto mb-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                  <step.icon className="h-9 w-9 text-[#0319CB]" />
                </div>
                <div className="text-xs font-bold text-[#00C2FF] tracking-widest mb-2">STEP {step.step}</div>
                <h3 className="text-xl font-bold text-[#0F3D5E] mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Propositions ───────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #e8f4ff 0%, #f0f8ff 100%)" }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <RevealSection>
              <Badge className="mb-5 bg-[#00C2FF]/10 text-[#0319CB] border border-[#00C2FF]/25 px-3 py-1 text-xs font-semibold">
                Why Choose Bulnix
              </Badge>
              <h2 className="text-4xl font-bold text-[#0F3D5E] mb-6 leading-tight">
                Built for Resellers,<br />
                <span style={{ background: "linear-gradient(90deg, #00C2FF, #0319CB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Trusted by Buyers
                </span>
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
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
                      <div className="text-sm font-semibold text-[#0F3D5E]">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/signup">
                  <Button className="bg-[#0319CB] hover:bg-[#0215a8] text-white font-bold px-6 shadow-lg hover:shadow-[#0319CB]/30 hover:shadow-xl transition-all duration-200">
                    Start Buying Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </RevealSection>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Secure Payments", desc: "All transactions verified via webhook", color: "#00C2FF" },
                { icon: Zap, title: "Instant Delivery", desc: "Automated fulfillment in seconds", color: "#0319CB" },
                { icon: Globe, title: "Global Access", desc: "Available in 150+ countries", color: "#00C2FF" },
                { icon: Star, title: "Premium Quality", desc: "Verified accounts, guaranteed", color: "#0319CB" },
              ].map((item, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="bg-white rounded-xl p-5 border border-slate-100 hover:border-[#00C2FF]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                      <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <h4 className="text-sm font-semibold text-[#0F3D5E] mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Payment Methods ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container">
          <RevealSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0F3D5E] mb-3">Global Payment Options</h2>
              <p className="text-slate-500">Pay your way with cards, bank transfer, or crypto</p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PAYMENT_METHODS.map((method, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white rounded-xl p-6 text-center border border-slate-100 hover:border-[#00C2FF]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 shadow-sm">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${method.color}15`, border: `1px solid ${method.color}25` }}>
                    <CreditCard className="h-6 w-6" style={{ color: method.color }} />
                  </div>
                  <h3 className="text-base font-bold text-[#0F3D5E] mb-1">{method.name}</h3>
                  <p className="text-sm text-slate-500 mb-2">{method.desc}</p>
                  <Badge className="text-xs" style={{ background: `${method.color}15`, color: method.color, border: `1px solid ${method.color}25` }}>
                    {method.region}
                  </Badge>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection>
            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                Currencies supported: <span className="text-[#0F3D5E] font-medium">NGN · USD · EUR · GBP · BTC · ETH · USDT</span>
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FAQ Preview ──────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #f0f8ff 0%, #ffffff 100%)" }}>
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <RevealSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#0F3D5E] mb-3">Frequently Asked Questions</h2>
                <p className="text-slate-500">Quick answers to common questions</p>
              </div>
            </RevealSection>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="bg-white rounded-xl p-5 border border-slate-100 hover:border-[#00C2FF]/40 hover:shadow-md transition-all duration-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-[#0F3D5E] mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/25 flex items-center justify-center text-[#0319CB] text-xs font-bold shrink-0">{i + 1}</span>
                      {item.q}
                    </h4>
                    <p className="text-sm text-slate-500 pl-7">{item.a}</p>
                  </div>
                </RevealSection>
              ))}
            </div>

            <RevealSection>
              <div className="text-center mt-8">
                <Link href="/faq">
                  <Button variant="outline" className="border-[#00C2FF] text-[#0319CB] hover:bg-[#00C2FF]/10 font-semibold">
                    View All FAQs <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── Become a Supplier ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <RevealSection>
              <Badge className="mb-4 bg-[#0319CB]/10 text-[#0319CB] border border-[#0319CB]/20 text-xs font-semibold px-3 py-1">
                SUPPLIER PROGRAM
              </Badge>
              <h2 className="text-4xl font-bold text-[#0F3D5E] mb-5 leading-tight">
                Become a <span className="text-[#00C2FF]">Bulnix</span> Supplier
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
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
                      <item.icon className="h-4 w-4 text-[#0319CB]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F3D5E]">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button size="lg" className="bg-[#0319CB] hover:bg-[#0215a8] text-white font-bold px-8 h-12 shadow-lg hover:shadow-[#0319CB]/30 hover:shadow-xl transition-all duration-200">
                  Apply to Become a Supplier
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </RevealSection>

            <RevealSection delay={120}>
              <div className="relative">
                <div className="bg-white rounded-2xl p-8 border border-[#00C2FF]/20 shadow-xl">
                  <h3 className="text-lg font-bold text-[#0F3D5E] mb-6">Why Suppliers Choose Bulnix</h3>
                  <div className="grid grid-cols-2 gap-5 mb-6">
                    {[
                      { value: "50K+", label: "Active Buyers", color: "#00C2FF" },
                      { value: "99.9%", label: "Platform Uptime", color: "#00C2FF" },
                      { value: "24h", label: "Onboarding Time", color: "#0319CB" },
                      { value: "0%", label: "Setup Fee", color: "#0319CB" },
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-4 rounded-xl" style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}20` }}>
                        <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {["Dedicated supplier dashboard", "Real-time order & payout tracking", "Automated order fulfillment", "Priority support channel"].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-[#00C2FF] shrink-0" />
                        <span className="text-sm text-slate-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[#0319CB]/8 rounded-full blur-[60px] pointer-events-none" />
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #0F3D5E 0%, #0319CB 50%, #0A2540 100%)" }}>
        <div className="container">
          <RevealSection>
            <div className="relative rounded-2xl overflow-hidden p-10 md:p-16 text-center">
              {/* Floating orbs inside CTA */}
              <div className="absolute top-4 left-[10%] w-20 h-20 rounded-full bg-white/5 blur-lg pointer-events-none animate-float" />
              <div className="absolute bottom-4 right-[10%] w-16 h-16 rounded-full bg-[#00C2FF]/10 blur-lg pointer-events-none animate-float-slow" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Ready to Buy at Scale?
                </h2>
                <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                  Join thousands of buyers on Bulnix. Create your free account and start purchasing premium digital products today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="bg-[#00C2FF] hover:bg-[#00aee0] text-[#0F3D5E] font-bold px-10 h-12 shadow-lg hover:shadow-[#00C2FF]/40 hover:shadow-xl transition-all duration-200">
                      Create Free Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 h-12 font-semibold">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
