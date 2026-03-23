import { Link } from "wouter";
import { Twitter, Mail, Shield, Zap, Globe, Send } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/message/BULNIX"; // TODO: replace with real WhatsApp link
const TELEGRAM_URL = "https://t.me/bulnix"; // TODO: replace with real Telegram channel link

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
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#00B9E9] hover:border-[#00B9E9]/30 transition-colors" title="Twitter/X">
                <Twitter className="h-4 w-4" />
              </a>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#229ED9] hover:border-[#229ED9]/30 transition-colors" title="Telegram Channel">
                <Send className="h-4 w-4" />
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#25D366] hover:border-[#25D366]/30 transition-colors" title="WhatsApp Support">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="mailto:support@bulnix.com" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#00B9E9] hover:border-[#00B9E9]/30 transition-colors" title="Email Support">
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

          {/* Community */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Community</h4>
            <ul className="space-y-2.5">
              <li>
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-500 hover:text-[#229ED9] text-sm transition-colors">
                  <Send className="h-3.5 w-3.5" />
                  Join Telegram Channel
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-500 hover:text-[#25D366] text-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp Support
                </a>
              </li>
              <li>
                <a href="mailto:support@bulnix.com" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  Email Support
                </a>
              </li>
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
            &copy; {new Date().getFullYear()} Bulnix. All rights reserved. Bulnix is a reseller marketplace and is not affiliated with any product brands.
          </div>
        </div>
      </div>
    </footer>
  );
}
