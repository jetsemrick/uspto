import type { Application } from "@/lib/types/studio";
import { demoFindings } from "@/lib/studio/demo-application";

interface EvaluationTabProps {
  application: Application;
}

// Computed real metrics from demo application (matches npm run eval output)
const realMetrics = {
  precision: 0.857,
  recall: 0.857,
  f1: 0.857,
  truePositives: 6,
  falsePositives: 1,
  falseNegatives: 1,
  totalFindings: 7,
  totalGroundTruth: 7,
};

const realByCheck = [
  { checkId: "claim-support", truePositives: 0, falsePositives: 1, falseNegatives: 1, precision: 0.00, recall: 0.00 },
  { checkId: "antecedent-basis", truePositives: 1, falsePositives: 0, falseNegatives: 0, precision: 1.00, recall: 1.00 },
  { checkId: "multiple-dependent", truePositives: 1, falsePositives: 0, falseNegatives: 0, precision: 1.00, recall: 1.00 },
  { checkId: "drawing-reference", truePositives: 1, falsePositives: 0, falseNegatives: 0, precision: 1.00, recall: 1.00 },
  { checkId: "relative-term", truePositives: 1, falsePositives: 0, falseNegatives: 0, precision: 1.00, recall: 1.00 },
  { checkId: "means-plus-function", truePositives: 1, falsePositives: 0, falseNegatives: 0, precision: 1.00, recall: 1.00 },
  { checkId: "abstract-length", truePositives: 1, falsePositives: 0, falseNegatives: 0, precision: 1.00, recall: 1.00 },
];

const realOverrideRate = demoFindings.filter((f) => f.decision?.action === "override").length / demoFindings.length;

const runs = [
  { id: "R-1042", status: "passed" as const, note: "Current. Prompt p-112a.7" },
  { id: "R-1041", status: "blocked" as const, note: "Antecedent recall fell 0.88 → 0.79. Not shipped." },
  { id: "R-1038", status: "passed" as const, note: "Added claim-support check" },
  { id: "R-1031", status: "passed" as const, note: "Baseline on TS-03" },
];

function PrecisionBar({ value }: { value: number }) {
  const isBelowTarget = value < 0.85;
  return (
    <span className="pr" style={{ display: "inline-flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
      <span
        className="track"
        aria-hidden="true"
        style={{ width: "90px", height: "8px", background: "var(--fd-color-line-subtle)", position: "relative" }}
      >
        <span
          className="fill"
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            background: "var(--fd-viz-1)",
            width: `${value * 100}%`,
          }}
        ></span>
        <span
          className="goal"
          style={{
            position: "absolute",
            top: "-3px",
            bottom: "-3px",
            width: "2px",
            background: "var(--fd-fg)",
            left: "85%",
          }}
        ></span>
      </span>
      <span className={isBelowTarget ? "below" : ""} style={isBelowTarget ? { color: "var(--fd-color-red)", fontWeight: "600" } : {}}>
        {value.toFixed(2)}{isBelowTarget ? " ▼" : ""}
      </span>
    </span>
  );
}

export default function EvaluationTab({ application }: EvaluationTabProps) {
  return (
    <>
      <div className="titlebar" style={{ padding: "22px 0 18px" }}>
        <div>
          <span className="fd-label">
            Evaluation · demo application 19/482,317 · run {application.runId} · seeded synthetic answer key
          </span>
          <h1 style={{ marginTop: "8px", fontSize: "2rem", maxWidth: "46ch" }}>
            How often the checks are right, measured against an answer key we did not write the checks from.
          </h1>
        </div>
        <div className="btnrow">
          <button className="fd-btn fd-btn--secondary">Download results (CSV)</button>
        </div>
      </div>
      <section
        aria-label="Headline metrics"
        className="stats"
        style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderTop: "2px solid var(--fd-fg)" }}
      >
        <div className="stat" style={{ padding: "14px 24px 16px 0" }}>
          <span className="fd-label">Precision</span>
          <span
            className="v"
            style={{
              fontFamily: "var(--fd-font-display)",
              fontSize: "3.1rem",
              fontWeight: "600",
              letterSpacing: "-0.035em",
              lineHeight: "1",
              display: "block",
              margin: "10px 0 6px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {realMetrics.precision.toFixed(2)}
          </span>
          <p style={{ margin: "0", fontSize: ".85rem", color: "var(--fd-fg-2)" }}>
            Of {realMetrics.totalFindings} flags raised, {realMetrics.truePositives} matched ground truth
          </p>
        </div>
        <div className="stat" style={{ padding: "14px 24px 16px 24px", borderLeft: "1px solid var(--fd-border)" }}>
          <span className="fd-label">Recall</span>
          <span
            className="v"
            style={{
              fontFamily: "var(--fd-font-display)",
              fontSize: "3.1rem",
              fontWeight: "600",
              letterSpacing: "-0.035em",
              lineHeight: "1",
              display: "block",
              margin: "10px 0 6px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {realMetrics.recall.toFixed(2)}
          </span>
          <p style={{ margin: "0", fontSize: ".85rem", color: "var(--fd-fg-2)" }}>
            Of {realMetrics.totalGroundTruth} planted defects, {realMetrics.truePositives} were caught
          </p>
        </div>
        <div className="stat" style={{ padding: "14px 24px 16px 24px", borderLeft: "1px solid var(--fd-border)" }}>
          <span className="fd-label">False positives</span>
          <span
            className="v"
            style={{
              fontFamily: "var(--fd-font-display)",
              fontSize: "3.1rem",
              fontWeight: "600",
              letterSpacing: "-0.035em",
              lineHeight: "1",
              display: "block",
              margin: "10px 0 6px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {realMetrics.falsePositives}
          </span>
          <p style={{ margin: "0", fontSize: ".85rem", color: "var(--fd-fg-2)" }}>
            Shown on their own line, never netted out
          </p>
        </div>
        <div className="stat" style={{ padding: "14px 24px 16px 24px", borderLeft: "1px solid var(--fd-border)" }}>
          <span className="fd-label">Override rate</span>
          <span
            className="v"
            style={{
              fontFamily: "var(--fd-font-display)",
              fontSize: "3.1rem",
              fontWeight: "600",
              letterSpacing: "-0.035em",
              lineHeight: "1",
              display: "block",
              margin: "10px 0 6px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(realOverrideRate * 100).toFixed(0)}%
          </span>
          <p style={{ margin: "0", fontSize: ".85rem", color: "var(--fd-fg-2)" }}>
            {demoFindings.filter((f) => f.decision?.action === "override").length} of {demoFindings.length} decisions in demo application
          </p>
        </div>
        <div className="stat" style={{ padding: "14px 24px 16px 24px", borderLeft: "1px solid var(--fd-border)" }}>
          <span className="fd-label">Test set</span>
          <span
            className="v"
            style={{
              fontFamily: "var(--fd-font-display)",
              fontSize: "3.1rem",
              fontWeight: "600",
              letterSpacing: "-0.035em",
              lineHeight: "1",
              display: "block",
              margin: "10px 0 6px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            1
          </span>
          <p style={{ margin: "0", fontSize: ".85rem", color: "var(--fd-fg-2)" }}>
            Demo application with seeded answer key
          </p>
        </div>
      </section>
      <div
        className="grid-d"
        style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 520px", gap: "48px", marginTop: "22px", alignItems: "start" }}
      >
        <section className="panel" aria-labelledby="t-h">
          <div className="panel__head">
            <h2 id="t-h">By check</h2>
            <span className="fd-label">Demo application 19/482,317 · Bar marker = 0.85 target</span>
          </div>
          <table className="fd-table" style={{ width: "100%", fontSize: ".9rem" }}>
            <caption className="fd-sr-only">
              Precision and recall for each check on the demo application
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-muted)", fontWeight: "500", padding: "9px var(--fd-space-3) 9px 0", borderBottom: "1px solid var(--fd-fg)", whiteSpace: "nowrap" }}>
                  Check
                </th>
                <th scope="col" className="num" style={{ textAlign: "right", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-muted)", fontWeight: "500", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-fg)", whiteSpace: "nowrap" }}>
                  TP
                </th>
                <th scope="col" className="num" style={{ textAlign: "right", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-muted)", fontWeight: "500", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-fg)", whiteSpace: "nowrap" }}>
                  FP
                </th>
                <th scope="col" className="num" style={{ textAlign: "right", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-muted)", fontWeight: "500", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-fg)", whiteSpace: "nowrap" }}>
                  FN
                </th>
                <th scope="col" className="num" style={{ textAlign: "right", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-muted)", fontWeight: "500", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-fg)", whiteSpace: "nowrap" }}>
                  Precision
                </th>
                <th scope="col" className="num" style={{ textAlign: "right", fontFamily: "var(--fd-font-mono)", fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fd-fg-muted)", fontWeight: "500", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-fg)", whiteSpace: "nowrap" }}>
                  Recall
                </th>
              </tr>
            </thead>
            <tbody>
              {realByCheck.map((check) => (
                <tr key={check.checkId}>
                  <th scope="row" style={{ fontWeight: "500", textAlign: "left", fontFamily: "var(--fd-font-sans)", textTransform: "none", letterSpacing: "0", fontSize: ".92rem", color: "var(--fd-fg)", padding: "9px var(--fd-space-3) 9px 0", borderBottom: "1px solid var(--fd-color-line-subtle)", verticalAlign: "middle" }}>
                    {check.checkId}
                  </th>
                  <td className="num" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-color-line-subtle)", verticalAlign: "middle" }}>
                    {check.truePositives}
                  </td>
                  <td className="num" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-color-line-subtle)", verticalAlign: "middle" }}>
                    {check.falsePositives}
                  </td>
                  <td className="num" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-color-line-subtle)", verticalAlign: "middle" }}>
                    {check.falseNegatives}
                  </td>
                  <td className="num" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-color-line-subtle)", verticalAlign: "middle" }}>
                    <PrecisionBar value={check.precision} />
                  </td>
                  <td className="num" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", padding: "9px var(--fd-space-3)", borderBottom: "1px solid var(--fd-color-line-subtle)", verticalAlign: "middle" }}>
                    <PrecisionBar value={check.recall} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: "16px", fontSize: ".85rem", color: "var(--fd-fg-2)", fontStyle: "italic" }}>
            Numbers above computed by <code style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".85rem" }}>npm run eval</code> from demo application 19/482,317 with seeded synthetic answer key.
          </p>
        </section>
        <aside style={{ display: "grid", gap: "28px" }}>
          <section className="panel" aria-labelledby="g-h">
            <div className="panel__head">
              <h2 id="g-h">Regression gate</h2>
              <span className="fd-label">Illustrative history</span>
            </div>
            <ul className="runs" style={{ listStyle: "none", margin: "0", padding: "0" }}>
              {runs.map((run) => (
                <li
                  key={run.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "84px 92px 1fr",
                    gap: "14px",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--fd-color-line-subtle)",
                    fontSize: ".9rem",
                    alignItems: "baseline",
                  }}
                >
                  <span className="id" style={{ fontFamily: "var(--fd-font-mono)", fontSize: ".8rem" }}>
                    {run.id}
                  </span>
                  <span className={run.status === "passed" ? "pass" : "block"} style={run.status === "passed" ? { color: "var(--fd-color-green)", fontWeight: "600" } : { color: "var(--fd-color-red)", fontWeight: "600" }}>
                    {run.status === "passed" ? "Passed" : "Blocked"}
                  </span>
                  <span>{run.note}</span>
                </li>
              ))}
            </ul>
            <p style={{ marginTop: "12px", fontSize: ".85rem", color: "var(--fd-fg-2)", fontStyle: "italic" }}>
              Regression runs illustrative. Full CI pipeline pending.
            </p>
          </section>
          <section className="panel" aria-labelledby="h-h">
            <div className="panel__head">
              <h2 id="h-h">How we score</h2>
            </div>
            <dl className="method" style={{ margin: "0", fontSize: ".92rem" }}>
              <dt style={{ fontWeight: "600", marginTop: "10px" }}>Answer key first</dt>
              <dd style={{ margin: "2px 0 0", color: "var(--fd-fg-2)" }}>
                Defects seeded in synthetic applications with answer key written before checks run.
              </dd>
              <dt style={{ fontWeight: "600", marginTop: "10px" }}>Match rule</dt>
              <dd style={{ margin: "2px 0 0", color: "var(--fd-fg-2)" }}>
                A flag counts only if the check type and claim or paragraph match the key.
              </dd>
              <dt style={{ fontWeight: "600", marginTop: "10px" }}>Overrides feed back</dt>
              <dd style={{ margin: "2px 0 0", color: "var(--fd-fg-2)" }}>
                Examiner overrides become test cases in expanded test sets.
              </dd>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
