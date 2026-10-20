"use client";

import { documentManifest, type MatterDocuments } from "@/lib/ai/context";
import { formatUseObjectError } from "@/lib/ai/format-object-error";
import { sanitizeChartCells } from "@/lib/quote-verify";
import { claimChartSchema, type ChartCell } from "@/lib/schemas/chart";
import {
  obviousnessEvaluationSchema,
  reviseSectionSchema,
  type ClaimAssessment,
  type EvaluationSection,
  type ExaminerDetermination,
} from "@/lib/schemas/evaluation";
import { limitationSplitSchema, type LimitationSplit } from "@/lib/schemas/limitations";
import { sampleMatter } from "@/lib/sample/matter";
import type { ReviewedCell, WorkspacePhase } from "@/lib/types/workspace";
import {
  applyGapGuardrail,
  claimsWithGaps,
  formatEvaluationText,
  partitionChart,
  reviewSnapshot,
} from "@/lib/workspace/evaluation";
import {
  coalesceLimitationSplit,
  defaultBaseReferenceId,
} from "@/lib/workspace/limitations";
import { useObject } from "@ai-sdk/react";
import { useCallback, useMemo, useState } from "react";
import { ChartPane } from "./ChartPane";
import { ElapsedTimer } from "./ElapsedTimer";
import { EvaluationPane } from "./EvaluationPane";
import { IntakePanel } from "./IntakePanel";
import { LimitationEditor } from "./LimitationEditor";
import { SourcePane } from "./SourcePane";

const emptyMatter: MatterDocuments = {
  applicationNumber: "",
  title: "",
  claims: "",
  specification: "",
  references: [
    { id: "ref-a", label: "Reference A", title: "", body: "" },
    { id: "ref-b", label: "Reference B", title: "", body: "" },
  ],
};

function toReviewedCells(cells: ChartCell[], docs: MatterDocuments): ReviewedCell[] {
  const refBodies = Object.fromEntries(docs.references.map((r) => [r.id, r.body]));
  return sanitizeChartCells(cells, refBodies).map((c) => ({
    ...c,
    review: c.status === "missing" ? "disagreed" : "pending",
  }));
}

export function ExaminerWorkspace() {
  const [docs, setDocs] = useState<MatterDocuments>(emptyMatter);
  const [intakeCollapsed, setIntakeCollapsed] = useState(false);
  const [phase, setPhase] = useState<WorkspacePhase>("intake");
  const [limitationSplit, setLimitationSplit] = useState<LimitationSplit | null>(null);
  const [chartCells, setChartCells] = useState<ReviewedCell[]>([]);
  const [baseReferenceId, setBaseReferenceId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<ClaimAssessment[]>([]);
  const [sections, setSections] = useState<EvaluationSection[]>([]);
  const [determinations, setDeterminations] = useState<Record<number, ExaminerDetermination>>({});
  const [evaluatedGapClaims, setEvaluatedGapClaims] = useState<number[]>([]);
  const [evaluatedSnapshot, setEvaluatedSnapshot] = useState<string | null>(null);
  const [sentManifest, setSentManifest] = useState<string[]>([]);
  const [sourceTab, setSourceTab] = useState<string>("claims");
  const [highlightQuote, setHighlightQuote] = useState<string>("");
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const limitationsHook = useObject({
    api: "/api/limitations",
    schema: limitationSplitSchema,
    onFinish: ({ object, error }) => {
      if (error) {
        setActionError(formatUseObjectError(error));
        return;
      }
      if (object) {
        setLimitationSplit(object);
        setPhase("limitations");
      }
    },
    onError: (e) => setActionError(formatUseObjectError(e)),
  });

  const chartHook = useObject({
    api: "/api/chart",
    schema: claimChartSchema,
    onFinish: ({ object, error }) => {
      if (error) {
        setActionError(formatUseObjectError(error));
        return;
      }
      if (object?.cells) {
        setChartCells(toReviewedCells(object.cells, docs));
        setBaseReferenceId((prev) => defaultBaseReferenceId(docs, prev));
        setPhase("chart");
      }
    },
    onError: (e) => setActionError(formatUseObjectError(e)),
  });

  const evaluationHook = useObject({
    api: "/api/evaluate",
    schema: obviousnessEvaluationSchema,
    onFinish: ({ object, error }) => {
      if (error) {
        setActionError(formatUseObjectError(error));
        return;
      }
      if (object) {
        setAssessments(object.claimAssessments);
        setSections(object.sections);
        setPhase("evaluation");
      }
    },
    onError: (e) => setActionError(formatUseObjectError(e)),
  });

  const reviseHook = useObject({
    api: "/api/revise-section",
    schema: reviseSectionSchema,
    onFinish: ({ object, error }) => {
      setRevisingId(null);
      if (error) {
        setActionError(formatUseObjectError(error));
        return;
      }
      if (object?.section) {
        setSections((prev) =>
          prev.map((s) => (s.id === object.section.id ? object.section : s)),
        );
      }
    },
    onError: (e) => {
      setRevisingId(null);
      setActionError(formatUseObjectError(e));
    },
  });

  const streamingLimitations = useMemo(
    () =>
      coalesceLimitationSplit(
        limitationsHook.object as Parameters<typeof coalesceLimitationSplit>[0],
        limitationSplit,
      ),
    [limitationsHook.object, limitationSplit],
  );

  const displaySplit = limitationsHook.isLoading ? streamingLimitations : limitationSplit;

  const busyLabel = limitationsHook.isLoading
    ? "Proposing limitations"
    : chartHook.isLoading
      ? "Mapping prior art"
      : evaluationHook.isLoading
        ? "Evaluating obviousness"
        : reviseHook.isLoading
          ? "Revising section"
          : null;
  const isBusy = busyLabel !== null;

  const clearEvaluation = () => {
    setAssessments([]);
    setSections([]);
    setEvaluatedSnapshot(null);
  };

  const runLimitations = () => {
    setIntakeCollapsed(true);
    setActionError(null);
    setSentManifest(documentManifest(docs));
    limitationsHook.clear();
    setLimitationSplit(null);
    setChartCells([]);
    clearEvaluation();
    limitationsHook.submit({ docs });
  };

  const runChart = () => {
    if (!limitationSplit) return;
    setActionError(null);
    setSentManifest(documentManifest(docs));
    chartHook.clear();
    setChartCells([]);
    clearEvaluation();
    chartHook.submit({ docs, limitationSplit });
  };

  const runEvaluation = () => {
    if (!limitationSplit || !baseReferenceId) return;
    setActionError(null);
    setSentManifest(documentManifest(docs));
    const { gaps } = partitionChart(docs, limitationSplit, chartCells);
    setEvaluatedGapClaims(claimsWithGaps(gaps));
    setEvaluatedSnapshot(reviewSnapshot(chartCells));
    evaluationHook.clear();
    evaluationHook.submit({ docs, limitationSplit, baseReferenceId, cells: chartCells });
  };

  const chartCellsDisplay = useMemo(() => {
    if (chartHook.isLoading && chartHook.object?.cells?.length) {
      const partialCells = chartHook.object.cells.filter(
        (c): c is ChartCell => Boolean(c?.limitationId && c?.referenceId && c?.status),
      );
      return toReviewedCells(partialCells, docs);
    }
    return chartCells;
  }, [chartHook.isLoading, chartHook.object, chartCells, docs]);

  const assessmentsDisplay = useMemo(() => {
    const source: ClaimAssessment[] =
      evaluationHook.isLoading && evaluationHook.object?.claimAssessments
        ? evaluationHook.object.claimAssessments.filter(
            (a): a is ClaimAssessment =>
              Boolean(a?.claimNumber && a?.finding && a?.confidence && a?.summary),
          )
        : assessments;
    return applyGapGuardrail(source, evaluatedGapClaims);
  }, [evaluationHook.isLoading, evaluationHook.object, assessments, evaluatedGapClaims]);

  const sectionsDisplay = useMemo(() => {
    if (evaluationHook.isLoading && evaluationHook.object?.sections?.length) {
      return evaluationHook.object.sections.filter(Boolean).map((s) => ({
        id: s?.id ?? "",
        heading: s?.heading ?? "",
        body: s?.body ?? "",
      }));
    }
    return sections;
  }, [evaluationHook.isLoading, evaluationHook.object, sections]);

  const showingEvaluation = assessmentsDisplay.length > 0 || sectionsDisplay.length > 0;

  const evaluationStale =
    evaluatedSnapshot !== null &&
    !evaluationHook.isLoading &&
    evaluatedSnapshot !== reviewSnapshot(chartCells);

  const loadSample = () => {
    setDocs(structuredClone(sampleMatter));
    setLimitationSplit(null);
    setChartCells([]);
    clearEvaluation();
    setDeterminations({});
    setPhase("intake");
    setBaseReferenceId(sampleMatter.references[0]?.id ?? null);
  };

  const onReviewChange = useCallback(
    (limitationId: string, referenceId: string, review: ReviewedCell["review"]) => {
      setChartCells((prev) =>
        prev.map((c) =>
          c.limitationId === limitationId && c.referenceId === referenceId
            ? { ...c, review }
            : c,
        ),
      );
    },
    [],
  );

  const onSelectQuote = (referenceId: string, quote: string) => {
    setSourceTab(referenceId);
    setHighlightQuote(quote);
  };

  const exportText = () =>
    formatEvaluationText({
      docs,
      assessments: assessmentsDisplay,
      determinations,
      sections,
    });

  const copyEvaluation = async () => {
    await navigator.clipboard.writeText(exportText());
  };

  const downloadEvaluation = () => {
    const blob = new Blob([exportText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docs.applicationNumber || "application"}-103-evaluation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reviseSection = (
    sectionId: string,
    heading: string,
    body: string,
    instruction: string,
  ) => {
    setRevisingId(sectionId);
    setActionError(null);
    reviseHook.submit({ docs, sectionId, heading, currentBody: body, instruction });
  };

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <IntakePanel
        docs={docs}
        collapsed={intakeCollapsed}
        onToggleCollapsed={() => setIntakeCollapsed((c) => !c)}
        onChange={setDocs}
        onLoadSample={loadSample}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <button
          type="button"
          disabled={isBusy || !docs.claims.trim()}
          onClick={runLimitations}
          className="rounded bg-blue-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {limitationsHook.isLoading ? "Proposing limitations…" : "1. Propose limitation split"}
        </button>
        <button
          type="button"
          disabled={isBusy || !limitationSplit}
          onClick={runChart}
          className="rounded bg-blue-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {chartHook.isLoading ? "Mapping prior art…" : "2. Map prior art"}
        </button>
        <button
          type="button"
          disabled={isBusy || chartCells.length === 0}
          onClick={runEvaluation}
          className="rounded bg-blue-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {evaluationHook.isLoading ? "Evaluating…" : "3. Evaluate obviousness"}
        </button>
        <span className="text-xs text-slate-500">Phase: {phase}</span>
        {busyLabel && <ElapsedTimer key={busyLabel} label={busyLabel} />}
        {!busyLabel && sentManifest.length > 0 && (
          <span className="text-[11px] text-slate-500">
            Sent to model: {sentManifest.join(" · ")}
          </span>
        )}
      </div>

      {actionError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {actionError}
        </div>
      )}

      <div
        className={`grid min-h-0 flex-1 grid-cols-1 ${
          showingEvaluation
            ? "lg:grid-cols-[minmax(220px,0.8fr)_minmax(280px,1fr)_minmax(420px,1.6fr)]"
            : "lg:grid-cols-[minmax(220px,1fr)_minmax(280px,1.2fr)_minmax(260px,1fr)]"
        }`}
      >
        <SourcePane
          docs={docs}
          activeTab={sourceTab}
          onTabChange={setSourceTab}
          highlightQuote={highlightQuote}
        />

        <div className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
          {displaySplit && (phase !== "intake" || limitationsHook.isLoading) ? (
            <>
              <div className="border-b border-slate-200 px-3 py-2 text-xs text-slate-600">
                Confirm or edit limitations, then map prior art.
              </div>
              <LimitationEditor
                split={displaySplit}
                disabled={limitationsHook.isLoading}
                onChange={(s) => {
                  setLimitationSplit(s);
                  if (phase === "intake") setPhase("limitations");
                }}
              />
              {chartCellsDisplay.length > 0 && limitationSplit && (
                <div className="min-h-0 flex-1 border-t border-slate-200">
                  <ChartPane
                    docs={docs}
                    split={limitationSplit}
                    cells={chartCellsDisplay}
                    baseReferenceId={baseReferenceId}
                    onBaseChange={setBaseReferenceId}
                    onReviewChange={onReviewChange}
                    onSelectQuote={onSelectQuote}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
              Load documents and run step 1 to see limitations and the claim chart.
            </div>
          )}
        </div>

        <EvaluationPane
          assessments={assessmentsDisplay}
          sections={sectionsDisplay}
          determinations={determinations}
          stale={evaluationStale}
          streaming={evaluationHook.isLoading}
          onDeterminationChange={(claimNumber, value) =>
            setDeterminations((prev) => ({ ...prev, [claimNumber]: value }))
          }
          onSectionChange={(id, body) =>
            setSections((prev) => prev.map((s) => (s.id === id ? { ...s, body } : s)))
          }
          onRevise={reviseSection}
          revisingId={revisingId}
          onCopy={copyEvaluation}
          onDownload={downloadEvaluation}
        />
      </div>
    </div>
  );
}
