import { Shield, Zap, Globe, Users, Target, Award } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LOGO_URL = "/manus-storage/bulnix-primary-logo_0bd2bde3.jpeg";

export default function About() {
  return (
    <div className="min-h-screen bg-[#061A2B] text-white"><Navbar/>
      <div className="pt-24 pb-16 bg-gradient-to-b from-[#0A2540] to-[#061A2B] border-b border-white/5">
        <div className="container max-w-4xl mx-auto text-center">
          <img src={LOGO_URL} alt="Bulnix" className="h-16 w-auto mx-auto mb-8"/>
          <h1 className="text-4xl font-bold text-white mb-4">The Central Hub for Bulk Digital Supply</h1>
          <p className="text-xl text-slate-400 leading-relaxed">Bulnix (Bulk + Nexus) connects buyers to thousands of verified digital products including social media accounts, streaming services, gaming credits, and more, with instant delivery and global payment support.</p>
        </div>
      </div>
      <div className="container max-w-5xl mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[{icon:Target,title:"Our Mission",desc:"To make digital product procurement fast, secure, and accessible to everyone from individual buyers to enterprise resellers."},{icon:Shield,title:"Our Values",desc:"Trust, transparency, and security are at the core of everything we do. Every supplier is vetted. Every payment is protected."},{icon:Globe,title:"Our Reach",desc:"Serving customers across Africa, Europe, and globally with support for NGN, USD, EUR, and GBP currencies."}].map((v,i)=>(
            <div key={i} className="glass-card rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#00C2FF]/10 flex items-center justify-center mx-auto mb-4"><v.icon className="h-6 w-6 text-[#00C2FF]"/></div>
              <h3 className="font-bold text-white mb-2">{v.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
          <div className="flex gap-4 justify-center">
            <Link href="/products"><Button className="bg-[#00C2FF] hover:bg-[#00a8d4] text-white px-8">Browse Products</Button></Link>
            <Link href="/contact"><Button variant="outline" className="border-[#0F3D5E] text-slate-300 hover:text-white hover:bg-[#0F3D5E]/30 px-8">Contact Us</Button></Link>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
