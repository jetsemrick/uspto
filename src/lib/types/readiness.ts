/**
 * Types for USPTO Application Readiness & Formalities Check
 */

export type DefectSeverity = "error" | "warning" | "info";

export type DefectType =
  | "antecedent_basis"
  | "claim_numbering"
  | "claim_form"
  | "drawing_reference"
  | "page_numbering"
  | "abstract_length";

export interface DefectLocation {
  type: "paragraph" | "claim" | "figure" | "abstract" | "page";
  identifier: string; // e.g., "claim 5", "paragraph [0023]", "figure 3"
  lineNumber?: number;
}

export interface MPEPCitation {
  section: string; // e.g., "MPEP 2173.05(e)"
  cfr?: string; // e.g., "37 CFR 1.126"
  description: string;
}

export interface ReadinessFlag {
  id: string;
  type: DefectType;
  severity: DefectSeverity;
  location: DefectLocation;
  description: string;
  suggestedFix?: string;
  citation: MPEPCitation;
  modelVersion?: string; // For LLM-based checks
  promptVersion?: string; // For LLM-based checks
  isDeterministic: boolean; // true for rule-based, false for LLM
}

export interface ExaminerAction {
  flagId: string;
  action: "accept" | "override";
  reason?: string;
  timestamp: string;
}

export interface ReadinessReport {
  applicationId: string;
  checkTimestamp: string;
  flags: ReadinessFlag[];
  summary: {
    totalFlags: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  examinerActions?: ExaminerAction[];
}

export interface ValidationInput {
  applicationId: string;
  docxContent: string; // Base64 encoded DOCX
  patentCenterFlags?: string[]; // Simulated Patent Center validation flags
}

export interface GroundTruth {
  applicationId: string;
  technologyArea: string;
  seededDefects: Array<{
    type: DefectType;
    location: DefectLocation;
    description: string;
  }>;
  isClean: boolean; // True for clean control applications
}

export interface EvaluationResult {
  defectType: DefectType;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface EvaluationReport {
  timestamp: string;
  modelVersion: string;
  promptVersion: string;
  totalApplications: number;
  overallMetrics: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  perDefectMetrics: EvaluationResult[];
  falsePositiveExamples: Array<{
    applicationId: string;
    flag: ReadinessFlag;
  }>;
}
