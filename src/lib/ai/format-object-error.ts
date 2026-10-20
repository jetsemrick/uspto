export function formatUseObjectError(error: Error): string {
  const msg = error.message;
  if (
    msg.includes("Type validation failed") &&
    msg.includes("received undefined")
  ) {
    return [
      "The model returned no JSON object (empty stream).",
      "This usually means xAI rejected the request (invalid API key), the model ID is wrong, or the account is out of credits.",
      "Set XAI_API_KEY in .env.local, restart `npm run dev`, then try again.",
    ].join(" ");
  }
  return msg;
}
