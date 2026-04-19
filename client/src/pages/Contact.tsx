import { useState } from "react";
import { Mail, MessageSquare, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
          <div className="space-y-5">
            {[{icon:Mail,title:"Email Support",desc:"support@bulnix.com",sub:"Typically responds in 2-4 hours"},{icon:MessageSquare,title:"Live Chat",desc:"Available in dashboard",sub:"For registered users"},{icon:Clock,title:"Support Hours",desc:"Mon–Sat, 8am–10pm WAT",sub:"Sunday limited hours"}].map((c,i)=>(
              <div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#EEF4FF] flex items-center justify-center flex-shrink-0"><c.icon className="h-5 w-5 text-[#0050D0]"/></div>
                <div><div className="font-semibold text-[#0D2137] text-sm">{c.title}</div><div className="text-[#0050D0] text-sm mt-0.5">{c.desc}</div><div className="text-[#4A6080] text-xs mt-0.5">{c.sub}</div></div>
              </div>
            ))}
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
              <Button type="submit" className="w-full h-11 bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137] font-semibold" disabled={loading}>
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
