import { Link } from "wouter";
import { Package, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

const CATEGORY_ICONS: Record<string, string> = {
  "social": "📱", "streaming": "🎬", "gaming": "🎮", "email": "📧",
  "vpn": "🔒", "software": "🔑", "crypto": "₿", "education": "📚",
};

export default function Categories() {
  const { data: categories, isLoading } = trpc.categories.list.useQuery(undefined, { retry: false });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar/>
      <div className="pt-24 pb-8 bg-gradient-to-b from-[#0F172A] to-[#0B0F19] border-b border-white/5">
        <div className="container">
          <h1 className="text-3xl font-bold text-white mb-1">All Categories</h1>
          <p className="text-slate-500">Browse our full catalog of digital products</p>
        </div>
      </div>
      <div className="container py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_,i) => <div key={i} className="glass-card rounded-xl p-6 animate-pulse h-32"/>)}
          </div>
        ) : !categories?.length ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-slate-700 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-white mb-2">No categories yet</h3>
            <p className="text-slate-500">Categories will appear here once products are synced from suppliers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {(categories as any[]).map((cat: any) => (
              <Link key={cat.id} href={"/categories/" + cat.slug}>
                <div className="glass-card rounded-xl p-6 cursor-pointer group hover:border-[#00B9E9]/30 transition-all duration-200 hover:-translate-y-1">
                  <div className="text-4xl mb-4">{CATEGORY_ICONS[cat.slug?.split("-")[0]] ?? "📦"}</div>
                  <h3 className="font-semibold text-white group-hover:text-[#00B9E9] transition-colors mb-1">{cat.name}</h3>
                  {cat.description && <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>}
                  <div className="flex items-center gap-1 mt-3 text-xs text-[#00B9E9] opacity-0 group-hover:opacity-100 transition-opacity">
                    Browse <ChevronRight className="h-3 w-3"/>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
