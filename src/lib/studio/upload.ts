import type { ReadinessReport } from "@/lib/types/studio";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME = "application/pdf";

export const UPLOAD_ACCEPT = `.docx,.pdf,${DOCX_MIME},${PDF_MIME}`;

export type UploadKind = "docx" | "pdf";

export function uploadKind(name: string): UploadKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

export type CheckStep = "upload" | "read" | "rules" | "model";
export type CheckStepStatus = "pending" | "running" | "done" | "skipped" | "failed";

/** One line of the newline-delimited JSON stream returned by POST /api/readiness. */
export type CheckEvent =
  | { type: "step"; step: Exclude<CheckStep, "upload">; status: CheckStepStatus; detail?: string }
  | { type: "report"; report: ReadinessReport }
  | { type: "error"; error: string };

export const CHECK_STREAM_MIME = "application/x-ndjson";

export const UNSUPPORTED_TYPE_MESSAGE = "Only Word .docx or PDF files can be checked.";
export const TOO_LARGE_MESSAGE = "That file is over 4 MB. Remove embedded images or drawing sheets and try again.";
