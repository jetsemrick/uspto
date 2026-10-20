"use client";

import type { MatterDocuments } from "@/lib/ai/context";
import { useEffect, useMemo, useRef } from "react";

type TabId = "claims" | "spec" | string;

type Props = {
  docs: MatterDocuments;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  highlightQuote?: string;
};

export function SourcePane({ docs, activeTab, onTabChange, highlightQuote }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  const tabs = useMemo(() => {
    const base: { id: TabId; label: string }[] = [
      { id: "claims", label: "Claims" },
      { id: "spec", label: "Specification" },
    ];
    for (const r of docs.references) {
      base.push({ id: r.id, label: r.label });
    }
    return base;
  }, [docs.references]);

  const body =
    activeTab === "claims"
      ? docs.claims
      : activeTab === "spec"
        ? docs.specification
        : docs.references.find((r) => r.id === activeTab)?.body ?? "";

  const rendered = useMemo(() => {
    if (!highlightQuote?.trim()) return { before: body, match: "", after: "" };
    const idx = body.toLowerCase().indexOf(highlightQuote.toLowerCase().slice(0, 60));
    if (idx < 0) return { before: body, match: "", after: "" };
    const len = Math.min(highlightQuote.length, body.length - idx);
    return {
      before: body.slice(0, idx),
      match: body.slice(idx, idx + len),
      after: body.slice(idx + len),
    };
  }, [body, highlightQuote]);

  useEffect(() => {
    const el = bodyRef.current?.querySelector("[data-quote-highlight]");
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightQuote, activeTab]);

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Source documents
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {docs.applicationNumber} · {docs.title}
        </p>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200 px-2 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`rounded px-2 py-1 text-xs ${
              activeTab === t.id
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={bodyRef}
        className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-3 font-mono text-[11px] leading-relaxed text-slate-800"
      >
        {rendered.match ? (
          <>
            {rendered.before}
            <mark data-quote-highlight className="bg-amber-200">
              {rendered.match}
            </mark>
            {rendered.after}
          </>
        ) : (
          body
        )}
      </div>
    </div>
  );
}
