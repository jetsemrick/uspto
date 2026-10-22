#!/usr/bin/env node

/**
 * CLI script to run regression tests
 * Usage:
 *   node scripts/run-regression.js              # Run and compare to baseline
 *   node scripts/run-regression.js --save       # Save current run as baseline
 *   node scripts/run-regression.js --simulate   # Simulate regression with degraded model
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

async function runRegression() {
  const args = process.argv.slice(2);
  const saveBaseline = args.includes("--save") || args.includes("--save-baseline");
  const simulate = args.includes("--simulate");

  console.log("Running USPTO Application Readiness Check - Regression Test\n");

  try {
    const params = new URLSearchParams();
    if (saveBaseline) params.append("saveBaseline", "true");
    if (simulate) params.append("simulate", "true");

    const response = await fetch(
      `${API_URL}/api/readiness-regression?${params}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Regression test failed:", error);
      process.exit(1);
    }

    const text = await response.text();
    console.log(text);

    // Exit with code 1 if regression detected
    if (text.includes("❌ REGRESSION DETECTED")) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Error running regression test:", error);
    process.exit(1);
  }
}

runRegression();
