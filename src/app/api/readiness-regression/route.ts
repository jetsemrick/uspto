/**
 * API route for regression testing
 * POST /api/readiness-regression
 */

import {
  runRegressionTest,
  saveBaseline,
  formatRegressionResults,
} from "@/lib/readiness/regression";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const saveBaselineFlag = url.searchParams.get("saveBaseline") === "true";
    const simulate = url.searchParams.get("simulate") === "true";

    console.log("Starting regression test...");

    // Run regression test
    const results = await runRegressionTest(
      simulate
        ? {
            modelVersion: "grok-4-1-fast-reasoning-degraded",
            promptVersion: "v0.9",
          }
        : undefined,
    );

    // Save as baseline if requested
    if (saveBaselineFlag) {
      await saveBaseline(results.report);
    }

    // Format results
    const text = formatRegressionResults(results);

    return new Response(text, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error in regression test:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
