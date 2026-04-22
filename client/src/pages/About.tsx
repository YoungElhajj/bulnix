import { Shield, Zap, Globe, Users, Target, Award } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LOGO_URL = "https://static-assets.manus.space/manus-storage/bulnix-new-logo_9cb6900b.jpg";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-16">
        <div className="container max-w-4xl mx-auto text-center">
          <img src={LOGO_URL} alt="Bulnix" className="h-16 w-auto mx-auto mb-8"/>
          <h1 className="text-4xl font-bold text-white mb-4">The Central Hub for Bulk Digital Supply</h1>
          <p className="text-xl text-white/70 leading-relaxed">Bulnix (Bulk + Nexus) connects buyers to thousands of verified digital products including social media accounts, streaming services, gaming credits, and more, with instant delivery and global payment support.</p>
        </div>
      </div>
      <div className="container max-w-5xl mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[{icon:Target,title:"Our Mission",desc:"To make digital product procurement fast, secure, and accessible to everyone from individual buyers to enterprise resellers."},{icon:Shield,title:"Our Values",desc:"Trust, transparency, and security are at the core of everything we do. Every supplier is vetted. Every payment is protected."},{icon:Globe,title:"Our Reach",desc:"Serving customers across Africa, Europe, and globally with support for NGN, USD, EUR, and GBP currencies."}].map((v,i)=>(
            <div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4"><v.icon className="h-6 w-6 text-[#0050D0]"/></div>
              <h3 className="font-bold text-[#0D2137] mb-2">{v.title}</h3>
              <p className="text-[#4A6080] text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0D2137] mb-4">Ready to get started?</h2>
          <div className="flex gap-4 justify-center">
            <Link href="/products"><Button className="bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137] px-8">Browse Products</Button></Link>
            <Link href="/contact"><Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF] px-8">Contact Us</Button></Link>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
