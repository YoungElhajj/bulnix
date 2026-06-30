/**
 * Brand logo mapping utility.
 * Maps product/category names (case-insensitive substring match) to
 * Simple Icons CDN URLs or other reliable CDN sources.
 * Falls back to a coloured initial avatar if no match is found.
 */

// Simple Icons CDN base (MIT-licensed SVG icons)
const SI = "https://cdn.simpleicons.org";

interface BrandEntry {
  keywords: string[];
  icon: string; // full URL or SI slug
  bg: string;   // background colour for the icon tile
}

const BRAND_MAP: BrandEntry[] = [
  // ── Streaming ──────────────────────────────────────────────────────────────
  { keywords: ["netflix"], icon: `${SI}/netflix/E50914`, bg: "#141414" },
  { keywords: ["spotify"], icon: `${SI}/spotify/1DB954`, bg: "#191414" },
  { keywords: ["disney", "disney+"], icon: `${SI}/disneyplus/113CCE`, bg: "#040714" },
  { keywords: ["youtube premium", "youtube"], icon: `${SI}/youtube/FF0000`, bg: "#ffffff" },
  { keywords: ["hbo", "max"], icon: `${SI}/hbo/8B00FF`, bg: "#000000" },
  { keywords: ["apple tv", "appletv"], icon: `${SI}/appletv/000000`, bg: "#f5f5f7" },
  { keywords: ["amazon prime", "prime video", "amazon video"], icon: `${SI}/amazonprime/00A8E1`, bg: "#232F3E" },
  { keywords: ["hulu"], icon: `${SI}/hulu/1CE783`, bg: "#040404" },
  { keywords: ["crunchyroll"], icon: `${SI}/crunchyroll/F47521`, bg: "#ffffff" },
  { keywords: ["peacock"], icon: `${SI}/nbc/F7C948`, bg: "#000000" },
  { keywords: ["paramount"], icon: `${SI}/paramount/0064FF`, bg: "#ffffff" },
  { keywords: ["deezer"], icon: `${SI}/deezer/A238CA`, bg: "#ffffff" },
  { keywords: ["tidal"], icon: `${SI}/tidal/000000`, bg: "#ffffff" },
  { keywords: ["apple music"], icon: `${SI}/applemusic/FC3C44`, bg: "#000000" },
  { keywords: ["soundcloud"], icon: `${SI}/soundcloud/FF5500`, bg: "#ffffff" },
  { keywords: ["pandora"], icon: `${SI}/pandora/3668FF`, bg: "#ffffff" },
  { keywords: ["twitch"], icon: `${SI}/twitch/9146FF`, bg: "#ffffff" },
  { keywords: ["plex"], icon: `${SI}/plex/E5A00D`, bg: "#1f1f1f" },
  { keywords: ["funimation"], icon: `${SI}/funimation/410099`, bg: "#ffffff" },
  { keywords: ["mubi"], icon: `${SI}/mubi/000000`, bg: "#ffffff" },
  { keywords: ["showtime"], icon: `${SI}/showtime/FF0000`, bg: "#ffffff" },
  { keywords: ["starz"], icon: `${SI}/starz/000000`, bg: "#ffffff" },
  { keywords: ["curiosity stream"], icon: `${SI}/curiositystream/EE1C25`, bg: "#ffffff" },
  { keywords: ["nebula"], icon: `${SI}/nebula/000000`, bg: "#ffffff" },
  { keywords: ["mango tv", "iqiyi", "youku", "bilibili"], icon: `${SI}/bilibili/00A1D6`, bg: "#ffffff" },

  // ── Social Media ───────────────────────────────────────────────────────────
  { keywords: ["facebook"], icon: `${SI}/facebook/1877F2`, bg: "#ffffff" },
  { keywords: ["instagram"], icon: `${SI}/instagram/E4405F`, bg: "#ffffff" },
  { keywords: ["tiktok"], icon: `${SI}/tiktok/000000`, bg: "#ffffff" },
  { keywords: ["twitter", "x account", "x.com"], icon: `${SI}/x/000000`, bg: "#ffffff" },
  { keywords: ["linkedin"], icon: `${SI}/linkedin/0A66C2`, bg: "#ffffff" },
  { keywords: ["snapchat"], icon: `${SI}/snapchat/FFFC00`, bg: "#000000" },
  { keywords: ["pinterest"], icon: `${SI}/pinterest/BD081C`, bg: "#ffffff" },
  { keywords: ["reddit"], icon: `${SI}/reddit/FF4500`, bg: "#ffffff" },
  { keywords: ["tumblr"], icon: `${SI}/tumblr/36465D`, bg: "#ffffff" },
  { keywords: ["discord"], icon: `${SI}/discord/5865F2`, bg: "#ffffff" },
  { keywords: ["telegram"], icon: `${SI}/telegram/26A5E4`, bg: "#ffffff" },
  { keywords: ["whatsapp"], icon: `${SI}/whatsapp/25D366`, bg: "#ffffff" },
  { keywords: ["wechat"], icon: `${SI}/wechat/07C160`, bg: "#ffffff" },
  { keywords: ["line"], icon: `${SI}/line/00C300`, bg: "#ffffff" },
  { keywords: ["viber"], icon: `${SI}/viber/7360F2`, bg: "#ffffff" },
  { keywords: ["signal"], icon: `${SI}/signal/3A76F0`, bg: "#ffffff" },
  { keywords: ["quora"], icon: `${SI}/quora/B92B27`, bg: "#ffffff" },
  { keywords: ["medium"], icon: `${SI}/medium/000000`, bg: "#ffffff" },
  { keywords: ["clubhouse"], icon: `${SI}/clubhouse/F3E8D2`, bg: "#000000" },
  { keywords: ["mastodon"], icon: `${SI}/mastodon/6364FF`, bg: "#ffffff" },
  { keywords: ["threads"], icon: `${SI}/threads/000000`, bg: "#ffffff" },
  { keywords: ["bluesky"], icon: `${SI}/bluesky/0085FF`, bg: "#ffffff" },

  // ── Google / Gmail ─────────────────────────────────────────────────────────
  { keywords: ["gmail"], icon: `${SI}/gmail/EA4335`, bg: "#ffffff" },
  { keywords: ["google voice"], icon: `${SI}/googlevoice/34A853`, bg: "#ffffff" },
  { keywords: ["google ads"], icon: `${SI}/googleads/4285F4`, bg: "#ffffff" },
  { keywords: ["google workspace", "google suite"], icon: `${SI}/google/4285F4`, bg: "#ffffff" },
  { keywords: ["google play"], icon: `${SI}/googleplay/414141`, bg: "#ffffff" },
  { keywords: ["google drive"], icon: `${SI}/googledrive/4285F4`, bg: "#ffffff" },

  // ── Gaming ─────────────────────────────────────────────────────────────────
  { keywords: ["steam"], icon: `${SI}/steam/000000`, bg: "#c2c2c2" },
  { keywords: ["xbox"], icon: `${SI}/xbox/107C10`, bg: "#ffffff" },
  { keywords: ["playstation", "psn", "ps4", "ps5"], icon: `${SI}/playstation/003087`, bg: "#ffffff" },
  { keywords: ["nintendo"], icon: `${SI}/nintendo/E4000F`, bg: "#ffffff" },
  { keywords: ["epic games"], icon: `${SI}/epicgames/313131`, bg: "#ffffff" },
  { keywords: ["roblox"], icon: `${SI}/roblox/E8232A`, bg: "#ffffff" },
  { keywords: ["minecraft"], icon: `${SI}/minecraft/62B47A`, bg: "#ffffff" },
  { keywords: ["pubg"], icon: `${SI}/pubg/F7A800`, bg: "#1a1a1a" },
  { keywords: ["fortnite"], icon: `${SI}/fortnite/1DBEF0`, bg: "#0d0d0d" },
  { keywords: ["valorant"], icon: `${SI}/valorant/FF4655`, bg: "#0f1923" },
  { keywords: ["league of legends", "lol"], icon: `${SI}/leagueoflegends/C89B3C`, bg: "#0a0a0a" },
  { keywords: ["genshin"], icon: `${SI}/genshinimpact/1C6EBF`, bg: "#ffffff" },
  { keywords: ["battlenet", "battle.net", "blizzard"], icon: `${SI}/battlenet/148EFF`, bg: "#ffffff" },
  { keywords: ["ea", "origin"], icon: `${SI}/ea/000000`, bg: "#ffffff" },
  { keywords: ["ubisoft"], icon: `${SI}/ubisoft/000000`, bg: "#ffffff" },
  { keywords: ["twitch bits", "twitch sub"], icon: `${SI}/twitch/9146FF`, bg: "#ffffff" },
  { keywords: ["riot games"], icon: `${SI}/riotgames/D32936`, bg: "#ffffff" },
  { keywords: ["rockstar", "gta"], icon: `${SI}/rockstargames/FCAF17`, bg: "#1a1a1a" },
  { keywords: ["activision", "call of duty", "cod"], icon: `${SI}/activision/000000`, bg: "#ffffff" },

  // ── VPN & Security ─────────────────────────────────────────────────────────
  { keywords: ["nordvpn", "nord vpn"], icon: `${SI}/nordvpn/4687FF`, bg: "#ffffff" },
  { keywords: ["expressvpn", "express vpn"], icon: `${SI}/expressvpn/DA3940`, bg: "#ffffff" },
  { keywords: ["surfshark"], icon: `${SI}/surfshark/1E1F4B`, bg: "#ffffff" },
  { keywords: ["cyberghost"], icon: `${SI}/cyberghost/FFCC00`, bg: "#1a1a1a" },
  { keywords: ["protonvpn", "proton vpn", "proton mail", "protonmail"], icon: `${SI}/protonmail/6D4AFF`, bg: "#ffffff" },
  { keywords: ["mullvad"], icon: `${SI}/mullvad/44AD8E`, bg: "#ffffff" },
  { keywords: ["private internet access", "pia"], icon: `${SI}/privateinternetaccess/4BAF51`, bg: "#ffffff" },
  { keywords: ["ipvanish"], icon: `${SI}/ipvanish/70BB44`, bg: "#ffffff" },
  { keywords: ["hotspot shield"], icon: `${SI}/hotspot/FF6600`, bg: "#ffffff" },
  { keywords: ["tunnelbear"], icon: `${SI}/tunnelbear/FFCC33`, bg: "#1a1a1a" },
  { keywords: ["windscribe"], icon: `${SI}/windscribe/3399FF`, bg: "#ffffff" },

  // ── Software & Productivity ────────────────────────────────────────────────
  { keywords: ["microsoft 365", "office 365", "microsoft office"], icon: `${SI}/microsoftoffice/D83B01`, bg: "#ffffff" },
  { keywords: ["microsoft", "windows"], icon: `${SI}/microsoft/5E5E5E`, bg: "#ffffff" },
  { keywords: ["adobe"], icon: `${SI}/adobe/FF0000`, bg: "#ffffff" },
  { keywords: ["canva"], icon: `${SI}/canva/00C4CC`, bg: "#ffffff" },
  { keywords: ["grammarly"], icon: `${SI}/grammarly/15C39A`, bg: "#ffffff" },
  { keywords: ["notion"], icon: `${SI}/notion/000000`, bg: "#ffffff" },
  { keywords: ["slack"], icon: `${SI}/slack/4A154B`, bg: "#ffffff" },
  { keywords: ["zoom"], icon: `${SI}/zoom/2D8CFF`, bg: "#ffffff" },
  { keywords: ["dropbox"], icon: `${SI}/dropbox/0061FF`, bg: "#ffffff" },
  { keywords: ["evernote"], icon: `${SI}/evernote/00A82D`, bg: "#ffffff" },
  { keywords: ["trello"], icon: `${SI}/trello/0052CC`, bg: "#ffffff" },
  { keywords: ["asana"], icon: `${SI}/asana/F06A6A`, bg: "#ffffff" },
  { keywords: ["monday.com", "monday"], icon: `${SI}/mondaydotcom/FF3750`, bg: "#ffffff" },
  { keywords: ["figma"], icon: `${SI}/figma/F24E1E`, bg: "#ffffff" },
  { keywords: ["sketch"], icon: `${SI}/sketch/F7B500`, bg: "#ffffff" },
  { keywords: ["invision"], icon: `${SI}/invision/FF3366`, bg: "#ffffff" },
  { keywords: ["miro"], icon: `${SI}/miro/FFD02F`, bg: "#050038" },
  { keywords: ["loom"], icon: `${SI}/loom/625DF5`, bg: "#ffffff" },
  { keywords: ["hubspot"], icon: `${SI}/hubspot/FF7A59`, bg: "#ffffff" },
  { keywords: ["salesforce"], icon: `${SI}/salesforce/00A1E0`, bg: "#ffffff" },
  { keywords: ["zendesk"], icon: `${SI}/zendesk/03363D`, bg: "#ffffff" },
  { keywords: ["intercom"], icon: `${SI}/intercom/6AFDEF`, bg: "#1f1f1f" },
  { keywords: ["mailchimp"], icon: `${SI}/mailchimp/FFE01B`, bg: "#241C15" },
  { keywords: ["semrush"], icon: `${SI}/semrush/FF642D`, bg: "#ffffff" },
  { keywords: ["ahrefs"], icon: `${SI}/ahrefs/FF7043`, bg: "#ffffff" },
  { keywords: ["autopilot", "activecampaign"], icon: `${SI}/activecampaign/356AE6`, bg: "#ffffff" },
  { keywords: ["shopify"], icon: `${SI}/shopify/96BF48`, bg: "#ffffff" },
  { keywords: ["woocommerce"], icon: `${SI}/woocommerce/96588A`, bg: "#ffffff" },
  { keywords: ["wordpress"], icon: `${SI}/wordpress/21759B`, bg: "#ffffff" },
  { keywords: ["wix"], icon: `${SI}/wix/FAAD4D`, bg: "#000000" },
  { keywords: ["squarespace"], icon: `${SI}/squarespace/000000`, bg: "#ffffff" },
  { keywords: ["webflow"], icon: `${SI}/webflow/4353FF`, bg: "#ffffff" },
  { keywords: ["github"], icon: `${SI}/github/181717`, bg: "#f6f8fa" },
  { keywords: ["gitlab"], icon: `${SI}/gitlab/FC6D26`, bg: "#ffffff" },
  { keywords: ["bitbucket"], icon: `${SI}/bitbucket/0052CC`, bg: "#ffffff" },
  { keywords: ["jira"], icon: `${SI}/jira/0052CC`, bg: "#ffffff" },
  { keywords: ["confluence"], icon: `${SI}/confluence/172B4D`, bg: "#ffffff" },
  { keywords: ["linear"], icon: `${SI}/linear/5E6AD2`, bg: "#ffffff" },
  { keywords: ["clickup"], icon: `${SI}/clickup/7B68EE`, bg: "#ffffff" },
  { keywords: ["basecamp"], icon: `${SI}/basecamp/1D2D35`, bg: "#ffffff" },
  { keywords: ["todoist"], icon: `${SI}/todoist/DB4035`, bg: "#ffffff" },
  { keywords: ["1password"], icon: `${SI}/1password/0094F5`, bg: "#ffffff" },
  { keywords: ["lastpass"], icon: `${SI}/lastpass/D32D27`, bg: "#ffffff" },
  { keywords: ["dashlane"], icon: `${SI}/dashlane/0E353D`, bg: "#ffffff" },
  { keywords: ["bitwarden"], icon: `${SI}/bitwarden/175DDC`, bg: "#ffffff" },
  { keywords: ["keeper"], icon: `${SI}/keeper/0000FF`, bg: "#ffffff" },
  { keywords: ["nordpass"], icon: `${SI}/nordpass/4687FF`, bg: "#ffffff" },

  // ── E-commerce & Finance ───────────────────────────────────────────────────
  { keywords: ["amazon"], icon: `${SI}/amazon/FF9900`, bg: "#131921" },
  { keywords: ["ebay"], icon: `${SI}/ebay/E53238`, bg: "#ffffff" },
  { keywords: ["etsy"], icon: `${SI}/etsy/F16521`, bg: "#ffffff" },
  { keywords: ["aliexpress"], icon: `${SI}/aliexpress/FF6A00`, bg: "#ffffff" },
  { keywords: ["alibaba"], icon: `${SI}/alibaba/FF6A00`, bg: "#ffffff" },
  { keywords: ["paypal"], icon: `${SI}/paypal/003087`, bg: "#ffffff" },
  { keywords: ["stripe"], icon: `${SI}/stripe/008CDD`, bg: "#ffffff" },
  { keywords: ["cash app", "cashapp"], icon: `${SI}/cashapp/00D64A`, bg: "#ffffff" },
  { keywords: ["venmo"], icon: `${SI}/venmo/3D95CE`, bg: "#ffffff" },
  { keywords: ["wise", "transferwise"], icon: `${SI}/wise/9FE870`, bg: "#163300" },
  { keywords: ["revolut"], icon: `${SI}/revolut/0666EB`, bg: "#ffffff" },
  { keywords: ["coinbase"], icon: `${SI}/coinbase/0052FF`, bg: "#ffffff" },
  { keywords: ["binance"], icon: `${SI}/binance/F0B90B`, bg: "#1a1a1a" },
  { keywords: ["crypto.com"], icon: `${SI}/crypto/002D74`, bg: "#ffffff" },

  // ── Classifieds ────────────────────────────────────────────────────────────
  { keywords: ["craigslist"], icon: `${SI}/craigslist/7FACD6`, bg: "#ffffff" },
  { keywords: ["gumtree"], icon: `${SI}/gumtree/72EF36`, bg: "#1a1a1a" },
  { keywords: ["offerup"], icon: `${SI}/offerup/09C269`, bg: "#ffffff" },
  { keywords: ["poshmark"], icon: `${SI}/poshmark/C4244E`, bg: "#ffffff" },
  { keywords: ["depop"], icon: `${SI}/depop/FF2300`, bg: "#ffffff" },
  { keywords: ["vinted"], icon: `${SI}/vinted/09B1BA`, bg: "#ffffff" },
  { keywords: ["mercari"], icon: `${SI}/mercari/FF0211`, bg: "#ffffff" },

  // ── AI Tools ───────────────────────────────────────────────────────────────
  { keywords: ["chatgpt", "openai"], icon: `${SI}/openai/412991`, bg: "#ffffff" },
  { keywords: ["midjourney"], icon: `${SI}/midjourney/000000`, bg: "#ffffff" },
  { keywords: ["claude", "anthropic"], icon: `${SI}/anthropic/D97757`, bg: "#ffffff" },
  { keywords: ["gemini", "bard"], icon: `${SI}/googlegemini/8E75B2`, bg: "#ffffff" },
  { keywords: ["perplexity"], icon: `${SI}/perplexity/20808D`, bg: "#ffffff" },
  { keywords: ["jasper"], icon: `${SI}/jasper/FF7043`, bg: "#ffffff" },
  { keywords: ["copy.ai", "copyai"], icon: `${SI}/copyai/6B4FBB`, bg: "#ffffff" },
  { keywords: ["elevenlabs"], icon: `${SI}/elevenlabs/000000`, bg: "#f5f5f5" },
  { keywords: ["runway"], icon: `${SI}/runway/000000`, bg: "#f5f5f5" },
  { keywords: ["pika"], icon: `${SI}/pika/000000`, bg: "#f5f5f5" },
  { keywords: ["sora"], icon: `${SI}/openai/412991`, bg: "#ffffff" },

  // ── Education ─────────────────────────────────────────────────────────────
  { keywords: ["duolingo"], icon: `${SI}/duolingo/58CC02`, bg: "#ffffff" },
  { keywords: ["coursera"], icon: `${SI}/coursera/0056D2`, bg: "#ffffff" },
  { keywords: ["udemy"], icon: `${SI}/udemy/A435F0`, bg: "#ffffff" },
  { keywords: ["skillshare"], icon: `${SI}/skillshare/002333`, bg: "#ffffff" },
  { keywords: ["masterclass"], icon: `${SI}/masterclass/000000`, bg: "#f5f5f5" },
  { keywords: ["pluralsight"], icon: `${SI}/pluralsight/F15B2A`, bg: "#ffffff" },
  { keywords: ["linkedin learning"], icon: `${SI}/linkedin/0A66C2`, bg: "#ffffff" },
  { keywords: ["khan academy"], icon: `${SI}/khanacademy/14BF96`, bg: "#ffffff" },
  { keywords: ["chegg"], icon: `${SI}/chegg/F8971D`, bg: "#ffffff" },
  { keywords: ["quizlet"], icon: `${SI}/quizlet/4257B2`, bg: "#ffffff" },

  // ── Cloud Storage ─────────────────────────────────────────────────────────
  { keywords: ["icloud"], icon: `${SI}/icloud/3693F3`, bg: "#ffffff" },
  { keywords: ["onedrive"], icon: `${SI}/microsoftonedrive/0078D4`, bg: "#ffffff" },
  { keywords: ["box"], icon: `${SI}/box/0061D5`, bg: "#ffffff" },
  { keywords: ["mega"], icon: `${SI}/mega/D9272E`, bg: "#ffffff" },
  { keywords: ["pcloud"], icon: `${SI}/pcloud/3F9EE8`, bg: "#ffffff" },
];

/**
 * Returns the best matching logo URL for a given product/category name.
 * Falls back to a coloured initial avatar SVG data URI.
 */
export function getBrandLogo(name: string): { url: string; bg: string } | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const entry of BRAND_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return { url: entry.icon, bg: entry.bg };
    }
  }
  return null;
}

/**
 * Returns a coloured initial avatar as an inline SVG data URI.
 */
export function getInitialAvatar(name: string): string {
  const initial = (name ?? "?")[0].toUpperCase();
  // Deterministic colour from name hash
  const colours = ["#0050D0", "#E50914", "#1DB954", "#FF4500", "#9146FF", "#F7A800", "#00A1E1", "#25D366"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  const bg = colours[Math.abs(hash) % colours.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${bg}"/><text x="32" y="42" font-size="28" font-family="sans-serif" font-weight="700" fill="white" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * ProductImage component helper — returns the best image source for a product.
 * Priority: product.imageUrl > brand logo > initial avatar
 */
export function getProductImageSrc(name: string, imageUrl?: string | null): { src: string; bg: string } {
  if (imageUrl) return { src: imageUrl, bg: "#ffffff" };
  const brand = getBrandLogo(name);
  if (brand) return { src: brand.url, bg: brand.bg };
  return { src: getInitialAvatar(name), bg: "#f0f4ff" };
}
