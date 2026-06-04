/**
 * SEO Component
 * Injects dynamic <title>, meta description, Open Graph, Twitter Card,
 * canonical URL, and optional JSON-LD structured data into the document head.
 *
 * Usage:
 *   <SEO
 *     title="Buy Instagram Accounts | Bulnix"
 *     description="..."
 *     canonical="https://bulnix.com/categories/buy-instagram-accounts"
 *     image="https://..."
 *     type="product"
 *     jsonLd={[...]}
 *   />
 */

import { Helmet } from "react-helmet-async";

const SITE_NAME = "Bulnix";
const DEFAULT_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/bulnix-og-v2-cxLkL6kws9gdE3fkMFhFsU.png";
const BASE_URL = "https://bulnix.com";

interface SEOProps {
  /** Page title — will be appended with " | Bulnix" unless it already contains "Bulnix" */
  title: string;
  /** Meta description — ideally 120–160 characters */
  description: string;
  /** Canonical URL for this page */
  canonical?: string;
  /** OG image URL (1200×630 recommended) */
  image?: string;
  /** OG type: "website" (default) or "product" */
  type?: "website" | "product";
  /** Structured data JSON-LD objects to inject */
  jsonLd?: object[];
  /** Prevent search engines from indexing this page */
  noIndex?: boolean;
  /** Additional keywords (comma-separated) */
  keywords?: string;
}

export function SEO({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  type = "website",
  jsonLd,
  noIndex = false,
  keywords,
}: SEOProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ?? BASE_URL;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@bulnix" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* JSON-LD structured data */}
      {jsonLd?.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

/* ─── Pre-built JSON-LD helpers ─────────────────────────────────────────── */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bulnix",
    url: "https://bulnix.com",
    logo: "https://bulnix.com/logo192.png",
    description: "Bulnix is a premium digital accounts marketplace offering Instagram, Facebook, TikTok, Netflix, Spotify, gaming, VPN and 500+ more digital products with instant delivery.",
    sameAs: [
      "https://t.me/bulnixupdates",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: "English",
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Bulnix",
    url: "https://bulnix.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://bulnix.com/products?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function productSchema({
  name,
  description,
  image,
  url,
  priceUSD,
  inStock,
  category,
}: {
  name: string;
  description?: string;
  image?: string;
  url: string;
  priceUSD: number;
  inStock: boolean;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description ?? name,
    image: image ?? DEFAULT_IMAGE,
    url,
    brand: { "@type": "Brand", name: "Bulnix" },
    category: category ?? "Digital Accounts",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: priceUSD.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Bulnix" },
      url,
    },
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
