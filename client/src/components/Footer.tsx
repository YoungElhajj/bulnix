import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

// Social icons — Instagram, X, TikTok only
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <defs>
      <linearGradient id="ig-grad-footer" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#FCAF45"/>
        <stop offset="50%" stopColor="#F77737"/>
        <stop offset="75%" stopColor="#F56040"/>
        <stop offset="100%" stopColor="#C13584"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" fill="url(#ig-grad-footer)"/>
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="4" fill="#000"/>
    <path d="M17.5 4.5h2.5l-5.5 6.3 6.5 8.7H16l-4-5.3-4.5 5.3H5l5.8-6.8L4.5 4.5H9l3.6 4.8 4.9-4.8zm-.9 13.5h1.4L7.4 6H5.9l10.7 12z" fill="white"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="4" fill="#010101"/>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" fill="white"/>
  </svg>
);

const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/bulnix_", icon: <InstagramIcon /> },
  { name: "Twitter / X", href: "https://x.com/Bulnix_", icon: <TwitterXIcon /> },
  { name: "TikTok", href: "https://www.tiktok.com/@bulnix_", icon: <TikTokIcon /> },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#0A1628] text-white">
      {/* Main Footer Grid */}
      <div className="container py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1: Help & Information */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">Help &amp; Information</h4>
            <ul className="space-y-3">
              {[
                { label: "Terms &amp; Conditions", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Refund Policy", href: "/refund" },
                { label: "FAQ", href: "/faq" },
                { label: "Contact Us", href: "/contact" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors" dangerouslySetInnerHTML={{ __html: l.label }} />
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: About Us */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">About Us</h4>
            <ul className="space-y-3">
              {[
                { label: "Who We Are", href: "/about" },
                { label: "What We Provide", href: "/about#services" },
                { label: "Become a Partner", href: "/contact#partner" },
                { label: "Careers", href: "/contact#careers" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Menu */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">Menu</h4>
            <ul className="space-y-3">
              {[
                { label: "Home", href: "/" },
                { label: "Browse Products", href: "/products" },
                { label: "Categories", href: "/categories" },
                { label: "Sign Up", href: "/signup" },
                { label: "Sign In", href: "/login" },
                { label: "My Dashboard", href: "/dashboard" },
                { label: "My Orders", href: "/orders" },
                { label: "My Wallet", href: "/wallet" },
                { label: "Support Tickets", href: "/tickets" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Brand + Newsletter */}
          <div>
            <Link href="/" className="inline-flex items-center mb-4">
              <img src={LOGO_URL} alt="Bulnix" className="h-11 w-auto object-contain rounded-xl" style={{ maxWidth: 160 }} />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Your go-to platform for premium digital accounts, social media services, streaming subscriptions, and gaming credits. Instant delivery, secure payments, trusted worldwide.
            </p>

            {/* Newsletter */}
            <div className="mb-5">
              {subscribed ? (
                <div className="flex items-center gap-2 text-[#00C2FF] text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  You're subscribed!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="youremail@gmail.com"
                    required
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#00C2FF]/60 transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-white hover:bg-[#00C2FF] text-[#0A1628] hover:text-[#0A1628] font-bold text-sm transition-colors flex items-center gap-1"
                  >
                    Submit
                  </button>
                </form>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Shield className="h-3.5 w-3.5 text-[#00C2FF]" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Zap className="h-3.5 w-3.5 text-[#00C2FF]" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Globe className="h-3.5 w-3.5 text-[#00C2FF]" />
                <span>Global Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              &copy; {new Date().getFullYear()} Copyright By Bulnix. All rights reserved.
            </p>
            {/* Social icons row — Instagram, X, TikTok */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {socialLinks.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
