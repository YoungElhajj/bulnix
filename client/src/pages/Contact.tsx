import { useState } from "react";
import { Mail, MessageSquare, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#229ED9]">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const contactCards = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "bulnixsupport@gmail.com",
    sub: "Usually responds within 2 to 4 hours",
    href: "mailto:bulnixsupport@gmail.com",
    iconColor: "text-[#0050D0]",
    isCustomIcon: false,
  },
  {
    icon: TelegramIcon as any,
    title: "Telegram Support",
    desc: "@Bulnixlimited",
    sub: "Message us directly on Telegram",
    href: "https://t.me/Bulnixlimited",
    iconColor: "text-[#229ED9]",
    isCustomIcon: true,
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    desc: "Available in dashboard",
    sub: "For registered users",
    href: null,
    iconColor: "text-[#0050D0]",
    isCustomIcon: false,
  },
  {
    icon: Clock,
    title: "Support Hours",
    desc: "Mon to Sat, 8am to 10pm WAT",
    sub: "Sunday hours are limited",
    href: null,
    iconColor: "text-[#0050D0]",
    isCustomIcon: false,
  },
];

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error("Please fill all required fields"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success("Message sent! We'll respond within 2-4 hours.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-12">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Contact Us</h1>
          <p className="text-white/60">We're here to help. Reach out anytime.</p>
        </div>
      </div>
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            {contactCards.map((c, i) => {
              const cardContent = (
                <div key={i} className={`bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 flex items-start gap-4 ${c.href ? "hover:border-[#0050D0]/40 hover:shadow-md transition-all cursor-pointer" : ""}`}>
                  <div className="w-10 h-10 rounded-lg bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                    {c.isCustomIcon
                      ? <c.icon />
                      : <c.icon className={`h-5 w-5 ${c.iconColor}`} />
                    }
                  </div>
                  <div>
                    <div className="font-semibold text-[#0D2137] text-sm">{c.title}</div>
                    <div className="text-[#0050D0] text-sm mt-0.5">{c.desc}</div>
                    <div className="text-[#4A6080] text-xs mt-0.5">{c.sub}</div>
                  </div>
                </div>
              );
              return c.href
                ? <a key={i} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{cardContent}</a>
                : <div key={i}>{cardContent}</div>;
            })}
          </div>
          <div className="lg:col-span-2 bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-8">
            <h2 className="text-xl font-bold text-[#0D2137] mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Name *</Label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/></div>
                <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Email *</Label><Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="your@email.com" className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/></div>
              </div>
              <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Subject</Label><Input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="How can we help?" className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/></div>
              <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Message *</Label><textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={5} placeholder="Describe your issue or question..." className="w-full bg-white border border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] rounded-lg p-3 text-sm resize-none outline-none transition-colors"/></div>
              <Button type="submit" className="w-full h-11 bg-[#0050D0] hover:bg-[#0040b0] text-white font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>} Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
