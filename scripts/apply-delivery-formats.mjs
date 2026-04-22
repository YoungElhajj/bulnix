/**
 * Script: apply-delivery-formats.mjs
 * Fetches all products from the AccsZone API (with descriptions),
 * extracts the delivery format from the description or title,
 * and bulk-updates the deliveryFormat column for all products.
 *
 * Run: node scripts/apply-delivery-formats.mjs
 */
import axios from "axios";
import mysql from "mysql2/promise";

const API_KEY = process.env.ACCSZONE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const BASE_URL = "https://accszone.com/api/v1";

if (!API_KEY) { console.error("ACCSZONE_API_KEY not set"); process.exit(1); }
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "X-API-Key": API_KEY, "Content-Type": "application/json", "Accept": "application/json" },
  timeout: 30000,
});

// Extract delivery format from description text
// Looks for patterns like "Email : Password : 2FA" or "Login : Password : Email Password : 2FA : ID"
function extractDeliveryFormat(description, title) {
  if (!description && !title) return null;
  const text = description ?? "";

  // Pattern 1: "Delivery format: X : Y : Z" (explicit label)
  const deliveryFormatMatch = text.match(/[Dd]elivery\s+[Ff]ormat\s*[:\-]\s*([^\n<]+)/);
  if (deliveryFormatMatch) {
    return deliveryFormatMatch[1].trim().replace(/\s*:\s*/g, " : ");
  }

  // Pattern 2: "Format: X : Y : Z"
  const formatMatch = text.match(/[Ff]ormat\s*[:\-]\s*([^\n<]+)/);
  if (formatMatch) {
    return formatMatch[1].trim().replace(/\s*:\s*/g, " : ");
  }

  // Pattern 3: Lines containing multiple colon-separated credential-like words
  const lines = text.split(/[\n<>]+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Must have at least 2 colons and look like credentials
    const colonCount = (line.match(/:/g) || []).length;
    if (colonCount >= 1 && line.length < 200) {
      // Check it contains credential-like words
      const credWords = /email|password|login|2fa|otp|token|id|username|phone|cookie|auth/i;
      if (credWords.test(line)) {
        // Clean up HTML entities and normalize spacing
        const cleaned = line
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s*:\s*/g, " : ")
          .trim();
        if (cleaned.length > 5 && cleaned.length < 200) {
          return cleaned;
        }
      }
    }
  }

  // Pattern 4: Infer from title keywords
  return inferFromTitle(title ?? "");
}

function inferFromTitle(title) {
  const t = title.toLowerCase();
  const parts = [];

  // Determine platform
  if (t.includes("facebook") || t.includes("fb")) {
    parts.push("Facebook Email", "Facebook Password");
    if (t.includes("email") || t.includes("mail access")) parts.push("Email Password");
    if (t.includes("2fa") || t.includes("two-factor")) parts.push("2FA Key");
    parts.push("Facebook ID");
  } else if (t.includes("instagram") || t.includes("ig ")) {
    parts.push("Instagram Login", "Password");
    if (t.includes("email")) parts.push("Email", "Email Password");
    if (t.includes("2fa")) parts.push("2FA Key");
  } else if (t.includes("twitter") || t.includes("x account")) {
    parts.push("Twitter Email", "Password");
    if (t.includes("2fa")) parts.push("2FA Key");
  } else if (t.includes("gmail") || t.includes("google account")) {
    parts.push("Email", "Password");
    if (t.includes("recovery")) parts.push("Recovery Email");
    if (t.includes("2fa")) parts.push("2FA Key");
  } else if (t.includes("tiktok")) {
    parts.push("TikTok Login", "Password");
    if (t.includes("email")) parts.push("Email");
  } else if (t.includes("linkedin")) {
    parts.push("Email", "Password");
  } else if (t.includes("reddit")) {
    parts.push("Username", "Password");
    if (t.includes("email")) parts.push("Email");
  } else if (t.includes("discord")) {
    parts.push("Email", "Password");
    if (t.includes("token")) parts.push("Token");
  } else if (t.includes("spotify")) {
    parts.push("Email", "Password");
  } else if (t.includes("netflix")) {
    parts.push("Email", "Password");
    if (t.includes("profile")) parts.push("Profile PIN");
  } else if (t.includes("amazon") || t.includes("prime")) {
    parts.push("Email", "Password");
  } else if (t.includes("youtube") || t.includes("yt ")) {
    parts.push("Email", "Password");
  } else if (t.includes("snapchat")) {
    parts.push("Username", "Password");
    if (t.includes("email")) parts.push("Email");
  } else if (t.includes("pinterest")) {
    parts.push("Email", "Password");
  } else if (t.includes("tumblr")) {
    parts.push("Email", "Password");
  } else if (t.includes("twitch")) {
    parts.push("Email", "Password");
    if (t.includes("token")) parts.push("Token");
  } else if (t.includes("steam")) {
    parts.push("Login", "Password");
    if (t.includes("email")) parts.push("Email");
    if (t.includes("guard")) parts.push("Steam Guard Code");
  } else if (t.includes("paypal")) {
    parts.push("Email", "Password");
    if (t.includes("verified")) parts.push("Phone Number");
  } else if (t.includes("cashapp")) {
    parts.push("Email", "Password");
    if (t.includes("phone")) parts.push("Phone Number");
  } else if (t.includes("onlyfans")) {
    parts.push("Email", "Password");
    if (t.includes("2fa")) parts.push("2FA Key");
  } else if (t.includes("badoo") || t.includes("bumble") || t.includes("tinder") || t.includes("dating")) {
    parts.push("Email", "Password");
    if (t.includes("phone")) parts.push("Phone Number");
  } else if (t.includes("whatsapp")) {
    parts.push("Phone Number", "Verification Code");
  } else if (t.includes("telegram")) {
    parts.push("Phone Number", "Session String");
  } else if (t.includes("microsoft") || t.includes("outlook") || t.includes("hotmail")) {
    parts.push("Email", "Password");
    if (t.includes("2fa")) parts.push("2FA Key");
  } else if (t.includes("apple") || t.includes("icloud")) {
    parts.push("Apple ID", "Password");
    if (t.includes("2fa")) parts.push("2FA Key");
  } else if (t.includes("dropbox")) {
    parts.push("Email", "Password");
  } else if (t.includes("vpn") || t.includes("nordvpn") || t.includes("expressvpn")) {
    parts.push("Email", "Password");
    if (t.includes("key") || t.includes("license")) parts.push("License Key");
  } else if (t.includes("hulu")) {
    parts.push("Email", "Password");
  } else if (t.includes("disney")) {
    parts.push("Email", "Password");
  } else if (t.includes("hbo") || t.includes("max")) {
    parts.push("Email", "Password");
  } else if (t.includes("crunchyroll") || t.includes("funimation")) {
    parts.push("Email", "Password");
  } else if (t.includes("duolingo")) {
    parts.push("Email", "Password");
  } else if (t.includes("canva")) {
    parts.push("Email", "Password");
  } else if (t.includes("adobe") || t.includes("photoshop")) {
    parts.push("Email", "Password");
    if (t.includes("license") || t.includes("key")) parts.push("License Key");
  } else if (t.includes("chatgpt") || t.includes("openai")) {
    parts.push("Email", "Password");
    if (t.includes("api")) parts.push("API Key");
  } else if (t.includes("github")) {
    parts.push("Email", "Password", "Token");
  } else if (t.includes("shopify")) {
    parts.push("Email", "Password");
  } else if (t.includes("ebay")) {
    parts.push("Email", "Password");
  } else if (t.includes("etsy")) {
    parts.push("Email", "Password");
  } else if (t.includes("google voice")) {
    parts.push("Email", "Password", "Phone Number");
  } else if (t.includes("phone number") || t.includes("sms")) {
    parts.push("Phone Number", "Verification Code");
  } else {
    // Generic fallback
    parts.push("Login", "Password");
  }

  return parts.length > 0 ? parts.join(" : ") : null;
}

async function main() {
  console.log("Connecting to database...");
  const conn = await mysql.createConnection(DATABASE_URL);

  // Get all products with their titles and descriptions
  const [rows] = await conn.execute(
    "SELECT id, title, description, supplierProductId, providerKey, deliveryFormat FROM products WHERE providerKey = 'accszone' ORDER BY id"
  );

  console.log(`Found ${rows.length} AccsZone products`);

  // Fetch product details from AccsZone API to get descriptions
  console.log("Fetching product descriptions from AccsZone API...");
  let apiProducts = {};
  try {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const resp = await client.get(`/products?page=${page}&per_page=100`);
      const data = resp.data?.data ?? resp.data ?? [];
      const items = Array.isArray(data) ? data : (data.data ?? []);
      if (items.length === 0) { hasMore = false; break; }
      for (const p of items) {
        apiProducts[String(p.id)] = p;
      }
      console.log(`  Fetched page ${page}: ${items.length} products`);
      if (items.length < 100) hasMore = false;
      page++;
      if (page > 20) break; // safety limit
    }
    console.log(`Total API products fetched: ${Object.keys(apiProducts).length}`);
  } catch (err) {
    console.warn("Could not fetch from API, will use DB descriptions only:", err.message);
  }

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    // Skip if already has a custom delivery format set
    if (row.deliveryFormat && row.deliveryFormat.trim()) {
      skipped++;
      continue;
    }

    // Get description from API data if available, otherwise from DB
    const apiProd = apiProducts[String(row.supplierProductId)];
    const description = apiProd?.description ?? row.description ?? null;
    const title = row.title ?? "";

    const format = extractDeliveryFormat(description, title);
    if (format) {
      await conn.execute("UPDATE products SET deliveryFormat = ? WHERE id = ?", [format, row.id]);
      updated++;
      if (updated % 50 === 0) console.log(`  Updated ${updated} products...`);
    }
  }

  await conn.end();
  console.log(`\nDone! Updated: ${updated}, Skipped (already set): ${skipped}, No format found: ${rows.length - updated - skipped}`);
}

main().catch(err => { console.error(err); process.exit(1); });
