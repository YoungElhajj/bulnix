import { useState } from "react";
import { Mail, MessageSquare, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#25D366]">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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
  },
  {
    icon: WhatsAppIcon as any,
    title: "WhatsApp Support",
    desc: "+44 7367 061279",
    sub: "UK support line — tap to chat",
    href: "https://wa.me/447367061279",
    iconColor: "text-[#25D366]",
    isCustomIcon: true,
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    desc: "Available in dashboard",
    sub: "For registered users",
    href: null,
    iconColor: "text-[#0050D0]",
  },
  {
    icon: Clock,
    title: "Support Hours",
    desc: "Mon to Sat, 8am to 10pm WAT",
    sub: "Sunday hours are limited",
    href: null,
    iconColor: "text-[#0050D0]",
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
