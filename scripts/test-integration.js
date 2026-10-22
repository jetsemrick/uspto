#!/usr/bin/env node

/**
 * Simple integration test for readiness check system
 * Tests API endpoints and verifies basic functionality
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";

async function testEndpoint(name, fn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await fn();
    console.log("✓");
    return true;
  } catch (error) {
    console.log("✗");
    console.error(`  Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("USPTO Application Readiness Check - Integration Tests\n");

  let passed = 0;
  let failed = 0;

  // Test 1: List applications
  if (
    await testEndpoint("List applications", async () => {
      const res = await fetch(`${BASE_URL}/api/readiness-applications`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.total !== 50)
        throw new Error(`Expected 50 applications, got ${data.total}`);
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Check clean application
  if (
    await testEndpoint("Check clean application", async () => {
      const res = await fetch(`${BASE_URL}/api/readiness-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: "app-clean-1" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Clean apps may have warnings from deterministic checks
      if (data.summary.errorCount > 0)
        throw new Error(`Clean app has ${data.summary.errorCount} errors`);
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Check application with defects
  if (
    await testEndpoint("Check application with defects", async () => {
      const res = await fetch(`${BASE_URL}/api/readiness-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: "app-claim_form-1" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.summary.totalFlags === 0)
        throw new Error("Expected defects, found none");
      // Should find at least the claim_form defect
      const hasClaimFormDefect = data.flags.some((f) => f.type === "claim_form");
      if (!hasClaimFormDefect)
        throw new Error("Did not detect claim_form defect");
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Check abstract length defect
  if (
    await testEndpoint("Detect abstract length defect", async () => {
      const res = await fetch(`${BASE_URL}/api/readiness-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: "app-abstract_length-1" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hasAbstractDefect = data.flags.some(
        (f) => f.type === "abstract_length",
      );
      if (!hasAbstractDefect)
        throw new Error("Did not detect abstract_length defect");
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Check drawing reference defect
  if (
    await testEndpoint("Detect drawing reference defect", async () => {
      const res = await fetch(`${BASE_URL}/api/readiness-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: "app-drawing_reference-1" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hasDrawingDefect = data.flags.some(
        (f) => f.type === "drawing_reference",
      );
      if (!hasDrawingDefect)
        throw new Error("Did not detect drawing_reference defect");
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(60)}\n`);

  if (failed > 0) {
    console.log("❌ Some tests failed");
    process.exit(1);
  } else {
    console.log("✅ All tests passed!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Test suite error:", error);
  process.exit(1);
});
