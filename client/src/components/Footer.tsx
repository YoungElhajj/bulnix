import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/447916699429";
const TELEGRAM_URL = "https://t.me/bulnix";
const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

// Modern brand icons
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

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="4" fill="#1877F2"/>
    <path d="M16.5 8H14c-.3 0-.5.2-.5.5V10h3l-.4 2.5H13.5V19h-3v-6.5H9V10h1.5V8.5C10.5 6.6 11.9 5 14 5h2.5v3z" fill="white"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="4" fill="#000"/>
    <path d="M17.5 4.5h2.5l-5.5 6.3 6.5 8.7H16l-4-5.3-4.5 5.3H5l5.8-6.8L4.5 4.5H9l3.6 4.8 4.9-4.8zm-.9 13.5h1.4L7.4 6H5.9l10.7 12z" fill="white"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="4" fill="#FF0000"/>
    <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="white"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="4" fill="#0077B5"/>
    <path d="M7 9h2v8H7V9zm1-3a1.2 1.2 0 110 2.4A1.2 1.2 0 018 6zm4 3h2v1.1c.4-.7 1.2-1.3 2.3-1.3 2.2 0 2.7 1.5 2.7 3.4V17h-2v-4.4c0-.9-.3-1.6-1.2-1.6-1 0-1.5.7-1.5 1.8V17h-2V9z" fill="white"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="12" fill="#229ED9"/>
    <path d="M5 12l3 1.5 1.5 4 2.5-3 4 2.5L19 6 5 12z" fill="white"/>
    <path d="M8 13.5l.5 3.5 2-2.5" fill="white" opacity=".7"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="12" fill="#25D366"/>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="white"/>
  </svg>
);

const socialLinks = [
  { name: "Instagram", href: "https://instagram.com/bulnix", icon: <InstagramIcon /> },
  { name: "Facebook", href: "https://facebook.com/bulnix", icon: <FacebookIcon /> },
  { name: "Twitter / X", href: "https://x.com/bulnix", icon: <TwitterXIcon /> },
  { name: "YouTube", href: "https://youtube.com/@bulnix", icon: <YouTubeIcon /> },
  { name: "LinkedIn", href: "https://linkedin.com/company/bulnix", icon: <LinkedInIcon /> },
  { name: "Telegram", href: TELEGRAM_URL, icon: <TelegramIcon /> },
  { name: "WhatsApp", href: WHATSAPP_URL, icon: <WhatsAppIcon /> },
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
            {/* Modern social icons row */}
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
