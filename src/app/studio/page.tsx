"use client";

import { useState } from "react";
import { demoApplication, demoFindings, claim14SupportMap } from "@/lib/studio/demo-application";
import { summarizeFindings } from "@/lib/studio/from-readiness";
import type { Application, Finding, Decision, ReadinessReport } from "@/lib/types/studio";
import ApplicantTab from "@/components/studio/ApplicantTab";
import ExaminerTab from "@/components/studio/ExaminerTab";
import EvaluationTab from "@/components/studio/EvaluationTab";
import { DropOverlay, UploadButton } from "@/components/studio/DocumentUpload";
import { useDocumentCheck } from "@/components/studio/useDocumentCheck";

type Tab = "applicant" | "examiner" | "evaluation";

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("applicant");
  const [application] = useState<Application>(demoApplication);
  const [findings, setFindings] = useState<Finding[]>(demoFindings);
  const [upload, setUpload] = useState<ReadinessReport | null>(null);
  const check = useDocumentCheck(setUpload);

  const handleDecision = (findingId: string, decision: Decision) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, decision } : f))
    );
  };

  const summary = summarizeFindings(findings);
  const headerApplication = activeTab === "applicant" && upload ? upload.application : application;

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
          <a className="fd-brand" href="#" aria-label="USPTO home">
            <span className="fd-brand__mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
            USPTO
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
              App <b>{headerApplication.id}</b>
            </span>
            <span>
              Run <b>{headerApplication.runId}</b>
            </span>
            <span>
              Checks <b>{headerApplication.checksVersion}</b>
            </span>
          </div>
          {activeTab === "applicant" && (
            <div className="hdr-actions">
              {upload && check.state !== "uploading" && (
                <button
                  type="button"
                  className="fd-btn fd-btn--ghost"
                  onClick={() => {
                    check.dismiss();
                    setUpload(null);
                  }}
                >
                  Back to demo
                </button>
              )}
              <UploadButton check={check} label={upload ? "Upload new version" : "Upload document"} />
            </div>
          )}
        </div>
      </header>
      <DropOverlay check={check} enabled={activeTab === "applicant"} />
      <main id="main" className="app">
        {activeTab === "applicant" && (
          <ApplicantTab
            application={upload?.application ?? application}
            findings={upload?.findings ?? findings}
            summary={upload?.summary ?? summary}
            modelCheck={upload?.modelCheck}
            check={check}
          />
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
