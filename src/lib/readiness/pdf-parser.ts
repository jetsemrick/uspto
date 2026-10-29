/**
 * Parse a text PDF into ParsedApplication format by rebuilding lines and paragraphs from positioned text.
 */

import { extractTextItems } from "unpdf";
import { isHeading, PARAGRAPH_START, parseApplicationBlocks, type TextBlock } from "./block-parser";
import type { ParsedApplication } from "./deterministic-checks";

type PdfItem = Awaited<ReturnType<typeof extractTextItems>>["items"][number][number];

interface Line {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  page: number;
}

export class PdfReadError extends Error {
  constructor(readonly reason: "encrypted" | "no-text" | "unreadable") {
    super(reason);
  }
}

const CLAIM_LINE = /^\d+\s*[.)]\s+[A-Z]/;
const PAGE_MARKER = /^(\d{1,4}|page \d+( of \d+)?|-\s*\d+\s*-)$/i;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function mostCommon(values: number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0] ?? 0;
  for (const [v, n] of counts) if (n > (counts.get(best) ?? 0)) best = v;
  return best;
}

function groupLines(items: PdfItem[]): PdfItem[][] {
  const sorted = items.filter((i) => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: PdfItem[][] = [];
  for (const item of sorted) {
    const row = rows.at(-1);
    if (row && Math.abs(row[0].y - item.y) <= Math.max(2, item.fontSize * 0.4)) row.push(item);
    else rows.push([item]);
  }
  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}

function joinRow(row: PdfItem[]): string {
  let text = "";
  let prev: PdfItem | undefined;
  for (const item of row) {
    const gap = prev ? item.x - (prev.x + prev.width) : 0;
    if (prev && gap > item.fontSize * 0.2 && !text.endsWith(" ") && !item.str.startsWith(" ")) text += " ";
    text += item.str;
    prev = item;
  }
  return text.replace(/\s+/g, " ").trim();
}

function pageLines(items: PdfItem[], page: number): Line[] {
  const rows = groupLines(items);
  const bodyLeft = mostCommon(
    rows.filter((r) => joinRow(r).length >= 30).map((r) => Math.round(r[0].x)),
  );

  return rows.flatMap((row) => {
    // Margin line numbers sit left of the text column on the same baseline.
    const kept = row.filter(
      (item, i) => !(i === 0 && row.length > 1 && /^\d{1,3}$/.test(item.str.trim()) && item.x < bodyLeft - item.fontSize),
    );
    const text = joinRow(kept);
    if (!text || PAGE_MARKER.test(text)) return [];
    return [{ text, x: kept[0].x, y: kept[0].y, fontSize: Math.max(...kept.map((i) => i.fontSize)), page }];
  });
}

function dropRunningHeaders(lines: Line[], totalPages: number): Line[] {
  if (totalPages < 3) return lines;
  const pagesByText = new Map<string, Set<number>>();
  for (const line of lines) {
    if (line.text.length > 100) continue;
    const pages = pagesByText.get(line.text) ?? new Set<number>();
    pages.add(line.page);
    pagesByText.set(line.text, pages);
  }
  const threshold = Math.max(3, totalPages * 0.5);
  return lines.filter((line) => (pagesByText.get(line.text)?.size ?? 0) < threshold);
}

function toBlocks(lines: Line[]): TextBlock[] {
  const gapsByPage = new Map<number, number>();
  for (const page of new Set(lines.map((l) => l.page))) {
    const pageLinesOnly = lines.filter((l) => l.page === page);
    const gaps = pageLinesOnly.slice(1).map((l, i) => pageLinesOnly[i].y - l.y).filter((g) => g > 0);
    gapsByPage.set(page, median(gaps));
  }

  const blocks: TextBlock[] = [];
  let current: string | null = null;
  let prev: Line | null = null;

  const flush = () => {
    if (current) blocks.push({ text: current });
    current = null;
  };

  for (const line of lines) {
    const typicalGap = gapsByPage.get(line.page) ?? 0;
    const startsBlock =
      !prev ||
      isHeading(line.text) ||
      isHeading(prev.text) ||
      PARAGRAPH_START.test(line.text) ||
      CLAIM_LINE.test(line.text) ||
      (prev.page === line.page && typicalGap > 0 && prev.y - line.y > typicalGap * 1.4) ||
      line.x > prev.x + line.fontSize;

    if (startsBlock) {
      flush();
      current = line.text;
    } else if (current && /[a-z]-$/.test(current) && /^[a-z]/.test(line.text)) {
      current = current.slice(0, -1) + line.text;
    } else {
      current = current ? `${current} ${line.text}` : line.text;
    }
    prev = line;
  }
  flush();
  return blocks;
}

export async function parsePdf(buffer: Buffer, applicationId: string): Promise<ParsedApplication> {
  let extracted;
  try {
    extracted = await extractTextItems(new Uint8Array(buffer));
  } catch (error) {
    throw new PdfReadError(error instanceof Error && error.name === "PasswordException" ? "encrypted" : "unreadable");
  }

  const lines = dropRunningHeaders(
    extracted.items.flatMap((pageItems, page) => pageLines(pageItems, page)),
    extracted.totalPages,
  );
  if (lines.reduce((n, l) => n + l.text.length, 0) < 200) throw new PdfReadError("no-text");
  return parseApplicationBlocks(toBlocks(lines), applicationId);
}
