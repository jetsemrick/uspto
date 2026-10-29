import type { Application, Finding } from "@/lib/types/studio";

interface ApplicantTabProps {
  application: Application;
  findings: Finding[];
  summary: {
    total: number;
    mustFix: number;
    shouldFix: number;
    advisory: number;
  };
}

function SeverityBadge({ severity }: { severity: "must-fix" | "should-fix" | "advisory" }) {
  const className =
    severity === "must-fix"
      ? "sev sev--must"
      : severity === "should-fix"
        ? "sev sev--should"
        : "sev sev--adv";
  const label = severity === "must-fix" ? "Must fix" : severity === "should-fix" ? "Should fix" : "Advisory";
  return <span className={className}>{label}</span>;
}

export default function ApplicantTab({ application, findings, summary }: ApplicantTabProps) {
  const mustFixFindings = findings.filter((f) => f.severity === "must-fix");
  const shouldFixFindings = findings.filter((f) => f.severity === "should-fix");
  const advisoryFindings = findings.filter((f) => f.severity === "advisory");

  const missingParts = findings.filter(
    (f) => f.checkId === "drawing-reference" || f.checkId === "abstract-length"
  );
  const claimIssues = findings.filter(
    (f) =>
      f.checkId !== "drawing-reference" && f.checkId !== "abstract-length"
  );

  return (
    <>
      <div className="titlebar">
        <div>
          <span className="fd-label">Readiness report · {application.title}</span>
          <h1 style={{ marginTop: "8px" }}>
            Your application is accepted. Fix {summary.mustFix} items before examination to avoid a delay.
          </h1>
        </div>
        <div className="meta">
          <div className="kv">
            <span className="fd-label">Applicant</span>
            <span className="v">{application.applicant}</span>
          </div>
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

      <div className="grid-a" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 520px", gap: "48px", alignItems: "start" }}>
        <section className="panel" aria-labelledby="f-h">
          <div className="panel__head">
            <h2 id="f-h">{summary.total} findings</h2>
            <div className="counts" aria-label="Findings by severity" style={{ display: "flex", gap: "40px", padding: "4px 0 0" }}>
              <div>
                <SeverityBadge severity="must-fix" />
                <span className="n" style={{ fontFamily: "var(--fd-font-display)", fontSize: "2.6rem", lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "600", display: "block", marginTop: "6px" }}>{summary.mustFix}</span>
              </div>
              <div>
                <SeverityBadge severity="should-fix" />
                <span className="n" style={{ fontFamily: "var(--fd-font-display)", fontSize: "2.6rem", lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "600", display: "block", marginTop: "6px" }}>{summary.shouldFix}</span>
              </div>
              <div>
                <SeverityBadge severity="advisory" />
                <span className="n" style={{ fontFamily: "var(--fd-font-display)", fontSize: "2.6rem", lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "600", display: "block", marginTop: "6px" }}>{summary.advisory}</span>
              </div>
            </div>
          </div>

          {missingParts.length > 0 && (
            <>
              <div className="group-h" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "14px 0 0" }}>
                <h3 style={{ fontSize: "1.05rem" }}>Missing parts</h3>
                <span className="fd-label">{missingParts.length} findings · rule checks</span>
              </div>
              {missingParts.map((finding) => (
                <div
                  key={finding.id}
                  className="frow"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "150px minmax(0,1fr) 190px 230px",
                    gap: "20px",
                    padding: "9px 0",
                    borderBottom: "1px solid var(--fd-color-line-subtle)",
                    alignItems: "baseline",
                  }}
                >
                  <span>
                    <SeverityBadge severity={finding.severity} />
                  </span>
                  <div>
                    <div className="t" style={{ fontWeight: "600" }}>{finding.title}</div>
                    <div className="d" style={{ color: "var(--fd-fg-2)", fontSize: ".9rem" }}>{finding.evidence}</div>
                  </div>
                  <span className="loc" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem" }}>{finding.location}</span>
                  <span className="cite" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".85rem" }}>{finding.authority}</span>
                </div>
              ))}
            </>
          )}

          {claimIssues.length > 0 && (
            <>
              <div className="group-h" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "14px 0 0" }}>
                <h3 style={{ fontSize: "1.05rem" }}>Claim issues under 35 U.S.C. 112</h3>
                <span className="fd-label">{claimIssues.length} findings · rule and model checks</span>
              </div>
              {claimIssues.map((finding, idx) => {
                const showExpanded = finding.id === "F-02";
                return (
                  <div key={finding.id}>
                    <div
                      className={showExpanded ? "frow open" : "frow"}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "150px minmax(0,1fr) 190px 230px",
                        gap: "20px",
                        padding: "9px 0",
                        borderBottom: showExpanded ? "0" : "1px solid var(--fd-color-line-subtle)",
                        alignItems: "baseline",
                      }}
                    >
                      <span>
                        <SeverityBadge severity={finding.severity} />
                      </span>
                      <div>
                        <div className="t" style={{ fontWeight: "600" }}>{finding.title}</div>
                        <div className="d" style={{ color: "var(--fd-fg-2)", fontSize: ".9rem" }}>{finding.evidence}</div>
                      </div>
                      <span className="loc" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem" }}>{finding.location}</span>
                      <span className="cite" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".85rem" }}>{finding.authority}</span>
                    </div>
                    {showExpanded && finding.suggestedFix && (
                      <div className="expand" style={{ margin: "0 0 0 170px", padding: "0 0 12px", borderBottom: "1px solid var(--fd-color-line-subtle)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                          <span className="fd-label" style={{ display: "block", marginBottom: "6px" }}>Suggested fix</span>
                          <p className="fix" style={{ margin: "0", fontFamily: "var(--fd-font-sans)", fontSize: "1rem", lineHeight: "1.6", background: "var(--fd-bg-raised)", border: "1px solid var(--fd-border)", borderRadius: "4px", padding: "12px 16px" }}>
                            3. The node of claim 1, wherein <del style={{ color: "var(--fd-color-red)", textDecorationThickness: "2px" }}>the</del> <ins style={{ color: "var(--fd-color-green)", textDecoration: "underline", textDecorationThickness: "2px", textUnderlineOffset: "3px" }}>a</ins> sensor housing is sealed against water ingress.
                          </p>
                        </div>
                        <div>
                          <span className="fd-label" style={{ display: "block", marginBottom: "6px" }}>Why we flagged it</span>
                          <p className="small" style={{ margin: "0 0 8px", fontSize: ".85rem" }}>
                            Searched claims 1–3 for an earlier &quot;sensor housing&quot;. None found. Spec ¶[0021] calls it &quot;housing 104&quot;.
                          </p>
                          <span className="conf" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="meter" role="img" aria-label="Confidence 5 of 5" style={{ display: "inline-grid", gridTemplateColumns: "repeat(5, 10px)", gap: "3px" }}>
                              <i className="on" style={{ height: "10px", border: "1px solid var(--fd-fg)", background: "var(--fd-fg)" }}></i>
                              <i className="on" style={{ height: "10px", border: "1px solid var(--fd-fg)", background: "var(--fd-fg)" }}></i>
                              <i className="on" style={{ height: "10px", border: "1px solid var(--fd-fg)", background: "var(--fd-fg)" }}></i>
                              <i className="on" style={{ height: "10px", border: "1px solid var(--fd-fg)", background: "var(--fd-fg)" }}></i>
                              <i className="on" style={{ height: "10px", border: "1px solid var(--fd-fg)", background: "var(--fd-fg)" }}></i>
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

        <aside style={{ display: "grid", gap: "28px" }}>
          <section className="panel" aria-labelledby="o-h">
            <div className="panel__head">
              <h2 id="o-h">Where the findings are</h2>
              <span className="fd-label">Parsed from DOCX</span>
            </div>
            <ul className="outline" style={{ listStyle: "none", padding: "0", margin: "0" }}>
              <li style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                <span>Specification · ¶[0001]–[0046]</span>
                <span className="marks" style={{ display: "flex", gap: "14px" }}>
                  <SeverityBadge severity="must-fix" />
                </span>
              </li>
              <li style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                <span>Claims 1–14 · 3 independent</span>
                <span className="marks" style={{ display: "flex", gap: "14px" }}>
                  <SeverityBadge severity="must-fix" /> <SeverityBadge severity="should-fix" />
                </span>
              </li>
              <li style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                <span>Abstract</span>
                <span className="marks" style={{ display: "flex", gap: "14px" }}>
                  <SeverityBadge severity="advisory" />
                </span>
              </li>
              <li style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                <span>Drawings · FIG. 1–5</span>
                <span className="marks" style={{ display: "flex", gap: "14px" }}>
                  <SeverityBadge severity="must-fix" />
                </span>
              </li>
              <li style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                <span>Inventor declaration</span>
                <span className="ok" style={{ color: "var(--fd-color-green)", fontWeight: "500", fontSize: ".9rem" }}>Present</span>
              </li>
            </ul>
          </section>
          <section className="panel next" aria-labelledby="n-h">
            <div className="panel__head">
              <h2 id="n-h">What to do next</h2>
            </div>
            <ol style={{ margin: "0", paddingLeft: "1.2em", display: "grid", gap: "6px", fontSize: ".95rem" }}>
              <li>
                Fix the {summary.mustFix} <strong>Must fix</strong> items and upload a new version.
              </li>
              <li>
                Review the {summary.shouldFix} <strong>Should fix</strong> items with your practitioner.
              </li>
              <li>Re-check is instant and does not change your filing date.</li>
            </ol>
            <div className="btnrow" style={{ marginTop: "18px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <button className="fd-btn fd-btn--primary">Upload revised DOCX</button>
              <button className="fd-btn fd-btn--secondary">Download report (PDF)</button>
            </div>
          </section>
          <p className="small muted" style={{ margin: "0", fontSize: ".85rem", color: "var(--fd-fg-2)" }}>
            Findings are suggestions, not an Office action. An examiner makes every decision. Citations pending practitioner review.
          </p>
        </aside>
      </div>
    </>
  );
}
