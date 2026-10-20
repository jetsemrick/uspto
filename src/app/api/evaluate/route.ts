import { evaluationPrompt } from "@/lib/ai/prompts";
import { streamObjectRoute } from "@/lib/api/stream-object-route";
import { obviousnessEvaluationSchema } from "@/lib/schemas/evaluation";
import type { ApiEvaluateBody } from "@/lib/types/workspace";
import { partitionChart } from "@/lib/workspace/evaluation";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json()) as ApiEvaluateBody;
  if (!body.docs || !body.limitationSplit || !body.cells?.length) {
    return Response.json(
      { error: "Map the prior art before evaluating." },
      { status: 400 },
    );
  }
  if (!body.docs.references.some((r) => r.id === body.baseReferenceId)) {
    return Response.json({ error: "Select a base reference." }, { status: 400 });
  }

  const partition = partitionChart(body.docs, body.limitationSplit, body.cells);

  return streamObjectRoute(
    body.docs,
    obviousnessEvaluationSchema,
    evaluationPrompt({
      docs: body.docs,
      split: body.limitationSplit,
      baseReferenceId: body.baseReferenceId,
      ...partition,
    }),
    "medium",
  );
}
