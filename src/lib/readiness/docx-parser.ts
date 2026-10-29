/**
 * Parse DOCX file into ParsedApplication format
 */

import mammoth from "mammoth";
import { parseApplicationBlocks, type TextBlock } from "./block-parser";
import type { ParsedApplication } from "./deterministic-checks";

const BLOCK = /<(p|h[1-6]|li)\b[^>]*>([\s\S]*?)<\/\1>/g;

function blockText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function parseDocx(
  buffer: Buffer,
  applicationId: string,
): Promise<ParsedApplication> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const blocks: TextBlock[] = Array.from(html.matchAll(BLOCK), ([, tag, inner]) => ({
    text: blockText(inner),
    listItem: tag === "li",
  }));
  return parseApplicationBlocks(blocks, applicationId);
}

/**
 * Parse Patent Center validation flags
 */
export function parsePatentCenterFlags(flags: string[]): {
  flagType: string;
  description: string;
}[] {
  return flags.map((flag) => {
    // Simulate parsing structured Patent Center flags
    // In production, these would have specific formats
    return {
      flagType: flag.split(":")[0] || "unknown",
      description: flag.split(":")[1]?.trim() || flag,
    };
  });
}
