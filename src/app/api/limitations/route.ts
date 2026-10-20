import { limitationSplitPrompt } from "@/lib/ai/prompts";
import { streamObjectRoute } from "@/lib/api/stream-object-route";
import { limitationSplitSchema } from "@/lib/schemas/limitations";
import type { ApiMatterBody } from "@/lib/types/workspace";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json()) as ApiMatterBody;
  if (!body.docs?.claims || !body.docs?.references?.length) {
    return Response.json({ error: "Missing claims or references." }, { status: 400 });
  }
  if (body.docs.references.length < 2) {
    return Response.json(
      { error: "At least two prior-art references are required." },
      { status: 400 },
    );
  }

  return streamObjectRoute(
    body.docs,
    limitationSplitSchema,
    limitationSplitPrompt(body.docs),
    "low",
  );
}
