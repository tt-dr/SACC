import type { ReactNode } from "react";

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const rawLine of markdown.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(rawLine.trim());
    if (!match) continue;
    const text = match[2].trim();
    entries.push({
      id: slugifyHeading(text),
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
