import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link } from "wouter";
import { Package, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { SEO, breadcrumbSchema } from "@/components/SEO";

const FALLBACK_ICONS: Record<string, string> = {
  facebook: "📘", instagram: "📸", twitter: "🐦", tiktok: "🎵",
  linkedin: "💼", youtube: "▶️", snapchat: "👻", reddit: "🤖",
  discord: "💬", telegram: "✈️", whatsapp: "💬", gmail: "📧",
  email: "📧", streaming: "🎬", netflix: "🎬", spotify: "🎵",
  gaming: "🎮", steam: "🎮", vpn: "🔒", proxy: "🔒",
  software: "🔑", crypto: "₿", bitcoin: "₿", education: "📚",
  social: "📱", accounts: "👤", tools: "🛠️",
};

function getCategoryEmoji(cat: any): string {
  const name = (cat.name ?? "").toLowerCase();
  for (const [key, emoji] of Object.entries(FALLBACK_ICONS)) {
    if (name.includes(key)) return emoji;
  }
  return "📦";
}

const SOCIAL_SLUGS = ["facebook-accounts", "instagram-accounts", "tiktok-accounts-followers", "whatsapp-accounts", "youtube-accounts-channels", "twitter-x-accounts", "telegram-accounts", "snapchat-accounts", "linkedin-accounts", "google-voice-accounts", "gmail-accounts", "discord-accounts"];

export default function Categories() {
  const [search, setSearch] = useState("");
  const { data: categories, isLoading } = trpc.categories.listWithCounts.useQuery(undefined, {
    retry: 4, retryDelay: (a) => Math.min(2000 * 2 ** a, 15000)
  });

  const allCats = (categories as any[] | undefined) ?? [];
  const topLevel = allCats.filter((c: any) => !c.parentId && (c.productCount ?? 0) > 0);
  const socialCats = topLevel.filter((c: any) => SOCIAL_SLUGS.includes(c.slug)).sort((a: any, b: any) => SOCIAL_SLUGS.indexOf(a.slug) - SOCIAL_SLUGS.indexOf(b.slug));
  const otherCats = topLevel.filter((c: any) => !SOCIAL_SLUGS.includes(c.slug));
  const sortedTopLevel = [...socialCats, ...otherCats];
  const filtered = search
    ? sortedTopLevel.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()))
    : sortedTopLevel;

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <SEO
        title="All Categories | Buy Digital Accounts"
        description="Browse all digital account categories on Bulnix. Instagram, Facebook, TikTok, Netflix, Spotify, gaming, VPN, Discord, LinkedIn, Reddit and 20+ more categories. Instant delivery."
        canonical="https://bulnix.com/categories"
        keywords="buy digital accounts categories, Instagram accounts, Facebook accounts, TikTok accounts, Netflix accounts, Spotify accounts, gaming accounts, VPN accounts, Discord accounts, LinkedIn accounts, Reddit accounts"
        jsonLd={[breadcrumbSchema([{ name: "Home", url: "https://bulnix.com" }, { name: "Categories", url: "https://bulnix.com/categories" }])]}
      />
      <Navbar/>
      {/* Header */}
      <div className="bg-[#0F3D5E] pt-24 pb-10">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
            <Link href="/" className="hover:text-[#00C2FF] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">All Categories</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
            All Categories
          </h1>
          <p className="text-white/60">Browse our full catalog of digital products</p>
        </div>
      </div>

      <div className="container py-10">
        {/* Search */}
        <div className="relative max-w-sm mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A6080]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="pl-9 bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080]/60 focus:border-[#00C2FF] rounded-xl"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#D8E8F5] animate-pulse h-36" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-[#F0F8FF] border border-[#D8E8F5] flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-[#4A6080]" />
            </div>
            <h3 className="text-xl font-bold text-[#0D2137] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>No categories found</h3>
            <p className="text-[#4A6080]">Try a different search term or check back after a sync.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((cat: any) => {
              const iconUrl = cat.imageUrl ?? null;
              const emoji = getCategoryEmoji(cat);
              const subCount = allCats.filter((c: any) => c.parentId === cat.id).length;
              return (
                <Link key={cat.id} href={"/categories/" + cat.slug}>
                  <div className="bg-white rounded-2xl p-6 border border-[#D8E8F5] cursor-pointer group hover:border-[#00C2FF]/40 hover:shadow-lg hover:shadow-[#00C2FF]/10 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F0F8FF] to-[#E0EEFF] border border-[#D8E8F5] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt={cat.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const fallback = img.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      {(!iconUrl) ? (
                        <span className="text-3xl">{emoji}</span>
                      ) : (
                        <span className="text-3xl" style={{ display: 'none' }}>{emoji}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[#0D2137] group-hover:text-[#0050D0] transition-colors mb-1 line-clamp-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{cat.name}</h3>
                    {subCount > 0 && (
                      <p className="text-xs text-[#4A6080] mb-0.5">{subCount} subcategories</p>
                    )}
                    {(cat.productCount ?? 0) > 0 && (
                      <p className="text-xs text-[#0050D0] font-medium">{cat.productCount} products</p>
                    )}
                    {cat.description && !subCount && !(cat.productCount > 0) && (
                      <p className="text-xs text-[#4A6080] line-clamp-2">{cat.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs text-[#00C2FF] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
