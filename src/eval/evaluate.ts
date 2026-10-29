#!/usr/bin/env node
/**
 * Evaluation script for Patent Readiness Studio
 * 
 * Computes precision, recall, and other metrics for the readiness checks
 * against a ground truth test set.
 */

import { demoFindings } from "../lib/studio/demo-application";

interface GroundTruthDefect {
  id: string;
  checkId: string;
  location: string;
  severity: "must-fix" | "should-fix" | "advisory";
}

// Ground truth: What a patent practitioner identified as actual defects
const groundTruth: GroundTruthDefect[] = [
  { id: "GT-01", checkId: "claim-support", location: "Claim 14(c)", severity: "must-fix" },
  { id: "GT-02", checkId: "antecedent-basis", location: "Claim 3", severity: "must-fix" },
  { id: "GT-03", checkId: "multiple-dependent", location: "Claim 12", severity: "must-fix" },
  { id: "GT-04", checkId: "drawing-reference", location: "¶[0038]", severity: "must-fix" },
  { id: "GT-05", checkId: "relative-term", location: "Claim 1", severity: "should-fix" },
  { id: "GT-06", checkId: "means-plus-function", location: "Claim 8", severity: "should-fix" },
  { id: "GT-07", checkId: "abstract-length", location: "Abstract", severity: "advisory" },
];

function matchFinding(finding: any, truth: GroundTruthDefect): boolean {
  // Match if checkId matches and location overlaps
  if (finding.checkId !== truth.checkId) return false;
  
  // Location matching is fuzzy - just check if they reference the same general area
  const findingLocation = finding.location.toLowerCase();
  const truthLocation = truth.location.toLowerCase();
  
  return findingLocation.includes(truthLocation) || truthLocation.includes(findingLocation);
}

function evaluateFindings() {
  const findings = demoFindings;
  
  // True Positives: findings that match ground truth
  const truePositives = findings.filter((f) =>
    groundTruth.some((gt) => matchFinding(f, gt))
  );
  
  // False Positives: findings that don't match ground truth
  const falsePositives = findings.filter((f) =>
    !groundTruth.some((gt) => matchFinding(f, gt))
  );
  
  // False Negatives: ground truth defects not found
  const falseNegatives = groundTruth.filter((gt) =>
    !findings.some((f) => matchFinding(f, gt))
  );
  
  const precision = truePositives.length / (truePositives.length + falsePositives.length);
  const recall = truePositives.length / (truePositives.length + falseNegatives.length);
  const f1 = 2 * (precision * recall) / (precision + recall);
  
  return {
    truePositives: truePositives.length,
    falsePositives: falsePositives.length,
    falseNegatives: falseNegatives.length,
    precision,
    recall,
    f1,
    totalFindings: findings.length,
    totalGroundTruth: groundTruth.length,
  };
}

function evaluateByCheckType() {
  const checkTypes = Array.from(new Set(groundTruth.map((gt) => gt.checkId)));
  
  return checkTypes.map((checkId) => {
    const gtForCheck = groundTruth.filter((gt) => gt.checkId === checkId);
    const findingsForCheck = demoFindings.filter((f) => f.checkId === checkId);
    
    const tp = findingsForCheck.filter((f) => gtForCheck.some((gt) => matchFinding(f, gt))).length;
    const fp = findingsForCheck.filter((f) => !gtForCheck.some((gt) => matchFinding(f, gt))).length;
    const fn = gtForCheck.filter((gt) => !findingsForCheck.some((f) => matchFinding(f, gt))).length;
    
    const precision = tp > 0 ? tp / (tp + fp) : 0;
    const recall = tp > 0 ? tp / (tp + fn) : 0;
    
    return {
      checkId,
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
      precision,
      recall,
    };
  });
}

function computeOverrideRate() {
  const totalDecisions = demoFindings.length;
  const overrides = demoFindings.filter((f) => f.decision?.action === "override").length;
  return overrides / totalDecisions;
}

function runEvaluation() {
  console.log("\n=== Patent Readiness Studio Evaluation ===\n");
  
  const overall = evaluateFindings();
  
  console.log("Overall Metrics:");
  console.log(`  Precision: ${(overall.precision * 100).toFixed(1)}%`);
  console.log(`  Recall: ${(overall.recall * 100).toFixed(1)}%`);
  console.log(`  F1 Score: ${(overall.f1 * 100).toFixed(1)}%`);
  console.log(`  True Positives: ${overall.truePositives}`);
  console.log(`  False Positives: ${overall.falsePositives}`);
  console.log(`  False Negatives: ${overall.falseNegatives}`);
  console.log(`  Total Findings: ${overall.totalFindings}`);
  console.log(`  Total Ground Truth: ${overall.totalGroundTruth}`);
  
  const overrideRate = computeOverrideRate();
  console.log(`  Override Rate: ${(overrideRate * 100).toFixed(1)}%`);
  
  console.log("\nBy Check Type:");
  const byCheck = evaluateByCheckType();
  byCheck.forEach((check) => {
    console.log(`\n  ${check.checkId}:`);
    console.log(`    Precision: ${(check.precision * 100).toFixed(1)}%`);
    console.log(`    Recall: ${(check.recall * 100).toFixed(1)}%`);
    console.log(`    TP: ${check.truePositives}, FP: ${check.falsePositives}, FN: ${check.falseNegatives}`);
  });
  
  console.log("\n");
  
  // Check if we pass the threshold
  const PRECISION_THRESHOLD = 0.85;
  const RECALL_THRESHOLD = 0.85;
  
  if (overall.precision >= PRECISION_THRESHOLD && overall.recall >= RECALL_THRESHOLD) {
    console.log("✓ PASSED: All metrics above threshold\n");
    return 0;
  } else {
    console.log("✗ FAILED: Metrics below threshold\n");
    if (overall.precision < PRECISION_THRESHOLD) {
      console.log(`  Precision ${(overall.precision * 100).toFixed(1)}% < ${PRECISION_THRESHOLD * 100}%`);
    }
    if (overall.recall < RECALL_THRESHOLD) {
      console.log(`  Recall ${(overall.recall * 100).toFixed(1)}% < ${RECALL_THRESHOLD * 100}%`);
    }
    console.log("");
    return 1;
  }
}

// Export functions for use in other modules
export { evaluateFindings, evaluateByCheckType, computeOverrideRate, runEvaluation };

// Run if executed directly (Node.js CLI only)
// This code will not execute in browser environments
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
