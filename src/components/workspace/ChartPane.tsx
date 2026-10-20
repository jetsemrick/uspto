"use client";

import type { MatterDocuments } from "@/lib/ai/context";
import type { LimitationSplit } from "@/lib/schemas/limitations";
import type { ReviewedCell } from "@/lib/types/workspace";

type Props = {
  docs: MatterDocuments;
  split: LimitationSplit;
  cells: ReviewedCell[];
  baseReferenceId: string | null;
  onBaseChange: (id: string) => void;
  onReviewChange: (limitationId: string, referenceId: string, review: ReviewedCell["review"]) => void;
  onSelectQuote: (referenceId: string, quote: string) => void;
};

export function ChartPane({
  docs,
  split,
  cells,
  baseReferenceId,
  onBaseChange,
  onReviewChange,
  onSelectQuote,
}: Props) {
  const limitations = split.independentClaims.flatMap((ic) => ic.limitations);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Claim chart
        </h2>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          Base reference
          <select
            value={baseReferenceId ?? ""}
            onChange={(e) => onBaseChange(e.target.value)}
            className="rounded border border-slate-200 px-2 py-1"
          >
            {docs.references.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-[11px]">
          <thead className="sticky top-0 bg-slate-100 text-slate-600">
            <tr>
              <th className="border-b border-slate-200 p-2 font-semibold">Limitation</th>
              {docs.references.map((r) => (
                <th key={r.id} className="border-b border-slate-200 p-2 font-semibold">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {limitations.map((lim) => (
              <tr key={lim.id} className="align-top">
                <td className="border-b border-slate-100 p-2 text-slate-800">
                  <span className="font-medium text-slate-500">Cl. {lim.claimNumber}</span>
                  <p className="mt-1">{lim.text}</p>
                </td>
                {docs.references.map((ref) => {
                  const cell = cells.find(
                    (c) => c.limitationId === lim.id && c.referenceId === ref.id,
                  );
                  if (!cell) {
                    return (
                      <td key={ref.id} className="border-b border-slate-100 p-2 text-slate-400">
                        —
                      </td>
                    );
                  }
                  const statusColor =
                    cell.status === "supported"
                      ? "bg-emerald-50 text-emerald-800"
                      : cell.status === "partial"
                        ? "bg-amber-50 text-amber-900"
                        : "bg-slate-100 text-slate-600";
                  return (
                    <td key={ref.id} className="border-b border-slate-100 p-2">
                      <div className={`rounded p-2 ${statusColor}`}>
                        <div className="font-semibold uppercase">{cell.status}</div>
                        {cell.quote && (
                          <button
                            type="button"
                            className="mt-1 block text-left underline"
                            onClick={() => onSelectQuote(ref.id, cell.quote!)}
                          >
                            View quote
                          </button>
                        )}
                        {cell.locator && (
                          <p className="mt-1 text-[10px] opacity-80">{cell.locator}</p>
                        )}
                        {cell.readsOn && <p className="mt-1">{cell.readsOn}</p>}
                        {cell.status !== "missing" && (
                          <div className="mt-2 flex gap-1">
                            <button
                              type="button"
                              aria-pressed={cell.review === "agreed"}
                              onClick={() => onReviewChange(lim.id, ref.id, "agreed")}
                              className={`rounded px-2 py-0.5 ${
                                cell.review === "agreed"
                                  ? "bg-slate-800 text-white"
                                  : "bg-white ring-1 ring-slate-300"
                              }`}
                            >
                              Agree
                            </button>
                            <button
                              type="button"
                              aria-pressed={cell.review === "disagreed"}
                              onClick={() => onReviewChange(lim.id, ref.id, "disagreed")}
                              className={`rounded px-2 py-0.5 ${
                                cell.review === "disagreed"
                                  ? "bg-slate-600 text-white"
                                  : "bg-white ring-1 ring-slate-300"
                              }`}
                            >
                              Disagree
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
