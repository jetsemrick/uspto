import { reviseSectionPrompt } from "@/lib/ai/prompts";
import { streamObjectRoute } from "@/lib/api/stream-object-route";
import { reviseSectionSchema } from "@/lib/schemas/evaluation";
import type { ApiReviseBody } from "@/lib/types/workspace";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as ApiReviseBody;
  if (!body.sectionId || !body.instruction?.trim()) {
    return Response.json(
      { error: "Section id and revision instruction are required." },
      { status: 400 },
    );
  }

  return streamObjectRoute(
    body.docs,
    reviseSectionSchema,
    reviseSectionPrompt({
      sectionId: body.sectionId,
      heading: body.heading,
      currentBody: body.currentBody,
      instruction: body.instruction,
      docs: body.docs,
    }),
    "low",
  );
}
