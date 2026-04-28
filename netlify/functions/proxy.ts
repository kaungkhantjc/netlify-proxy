import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // 1. Authorization
  // Note: Standard Headers objects are case-insensitive, but we check both formats just in case.
  const expectedKey = process.env.NETLIFY_PROXY_API_KEY;
  const providedKey = req.headers.get("NETLIFY_PROXY_API_KEY") || req.headers.get("netlify_proxy_api_key");

  if (!expectedKey) {
    return new Response(JSON.stringify({ error: "Server misconfiguration: API Key not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (providedKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. URL Extraction & Validation
  const url = new URL(req.url);
  const targetUrlStr = url.searchParams.get("url");

  if (!targetUrlStr) {
    return new Response(JSON.stringify({ error: "Missing 'url' query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(targetUrlStr);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid 'url' query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 3. Prepare Proxy Request
  const proxyHeaders = new Headers(req.headers);
  proxyHeaders.delete("host"); // Avoid host mismatch on the target server
  proxyHeaders.delete("netlify_proxy_api_key");
  proxyHeaders.delete("NETLIFY_PROXY_API_KEY"); // Prevent leaking your proxy key downstream

  const requestInit: RequestInit = {
    method: req.method,
    headers: proxyHeaders,
    redirect: "manual", // Let the client handle redirects; don't auto-follow
  };

  // Forward the body using ArrayBuffer for safe binary/text processing
  if (req.method !== "GET" && req.method !== "HEAD") {
    requestInit.body = await req.arrayBuffer();
  }

  // 4. Execute and Forward
  try {
    const proxyResponse = await fetch(targetUrl.toString(), requestInit);
    const responseHeaders = new Headers(proxyResponse.headers);

    // Strip out 'content-encoding' to prevent double-compression issues 
    // (Netlify manages gzip/brotli directly to the final client).
    responseHeaders.delete("content-encoding");

    // Web standards require null bodies for 204/205/304 status codes
    const body = [204, 205, 304].includes(proxyResponse.status) ? null : proxyResponse.body;

    return new Response(body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: "Upstream request failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// Netlify v5 built-in routing
export const config: Config = {
  path: "/v1",
};