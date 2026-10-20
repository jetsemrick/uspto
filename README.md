# USPTO §103 examiner workspace

Desktop demo for patent examiners: load an application and prior-art references, confirm a limitation split, review a sourced claim chart, and get a neutral 35 U.S.C. §103 obviousness evaluation for each claim. The examiner records their own determination. Analysis runs through **Grok** via the [xAI API](https://docs.x.ai).

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set:
   - `XAI_API_KEY` — from [console.x.ai](https://console.x.ai)
   - `XAI_MODEL` (optional) — e.g. `grok-4-1-fast-reasoning`, `grok-4.6`
   - `XAI_REASONING_EFFORT` (optional) — `none`, `low`, `medium`, or `high` for every step. By default the limitation split, chart, and revisions use `low` and the evaluation uses `medium`. Higher effort is slower: a chart at Grok 4.6's default effort took over three minutes, versus about 30 seconds at `low`.
3. Run: `npm run dev`

If you previously stored an `xai-…` key in `AI_GATEWAY_API_KEY`, it still works until you move it to `XAI_API_KEY`.

## Demo flow

1. **Load sample case** — fictional thermal-management charging application with Smith and Chen references
2. **Propose limitation split** — edit limitations, then **Map prior art**
3. Agree or disagree with each chart mapping, choose a base reference, then **Evaluate obviousness**
4. Each claim gets an AI finding (obviousness supported, not supported, or record incomplete) with a confidence level. Record your own determination per claim, edit or revise the Graham-factor sections, then copy or download

Session text is sent to xAI for the session only; nothing is persisted server-side.

## Troubleshooting

- **Authentication errors** — Confirm `XAI_API_KEY`, restart `npm run dev` after editing `.env.local`.
- **Empty / type validation errors** — Usually an invalid key or model id; check the red banner for the plain-text API error.
