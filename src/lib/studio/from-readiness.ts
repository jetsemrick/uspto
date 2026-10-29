import type { ParsedApplication } from "@/lib/readiness/deterministic-checks";
import type { DefectLocation, DefectSeverity, DefectType, ReadinessFlag } from "@/lib/types/readiness";
import type { Application, Finding, ModelCheck, ReadinessReport, Severity } from "@/lib/types/studio";

const CHECKS: Record<DefectType, { id: string; name: string; formality: boolean }> = {
  abstract_length: { id: "abstract-length", name: "Abstract length", formality: true },
  claim_numbering: { id: "claim-numbering", name: "Claim numbering", formality: true },
  claim_form: { id: "claim-form", name: "Claim form", formality: true },
  page_numbering: { id: "page-numbering", name: "Page numbering", formality: true },
  drawing_reference: { id: "drawing-reference", name: "Drawing references", formality: true },
  antecedent_basis: { id: "antecedent-basis", name: "Antecedent basis", formality: false },
  means_plus_function: { id: "means-plus-function", name: "Means-plus-function", formality: false },
  relative_term: { id: "relative-term", name: "Relative terms", formality: false },
  indefinite_term: { id: "indefinite-term", name: "Indefinite terms", formality: false },
  multiple_dependency: { id: "multiple-dependent", name: "Multiple dependent claims", formality: false },
  claim_support_gap: { id: "claim-support", name: "Claim support in spec", formality: false },
};

const SEVERITY: Record<DefectSeverity, Severity> = {
  error: "must-fix",
  warning: "should-fix",
  info: "advisory",
};

const SEVERITY_ORDER: Severity[] = ["must-fix", "should-fix", "advisory"];

function formatLocation(location: DefectLocation): string {
  const id = location.identifier.replace(/^paragraph\s*/i, "¶");
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function toFinding(flag: ReadinessFlag): Omit<Finding, "id"> {
  const check = CHECKS[flag.type];
  const shared = {
    checkId: check.id,
    checkName: check.name,
    severity: SEVERITY[flag.severity],
    title: flag.description,
    location: formatLocation(flag.location),
    authority: flag.citation.cfr ? `${flag.citation.cfr} · ${flag.citation.section}` : flag.citation.section,
    authorityDescription: flag.citation.description,
    evidence: flag.suggestedFix ?? flag.citation.description,
    suggestedFix: flag.suggestedFix,
  };

  if (!flag.isDeterministic) {
    return {
      ...shared,
      confidence: "medium",
      confidenceDetail: `Medium · model check (${flag.modelVersion}) · practitioner review recommended`,
      method: "model",
      modelVersion: flag.modelVersion,
      promptVersion: flag.promptVersion,
    };
  }

  return {
    ...shared,
    confidence: check.formality ? "high" : "medium",
    confidenceDetail: check.formality
      ? "High confidence · rule check"
      : "Medium · keyword rule · practitioner review recommended",
    method: "rules",
  };
}

const checkedFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function toStudioReport(
  parsed: ParsedApplication,
  flags: ReadinessFlag[],
  source: { fileName: string; checkedAt: Date; modelCheck?: ModelCheck },
): ReadinessReport {
  const findings: Finding[] = flags
    .map(toFinding)
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
    .map((finding, i) => ({ id: `F-${String(i + 1).padStart(2, "0")}`, ...finding }));

  const application: Application = {
    id: "Unfiled draft",
    title: parsed.title ?? source.fileName.replace(/\.(docx|pdf)$/i, ""),
    applicant: "—",
    filed: "Not filed",
    checked: `${checkedFormat.format(source.checkedAt)} ET`,
    runId: "Upload",
    checksVersion: "v0.4",
    abstract: parsed.abstract ?? "",
    specification: parsed.paragraphs.map(({ number, text }) => ({ number, text })),
    claims: parsed.claims.map(({ number, text }) => ({ number, text })),
    drawings: [],
    inventorDeclaration: null,
    sourceFile: source.fileName,
  };

  return {
    application,
    findings,
    summary: summarizeFindings(findings),
    modelCheck: source.modelCheck,
  };
}

export function summarizeFindings(findings: Finding[]): ReadinessReport["summary"] {
  return {
    total: findings.length,
    mustFix: findings.filter((f) => f.severity === "must-fix").length,
    shouldFix: findings.filter((f) => f.severity === "should-fix").length,
    advisory: findings.filter((f) => f.severity === "advisory").length,
  };
}

export function isFormalityCheck(checkId: string): boolean {
  return Object.values(CHECKS).some((check) => check.id === checkId && check.formality);
}
