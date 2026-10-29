"use client";

import { useEffect, useRef, useState } from "react";
import { UPLOAD_ACCEPT, type CheckStep, type CheckStepStatus } from "@/lib/studio/upload";
import type { DocumentCheck } from "./useDocumentCheck";

const STEP_ORDER: CheckStep[] = ["upload", "read", "rules", "model"];

const STEP_LABEL: Record<CheckStep, { running: string; idle: string }> = {
  upload: { running: "Uploading file", idle: "Upload file" },
  read: { running: "Reading the document", idle: "Read the document" },
  rules: { running: "Running formality and claim rules", idle: "Formality and claim rules" },
  model: { running: "Reviewing antecedent basis with Grok", idle: "Antecedent basis review" },
};

const STATUS_LABEL: Record<CheckStepStatus, string> = {
  pending: "Waiting",
  running: "In progress",
  done: "Done",
  skipped: "Skipped",
  failed: "Failed",
};

export const UPLOAD_HINT = "Word .docx or text-based PDF, up to 4 MB.";

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function UploadButton({ check, label }: { check: DocumentCheck; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = check.state === "uploading";
  return (
    <>
      <button
        type="button"
        className="fd-btn fd-btn--primary hdr-upload"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title={`${UPLOAD_HINT} You can also drop a file anywhere on this page.`}
      >
        {busy ? "Checking…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        hidden
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (picked) check.check(picked);
        }}
      />
    </>
  );
}

export function CheckStatus({ check }: { check: DocumentCheck }) {
  if (check.state === "idle" || !check.file) return null;

  if (check.state === "error") {
    return (
      <div className="status status--error" role="alert" data-upload-state="error">
        <p className="status__msg">
          Couldn&apos;t check <span className="status__file">{check.file.name}</span>. {check.error}
        </p>
        <button type="button" className="fd-btn fd-btn--ghost status__action" onClick={check.dismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  if (check.state === "done") {
    return (
      <div className="status status--done" role="status" data-upload-state="done">
        <p className="status__msg">
          Checked <span className="status__file">{check.file.name}</span> in {check.tookSeconds} s.
        </p>
        <button type="button" className="fd-btn fd-btn--ghost status__action" onClick={check.dismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  const runningStep = STEP_ORDER.find((step) => check.steps[step].status === "running");
  return (
    <div className="status status--busy" data-upload-state="uploading">
      <div className="status__head">
        <p className="status__msg">
          <span className="status__spinner" aria-hidden="true" />
          Checking <span className="status__file">{check.file.name}</span>. The findings below will be replaced when it
          finishes.
        </p>
        <span className="status__elapsed" aria-hidden="true">
          {formatElapsed(check.elapsedMs)}
        </span>
        <button type="button" className="fd-btn fd-btn--ghost status__action" onClick={check.cancel}>
          Cancel
        </button>
      </div>
      <div className="status__bar" aria-hidden="true">
        <span />
      </div>
      <ol className="progress" aria-label="Check progress">
        {STEP_ORDER.map((step) => {
          const { status, detail } = check.steps[step];
          return (
            <li key={step} className="progress__step" data-status={status}>
              <span className="progress__icon" aria-hidden="true" />
              <span className="progress__label">
                {status === "running" ? `${STEP_LABEL[step].running}…` : STEP_LABEL[step].idle}
                <span className="fd-sr-only">, {STATUS_LABEL[status]}</span>
              </span>
              {status === "running" && step === "model" ? (
                <span className="progress__detail">up to 30 s</span>
              ) : (
                detail && <span className="progress__detail">{detail}</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="fd-sr-only" aria-live="polite">
        {runningStep ? `${STEP_LABEL[runningStep].running}.` : ""}
      </p>
    </div>
  );
}

/** Accepts a file dropped anywhere on the page while `enabled`, and keeps stray drops from navigating the tab. */
export function DropOverlay({ check, enabled }: { check: DocumentCheck; enabled: boolean }) {
  const [dragging, setDragging] = useState(false);
  const accepting = enabled && check.state !== "uploading";
  const checkRef = useRef(check.check);
  useEffect(() => {
    checkRef.current = check.check;
  });

  useEffect(() => {
    let hideTimer: number | undefined;
    const onDragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (!accepting) {
        if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
        return;
      }
      setDragging(true);
      // dragover repeats while the pointer is over the window, so its absence means the drag left.
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setDragging(false), 150);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      window.clearTimeout(hideTimer);
      setDragging(false);
      const dropped = event.dataTransfer?.files[0];
      if (dropped && accepting) checkRef.current(dropped);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [accepting]);

  if (!dragging || !accepting) return null;
  return (
    <div className="drop-overlay" aria-hidden="true">
      <div className="drop-overlay__card">
        <p className="drop-overlay__title">Drop to check this document</p>
        <p className="drop-overlay__hint">{UPLOAD_HINT} Not stored.</p>
      </div>
    </div>
  );
}
