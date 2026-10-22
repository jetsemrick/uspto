/**
 * API route for running readiness check evaluation
 * POST /api/readiness-eval
 */

import { runEvaluation, formatEvaluationReport } from "@/lib/readiness/evaluation";

export const maxDuration = 300; // 5 minutes for full evaluation

interface RequestBody {
  format?: "json" | "text";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const format = body.format || "json";

    console.log("Starting readiness check evaluation...");
    const report = await runEvaluation();

    if (format === "text") {
      const textReport = formatEvaluationReport(report);
      return new Response(textReport, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    return Response.json(report);
  } catch (error) {
    console.error("Error in evaluation:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
