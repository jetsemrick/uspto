import assert from "node:assert/strict";
import { quoteExistsInBody, sanitizeChartCells } from "../lib/quote-verify.ts";

const body =
  "[0004] When temperature exceeds T_max, controller 230 disables the coil until temperature drops.";

assert.equal(
  quoteExistsInBody("controller 230 disables the coil", body),
  true,
);

const cells = sanitizeChartCells(
  [
    {
      limitationId: "l1",
      referenceId: "r1",
      status: "supported",
      quote: "controller 999 fake",
      readsOn: "bad",
    },
  ],
  { r1: body },
);

assert.equal(cells[0].status, "missing");
assert.equal(cells[0].quote, undefined);

console.log("quote-verify tests passed");
