import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export default function Terms() {
  return (
    <div className="min-h-screen bg-[#061A2B] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5"><div className="container"><h1 className="text-3xl font-bold text-white">Terms of Service</h1><p className="text-slate-500 mt-1">Last updated: March 2026</p></div></div>
      <div className="container max-w-3xl mx-auto py-12 prose prose-invert prose-slate max-w-none">
        <div className="space-y-8 text-slate-300 leading-relaxed">
          {[{t:"1. Acceptance of Terms",c:"By accessing or using Bulnix, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform."},{t:"2. Digital Products",c:"All products sold on Bulnix are digital goods. Due to the nature of digital delivery, all sales are final once the product has been delivered to your account."},{t:"3. Account Responsibility",c:"You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account."},{t:"4. Prohibited Activities",c:"You may not use Bulnix for any illegal purpose, resell products in violation of supplier terms, attempt to circumvent payment systems, or engage in fraudulent activities."},{t:"5. Refund Policy",c:"Refunds are issued for undelivered orders or verified defective products. Requests must be submitted within 48 hours of purchase via our support system."},{t:"6. Limitation of Liability",c:"Bulnix is not liable for any indirect, incidental, or consequential damages arising from the use of our platform or purchased products."},{t:"7. Changes to Terms",c:"We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms."}].map((s,i)=>(
            <div key={i}><h2 className="text-xl font-bold text-white mb-3">{s.t}</h2><p>{s.c}</p></div>
          ))}
        </div>
      </div>
      <Footer/>
    </div>
  );
}
