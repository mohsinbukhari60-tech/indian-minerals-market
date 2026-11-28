const PRODUCTS = new Set([
  "Raw Bauxite", "Calcined Bauxite", "High Alumina Cement",
  "Refractory Bricks", "White Fused Alumina", "Brown Fused Alumina",
  "Other Bauxite Products"
]);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
});
const clean = (value, max) => String(value ?? "").trim().slice(0, max);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": url.origin,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "vary": "Origin"
      }});
      if (!env.DB) return json({ success: false, error: "Database binding is not configured." }, 503);

      if (url.pathname === "/api/health" && request.method === "GET") {
        try {
          await env.DB.prepare("SELECT 1").first();
          return json({ success: true, project: "INDIAN MINERALS MARKET", status: "running", database: "connected", mode: "early-access" });
        } catch {
          return json({ success: false, project: "INDIAN MINERALS MARKET", status: "degraded", database: "unavailable" }, 503);
        }
      }

      if (url.pathname === "/api/leads" && request.method === "POST") {
        const origin = request.headers.get("Origin");
        if (origin && origin !== url.origin) return json({ success: false, error: "Request origin not allowed." }, 403);
        let rawBody;
        try { rawBody = await request.text(); } catch { return json({ success: false, error: "Could not read request." }, 400); }
        if (new TextEncoder().encode(rawBody).byteLength > 12000) return json({ success: false, error: "Submission is too large." }, 413);
        let body;
        try { body = JSON.parse(rawBody); } catch { return json({ success: false, error: "Invalid request." }, 400); }
        if (!body || typeof body !== "object" || Array.isArray(body)) return json({ success: false, error: "Invalid request." }, 400);
        // Honeypot: silently accept bot submissions without storing them.
        if (clean(body.website, 200)) return json({ success: true, message: "Your enquiry has been received for review." }, 202);
        const type = clean(body.type, 8);
        const product = clean(body.product, 80);
        const name = clean(body.name, 90);
        const contact = clean(body.contact, 100);
        const location = clean(body.location, 100);
        const details = clean(body.details, 1200);
        const quantity = body.quantity === "" || body.quantity == null ? null : Number(body.quantity);
        if (!["Buy", "Sell"].includes(type) || !PRODUCTS.has(product) || !name || !contact ||
            (quantity !== null && (!Number.isFinite(quantity) || quantity < 0 || quantity > 100000000))) {
          return json({ success: false, error: "Please check the required fields and try again." }, 400);
        }
        try {
          await env.DB.prepare(`INSERT INTO launch_leads
            (lead_type, product, company_name, contact, location, quantity_mt, details)
            VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .bind(type, product, name, contact, location, quantity, details).run();
          return json({ success: true, message: "Your lead was received and is pending review. It will not appear publicly until approved." }, 202);
        } catch {
          return json({ success: false, error: "We could not save your enquiry. Please try again later." }, 503);
        }
      }
      if (url.pathname === "/api/leads" || url.pathname === "/api/health") {
        return json({ success: false, error: "Method not allowed." }, 405);
      }
      return json({ success: false, error: "API route not found." }, 404);
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("INDIAN MINERALS MARKET", { headers: { "content-type": "text/plain" } });
  }
};
