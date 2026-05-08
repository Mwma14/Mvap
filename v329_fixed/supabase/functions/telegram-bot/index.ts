import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const CHANNEL_ID = Deno.env.get("TELEGRAM_CHANNEL_ID")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const update = await req.json();

    const message = update.message || update.channel_post;
    if (!message) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Extract file info from video or document
    const video = message.video;
    const document = message.document;
    const fileObj = video || document;

    if (!fileObj) {
      // Reply: no file found
      if (message.chat?.id) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: message.chat.id,
            text: "⚠️ Please send a video or document file.",
            reply_to_message_id: message.message_id,
          }),
        });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const file_id = fileObj.file_id;
    const file_unique_id = fileObj.file_unique_id;
    const file_name = fileObj.file_name || video?.file_name || `video_${Date.now()}.mp4`;
    const file_size = fileObj.file_size || 0;
    const mime_type = fileObj.mime_type || "video/mp4";

    // Forward to admin channel
    let channelMessageId: number | null = null;
    try {
      const forwardRes = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHANNEL_ID,
            from_chat_id: message.chat.id,
            message_id: message.message_id,
          }),
        }
      );
      const forwardData = await forwardRes.json();
      if (forwardData.ok) {
        channelMessageId = forwardData.result.message_id;
      }
    } catch (e) {
      console.error("Forward error:", e);
    }

    // Save to database
    const { data, error } = await supabase.from("telegram_files").upsert(
      {
        file_id,
        file_unique_id,
        file_name,
        file_size,
        mime_type,
        message_id: channelMessageId,
        channel_id: CHANNEL_ID,
      },
      { onConflict: "file_unique_id" }
    ).select().single();

    if (error) {
      console.error("DB error:", error);
    }

    // Reply with confirmation
    const sizeStr = file_size
      ? `${(file_size / (1024 * 1024)).toFixed(1)} MB`
      : "unknown";

    if (message.chat?.id) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: message.chat.id,
          text: `✅ File received!\n\n📁 ${file_name}\n📦 ${sizeStr}\n🎬 ${mime_type}\n\nSaved to database. You can now link it to a movie in the admin panel.`,
          reply_to_message_id: message.message_id,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, file_id: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200, // Always return 200 to Telegram
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
