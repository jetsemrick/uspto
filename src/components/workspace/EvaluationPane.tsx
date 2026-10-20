"use client";

import {
  DETERMINATION_LABELS,
  FINDING_LABELS,
  type ClaimAssessment,
  type ClaimFinding,
  type EvaluationSection,
  type ExaminerDetermination,
} from "@/lib/schemas/evaluation";
import { useState } from "react";

type Props = {
  assessments: ClaimAssessment[];
  sections: EvaluationSection[];
  determinations: Record<number, ExaminerDetermination>;
  stale: boolean;
  streaming: boolean;
  onDeterminationChange: (claimNumber: number, value: ExaminerDetermination) => void;
  onSectionChange: (id: string, body: string) => void;
  onRevise: (sectionId: string, heading: string, body: string, instruction: string) => void;
  revisingId: string | null;
  onCopy: () => void;
  onDownload: () => void;
};

const FINDING_STYLES: Record<ClaimFinding, string> = {
  supported: "bg-sky-50 text-sky-900 ring-sky-200",
  "not-supported": "bg-emerald-50 text-emerald-900 ring-emerald-200",
  "insufficient-record": "bg-amber-50 text-amber-900 ring-amber-200",
};

export function EvaluationPane({
  assessments,
  sections,
  determinations,
  stale,
  streaming,
  onDeterminationChange,
  onSectionChange,
  onRevise,
  revisingId,
  onCopy,
  onDownload,
}: Props) {
  const empty = assessments.length === 0 && sections.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Obviousness evaluation</h2>
          <p className="text-xs text-slate-500">
            AI assessment is advisory. The determination for each claim is yours.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            disabled={empty || streaming}
            className="rounded bg-slate-800 px-3 py-1 text-xs text-white disabled:opacity-40"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={empty || streaming}
            className="rounded px-3 py-1 text-xs ring-1 ring-slate-300 disabled:opacity-40"
          >
            Download
          </button>
        </div>
      </div>

      {stale && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Chart reviews changed after this evaluation ran. Run step 3 again to update it.
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        {empty && (
          <p className="max-w-prose text-sm leading-relaxed text-slate-500">
            Review the claim chart, then run the evaluation. Agree or disagree with each mapping
            first; unreviewed mappings are not treated as teachings.
          </p>
        )}

        {assessments.length > 0 && (
          <section aria-labelledby="findings-heading" className="mb-6">
            <h3
              id="findings-heading"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Findings by claim
            </h3>
            <div className="space-y-3">
              {assessments.map((a) => (
                <article key={a.claimNumber} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold text-slate-900">
                      Claim {a.claimNumber}
                    </h4>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ring-1 ${FINDING_STYLES[a.finding]}`}
                    >
                      {FINDING_LABELS[a.finding]}
                    </span>
                    <span className="text-xs text-slate-500">{a.confidence} confidence</span>
                  </div>
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-slate-800">
                    {a.summary}
                  </p>
                  <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                    Your determination
                    <select
                      value={determinations[a.claimNumber] ?? "undecided"}
                      onChange={(e) =>
                        onDeterminationChange(
                          a.claimNumber,
                          e.target.value as ExaminerDetermination,
                        )
                      }
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    >
                      {(Object.keys(DETERMINATION_LABELS) as ExaminerDetermination[]).map((d) => (
                        <option key={d} value={d}>
                          {DETERMINATION_LABELS[d]}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          </section>
        )}

        {sections.length > 0 && (
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {sections.map((s) => (
              <EvaluationSectionView
                key={s.id}
                section={s}
                disabled={streaming}
                revising={revisingId === s.id}
                onChange={(body) => onSectionChange(s.id, body)}
                onRevise={(instruction) => onRevise(s.id, s.heading, s.body, instruction)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type SectionProps = {
  section: EvaluationSection;
  disabled: boolean;
  revising: boolean;
  onChange: (body: string) => void;
  onRevise: (instruction: string) => void;
};

function EvaluationSectionView({
  section,
  disabled,
  revising,
  onChange,
  onRevise,
}: SectionProps) {
  const [mode, setMode] = useState<"read" | "edit" | "revise">("read");
  const [instruction, setInstruction] = useState("");
  const headingId = `section-${section.id}`;

  return (
    <section aria-labelledby={headingId} className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={headingId} className="text-sm font-semibold text-slate-900">
          {section.heading}
        </h3>
        {!disabled && mode === "read" && (
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="text-blue-700 hover:underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode("revise")}
              className="text-blue-700 hover:underline"
            >
              Revise with Grok
            </button>
          </div>
        )}
      </div>

      {mode === "edit" ? (
        <div className="mt-2">
          <textarea
            aria-label={section.heading}
            value={section.body}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.min(24, Math.max(6, Math.ceil(section.body.length / 70)))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm leading-relaxed"
          />
          <button
            type="button"
            onClick={() => setMode("read")}
            className="mt-2 rounded bg-slate-800 px-3 py-1 text-xs text-white"
          >
            Done
          </button>
        </div>
      ) : (
        <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed text-slate-800">
          {section.body}
        </p>
      )}

      {mode === "revise" && (
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!instruction.trim()) return;
            onRevise(instruction);
            setInstruction("");
            setMode("read");
          }}
        >
          <input
            type="text"
            autoFocus
            aria-label={`Revision instruction for ${section.heading}`}
            placeholder="e.g. Shorten this and address teaching away"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="min-w-[14rem] flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={!instruction.trim()}
            className="rounded bg-blue-700 px-3 py-1 text-xs text-white disabled:opacity-40"
          >
            Revise
          </button>
          <button
            type="button"
            onClick={() => setMode("read")}
            className="rounded px-3 py-1 text-xs ring-1 ring-slate-300"
          >
            Cancel
          </button>
        </form>
      )}

      {revising && <p className="mt-2 text-xs text-slate-500">Revising this section…</p>}
    </section>
  );
}
