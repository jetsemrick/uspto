"use client";

import type { LimitationSplit } from "@/lib/schemas/limitations";

type Props = {
  split: LimitationSplit;
  onChange: (split: LimitationSplit) => void;
  disabled?: boolean;
};

export function LimitationEditor({ split, onChange, disabled }: Props) {
  return (
    <div className="space-y-4 overflow-auto p-3">
      {split.independentClaims.map((ic, ci) => (
        <div key={ic.claimNumber} className="rounded border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold">
            Claim {ic.claimNumber}
          </div>
          <div className="space-y-2 p-3">
            {ic.limitations.map((lim, li) => (
              <div key={lim.id} className="flex gap-2">
                <span className="mt-2 w-6 shrink-0 text-xs text-slate-400">
                  {String.fromCharCode(97 + li)}
                </span>
                <textarea
                  disabled={disabled}
                  value={lim.text}
                  onChange={(e) => {
                    const next = structuredClone(split);
                    next.independentClaims[ci].limitations[li].text = e.target.value;
                    onChange(next);
                  }}
                  rows={2}
                  className="min-h-[2.5rem] flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  disabled={disabled || ic.limitations.length <= 1}
                  onClick={() => {
                    const next = structuredClone(split);
                    next.independentClaims[ci].limitations.splice(li, 1);
                    onChange(next);
                  }}
                  className="text-xs text-red-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = structuredClone(split);
                const n = next.independentClaims[ci].limitations.length;
                next.independentClaims[ci].limitations.push({
                  id: `claim-${ic.claimNumber}-lim-${n}`,
                  claimNumber: ic.claimNumber,
                  text: "",
                  order: n,
                });
                onChange(next);
              }}
              className="text-xs text-blue-700"
            >
              + Add limitation
            </button>
          </div>
        </div>
      ))}
      {split.dependentClaims.length > 0 && (
        <div className="rounded border border-slate-200 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase text-slate-600">Dependent claims</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
            {split.dependentClaims.map((d) => (
              <li key={d.claimNumber}>
                Claim {d.claimNumber} (from {d.parentClaimNumber}): {d.adds}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
