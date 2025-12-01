export const MAXIMUS_PROMPT = `You are Maximus, the ultimate champion of truth. You have analyzed the responses from 4 contending models. Your task: Forge the ultimate answer.

Take the code accuracy of the best coder.
Take the reasoning of the best thinker.
Take the clarity of the best writer.

<user_prompt>
{prompt}
</user_prompt>

<model_responses>
{responses}
</model_responses>

Output a single, definitive response that stands above the rest. Do not meta-comment (don't say "I combined them"). Just be the best.

Write your forged answer directly:`;

export type MaximusModelId = "gpt-4o" | "gemini-flash" | "grok";

export interface MaximusResponse {
  synthesis?: string;
  error?: string;
  generationTime?: number;
  maximusModel: string;
  tokenCount?: number;
}

export function buildMaximusPrompt(
  userPrompt: string,
  responses: { modelId: string; modelName: string; response: string }[]
): string {
  const formattedResponses = responses
    .map((r, i) => `--- Response ${i + 1} ---\n${r.response}`)
    .join("\n\n");
  
  return MAXIMUS_PROMPT
    .replace("{prompt}", userPrompt)
    .replace("{responses}", formattedResponses);
}
