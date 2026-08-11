import type { ReactNode } from "react";

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyHeading(text: string, occurrence = 1): string {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
  const base = cleaned || "section";
  return occurrence > 1 ? `${base}-${occurrence}` : base;
}

function normalizeHeadingText(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2")
    .replace(/~~([^~]+)~~/g, "$1")
    .trim();
}

export function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const counts = new Map<string, number>();
  for (const rawLine of markdown.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(rawLine.trim());
    if (!match) continue;
    const text = normalizeHeadingText(match[2]);
    const occurrence = (counts.get(text) ?? 0) + 1;
    counts.set(text, occurrence);
    entries.push({
      id: slugifyHeading(text, occurrence),
      text,
      level: match[1].length === 2 ? 2 : 3,
    });
  }
  return entries;
}

export function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function childrenToText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childrenToText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return childrenToText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

const SAFE_LINK_PATTERNS = [/^#/, /^\//, /^\?/, /^\.{1,2}\//, /^(?:https?:|mailto:)/i];

export function isSafeLinkHref(href?: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed) return false;
  return SAFE_LINK_PATTERNS.some((pattern) => pattern.test(trimmed));
}
