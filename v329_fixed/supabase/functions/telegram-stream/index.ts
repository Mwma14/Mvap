/**
 * telegram-stream Edge Function — REDIRECT-BASED (zero egress)
 *
 * PREVIOUS BEHAVIOUR (caused 367 GB egress):
 *   Fetched entire Telegram video and streamed it through Supabase Edge Functions,
 *   causing every video byte to count as Supabase Functions Egress.
 *
 * NEW BEHAVIOUR (zero egress):
 *   Calls Telegram getFile to get the file_path, then returns a 302 redirect
 *   to the direct Telegram CDN URL. Video bytes flow directly from
 *   Telegram CDN → user device, bypassing Supabase entirely.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

    const url = new URL(req.url);
    const fileId = url.searchParams.get("file_id");

    if (!fileId) {
      return new Response(JSON.stringify({ error: "file_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read custom Bot API URL from site_settings
    let baseUrl = "https://api.telegram.org";
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "telegram_bot_api_url")
        .single();
      if (data?.value) {
        const parsed = typeof data.value === "string" ? data.value : "";
        const trimmed = parsed.replace(/\/+$/, "").trim();
        if (trimmed) baseUrl = trimmed;
      }
    } catch {
      // fallback to default
    }

    // Get the file path from Telegram
    const getFileRes = await fetch(
      `${baseUrl}/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const getFileData = await getFileRes.json();

    if (!getFileData.ok || !getFileData.result?.file_path) {
      return new Response(
        JSON.stringify({ error: "Failed to get file from Telegram", details: getFileData }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const filePath = getFileData.result.file_path;

    // ─── ZERO-EGRESS FIX ──────────────────────────────────────────────────────
    // Return a 302 redirect to the direct Telegram CDN URL instead of proxying.
    // Video bytes now flow: Telegram CDN → user device (Supabase never touched).
    // This eliminates 99%+ of Functions Egress.
    const telegramFileUrl = `${baseUrl}/file/bot${BOT_TOKEN}/${filePath}`;

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": telegramFileUrl,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Stream error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
