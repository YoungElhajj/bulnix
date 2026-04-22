import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-8"><div className="container"><h1 className="text-3xl font-bold text-white">Privacy Policy</h1><p className="text-white/60 mt-1">Last updated: March 2026</p></div></div>
      <div className="container max-w-3xl mx-auto py-12">
        <div className="space-y-8 text-[#4A6080] leading-relaxed">
          {[{t:"Information We Collect",c:"We collect information you provide (name, email, country), transaction data (order history, payment references), and technical data (IP address, browser type) for security and fraud prevention."},{t:"How We Use Your Information",c:"Your information is used to process orders, provide customer support, send order notifications, improve our services, and comply with legal obligations."},{t:"Data Security",c:"We use industry-standard encryption (SSL/TLS) for all data transmission. Payment details are processed by our gateway partners and never stored on our servers."},{t:"Third-Party Services",c:"We use Paystack, Monnify, and crypto payment gateways to process payments. These services have their own privacy policies. We do not sell your personal data to third parties."},{t:"Your Rights",c:"You have the right to access, correct, or delete your personal data. Contact us at bulnixsupport@gmail.com to exercise these rights."},{t:"Cookies",c:"We use essential cookies for authentication and session management. Analytics cookies are used to improve user experience. You can disable non-essential cookies in your browser settings."}].map((s,i)=>(
            <div key={i}><h2 className="text-xl font-bold text-[#0D2137] mb-3">{s.t}</h2><p>{s.c}</p></div>
          ))}
        </div>
      </div>
      <Footer/>
    </div>
  );
}
