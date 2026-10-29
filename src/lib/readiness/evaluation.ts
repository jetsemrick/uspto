/**
 * Evaluation harness for readiness checks
 */

import type {
  ReadinessFlag,
  EvaluationResult,
  EvaluationReport,
  DefectType,
  GroundTruth,
} from "@/lib/types/readiness";
import type { ParsedApplication } from "./deterministic-checks";
import { runDeterministicChecks } from "./deterministic-checks";
import { checkAntecedentBasisSafe, PROMPT_VERSION } from "./llm-checks";
import { getGrokModelId } from "@/lib/ai/model";
import { generateTestSuite } from "./synthetic-data";

/**
 * Match detected flags against ground truth defects
 * Updated to handle multiple flags per seeded defect
 */
function matchFlagsToGroundTruth(
  flags: ReadinessFlag[],
  groundTruth: GroundTruth,
): {
  truePositives: ReadinessFlag[];
  falsePositives: ReadinessFlag[];
  falseNegatives: GroundTruth["seededDefects"];
} {
  const truePositives: ReadinessFlag[] = [];
  const falsePositives: ReadinessFlag[] = [];
  const matchedDefectIndices = new Set<number>();

  // Match each flag to a ground truth defect
  flags.forEach((flag) => {
    // Find an unmatched defect of this type
    const matchIndex = groundTruth.seededDefects.findIndex(
      (defect, idx) => defect.type === flag.type && !matchedDefectIndices.has(idx),
    );

    if (matchIndex >= 0) {
      // True positive: flag matches a seeded defect
      truePositives.push(flag);
      matchedDefectIndices.add(matchIndex);
      // Note: We don't remove the defect because one seeded defect
      // can produce multiple flags (e.g., claim missing capital AND period)
    } else {
      // False positive: flag doesn't match any unmatched seeded defect
      falsePositives.push(flag);
    }
  });

  // Unmatched defects are false negatives
  const falseNegatives = groundTruth.seededDefects.filter(
    (_, idx) => !matchedDefectIndices.has(idx),
  );

  return { truePositives, falsePositives, falseNegatives };
}

/**
 * Calculate metrics for a single defect type
 */
function calculateMetrics(
  truePositives: number,
  falsePositives: number,
  falseNegatives: number,
): { precision: number; recall: number; f1Score: number } {
  const precision =
    truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;

  const recall =
    truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;

  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { precision, recall, f1Score };
}

/**
 * Run evaluation on all test applications
 */
export async function runEvaluation(): Promise<EvaluationReport> {
  const testSuite = generateTestSuite();
  const allDefectTypes: DefectType[] = [
    "abstract_length",
    "claim_numbering",
    "claim_form",
    "drawing_reference",
    "page_numbering",
    "antecedent_basis",
  ];

  // Initialize counters per defect type
  const counters: Record<
    DefectType,
    { tp: number; fp: number; fn: number }
  > = {} as any;
  allDefectTypes.forEach((type) => {
    counters[type] = { tp: 0, fp: 0, fn: 0 };
  });

  const allFalsePositives: Array<{
    applicationId: string;
    flag: ReadinessFlag;
  }> = [];

  // Process each application
  let completedCount = 0;
  for (const { app, groundTruth } of testSuite) {
    completedCount++;
    console.log(
      `Processing ${app.applicationId} (${completedCount}/${testSuite.length})`,
    );

    // Run checks
    const deterministicFlags = runDeterministicChecks(app);
    const llmFlags = await checkAntecedentBasisSafe(app);
    const allFlags = [...deterministicFlags, ...llmFlags];

    // Match against ground truth
    const { truePositives, falsePositives, falseNegatives } =
      matchFlagsToGroundTruth(allFlags, groundTruth);

    // Update counters
    truePositives.forEach((flag) => {
      counters[flag.type].tp++;
    });

    falsePositives.forEach((flag) => {
      counters[flag.type].fp++;
      allFalsePositives.push({
        applicationId: app.applicationId,
        flag,
      });
    });

    falseNegatives.forEach((defect) => {
      counters[defect.type].fn++;
    });
  }

  // Calculate per-defect metrics
  const perDefectMetrics: EvaluationResult[] = allDefectTypes.map((type) => {
    const { tp, fp, fn } = counters[type];
    const metrics = calculateMetrics(tp, fp, fn);

    return {
      defectType: type,
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
      ...metrics,
    };
  });

  // Calculate overall metrics
  const totalTp = Object.values(counters).reduce((sum, c) => sum + c.tp, 0);
  const totalFp = Object.values(counters).reduce((sum, c) => sum + c.fp, 0);
  const totalFn = Object.values(counters).reduce((sum, c) => sum + c.fn, 0);
  const overallMetrics = calculateMetrics(totalTp, totalFp, totalFn);

  return {
    timestamp: new Date().toISOString(),
    modelVersion: getGrokModelId(),
    promptVersion: PROMPT_VERSION,
    totalApplications: testSuite.length,
    overallMetrics,
    perDefectMetrics,
    falsePositiveExamples: allFalsePositives.slice(0, 20), // Limit to first 20
  };
}

/**
 * Format evaluation report as a table
 */
export function formatEvaluationReport(report: EvaluationReport): string {
  const lines: string[] = [];

  lines.push("=".repeat(80));
  lines.push("USPTO APPLICATION READINESS CHECK - EVALUATION REPORT");
  lines.push("=".repeat(80));
  lines.push("");
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push(`Model Version: ${report.modelVersion}`);
  lines.push(`Prompt Version: ${report.promptVersion}`);
  lines.push(`Total Applications: ${report.totalApplications}`);
  lines.push("");

  lines.push("-".repeat(80));
  lines.push("OVERALL METRICS");
  lines.push("-".repeat(80));
  lines.push(
    `Precision: ${(report.overallMetrics.precision * 100).toFixed(1)}%`,
  );
  lines.push(`Recall:    ${(report.overallMetrics.recall * 100).toFixed(1)}%`);
  lines.push(`F1 Score:  ${(report.overallMetrics.f1Score * 100).toFixed(1)}%`);
  lines.push("");

  lines.push("-".repeat(80));
  lines.push("PER-DEFECT TYPE METRICS");
  lines.push("-".repeat(80));
  lines.push(
    sprintf(
      "%-25s %5s %5s %5s %10s %10s %10s",
      "Defect Type",
      "TP",
      "FP",
      "FN",
      "Precision",
      "Recall",
      "F1 Score",
    ),
  );
  lines.push("-".repeat(80));

  report.perDefectMetrics.forEach((metric) => {
    lines.push(
      sprintf(
        "%-25s %5d %5d %5d %10.1f%% %10.1f%% %10.1f%%",
        metric.defectType,
        metric.truePositives,
        metric.falsePositives,
        metric.falseNegatives,
        metric.precision * 100,
        metric.recall * 100,
        metric.f1Score * 100,
      ),
    );
  });

  lines.push("");

  if (report.falsePositiveExamples.length > 0) {
    lines.push("-".repeat(80));
    lines.push(
      `FALSE POSITIVE EXAMPLES (showing ${report.falsePositiveExamples.length})`,
    );
    lines.push("-".repeat(80));

    report.falsePositiveExamples.forEach((example, index) => {
      lines.push(
        `${index + 1}. ${example.applicationId} - ${example.flag.type}`,
      );
      lines.push(`   ${example.flag.description}`);
      lines.push("");
    });
  }

  lines.push("=".repeat(80));

  return lines.join("\n");
}

/**
 * Simple sprintf-like function for formatting
 */
function sprintf(format: string, ...args: any[]): string {
  let result = format;
  let argIndex = 0;

  result = result.replace(
    /%(-?)(\d*)(?:\.(\d+))?([sdif%])/g,
    (match, leftAlign, width, precision, type) => {
      if (type === "%") return "%";
      
      const arg = args[argIndex++];
      let str = "";
      
      if (type === "s") {
        str = String(arg);
      } else if (type === "d" || type === "i") {
        str = String(Math.floor(Number(arg)));
      } else if (type === "f") {
        const num = Number(arg);
        str = precision ? num.toFixed(Number(precision)) : String(num);
      }

      if (width) {
        const w = Number(width);
        if (leftAlign) {
          str = str.padEnd(w, " ");
        } else {
          str = str.padStart(w, " ");
        }
      }

      return str;
    },
  );
  
  return result;
}

/**
 * Check for regressions compared to a baseline report
 */
export function checkRegression(
  current: EvaluationReport,
  baseline: EvaluationReport,
  threshold = 0.05, // 5% drop is considered regression
): {
  hasRegression: boolean;
  regressions: Array<{
    defectType: DefectType;
    metric: "precision" | "recall" | "f1Score";
    baselineValue: number;
    currentValue: number;
    drop: number;
  }>;
} {
  const regressions: any[] = [];

  current.perDefectMetrics.forEach((currentMetric) => {
    const baselineMetric = baseline.perDefectMetrics.find(
      (m) => m.defectType === currentMetric.defectType,
    );

    if (!baselineMetric) return;

    // Check each metric
    const metrics: Array<"precision" | "recall" | "f1Score"> = [
      "precision",
      "recall",
      "f1Score",
    ];

    metrics.forEach((metricName) => {
      const baselineValue = baselineMetric[metricName];
      const currentValue = currentMetric[metricName];
      const drop = baselineValue - currentValue;

      if (drop > threshold) {
        regressions.push({
          defectType: currentMetric.defectType,
          metric: metricName,
          baselineValue,
          currentValue,
          drop,
        });
      }
    });
  });

  return {
    hasRegression: regressions.length > 0,
    regressions,
  };
}
