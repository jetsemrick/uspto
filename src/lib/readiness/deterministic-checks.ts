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
 * Groups cascading errors into a single finding
 * 37 CFR 1.126; MPEP 608.01(j)
 */
export function checkClaimNumbering(app: ParsedApplication): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  if (app.claims.length === 0) {
    return flags;
  }

  const issues: Array<{ expected: number; actual: number; lineNumber?: number }> = [];
  const invalidNumbers: Array<{ actual: number; lineNumber?: number }> = [];

  // Check for consecutive numbering and valid numerals
  for (let i = 0; i < app.claims.length; i++) {
    const expectedNumber = i + 1;
    const actualNumber = app.claims[i].number;

    if (!Number.isInteger(actualNumber) || actualNumber < 1) {
      invalidNumbers.push({
        actual: actualNumber,
        lineNumber: app.claims[i].lineNumber,
      });
    } else if (actualNumber !== expectedNumber) {
      issues.push({
        expected: expectedNumber,
        actual: actualNumber,
        lineNumber: app.claims[i].lineNumber,
      });
    }
  }

  // Create grouped finding for numbering issues
  if (issues.length > 0) {
    const firstIssue = issues[0];
    const affectedClaims = issues.map((iss) => iss.actual);
    const missingClaim = firstIssue.expected;

    flags.push(
      createFlag({
        type: "claim_numbering",
        severity: "error",
        location: {
          type: "claim",
          identifier: `claim ${firstIssue.actual}`,
          lineNumber: firstIssue.lineNumber,
        },
        description: `Claims are not numbered consecutively. Missing claim ${missingClaim}, affecting claims ${affectedClaims.join(", ")}.`,
        suggestedFix: `Renumber claims consecutively starting from 1. Insert or correct claim ${missingClaim}.`,
        citation: {
          section: "MPEP 608.01(j)",
          cfr: "37 CFR 1.126",
          description: "Claims must be numbered consecutively in Arabic numerals",
        },
      }),
    );
  }

  // Create separate findings for invalid numerals
  invalidNumbers.forEach((invalid) => {
    flags.push(
      createFlag({
        type: "claim_numbering",
        severity: "error",
        location: {
          type: "claim",
          identifier: `claim ${invalid.actual}`,
          lineNumber: invalid.lineNumber,
        },
        description: `Invalid claim number: ${invalid.actual}. Must be a positive Arabic numeral.`,
        suggestedFix: `Use positive Arabic numerals (1, 2, 3, ...) for claim numbering.`,
        citation: {
          section: "MPEP 608.01(j)",
          cfr: "37 CFR 1.126",
          description: "Claims must be numbered in Arabic numerals",
        },
      }),
    );
  });

  return flags;
}

/**
 * Check claim form/punctuation: capital letter, single sentence ending in period
 * Groups multiple issues per claim into a single finding
 * MPEP 608.01(m)
 */
export function checkClaimForm(app: ParsedApplication): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  app.claims.forEach((claim) => {
    const text = claim.text.trim();
    const issues: string[] = [];

    // Check if starts with capital letter
    if (text.length > 0 && !/^[A-Z]/.test(text)) {
      issues.push("does not begin with a capital letter");
    }

    // Check if ends with period
    if (text.length > 0 && !text.endsWith(".")) {
      issues.push("does not end with a period");
    }

    // Check for multiple sentences (multiple periods not at the end)
    const periodCount = (text.match(/\./g) || []).length;
    if (periodCount > 1) {
      issues.push("may contain multiple sentences");
    }

    // Create grouped finding if any issues exist
    if (issues.length > 0) {
      flags.push(
        createFlag({
          type: "claim_form",
          severity: "error",
          location: {
            type: "claim",
            identifier: `claim ${claim.number}`,
            lineNumber: claim.lineNumber,
          },
          description: `Claim ${claim.number} ${issues.join(" and ")}.`,
          suggestedFix: `Claim must be a single sentence beginning with a capital letter and ending with a period.`,
          citation: {
            section: "MPEP 608.01(m)",
            description:
              "Each claim must be a single sentence beginning with a capital letter and ending with a period",
          },
        }),
      );
    }
  });

  return flags;
}

/**
 * Check consecutive page numbering
 * Groups cascading errors into a single finding
 * 37 CFR 1.52(b)(5)
 */
export function checkPageNumbering(app: ParsedApplication): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  if (app.pages.length === 0) {
    return flags;
  }

  const issues: Array<{ expected: number; actual: number }> = [];

  for (let i = 0; i < app.pages.length; i++) {
    const expectedPage = i + 1;
    const actualPage = app.pages[i];

    if (actualPage !== expectedPage) {
      issues.push({ expected: expectedPage, actual: actualPage });
    }
  }

  // Create grouped finding for page numbering issues
  if (issues.length > 0) {
    const firstIssue = issues[0];
    const affectedPages = issues.map((iss) => iss.actual);
    const missingPage = firstIssue.expected;

    flags.push(
      createFlag({
        type: "page_numbering",
        severity: "error",
        location: {
          type: "page",
          identifier: `page ${firstIssue.actual}`,
        },
        description: `Pages are not numbered consecutively. Missing page ${missingPage}, affecting pages ${affectedPages.join(", ")}.`,
        suggestedFix: `Renumber pages consecutively starting from 1. Insert or correct page ${missingPage}.`,
        citation: {
          section: "MPEP 608.02",
          cfr: "37 CFR 1.52(b)(5)",
          description: "Pages must be numbered consecutively",
        },
      }),
    );
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

  // Skip check if no drawing references (e.g., sequence listing applications)
  if (app.drawingReferences.length === 0) {
    return flags;
  }

  // Find reference characters in description paragraphs
  const descriptionRefs = new Set<string>();
  app.paragraphs.forEach((para) => {
    // Look for reference numerals (e.g., "10", "12", "14a") in the text
    const matches = para.text.match(/\b(\d+[a-z]?)\b/g);
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

  // Check if description references appear in drawings (only for typical drawing refs)
  const drawingRefSet = new Set(app.drawingReferences);
  descriptionRefs.forEach((ref) => {
    // Only check numeric references in typical drawing range (10-99)
    // Skip if it looks like a sequence, year, or other non-drawing number
    const refNum = parseInt(ref, 10);
    if (
      /^\d+[a-z]?$/.test(ref) &&
      refNum >= 10 &&
      refNum <= 99 &&
      !drawingRefSet.has(ref)
    ) {
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
