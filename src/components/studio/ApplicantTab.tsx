import type { Application, Finding, ModelCheck, ReadinessReport, Severity } from "@/lib/types/studio";
import { isFormalityCheck } from "@/lib/studio/from-readiness";
import { buildOutline, type OutlineStatus } from "@/lib/studio/outline";
import { uploadKind } from "@/lib/studio/upload";
import { CheckStatus } from "./DocumentUpload";
import type { DocumentCheck } from "./useDocumentCheck";

interface ApplicantTabProps {
  application: Application;
  findings: Finding[];
  summary: ReadinessReport["summary"];
  modelCheck?: ModelCheck;
  check: DocumentCheck;
}

const SEVERITIES: Severity[] = ["must-fix", "should-fix", "advisory"];

const SEVERITY_LABEL: Record<Severity, string> = {
  "must-fix": "Must fix",
  "should-fix": "Should fix",
  advisory: "Advisory",
};

const STATUS_LABEL: Record<OutlineStatus, string> = {
  present: "Present",
  missing: "Not found",
  "not-checked": "Not checked",
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const className =
    severity === "must-fix" ? "sev sev--must" : severity === "should-fix" ? "sev sev--should" : "sev sev--adv";
  return <span className={className}>{SEVERITY_LABEL[severity]}</span>;
}

function FindingRow({ finding, open = false }: { finding: Finding; open?: boolean }) {
  return (
    <div className={open ? "frow open" : "frow"}>
      <span>
        <SeverityBadge severity={finding.severity} />
      </span>
      <div>
        <div className="frow__title">{finding.title}</div>
        <div className="frow__evidence">{finding.evidence}</div>
      </div>
      <span className="frow__loc">{finding.location}</span>
      <span className="cite">{finding.authority}</span>
    </div>
  );
}

function methodsLabel(findings: Finding[]): string {
  return findings.some((f) => f.method !== "rules") ? "rule and model checks" : "rule checks";
}

function modelNote(modelCheck: ModelCheck): string {
  if (modelCheck.status === "used") {
    return `Antecedent basis was checked by ${modelCheck.model} through the xAI API. Everything else is a rule check.`;
  }
  if (modelCheck.status === "failed") {
    return `${modelCheck.model} didn't respond, so antecedent basis used the keyword rule instead.`;
  }
  return "Rule checks only. Set X_AI_KEY to add the Grok antecedent-basis check.";
}

function countFindings(n: number): string {
  return `${n} ${n === 1 ? "finding" : "findings"}`;
}

export default function ApplicantTab({
  application,
  findings,
  summary,
  modelCheck,
  check,
}: ApplicantTabProps) {
  const uploaded = Boolean(application.sourceFile);
  const sourceKind = application.sourceFile && uploadKind(application.sourceFile) === "pdf" ? "PDF" : "DOCX";
  const formalities = findings.filter((f) => isFormalityCheck(f.checkId));
  const claimIssues = findings.filter((f) => !isFormalityCheck(f.checkId));
  const outline = buildOutline(application, findings);
  const checking = check.state === "uploading";

  return (
    <>
      <div className="titlebar">
        <h1 className="fd-label titlebar__label">Readiness report · {application.title}</h1>
        <div className="meta">
          {uploaded ? (
            <div className="kv">
              <span className="fd-label">File</span>
              <span className="v kv__file" title={application.sourceFile}>
                {application.sourceFile}
              </span>
            </div>
          ) : (
            <div className="kv">
              <span className="fd-label">Applicant</span>
              <span className="v">{application.applicant}</span>
            </div>
          )}
          <div className="kv">
            <span className="fd-label">Filed</span>
            <span className="v">{application.filed}</span>
          </div>
          <div className="kv">
            <span className="fd-label">Checked</span>
            <span className="v">{application.checked}</span>
          </div>
        </div>
      </div>

      <CheckStatus check={check} />

      <div className="report" data-stale={checking} aria-busy={checking}>
        <section className="panel" aria-labelledby="f-h">
          <h2 id="f-h" className="fd-sr-only">
            {countFindings(summary.total)}: {summary.mustFix} must fix, {summary.shouldFix} should fix,{" "}
            {summary.advisory} advisory
          </h2>

          {findings.length === 0 && (
            <p className="muted">No findings. The rule checks found nothing in this document.</p>
          )}

          {formalities.length > 0 && (
            <>
              <div className="group-h">
                <h3>Formalities</h3>
                <span className="fd-label">
                  {countFindings(formalities.length)} · {methodsLabel(formalities)}
                </span>
              </div>
              {formalities.map((finding) => (
                <FindingRow key={finding.id} finding={finding} />
              ))}
            </>
          )}

          {claimIssues.length > 0 && (
            <>
              <div className="group-h">
                <h3>Claim issues under 35 U.S.C. 112</h3>
                <span className="fd-label">
                  {countFindings(claimIssues.length)} · {methodsLabel(claimIssues)}
                </span>
              </div>
              {claimIssues.map((finding) => {
                const showExpanded = !uploaded && finding.id === "F-02";
                return (
                  <div key={finding.id}>
                    <FindingRow finding={finding} open={showExpanded} />
                    {showExpanded && finding.suggestedFix && (
                      <div className="expand">
                        <div>
                          <span className="fd-label expand__label">Suggested fix</span>
                          <p className="fix">
                            3. The node of claim 1, wherein <del>the</del> <ins>a</ins> sensor housing is sealed against
                            water ingress.
                          </p>
                        </div>
                        <div>
                          <span className="fd-label expand__label">Why we flagged it</span>
                          <p className="small expand__why">
                            Searched claims 1–3 for an earlier &quot;sensor housing&quot;. None found. Spec ¶[0021] calls
                            it &quot;housing 104&quot;.
                          </p>
                          <span className="conf">
                            <span className="meter" role="img" aria-label="Confidence 5 of 5">
                              <i className="on"></i>
                              <i className="on"></i>
                              <i className="on"></i>
                              <i className="on"></i>
                              <i className="on"></i>
                            </span>
                            <span>High confidence · rule check</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </section>

        <aside className="report__aside">
          <section className="panel" aria-labelledby="o-h">
            <div className="panel__head">
              <h2 id="o-h">Findings</h2>
              <span className="panel__note">Parsed from {sourceKind}</span>
            </div>
            <ul className="where">
              {outline.map((row) => {
                const total = row.counts["must-fix"] + row.counts["should-fix"] + row.counts.advisory;
                return (
                  <li key={row.id} className="where__row">
                    <span className="where__part">
                      {row.label}
                      {row.detail && <span className="where__detail">{row.detail}</span>}
                    </span>
                    {row.status ? (
                      <span className={`where__status where__status--${row.status}`}>{STATUS_LABEL[row.status]}</span>
                    ) : total === 0 ? (
                      <span className="where__status">No issues</span>
                    ) : (
                      SEVERITIES.map((severity) => (
                        <span key={severity} className="where__count">
                          {row.counts[severity] > 0 && (
                            <span className={`mark mark--${severity}`} title={SEVERITY_LABEL[severity]}>
                              {row.counts[severity]}
                              <span className="fd-sr-only"> {SEVERITY_LABEL[severity]}</span>
                            </span>
                          )}
                        </span>
                      ))
                    )}
                  </li>
                );
              })}
            </ul>
            {uploaded && (
              <p className="panel__foot">
                Drawings and the inventor declaration aren&apos;t checked from uploaded files.
              </p>
            )}
            {modelCheck && (
              <p className="panel__foot" data-model-check={modelCheck.status}>
                {modelNote(modelCheck)}
              </p>
            )}
          </section>
        </aside>
      </div>

      <p className="disclaimer">
        Findings are suggestions, not an Office action. An examiner makes every decision. Citations pending
        practitioner review. Uploaded files aren&apos;t stored; claim text may be sent to xAI&apos;s Grok API for
        review.
      </p>
    </>
  );
}
