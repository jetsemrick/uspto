import type { LimitationSplit } from "@/lib/schemas/limitations";

/** Merge partial streamed object into a stable editable split. */
export function coalesceLimitationSplit(
  partial: DeepPartial<LimitationSplit> | undefined,
  fallback: LimitationSplit | null,
): LimitationSplit | null {
  if (!partial?.independentClaims?.length) return fallback;
  const independentClaims = partial.independentClaims
    .filter(Boolean)
    .map((ic, idx) => ({
      claimNumber: ic?.claimNumber ?? fallback?.independentClaims[idx]?.claimNumber ?? idx + 1,
      preamble: ic?.preamble ?? "",
      limitations: (ic?.limitations ?? [])
        .filter(Boolean)
        .map((lim, li) => ({
          id:
            lim?.id ??
            `claim-${ic?.claimNumber ?? idx + 1}-lim-${String.fromCharCode(97 + li)}`,
          claimNumber: lim?.claimNumber ?? ic?.claimNumber ?? idx + 1,
          text: lim?.text ?? "",
          order: lim?.order ?? li,
        })),
    }));
  const dependentClaims = (partial.dependentClaims ?? [])
    .filter(Boolean)
    .map((d) => ({
      claimNumber: d?.claimNumber ?? 0,
      parentClaimNumber: d?.parentClaimNumber ?? 1,
      adds: d?.adds ?? "",
    }))
    .filter((d) => d.claimNumber > 0);

  return {
    independentClaims,
    dependentClaims,
    notes: partial.notes ?? fallback?.notes,
  };
}

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export function defaultBaseReferenceId(
  docs: { references: { id: string }[] },
  current: string | null,
): string | null {
  if (current && docs.references.some((r) => r.id === current)) return current;
  return docs.references[0]?.id ?? null;
}
