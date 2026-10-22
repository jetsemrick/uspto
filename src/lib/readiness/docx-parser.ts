/**
 * Parse DOCX file into ParsedApplication format
 */

import mammoth from "mammoth";
import type { ParsedApplication } from "./deterministic-checks";

export async function parseDocx(
  buffer: Buffer,
  applicationId: string,
): Promise<ParsedApplication> {
  // Convert DOCX to HTML
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  // Parse HTML to extract structure
  const app: ParsedApplication = {
    applicationId,
    claims: [],
    paragraphs: [],
    figures: [],
    drawingReferences: [],
    pages: [],
  };

  // Split by common section markers
  const lines = html.split(/<\/?p[^>]*>/).filter((line) => line.trim());

  let lineNumber = 1;
  let inClaims = false;
  let inAbstract = false;

  for (const line of lines) {
    const text = line.replace(/<[^>]+>/g, "").trim();
    if (!text) continue;

    // Detect abstract
    if (/^ABSTRACT$/i.test(text)) {
      inAbstract = true;
      continue;
    }

    if (inAbstract && text.length > 20) {
      app.abstract = text;
      inAbstract = false;
    }

    // Detect claims section
    if (/^CLAIMS?$/i.test(text)) {
      inClaims = true;
      continue;
    }

    // Parse claims
    if (inClaims) {
      const claimMatch = text.match(/^(\d+)\.\s*(.+)/);
      if (claimMatch) {
        app.claims.push({
          number: parseInt(claimMatch[1], 10),
          text: claimMatch[2],
          lineNumber,
        });
      }
    } else {
      // Parse description paragraphs
      const paraMatch = text.match(/^\[(\d+)\]\s*(.+)/);
      if (paraMatch) {
        app.paragraphs.push({
          number: `[${paraMatch[1]}]`,
          text: paraMatch[2],
          lineNumber,
        });
      } else if (text.length > 20 && !/^(BACKGROUND|SUMMARY|DETAILED DESCRIPTION|FIGURES?|DRAWINGS?)$/i.test(text)) {
        // Plain paragraph without numbering
        app.paragraphs.push({
          number: `[${app.paragraphs.length.toString().padStart(4, "0")}]`,
          text,
          lineNumber,
        });
      }
    }

    // Extract figure references (e.g., "FIG. 1", "Figure 2")
    const figMatches = text.matchAll(/(?:FIG\.?|Figure)\s*(\d+[A-Z]?)/gi);
    for (const match of figMatches) {
      if (!app.figures.includes(match[1])) {
        app.figures.push(match[1]);
      }
    }

    // Extract reference numerals (numbers that might be drawing references)
    const refMatches = text.matchAll(/\b(\d+[a-z]?)\b/g);
    for (const match of refMatches) {
      const ref = match[1];
      // Only include if it looks like a reference numeral (10-99 range typically)
      if (parseInt(ref, 10) >= 10 && parseInt(ref, 10) <= 99) {
        if (!app.drawingReferences.includes(ref)) {
          app.drawingReferences.push(ref);
        }
      }
    }

    lineNumber++;
  }

  // Estimate page count (roughly 500 words per page)
  const totalWords = lines.join(" ").split(/\s+/).length;
  const estimatedPages = Math.max(1, Math.ceil(totalWords / 500));
  app.pages = Array.from({ length: estimatedPages }, (_, i) => i + 1);

  return app;
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
