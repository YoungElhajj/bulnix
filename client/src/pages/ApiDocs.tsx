import BackButton from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const BASE = typeof window !== "undefined" ? window.location.origin : "https://bulnix.com";

const endpoints = [
  {
    method: "GET", path: "/api/v1/products", auth: false,
    desc: "List all visible products",
    params: [
      { name: "page", desc: "Page number (default: 1)" },
      { name: "limit", desc: "Items per page (default: 24, max: 100)" },
      { name: "categoryId", desc: "Filter by category ID" },
      { name: "search", desc: "Search by product title" },
    ],
    example: `curl "${BASE}/api/v1/products?limit=10"`,
    response: `{ "items": [...], "total": 100, "page": 1 }`,
  },
  {
    method: "GET", path: "/api/v1/products/:id", auth: false,
    desc: "Get a single product by ID",
    params: [],
    example: `curl "${BASE}/api/v1/products/123"`,
    response: `{ "id": 123, "title": "...", "customerPriceUSD": "9.99", ... }`,
  },
  {
    method: "GET", path: "/api/v1/orders", auth: true,
    desc: "List your orders",
    params: [
      { name: "page", desc: "Page number" },
      { name: "status", desc: "Filter: pending | paid | completed | partial | failed" },
    ],
    example: `curl -H "X-API-Key: YOUR_KEY" "${BASE}/api/v1/orders"`,
    response: `{ "items": [...], "total": 5 }`,
  },
  {
    method: "POST", path: "/api/v1/orders", auth: true,
    desc: "Create a new order (paid from wallet balance)",
    params: [],
    example: `curl -X POST -H "X-API-Key: YOUR_KEY" -H "Content-Type: application/json" \\
  -d '{"items":[{"productId":123,"quantity":1}]}' \\
  "${BASE}/api/v1/orders"`,
    response: `{ "orderId": 456, "status": "paid", "totalUSD": "9.99" }`,
  },
  {
    method: "GET", path: "/api/v1/orders/:id/delivery", auth: true,
    desc: "Get delivered credentials for a completed order",
    params: [],
    example: `curl -H "X-API-Key: YOUR_KEY" "${BASE}/api/v1/orders/456/delivery"`,
    response: `{ "status": "completed", "items": [{ "productTitle": "...", "deliveryData": "..." }] }`,
  },
  {
    method: "GET", path: "/api/v1/wallet", auth: true,
    desc: "Get your wallet balance",
    params: [],
    example: `curl -H "X-API-Key: YOUR_KEY" "${BASE}/api/v1/wallet"`,
    response: `{ "balanceUSD": "25.00" }`,
  },
];

const methodColor: Record<string, string> = {
  GET: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  POST: "bg-green-500/20 text-green-400 border-green-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <div className="container max-w-3xl py-6 space-y-8">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold text-white">API Documentation</h1>
            <p className="text-sm text-slate-400">Integrate Bulnix into your platform</p>
          </div>
        </div>

        {/* Auth */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-white">Authentication</h2>
          <p className="text-sm text-slate-400">Pass your API key in the <code className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-300 text-xs">X-API-Key</code> header for all authenticated endpoints.</p>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300">
            X-API-Key: blx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
          </div>
          <Link href="/api-keys">
            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black">Get Your API Key</Button>
          </Link>
        </div>

        {/* Base URL */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">Base URL</p>
          <code className="text-cyan-300 font-mono text-sm">{BASE}/api/v1</code>
        </div>

        {/* Endpoints */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-white">Endpoints</h2>
          {endpoints.map((ep, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`${methodColor[ep.method]} font-mono text-xs`}>{ep.method}</Badge>
                <code className="text-white font-mono text-sm">{ep.path}</code>
                {ep.auth && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Auth Required</Badge>}
              </div>
              <p className="text-sm text-slate-400">{ep.desc}</p>
              {ep.params.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Parameters</p>
                  <div className="space-y-1">
                    {ep.params.map(p => (
                      <div key={p.name} className="flex gap-3 text-xs">
                        <code className="text-cyan-300 w-28 shrink-0">{p.name}</code>
                        <span className="text-slate-400">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Example Request</p>
                <pre className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">{ep.example}</pre>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Response</p>
                <pre className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">{ep.response}</pre>
              </div>
            </div>
          ))}
        </div>

        {/* Rate Limits */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-white">Rate Limits</h2>
          <p className="text-sm text-slate-400">API requests are limited to <strong className="text-white">60 requests per minute</strong> per API key. Exceeding this returns a <code className="bg-slate-700 px-1 rounded text-xs text-red-300">429 Too Many Requests</code> response.</p>
        </div>
      </div>
    </div>
  );
}
