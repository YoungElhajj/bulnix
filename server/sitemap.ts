import { Express } from "express";
import { getDb } from "./db";
import { categories, products } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const BASE_URL = "https://bulnix.com";

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/categories", priority: "0.9", changefreq: "daily" },
  { path: "/products", priority: "0.9", changefreq: "daily" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/faq", priority: "0.6", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/refund", priority: "0.4", changefreq: "monthly" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(date: Date | null | undefined): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

export function registerSitemapRoute(app: Express) {
  app.get("/sitemap.xml", async (_req: any, res: any) => {
    try {
      const db = await getDb();
      const now = new Date().toISOString().split("T")[0];

      let categoryRows: Array<{ slug: string; updatedAt: Date | null }> = [];
      let productRows: Array<{ slug: string; updatedAt: Date | null }> = [];

      if (db) {
        // Fetch visible categories
        categoryRows = await db
          .select({ slug: categories.slug, updatedAt: categories.updatedAt })
          .from(categories)
          .where(eq(categories.isVisible, true));

        // Fetch visible products
        productRows = await db
          .select({ slug: products.slug, updatedAt: products.updatedAt })
          .from(products)
          .where(and(eq(products.isVisible, true)));
      }

      const lines: string[] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
        '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
        '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
      ];

      // Static pages
      for (const page of STATIC_PAGES) {
        lines.push("  <url>");
        lines.push(`    <loc>${BASE_URL}${escapeXml(page.path)}</loc>`);
        lines.push(`    <lastmod>${now}</lastmod>`);
        lines.push(`    <changefreq>${page.changefreq}</changefreq>`);
        lines.push(`    <priority>${page.priority}</priority>`);
        lines.push("  </url>");
      }

      // Category pages
      for (const cat of categoryRows) {
        if (!cat.slug) continue;
        lines.push("  <url>");
        lines.push(`    <loc>${BASE_URL}/categories/${escapeXml(cat.slug)}</loc>`);
        lines.push(`    <lastmod>${toIsoDate(cat.updatedAt)}</lastmod>`);
        lines.push("    <changefreq>weekly</changefreq>");
        lines.push("    <priority>0.8</priority>");
        lines.push("  </url>");
      }

      // Product pages
      for (const prod of productRows) {
        if (!prod.slug) continue;
        lines.push("  <url>");
        lines.push(`    <loc>${BASE_URL}/products/${escapeXml(prod.slug)}</loc>`);
        lines.push(`    <lastmod>${toIsoDate(prod.updatedAt)}</lastmod>`);
        lines.push("    <changefreq>weekly</changefreq>");
        lines.push("    <priority>0.7</priority>");
        lines.push("  </url>");
      }

      lines.push("</urlset>");

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.send(lines.join("\n"));
    } catch (err) {
      console.error("[Sitemap] Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });
}
