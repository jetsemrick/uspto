import { useState } from "react";
import type { Application, Finding, ClaimSupportMap, Decision } from "@/lib/types/studio";
import WhatIfPanel from "./WhatIfPanel";

interface ExaminerTabProps {
  application: Application;
  findings: Finding[];
  summary: {
    total: number;
    mustFix: number;
    shouldFix: number;
    advisory: number;
  };
  onDecision: (findingId: string, decision: Decision) => void;
  supportMap: ClaimSupportMap;
}

function SeverityBadge({ severity }: { severity: "must-fix" | "should-fix" | "advisory" }) {
  const className =
    severity === "must-fix"
      ? "sev sev--must"
      : severity === "should-fix"
        ? "sev sev--should"
        : "sev sev--adv";
  const label = severity === "must-fix" ? "Must fix" : severity === "should-fix" ? "Should fix" : "Advisory";
  return <span className={className}>{label}</span>
}

function DecisionBadge({ decision }: { decision?: Decision }) {
  if (!decision) {
    return <span className="dec dec--open">Open</span>;
  }
  if (decision.action === "accept") {
    return <span className="dec dec--acc">Accepted</span>;
  }
  return <span className="dec dec--ovr">Overridden</span>;
}

export default function ExaminerTab({
  application,
  findings,
  summary,
  onDecision,
  supportMap,
}: ExaminerTabProps) {
  const [selectedFinding, setSelectedFinding] = useState<Finding>(findings[0]);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [decisionAction, setDecisionAction] = useState<"accept" | "override">("override");
  const [reason, setReason] = useState("Supported elsewhere");
  const [where, setWhere] = useState("¶[0029]");
  const [note, setNote] = useState(
    "¶[0029] describes updating the threshold from prior readings. Close enough to treat as support."
  );

  const acceptedCount = findings.filter((f) => f.decision?.action === "accept").length;
  const overriddenCount = findings.filter((f) => f.decision?.action === "override").length;
  const openCount = findings.filter((f) => !f.decision).length;

  const handleRecordDecision = () => {
    onDecision(selectedFinding.id, {
      action: decisionAction,
      reason: decisionAction === "override" ? reason : undefined,
      where: decisionAction === "override" ? where : undefined,
      note: decisionAction === "override" ? note : undefined,
      timestamp: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      examiner: "M. Ruiz (synthetic)",
    });
  };

  if (showWhatIf) {
    return <WhatIfPanel application={application} onBack={() => setShowWhatIf(false)} />;
  }

  return (
    <>
      <div className="titlebar" style={{ padding: "18px 0 0" }}>
        <div>
          <span className="fd-label">
            Pre-flag review · {application.id} · {application.title.split(/\s+/).slice(0, 6).join(" ")} · Art unit 2863 (synthetic)
          </span>
          <h1 style={{ marginTop: "8px", fontSize: "1.9rem" }}>
            {summary.total} pre-flags. {acceptedCount} accepted, {overriddenCount} overridden, {openCount} open.
          </h1>
        </div>
        <div className="btnrow">
          <button className="fd-btn fd-btn--secondary" onClick={() => setShowWhatIf(true)}>
            Open what-if on claim 14
          </button>
        </div>
      </div>
      <div
        className="grid-b"
        style={{
          display: "grid",
          gridTemplateColumns: "400px minmax(0,1fr) 560px",
          gap: "32px",
          alignItems: "start",
          paddingTop: "16px",
        }}
      >
        <section className="panel" aria-labelledby="q-h">
          <div className="panel__head">
            <h2 id="q-h">Queue</h2>
            <span className="fd-label">Sorted by severity</span>
          </div>
          <ol className="qlist" style={{ listStyle: "none", margin: "0", padding: "0" }}>
            {findings.map((finding) => (
              <li
                key={finding.id}
                aria-current={selectedFinding.id === finding.id ? "true" : undefined}
                style={{
                  display: "grid",
                  gap: "3px",
                  padding: selectedFinding.id === finding.id ? "10px 12px" : "10px 12px 10px 0",
                  borderBottom: "1px solid var(--fd-color-line-subtle)",
                  background: selectedFinding.id === finding.id ? "var(--fd-bg-raised)" : undefined,
                  outline: selectedFinding.id === finding.id ? "2px solid var(--fd-fg)" : undefined,
                  outlineOffset: selectedFinding.id === finding.id ? "-2px" : undefined,
                  cursor: "pointer",
                }}
                onClick={() => setSelectedFinding(finding)}
              >
                <div
                  className="row1"
                  style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}
                >
                  <SeverityBadge severity={finding.severity} />
                  <DecisionBadge decision={finding.decision} />
                </div>
                <span className="t" style={{ fontWeight: "600", fontSize: ".95rem" }}>
                  {finding.title.length > 50 ? finding.title.slice(0, 47) + "..." : finding.title}
                </span>
                <span className="loc" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".78rem", color: "var(--fd-fg-2)" }}>
                  {finding.id} · {finding.location.split("·")[0]}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel" aria-labelledby="m-h">
          <div className="panel__head">
            <h2 id="m-h">Claim-support map · claim 14</h2>
            <span className="fd-label">
              {supportMap.elements.length} elements · {supportMap.elements.filter((e) => e.status === "supported").length} supported · {supportMap.elements.filter((e) => e.status === "gap").length} gap
            </span>
          </div>
          <table className="map" style={{ width: "100%", borderCollapse: "collapse" }}>
            <caption className="fd-sr-only">
              Each element of claim 14 and the specification paragraphs that support it
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)", fontWeight: "500", padding: "0 12px 8px 0", borderBottom: "1px solid var(--fd-fg)" }}>El.</th>
                <th scope="col" style={{ textAlign: "left", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)", fontWeight: "500", padding: "0 12px 8px 0", borderBottom: "1px solid var(--fd-fg)" }}>Claim language</th>
                <th scope="col" style={{ textAlign: "left", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)", fontWeight: "500", padding: "0 12px 8px 0", borderBottom: "1px solid var(--fd-fg)" }}>Spec support</th>
                <th scope="col" style={{ textAlign: "left", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)", fontWeight: "500", padding: "0 12px 8px 0", borderBottom: "1px solid var(--fd-fg)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {supportMap.elements.map((element) => (
                <tr
                  key={element.id}
                  className={element.status === "gap" ? "gap" : undefined}
                  style={{ background: element.status === "gap" ? "var(--fd-color-red-tint)" : undefined }}
                >
                  <td className="eid" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem", color: "var(--fd-fg-2)", whiteSpace: "nowrap", padding: "12px 12px 12px 0", verticalAlign: "top", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                    {element.id}
                  </td>
                  <td className="el" style={{ fontSize: "1.02rem", lineHeight: "1.55", padding: "12px 12px 12px 0", verticalAlign: "top", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                    {element.id === "14(c)" ? (
                      <span className="hl--must hl hl--sel" style={{ background: "var(--fd-color-red-tint)", boxShadow: "inset 0 -2px 0 var(--fd-color-red)", padding: "0 2px", outline: "2px solid var(--fd-fg)", outlineOffset: "2px" }}>
                        {element.text}
                      </span>
                    ) : (
                      element.text
                    )}
                    ;
                  </td>
                  <td className="sup" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".85rem", padding: "12px 12px 12px 0", verticalAlign: "top", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                    {element.support ? (
                      element.support.join(" ")
                    ) : (
                      <>
                        None found
                        <br />
                        <span className="muted" style={{ color: "var(--fd-fg-2)" }}>Closest: ¶[0027]</span>
                      </>
                    )}
                  </td>
                  <td style={{ padding: "12px 12px 12px 0", verticalAlign: "top", borderBottom: "1px solid var(--fd-color-line-subtle)", fontSize: ".95rem" }}>
                    {element.status === "supported" ? (
                      <span className="okword" style={{ color: "var(--fd-color-green)", fontWeight: "600", display: "inline-flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ width: "12px", height: "12px", background: "var(--fd-color-green)" }}></span>
                        Supported
                      </span>
                    ) : (
                      <span className="gapword" style={{ color: "var(--fd-color-red)", fontWeight: "600", display: "inline-flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ width: "12px", height: "12px", border: "2px solid var(--fd-color-red)" }}></span>
                        Gap
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {supportMap.closestSpec && (
            <div className="excerpt" style={{ marginTop: "18px" }}>
              <span className="fd-label">Closest specification text</span>
              <div className="doc" style={{ marginTop: "8px", background: "var(--fd-bg-raised)", border: "1px solid var(--fd-border)", borderRadius: "4px", padding: "20px 24px", fontFamily: "var(--fd-font-sans)", fontSize: "1.05rem", lineHeight: "1.7" }}>
                <div className="para" style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: "12px", padding: "4px 0" }}>
                  <span className="no" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem", color: "var(--fd-fg-2)", paddingTop: "4px" }}>
                    {supportMap.closestSpec.paragraph}
                  </span>
                  <span>
                    The controller compares each reading to a{" "}
                    <span className="hl" style={{ background: "#FFF4D6", boxShadow: "inset 0 -2px 0 var(--fd-color-amber-line)", padding: "0 2px" }}>
                      fixed threshold value stored in memory
                    </span>{" "}
                    and, when the reading crosses the threshold, doubles the sampling rate until two consecutive readings fall below it.
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="sub" style={{ borderTop: "1px solid var(--fd-fg)", paddingTop: "10px", marginTop: "20px" }}>
            <span className="fd-label">Audit trail</span>
            <ul className="audit" style={{ listStyle: "none", margin: "6px 0 0", padding: "0", fontSize: ".85rem" }}>
              <li style={{ display: "grid", gridTemplateColumns: "112px 1fr", gap: "10px", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                <time style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".78rem", color: "var(--fd-fg-2)" }}>
                  Nov 10 09:14
                </time>
                <span>
                  Flagged by check <span className="cite" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".85rem" }}>wd-support v0.4</span>, model run R-1042, prompt p-112a.7
                </span>
              </li>
              <li style={{ display: "grid", gridTemplateColumns: "112px 1fr", gap: "10px", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                <time style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".78rem", color: "var(--fd-fg-2)" }}>
                  Nov 10 09:21
                </time>
                <span>Opened by examiner M. Ruiz (synthetic)</span>
              </li>
              <li style={{ display: "grid", gridTemplateColumns: "112px 1fr", gap: "10px", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)" }}>
                <time style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".78rem", color: "var(--fd-fg-2)" }}>
                  Nov 10 09:23
                </time>
                <span>Override drafted, not yet recorded. Reason and note are required to save.</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="panel" aria-labelledby="d-h">
          <div className="finding" style={{ display: "grid", gap: "10px" }}>
            <div className="finding__top" style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <SeverityBadge severity={selectedFinding.severity} />
              <span className="fd-label">
                {selectedFinding.id} · {selectedFinding.method === "model" ? "Model check" : "Rule check"} · {selectedFinding.authorityDescription}
              </span>
            </div>
            <h3 id="d-h" style={{ fontSize: "1.25rem", lineHeight: "1.25", letterSpacing: "-0.015em" }}>
              {selectedFinding.title}
            </h3>
            <dl className="facts" style={{ display: "grid", gridTemplateColumns: "130px 1fr", borderTop: "1px solid var(--fd-border)" }}>
              <dt style={{ margin: "0", padding: "6px 0 6px 0", paddingTop: "9px", borderBottom: "1px solid var(--fd-color-line-subtle)", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)" }}>
                Location
              </dt>
              <dd style={{ margin: "0", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)", fontSize: ".95rem" }}>
                <span className="cite" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".85rem" }}>
                  {selectedFinding.location}
                </span>
              </dd>
              <dt style={{ margin: "0", padding: "6px 0 6px 0", paddingTop: "9px", borderBottom: "1px solid var(--fd-color-line-subtle)", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)" }}>
                112 basis
              </dt>
              <dd style={{ margin: "0", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)", fontSize: ".95rem" }}>
                {selectedFinding.authorityDescription}
              </dd>
              <dt style={{ margin: "0", padding: "6px 0 6px 0", paddingTop: "9px", borderBottom: "1px solid var(--fd-color-line-subtle)", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)" }}>
                Authority
              </dt>
              <dd style={{ margin: "0", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)", fontSize: ".95rem" }}>
                <span className="cite" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".85rem" }}>
                  {selectedFinding.authority}
                </span>
              </dd>
              <dt style={{ margin: "0", padding: "6px 0 6px 0", paddingTop: "9px", borderBottom: "1px solid var(--fd-color-line-subtle)", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)" }}>
                Evidence
              </dt>
              <dd style={{ margin: "0", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)", fontSize: ".95rem" }}>
                {selectedFinding.evidence}
              </dd>
              <dt style={{ margin: "0", padding: "6px 0 6px 0", paddingTop: "9px", borderBottom: "1px solid var(--fd-color-line-subtle)", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)" }}>
                Confidence
              </dt>
              <dd style={{ margin: "0", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)", fontSize: ".95rem" }}>
                <span className="conf" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    className="meter"
                    role="img"
                    aria-label={`Confidence ${selectedFinding.confidence === "high" ? "4" : selectedFinding.confidence === "medium" ? "3" : "2"} of 5`}
                    style={{ display: "inline-grid", gridTemplateColumns: "repeat(5, 10px)", gap: "3px" }}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <i
                        key={i}
                        className={
                          (selectedFinding.confidence === "high" && i <= 4) ||
                          (selectedFinding.confidence === "medium" && i <= 3) ||
                          (selectedFinding.confidence === "low" && i <= 2)
                            ? "on"
                            : ""
                        }
                        style={{
                          height: "10px",
                          border: "1px solid var(--fd-fg)",
                          background:
                            (selectedFinding.confidence === "high" && i <= 4) ||
                            (selectedFinding.confidence === "medium" && i <= 3) ||
                            (selectedFinding.confidence === "low" && i <= 2)
                              ? "var(--fd-fg)"
                              : "transparent",
                        }}
                      ></i>
                    ))}
                  </span>
                  <span>{selectedFinding.confidenceDetail}</span>
                </span>
              </dd>
              {selectedFinding.suggestedFix && (
                <>
                  <dt style={{ margin: "0", padding: "6px 0 6px 0", paddingTop: "9px", borderBottom: "1px solid var(--fd-color-line-subtle)", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-2)" }}>
                    Suggested fix
                  </dt>
                  <dd style={{ margin: "0", padding: "6px 0", borderBottom: "1px solid var(--fd-color-line-subtle)", fontSize: ".95rem" }}>
                    {selectedFinding.suggestedFix}
                  </dd>
                </>
              )}
            </dl>
            <form
              className="decision"
              aria-labelledby="dec-h"
              onSubmit={(e) => {
                e.preventDefault();
                handleRecordDecision();
              }}
              style={{ border: "1px solid var(--fd-fg)", borderRadius: "4px", padding: "14px 16px", display: "grid", gap: "10px", background: "var(--fd-bg-raised)" }}
            >
              <span className="fd-label" id="dec-h">
                Your decision · required
              </span>
              <div className="seg" role="radiogroup" aria-label="Decision" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minHeight: "48px",
                    padding: "0 14px",
                    border: decisionAction === "accept" ? "2px solid var(--fd-fg)" : "1px solid var(--fd-color-control)",
                    fontWeight: "600",
                    borderRadius: "4px 0 0 4px",
                  }}
                >
                  <input
                    type="radio"
                    name="d"
                    checked={decisionAction === "accept"}
                    onChange={() => setDecisionAction("accept")}
                    style={{ width: "20px", height: "20px", accentColor: "#0A0A0A" }}
                  />
                  Accept flag
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minHeight: "48px",
                    padding: "0 14px",
                    border: decisionAction === "override" ? "2px solid var(--fd-fg)" : "1px solid var(--fd-color-control)",
                    borderLeft: "0",
                    fontWeight: "600",
                    borderRadius: "0 4px 4px 0",
                  }}
                >
                  <input
                    type="radio"
                    name="d"
                    checked={decisionAction === "override"}
                    onChange={() => setDecisionAction("override")}
                    style={{ width: "20px", height: "20px", accentColor: "#0A0A0A" }}
                  />
                  Override
                </label>
              </div>
              {decisionAction === "override" && (
                <>
                  <div className="two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="fd-field" style={{ display: "grid", gap: "var(--fd-space-2)" }}>
                      <label htmlFor="r" style={{ fontWeight: "600", fontSize: ".9rem" }}>
                        Reason
                      </label>
                      <select
                        id="r"
                        className="fd-select"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "3rem",
                          padding: "0 0.875rem",
                          background: "var(--fd-bg-raised)",
                          color: "var(--fd-fg)",
                          border: "1px solid var(--fd-border-control)",
                          borderRadius: "var(--fd-radius-md)",
                          font: "400 var(--fd-text-base) var(--fd-font-sans)",
                          appearance: "none",
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%230A0A0A' stroke-width='1.6'/%3E%3C/svg%3E\")",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.875rem center",
                          paddingRight: "2.5rem",
                        }}
                      >
                        <option>Supported elsewhere</option>
                        <option>Not an issue</option>
                        <option>Wrong citation</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="fd-field" style={{ display: "grid", gap: "var(--fd-space-2)" }}>
                      <label htmlFor="w" style={{ fontWeight: "600", fontSize: ".9rem" }}>
                        Where
                      </label>
                      <input
                        id="w"
                        className="fd-input"
                        value={where}
                        onChange={(e) => setWhere(e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "3rem",
                          padding: "0 0.875rem",
                          background: "var(--fd-bg-raised)",
                          color: "var(--fd-fg)",
                          border: "1px solid var(--fd-border-control)",
                          borderRadius: "var(--fd-radius-md)",
                          font: "400 var(--fd-text-base) var(--fd-font-sans)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="fd-field" style={{ display: "grid", gap: "var(--fd-space-2)" }}>
                    <label htmlFor="n" style={{ fontWeight: "600", fontSize: ".9rem" }}>
                      Note for the record
                    </label>
                    <textarea
                      id="n"
                      className="fd-input"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      style={{
                        minHeight: "3.2rem",
                        padding: "10px 14px",
                        resize: "vertical",
                        font: "inherit",
                        lineHeight: "1.5",
                        width: "100%",
                        background: "var(--fd-bg-raised)",
                        color: "var(--fd-fg)",
                        border: "1px solid var(--fd-border-control)",
                        borderRadius: "var(--fd-radius-md)",
                      }}
                    />
                  </div>
                </>
              )}
              <div className="btnrow" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <button type="submit" className="fd-btn fd-btn--primary">
                  Record {decisionAction}
                </button>
                <button type="button" className="fd-btn fd-btn--ghost">
                  Trace this finding
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
