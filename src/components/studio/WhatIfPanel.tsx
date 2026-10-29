import { useState, useEffect } from "react";
import type { Application } from "@/lib/types/studio";

interface WhatIfPanelProps {
  application: Application;
  onBack: () => void;
}

export default function WhatIfPanel({ application, onBack }: WhatIfPanelProps) {
  const [editedText, setEditedText] = useState(
    "(c) adjusting the first rate based on a machine-learned threshold"
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  const originalText = "(c) adjusting the first rate based on a machine-learned threshold";
  const suggestedText = "(c) adjusting the first rate based on a threshold value stored in memory and updated from prior readings";

  useEffect(() => {
    if (editedText !== originalText) {
      setHasChanges(true);
      setRechecking(true);
      const timer = setTimeout(() => setRechecking(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [editedText]);

  const applySuggestion = () => {
    setEditedText(suggestedText);
  };

  const isResolved = editedText.includes("stored in memory");

  return (
    <>
      <div className="titlebar">
        <div>
          <span className="fd-label">What-if · claim 14 · {application.id}</span>
          <h1 style={{ marginTop: "8px", fontSize: "2rem" }}>
            Edit a claim and see the findings change before anyone files an amendment.
          </h1>
        </div>
        <div className="btnrow">
          <button className="fd-btn fd-btn--ghost" onClick={onBack}>
            Back to queue
          </button>
        </div>
      </div>
      <div
        className="grid-c"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 720px", gap: "48px", alignItems: "start" }}
      >
        <section className="panel" aria-labelledby="e-h">
          <div className="panel__head">
            <h2 id="e-h">Claim 14 · draft</h2>
            <span className="fd-label">Edited {hasChanges ? "2 s ago" : "not yet"}</span>
          </div>
          <div
            className="sandbox"
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              borderBottom: "1px solid var(--fd-border)",
              marginBottom: "16px",
            }}
          >
            <span className="small">
              <strong>Sandbox.</strong> Edits are not saved to the application or sent to the applicant.
            </span>
            <div className="btnrow" style={{ display: "flex", gap: "12px" }}>
              <button type="button" className="fd-btn fd-btn--secondary" onClick={() => setEditedText(originalText)}>
                Reset to filed text
              </button>
              <button type="button" className="fd-btn fd-btn--primary" onClick={applySuggestion}>
                Copy as suggested amendment
              </button>
            </div>
          </div>
          <div
            className="doc claimdoc"
            style={{
              fontSize: "1.15rem",
              lineHeight: "1.8",
              padding: "24px 28px",
              background: "var(--fd-bg-raised)",
              border: "1px solid var(--fd-border)",
              borderRadius: "4px",
            }}
          >
            <p style={{ margin: "0 0 8px" }}>
              <span className="cno" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".85rem", color: "var(--fd-fg-2)", marginRight: "8px" }}>
                14.
              </span>
              A method of sensing soil moisture, comprising:
            </p>
            <p style={{ margin: "0 0 8px" }}>(a) providing a soil moisture probe having a capacitive sensing element;</p>
            <p style={{ margin: "0 0 8px" }}>(b) sampling the probe with a microcontroller at a first rate;</p>
            <p
              className="editing"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setEditedText(e.currentTarget.textContent || "")}
              style={{
                margin: "0 0 8px",
                border: "2px solid var(--fd-color-blue)",
                borderRadius: "4px",
                padding: "2px 4px",
                outline: "none",
              }}
            >
              {editedText}
            </p>
            <p style={{ margin: "0 0 8px" }}>(d) transmitting, by a radio, a summary packet at a second rate.</p>
          </div>
          <div className="sub" style={{ borderTop: "1px solid var(--fd-fg)", paddingTop: "10px", marginTop: "20px" }}>
            <div
              className="panel__head"
              style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px" }}
            >
              <h3 style={{ fontSize: "1.05rem" }}>Support map after edit</h3>
              <span className="fd-label">Was → now</span>
            </div>
            <div
              className="mapline"
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr 150px 150px",
                gap: "12px",
                padding: "9px 0",
                borderBottom: "1px solid var(--fd-color-line-subtle)",
                fontSize: ".92rem",
                alignItems: "baseline",
              }}
            >
              <span className="eid" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem", color: "var(--fd-fg-2)" }}>
                14(a)
              </span>
              <span>capacitive probe</span>
              <span className="okword" style={{ color: "var(--fd-color-green)", fontWeight: "600" }}>
                Supported
              </span>
              <span className="okword" style={{ color: "var(--fd-color-green)", fontWeight: "600" }}>
                Supported
              </span>
            </div>
            <div
              className="mapline"
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr 150px 150px",
                gap: "12px",
                padding: "9px 0",
                borderBottom: "1px solid var(--fd-color-line-subtle)",
                fontSize: ".92rem",
                alignItems: "baseline",
              }}
            >
              <span className="eid" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem", color: "var(--fd-fg-2)" }}>
                14(b)
              </span>
              <span>sampling at a first rate</span>
              <span className="okword" style={{ color: "var(--fd-color-green)", fontWeight: "600" }}>
                Supported
              </span>
              <span className="okword" style={{ color: "var(--fd-color-green)", fontWeight: "600" }}>
                Supported
              </span>
            </div>
            <div
              className="mapline"
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr 150px 150px",
                gap: "12px",
                padding: "9px 0",
                borderBottom: "1px solid var(--fd-color-line-subtle)",
                fontSize: ".92rem",
                alignItems: "baseline",
              }}
            >
              <span className="eid" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem", color: "var(--fd-fg-2)" }}>
                14(c)
              </span>
              <span>threshold stored in memory, updated from prior readings</span>
              <span className="gapword" style={{ color: "var(--fd-color-red)", fontWeight: "600" }}>
                Gap
              </span>
              <span className="okword" style={{ color: "var(--fd-color-green)", fontWeight: "600" }}>
                {isResolved ? "¶[0027] ¶[0029]" : "Gap"}
              </span>
            </div>
            <div
              className="mapline"
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr 150px 150px",
                gap: "12px",
                padding: "9px 0",
                borderBottom: "1px solid var(--fd-color-line-subtle)",
                fontSize: ".92rem",
                alignItems: "baseline",
              }}
            >
              <span className="eid" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem", color: "var(--fd-fg-2)" }}>
                14(d)
              </span>
              <span>summary packet at a second rate</span>
              <span className="okword" style={{ color: "var(--fd-color-green)", fontWeight: "600" }}>
                Supported
              </span>
              <span className="okword" style={{ color: "var(--fd-color-green)", fontWeight: "600" }}>
                Supported
              </span>
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="r-h" aria-live="polite">
          <div className="panel__head">
            <h2 id="r-h">Findings on claim 14</h2>
            <span className="fd-label">Re-checked in {rechecking ? "..." : "3.1 s"} · 4 checks</span>
          </div>
          <div
            className="delta"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid var(--fd-border)", marginBottom: "8px" }}
          >
            <div style={{ padding: "6px 20px 14px 0" }}>
              <span className="tag tag--res" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".75rem", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: "500", color: "var(--fd-color-green)" }}>
                Resolved
              </span>
              <span
                className="n"
                style={{
                  fontFamily: "var(--fd-font-display)",
                  fontSize: "2.6rem",
                  fontWeight: "600",
                  letterSpacing: "-0.03em",
                  lineHeight: "1",
                  display: "block",
                  marginTop: "8px",
                }}
              >
                {isResolved ? "1" : "0"}
              </span>
            </div>
            <div style={{ padding: "6px 20px 14px 20px", borderLeft: "1px solid var(--fd-border)" }}>
              <span className="tag tag--new" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".75rem", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: "500", color: "var(--fd-fg)" }}>
                New
              </span>
              <span
                className="n"
                style={{
                  fontFamily: "var(--fd-font-display)",
                  fontSize: "2.6rem",
                  fontWeight: "600",
                  letterSpacing: "-0.03em",
                  lineHeight: "1",
                  display: "block",
                  marginTop: "8px",
                }}
              >
                {isResolved ? "1" : "0"}
              </span>
            </div>
            <div style={{ padding: "6px 20px 14px 20px", borderLeft: "1px solid var(--fd-border)" }}>
              <span className="tag tag--same" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".75rem", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: "500", color: "var(--fd-fg-2)" }}>
                Unchanged
              </span>
              <span
                className="n"
                style={{
                  fontFamily: "var(--fd-font-display)",
                  fontSize: "2.6rem",
                  fontWeight: "600",
                  letterSpacing: "-0.03em",
                  lineHeight: "1",
                  display: "block",
                  marginTop: "8px",
                }}
              >
                0
              </span>
            </div>
          </div>
          {isResolved && (
            <>
              <div
                className="change"
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 1fr",
                  gap: "16px",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--fd-color-line-subtle)",
                  alignItems: "baseline",
                }}
              >
                <span className="tag tag--res" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".75rem", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: "500", color: "var(--fd-color-green)" }}>
                  Resolved
                </span>
                <div>
                  <span className="sev sev--must">Must fix</span>
                  <div className="t struck" style={{ fontWeight: "600", marginTop: "6px", textDecoration: "line-through" }}>
                    14(c) &quot;machine-learned threshold&quot; has no support
                  </div>
                  <div className="d" style={{ fontSize: ".9rem", color: "var(--fd-fg-2)", marginTop: "2px" }}>
                    Now supported by ¶[0027] (stored threshold) and ¶[0029] (updated from prior readings). MPEP 2163.
                  </div>
                </div>
              </div>
              <div
                className="change"
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 1fr",
                  gap: "16px",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--fd-color-line-subtle)",
                  alignItems: "baseline",
                }}
              >
                <span className="tag tag--new" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".75rem", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: "500", color: "var(--fd-fg)" }}>
                  New
                </span>
                <div>
                  <span className="sev sev--should">Should fix</span>
                  <div className="t" style={{ fontWeight: "600", marginTop: "6px" }}>
                    &quot;prior readings&quot; is open-ended: how many, over what window?
                  </div>
                  <div className="d" style={{ fontSize: ".9rem", color: "var(--fd-fg-2)", marginTop: "2px" }}>
                    Possible relative term. ¶[0029] says &quot;the previous 24 readings&quot;. MPEP 2173.05(b).
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <span className="conf" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        className="meter"
                        role="img"
                        aria-label="Confidence 2 of 5"
                        style={{ display: "inline-grid", gridTemplateColumns: "repeat(5, 10px)", gap: "3px" }}
                      >
                        <i style={{ height: "10px", border: "1px solid var(--fd-fg)", background: "var(--fd-fg)" }}></i>
                        <i style={{ height: "10px", border: "1px solid var(--fd-fg)", background: "var(--fd-fg)" }}></i>
                        <i style={{ height: "10px", border: "1px solid var(--fd-fg)" }}></i>
                        <i style={{ height: "10px", border: "1px solid var(--fd-fg)" }}></i>
                        <i style={{ height: "10px", border: "1px solid var(--fd-fg)" }}></i>
                      </span>
                      <span>Low confidence · model check · examiner judgment needed</span>
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
          <div
            className="change"
            style={{
              display: "grid",
              gridTemplateColumns: "130px 1fr",
              gap: "16px",
              padding: "14px 0",
              borderBottom: "1px solid var(--fd-color-line-subtle)",
              alignItems: "baseline",
            }}
          >
            <span className="tag tag--same" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".75rem", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: "500", color: "var(--fd-fg-2)" }}>
              Checked
            </span>
            <div>
              <div className="t" style={{ fontWeight: "600" }}>Antecedent basis, 112(f), dependency form</div>
              <div className="d" style={{ fontSize: ".9rem", color: "var(--fd-fg-2)", marginTop: "2px" }}>
                No issues in the edited text.
              </div>
            </div>
          </div>
          <div className="fd-alert fd-alert--info" role="note" style={{ marginTop: "20px", borderTop: "2px solid var(--fd-color-navy)", paddingTop: "var(--fd-space-3)", fontSize: "var(--fd-text-sm)", lineHeight: "var(--fd-leading-sm)", color: "var(--fd-fg)" }}>
            <p
              className="fd-alert__tone"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--fd-space-2)",
                fontFamily: "var(--fd-font-mono)",
                fontSize: "var(--fd-text-xs)",
                fontWeight: "500",
                letterSpacing: "var(--fd-tracking-label)",
                textTransform: "uppercase",
                margin: "0 0 var(--fd-space-2)",
                color: "var(--fd-color-navy)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <rect x="5" y="5" width="2" height="6" fill="currentColor" />
                <rect x="5" y="1" width="2" height="2" fill="currentColor" />
              </svg>
              Note
            </p>
            <div className="fd-alert__body">
              <p className="fd-alert__title" style={{ fontWeight: "600", fontSize: "var(--fd-text-base)", color: "var(--fd-fg)", margin: "0 0 2px" }}>
                Low-confidence findings are shown, not hidden
              </p>
              <p style={{ margin: "0", color: "var(--fd-fg-2)" }}>
                The examiner decides. Confidence comes from the check type and how much of the spec was searched.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
