import re

with open('server/connectors/fadded.ts', 'r') as f:
    content = f.read()

# Find the function start and end
start_marker = 'function inferCategory(productName: string): { name: string; slug: string; sortOrder: number } {'
end_marker = '// ─── Category Sync (inferred from products) ────────────────────────────────────'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1:
    print('ERROR: start marker not found')
    exit(1)
if end_idx == -1:
    print('ERROR: end marker not found')
    exit(1)

old_function = content[start_idx:end_idx]
print(f'Found function ({len(old_function)} chars), replacing...')

new_function = '''function inferCategory(productName: string): { name: string; slug: string; sortOrder: number } {
  const name = productName.toUpperCase();
  // ── Social Media (map to AccsZone unified category slugs) ──
  if (name.includes("INSTAGRAM")) return { name: "Instagram Accounts", slug: "buy-instagram-accounts", sortOrder: 0 };
  if (name.includes("FACEBOOK") || name.includes("FB")) return { name: "Facebook Accounts", slug: "buy-facebook-accounts", sortOrder: 1 };
  if (name.includes("TIKTOK") || name.includes("TIK TOK")) return { name: "TikTok Accounts & Followers", slug: "buy-tiktok-accounts", sortOrder: 2 };
  if (name.includes("DISCORD")) return { name: "Discord Accounts", slug: "buy-discord-accounts", sortOrder: 3 };
  if (name.includes("TWITTER") || name.includes(" X ") || name.startsWith("X ") || name.includes("X OLD") || name.includes("X ACCOUNT")) return { name: "Twitter/X Accounts", slug: "buy-twitter-x-accounts", sortOrder: 4 };
  if (name.includes("YOUTUBE")) return { name: "YouTube Accounts & Channels", slug: "buy-youtube-accounts", sortOrder: 5 };
  if (name.includes("SNAPCHAT")) return { name: "Snapchat Accounts", slug: "buy-snapchat-accounts", sortOrder: 6 };
  if (name.includes("REDDIT")) return { name: "Reddit Accounts", slug: "buy-reddit-accounts", sortOrder: 7 };
  if (name.includes("ONLY FANS") || name.includes("ONLYFANS")) return { name: "OnlyFans", slug: "onlyfans", sortOrder: 8 };
  if (name.includes("LINKEDIN")) return { name: "LinkedIn Accounts", slug: "buy-linkedin-accounts", sortOrder: 9 };
  if (name.includes("WHATSAPP")) return { name: "WhatsApp Accounts", slug: "buy-whatsapp-accounts", sortOrder: 10 };
  if (name.includes("TELEGRAM")) return { name: "Telegram Accounts", slug: "buy-telegram-accounts", sortOrder: 11 };
  if (name.includes("PINTEREST")) return { name: "Pinterest Accounts", slug: "buy-pinterest-accounts", sortOrder: 12 };
  if (name.includes("TRUSTPILOT")) return { name: "Trustpilot Accounts", slug: "buy-trustpilot-accounts", sortOrder: 13 };
  if (name.includes("QUORA")) return { name: "Quora Accounts", slug: "buy-quora-accounts", sortOrder: 14 };
  // ── Streaming & Entertainment ──
  if (name.includes("NETFLIX") || name.includes("DISNEY") || name.includes("HULU") || name.includes("HBO") || name.includes("PRIME VIDEO")) return { name: "Netflix Accounts & Gift Cards", slug: "buy-netflix-accounts", sortOrder: 20 };
  if (name.includes("STEAM") || name.includes("GAMING") || name.includes("XBOX") || name.includes("PLAYSTATION") || name.includes("PS4") || name.includes("PS5")) return { name: "Steam Gift Cards", slug: "buy-steam-gift-cards", sortOrder: 21 };
  if (name.includes("SPOTIFY")) return { name: "Streaming", slug: "streaming", sortOrder: 22 };
  // ── Apple & Amazon ──
  if (name.includes("APPLE MUSIC") || name.includes("APPLE TV") || name.includes("APPLE ID") || name.includes("ICLOUD") || name.includes("ITUNES")) return { name: "Apple", slug: "apple-gift-card-digital-code", sortOrder: 23 };
  if (name.includes("AMAZON") || name.includes("PRIME")) return { name: "Amazon Accounts", slug: "amazon-accounts", sortOrder: 24 };
  // ── Software & Productivity ──
  if (name.includes("CANVA") || name.includes("FIGMA") || name.includes("ADOBE")) return { name: "Design Tools", slug: "design-tools", sortOrder: 30 };
  if (name.includes("CHATGPT") || name.includes("OPENAI") || name.includes("DEEP SEEK") || name.includes("DEEPSEEK") || name.includes("CLAUDE") || name.includes("GEMINI")) return { name: "AI Tools", slug: "ai-tools", sortOrder: 31 };
  if (name.includes("GMAIL") || name.includes("GOOGLE VOICE") || name.includes("GOOGLE ADS")) return { name: "Google Voice Accounts", slug: "buy-google-voice-accounts", sortOrder: 32 };
  if (name.includes("MICROSOFT") || name.includes("OUTLOOK") || name.includes("OFFICE")) return { name: "Outlook Email Accounts", slug: "buy-outlook-accounts", sortOrder: 33 };
  // ── VPN & Proxy ──
  if (name.includes("VPN") || name.includes("NORDVPN") || name.includes("EXPRESSVPN") || name.includes("HMA") || name.includes("IP VANISH") || name.includes("IPVANISH")) return { name: "VPN Premium", slug: "buy-vpn-accounts", sortOrder: 40 };
  if (name.includes("PROXY") || name.includes("SOCKS") || name.includes("SOCK 5") || name.includes("9PROXY") || name.includes("PIA SOCK")) return { name: "Mobile Proxies", slug: "buy-mobile-proxies", sortOrder: 41 };
  // ── Dating ──
  if (name.includes("DATING") || name.includes("TINDER") || name.includes("BUMBLE") || name.includes("GRINDR") || name.includes("HINGE")) return { name: "Dating App Accounts", slug: "buy-dating-accounts", sortOrder: 50 };
  // ── Communication ──
  if (name.includes("TALKATONE") || name.includes("TEXT FREE") || name.includes("TEXTPLUS") || name.includes("TEXT NOW") || name.includes("SMS") || name.includes("PHONE NUMBER")) return { name: "Phone & SMS", slug: "phone-sms", sortOrder: 60 };
  // ── Other / Misc (sort order 90+) ──
  return { name: "Other Accounts", slug: "other-accounts", sortOrder: 90 };
}
'''

new_content = content[:start_idx] + new_function + content[end_idx:]

with open('server/connectors/fadded.ts', 'w') as f:
    f.write(new_content)

print('SUCCESS: inferCategory updated with AccsZone-aligned slugs')
