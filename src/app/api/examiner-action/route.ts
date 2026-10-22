/**
 * API route for examiner actions
 * POST /api/examiner-action
 */

import type { ExaminerAction } from "@/lib/types/readiness";
import {
  saveExaminerAction,
  calculateAcceptanceRates,
} from "@/lib/readiness/persistence";

interface RequestBody {
  action: ExaminerAction;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    if (!body.action || !body.action.flagId || !body.action.action) {
      return Response.json(
        { error: "Invalid action data" },
        { status: 400 },
      );
    }

    // Add timestamp if not provided
    const action: ExaminerAction = {
      ...body.action,
      timestamp: body.action.timestamp || new Date().toISOString(),
    };

    await saveExaminerAction(action);

    return Response.json({ success: true, action });
  } catch (error) {
    console.error("Error saving examiner action:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const rates = await calculateAcceptanceRates();
    return Response.json(rates);
  } catch (error) {
    console.error("Error calculating acceptance rates:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
