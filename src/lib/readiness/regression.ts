/**
 * Baseline storage and regression detection
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { EvaluationReport } from "@/lib/types/readiness";
import { runEvaluation, checkRegression } from "./evaluation";

const STORAGE_DIR = join(process.cwd(), ".readiness-data");
const BASELINE_FILE = join(STORAGE_DIR, "baseline-evaluation.json");

/**
 * Save current evaluation as baseline
 */
export async function saveBaseline(report: EvaluationReport): Promise<void> {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
  await writeFile(BASELINE_FILE, JSON.stringify(report, null, 2));
  console.log(`✓ Baseline saved: ${BASELINE_FILE}`);
}

/**
 * Load baseline evaluation
 */
export async function loadBaseline(): Promise<EvaluationReport | null> {
  try {
    if (!existsSync(BASELINE_FILE)) {
      return null;
    }
    const data = await readFile(BASELINE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading baseline:", error);
    return null;
  }
}

/**
 * Run evaluation and compare against baseline
 */
export async function runRegressionTest(options?: {
  modelVersion?: string;
  promptVersion?: string;
  threshold?: number;
}): Promise<{
  report: EvaluationReport;
  baseline: EvaluationReport | null;
  hasRegression: boolean;
  regressions: any[];
}> {
  // Run current evaluation
  const report = await runEvaluation();

  // Override versions if provided (for testing regression scenarios)
  if (options?.modelVersion) {
    report.modelVersion = options.modelVersion;
  }
  if (options?.promptVersion) {
    report.promptVersion = options.promptVersion;
  }

  // Load baseline
  const baseline = await loadBaseline();

  if (!baseline) {
    console.log("No baseline found. This will become the baseline.");
    return {
      report,
      baseline: null,
      hasRegression: false,
      regressions: [],
    };
  }

  // Check for regressions
  const regressionCheck = checkRegression(
    report,
    baseline,
    options?.threshold || 0.05,
  );

  return {
    report,
    baseline,
    ...regressionCheck,
  };
}

/**
 * Format regression test results
 */
export function formatRegressionResults(results: {
  report: EvaluationReport;
  baseline: EvaluationReport | null;
  hasRegression: boolean;
  regressions: any[];
}): string {
  const lines: string[] = [];

  lines.push("=".repeat(80));
  lines.push("REGRESSION TEST RESULTS");
  lines.push("=".repeat(80));
  lines.push("");

  if (!results.baseline) {
    lines.push("⚠️  No baseline found. Run with --save-baseline to establish one.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("Current Evaluation:");
  lines.push(`  Model: ${results.report.modelVersion}`);
  lines.push(`  Prompt: ${results.report.promptVersion}`);
  lines.push(
    `  Precision: ${(results.report.overallMetrics.precision * 100).toFixed(1)}%`,
  );
  lines.push(
    `  Recall: ${(results.report.overallMetrics.recall * 100).toFixed(1)}%`,
  );
  lines.push("");

  lines.push("Baseline Evaluation:");
  lines.push(`  Model: ${results.baseline.modelVersion}`);
  lines.push(`  Prompt: ${results.baseline.promptVersion}`);
  lines.push(
    `  Precision: ${(results.baseline.overallMetrics.precision * 100).toFixed(1)}%`,
  );
  lines.push(
    `  Recall: ${(results.baseline.overallMetrics.recall * 100).toFixed(1)}%`,
  );
  lines.push("");

  if (results.hasRegression) {
    lines.push("❌ REGRESSION DETECTED");
    lines.push("");
    lines.push("The following metrics have degraded by >5%:");
    lines.push("");

    results.regressions.forEach((reg) => {
      const drop = (reg.drop * 100).toFixed(1);
      const baseline = (reg.baselineValue * 100).toFixed(1);
      const current = (reg.currentValue * 100).toFixed(1);
      lines.push(
        `  • ${reg.defectType} ${reg.metric}: ${current}% (was ${baseline}%, -${drop}%)`,
      );
    });

    lines.push("");
    lines.push("Please review model/prompt changes before deploying.");
  } else {
    lines.push("✅ NO REGRESSION DETECTED");
    lines.push("");
    lines.push("All metrics are within acceptable range of baseline.");
  }

  lines.push("");
  lines.push("=".repeat(80));

  return lines.join("\n");
}
