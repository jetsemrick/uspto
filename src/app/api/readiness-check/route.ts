/**
 * API route for patent application readiness checks
 * POST /api/readiness-check
 */

import type { ReadinessReport } from "@/lib/types/readiness";
import { runDeterministicChecks } from "@/lib/readiness/deterministic-checks";
import { checkAntecedentBasisSafe } from "@/lib/readiness/llm-checks";
import { getSyntheticApplication } from "@/lib/readiness/synthetic-data";
import { parseDocx, parsePatentCenterFlags } from "@/lib/readiness/docx-parser";

export const maxDuration = 120;

interface RequestBody {
  applicationId?: string;
  docxContent?: string; // Base64 encoded DOCX
  patentCenterFlags?: string[];
  mode?: "applicant" | "examiner";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    let app;
    let applicationId: string;

    // Handle uploaded DOCX
    if (body.docxContent) {
      applicationId = `uploaded-${Date.now()}`;
      const buffer = Buffer.from(body.docxContent, "base64");
      app = await parseDocx(buffer, applicationId);

      // Process Patent Center flags if provided
      if (body.patentCenterFlags && body.patentCenterFlags.length > 0) {
        const pcFlags = parsePatentCenterFlags(body.patentCenterFlags);
        console.log(
          `Patent Center flags received: ${pcFlags.length} flags`,
          pcFlags,
        );
        // These could be used to pre-filter or prioritize checks
      }
    }
    // Handle synthetic test application
    else if (body.applicationId) {
      applicationId = body.applicationId;
      const result = getSyntheticApplication(body.applicationId);
      if (!result) {
        return Response.json(
          { error: `Application ${body.applicationId} not found` },
          { status: 404 },
        );
      }
      app = result.app;
    } else {
      return Response.json(
        { error: "Either applicationId or docxContent is required" },
        { status: 400 },
      );
    }

    // Run all checks
    const deterministicFlags = runDeterministicChecks(app);
    const llmFlags = await checkAntecedentBasisSafe(app);
    const allFlags = [...deterministicFlags, ...llmFlags];

    // Sort by severity (errors first, then warnings, then info)
    const severityOrder = { error: 0, warning: 1, info: 2 };
    allFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Build report
    const report: ReadinessReport = {
      applicationId,
      checkTimestamp: new Date().toISOString(),
      flags: allFlags,
      summary: {
        totalFlags: allFlags.length,
        errorCount: allFlags.filter((f) => f.severity === "error").length,
        warningCount: allFlags.filter((f) => f.severity === "warning").length,
        infoCount: allFlags.filter((f) => f.severity === "info").length,
      },
    };

    return Response.json(report);
  } catch (error) {
    console.error("Error in readiness check:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
