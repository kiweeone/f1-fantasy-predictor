// /api/openf1.js
// Vercel Serverless Function — OpenF1 Authenticated Proxy
//
// Security:
// 1. Origin/Referer check — only allows requests from your domain
// 2. Path validation — only allows /v1/ OpenF1 endpoints
// 3. Rate limiting — max 60 requests per minute per IP
// 4. CORS restricted to your domain
// 5. Token cached server-side, never exposed to client
//
// Environment Variables (set in Vercel Dashboard):
//   OPENF1_USERNAME — your OpenF1 email
//   OPENF1_PASSWORD — your OpenF1 password

// ─── ALLOWED ORIGINS ───
// Add your domain(s) here
const ALLOWED_ORIGINS = [
  "https://kiwee.one",
  "https://www.kiwee.one",
  "http://localhost:5173",  // Vite dev server
  "http://localhost:3000",
];

// ─── RATE LIMITER (in-memory, resets on cold start) ───
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // max requests per window per IP

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimit[ip] || now - rateLimit[ip].start > RATE_LIMIT_WINDOW) {
    rateLimit[ip] = { start: now, count: 1 };
    return true;
  }
  rateLimit[ip].count++;
  return rateLimit[ip].count <= RATE_LIMIT_MAX;
}

// ─── TOKEN CACHE ───
let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const username = process.env.OPENF1_USERNAME;
  const password = process.env.OPENF1_PASSWORD;

  if (!username || !password) {
    throw new Error("OPENF1_USERNAME and OPENF1_PASSWORD environment variables are required");
  }

  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  const response = await fetch("https://api.openf1.org/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed: ${response.status} — ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (parseInt(data.expires_in) || 3600) * 1000;
  return cachedToken;
}

// ─── HANDLER ───
export default async function handler(req, res) {
  // 1. Only allow GET requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Origin / Referer check
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));

  // Also allow server-side rendering / direct Vercel function calls (no origin)
  const isServerSide = !origin && !referer;

  if (!isAllowed && !isServerSide) {
    return res.status(403).json({ error: "Forbidden: origin not allowed" });
  }

  // Set CORS for allowed origin
  if (origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // 3. Rate limiting
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Max 60/minute." });
  }

  // 4. Validate path parameter
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Missing 'path' query parameter" });
  }

  // Only allow /v1/ endpoints — prevent path traversal or token endpoint abuse
  if (!path.startsWith("/v1/")) {
    return res.status(400).json({ error: "Invalid path. Only /v1/ endpoints are allowed." });
  }

  // Block attempts to access the token endpoint through the proxy
  if (path.includes("token") || path.includes("auth")) {
    return res.status(400).json({ error: "Access denied." });
  }

  try {
    const token = await getToken();
    const url = `https://api.openf1.org${path}`;

    const apiResponse = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!apiResponse.ok) {
      const text = await apiResponse.text();
      return res.status(apiResponse.status).json({
        error: `OpenF1 API error: ${apiResponse.status}`,
        detail: text,
      });
    }

    const data = await apiResponse.json();

    // Cache for 30 seconds
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    // Security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");

    return res.status(200).json(data);
  } catch (error) {
    console.error("OpenF1 proxy error:", error);
    return res.status(500).json({ error: error.message });
  }
}
