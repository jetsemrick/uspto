/** Strip ANSI color codes from provider CLI-style errors. */
function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

export function formatProviderError(error: unknown): string {
  if (error instanceof Error) {
    const message = stripAnsi(error.message);
    if (/authentication|unauthorized|invalid.*api.*key|401/i.test(message)) {
      return [
        "xAI authentication failed.",
        "Set XAI_API_KEY in .env.local (from https://console.x.ai), then restart `npm run dev`.",
        message,
      ].join(" ");
    }
    return message;
  }
  return String(error);
}

export const EMPTY_STRUCTURED_OUTPUT =
  "The model returned no structured output. Verify XAI_API_KEY, XAI_MODEL, and xAI account credits, then restart the dev server after changing .env.local.";
