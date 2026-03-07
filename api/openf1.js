// /api/openf1.js
// Vercel Serverless Function — OpenF1 Authenticated Proxy
//
// This function:
// 1. Gets an OAuth2 token from OpenF1 using credentials stored in env vars
// 2. Proxies the requested API path with the Bearer token
// 3. Caches the token in memory until it expires
//
// Environment Variables needed (set in Vercel Dashboard):
//   OPENF1_USERNAME — your OpenF1 email
//   OPENF1_PASSWORD — your OpenF1 password

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  // Return cached token if still valid (with 60s buffer)
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
  // Token expires in seconds, convert to ms timestamp
  tokenExpiry = Date.now() + (parseInt(data.expires_in) || 3600) * 1000;

  return cachedToken;
}

export default async function handler(req, res) {
  // CORS headers — allow your domain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // The 'path' query param tells us which OpenF1 endpoint to call
  // e.g. /api/openf1?path=/v1/sessions?year=2026&meeting_key=latest
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({
      error: "Missing 'path' query parameter",
      example: "/api/openf1?path=/v1/sessions?year=2026",
    });
  }

  try {
    const token = await getToken();

    // Build the full OpenF1 URL
    // The path comes in as: /v1/sessions?year=2026&meeting_key=latest
    // But Vercel parses query params, so we need to reconstruct
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

    // Cache for 30 seconds (helps with rapid refreshes during live sessions)
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

    return res.status(200).json(data);
  } catch (error) {
    console.error("OpenF1 proxy error:", error);
    return res.status(500).json({ error: error.message });
  }
}
