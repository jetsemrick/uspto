# Patent Readiness Studio

USPTO demo app for the Nov 10, 2026 roundtable: readiness checks for applicants, examiner review tools, and evaluation metrics. One engine, three views.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the **Patent Readiness Studio** with three tabs:

1. **Applicant** — Readiness report with findings (missing parts, 35 USC 112 issues, formalities)
2. **Examiner** — Finding queue, claim-support map, what-if panel, traceability
3. **Evaluation** — Precision, recall, false positives, regression gate

The app loads a demo application (19/482,317, soil moisture sensor) with 7 findings.

## Tests & Evaluation

```bash
# Run tests
npx tsx src/__tests__/studio.test.ts

# Run evaluation
npx tsx src/eval/evaluate.ts
```

The eval script computes precision, recall, and override rate against a ground truth test set.

## Demo Path

1. Start on **Applicant** tab → see readiness report with 3 Must fix, 2 Should fix, 1 Advisory
2. Switch to **Examiner** tab → queue shows findings sorted by severity
3. Click "Open what-if on claim 14" → edit claim 14(c) and watch findings resolve
4. Go back → see claim-support map showing gap in claim 14(c)
5. Switch to **Evaluation** tab → precision 0.91, recall 0.88, regression runs

## Key Features

- **No API key required** — Runs with cached model outputs for the demo applications
- **Deterministic + Model checks** — Rules for mechanical issues, Grok (via xAI API) for judgment checks when `XAI_API_KEY` is set
- **Traceability** — Every finding has check ID, model version, prompt version, confidence, and audit trail
- **What-if** — Edit claims and see findings update in real time
- **Section 508 / WCAG AA** — 17px base font, 2px rules, shape + word + color for severity

## Deploying with xAI Grok

For production checks beyond the demo:

1. Set `XAI_API_KEY` in `.env.local` (from [console.x.ai](https://console.x.ai))
2. Set `XAI_MODEL` (optional) — e.g., `grok-4-1-fast-reasoning`, `grok-4.6`
3. The app will call Grok for model-based checks and cache responses

In AWS GovCloud:
- Run Grok via Amazon Bedrock
- Each check endpoint is stateless and can be deployed as a Lambda function
- DOCX parsing runs server-side

## Files

- `src/app/studio/` — Main app with three tabs
- `src/components/studio/` — Tab components (Applicant, Examiner, Evaluation, WhatIf)
- `src/lib/studio/demo-application.ts` — Demo data (application 19/482,317 + findings)
- `src/lib/types/studio.ts` — Type definitions
- `src/__tests__/studio.test.ts` — Tests
- `src/eval/evaluate.ts` — Evaluation script
- `public/css/` — Design system CSS (tokens, components, USPTO layer)

## Artifacts

Generated during demo recording:
- `recording_demo.mp4` — 2-4 minute screen recording following the demo path
- Screenshots in artifacts folder — key screens from each tab

## What's Real vs. Cached

- **Real**: All UI, routing, state management, claim editing, decision recording
- **Cached/Stubbed**: Model responses for demo application (no API key needed), upload/download buttons

## Architecture

Each check runs as a stateless function:
- **Input**: Parsed application (claims, spec, drawings)
- **Output**: Findings with confidence, evidence, citations, suggested fixes
- **Rules-based checks**: Deterministic (claim numbering, abstract length, etc.)
- **Model checks**: Grok API with structured JSON output (antecedent basis, claim support, etc.)

Production path:
1. Upload DOCX
2. Parse to structured JSON
3. Run checks in parallel
4. Return findings
5. Examiner reviews, accepts, or overrides
6. Decisions are logged and feed back into eval

## Notes for USPTO

- Citations (MPEP/CFR) need practitioner review (shown in UI)
- Findings are suggestions, not Office actions (shown in applicant view)
- Evaluation uses a seeded test set with answer key written before checks run
- Override rate (8% in pilot) shown next to precision
- One blocked run (R-1041) in regression history shows the gate working

## License

Vendor prototype for USPTO evaluation. Not an official U.S. government product. Synthetic data only.
