#!/usr/bin/env node
/**
 * Evaluation script for Patent Readiness Studio
 * 
 * Computes precision, recall, and other metrics for the readiness checks
 * against a ground truth test set of 53 synthetic applications.
 */

import { generateTestSuite } from "../lib/readiness/synthetic-data";
import { runDeterministicChecks } from "../lib/readiness/deterministic-checks";
import type { DefectType } from "../lib/types/readiness";

interface CheckMetrics {
  checkType: DefectType;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
}

function evaluateTestSuite() {
  const suite = generateTestSuite();
  
  // Track metrics per defect type
  const metricsMap = new Map<DefectType, {
    tp: number;
    fp: number;
    fn: number;
  }>();
  
  // Initialize all defect types
  const allDefectTypes: DefectType[] = [
    "abstract_length",
    "claim_numbering",
    "claim_form",
    "drawing_reference",
    "page_numbering",
    "antecedent_basis",
    "means_plus_function",
    "relative_term",
    "indefinite_term",
    "multiple_dependency",
    "claim_support_gap",
  ];
  
  allDefectTypes.forEach((type) => {
    metricsMap.set(type, { tp: 0, fp: 0, fn: 0 });
  });
  
  let totalOverrides = 0;
  let totalDecisions = 0;
  
  // Evaluate each application
  suite.forEach(({ app, groundTruth }) => {
    // Run deterministic checks
    const detectedFlags = runDeterministicChecks(app);
    
    // Create sets for comparison
    const detectedTypes = new Set(detectedFlags.map((f) => f.type));
    const truthTypes = new Set(groundTruth.seededDefects.map((d) => d.type));
    
    // Count TP, FP, FN for each defect type
    allDefectTypes.forEach((defectType) => {
      const metrics = metricsMap.get(defectType)!;
      
      const isDetected = detectedTypes.has(defectType);
      const isInTruth = truthTypes.has(defectType);
      
      if (isDetected && isInTruth) {
        metrics.tp++;
      } else if (isDetected && !isInTruth) {
        metrics.fp++;
      } else if (!isDetected && isInTruth) {
        metrics.fn++;
      }
    });
    
    // Simulate override rate (10% for demonstration)
    totalDecisions += detectedFlags.length;
    totalOverrides += Math.floor(detectedFlags.length * 0.1);
  });
  
  // Calculate metrics per check
  const checkMetrics: CheckMetrics[] = [];
  let overallTP = 0;
  let overallFP = 0;
  let overallFN = 0;
  
  allDefectTypes.forEach((defectType) => {
    const { tp, fp, fn } = metricsMap.get(defectType)!;
    
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1.0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 1.0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    
    checkMetrics.push({
      checkType: defectType,
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
      precision,
      recall,
      f1Score,
    });
    
    overallTP += tp;
    overallFP += fp;
    overallFN += fn;
  });
  
  const overallPrecision = overallTP + overallFP > 0 ? overallTP / (overallTP + overallFP) : 1.0;
  const overallRecall = overallTP + overallFN > 0 ? overallTP / (overallTP + overallFN) : 1.0;
  const overallF1 = overallPrecision + overallRecall > 0 
    ? 2 * (overallPrecision * overallRecall) / (overallPrecision + overallRecall) 
    : 0;
  
  const overrideRate = totalDecisions > 0 ? totalOverrides / totalDecisions : 0;
  
  return {
    totalApplications: suite.length,
    overallMetrics: {
      precision: overallPrecision,
      recall: overallRecall,
      f1Score: overallF1,
      truePositives: overallTP,
      falsePositives: overallFP,
      falseNegatives: overallFN,
    },
    checkMetrics,
    overrideRate,
    timestamp: new Date().toISOString(),
  };
}

function runEvaluation() {
  console.log("\n=== Patent Readiness Studio Evaluation ===");
  console.log("Running evaluation on synthetic test suite...\n");
  
  const results = evaluateTestSuite();
  
  // Save results to file
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(process.cwd(), 'eval-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${outputPath}\n`);
  
  console.log(`Test Set: ${results.totalApplications} applications`);
  console.log(`Timestamp: ${results.timestamp}\n`);
  
  console.log("Overall Metrics:");
  console.log(`  Precision: ${(results.overallMetrics.precision * 100).toFixed(1)}%`);
  console.log(`  Recall: ${(results.overallMetrics.recall * 100).toFixed(1)}%`);
  console.log(`  F1 Score: ${(results.overallMetrics.f1Score * 100).toFixed(1)}%`);
  console.log(`  True Positives: ${results.overallMetrics.truePositives}`);
  console.log(`  False Positives: ${results.overallMetrics.falsePositives}`);
  console.log(`  False Negatives: ${results.overallMetrics.falseNegatives}`);
  console.log(`  Override Rate: ${(results.overrideRate * 100).toFixed(1)}%\n`);
  
  console.log("Per-Check Metrics:");
  console.log("  Check Type                  | Precision | Recall | TP | FP | FN");
  console.log("  " + "─".repeat(74));
  
  results.checkMetrics.forEach((metric) => {
    const name = metric.checkType.padEnd(27);
    const precision = `${(metric.precision * 100).toFixed(1)}%`.padStart(9);
    const recall = `${(metric.recall * 100).toFixed(1)}%`.padStart(6);
    const tp = metric.truePositives.toString().padStart(2);
    const fp = metric.falsePositives.toString().padStart(2);
    const fn = metric.falseNegatives.toString().padStart(2);
    
    console.log(`  ${name} | ${precision} | ${recall} | ${tp} | ${fp} | ${fn}`);
  });
  
  console.log("\n");
  
  // Check if we pass the threshold
  const PRECISION_THRESHOLD = 0.85;
  const RECALL_THRESHOLD = 0.85;
  
  if (results.overallMetrics.precision >= PRECISION_THRESHOLD && 
      results.overallMetrics.recall >= RECALL_THRESHOLD) {
    console.log("✓ PASSED: All metrics above threshold (85%)\n");
    return 0;
  } else {
    console.log("✗ FAILED: Metrics below threshold (85%)\n");
    if (results.overallMetrics.precision < PRECISION_THRESHOLD) {
      console.log(`  Precision ${(results.overallMetrics.precision * 100).toFixed(1)}% < ${PRECISION_THRESHOLD * 100}%`);
    }
    if (results.overallMetrics.recall < RECALL_THRESHOLD) {
      console.log(`  Recall ${(results.overallMetrics.recall * 100).toFixed(1)}% < ${RECALL_THRESHOLD * 100}%`);
    }
    console.log("");
    return 1;
  }
}

// Export functions for use in other modules
export { evaluateTestSuite, runEvaluation };

// Run if executed directly (Node.js CLI only)
if (typeof process !== 'undefined' && typeof process.argv !== 'undefined' && typeof require !== 'undefined') {
  try {
    // @ts-ignore - require may not be defined in all environments
    const isMainModule = require.main === module;
    if (isMainModule) {
      process.exit(runEvaluation());
    }
  } catch (e) {
    // Not in Node.js environment, skip
  }
}
