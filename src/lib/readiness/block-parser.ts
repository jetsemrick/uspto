/**
 * Turn an ordered list of text blocks (paragraphs, headings, list items) into a ParsedApplication.
 * Shared by the DOCX and PDF parsers.
 */

import type { ParsedApplication } from "./deterministic-checks";

export interface TextBlock {
  text: string;
  listItem?: boolean;
}

// Section headings follow the drop-down lists in the USPTO DOCX Initial Filing Template.
export const CLAIMS_HEADING =
  /^(claims?|claim or claims|claimed( are)?|claims list(ing)?|exemplary claims|i claim|in the claims|lists? of (the )?claims|listing of (the )?claims|patent claims|the claims|the following is claimed|we (hereby )?claim|what is claimed( is)?|what is put forth is|the invention claimed is|the claims (here )?defining the invention are( as follows)?)\s*:?$/i;
export const ABSTRACT_HEADING =
  /^(abstract( clean)?|abstract of (the )?(disclosure|invention)|disclosure abstract|in the abstract|invention abstract|substitute abstract)\s*:?$/i;
export const DRAWINGS_HEADING = /^(drawings?|drawing section|images?|figs?|figures?)\s*:?$/i;
export const SECTION_HEADING =
  /^(title|invention (title|description|specification)|in the specification|specification|description|detailed description|background|best mode|brief (description|statement|summary)|summary|field|technical field|cross[- ]?references?|reference to related|related applications|acknowledgment of government|government (interest|rights)|statement (of|as to)|federal(ly)? (funds|sponsored)|rights to invention|incorporation by reference|joint research agreement|object|origin of the invention|prior art)\b/i;

function isSectionHeading(text: string): boolean {
  return SECTION_HEADING.test(text) && text.length < 80 && !/[.;]$/.test(text);
}

export function isHeading(text: string): boolean {
  return (
    CLAIMS_HEADING.test(text) ||
    ABSTRACT_HEADING.test(text) ||
    DRAWINGS_HEADING.test(text) ||
    isSectionHeading(text)
  );
}

export const CLAIM_START = /^(\d+)(?:\s*[.)]\s*|\s+)(.+)/;
export const PARAGRAPH_START = /^\[(\d{3,5})\]\s*(.+)/;

export function parseApplicationBlocks(blocks: TextBlock[], applicationId: string): ParsedApplication {
  const app: ParsedApplication = {
    applicationId,
    claims: [],
    paragraphs: [],
    figures: [],
    // Drawings are a separate upload, so reference characters can't be read from the text.
    drawingReferences: [],
    // Page numbers live in headers and footers, which aren't part of the extracted text.
    pages: [],
  };

  let section: "body" | "claims" | "abstract" | "drawings" = "body";
  let lineNumber = 0;

  for (const block of blocks) {
    const text = block.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    lineNumber++;

    if (ABSTRACT_HEADING.test(text)) {
      section = "abstract";
      continue;
    }
    if (CLAIMS_HEADING.test(text)) {
      section = "claims";
      continue;
    }
    if (DRAWINGS_HEADING.test(text)) {
      section = "drawings";
      continue;
    }
    if (isSectionHeading(text)) {
      section = "body";
      continue;
    }

    if (section === "drawings") continue;

    if (section === "abstract") {
      app.abstract = app.abstract ? `${app.abstract} ${text}` : text;
      continue;
    }

    if (section === "claims") {
      const numbered = text.match(CLAIM_START);
      const previous = app.claims.at(-1);
      if (numbered) {
        app.claims.push({ number: parseInt(numbered[1], 10), text: numbered[2], lineNumber });
      } else if (block.listItem && (!previous || previous.text.endsWith("."))) {
        // Word auto-numbered lists lose their numbers in conversion.
        app.claims.push({ number: (previous?.number ?? 0) + 1, text, lineNumber });
      } else if (previous) {
        previous.text = `${previous.text} ${text}`;
      }
      continue;
    }

    if (!app.title && app.paragraphs.length === 0 && !text.startsWith("[") && text.length <= 200) {
      app.title = text;
      continue;
    }

    const numberedPara = text.match(PARAGRAPH_START);
    if (numberedPara) {
      app.paragraphs.push({ number: `[${numberedPara[1]}]`, text: numberedPara[2], lineNumber });
    } else if (text.length > 20) {
      app.paragraphs.push({
        number: `[${String(app.paragraphs.length + 1).padStart(4, "0")}]`,
        text,
        lineNumber,
      });
    } else {
      continue;
    }

    for (const match of text.matchAll(/\bFIG(?:URE)?S?\.?\s*(\d+[A-Z]?)/gi)) {
      if (!app.figures.includes(match[1])) app.figures.push(match[1]);
    }
  }

  return app;
}
