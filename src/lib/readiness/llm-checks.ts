/**
 * LLM-based readiness checks using Grok
 */

import { generateText, Output } from "ai";
import { z } from "zod";
import { getGrokModel, getGrokModelId, hasXaiApiKey, resolveReasoningEffort } from "@/lib/ai/model";
import type { ParsedApplication } from "./deterministic-checks";
import type { ReadinessFlag } from "@/lib/types/readiness";
import { randomUUID } from "crypto";

const PROMPT_VERSION = "v1.1";

const antecedentSchema = z.object({
  findings: z.array(
    z.object({
      claimNumber: z.number(),
      hasIssue: z.boolean(),
      problematicTerm: z.string().nullable(),
      explanation: z.string(),
    }),
  ),
});

/**
 * Check antecedent basis in claims
 * MPEP 2173.05(e)
 * Throws if the model call fails; use checkAntecedentBasisSafe to fall back silently.
 */
export async function checkAntecedentBasis(
  app: ParsedApplication,
): Promise<ReadinessFlag[]> {
  const flags: ReadinessFlag[] = [];

  if (app.claims.length === 0) {
    return flags;
  }

  const modelVersion = getGrokModelId();

  // Batch process claims in groups to avoid token limits
  const batchSize = 10;
  for (let i = 0; i < app.claims.length; i += batchSize) {
    const batch = app.claims.slice(i, i + batchSize);

    const { output } = await generateText({
      model: getGrokModel(),
      output: Output.object({ schema: antecedentSchema }),
      prompt: buildAntecedentBasisPrompt(batch, app.claims),
      providerOptions: {
        xai: { reasoningEffort: resolveReasoningEffort("low") },
      },
    });

    for (const finding of output.findings) {
      const claim = batch.find((c) => c.number === finding.claimNumber);
      if (!finding.hasIssue || !finding.problematicTerm || !claim) continue;

      const term = finding.problematicTerm.replace(/^(the|said|such)\s+/i, "");
      flags.push({
        id: randomUUID(),
        type: "antecedent_basis",
        severity: "error",
        location: {
          type: "claim",
          identifier: `claim ${finding.claimNumber}`,
          lineNumber: claim.lineNumber,
        },
        description: `Claim ${finding.claimNumber} uses "the ${term}" without antecedent basis. ${finding.explanation}`,
        suggestedFix: `Introduce "a ${term}" earlier in this claim or in the claim it depends on, or change "the ${term}" to "a ${term}".`,
        citation: {
          section: "MPEP 2173.05(e)",
          description:
            "Claims must have proper antecedent basis - terms must be introduced before being referenced",
        },
        modelVersion,
        promptVersion: PROMPT_VERSION,
        isDeterministic: false,
      });
    }
  }

  return flags;
}

function buildAntecedentBasisPrompt(
  batch: Array<{ number: number; text: string }>,
  allClaims: Array<{ number: number; text: string }>,
): string {
  const claimTexts = allClaims.map((c) => `Claim ${c.number}: ${c.text}`).join("\n\n");
  const first = batch[0].number;
  const last = batch[batch.length - 1].number;

  return `You are a USPTO patent examiner checking for antecedent basis issues in patent claims.

RULE: Each term must be properly introduced before it can be referenced. Typically:
- First mention: "a widget" or "an element"
- Subsequent mentions: "the widget" or "said element"

A dependent claim inherits every term introduced in the claims it depends on, directly or through a chain of dependencies. A term introduced in an earlier claim that is not in the dependency chain does NOT provide antecedent basis.

ALL CLAIMS (for context):
${claimTexts}

Report on claims ${first} through ${last} only. Return one entry per claim. For a claim with an issue, set hasIssue to true, set problematicTerm to the noun phrase without its article (for example "sensor housing"), and give a one-sentence explanation naming where the term is missing. For a claim with no issue, set hasIssue to false, problematicTerm to null, and explain briefly.

Do not flag:
- Inherent properties of an introduced element (for example "the surface of a plate")
- References to the claimed subject itself (for example "The system of claim 1")
- Terms already introduced in this claim or in any claim it depends on

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
    if (!hasXaiApiKey()) {
      console.warn(
        "X_AI_KEY not set, skipping antecedent basis check (LLM-only)",
      );
      return [];
    }

    return await checkAntecedentBasis(app);
  } catch (error) {
    console.error("LLM check failed, skipping antecedent basis check:", error);
    return [];
  }
}

export { PROMPT_VERSION };
