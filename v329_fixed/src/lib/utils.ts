import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the image URL directly — no proxy needed for Supabase Storage public images.
 * Supabase Storage CDN serves images directly with low latency.
 * Previously this routed through proxies-lake.vercel.app which added an extra
 * network hop and caused slow image loading.
 */
export function proxyImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg';
  // Return direct URL — Supabase Storage public bucket URLs are CDN-served
  return url;
}
