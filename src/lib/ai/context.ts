/** Rough char budget before refusing the request (full text in context, no truncation). */
const MAX_COMBINED_CHARS = 350_000;

export type MatterDocuments = {
  applicationNumber: string;
  title: string;
  claims: string;
  specification: string;
  references: Array<{
    id: string;
    label: string;
    title: string;
    body: string;
  }>;
};

export function estimateCombinedChars(docs: MatterDocuments): number {
  return (
    docs.claims.length +
    docs.specification.length +
    docs.references.reduce((n, r) => n + r.body.length, 0)
  );
}

export function assertContextFits(docs: MatterDocuments): void {
  const total = estimateCombinedChars(docs);
  if (total > MAX_COMBINED_CHARS) {
    throw new Error(
      `Combined document text (${total.toLocaleString()} characters) exceeds the demo limit (${MAX_COMBINED_CHARS.toLocaleString()}). Shorten the specification or references before continuing.`,
    );
  }
}

export function formatDocumentsForPrompt(docs: MatterDocuments): string {
  const refs = docs.references
    .map(
      (r) =>
        `--- Reference ${r.label} (${r.id}) ---\nTitle: ${r.title}\n\n${r.body}`,
    )
    .join("\n\n");

  return [
    `Application: ${docs.applicationNumber}`,
    `Title: ${docs.title}`,
    "",
    "=== CLAIMS ===",
    docs.claims,
    "",
    "=== SPECIFICATION ===",
    docs.specification,
    "",
    "=== PRIOR ART REFERENCES ===",
    refs,
  ].join("\n");
}

export function documentManifest(docs: MatterDocuments): string[] {
  return [
    `Claims (${docs.claims.length.toLocaleString()} chars)`,
    `Specification (${docs.specification.length.toLocaleString()} chars)`,
    ...docs.references.map(
      (r) => `${r.label} — ${r.title} (${r.body.length.toLocaleString()} chars)`,
    ),
  ];
}
