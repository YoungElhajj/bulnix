/**
 * Reorders categories by demand priority.
 * High-demand categories (social media, streaming, gaming) get low sort numbers (shown first).
 * Niche/technical categories get higher sort numbers (shown later).
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Demand-priority mapping: category name patterns → sort order
// Lower number = shown first
const priorityMap = [
  // Tier 1: Highest demand social media
  { pattern: /instagram/i, order: 10 },
  { pattern: /facebook/i, order: 20 },
  { pattern: /tiktok/i, order: 30 },
  { pattern: /twitter|x account/i, order: 40 },
  { pattern: /snapchat/i, order: 50 },
  { pattern: /discord/i, order: 60 },
  { pattern: /reddit/i, order: 70 },
  { pattern: /youtube|yt channel/i, order: 80 },
  { pattern: /whatsapp/i, order: 90 },
  { pattern: /telegram/i, order: 100 },
  { pattern: /linkedin/i, order: 110 },
  // Tier 2: Streaming & entertainment
  { pattern: /netflix/i, order: 120 },
  { pattern: /streaming|subscription/i, order: 130 },
  { pattern: /spotify/i, order: 135 },
  { pattern: /onlyfans/i, order: 140 },
  // Tier 3: Gaming
  { pattern: /gaming|steam|playstation|xbox|game/i, order: 150 },
  // Tier 4: Other popular accounts
  { pattern: /google/i, order: 160 },
  { pattern: /gmail/i, order: 165 },
  { pattern: /amazon/i, order: 170 },
  { pattern: /apple/i, order: 180 },
  { pattern: /pinterest/i, order: 190 },
  { pattern: /quora/i, order: 200 },
  { pattern: /trustpilot/i, order: 210 },
  { pattern: /indeed/i, order: 220 },
  // Tier 5: Privacy & tools
  { pattern: /vpn/i, order: 230 },
  { pattern: /proxy|proxies/i, order: 240 },
  // Tier 6: Dating
  { pattern: /dating|bumble|tinder|grindr|taimi|meetme|badoo|eharmony/i, order: 250 },
  // Tier 7: Email & communication
  { pattern: /email|mail|outlook|proton|yahoo|gmx|zoho|aol/i, order: 260 },
  // Tier 8: Gift cards
  { pattern: /gift card/i, order: 270 },
  // Tier 9: Phone, SMS, leads
  { pattern: /phone|sms|lead|contact/i, order: 280 },
  // Tier 10: Ads & monetization
  { pattern: /ads|monetiz|channel/i, order: 290 },
  // Tier 11: Design & AI tools
  { pattern: /design|canva|ai tool|deepseek/i, order: 300 },
  // Tier 12: Other
  { pattern: /rdp|vps|server|smtp|pop3|craigslist|etsy|cashapp/i, order: 310 },
];

const [categories] = await conn.execute('SELECT id, name, slug FROM categories');

let updated = 0;
for (const cat of categories) {
  let newOrder = 500; // default for unmatched
  for (const { pattern, order } of priorityMap) {
    if (pattern.test(cat.name)) {
      newOrder = order;
      break;
    }
  }
  await conn.execute('UPDATE categories SET sortOrder = ? WHERE id = ?', [newOrder, cat.id]);
  updated++;
}

console.log(`[ReorderCategories] Updated ${updated} categories.`);
await conn.end();
