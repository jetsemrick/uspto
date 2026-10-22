#!/usr/bin/env node

/**
 * CLI script to run readiness check evaluation
 * Usage: node scripts/run-evaluation.js [--format json|text]
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

async function runEvaluation() {
  const args = process.argv.slice(2);
  const format = args.includes("--format")
    ? args[args.indexOf("--format") + 1]
    : "text";

  console.log("Starting USPTO Application Readiness Check Evaluation...\n");
  console.log("This will process all synthetic test applications and calculate");
  console.log("precision/recall metrics for each defect type.\n");

  try {
    const response = await fetch(`${API_URL}/api/readiness-eval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Evaluation failed:", error);
      process.exit(1);
    }

    if (format === "text") {
      const text = await response.text();
      console.log(text);
    } else {
      const report = await response.json();
      console.log(JSON.stringify(report, null, 2));
    }

    console.log("\n✓ Evaluation complete");
  } catch (error) {
    console.error("Error running evaluation:", error);
    process.exit(1);
  }
}

runEvaluation();
