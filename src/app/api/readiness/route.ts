import { getGrokModelId, hasXaiApiKey } from "@/lib/ai/model";
import { runDeterministicChecks, type ParsedApplication } from "@/lib/readiness/deterministic-checks";
import { parseDocx } from "@/lib/readiness/docx-parser";
import { checkAntecedentBasis } from "@/lib/readiness/llm-checks";
import { parsePdf, PdfReadError } from "@/lib/readiness/pdf-parser";
import { toStudioReport } from "@/lib/studio/from-readiness";
import {
  CHECK_STREAM_MIME,
  MAX_UPLOAD_BYTES,
  TOO_LARGE_MESSAGE,
  UNSUPPORTED_TYPE_MESSAGE,
  uploadKind,
  type CheckEvent,
  type UploadKind,
} from "@/lib/studio/upload";
import type { ReadinessFlag } from "@/lib/types/readiness";
import type { ModelCheck } from "@/lib/types/studio";

export const maxDuration = 60;

const PDF_ERRORS: Record<PdfReadError["reason"], string> = {
  encrypted: "That PDF is password-protected. Remove the password and try again.",
  "no-text": "That PDF has no selectable text, so it may be a scan. Upload the DOCX or a text-based PDF.",
  unreadable: "We couldn't read that file as a PDF.",
};

function sniffKind(bytes: Buffer): UploadKind | null {
  if (bytes.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx";
  return null;
}

function countFindings(n: number): string {
  return `${n} ${n === 1 ? "finding" : "findings"}`;
}

async function parseUpload(buffer: Buffer, kind: UploadKind): Promise<ParsedApplication> {
  try {
    return kind === "pdf" ? await parsePdf(buffer, "upload") : await parseDocx(buffer, "upload");
  } catch (error) {
    throw new Error(
      error instanceof PdfReadError ? PDF_ERRORS[error.reason] : "We couldn't read that file as a Word document.",
    );
  }
}

async function runChecks(
  parsed: ParsedApplication,
  send: (event: CheckEvent) => void,
): Promise<{ flags: ReadinessFlag[]; modelCheck: ModelCheck }> {
  const model = getGrokModelId();
  const useModel = hasXaiApiKey() && parsed.claims.length > 0;

  send({ type: "step", step: "rules", status: "running" });
  const ruleFlags = runDeterministicChecks(parsed);
  const keptRuleFlags = useModel ? ruleFlags.filter((f) => f.type !== "antecedent_basis") : ruleFlags;
  send({ type: "step", step: "rules", status: "done", detail: countFindings(keptRuleFlags.length) });

  if (!useModel) {
    const detail = parsed.claims.length === 0 ? "No claims to review" : "Not configured";
    send({ type: "step", step: "model", status: "skipped", detail });
    return { flags: ruleFlags, modelCheck: { status: "off", model } };
  }

  send({ type: "step", step: "model", status: "running" });
  try {
    const modelFlags = await checkAntecedentBasis(parsed);
    send({ type: "step", step: "model", status: "done", detail: countFindings(modelFlags.length) });
    return { flags: [...keptRuleFlags, ...modelFlags], modelCheck: { status: "used", model } };
  } catch (error) {
    console.error("Grok antecedent basis check failed, using keyword rule:", error);
    send({ type: "step", step: "model", status: "failed", detail: "Used the keyword rule instead" });
    return { flags: ruleFlags, modelCheck: { status: "failed", model } };
  }
}

function streamCheck(file: File, buffer: Buffer, kind: UploadKind): Response {
  const encoder = new TextEncoder();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      cancelled = true;
    },
    async start(controller) {
      const send = (event: CheckEvent) => {
        if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        send({ type: "step", step: "read", status: "running" });
        const parsed = await parseUpload(buffer, kind);
        if (parsed.claims.length === 0 && parsed.paragraphs.length === 0) {
          throw new Error("We couldn't find a specification or claims in that document.");
        }
        send({
          type: "step",
          step: "read",
          status: "done",
          detail: `${parsed.paragraphs.length} paragraphs · ${parsed.claims.length} claims`,
        });

        const { flags, modelCheck } = await runChecks(parsed, send);
        const report = toStudioReport(parsed, flags, { fileName: file.name, checkedAt: new Date(), modelCheck });
        send({ type: "report", report });
      } catch (error) {
        send({ type: "error", error: error instanceof Error ? error.message : "The check failed. Try again." });
      } finally {
        if (!cancelled) controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": CHECK_STREAM_MIME,
      // Keeps compression and proxies from holding back the progress lines.
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Send the document as a file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Attach a DOCX or PDF file." }, { status: 400 });
  }
  const claimedKind = uploadKind(file.name);
  if (!claimedKind) {
    return Response.json({ error: UNSUPPORTED_TYPE_MESSAGE }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: TOO_LARGE_MESSAGE }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniffKind(buffer);
  if (kind !== claimedKind) {
    return Response.json(
      { error: `We couldn't read that file as a ${claimedKind === "pdf" ? "PDF" : "Word document"}.` },
      { status: 422 },
    );
  }

  return streamCheck(file, buffer, kind);
}
