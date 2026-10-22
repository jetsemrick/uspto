"use client";

import { useState, useEffect } from "react";
import type { ReadinessReport } from "@/lib/types/readiness";

interface Application {
  applicationId: string;
  technologyArea: string;
  isClean: boolean;
  defectCount: number;
  defectTypes: string[];
}

export default function ReadinessDemo() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [patentCenterFlags, setPatentCenterFlags] = useState<string>("");

  // Load applications on mount
  useEffect(() => {
    fetch("/api/readiness-applications")
      .then((res) => res.json())
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(`Failed to load applications: ${err.message}`));
  }, []);

  const checkApplication = async (applicationId: string) => {
    setLoading(true);
    setError(null);
    setSelectedApp(applicationId);
    setReport(null);
    setUploadMode(false);

    try {
      const res = await fetch("/api/readiness-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Check failed");
      }

      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkUploadedFile = async () => {
    if (!uploadFile) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setSelectedApp(null);

    try {
      // Convert file to base64
      const buffer = await uploadFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );

      // Parse Patent Center flags
      const flags = patentCenterFlags
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const res = await fetch("/api/readiness-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docxContent: base64,
          patentCenterFlags: flags.length > 0 ? flags : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Check failed");
      }

      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            USPTO Application Readiness & Formalities Check
          </h1>
          <p className="text-gray-600">
            Modular REST/JSON API component for patent application readiness
            verification
          </p>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Application List */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {uploadMode ? "Upload Application" : `Test Applications (${applications.length})`}
                </h2>
                <button
                  onClick={() => {
                    setUploadMode(!uploadMode);
                    setSelectedApp(null);
                    setReport(null);
                    setError(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {uploadMode ? "← Back to list" : "Upload DOCX"}
                </button>
              </div>

              {uploadMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patent Application (DOCX)
                    </label>
                    <input
                      type="file"
                      accept=".docx"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patent Center Flags (optional, one per line)
                    </label>
                    <textarea
                      value={patentCenterFlags}
                      onChange={(e) => setPatentCenterFlags(e.target.value)}
                      placeholder="FORMAT:Claim 1 missing period&#10;REFERENCE:Drawing ref 99 not in spec"
                      rows={4}
                      className="block w-full text-sm border border-gray-300 rounded p-2"
                    />
                  </div>

                  <button
                    onClick={checkUploadedFile}
                    disabled={!uploadFile || loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Checking..." : "Check Application"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">{applications.map((app) => (
                  <button
                    key={app.applicationId}
                    onClick={() => checkApplication(app.applicationId)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedApp === app.applicationId
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-mono text-sm font-medium">
                      {app.applicationId}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {app.technologyArea}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {app.isClean ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Clean
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          {app.defectCount} defect
                          {app.defectCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </button>
                ))}</div>
              )}
            </div>
          </div>

          {/* Report Display */}
          <div className="col-span-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Readiness Report</h2>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">
                    Running formalities check...
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {report && !loading && (
                <div>
                  {/* Summary */}
                  <div className="mb-6 p-4 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-600">
                          Application ID
                        </div>
                        <div className="font-mono text-lg">
                          {report.applicationId}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {report.summary.errorCount}
                          </div>
                          <div className="text-xs text-gray-600">Errors</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {report.summary.warningCount}
                          </div>
                          <div className="text-xs text-gray-600">Warnings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {report.summary.infoCount}
                          </div>
                          <div className="text-xs text-gray-600">Info</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="space-y-4">
                    {report.flags.length === 0 ? (
                      <div className="text-center py-8 text-green-600">
                        <div className="text-4xl mb-2">✓</div>
                        <div className="font-medium">
                          No formalities issues detected
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          This application is ready for examination
                        </div>
                      </div>
                    ) : (
                      report.flags.map((flag) => (
                        <div
                          key={flag.id}
                          className={`border-l-4 p-4 rounded ${
                            flag.severity === "error"
                              ? "border-red-500 bg-red-50"
                              : flag.severity === "warning"
                                ? "border-yellow-500 bg-yellow-50"
                                : "border-blue-500 bg-blue-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                                    flag.severity === "error"
                                      ? "bg-red-200 text-red-900"
                                      : flag.severity === "warning"
                                        ? "bg-yellow-200 text-yellow-900"
                                        : "bg-blue-200 text-blue-900"
                                  }`}
                                >
                                  {flag.severity}
                                </span>
                                <span className="text-xs text-gray-600 font-mono">
                                  {flag.type.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {flag.location.identifier}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-2">
                                {flag.description}
                              </p>
                              {flag.suggestedFix && (
                                <p className="text-sm text-gray-700 mb-2">
                                  <span className="font-medium">
                                    Suggested fix:
                                  </span>{" "}
                                  {flag.suggestedFix}
                                </p>
                              )}
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Citation:</span>{" "}
                                {flag.citation.section}
                                {flag.citation.cfr &&
                                  ` (${flag.citation.cfr})`}{" "}
                                — {flag.citation.description}
                              </div>
                              {!flag.isDeterministic && (
                                <div className="text-xs text-gray-500 mt-1">
                                  LLM-based check (Model: {flag.modelVersion},{" "}
                                  Prompt: {flag.promptVersion})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Download Report (JSON)
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      View as Examiner
                    </button>
                  </div>
                </div>
              )}

              {!report && !loading && !error && (
                <div className="text-center py-12 text-gray-500">
                  Select an application from the list to view its readiness
                  report
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
