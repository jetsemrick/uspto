"use client";

import { useState } from "react";
import { demoApplication, demoFindings, claim14SupportMap } from "@/lib/studio/demo-application";
import type { Application, Finding, Decision, WhatIfResult } from "@/lib/types/studio";
import ApplicantTab from "@/components/studio/ApplicantTab";
import ExaminerTab from "@/components/studio/ExaminerTab";
import EvaluationTab from "@/components/studio/EvaluationTab";

type Tab = "applicant" | "examiner" | "evaluation";

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("applicant");
  const [application] = useState<Application>(demoApplication);
  const [findings, setFindings] = useState<Finding[]>(demoFindings);

  const handleDecision = (findingId: string, decision: Decision) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, decision } : f))
    );
  };

  const summary = {
    total: findings.length,
    mustFix: findings.filter((f) => f.severity === "must-fix").length,
    shouldFix: findings.filter((f) => f.severity === "should-fix").length,
    advisory: findings.filter((f) => f.severity === "advisory").length,
  };

  return (
    <>
      <a className="fd-skip" href="#main">
        Skip to main content
      </a>
      <div className="fd-proto-banner" role="region" aria-label="Prototype disclaimer">
        <div className="app">
          <span className="fd-proto-banner__tag">Vendor prototype</span>
          <span>
            <strong>Not an official U.S. government website.</strong> Built by SpaceXAI for
            evaluation. All names, applications and records are synthetic.
          </span>
        </div>
      </div>
      <header className="fd-header">
        <div className="app">
          <a className="fd-brand" href="#" aria-label="Readiness home">
            <span className="fd-brand__mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
            Readiness
          </a>
          <nav className="fd-nav" aria-label="Primary">
            <a
              href="#applicant"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("applicant");
              }}
              aria-current={activeTab === "applicant" ? "page" : undefined}
            >
              Applicant
            </a>
            <a
              href="#examiner"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("examiner");
              }}
              aria-current={activeTab === "examiner" ? "page" : undefined}
            >
              Examiner
            </a>
            <a
              href="#evaluation"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("evaluation");
              }}
              aria-current={activeTab === "evaluation" ? "page" : undefined}
            >
              Evaluation
            </a>
          </nav>
          <div className="ctx">
            <span>
              App <b>{application.id}</b>
            </span>
            <span>
              Run <b>{application.runId}</b>
            </span>
            <span>
              Checks <b>{application.checksVersion}</b>
            </span>
            <span className="role">
              {activeTab === "applicant" ? "Applicant view" : activeTab === "examiner" ? "Examiner view" : "Evaluation"}
            </span>
          </div>
        </div>
      </header>
      <main id="main" className="app">
        {activeTab === "applicant" && (
          <ApplicantTab application={application} findings={findings} summary={summary} />
        )}
        {activeTab === "examiner" && (
          <ExaminerTab
            application={application}
            findings={findings}
            summary={summary}
            onDecision={handleDecision}
            supportMap={claim14SupportMap}
          />
        )}
        {activeTab === "evaluation" && <EvaluationTab application={application} />}
      </main>
      <footer className="wf-footer">
        <span>SpaceXAI vendor prototype · not an official government product · synthetic data</span>
        <span className="fd-mono">
          Screen {activeTab === "applicant" ? "A" : activeTab === "examiner" ? "B" : "D"} ·{" "}
          {activeTab} view
        </span>
      </footer>
    </>
  );
}
