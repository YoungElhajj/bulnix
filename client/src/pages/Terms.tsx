import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import Footer from "@/components/Footer";
export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]">
      <SEO title="Terms of Service | Bulnix" description="Read the Bulnix Terms of Service. Understand your rights, responsibilities, and our policies when using the Bulnix digital accounts marketplace." canonical="https://bulnix.com/terms" />
      <Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-8"><div className="container"><h1 className="text-3xl font-bold text-white">Terms of Service</h1><p className="text-white/60 mt-1">Last updated: March 2026</p></div></div>
      <div className="container max-w-3xl mx-auto py-12 prose prose-invert prose-slate max-w-none">
        <div className="space-y-8 text-[#4A6080] leading-relaxed">
          {[{t:"1. Acceptance of Terms",c:"By accessing or using Bulnix, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform."},{t:"2. Digital Products",c:"All products sold on Bulnix are digital goods. Due to the nature of digital delivery, all sales are final once the product has been delivered to your account."},{t:"3. Account Responsibility",c:"You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account."},{t:"4. Prohibited Activities",c:"You may not use Bulnix for any illegal purpose, resell products in violation of supplier terms, attempt to circumvent payment systems, or engage in fraudulent activities."},{t:"5. Refund Policy",c:"Refunds are issued for undelivered orders or verified defective products. Requests must be submitted within 48 hours of purchase via our support system."},{t:"6. Limitation of Liability",c:"Bulnix is not liable for any indirect, incidental, or consequential damages arising from the use of our platform or purchased products."},{t:"7. Changes to Terms",c:"We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms."}].map((s,i)=>(
            <div key={i}><h2 className="text-xl font-bold text-[#0D2137] mb-3">{s.t}</h2><p>{s.c}</p></div>
          ))}
        </div>
      </div>
      <Footer/>
    </div>
  );
}
