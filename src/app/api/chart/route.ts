import { claimChartPrompt } from "@/lib/ai/prompts";
import { streamObjectRoute } from "@/lib/api/stream-object-route";
import { claimChartSchema } from "@/lib/schemas/chart";
import type { ApiChartBody } from "@/lib/types/workspace";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json()) as ApiChartBody;
  if (!body.docs || !body.limitationSplit) {
    return Response.json(
      { error: "Missing documents or limitation split." },
      { status: 400 },
    );
  }

  return streamObjectRoute(
    body.docs,
    claimChartSchema,
    claimChartPrompt(body.docs, body.limitationSplit),
    "low",
  );
}
