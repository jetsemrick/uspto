/**
 * Tests for Patent Readiness Studio
 */

import { demoApplication, demoFindings, claim14SupportMap } from "../lib/studio/demo-application";
import { buildOutline } from "../lib/studio/outline";
import { toStudioReport } from "../lib/studio/from-readiness";
import { runDeterministicChecks, type ParsedApplication } from "../lib/readiness/deterministic-checks";
import { parseApplicationBlocks } from "../lib/readiness/block-parser";

// Simple test runner for Node
// @ts-ignore
global.describe = (name: string, fn: () => void) => {
  console.log(`\n${name}`);
  fn();
};
// @ts-ignore
global.test = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.error(`    ${error}`);
    process.exit(1);
  }
};
// @ts-ignore
global.expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) throw new Error(`Expected ${actual} to be ${expected}`);
  },
  toContain: (expected: any) => {
    if (!actual.includes && !Array.isArray(actual)) throw new Error(`${actual} is not an array or string`);
    if ((Array.isArray(actual) && !actual.includes(expected)) ||
        (typeof actual === 'string' && !actual.includes(expected))) {
      throw new Error(`Expected ${actual} to contain ${expected}`);
    }
  },
  toHaveLength: (expected: number) => {
    if (actual.length !== expected) throw new Error(`Expected length ${expected}, got ${actual.length}`);
  },
  toHaveProperty: (prop: string) => {
    if (!(prop in actual)) throw new Error(`Expected to have property ${prop}`);
  },
  toBeDefined: () => {
    if (actual === undefined) throw new Error(`Expected value to be defined`);
  },
  toBeGreaterThan: (expected: number) => {
    if (actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`);
  },
  toMatch: (regex: RegExp) => {
    if (!regex.test(actual)) throw new Error(`Expected ${actual} to match ${regex}`);
  },
});

describe("Demo Application", () => {
  test("has correct application metadata", () => {
    expect(demoApplication.id).toBe("19/482,317");
    expect(demoApplication.title).toContain("soil moisture");
    expect(demoApplication.applicant).toBe("Halvorsen Field Systems LLC");
    expect(demoApplication.claims).toHaveLength(14);
    expect(demoApplication.specification.length).toBeGreaterThan(0);
  });

  test("has 7 findings", () => {
    expect(demoFindings).toHaveLength(7);
  });

  test("findings have required structure", () => {
    demoFindings.forEach((finding) => {
      expect(finding).toHaveProperty("id");
      expect(finding).toHaveProperty("checkId");
      expect(finding).toHaveProperty("severity");
      expect(finding).toHaveProperty("title");
      expect(finding).toHaveProperty("location");
      expect(finding).toHaveProperty("authority");
      expect(finding).toHaveProperty("evidence");
      expect(finding).toHaveProperty("confidence");
      expect(finding).toHaveProperty("method");
      
      // Severity must be one of the allowed values
      expect(["must-fix", "should-fix", "advisory"]).toContain(finding.severity);
      
      // Method must be one of the allowed values
      expect(["rules", "model", "rules-model"]).toContain(finding.method);
      
      // Confidence must be one of the allowed values
      expect(["high", "medium", "low"]).toContain(finding.confidence);
    });
  });

  test("findings have correct severity distribution", () => {
    const mustFix = demoFindings.filter((f) => f.severity === "must-fix");
    const shouldFix = demoFindings.filter((f) => f.severity === "should-fix");
    const advisory = demoFindings.filter((f) => f.severity === "advisory");
    
    expect(mustFix).toHaveLength(4);
    expect(shouldFix).toHaveLength(2);
    expect(advisory).toHaveLength(1);
  });

  test("claim 14 has support map with gap", () => {
    expect(claim14SupportMap.claimNumber).toBe(14);
    expect(claim14SupportMap.elements).toHaveLength(4);
    
    const gaps = claim14SupportMap.elements.filter((e) => e.status === "gap");
    expect(gaps).toHaveLength(1);
    expect(gaps[0].id).toBe("14(c)");
  });

  test("MPEP citations are formatted correctly", () => {
    demoFindings.forEach((finding) => {
      expect(finding.authority).toMatch(/MPEP|CFR|U\.S\.C\./);
    });
  });

  test("some findings have decisions", () => {
    const withDecisions = demoFindings.filter((f) => f.decision);
    expect(withDecisions.length).toBeGreaterThan(0);
    
    withDecisions.forEach((finding) => {
      expect(finding.decision).toHaveProperty("action");
      expect(["accept", "override"]).toContain(finding.decision!.action);
      expect(finding.decision).toHaveProperty("timestamp");
      expect(finding.decision).toHaveProperty("examiner");
    });
  });
});

describe("Findings Checks", () => {
  test("F-01 is claim support issue for claim 14(c)", () => {
    const f01 = demoFindings.find((f) => f.id === "F-01");
    expect(f01).toBeDefined();
    expect(f01!.checkId).toBe("claim-support");
    expect(f01!.title).toContain("machine-learned threshold");
    expect(f01!.severity).toBe("must-fix");
    expect(f01!.location).toContain("Claim 14");
  });

  test("F-02 is antecedent basis issue in claim 3", () => {
    const f02 = demoFindings.find((f) => f.id === "F-02");
    expect(f02).toBeDefined();
    expect(f02!.checkId).toBe("antecedent-basis");
    expect(f02!.title).toContain("sensor housing");
    expect(f02!.severity).toBe("must-fix");
    expect(f02!.decision?.action).toBe("accept");
  });

  test("F-03 is improper multiple dependency in claim 12", () => {
    const f03 = demoFindings.find((f) => f.id === "F-03");
    expect(f03).toBeDefined();
    expect(f03!.checkId).toBe("multiple-dependent");
    expect(f03!.severity).toBe("must-fix");
    expect(f03!.decision?.action).toBe("accept");
  });

  test("F-04 is missing FIG. 6 reference", () => {
    const f04 = demoFindings.find((f) => f.id === "F-04");
    expect(f04).toBeDefined();
    expect(f04!.checkId).toBe("drawing-reference");
    expect(f04!.title).toContain("FIG. 6");
    expect(f04!.severity).toBe("must-fix");
  });

  test("F-05 is relative term issue that was overridden", () => {
    const f05 = demoFindings.find((f) => f.id === "F-05");
    expect(f05).toBeDefined();
    expect(f05!.checkId).toBe("relative-term");
    expect(f05!.title).toContain("substantially continuous");
    expect(f05!.severity).toBe("should-fix");
    expect(f05!.decision?.action).toBe("override");
    expect(f05!.decision?.where).toBe("¶[0022]");
  });

  test("F-06 is means-plus-function issue in claim 8", () => {
    const f06 = demoFindings.find((f) => f.id === "F-06");
    expect(f06).toBeDefined();
    expect(f06!.checkId).toBe("means-plus-function");
    expect(f06!.title).toContain("means for transmitting");
    expect(f06!.severity).toBe("should-fix");
  });

  test("F-07 is abstract length advisory", () => {
    const f07 = demoFindings.find((f) => f.id === "F-07");
    expect(f07).toBeDefined();
    expect(f07!.checkId).toBe("abstract-length");
    expect(f07!.title).toContain("163 words");
    expect(f07!.severity).toBe("advisory");
  });
});

describe("Findings outline", () => {
  test("counts demo findings by part of the application", () => {
    const rows = buildOutline(demoApplication, demoFindings);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId.specification.detail).toBe("¶[0001]–[0046]");
    expect(byId.claims.detail).toBe("1–14 · 3 independent");
    expect(byId.claims.counts["must-fix"]).toBe(3);
    expect(byId.claims.counts["should-fix"]).toBe(2);
    expect(byId.drawings.detail).toBe("FIG. 1–5");
    expect(byId.drawings.counts["must-fix"]).toBe(1);
    expect(byId.abstract.counts.advisory).toBe(1);
    expect(byId.declaration.status).toBe("present");
  });
});

describe("Uploaded document report", () => {
  const parsed: ParsedApplication = {
    applicationId: "upload",
    title: "Hydration monitor",
    abstract: "A short abstract.",
    claims: [
      { number: 1, text: "A monitor comprising a probe.", lineNumber: 1 },
      { number: 3, text: "The monitor of claim 1, wherein the probe is large.", lineNumber: 2 },
    ],
    paragraphs: [{ number: "[0001]", text: "A monitor 10 has a probe 12.", lineNumber: 3 }],
    figures: [],
    drawingReferences: [],
    pages: [],
  };
  const report = toStudioReport(parsed, runDeterministicChecks(parsed), {
    fileName: "draft.docx",
    checkedAt: new Date("2026-10-29T19:07:00Z"),
  });

  test("maps rule flags to studio findings, must-fix first", () => {
    expect(report.findings).toHaveLength(2);
    expect(report.findings[0].id).toBe("F-01");
    expect(report.findings[0].checkId).toBe("claim-numbering");
    expect(report.findings[0].severity).toBe("must-fix");
    expect(report.findings[1].checkId).toBe("relative-term");
    expect(report.findings[1].location).toBe("Claim 3");
    expect(report.summary.mustFix).toBe(1);
    expect(report.summary.shouldFix).toBe(1);
  });

  test("marks parts a DOCX can't show as not checked", () => {
    expect(report.application.sourceFile).toBe("draft.docx");
    expect(report.application.checked).toBe("Oct 29, 15:07 ET");
    const rows = buildOutline(report.application, report.findings);
    expect(rows.find((r) => r.id === "drawings")!.status).toBe("not-checked");
    expect(rows.find((r) => r.id === "declaration")!.status).toBe("not-checked");
  });
});

describe("Document block parser", () => {
  const parsed = parseApplicationBlocks(
    [
      { text: "Hydration monitor" },
      { text: "BACKGROUND" },
      { text: "[0001] A monitor 10 has a probe 12, shown in FIG. 1." },
      { text: "What is claimed is:" },
      { text: "1. A monitor comprising:" },
      { text: "a probe; and" },
      { text: "a radio." },
      { text: "The monitor of claim 1, wherein the probe is sealed.", listItem: true },
      { text: "ABSTRACT" },
      { text: "A monitor with a probe." },
    ],
    "t",
  );

  test("splits title, specification, claims, and abstract", () => {
    expect(parsed.title).toBe("Hydration monitor");
    expect(parsed.paragraphs).toHaveLength(1);
    expect(parsed.paragraphs[0].number).toBe("[0001]");
    expect(parsed.figures).toContain("1");
    expect(parsed.abstract).toBe("A monitor with a probe.");
  });

  test("joins claim elements and numbers auto-numbered claims", () => {
    expect(parsed.claims).toHaveLength(2);
    expect(parsed.claims[0].text).toBe("A monitor comprising: a probe; and a radio.");
    expect(parsed.claims[1].number).toBe(2);
  });
});

console.log("\nAll tests passed! ✓\n");
