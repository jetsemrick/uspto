import type { ChartCell } from "@/lib/schemas/chart";

function normalizeForSearch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function quoteExistsInBody(quote: string, body: string): boolean {
  if (!quote.trim()) return false;
  const q = normalizeForSearch(quote);
  const b = normalizeForSearch(body);
  if (b.includes(q)) return true;
  // Allow minor ellipsis in model quotes: check first 40 chars
  if (q.length > 40 && b.includes(q.slice(0, 40))) return true;
  return false;
}

export function sanitizeChartCells(
  cells: ChartCell[],
  referenceBodies: Record<string, string>,
): ChartCell[] {
  return cells.map((cell) => {
    if (cell.status === "missing") {
      return { ...cell, quote: undefined };
    }
    const body = referenceBodies[cell.referenceId];
    if (!body || !cell.quote || !quoteExistsInBody(cell.quote, body)) {
      return {
        ...cell,
        status: "missing" as const,
        quote: undefined,
        readsOn:
          (cell.readsOn ?? "") +
          (cell.readsOn ? " " : "") +
          "[Demo: quote could not be verified in reference text.]",
      };
    }
    return cell;
  });
}
