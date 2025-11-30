export const FUSION_PROMPT = `You are an expert synthesizer AI. Your task is to create the ultimate, definitive answer by combining the best elements from multiple AI model responses.

<user_prompt>
{prompt}
</user_prompt>

<model_responses>
{responses}
</model_responses>

INSTRUCTIONS:
1. Analyze all the model responses above carefully.
2. Identify the strongest, most accurate, and most insightful points from each response.
3. Synthesize these elements into a single, cohesive, comprehensive answer.
4. DO NOT mention "Model A said X" or "According to the responses" - write as if YOU are the expert directly answering the user's question.
5. If there are factual disagreements between models, use your judgment to determine the most likely correct answer, or acknowledge the uncertainty if appropriate.
6. Structure your answer clearly with proper formatting.
7. Be concise but comprehensive - include all valuable insights without unnecessary repetition.
8. Maintain the best tone and style from the original responses.

Write your synthesized answer directly:`;

export type FusionModelId = "claude-3-5-sonnet" | "gpt-4o" | "gemini-flash" | "grok";

export interface FusionResponse {
  synthesis?: string;
  error?: string;
  generationTime?: number;
  fusionModel: string;
  tokenCount?: number;
}

export function buildFusionPrompt(
  userPrompt: string,
  responses: { modelId: string; modelName: string; response: string }[]
): string {
  const formattedResponses = responses
    .map((r, i) => `--- Response ${i + 1} ---\n${r.response}`)
    .join("\n\n");
  
  return FUSION_PROMPT
    .replace("{prompt}", userPrompt)
    .replace("{responses}", formattedResponses);
}
