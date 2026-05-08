/**
 * download-proxy Edge Function — REDIRECT-BASED (zero egress)
 *
 * PREVIOUS BEHAVIOUR (caused massive egress):
 *   Fetched the entire video/file from the upstream URL and streamed it
 *   through Supabase Edge Functions, causing every byte to count as
 *   Supabase Functions Egress.
 *
 * NEW BEHAVIOUR (zero egress):
 *   Returns a 302 redirect directly to the upstream URL.
 *   Bytes flow: Upstream server → user device (Supabase never touched).
 *
 * The app handles CORS/geo-blocking itself using the free Vercel proxy
 * as a fallback — no need to route video bytes through Supabase.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "url parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate URL
    try {
      const parsed = new URL(targetUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Only http/https URLs are allowed");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or disallowed URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── ZERO-EGRESS: Return 302 redirect ─────────────────────────────────────
    // The client follows the redirect and downloads/streams directly from source.
    // Supabase never touches the video bytes — eliminating Functions Egress.
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": targetUrl,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[download-proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
