import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GitHubChannel {
  name: string;
  logo: string;
  url: string;
  group: string;
  source?: string;
}

interface GitHubResponse {
  date?: string;
  channels?: Record<string, GitHubChannel[]>;
}

interface AltChannel {
  group?: string;
  logo?: string;
  name?: string;
  title?: string;
  uris?: string[];
  headers?: Record<string, string>;
}

interface SourceEntry {
  url: string;
  enabled: boolean;
  label?: string;
}

// Per-source cache
const sourceCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000;

function parseM3U(text: string): Record<string, GitHubChannel[]> {
  const lines = text.split('\n');
  const channels: Record<string, GitHubChannel[]> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;

    const name = line.match(/tvg-name="([^"]*)"/)?.[1] ||
                 line.split(',').pop()?.trim() || 'Unknown';
    const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] || '';
    const group = line.match(/group-title="([^"]*)"/)?.[1] || 'Other';

    let streamUrl = '';
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (next && !next.startsWith('#')) {
        streamUrl = next;
        break;
      }
    }

    if (streamUrl) {
      if (!channels[group]) channels[group] = [];
      channels[group].push({ name, logo, url: streamUrl, group });
    }
  }
  return channels;
}

function parseCustomText(text: string): Record<string, GitHubChannel[]> {
  const channels: Record<string, GitHubChannel[]> = {};
  let currentGroup = 'Other';

  for (const block of text.split(/^-{5,}$/m)) {
    const lines = block.trim().split('\n');
    if (!lines[0]) continue;
    let name = '', url = '', logo = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Group:')) currentGroup = trimmed.slice(6).trim() || 'Other';
      else if (trimmed.startsWith('Name:')) name = trimmed.slice(5).trim();
      else if (trimmed.startsWith('URL:')) url = trimmed.slice(4).trim();
      else if (trimmed.startsWith('Logo:')) logo = trimmed.slice(5).trim();
    }

    if (name && url) {
      if (!channels[currentGroup]) channels[currentGroup] = [];
      channels[currentGroup].push({ name, logo, url, group: currentGroup });
    }
  }
  return channels;
}

function parseCategoryFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 3) {
      const type = segments[segments.length - 3];
      const country = segments[segments.length - 2];
      const formattedType = type.replace(/([a-z])([A-Z])/g, "$1 $2");
      return `${formattedType} - ${country}`;
    }
    if (segments.length >= 2) {
      const type = segments[segments.length - 2];
      return type.replace(/([a-z])([A-Z])/g, "$1 $2");
    }
    return "Other";
  } catch {
    return "Other";
  }
}

async function fetchSources(): Promise<SourceEntry[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "live_tv_sources")
    .single();

  if (error || !data?.value) {
    return [
      {
        url: "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/Arabic/LiveTV.json",
        enabled: true,
      },
    ];
  }

  try {
    const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return (parsed as SourceEntry[]).filter((s) => s.enabled);
  } catch {
    return [];
  }
}

async function fetchBrokenUrls(): Promise<Set<string>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase.from("broken_channels").select("channel_url");
  return new Set((data || []).map((r: any) => r.channel_url));
}

function filterChannels(
  channels: Record<string, GitHubChannel[]>,
  brokenUrls: Set<string>
): Record<string, GitHubChannel[]> {
  const filtered: Record<string, GitHubChannel[]> = {};
  for (const [group, list] of Object.entries(channels)) {
    const valid = list.filter((ch) => !brokenUrls.has(ch.url));
    if (valid.length > 0) {
      filtered[group] = valid;
    }
  }
  return filtered;
}

// Fetch a single source with caching
async function fetchSingleSource(
  sourceUrl: string,
  brokenUrls: Set<string>,
  label?: string
): Promise<{ category: string; channels: Record<string, GitHubChannel[]> }> {
  const cacheKey = `${sourceUrl}::${label || ''}`;
  const now = Date.now();
  const cached = sourceCache[cacheKey];
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const category = label || parseCategoryFromUrl(sourceUrl);
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to fetch source: ${res.status}`);
  const text = await res.text();

  let validChannels: Record<string, GitHubChannel[]>;
  if (text.trimStart().startsWith('#EXTM3U')) {
    validChannels = filterChannels(parseM3U(text), brokenUrls);
  } else {
    let json: any = null;
    try { json = JSON.parse(text); } catch {}

    if (json && json.channels && typeof json.channels === 'object' && !Array.isArray(json.channels)) {
      validChannels = filterChannels(json.channels as Record<string, GitHubChannel[]>, brokenUrls);
    } else if (json && Array.isArray(json)) {
      const grouped: Record<string, GitHubChannel[]> = {};
      for (const item of json as AltChannel[]) {
        const g = item.group || 'Other';
        const streamUrl = item.uris?.[0] || '';
        if (!streamUrl) continue;
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push({
          name: item.name || item.title || 'Unknown',
          logo: item.logo || '',
          url: streamUrl,
          group: g,
        });
      }
      validChannels = filterChannels(grouped, brokenUrls);
    } else if (/^Name:/m.test(text) && /^URL:/m.test(text)) {
      validChannels = filterChannels(parseCustomText(text), brokenUrls);
    } else {
      validChannels = {};
    }
  }

  const result = { category, channels: validChannels };
  sourceCache[cacheKey] = { data: result, timestamp: now };
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sourceUrl = url.searchParams.get("sourceUrl");
    const labelParam = url.searchParams.get("label");

    // Mode 1: Fetch just the list of enabled sources (lightweight)
    if (url.searchParams.get("listSources") === "true") {
      const sources = await fetchSources();
      return new Response(
        JSON.stringify({ sources: sources.map((s) => ({ url: s.url, label: s.label || '' })) }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
          },
        }
      );
    }

    // Mode 2: Fetch a single source by URL
    if (sourceUrl) {
      const brokenUrls = await fetchBrokenUrls();
      const result = await fetchSingleSource(sourceUrl, brokenUrls, labelParam || undefined);
      return new Response(
        JSON.stringify({ date: new Date().toISOString(), ...result }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
          },
        }
      );
    }

    // Mode 3 (legacy): Fetch ALL sources at once
    const sources = await fetchSources();
    const brokenUrls = await fetchBrokenUrls();
    const results: Record<string, any> = {};

    const fetches = await Promise.allSettled(
      sources.map(async (source) => {
        const result = await fetchSingleSource(source.url, brokenUrls, source.label || undefined);
        return { url: source.url, ...result };
      })
    );

    for (const result of fetches) {
      if (result.status === "fulfilled") {
        const { category, channels } = result.value;
        if (Object.keys(channels).length > 0) {
          results[category] = { category, channels };
        }
      }
    }

    return new Response(
      JSON.stringify({ date: new Date().toISOString(), sources: results }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      }
    );
  } catch (error) {
    console.error("live-tv-proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch TV channels" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});