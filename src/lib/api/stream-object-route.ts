import {
  assertModelCredentials,
  getGrokModel,
  resolveReasoningEffort,
  type ReasoningEffort,
} from "@/lib/ai/model";
import {
  assertContextFits,
  type MatterDocuments,
} from "@/lib/ai/context";
import {
  EMPTY_STRUCTURED_OUTPUT,
  formatProviderError,
} from "@/lib/ai/errors";
import {
  createTextStreamResponse,
  Output,
  streamText,
  toTextStream,
} from "ai";
import type { z } from "zod";

export async function streamObjectRoute<T extends z.ZodType>(
  docs: MatterDocuments,
  schema: T,
  prompt: string,
  reasoningEffort: ReasoningEffort,
): Promise<Response> {
  assertModelCredentials();
  assertContextFits(docs);
  const model = getGrokModel();

  let streamError: unknown;

  const result = streamText({
    model,
    output: Output.object({ schema }),
    prompt,
    providerOptions: {
      xai: { reasoningEffort: resolveReasoningEffort(reasoningEffort) },
    },
    onError: ({ error }) => {
      streamError = error;
    },
  });

  const textStream = toTextStream({ stream: result.stream });
  const reader = textStream.getReader();
  const first = await reader.read();

  async function resolveFailureMessage(): Promise<string> {
    if (streamError) return formatProviderError(streamError);
    for await (const part of result.fullStream) {
      if (part.type === "error") return formatProviderError(part.error);
    }
    try {
      await result.output;
    } catch (e) {
      return formatProviderError(e);
    }
    return EMPTY_STRUCTURED_OUTPUT;
  }

  if (first.done && first.value === undefined) {
    return new Response(await resolveFailureMessage(), { status: 502 });
  }

  const stream = new ReadableStream<string>({
    start(controller) {
      if (first.value !== undefined) controller.enqueue(first.value);
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      if (value !== undefined) controller.enqueue(value);
    },
  });

  return createTextStreamResponse({ stream });
}
