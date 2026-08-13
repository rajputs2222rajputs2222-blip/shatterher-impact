import type { ContentMap } from "@/lib/content.functions";

/** Reads a CMS value, falling back to the built-in default when unset. */
export function text(content: ContentMap | undefined, key: string, fallback: string) {
  const value = content?.[key];
  return value && value.trim().length > 0 ? value : fallback;
}
