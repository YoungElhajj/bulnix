import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FAQS = [
  { cat: "Orders", q: "How fast is delivery?", a: "Most digital orders are fulfilled within seconds to minutes after payment confirmation. Some products may take up to 30 minutes during high demand." },
  { cat: "Orders", q: "What happens if my order fails?", a: "Failed orders are automatically retried up to 3 times. If still unresolved, you will receive a full refund within 24 hours and a support ticket will be opened." },
  { cat: "Payments", q: "What payment methods do you accept?", a: "We accept card payments via Paystack, bank transfers via Monnify (Nigeria), and 50+ cryptocurrencies via our crypto gateway. More methods coming soon." },
  { cat: "Payments", q: "What currencies are supported?", a: "We support NGN, USD, EUR, and GBP. Your preferred currency can be set in your account settings." },
  { cat: "Payments", q: "Is my payment information secure?", a: "Yes. We never store card details. All payments are processed through PCI-DSS compliant gateways with SSL encryption and webhook verification." },
  { cat: "Products", q: "Are the digital accounts genuine?", a: "Yes. All products are sourced from verified suppliers. We perform quality checks and offer replacements for any defective accounts." },
  { cat: "Products", q: "Can I buy in bulk?", a: "Yes. You can add multiple quantities of any product to your cart. For very large orders, contact our support team for bulk pricing." },
  { cat: "Account", q: "Do I need an account to purchase?", a: "Yes, an account is required to track your orders and access delivery details. Registration is free and takes under 30 seconds." },
  { cat: "Account", q: "How do I access my purchased accounts?", a: "After payment confirmation, your delivery details appear in the Order Detail page under My Orders in your dashboard." },
  { cat: "Support", q: "How do I contact support?", a: "Open a support ticket from your dashboard or visit the Contact page. We respond within 2-4 hours on average." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number|null>(null);
  const [search, setSearch] = useState("");
  const filtered = FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));
  const cats = Array.from(new Set(filtered.map(f => f.cat)));

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar/>
      <div className="pt-24 pb-12 bg-gradient-to-b from-[#0F172A] to-[#0B0F19] border-b border-white/5">
        <div className="container max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-slate-500 mb-8">Everything you need to know about Bulnix</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500"/>
            <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions..." className="pl-12 bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] h-12 text-base"/>
          </div>
        </div>
      </div>
      <div className="container max-w-3xl mx-auto py-12">
        {cats.map(cat => (
          <div key={cat} className="mb-10">
            <h2 className="text-sm font-bold text-[#00B9E9] uppercase tracking-widest mb-4">{cat}</h2>
            <div className="space-y-3">
              {filtered.filter(f=>f.cat===cat).map((faq, i) => {
                const idx = FAQS.indexOf(faq);
                return (
                  <div key={i} className="glass-card rounded-xl overflow-hidden">
                    <button className="w-full flex items-center justify-between p-5 text-left" onClick={()=>setOpen(open===idx?null:idx)}>
                      <span className="font-semibold text-white pr-4">{faq.q}</span>
                      {open===idx ? <ChevronUp className="h-5 w-5 text-[#00B9E9] flex-shrink-0"/> : <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0"/>}
                    </button>
                    {open===idx && <div className="px-5 pb-5 text-slate-400 leading-relaxed text-sm border-t border-white/5 pt-4">{faq.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500">No results found for "{search}"</div>}
      </div>
      <Footer/>
    </div>
  );
}
