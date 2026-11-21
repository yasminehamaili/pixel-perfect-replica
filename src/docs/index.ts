/**
 * Documentation source. Each page is a Markdown file in ./pages.
 * Add or reorder pages here; the overlay builds its tree, search and prev/next from this list.
 */
import introduction from "./pages/introduction.md?raw";
import quickstart from "./pages/quickstart.md?raw";
import importingData from "./pages/importing-data.md?raw";
import api from "./pages/api.md?raw";

export type DocPage = { slug: string; title: string; content: string };
export type DocGroup = { title: string; pages: DocPage[] };

export const DOC_GROUPS: DocGroup[] = [
  {
    title: "Getting started",
    pages: [
      { slug: "introduction", title: "Introduction", content: introduction },
      { slug: "quickstart", title: "Quickstart", content: quickstart },
    ],
  },
  {
    title: "Guides",
    pages: [
      { slug: "importing-data", title: "Importing data", content: importingData },
      { slug: "api", title: "API", content: api },
    ],
  },
];

export const DOC_PAGES: DocPage[] = DOC_GROUPS.flatMap((g) => g.pages);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

/** Extracts ## and ### headings (outside code fences) for "On this page". */
export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (match?.[1] && match[2]) {
      const text = match[2].replace(/[*_`]/g, "");
      items.push({ id: slugify(text), text, level: match[1].length === 2 ? 2 : 3 });
    }
  }
  return items;
}

export function searchDocs(query: string): DocPage[] {
  const q = query.trim().toLowerCase();
  if (!q) return DOC_PAGES;
  return DOC_PAGES.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
}
