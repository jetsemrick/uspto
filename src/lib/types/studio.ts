/**
 * Types for USPTO Patent Readiness Studio
 */

export type Severity = "must-fix" | "should-fix" | "advisory";

export type CheckMethod = "rules" | "model" | "rules-model";

export interface Finding {
  id: string; // F-01, F-02, etc.
  checkId: string; // antecedent-basis, claim-support, etc.
  checkName: string;
  severity: Severity;
  title: string;
  location: string; // e.g., "Claim 3 · line 2", "¶[0038]"
  authority: string; // MPEP/CFR citation
  authorityDescription: string;
  evidence: string;
  suggestedFix?: string;
  confidence: "high" | "medium" | "low";
  confidenceDetail: string; // e.g., "High · 46 of 46 paragraphs searched"
  method: CheckMethod;
  modelVersion?: string;
  promptVersion?: string;
  decision?: Decision;
}

export interface Decision {
  action: "accept" | "override";
  reason?: string;
  where?: string; // Location for override
  note?: string;
  timestamp: string;
  examiner: string;
}

export interface ClaimElement {
  id: string; // e.g., "14(a)"
  text: string;
  support: string[] | null; // Paragraph numbers or null for gap
  status: "supported" | "gap";
}

export interface ClaimSupportMap {
  claimNumber: number;
  elements: ClaimElement[];
  closestSpec?: { paragraph: string; text: string }; // For gaps
}

export interface Application {
  id: string; // 19/482,317
  title: string;
  applicant: string;
  filed: string;
  checked: string;
  runId: string; // R-1042
  checksVersion: string; // v0.4
  abstract: string;
  specification: Array<{ number: string; text: string }>;
  claims: Array<{ number: number; text: string; elements?: ClaimElement[] }>;
  drawings: string[]; // ["FIG. 1", "FIG. 2", ...]
  inventorDeclaration: boolean | null; // null when the source can't show it, e.g. a DOCX upload
  sourceFile?: string; // set for applicant uploads
}

export interface ModelCheck {
  status: "used" | "failed" | "off";
  model: string;
}

export interface ReadinessReport {
  application: Application;
  findings: Finding[];
  summary: {
    total: number;
    mustFix: number;
    shouldFix: number;
    advisory: number;
  };
  modelCheck?: ModelCheck;
}

export interface EvalCheck {
  name: string;
  method: CheckMethod;
  planted: number;
  precision: number;
  recall: number;
  overrideRate: string;
}

export interface EvalRun {
  id: string;
  status: "passed" | "blocked";
  note: string;
}

export interface EvaluationReport {
  testSet: string; // TS-03
  runId: string;
  precision: number;
  recall: number;
  falsePositives: number;
  overrideRate: string;
  testSetSize: number;
  checks: EvalCheck[];
  runs: EvalRun[];
}

export interface WhatIfResult {
  claimNumber: number;
  originalText: string;
  editedText: string;
  supportMapBefore: ClaimElement[];
  supportMapAfter: ClaimElement[];
  findingsBefore: Finding[];
  findingsAfter: Finding[];
  resolved: Finding[];
  new: Finding[];
  unchanged: Finding[];
}
