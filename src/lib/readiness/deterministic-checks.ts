/**
 * Deterministic readiness checks (rule-based, no LLM)
 */

import type {
  DefectLocation,
  DefectType,
  DefectSeverity,
  MPEPCitation,
  ReadinessFlag,
} from "@/lib/types/readiness";
import { randomUUID } from "crypto";

export interface ParsedApplication {
  applicationId: string;
  abstract?: string;
  claims: Array<{ number: number; text: string; lineNumber: number }>;
  paragraphs: Array<{ number: string; text: string; lineNumber: number }>;
  figures: string[]; // Figure reference numbers found in spec
  drawingReferences: string[]; // Reference characters from drawings
  pages: number[];
}

/**
 * Check if abstract exceeds 150 words
 * 37 CFR 1.72(b); MPEP 608.01(b)
 */
export function checkAbstractLength(app: ParsedApplication): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  if (!app.abstract) {
    return flags;
  }

  const words = app.abstract.trim().split(/\s+/);
  if (words.length > 150) {
    flags.push(
      createFlag({
        type: "abstract_length",
        severity: "error",
        location: {
          type: "abstract",
          identifier: "abstract",
        },
        description: `Abstract contains ${words.length} words, exceeding the 150-word limit.`,
        suggestedFix: `Reduce abstract to 150 words or fewer. Current: ${words.length} words.`,
        citation: {
          section: "MPEP 608.01(b)",
          cfr: "37 CFR 1.72(b)",
          description: "Abstract must not exceed 150 words",
        },
      }),
    );
  }

  return flags;
}

/**
 * Check claim numbering: consecutive Arabic numerals
 * 37 CFR 1.126; MPEP 608.01(j)
 */
export function checkClaimNumbering(app: ParsedApplication): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  if (app.claims.length === 0) {
    return flags;
  }

  // Check for consecutive numbering
  for (let i = 0; i < app.claims.length; i++) {
    const expectedNumber = i + 1;
    const actualNumber = app.claims[i].number;

    if (actualNumber !== expectedNumber) {
      flags.push(
        createFlag({
          type: "claim_numbering",
          severity: "error",
          location: {
            type: "claim",
            identifier: `claim ${actualNumber}`,
            lineNumber: app.claims[i].lineNumber,
          },
          description: `Claim ${actualNumber} is out of sequence. Expected claim ${expectedNumber}.`,
          suggestedFix: `Renumber claims consecutively starting from 1.`,
          citation: {
            section: "MPEP 608.01(j)",
            cfr: "37 CFR 1.126",
            description: "Claims must be numbered consecutively in Arabic numerals",
          },
        }),
      );
    }
  }

  // Check for non-Arabic numerals (basic check)
  app.claims.forEach((claim) => {
    if (claim.number < 1 || !Number.isInteger(claim.number)) {
      flags.push(
        createFlag({
          type: "claim_numbering",
          severity: "error",
          location: {
            type: "claim",
            identifier: `claim ${claim.number}`,
            lineNumber: claim.lineNumber,
          },
          description: `Invalid claim number: ${claim.number}. Must be a positive Arabic numeral.`,
          suggestedFix: `Use positive Arabic numerals (1, 2, 3, ...) for claim numbering.`,
          citation: {
            section: "MPEP 608.01(j)",
            cfr: "37 CFR 1.126",
            description: "Claims must be numbered in Arabic numerals",
          },
        }),
      );
    }
  });

  return flags;
}

/**
 * Check claim form/punctuation: capital letter, single sentence ending in period
 * MPEP 608.01(m)
 */
export function checkClaimForm(app: ParsedApplication): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  app.claims.forEach((claim) => {
    const text = claim.text.trim();

    // Check if starts with capital letter
    if (text.length > 0 && !/^[A-Z]/.test(text)) {
      flags.push(
        createFlag({
          type: "claim_form",
          severity: "error",
          location: {
            type: "claim",
            identifier: `claim ${claim.number}`,
            lineNumber: claim.lineNumber,
          },
          description: `Claim ${claim.number} does not begin with a capital letter.`,
          suggestedFix: `Capitalize the first letter of the claim.`,
          citation: {
            section: "MPEP 608.01(m)",
            description:
              "Each claim must be a single sentence beginning with a capital letter",
          },
        }),
      );
    }

    // Check if ends with period
    if (text.length > 0 && !text.endsWith(".")) {
      flags.push(
        createFlag({
          type: "claim_form",
          severity: "error",
          location: {
            type: "claim",
            identifier: `claim ${claim.number}`,
            lineNumber: claim.lineNumber,
          },
          description: `Claim ${claim.number} does not end with a period.`,
          suggestedFix: `End the claim with a period.`,
          citation: {
            section: "MPEP 608.01(m)",
            description: "Each claim must end with a period",
          },
        }),
      );
    }

    // Check for multiple sentences (naive check: multiple periods not at the end)
    const periodCount = (text.match(/\./g) || []).length;
    if (periodCount > 1) {
      flags.push(
        createFlag({
          type: "claim_form",
          severity: "warning",
          location: {
            type: "claim",
            identifier: `claim ${claim.number}`,
            lineNumber: claim.lineNumber,
          },
          description: `Claim ${claim.number} may contain multiple sentences (multiple periods detected).`,
          suggestedFix: `Each claim should be a single sentence. Consider using semicolons or commas instead.`,
          citation: {
            section: "MPEP 608.01(m)",
            description: "Each claim must be a single sentence",
          },
        }),
      );
    }
  });

  return flags;
}

/**
 * Check consecutive page numbering
 * 37 CFR 1.52(b)(5)
 */
export function checkPageNumbering(app: ParsedApplication): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  if (app.pages.length === 0) {
    return flags;
  }

  for (let i = 0; i < app.pages.length; i++) {
    const expectedPage = i + 1;
    const actualPage = app.pages[i];

    if (actualPage !== expectedPage) {
      flags.push(
        createFlag({
          type: "page_numbering",
          severity: "error",
          location: {
            type: "page",
            identifier: `page ${actualPage}`,
          },
          description: `Page ${actualPage} is out of sequence. Expected page ${expectedPage}.`,
          suggestedFix: `Renumber pages consecutively starting from 1.`,
          citation: {
            section: "MPEP 608.02",
            cfr: "37 CFR 1.52(b)(5)",
            description: "Pages must be numbered consecutively",
          },
        }),
      );
    }
  }

  return flags;
}

/**
 * Check drawing reference characters: must appear in description
 * 37 CFR 1.84(p)(5); MPEP 608.02
 */
export function checkDrawingReferences(
  app: ParsedApplication,
): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  // Find reference characters in description paragraphs
  const descriptionRefs = new Set<string>();
  app.paragraphs.forEach((para) => {
    // Look for reference numerals (e.g., "10", "12", "14a") in the text
    const matches = para.text.match(/\b\d+[a-z]?\b/g);
    if (matches) {
      matches.forEach((m) => descriptionRefs.add(m));
    }
  });

  // Check if drawing references appear in description
  app.drawingReferences.forEach((ref) => {
    if (!descriptionRefs.has(ref)) {
      flags.push(
        createFlag({
          type: "drawing_reference",
          severity: "error",
          location: {
            type: "figure",
            identifier: `reference ${ref}`,
          },
          description: `Drawing reference character "${ref}" is not mentioned in the specification.`,
          suggestedFix: `Add reference character ${ref} to the description or remove it from the drawings.`,
          citation: {
            section: "MPEP 608.02",
            cfr: "37 CFR 1.84(p)(5)",
            description:
              "Reference characters must appear in both the drawings and the description",
          },
        }),
      );
    }
  });

  // Check if description references appear in drawings
  const drawingRefSet = new Set(app.drawingReferences);
  descriptionRefs.forEach((ref) => {
    // Only check numeric references that look like drawing references
    if (/^\d+[a-z]?$/.test(ref) && !drawingRefSet.has(ref)) {
      flags.push(
        createFlag({
          type: "drawing_reference",
          severity: "warning",
          location: {
            type: "paragraph",
            identifier: `reference ${ref}`,
          },
          description: `Reference character "${ref}" appears in the specification but not in the drawings.`,
          suggestedFix: `Add reference character ${ref} to the drawings or remove it from the description.`,
          citation: {
            section: "MPEP 608.02",
            cfr: "37 CFR 1.84(p)(5)",
            description:
              "Reference characters must appear in both the drawings and the description",
          },
        }),
      );
    }
  });

  return flags;
}

/**
 * Helper to create a flag with standard structure
 */
function createFlag(params: {
  type: DefectType;
  severity: DefectSeverity;
  location: DefectLocation;
  description: string;
  suggestedFix?: string;
  citation: MPEPCitation;
}): ReadinessFlag {
  return {
    id: randomUUID(),
    type: params.type,
    severity: params.severity,
    location: params.location,
    description: params.description,
    suggestedFix: params.suggestedFix,
    citation: params.citation,
    isDeterministic: true,
  };
}

/**
 * Run all deterministic checks
 */
export function runDeterministicChecks(
  app: ParsedApplication,
): ReadinessFlag[] {
  return [
    ...checkAbstractLength(app),
    ...checkClaimNumbering(app),
    ...checkClaimForm(app),
    ...checkPageNumbering(app),
    ...checkDrawingReferences(app),
  ];
}
