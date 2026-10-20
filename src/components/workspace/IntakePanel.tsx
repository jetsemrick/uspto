"use client";

import type { MatterDocuments } from "@/lib/ai/context";
import { sampleMatter } from "@/lib/sample/matter";

type Props = {
  docs: MatterDocuments;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onChange: (docs: MatterDocuments) => void;
  onLoadSample: () => void;
};

export function IntakePanel({
  docs,
  collapsed,
  onToggleCollapsed,
  onChange,
  onLoadSample,
}: Props) {
  const updateRef = (index: number, patch: Partial<MatterDocuments["references"][0]>) => {
    const references = docs.references.map((r, i) =>
      i === index ? { ...r, ...patch } : r,
    );
    onChange({ ...docs, references });
  };

  if (collapsed) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-900">§103 obviousness evaluation</h1>
          <p className="truncate text-xs text-slate-600">
            {docs.applicationNumber || "Untitled application"} · {docs.title || "No title"} ·{" "}
            {docs.references.map((r) => r.label).join(", ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          className="rounded px-3 py-1.5 text-xs ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Edit documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 border-b border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">§103 obviousness evaluation</h1>
          <p className="mt-1 max-w-3xl text-xs text-slate-600">
            Text you enter is sent to Grok (xAI) for this session only. It is not stored in a
            database. Do not paste unpublished application material.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="rounded bg-slate-800 px-4 py-2 text-sm text-white"
          >
            Load sample case
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={true}
            className="rounded px-4 py-2 text-sm ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Hide documents
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs">
          Application number
          <input
            value={docs.applicationNumber}
            onChange={(e) => onChange({ ...docs, applicationNumber: e.target.value })}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
          />
        </label>
        <label className="text-xs md:col-span-2">
          Title
          <input
            value={docs.title}
            onChange={(e) => onChange({ ...docs, title: e.target.value })}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
          />
        </label>
        <label className="text-xs md:col-span-2">
          Claims
          <textarea
            value={docs.claims}
            onChange={(e) => onChange({ ...docs, claims: e.target.value })}
            rows={6}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-[11px]"
          />
        </label>
        <label className="text-xs md:col-span-2">
          Specification
          <textarea
            value={docs.specification}
            onChange={(e) => onChange({ ...docs, specification: e.target.value })}
            rows={6}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-[11px]"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {docs.references.map((ref, i) => (
          <div key={ref.id} className="rounded border border-slate-200 p-3">
            <div className="grid gap-2">
              <label className="text-xs">
                Reference label
                <input
                  value={ref.label}
                  onChange={(e) => updateRef(i, { label: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
              <label className="text-xs">
                Title
                <input
                  value={ref.title}
                  onChange={(e) => updateRef(i, { title: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
              <label className="text-xs">
                Body
                <textarea
                  value={ref.body}
                  onChange={(e) => updateRef(i, { body: e.target.value })}
                  rows={8}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-[11px]"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">
        Sample bundled: {sampleMatter.applicationNumber} ({sampleMatter.references.length}{" "}
        references).
      </p>
    </div>
  );
}
