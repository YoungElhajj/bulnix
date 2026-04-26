import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { SEO, organizationSchema, websiteSchema } from "@/components/SEO";
import {
  ArrowRight, Zap, Shield, Globe, Star, ChevronRight, Package,
  CreditCard, Users, Clock, Lock, TrendingUp, CheckCircle,
  ShoppingBag, Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

// ─── Scroll-reveal (global, class-based) ─────────────────────────────────────
function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    // Small delay so dynamically rendered elements are in the DOM
    const timer = setTimeout(() => {
      const els = document.querySelectorAll(".reveal:not(.revealed)");
      const observer = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
        { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
      );
      els.forEach(el => observer.observe(el));
      // Also immediately reveal elements already in viewport
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add("revealed");
      });
      return () => observer.disconnect();
    }, 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + increment, target);
          setCount(Math.floor(current));
          if (current >= target) clearInterval(timer);
        }, 1800 / steps);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Social Icons ─────────────────────────────────────────────────────────────
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="url(#ig-grad)" className="w-6 h-6">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433"/>
        <stop offset="50%" stopColor="#dc2743"/>
        <stop offset="100%" stopColor="#bc1888"/>
      </linearGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="#000" className="w-6 h-6">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="#1877F2" className="w-6 h-6">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="#000" className="w-6 h-6">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="#25D366" className="w-6 h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="#FF0000" className="w-6 h-6">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// ─── Floating Icon ────────────────────────────────────────────────────────────
function FloatingIcon({ icon, label, className = "", animClass = "animate-float-y" }: {
  icon: React.ReactNode; label: string; className?: string; animClass?: string;
}) {
  return (
    <div className={`absolute ${animClass} ${className} z-10`}>
      <div className="w-12 h-12 rounded-2xl bg-white shadow-xl shadow-[#0F3D5E]/15 border border-[#D8E8F5] flex items-center justify-center">
        {icon}
      </div>
      <p className="text-center text-[10px] font-semibold text-[#4A6080] mt-1 whitespace-nowrap">{label}</p>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }: { icon: React.ReactNode; title: string; desc: string; delay?: number }) {
  return (
    <div
      className="reveal bg-white rounded-2xl p-6 border border-[#D8E8F5] shadow-sm hover:shadow-xl hover:shadow-[#00C2FF]/10 hover:-translate-y-1.5 transition-all duration-300 group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00C2FF]/15 to-[#0050D0]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-[#0D2137] font-semibold text-base mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
      <p className="text-[#4A6080] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

const SOCIAL_SLUGS = ["facebook-accounts","instagram-accounts","tiktok-accounts-followers","whatsapp-accounts","youtube-accounts-channels","twitter-x-accounts","telegram-accounts","snapchat-accounts","linkedin-accounts","google-voice-accounts","gmail-accounts","discord-accounts"];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { data: featuredProducts } = trpc.products.getFeatured.useQuery(undefined, {
    retry: 4, retryDelay: (a) => Math.min(2000 * 2 ** a, 15000)
  });
  const { data: categoriesData } = trpc.categories.listWithCounts.useQuery(undefined, {
    retry: 4, retryDelay: (a) => Math.min(2000 * 2 ** a, 15000)
  });

  // Re-run scroll reveal whenever data loads
  useScrollReveal([featuredProducts, categoriesData]);

  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);



  const heroStyle = (delay: number) => ({
    opacity: heroVisible ? 1 : 0,
    transform: heroVisible ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  });

  return (
    <div className="bg-[#F5F9FF] min-h-screen">
      <SEO
        title="Bulnix - Buy Premium Digital Accounts | Instagram, Facebook, TikTok & More"
        description="Buy premium digital accounts instantly on Bulnix. Instagram, Facebook, TikTok, Netflix, Spotify, gaming credits, VPN and 500+ more digital products. Secure payments, instant delivery, global access."
        canonical="https://bulnix.com"
        keywords="buy digital accounts, buy Instagram accounts, buy Facebook accounts, buy TikTok accounts, buy Netflix accounts, buy Spotify accounts, buy gaming accounts, buy VPN accounts, digital accounts marketplace, social media accounts for sale, buy streaming accounts, instant delivery digital accounts, reseller digital accounts, Bulnix"
        jsonLd={[organizationSchema(), websiteSchema()]}
      />
      <Navbar/>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
        {/* Background radial glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#00C2FF]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#0050D0]/6 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text */}
            <div>
              <div style={heroStyle(0)}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C2FF]/12 border border-[#00C2FF]/25 text-[#0050D0] text-sm font-semibold mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
                  Trusted by 10,000+ customers worldwide
                </div>
              </div>

              <div style={heroStyle(100)}>
                <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-[#0D2137] leading-[1.1] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Buy Premium{" "}
                  <span className="text-gradient-primary">Digital Accounts</span>{" "}
                  at Scale
                </h1>
              </div>

              <div style={heroStyle(200)}>
                <p className="text-[#4A6080] text-lg leading-relaxed mb-8 max-w-lg">
                  Social media accounts, streaming services, gaming credits and software licenses. All in one place. Instant delivery, secure payments, global access.
                </p>
              </div>

              <div style={heroStyle(300)}>
                <div className="flex flex-wrap gap-3 mb-10">
                  <Link href="/signup">
                    <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white font-bold rounded-full px-7 py-3 h-auto text-base shadow-lg shadow-[#0050D0]/30 hover:shadow-xl hover:shadow-[#0050D0]/40 transition-all duration-300 flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="outline" className="border-[#D8E8F5] bg-white text-[#0D2137] hover:border-[#00C2FF]/50 hover:bg-[#F0F8FF] font-semibold rounded-full px-7 py-3 h-auto text-base transition-all duration-300 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Browse Products
                    </Button>
                  </Link>
                  <a href="https://t.me/Bulnixlimited" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-[#229ED9]/40 bg-[#229ED9]/8 text-[#229ED9] hover:bg-[#229ED9] hover:text-white font-semibold rounded-full px-7 py-3 h-auto text-base transition-all duration-300 flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.04 9.613c-.15.666-.543.828-1.1.516l-3.04-2.24-1.466 1.41c-.162.162-.298.298-.61.298l.218-3.086 5.62-5.078c.244-.218-.054-.338-.378-.12L7.26 14.364l-2.98-.93c-.648-.203-.66-.648.135-.96l11.64-4.49c.54-.196 1.012.12.507.264z"/></svg>
                      Join Our Channel
                    </Button>
                  </a>
                </div>
              </div>

              <div style={heroStyle(400)}>
                <div className="flex items-center gap-6 flex-wrap">
                  {["Instant Delivery", "Secure Payments", "24/7 Support"].map(t => (
                    <div key={t} className="flex items-center gap-1.5 text-[#4A6080] text-sm">
                      <CheckCircle className="w-4 h-4 text-[#00C2FF]" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Illustration + Floating Social Icons */}
            <div className="relative flex items-center justify-center py-10 px-14 sm:py-12 sm:px-16" style={heroStyle(150)}>
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80">
                {/* Central card */}
                <div className="w-full h-full rounded-3xl bg-gradient-to-br from-[#0F3D5E] to-[#0050D0] shadow-2xl shadow-[#0050D0]/30 flex flex-col items-center justify-center p-8">
                  <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white font-bold text-xl text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>Bulnix Store</p>
                  <p className="text-white/60 text-sm text-center mt-1">Premium Digital Marketplace</p>
                  <div className="mt-4 flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/50 text-xs mt-1">4.9/5 from 2,400+ reviews</p>
                </div>

                {/* Floating social icons */}
                <FloatingIcon icon={<InstagramIcon />} label="Instagram" className="-top-8 -left-10" animClass="animate-float-y" />
                <FloatingIcon icon={<TikTokIcon />} label="TikTok" className="-top-4 -right-12" animClass="animate-float-slow" />
                <FloatingIcon icon={<FacebookIcon />} label="Facebook" className="top-1/2 -left-16 -translate-y-1/2" animClass="animate-float-reverse" />
                <FloatingIcon icon={<TwitterIcon />} label="Twitter/X" className="top-1/2 -right-16 -translate-y-1/2" animClass="animate-float-y" />
                <FloatingIcon icon={<WhatsAppIcon />} label="WhatsApp" className="-bottom-8 -left-10" animClass="animate-float-slow" />
                <FloatingIcon icon={<YouTubeIcon />} label="YouTube" className="-bottom-4 -right-12" animClass="animate-float-reverse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════════════════ */}
      <section className="py-14 bg-[#0F3D5E]" aria-labelledby="stats-heading">
        <div className="container">
          <h2 id="stats-heading" className="sr-only">Bulnix by the Numbers - Trusted Digital Accounts Marketplace</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Happy Customers", value: 10000, suffix: "+" },
              { label: "Products Available", value: 500, suffix: "+" },
              { label: "Orders Fulfilled", value: 50000, suffix: "+" },
              { label: "Countries Served", value: 80, suffix: "+" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES ════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 text-[#0050D0] text-sm font-semibold mb-4">
              <Package className="w-4 h-4" />
              Product Categories
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Everything Digital, All in One Place
            </h2>
            <p className="text-[#4A6080] max-w-xl mx-auto">
              From social media accounts to streaming services, gaming credits to software licenses. Whatever you need, we have it.
            </p>
          </div>

          {(() => {
            const allCats = (categoriesData as any[] | undefined ?? []).filter((c: any) => !c.parentId && (c.productCount ?? 0) > 0);
            const social = allCats.filter((c: any) => SOCIAL_SLUGS.includes(c.slug));
            const others = allCats.filter((c: any) => !SOCIAL_SLUGS.includes(c.slug));
            const sorted = [
              ...social.sort((a: any, b: any) => SOCIAL_SLUGS.indexOf(a.slug) - SOCIAL_SLUGS.indexOf(b.slug)),
              ...others,
            ].slice(0, 12);

            const fallback = [
              { name: "Instagram", icon: <InstagramIcon />, href: "/categories/instagram-accounts" },
              { name: "TikTok", icon: <TikTokIcon />, href: "/categories/tiktok-accounts-followers" },
              { name: "Facebook", icon: <FacebookIcon />, href: "/categories/facebook-accounts" },
              { name: "Twitter/X", icon: <TwitterIcon />, href: "/categories/twitter-x-accounts" },
              { name: "WhatsApp", icon: <WhatsAppIcon />, href: "/categories/whatsapp-accounts" },
              { name: "YouTube", icon: <YouTubeIcon />, href: "/categories/youtube-accounts-channels" },
              { name: "Streaming", icon: <span className="text-2xl">🎬</span>, href: "/categories/streaming" },
              { name: "Gaming", icon: <span className="text-2xl">🎮</span>, href: "/categories/gaming" },
              { name: "Software", icon: <span className="text-2xl">💻</span>, href: "/categories/software" },
              { name: "Email", icon: <span className="text-2xl">📧</span>, href: "/categories/gmail-accounts" },
              { name: "VPN", icon: <span className="text-2xl">🔒</span>, href: "/categories/vpn" },
              { name: "More →", icon: <span className="text-2xl">➕</span>, href: "/categories" },
            ];

            const items = sorted.length > 0 ? sorted : fallback;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map((cat: any, i: number) => (
                  <Link key={i} href={cat.href || `/categories/${cat.slug}`}>
                    <div className="reveal bg-white rounded-2xl p-5 border border-[#D8E8F5] shadow-sm hover:shadow-lg hover:shadow-[#00C2FF]/10 hover:-translate-y-1 hover:border-[#00C2FF]/40 transition-all duration-300 cursor-pointer group text-center"
                      style={{ transitionDelay: `${i * 40}ms` }}>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F0F8FF] to-[#E0F0FF] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-9 h-9 object-contain" />
                        ) : (
                          cat.icon || <span className="text-2xl">📦</span>
                        )}
                      </div>
                      <p className="text-[#0D2137] font-semibold text-sm line-clamp-2">{cat.name}</p>
                      {(cat.productCount ?? 0) > 0 && (
                        <p className="text-[#4A6080] text-xs mt-0.5">{cat.productCount}+ items</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            );
          })()}

          <div className="text-center mt-8 reveal">
            <Link href="/categories">
              <Button variant="outline" className="border-[#D8E8F5] bg-white text-[#0D2137] hover:border-[#00C2FF]/50 hover:bg-[#F0F8FF] font-semibold rounded-full px-8 transition-all duration-300">
                View All Categories
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 text-[#0050D0] text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              Why Choose Bulnix
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Built for Speed, Security & Scale
            </h2>
            <p className="text-[#4A6080] max-w-xl mx-auto">
              We've built the most reliable digital account marketplace with features that matter most to buyers and resellers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<Zap className="w-6 h-6 text-[#00C2FF]" />} title="Instant Delivery" desc="Orders are fulfilled automatically within seconds. No waiting, no manual processing. You get access right away." delay={0} />
            <FeatureCard icon={<Shield className="w-6 h-6 text-[#0050D0]" />} title="Secure Payments" desc="Multiple payment methods including Paystack, Monnify, and cryptocurrency. All transactions are SSL-encrypted." delay={100} />
            <FeatureCard icon={<Globe className="w-6 h-6 text-[#00C2FF]" />} title="Global Access" desc="Shop from anywhere in the world. We accept payments from 80+ countries with local payment options." delay={200} />
            <FeatureCard icon={<Package className="w-6 h-6 text-[#0050D0]" />} title="500+ Products" desc="A massive catalogue of digital accounts, services, and credentials across all major platforms and categories." delay={300} />
            <FeatureCard icon={<Users className="w-6 h-6 text-[#00C2FF]" />} title="Bulk Orders" desc="Perfect for resellers and agencies. Order in bulk with volume discounts and dedicated account management." delay={400} />
            <FeatureCard icon={<Headphones className="w-6 h-6 text-[#0050D0]" />} title="24/7 Support" desc="Our support team is available round the clock via WhatsApp, Telegram, and email to resolve any issues." delay={500} />
          </div>
        </div>
      </section>

      {/* ══ FEATURED PRODUCTS ═════════════════════════════════════════════════ */}
      {/* Featured products section removed — replaced by Categories section */}

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 text-[#0050D0] text-sm font-semibold mb-4">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Get Started in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Create Account", desc: "Sign up for free in seconds. No credit card required to browse.", icon: <Users className="w-6 h-6 text-[#00C2FF]" /> },
              { title: "Choose Product", desc: "Browse 500+ digital products across all major platforms and categories.", icon: <ShoppingBag className="w-6 h-6 text-[#0050D0]" /> },
              { title: "Instant Delivery", desc: "Complete payment and receive your order instantly in your dashboard.", icon: <Zap className="w-6 h-6 text-[#00C2FF]" /> },
            ].map((step, i) => (
              <div key={i} className="reveal text-center" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="relative inline-flex mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00C2FF]/15 to-[#0050D0]/10 border border-[#D8E8F5] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0050D0] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-[#0D2137] font-bold text-lg mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{step.title}</h3>
                <p className="text-[#4A6080] text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 text-[#0050D0] text-sm font-semibold mb-4">
              <Star className="w-4 h-4" />
              Customer Reviews
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              What Our Customers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Adebayo O.", role: "Reseller", text: "Bulnix has made my reselling business much easier. The instant delivery and bulk pricing are really good.", rating: 5 },
              { name: "Fatima K.", role: "Social Media Manager", text: "I've tried a few platforms and Bulnix has been the most consistent. Not had a failed order in 6 months.", rating: 5 },
              { name: "Emmanuel C.", role: "Digital Marketer", text: "The variety of products is incredible. From Instagram to streaming accounts, everything I need is here.", rating: 5 },
            ].map((review, i) => (
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-[#D8E8F5] shadow-sm" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <p className="text-[#4A6080] text-sm leading-relaxed mb-4">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00C2FF]/20 to-[#0050D0]/20 border border-[#D8E8F5] flex items-center justify-center text-[#0050D0] font-bold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-[#0D2137] font-semibold text-sm">{review.name}</p>
                    <p className="text-[#4A6080] text-xs">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PAYMENT METHODS ═══════════════════════════════════════════════════ */}
      <section className="py-14 bg-white border-t border-[#D8E8F5]">
        <div className="container">
          <div className="text-center mb-8 reveal">
            <p className="text-[#4A6080] text-sm font-medium">Accepted Payment Methods</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 reveal">
            {[
              { name: "Paystack", color: "#00C3F7" },
              { name: "Monnify", color: "#0066CC" },
              { name: "Crypto", color: "#F7931A" },
              { name: "Visa / Mastercard", color: "#0050D0" },
            ].map(pm => (
              <div key={pm.name} className="px-5 py-2.5 rounded-xl bg-[#F5F9FF] border border-[#D8E8F5] text-sm font-semibold" style={{ color: pm.color }}>
                {pm.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#0F3D5E] to-[#0050D0]">
        <div className="container text-center reveal">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Ready to Start Buying?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
            Join 10,000+ customers who trust Bulnix for their digital account needs. Sign up free today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup">
              <Button className="bg-[#00C2FF] hover:bg-[#00aee6] text-[#0F3D5E] font-bold rounded-full px-8 py-3 h-auto text-base shadow-lg shadow-[#00C2FF]/30 hover:shadow-xl transition-all duration-300">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 font-semibold rounded-full px-8 py-3 h-auto text-base transition-all duration-300">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* ══ SEO KEYWORD SECTION ══════════════════════════════════════════════ */}
      <section className="py-12 bg-[#F7FAFD] border-t border-[#E8F0F8]">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#0D2137] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Popular Digital Accounts &amp; Services</h2>
            <p className="text-[#4A6080] max-w-2xl mx-auto text-sm leading-relaxed">
              Bulnix is your one-stop marketplace to buy verified digital accounts at the best prices. Whether you need Instagram accounts, Facebook accounts, TikTok accounts, Netflix accounts, Spotify accounts, Discord accounts, Reddit accounts, Snapchat accounts, LinkedIn accounts, gaming accounts, VPN accounts, or streaming service subscriptions. We have them all with instant delivery.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
            {[
              { label: "Instagram Accounts", href: "/categories" },
              { label: "Facebook Accounts", href: "/categories" },
              { label: "TikTok Accounts", href: "/categories" },
              { label: "Netflix Accounts", href: "/categories" },
              { label: "Spotify Accounts", href: "/categories" },
              { label: "Discord Accounts", href: "/categories" },
              { label: "Reddit Accounts", href: "/categories" },
              { label: "Snapchat Accounts", href: "/categories" },
              { label: "LinkedIn Accounts", href: "/categories" },
              { label: "Gaming Credits", href: "/categories" },
              { label: "VPN Accounts", href: "/categories" },
              { label: "AI Tools Access", href: "/categories" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="block px-3 py-2 rounded-lg bg-white border border-[#E8F0F8] text-[#0050D0] text-xs font-medium hover:border-[#00C2FF]/50 hover:bg-[#F0F8FF] transition-all duration-200">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}
