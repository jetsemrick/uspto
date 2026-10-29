"use client";

import { useEffect, useRef, useState } from "react";
import type { ReadinessReport } from "@/lib/types/studio";
import {
  MAX_UPLOAD_BYTES,
  TOO_LARGE_MESSAGE,
  UNSUPPORTED_TYPE_MESSAGE,
  uploadKind,
  type CheckEvent,
  type CheckStep,
  type CheckStepStatus,
} from "@/lib/studio/upload";

export type CheckState = "idle" | "uploading" | "done" | "error";

export interface StepState {
  status: CheckStepStatus;
  detail?: string;
}

export type Steps = Record<CheckStep, StepState>;

export interface DocumentCheck {
  state: CheckState;
  file: { name: string; size: number } | null;
  steps: Steps;
  elapsedMs: number;
  error: string | null;
  /** Seconds the last successful check took. */
  tookSeconds: number | null;
  check: (file: File) => void;
  cancel: () => void;
  dismiss: () => void;
}

const INITIAL_STEPS: Steps = {
  upload: { status: "running" },
  read: { status: "pending" },
  rules: { status: "pending" },
  model: { status: "pending" },
};

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function readEvents(body: ReadableStream<Uint8Array>, onEvent: (event: CheckEvent) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffered.indexOf("\n")) >= 0) {
      const line = buffered.slice(0, newline).trim();
      buffered = buffered.slice(newline + 1);
      if (line) onEvent(JSON.parse(line) as CheckEvent);
    }
  }
}

export function useDocumentCheck(onReport: (report: ReadinessReport) => void): DocumentCheck {
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<CheckState>("idle");
  const [file, setFile] = useState<DocumentCheck["file"]>(null);
  const [steps, setSteps] = useState<Steps>(INITIAL_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [tookSeconds, setTookSeconds] = useState<number | null>(null);

  const busy = state === "uploading";

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function setStep(step: CheckStep, next: StepState) {
    setSteps((current) => ({ ...current, [step]: next }));
  }

  function fail(message: string) {
    setState("error");
    setError(message);
  }

  async function check(picked: File) {
    if (busy) return;
    if (!uploadKind(picked.name)) return fail(UNSUPPORTED_TYPE_MESSAGE);
    if (picked.size > MAX_UPLOAD_BYTES) return fail(TOO_LARGE_MESSAGE);

    const controller = new AbortController();
    abortRef.current = controller;
    const start = Date.now();
    setFile({ name: picked.name, size: picked.size });
    setSteps(INITIAL_STEPS);
    setStartedAt(start);
    setNow(start);
    setTookSeconds(null);
    setError(null);
    setState("uploading");

    try {
      const body = new FormData();
      body.append("file", picked);
      const res = await fetch("/api/readiness", { method: "POST", body, signal: controller.signal });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "The check failed. Try again.");
      }
      setStep("upload", { status: "done", detail: formatSize(picked.size) });

      const result: { report?: ReadinessReport; error?: string } = {};
      await readEvents(res.body, (event) => {
        if (event.type === "step") setStep(event.step, { status: event.status, detail: event.detail });
        else if (event.type === "report") result.report = event.report;
        else result.error = event.error;
      });
      if (result.error) throw new Error(result.error);
      if (!result.report) throw new Error("The check stopped before it finished. Try again.");

      setState("done");
      setTookSeconds(Math.max(1, Math.round((Date.now() - start) / 1000)));
      onReport(result.report);
    } catch (err) {
      if (controller.signal.aborted) {
        setState("idle");
        return;
      }
      fail(err instanceof Error ? err.message : "The check failed. Try again.");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  return {
    state,
    file,
    steps,
    elapsedMs: now - startedAt,
    error,
    tookSeconds,
    check: (picked) => void check(picked),
    cancel: () => abortRef.current?.abort(),
    dismiss: () => {
      if (busy) return;
      setState("idle");
      setError(null);
      setTookSeconds(null);
    },
  };
}
