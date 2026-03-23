import { useState } from "react";
import { Link } from "wouter";
import { Package, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

// Fallback emoji icons keyed by common category name keywords
const FALLBACK_ICONS: Record<string, string> = {
  facebook: "📘", instagram: "📸", twitter: "🐦", tiktok: "🎵",
  linkedin: "💼", youtube: "▶️", snapchat: "👻", reddit: "🤖",
  discord: "💬", telegram: "✈️", whatsapp: "💬", gmail: "📧",
  email: "📧", streaming: "🎬", netflix: "🎬", spotify: "🎵",
  gaming: "🎮", steam: "🎮", vpn: "🔒", proxy: "🔒",
  software: "🔑", crypto: "₿", bitcoin: "₿", education: "📚",
  social: "📱", accounts: "👤", tools: "🛠️",
};

function getCategoryIcon(cat: any): string | null {
  // Use imageUrl from DB if available
  return cat.imageUrl ?? null;
}

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
  const { data: categories, isLoading } = trpc.categories.listWithCounts.useQuery(undefined, { retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) });

  const allCats = (categories as any[] | undefined) ?? [];
  // Only show top-level (parentId null) categories, social media pinned to top
  const topLevel = allCats.filter((c: any) => !c.parentId);
  const socialCats = topLevel.filter((c: any) => SOCIAL_SLUGS.includes(c.slug)).sort((a: any, b: any) => SOCIAL_SLUGS.indexOf(a.slug) - SOCIAL_SLUGS.indexOf(b.slug));
  const otherCats = topLevel.filter((c: any) => !SOCIAL_SLUGS.includes(c.slug));
  const sortedTopLevel = [...socialCats, ...otherCats];
  const filtered = search
    ? sortedTopLevel.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()))
    : sortedTopLevel;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <Navbar />
      <div className="pt-24 pb-8 bg-gradient-to-b from-[#0F172A] to-[#0B0F19] border-b border-white/5">
        <div className="container">
          <h1 className="text-3xl font-bold text-white mb-1">All Categories</h1>
          <p className="text-slate-500">Browse our full catalog of digital products</p>
        </div>
      </div>

      <div className="container py-12">
        {/* Search */}
        <div className="relative max-w-sm mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="pl-9 bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9]"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(12)].map((_, i) => <div key={i} className="glass-card rounded-xl p-6 animate-pulse h-36" />)}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No categories found</h3>
            <p className="text-slate-500">Try a different search term or check back after a sync.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((cat: any) => {
              const iconUrl = getCategoryIcon(cat);
              const emoji = getCategoryEmoji(cat);
              // Count subcategories
              const subCount = allCats.filter((c: any) => c.parentId === cat.id).length;
              return (
                <Link key={cat.id} href={"/categories/" + cat.slug}>
                  <div className="glass-card rounded-xl p-6 cursor-pointer group hover:border-[#00B9E9]/30 transition-all duration-200 hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-xl bg-[#0F172A] border border-white/8 flex items-center justify-center mb-4 group-hover:border-[#00B9E9]/30 transition-colors overflow-hidden">
                      {iconUrl ? (
                        <img src={iconUrl} alt={cat.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <span className="text-3xl">{emoji}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white group-hover:text-[#00B9E9] transition-colors mb-1 line-clamp-2">{cat.name}</h3>
                    {subCount > 0 && (
                      <p className="text-xs text-slate-500 mb-0.5">{subCount} subcategories</p>
                    )}
                    {(cat.productCount ?? 0) > 0 && (
                      <p className="text-xs text-[#00B9E9]/70">{cat.productCount} products</p>
                    )}
                    {cat.description && !subCount && !(cat.productCount > 0) && (
                      <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs text-[#00B9E9] opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
