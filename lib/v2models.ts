import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { V2_MAX_OUTPUT_TOKENS as CAP } from "./v2";

/** Prices per 1M tokens (input, output) from official pricing pages, Oct 2026. */
export const V2_MODELS = [
  { id: "grok", label: "Grok 4.7", vendor: "xAI", model: "x-ai/grok-4.7", price: [2, 6] },
  { id: "claude", label: "Claude Opus 5.5", vendor: "Anthropic", model: "claude-opus-5.5", price: [4, 20] },
  { id: "gemini", label: "Gemini 4 Argon", vendor: "Google", model: "gemini-4-argon", price: [2, 10] },
  { id: "gpt", label: "GPT-6.1 Sol", vendor: "OpenAI", model: "gpt-6.1-sol", price: [2, 10] },
] as const;
export type V2ModelId = (typeof V2_MODELS)[number]["id"];

export type V2Result = {
  id: V2ModelId;
  text?: string;
  error?: string;
  ms: number;
  inTok?: number;
  outTok?: number;
  costUsd?: number;
  truncated?: boolean;
};

async function run(id: V2ModelId, prompt: string): Promise<Omit<V2Result, "id" | "ms" | "costUsd">> {
  const m = V2_MODELS.find((x) => x.id === id)!;
  if (id === "grok") {
    const c = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY });
    const r = await c.chat.completions.create({ model: m.model, messages: [{ role: "user", content: prompt }], max_tokens: CAP });
    return { text: r.choices[0]?.message?.content || "", inTok: r.usage?.prompt_tokens, outTok: r.usage?.completion_tokens, truncated: r.choices[0]?.finish_reason === "length" };
  }
  if (id === "claude") {
    const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const r = await c.messages.create({ model: m.model, max_tokens: CAP, messages: [{ role: "user", content: prompt }] });
    const text = r.content.map((b: any) => (b.type === "text" ? b.text : "")).join("");
    return { text, inTok: r.usage.input_tokens, outTok: r.usage.output_tokens, truncated: r.stop_reason === "max_tokens" };
  }
  if (id === "gemini") {
    const c = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY });
    const r: any = await c.models.generateContent({
      model: m.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: CAP, thinkingConfig: { thinkingBudget: 1024 } },
    });
    const u = r.usageMetadata || {};
    return {
      text: r.text || "",
      inTok: u.promptTokenCount,
      outTok: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0),
      truncated: r.candidates?.[0]?.finishReason === "MAX_TOKENS",
    };
  }
  const c = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const r: any = await c.chat.completions.create({
    model: m.model,
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: CAP,
    reasoning_effort: "low",
  } as any);
  return { text: r.choices[0]?.message?.content || "", inTok: r.usage?.prompt_tokens, outTok: r.usage?.completion_tokens, truncated: r.choices[0]?.finish_reason === "length" };
}

export async function runModel(id: V2ModelId, prompt: string): Promise<V2Result> {
  const t = Date.now();
  const m = V2_MODELS.find((x) => x.id === id)!;
  try {
    const r = await run(id, prompt);
    const costUsd = ((r.inTok || 0) * m.price[0] + (r.outTok || 0) * m.price[1]) / 1e6;
    if (!r.text) return { id, ...r, ms: Date.now() - t, costUsd, error: r.truncated ? "Hit the output cap before answering." : "Empty response." };
    return { id, ...r, ms: Date.now() - t, costUsd };
  } catch (e: any) {
    console.error(`v2 ${id} error:`, e?.message);
    return { id, ms: Date.now() - t, error: String(e?.message || "Failed").slice(0, 300) };
  }
}
