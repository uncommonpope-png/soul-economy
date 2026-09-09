// Cloudflare Worker: Zero-Cost GitHub OAuth Bridge (SIP-11)
// Deploy this file as a new Worker (e.g. `soul-auth-gate`) on your free
// Cloudflare account, then set two encrypted env vars:
//   GITHUB_CLIENT_ID     (from your GitHub OAuth App)
//   GITHUB_CLIENT_SECRET (Encrypted)
//
// Route: https://<your-worker-subdomain>.workers.dev
// Client points CONFIG.GATEWAY_URL in js/auth-client.js at this URL.
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://uncommonpope-png.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const { code } = await request.json();
      if (!code) {
        return new Response(JSON.stringify({ error: "Missing authorization code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code
        })
      });

      const tokenData = await tokenResponse.json();

      return new Response(JSON.stringify(tokenData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};