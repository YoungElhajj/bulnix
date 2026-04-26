import { useState } from "react";
import { Mail, MessageSquare, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SocialFloatingWidgets from "@/components/SocialFloatingWidgets";

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#229ED9]">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#25D366]">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  // chatOpen: null = closed, "whatsapp" = open with WhatsApp channel, "telegram" = open with Telegram channel, "chat" = generic live chat
  const [chatOpen, setChatOpen] = useState<null | "whatsapp" | "telegram" | "chat">(null);

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
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]">
      <Navbar/>

      {/* Hero */}
      <div className="bg-[#0F3D5E] pt-24 pb-12">
        <div className="container text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Contact Us</h1>
          <p className="text-white/60">We're here to help. Reach out anytime.</p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">

          {/* Contact cards column */}
          <div className="space-y-4">

            {/* Email */}
            <a href="mailto:bulnixsupport@gmail.com" className="block bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 flex items-start gap-4 hover:border-[#0050D0]/40 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-[#0050D0]" />
              </div>
              <div>
                <div className="font-semibold text-[#0D2137] text-sm">Email Support</div>
                <div className="text-[#0050D0] text-sm mt-0.5">bulnixsupport@gmail.com</div>
                <div className="text-[#4A6080] text-xs mt-0.5">Usually responds within 2 to 4 hours</div>
              </div>
            </a>

            {/* WhatsApp — opens triage chatbot, routes to WhatsApp at end */}
            <button
              onClick={() => setChatOpen("whatsapp")}
              className="w-full text-left bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 flex items-start gap-4 hover:border-[#25D366]/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F0FFF4] flex items-center justify-center flex-shrink-0 group-hover:bg-[#dcfce7] transition-colors">
                <WhatsAppIcon />
              </div>
              <div>
                <div className="font-semibold text-[#0D2137] text-sm flex items-center gap-2">
                  WhatsApp Support
                  <span className="text-[10px] bg-[#25D366]/10 text-[#25D366] font-semibold px-1.5 py-0.5 rounded-full">Fastest</span>
                </div>
                <div className="text-[#4A6080] text-xs mt-0.5">Answer a few quick questions, then chat on WhatsApp</div>
              </div>
            </button>

            {/* Telegram — opens triage chatbot, routes to Telegram at end */}
            <button
              onClick={() => setChatOpen("telegram")}
              className="w-full text-left bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 flex items-start gap-4 hover:border-[#229ED9]/40 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EFF8FF] flex items-center justify-center flex-shrink-0 group-hover:bg-[#dbeafe] transition-colors">
                <TelegramIcon />
              </div>
              <div>
                <div className="font-semibold text-[#0D2137] text-sm">Telegram Support</div>
                <div className="text-[#4A6080] text-xs mt-0.5">Answer a few quick questions, then chat on Telegram</div>
              </div>
            </button>

            {/* Live Chat — opens floating widget (generic, shows channel choice at end) */}
            <button
              onClick={() => setChatOpen("chat")}
              className="w-full text-left bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 flex items-start gap-4 hover:border-[#0050D0]/40 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EEF4FF] flex items-center justify-center flex-shrink-0 group-hover:bg-[#dbeafe] transition-colors">
                <MessageSquare className="h-5 w-5 text-[#0050D0]" />
              </div>
              <div>
                <div className="font-semibold text-[#0D2137] text-sm flex items-center gap-2">
                  Live Chat
                  <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"></span>
                    Online
                  </span>
                </div>
                <div className="text-[#0050D0] text-sm mt-0.5">Start a live chat now</div>
                <div className="text-[#4A6080] text-xs mt-0.5">We'll guide you to the right channel</div>
              </div>
            </button>

            {/* Support Hours */}
            <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-[#0050D0]" />
              </div>
              <div>
                <div className="font-semibold text-[#0D2137] text-sm">Support Hours</div>
                <div className="text-[#0050D0] text-sm mt-0.5">Mon to Sat, 8am to 10pm WAT</div>
                <div className="text-[#4A6080] text-xs mt-0.5">Sunday hours are limited</div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2 bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-8">
            <h2 className="text-xl font-bold text-[#0D2137] mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#4A6080] text-sm mb-1.5 block">Name *</Label>
                  <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/>
                </div>
                <div>
                  <Label className="text-[#4A6080] text-sm mb-1.5 block">Email *</Label>
                  <Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="your@email.com" className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/>
                </div>
              </div>
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Subject</Label>
                <Input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="How can we help?" className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/>
              </div>
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Message *</Label>
                <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={5} placeholder="Describe your issue or question..." className="w-full bg-white border border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] rounded-lg p-3 text-sm resize-none outline-none transition-colors"/>
              </div>
              <Button type="submit" className="w-full h-11 bg-[#0050D0] hover:bg-[#0040b0] text-white font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
                Send Message
              </Button>
            </form>
          </div>
        </div>

        {/* Quick action banner */}
        <div className="max-w-5xl mx-auto mt-8 bg-gradient-to-r from-[#0050D0] to-[#0F3D5E] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white text-center sm:text-left">
            <div className="font-bold text-lg">Need instant help?</div>
            <div className="text-white/70 text-sm mt-1">Our team is online. Start a quick chat and we'll connect you right away.</div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => setChatOpen("whatsapp")}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <WhatsAppIcon />
              WhatsApp
            </button>
            <button
              onClick={() => setChatOpen("telegram")}
              className="flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a8fc4] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <TelegramIcon />
              Telegram
            </button>
          </div>
        </div>
      </div>

      <Footer/>
      {/* Triage chatbot — preferredChannel controls which platform to use at the end */}
      <SocialFloatingWidgets
        forceOpen={chatOpen !== null}
        preferredChannel={chatOpen === "whatsapp" ? "whatsapp" : chatOpen === "telegram" ? "telegram" : undefined}
        onClose={() => setChatOpen(null)}
      />
    </div>
  );
}
