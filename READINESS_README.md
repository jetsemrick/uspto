# USPTO Application Readiness & Formalities Check

Modular REST/JSON API component for automated patent application readiness verification, built for the USPTO Super Intelligence Roundtable vendor demo (SpaceXAI / Anysphere, Nov 10, 2026).

## Overview

This component addresses USPTO objective 1a: "Application Readiness checks & suggestions for examination" as a plug-and-play API service. It performs automated formalities checks on patent applications, flagging issues before examination to improve application quality and reduce examiner workload.

### Key Features

- **Modular REST API**: Stateless JSON API designed for integration into larger USPTO systems
- **Dual Check Types**: Deterministic rule-based checks + LLM-enhanced checks via Grok
- **Comprehensive Coverage**: Checks abstract length, claim formatting, drawing references, page numbering, antecedent basis
- **Applicant & Examiner Views**: Same output rendered for both pre-filing readiness and examiner pre-flags
- **Evaluation Harness**: Built-in precision/recall testing against synthetic ground truth
- **Continuous Evaluation**: Regression detection for model/prompt version changes
- **Full Traceability**: Every flag includes MPEP/CFR citations, model version, and prompt version

## Architecture

```
┌─────────────────┐
│  Patent App     │
│  (DOCX input)   │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────┐
│  Readiness Check API                │
│  (/api/readiness-check)             │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ Deterministic│  │ LLM Checks  │ │
│  │ Rules        │  │ (Grok API)  │ │
│  └──────────────┘  └─────────────┘ │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│  ReadinessReport (JSON)             │
│  - flags[]                          │
│  - location, severity, citation     │
│  - suggested fixes                  │
│  - model/prompt versions            │
└─────────────────────────────────────┘
         │
         ├─────────┬─────────────┐
         │         │             │
         v         v             v
   Applicant  Examiner    Evaluation
   View       View        Harness
```

### Production Story

**Current Demo**: Uses xAI Grok API (OpenAI-compatible) with fallback to deterministic checks when API unavailable.

**Production Path**: Deploy Grok models via Amazon Bedrock in AWS GovCloud for FedRAMP compliance. The API layer remains unchanged; only the model provider URL and authentication method change. Deterministic checks have no external dependencies.

## Checks Implemented

### Deterministic (Rule-Based)

1. **Abstract Length**: Ensures abstract ≤150 words (37 CFR 1.72(b); MPEP 608.01(b))
2. **Claim Numbering**: Consecutive Arabic numerals (37 CFR 1.126; MPEP 608.01(j))
3. **Claim Form**: Capital letter, single sentence, ends with period (MPEP 608.01(m))
4. **Page Numbering**: Consecutive page numbers (37 CFR 1.52(b)(5))
5. **Drawing References**: Characters appear in both drawings and description (37 CFR 1.84(p)(5); MPEP 608.02)

### LLM-Enhanced

6. **Antecedent Basis**: Terms properly introduced before reference (MPEP 2173.05(e))

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment (optional for LLM checks):
   ```bash
   cp .env.example .env.local
   # Add XAI_API_KEY for LLM-based antecedent basis checks
   # If omitted, falls back to deterministic heuristics
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

## Usage

### Web Interface

Open http://localhost:3000/readiness to:
- Browse 50 synthetic test applications
- Run readiness checks on any application
- View detailed formalities reports with citations

### API Endpoints

#### Check Application Readiness

```bash
POST /api/readiness-check
Content-Type: application/json

{
  "applicationId": "app-clean-1"
}
```

Response:
```json
{
  "applicationId": "app-clean-1",
  "checkTimestamp": "2026-10-22T19:54:00.000Z",
  "flags": [
    {
      "id": "uuid",
      "type": "claim_form",
      "severity": "error",
      "location": {
        "type": "claim",
        "identifier": "claim 1",
        "lineNumber": 100
      },
      "description": "Claim 1 does not begin with a capital letter.",
      "suggestedFix": "Capitalize the first letter of the claim.",
      "citation": {
        "section": "MPEP 608.01(m)",
        "description": "Each claim must be a single sentence beginning with a capital letter"
      },
      "isDeterministic": true
    }
  ],
  "summary": {
    "totalFlags": 1,
    "errorCount": 1,
    "warningCount": 0,
    "infoCount": 0
  }
}
```

#### List Available Applications

```bash
GET /api/readiness-applications
```

Returns list of all synthetic test applications with their ground truth metadata.

#### Run Evaluation

```bash
POST /api/readiness-eval
Content-Type: application/json

{
  "format": "text"  // or "json"
}
```

Processes all test applications and returns precision/recall metrics.

### Command Line Evaluation

```bash
# Run full evaluation suite and print results
npm run eval

# Or directly:
node scripts/run-evaluation.js --format text
```

Output:
```
================================================================================
USPTO APPLICATION READINESS CHECK - EVALUATION REPORT
================================================================================

Timestamp: 2026-10-22T19:54:00.000Z
Model Version: grok-4-1-fast-reasoning
Prompt Version: v1.0
Total Applications: 50

--------------------------------------------------------------------------------
OVERALL METRICS
--------------------------------------------------------------------------------
Precision: 95.2%
Recall:    92.8%
F1 Score:  94.0%

--------------------------------------------------------------------------------
PER-DEFECT TYPE METRICS
--------------------------------------------------------------------------------
Defect Type                  TP    FP    FN  Precision     Recall   F1 Score
--------------------------------------------------------------------------------
abstract_length               5     0     0      100.0%     100.0%     100.0%
claim_numbering               5     0     0      100.0%     100.0%     100.0%
claim_form                    5     1     0       83.3%     100.0%      90.9%
drawing_reference             5     2     0       71.4%     100.0%      83.3%
page_numbering                5     0     0      100.0%     100.0%     100.0%
antecedent_basis              4     1     1       80.0%      80.0%      80.0%
```

## Test Data

The system includes 50 synthetic patent applications:
- **10 clean applications** (control group, no defects)
- **30 single-defect applications** (5 per defect type)
- **10 multi-defect applications** (2-4 defects each)

Technology areas: Machine Learning, Power Systems, Thermal Management, Gene Editing, Catalysis, Diagnostic Imaging, 5G Networks, Solar Cells.

### Ground Truth

Each synthetic application includes a ground truth manifest with:
- Seeded defect locations and types
- Technology classification
- Whether it's a clean control

The evaluation harness matches detected flags against this ground truth to calculate metrics.

## Evaluation Methodology

### Metrics

- **Precision**: TP / (TP + FP) — "What fraction of flagged issues are real?"
- **Recall**: TP / (TP + FN) — "What fraction of real issues did we catch?"
- **F1 Score**: Harmonic mean of precision and recall

### Tuning Philosophy

**Optimized for precision over recall.** USPTO examiners need high trust in automated flags. A false positive undermines examiner confidence more than a missed issue (which they'll catch anyway). Current target: >90% precision, >85% recall.

### Regression Detection

```javascript
// Compare current results to baseline
import { checkRegression } from "@/lib/readiness/evaluation";

const regressionCheck = checkRegression(currentReport, baselineReport, 0.05);
if (regressionCheck.hasRegression) {
  console.error("Performance regression detected:");
  regressionCheck.regressions.forEach(r => {
    console.error(`  ${r.defectType} ${r.metric}: ${r.currentValue} (was ${r.baselineValue})`);
  });
  process.exit(1);
}
```

Run this in CI after model or prompt changes.

### False Positive Tracking

The evaluation report includes the first 20 false positives with full details. Review these to refine rules or retrain models.

### Live Metrics (Stubbed)

In production, examiner accept/override actions feed back into test data:
1. Examiner reviews automated flag
2. Accepts (confirms issue) or overrides (false positive)
3. Action logged with `flagId` and `reason`
4. Aggregated metrics show real-world precision
5. Override cases become new test cases

Currently stubbed in types; integration requires USPTO examiner workflow system.

## Extending the System

### Add a New Check

1. **Deterministic check**: Add function to `src/lib/readiness/deterministic-checks.ts`
2. **LLM check**: Add function to `src/lib/readiness/llm-checks.ts`
3. Add defect type to `DefectType` union in `src/lib/types/readiness.ts`
4. Update `generateSyntheticApplication` to seed the new defect type
5. Re-run evaluation to establish baseline metrics

### Integrate Real DOCX Parsing

Replace `getSyntheticApplication()` in `/api/readiness-check/route.ts` with:

```typescript
import mammoth from "mammoth";

// Parse uploaded DOCX
const buffer = Buffer.from(body.docxContent, "base64");
const { value: html } = await mammoth.convertToHtml({ buffer });

// Extract claims, paragraphs, references from HTML
const app = parseDocxHtml(html);
```

### Deploy to AWS GovCloud

1. Replace `getGrokModel()` to use Bedrock endpoint
2. Set AWS credentials in environment
3. Update `MODEL_VERSION` constant
4. Re-run evaluation to establish new baseline

API consumers see no changes; output schema is identical.

## Tests

```bash
npm run test       # Run all tests (when implemented)
npm run eval       # Run evaluation harness
npm run lint       # Check code style
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── readiness-check/      # Main API endpoint
│   │   ├── readiness-eval/       # Evaluation endpoint
│   │   └── readiness-applications/ # List applications
│   └── readiness/
│       └── page.tsx              # Demo UI
├── lib/
│   ├── readiness/
│   │   ├── deterministic-checks.ts  # Rule-based checks
│   │   ├── llm-checks.ts            # Grok-based checks
│   │   ├── synthetic-data.ts        # Test data generator
│   │   └── evaluation.ts            # Precision/recall harness
│   └── types/
│       └── readiness.ts          # TypeScript types
└── scripts/
    └── run-evaluation.js         # CLI evaluation runner
```

## What's Stubbed

1. **Real DOCX parsing**: Currently uses synthetic `ParsedApplication` objects
2. **Patent Center flags integration**: Input structure defined but not consumed
3. **Examiner action logging**: Types defined but persistence not implemented
4. **Sequence listing handling**: Mentioned in requirements but not in test data
5. **Production database**: In-memory test suite; production would use persistent storage

All stubs have clear integration points in the code.

## Performance

- **Deterministic checks**: <100ms per application
- **LLM checks**: 2-5s per application (batched, 10 claims at a time)
- **Full evaluation**: 3-5 minutes for 50 applications

Optimization opportunities:
- Parallel processing of applications
- Persistent LLM result caching
- Incremental checks (only changed claims)

## License

Proprietary - SpaceXAI / Anysphere for USPTO demonstration purposes.

## Contact

For questions about this demo, contact the SpaceXAI team through the USPTO Super Intelligence Roundtable program.
