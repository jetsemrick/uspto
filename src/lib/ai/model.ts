import { createXai, type XaiProvider } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";

const DEFAULT_GROK_MODEL = "grok-4-1-fast-reasoning";

let cachedProvider: XaiProvider | null = null;

/** xAI API key from XAI_API_KEY, or legacy AI_GATEWAY_API_KEY if it is an xai- key. */
export function getXaiApiKey(): string {
  const primary = process.env.XAI_API_KEY?.trim();
  if (primary) return primary;

  const legacy = process.env.AI_GATEWAY_API_KEY?.trim();
  if (legacy?.startsWith("xai-")) return legacy;

  throw new Error(
    "Set XAI_API_KEY in .env.local with your Grok API key from https://console.x.ai",
  );
}

export function getGrokModelId(): string {
  const fromEnv =
    process.env.XAI_MODEL?.trim() || process.env.AI_GATEWAY_MODEL?.trim();
  if (!fromEnv) return DEFAULT_GROK_MODEL;
  // Allow users who still have gateway-style ids in env
  const normalized = fromEnv.replace(/^spacexai\//i, "");
  return normalized;
}

function getXaiProvider(): XaiProvider {
  if (!cachedProvider) {
    cachedProvider = createXai({ apiKey: getXaiApiKey() });
  }
  return cachedProvider;
}

export function getGrokModel(): LanguageModel {
  const modelId = getGrokModelId();
  return getXaiProvider()(modelId);
}

export type ReasoningEffort = "none" | "low" | "medium" | "high";

const REASONING_EFFORTS: ReasoningEffort[] = ["none", "low", "medium", "high"];

/** XAI_REASONING_EFFORT overrides the per-step default for every call. */
export function resolveReasoningEffort(stepDefault: ReasoningEffort): ReasoningEffort {
  const fromEnv = process.env.XAI_REASONING_EFFORT?.trim().toLowerCase();
  return REASONING_EFFORTS.includes(fromEnv as ReasoningEffort)
    ? (fromEnv as ReasoningEffort)
    : stepDefault;
}

export function assertModelCredentials(): void {
  getXaiApiKey();
}

export { DEFAULT_GROK_MODEL };
