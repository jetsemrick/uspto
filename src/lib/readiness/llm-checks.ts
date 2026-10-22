/**
 * LLM-based readiness checks using Grok
 */

import { generateObject } from "ai";
import { z } from "zod";
import { getGrokModel } from "@/lib/ai/model";
import type { ParsedApplication } from "./deterministic-checks";
import type { ReadinessFlag } from "@/lib/types/readiness";
import { randomUUID } from "crypto";

const MODEL_VERSION = "grok-4-1-fast-reasoning";
const PROMPT_VERSION = "v1.0";

/**
 * Check antecedent basis in claims
 * MPEP 2173.05(e)
 */
export async function checkAntecedentBasis(
  app: ParsedApplication,
): Promise<ReadinessFlag[]> {
  const flags: ReadinessFlag[] = [];

  // Only check if we have claims
  if (app.claims.length === 0) {
    return flags;
  }

  // Batch process claims in groups to avoid token limits
  const batchSize = 10;
  for (let i = 0; i < app.claims.length; i += batchSize) {
    const batch = app.claims.slice(i, i + batchSize);

    try {
      const result = await generateObject({
        model: getGrokModel(),
        schema: z.object({
          findings: z.array(
            z.object({
              claimNumber: z.number(),
              hasIssue: z.boolean(),
              problematicTerm: z.string().optional(),
              explanation: z.string(),
            }),
          ),
        }),
        prompt: buildAntecedentBasisPrompt(batch),
      });

      // Convert findings to flags
      result.object.findings.forEach((finding) => {
        if (finding.hasIssue && finding.problematicTerm) {
          const claim = batch.find((c) => c.number === finding.claimNumber);
          flags.push({
            id: randomUUID(),
            type: "antecedent_basis",
            severity: "error",
            location: {
              type: "claim",
              identifier: `claim ${finding.claimNumber}`,
              lineNumber: claim?.lineNumber,
            },
            description: `Antecedent basis issue in claim ${finding.claimNumber}: "${finding.problematicTerm}". ${finding.explanation}`,
            suggestedFix: `Ensure "${finding.problematicTerm}" has proper antecedent basis by introducing it as "a ${finding.problematicTerm}" or "an ${finding.problematicTerm}" before referencing it as "the ${finding.problematicTerm}" or "said ${finding.problematicTerm}".`,
            citation: {
              section: "MPEP 2173.05(e)",
              description:
                "Claims must have proper antecedent basis - terms must be introduced before being referenced",
            },
            modelVersion: MODEL_VERSION,
            promptVersion: PROMPT_VERSION,
            isDeterministic: false,
          });
        }
      });
    } catch (error) {
      console.error("Error checking antecedent basis:", error);
      // Return empty array for this batch on error
    }
  }

  return flags;
}

function buildAntecedentBasisPrompt(
  claims: Array<{ number: number; text: string }>,
): string {
  const claimTexts = claims.map((c) => `Claim ${c.number}: ${c.text}`).join("\n\n");

  return `You are a USPTO patent examiner checking for antecedent basis issues in patent claims.

RULE: Each term must be properly introduced before it can be referenced. Typically:
- First mention: "a widget" or "an element"
- Subsequent mentions: "the widget" or "said element"

Check each claim below for antecedent basis issues. Look for terms that are referenced with "the", "said", or "such" without being properly introduced first.

CLAIMS:
${claimTexts}

For each claim, identify if there is an antecedent basis issue. If yes, provide the problematic term and explanation. If no, explain why the claim is acceptable.

Focus on:
1. Terms referenced with "the" that were not previously introduced with "a" or "an"
2. Terms referenced with "said" that were not previously mentioned
3. Terms that appear in dependent claims but not in the parent claim

Be precise and technical in your analysis.`;
}

/**
 * Fallback for when Grok API is unavailable
 */
export function checkAntecedentBasisDeterministic(
  app: ParsedApplication,
): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  // Simple heuristic: look for "the X" or "said X" that doesn't have "a X" or "an X" before it
  app.claims.forEach((claim) => {
    const text = claim.text;

    // Extract all "the X" references
    const theMatches = text.matchAll(/\bthe\s+([a-z][\w\s-]{1,30}?)\b/gi);
    const theTerms = new Set<string>();
    for (const match of theMatches) {
      theTerms.add(match[1].toLowerCase());
    }

    // Extract all "a X" and "an X" introductions
    const introMatches = text.matchAll(/\b(?:an?)\s+([a-z][\w\s-]{1,30}?)\b/gi);
    const introducedTerms = new Set<string>();
    for (const match of introMatches) {
      introducedTerms.add(match[1].toLowerCase());
    }

    // Check if any "the" term lacks introduction
    theTerms.forEach((term) => {
      if (!introducedTerms.has(term) && !term.includes("comprising")) {
        flags.push({
          id: randomUUID(),
          type: "antecedent_basis",
          severity: "warning",
          location: {
            type: "claim",
            identifier: `claim ${claim.number}`,
            lineNumber: claim.lineNumber,
          },
          description: `Possible antecedent basis issue in claim ${claim.number}: term "${term}" may lack proper introduction.`,
          suggestedFix: `Review the term "${term}". If it has not been introduced with "a" or "an", add proper antecedent basis.`,
          citation: {
            section: "MPEP 2173.05(e)",
            description:
              "Claims must have proper antecedent basis - terms must be introduced before being referenced",
          },
          isDeterministic: true,
        });
      }
    });
  });

  return flags;
}

/**
 * Check if LLM is available, otherwise skip antecedent basis check entirely
 */
export async function checkAntecedentBasisSafe(
  app: ParsedApplication,
): Promise<ReadinessFlag[]> {
  try {
    // Check if API key is available
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.warn(
        "XAI_API_KEY not set, skipping antecedent basis check (LLM-only)",
      );
      return [];
    }

    return await checkAntecedentBasis(app);
  } catch (error) {
    console.error("LLM check failed, skipping antecedent basis check:", error);
    return [];
  }
}

export { MODEL_VERSION, PROMPT_VERSION };
