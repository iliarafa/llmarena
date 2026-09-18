import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { buildCaesarPrompt, type CaesarResponse, type CaesarVerdict } from "./prompts/caesarPrompt";
import { buildMaximusPrompt, type MaximusResponse } from "./prompts/maximusPrompt";
import {
  MODEL_DISPLAY_NAMES,
  PROVIDER_MODEL_IDS,
  type ContenderModelId,
  type JudgeModelId,
  type MaximusModelId,
} from "@shared/models";

function googleApiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
}

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

function getGemini(): GoogleGenAI {
  const apiKey = googleApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY (or GOOGLE_API_KEY) is not set");
  }
  return new GoogleGenAI({ apiKey });
}

function getOpenRouter(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
}

export interface LLMResponse {
  modelId: string;
  response?: string;
  error?: string;
  generationTime?: number;
  tokenCount?: number;
}

async function generateWithOpenAI(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  const modelId: ContenderModelId = "gpt-4o";

  try {
    const response = await getOpenAI().chat.completions.create({
      model: PROVIDER_MODEL_IDS.openai,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || "";
    const tokens = response.usage?.completion_tokens;

    return {
      modelId,
      response: content,
      generationTime: Date.now() - startTime,
      tokenCount: tokens,
    };
  } catch (error: any) {
    console.error("OpenAI error:", error);
    return {
      modelId,
      error: error.message || "Failed to generate response",
      generationTime: Date.now() - startTime,
    };
  }
}

async function generateWithAnthropic(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  const modelId: ContenderModelId = "claude-sonnet";

  try {
    const message = await getAnthropic().messages.create({
      model: PROVIDER_MODEL_IDS.anthropic,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    const responseText = content.type === "text" ? content.text : "";
    const tokens = message.usage?.output_tokens;

    return {
      modelId,
      response: responseText,
      generationTime: Date.now() - startTime,
      tokenCount: tokens,
    };
  } catch (error: any) {
    console.error("Anthropic error:", error);
    return {
      modelId,
      error: error.message || "Failed to generate response",
      generationTime: Date.now() - startTime,
    };
  }
}

async function generateWithGemini(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  const modelId: ContenderModelId = "gemini-flash";

  try {
    const result = await getGemini().models.generateContent({
      model: PROVIDER_MODEL_IDS.gemini,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.text || "";
    const tokens = result.candidates?.[0]?.tokenCount;

    return {
      modelId,
      response: text,
      generationTime: Date.now() - startTime,
      tokenCount: tokens,
    };
  } catch (error: any) {
    console.error("Gemini error:", error);
    return {
      modelId,
      error: error.message || "Failed to generate response",
      generationTime: Date.now() - startTime,
    };
  }
}

async function generateWithGrok(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  const modelId: ContenderModelId = "grok";

  try {
    const response = await getOpenRouter().chat.completions.create({
      model: PROVIDER_MODEL_IDS.grok,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || "";
    const tokens = response.usage?.completion_tokens;

    return {
      modelId,
      response: content,
      generationTime: Date.now() - startTime,
      tokenCount: tokens,
    };
  } catch (error: any) {
    console.error("Grok error:", error);
    return {
      modelId,
      error: error.message || "Failed to generate response",
      generationTime: Date.now() - startTime,
    };
  }
}

export async function generateComparisons(
  prompt: string,
  modelIds: string[]
): Promise<LLMResponse[]> {
  const promises: Promise<LLMResponse>[] = [];

  for (const modelId of modelIds) {
    switch (modelId) {
      case "gpt-4o":
        promises.push(generateWithOpenAI(prompt));
        break;
      case "claude-sonnet":
        promises.push(generateWithAnthropic(prompt));
        break;
      case "gemini-flash":
        promises.push(generateWithGemini(prompt));
        break;
      case "grok":
        promises.push(generateWithGrok(prompt));
        break;
      default:
        promises.push(
          Promise.resolve({
            modelId,
            error: "Unknown model",
          })
        );
    }
  }

  return Promise.all(promises);
}

export async function generateCaesarVerdict(
  userPrompt: string,
  modelResponses: LLMResponse[],
  judgeModel: JudgeModelId
): Promise<CaesarResponse> {
  const startTime = Date.now();

  const validResponses = modelResponses
    .filter(r => r.response && !r.error)
    .map(r => ({
      modelId: r.modelId,
      modelName: MODEL_DISPLAY_NAMES[r.modelId as ContenderModelId] || r.modelId,
      response: r.response!,
    }));

  if (validResponses.length < 2) {
    return {
      error: "Need at least 2 valid responses to judge",
      judgeModel: judgeModel,
      modelMapping: {},
    };
  }

  const { prompt: caesarPrompt, modelMapping } = buildCaesarPrompt(userPrompt, validResponses);

  try {
    let responseText = "";

    switch (judgeModel) {
      case "claude-sonnet": {
        const claudeResponse = await getAnthropic().messages.create({
          model: PROVIDER_MODEL_IDS.anthropic,
          max_tokens: 2048,
          messages: [{ role: "user", content: caesarPrompt }],
        });
        const claudeContent = claudeResponse.content[0];
        responseText = claudeContent.type === "text" ? claudeContent.text : "";
        break;
      }

      case "gpt-4o": {
        const openaiResponse = await getOpenAI().chat.completions.create({
          model: PROVIDER_MODEL_IDS.openai,
          messages: [{ role: "user", content: caesarPrompt }],
          max_completion_tokens: 2048,
        });
        responseText = openaiResponse.choices[0]?.message?.content || "";
        break;
      }

      case "gemini-flash": {
        const geminiResult = await getGemini().models.generateContent({
          model: PROVIDER_MODEL_IDS.gemini,
          contents: [{ role: "user", parts: [{ text: caesarPrompt }] }],
        });
        responseText = geminiResult.text || "";
        break;
      }

      case "grok": {
        const grokResponse = await getOpenRouter().chat.completions.create({
          model: PROVIDER_MODEL_IDS.grok,
          messages: [{ role: "user", content: caesarPrompt }],
          max_tokens: 2048,
        });
        responseText = grokResponse.choices[0]?.message?.content || "";
        break;
      }
    }

    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = responseText.substring(startIdx, endIdx + 1);
      }
    }

    const verdict: CaesarVerdict = JSON.parse(jsonStr);

    return {
      verdict,
      generationTime: Date.now() - startTime,
      judgeModel: judgeModel,
      modelMapping,
    };
  } catch (error: any) {
    console.error("Caesar verdict error:", error);
    return {
      error: error.message || "Failed to generate verdict",
      generationTime: Date.now() - startTime,
      judgeModel: judgeModel,
      modelMapping,
    };
  }
}

async function callMaximusModel(
  maximusPrompt: string,
  model: MaximusModelId
): Promise<{ responseText: string; tokenCount?: number }> {
  switch (model) {
    case "gpt-4o": {
      const openaiResponse = await getOpenAI().chat.completions.create({
        model: PROVIDER_MODEL_IDS.openai,
        messages: [{ role: "user", content: maximusPrompt }],
        max_completion_tokens: 4096,
      });
      return {
        responseText: openaiResponse.choices[0]?.message?.content || "",
        tokenCount: openaiResponse.usage?.completion_tokens,
      };
    }

    case "gemini-flash": {
      const geminiResult = await getGemini().models.generateContent({
        model: PROVIDER_MODEL_IDS.gemini,
        contents: [{ role: "user", parts: [{ text: maximusPrompt }] }],
      });
      return {
        responseText: geminiResult.text || "",
        tokenCount: geminiResult.candidates?.[0]?.tokenCount,
      };
    }

    case "grok": {
      const grokResponse = await getOpenRouter().chat.completions.create({
        model: PROVIDER_MODEL_IDS.grok,
        messages: [{ role: "user", content: maximusPrompt }],
        max_tokens: 4096,
      });
      return {
        responseText: grokResponse.choices[0]?.message?.content || "",
        tokenCount: grokResponse.usage?.completion_tokens,
      };
    }
  }
}

const MAXIMUS_FALLBACK_ORDER: MaximusModelId[] = ["gemini-flash", "grok", "gpt-4o"];

function getModelsToTry(primaryModel: MaximusModelId): MaximusModelId[] {
  const primaryIndex = MAXIMUS_FALLBACK_ORDER.indexOf(primaryModel);
  if (primaryIndex === -1) {
    return [primaryModel, ...MAXIMUS_FALLBACK_ORDER];
  }
  const afterPrimary = MAXIMUS_FALLBACK_ORDER.slice(primaryIndex);
  const beforePrimary = MAXIMUS_FALLBACK_ORDER.slice(0, primaryIndex);
  return [...afterPrimary, ...beforePrimary];
}

export async function generateMaximus(
  userPrompt: string,
  modelResponses: LLMResponse[],
  maximusModel: MaximusModelId
): Promise<MaximusResponse> {
  const startTime = Date.now();

  const validResponses = modelResponses
    .filter(r => r.response && !r.error)
    .map(r => ({
      modelId: r.modelId,
      modelName: MODEL_DISPLAY_NAMES[r.modelId as ContenderModelId] || r.modelId,
      response: r.response!,
    }));

  if (validResponses.length < 2) {
    return {
      error: "Need at least 2 valid responses to synthesize",
      maximusModel: maximusModel,
    };
  }

  const maximusPrompt = buildMaximusPrompt(userPrompt, validResponses);
  const modelsToTry = getModelsToTry(maximusModel);
  const errors: string[] = [];

  for (const model of modelsToTry) {
    try {
      console.log(`Maximus: Trying ${model}...`);
      const { responseText, tokenCount } = await callMaximusModel(maximusPrompt, model);

      if (!responseText) {
        throw new Error("Empty response received");
      }

      const usedFallback = model !== maximusModel;
      if (usedFallback) {
        console.log(`Maximus: Primary engine (${maximusModel}) failed, used fallback (${model})`);
      }

      return {
        synthesis: responseText,
        generationTime: Date.now() - startTime,
        maximusModel: model,
        tokenCount,
        usedFallback,
        originalModel: usedFallback ? maximusModel : undefined,
      };
    } catch (error: any) {
      console.error(`Maximus ${model} error:`, error.message);
      errors.push(`${model}: ${error.message}`);
    }
  }

  return {
    error: `All Maximus engines failed. Errors: ${errors.join("; ")}`,
    generationTime: Date.now() - startTime,
    maximusModel: maximusModel,
  };
}
