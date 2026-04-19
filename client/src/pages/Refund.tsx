import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export default function Refund() {
  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-8"><div className="container"><h1 className="text-3xl font-bold text-white">Refund Policy</h1><p className="text-white/60 mt-1">Last updated: March 2026</p></div></div>
      <div className="container max-w-3xl mx-auto py-12">
        <div className="space-y-8 text-[#4A6080] leading-relaxed">
          {[{t:"Eligible Refunds",c:"You are eligible for a full refund if: your order was not delivered within 24 hours of payment, the delivered product is defective or invalid, or there was a duplicate charge on your account."},{t:"Non-Refundable Cases",c:"Refunds are not issued for: successfully delivered and working products, change of mind after delivery, or orders where the product was used or redeemed."},{t:"How to Request a Refund",c:"Open a support ticket from your dashboard within 48 hours of purchase. Include your order number and a description of the issue. Our team will review and respond within 4 hours."},{t:"Refund Processing Time",c:"Approved refunds are processed within 1-3 business days. The time to appear in your account depends on your payment method and bank."},{t:"Disputes",c:"If you believe a refund was incorrectly denied, you may escalate by emailing disputes@bulnix.com with your order details and supporting evidence."}].map((s,i)=>(
            <div key={i}><h2 className="text-xl font-bold text-[#0D2137] mb-3">{s.t}</h2><p>{s.c}</p></div>
          ))}
        </div>
      </div>
      <Footer/>
    </div>
  );
}
