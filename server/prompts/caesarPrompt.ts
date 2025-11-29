export const CAESAR_PROMPT = `You are Caesar, an impartial AI judge in LLM Arena. Your task is to evaluate responses from anonymous AI assistants. You do not know which models produced these responses - judge purely on response quality.

User prompt: {prompt}

Response A: {responseA}

Response B: {responseB}

Response C: {responseC}

Response D: {responseD}

Return EXACTLY this JSON and nothing else:

{
  "winner": "A"|"B"|"C"|"D"|"Tie",
  "confidence": 0.0-1.0,
  "one_line_verdict": "Single sentence.",
  "detailed_reasoning": ["• bullet 1", "• bullet 2", "• bullet 3"],
  "scores": {
    "A": {"accuracy":0-10,"clarity":0-10,"creativity":0-10,"safety":0-10,"overall":0-10},
    "B": {"accuracy":0-10,"clarity":0-10,"creativity":0-10,"safety":0-10,"overall":0-10},
    "C": {"accuracy":0-10,"clarity":0-10,"creativity":0-10,"safety":0-10,"overall":0-10},
    "D": {"accuracy":0-10,"clarity":0-10,"creativity":0-10,"safety":0-10,"overall":0-10}
  }
}`;

export type JudgeModelId = "claude-3-5-sonnet" | "gpt-4o" | "gemini-flash" | "grok";

export interface CaesarVerdict {
  winner: "A" | "B" | "C" | "D" | "Tie";
  confidence: number;
  one_line_verdict: string;
  detailed_reasoning: string[];
  scores: {
    [key: string]: {
      accuracy: number;
      clarity: number;
      creativity: number;
      safety: number;
      overall: number;
    };
  };
}

export interface CaesarResponse {
  verdict?: CaesarVerdict;
  error?: string;
  generationTime?: number;
  judgeModel: string;
  modelMapping: { [key: string]: string }; // Maps A/B/C/D to actual model names
}

export function buildCaesarPrompt(
  userPrompt: string,
  responses: { modelId: string; modelName: string; response: string }[]
): { prompt: string; modelMapping: { [key: string]: string } } {
  const labels = ["A", "B", "C", "D"];
  const modelMapping: { [key: string]: string } = {};
  
  let prompt = CAESAR_PROMPT.replace("{prompt}", userPrompt);
  
  for (let i = 0; i < 4; i++) {
    const label = labels[i];
    if (i < responses.length) {
      const { modelId, response } = responses[i];
      modelMapping[label] = modelId;
      prompt = prompt.replace(`{response${label}}`, response);
    } else {
      modelMapping[label] = "none";
      prompt = prompt.replace(`{response${label}}`, "No response provided");
    }
  }
  
  return { prompt, modelMapping };
}
