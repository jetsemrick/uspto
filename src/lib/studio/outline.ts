import type { Application, Finding, Severity } from "@/lib/types/studio";

export type OutlineStatus = "present" | "missing" | "not-checked";

export interface OutlineRow {
  id: "specification" | "claims" | "abstract" | "drawings" | "declaration";
  label: string;
  detail?: string;
  counts: Record<Severity, number>;
  status?: OutlineStatus;
}

type FindingSection = "specification" | "claims" | "abstract" | "drawings";

export function sectionOf(finding: Finding): FindingSection {
  if (finding.checkId === "abstract-length" || /^abstract/i.test(finding.location)) return "abstract";
  if (finding.checkId === "drawing-reference" || /^(fig|drawing)/i.test(finding.location)) return "drawings";
  if (finding.checkId === "claim-support" || /^claim/i.test(finding.location)) return "claims";
  return "specification";
}

function emptyCounts(): Record<Severity, number> {
  return { "must-fix": 0, "should-fix": 0, advisory: 0 };
}

function range(first: string, last: string, prefix: string | RegExp = ""): string {
  return first === last ? first : `${first}–${last.replace(prefix, "")}`;
}

export function buildOutline(application: Application, findings: Finding[]): OutlineRow[] {
  const counts: Record<FindingSection, Record<Severity, number>> = {
    specification: emptyCounts(),
    claims: emptyCounts(),
    abstract: emptyCounts(),
    drawings: emptyCounts(),
  };
  for (const finding of findings) counts[sectionOf(finding)][finding.severity]++;

  const { specification: spec, claims, drawings } = application;
  const independent = claims.filter((c) => !/\bclaims?\s+\d+/i.test(c.text)).length;

  return [
    {
      id: "specification",
      label: "Specification",
      detail: spec.length ? `¶${range(spec[0].number, spec[spec.length - 1].number)}` : undefined,
      counts: counts.specification,
      status: spec.length ? undefined : "missing",
    },
    {
      id: "claims",
      label: "Claims",
      detail: claims.length
        ? `${range(String(claims[0].number), String(claims[claims.length - 1].number))} · ${independent} independent`
        : undefined,
      counts: counts.claims,
      status: claims.length ? undefined : "missing",
    },
    {
      id: "abstract",
      label: "Abstract",
      counts: counts.abstract,
      status: application.abstract ? undefined : "missing",
    },
    {
      id: "drawings",
      label: "Drawings",
      detail: drawings.length ? range(drawings[0], drawings[drawings.length - 1], /^FIG\.\s*/) : undefined,
      counts: counts.drawings,
      status: drawings.length ? undefined : "not-checked",
    },
    {
      id: "declaration",
      label: "Inventor declaration",
      counts: emptyCounts(),
      status:
        application.inventorDeclaration === null
          ? "not-checked"
          : application.inventorDeclaration
            ? "present"
            : "missing",
    },
  ];
}
