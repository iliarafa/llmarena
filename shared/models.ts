export const CONTENDER_MODEL_IDS = ["gpt-4o", "claude-sonnet", "gemini-flash", "grok"] as const;
export type ContenderModelId = (typeof CONTENDER_MODEL_IDS)[number];

export const JUDGE_MODEL_IDS = ["claude-sonnet", "gpt-4o", "gemini-flash", "grok"] as const;
export type JudgeModelId = (typeof JUDGE_MODEL_IDS)[number];

export const MAXIMUS_MODEL_IDS = ["gpt-4o", "gemini-flash", "grok"] as const;
export type MaximusModelId = (typeof MAXIMUS_MODEL_IDS)[number];

/** Stable app IDs → UI labels. Keep IDs stable so battle history and API stay compatible. */
export const MODEL_DISPLAY_NAMES: Record<ContenderModelId, string> = {
  "gpt-4o": "GPT-5.4",
  "claude-sonnet": "Claude Sonnet 5",
  "gemini-flash": "Gemini 3.8 Flash",
  "grok": "Grok 4.6",
};

export const MODEL_SHORT_NAMES: Record<ContenderModelId, string> = {
  "gpt-4o": "GPT-5.4",
  "claude-sonnet": "Claude",
  "gemini-flash": "Gemini",
  "grok": "Grok",
};

export const JUDGE_DISPLAY_NAMES: Record<JudgeModelId, string> = {
  "claude-sonnet": "Claude Sonnet 5",
  "gpt-4o": "GPT-5.4",
  "gemini-flash": "Gemini 3.8 Flash",
  "grok": "Grok 4.6",
};

export const MAXIMUS_DISPLAY_NAMES: Record<MaximusModelId, string> = {
  "gpt-4o": "GPT-5.4",
  "gemini-flash": "Gemini 3.8 Flash",
  "grok": "Grok 4.6",
};

/** Provider API model slugs used at call time (Sep 2026). */
export const PROVIDER_MODEL_IDS = {
  openai: "gpt-5.4",
  anthropic: "claude-sonnet-5",
  gemini: "gemini-3.8-flash",
  grok: "x-ai/grok-4.6",
} as const;

export const DEFAULT_JUDGE_MODEL: JudgeModelId = "gemini-flash";
export const DEFAULT_MAXIMUS_MODEL: MaximusModelId = "gemini-flash";

/** Credit cost by number of contender models. Keep in sync via this module only. */
export const CREDIT_COST_BY_MODEL_COUNT: Record<number, number> = {
  1: 3,
  2: 5,
  3: 7,
  4: 10,
};

export const CAESAR_CREDIT_COST = 3;
export const MAXIMUS_CREDIT_COST = 5;
