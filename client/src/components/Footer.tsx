import { Link } from "wouter";
import { Twitter, MessageCircle, Mail, Shield, Zap, Globe } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/bulnix-logo_f53aba21.png";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#080c14]">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src={LOGO_URL} alt="Bulnix" className="h-8 w-auto" />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              The central hub for bulk digital supply. Premium accounts, instant delivery, trusted worldwide.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#00B9E9] hover:border-[#00B9E9]/30 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#00B9E9] hover:border-[#00B9E9]/30 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href="mailto:support@bulnix.com" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#00B9E9] hover:border-[#00B9E9]/30 transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Marketplace</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Browse Products", href: "/products" },
                { label: "Categories", href: "/categories" },
                { label: "Featured Deals", href: "/products?featured=true" },
                { label: "New Arrivals", href: "/products?sort=newest" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Sign Up", href: "/signup" },
                { label: "Sign In", href: "/login" },
                { label: "My Dashboard", href: "/dashboard" },
                { label: "My Orders", href: "/orders" },
                { label: "Support Tickets", href: "/tickets" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support & Legal</h4>
            <ul className="space-y-2.5">
              {[
                { label: "FAQ", href: "/faq" },
                { label: "Contact Us", href: "/contact" },
                { label: "About Bulnix", href: "/about" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Refund Policy", href: "/refund" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Shield className="h-4 w-4 text-[#22C55E]" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Zap className="h-4 w-4 text-[#00B9E9]" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Globe className="h-4 w-4 text-[#00B9E9]" />
                <span>Global Payments</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {["Paystack", "Monnify", "Crypto"].map(method => (
                <span key={method} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-slate-500 text-xs font-medium">
                  {method}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} Bulnix. All rights reserved. Bulnix is a reseller marketplace — not affiliated with any product brands.
          </div>
        </div>
      </div>
    </footer>
  );
}
