import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { buildCaesarPrompt, type CaesarResponse, type CaesarVerdict, type JudgeModelId } from "./prompts/caesarPrompt";
import { buildMaximusPrompt, type MaximusResponse, type MaximusModelId } from "./prompts/maximusPrompt";

// Initialize all LLM clients using Replit AI Integrations
// These use AI integrations which don't require API keys and are billed to your credits

// OpenAI client - using AI integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Anthropic client - using AI integrations
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// Gemini client - using AI integrations
const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// OpenRouter client for Grok - using AI integrations
const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
});

export interface LLMResponse {
  modelId: string;
  response?: string;
  error?: string;
  generationTime?: number;
  tokenCount?: number;
}

async function generateWithOpenAI(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || "";
    const tokens = response.usage?.completion_tokens;

    return {
      modelId: "gpt-4o",
      response: content,
      generationTime: Date.now() - startTime,
      tokenCount: tokens,
    };
  } catch (error: any) {
    console.error("OpenAI error:", error);
    return {
      modelId: "gpt-4o",
      error: error.message || "Failed to generate response",
      generationTime: Date.now() - startTime,
    };
  }
}

async function generateWithAnthropic(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
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
      modelId: "claude-sonnet",
      response: responseText,
      generationTime: Date.now() - startTime,
      tokenCount: tokens,
    };
  } catch (error: any) {
    console.error("Anthropic error:", error);
    return {
      modelId: "claude-sonnet",
      error: error.message || "Failed to generate response",
      generationTime: Date.now() - startTime,
    };
  }
}

async function generateWithGemini(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  
  try {
    const result = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.text || "";
    
    // Get token usage from candidates
    const tokens = result.candidates?.[0]?.tokenCount;

    return {
      modelId: "gemini-flash",
      response: text,
      generationTime: Date.now() - startTime,
      tokenCount: tokens,
    };
  } catch (error: any) {
    console.error("Gemini error:", error);
    return {
      modelId: "gemini-flash",
      error: error.message || "Failed to generate response",
      generationTime: Date.now() - startTime,
    };
  }
}

async function generateWithGrok(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  
  try {
    const response = await openrouter.chat.completions.create({
      model: "x-ai/grok-4-fast",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || "";
    const tokens = response.usage?.completion_tokens;

    return {
      modelId: "grok",
      response: content,
      generationTime: Date.now() - startTime,
      tokenCount: tokens,
    };
  } catch (error: any) {
    console.error("Grok error:", error);
    return {
      modelId: "grok",
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

// Model name mapping for Caesar prompt
const MODEL_NAMES: { [key: string]: string } = {
  "gpt-4o": "GPT-4o",
  "claude-sonnet": "Claude Sonnet",
  "gemini-flash": "Gemini Flash",
  "grok": "Grok",
};

export async function generateCaesarVerdict(
  userPrompt: string,
  modelResponses: LLMResponse[],
  judgeModel: JudgeModelId
): Promise<CaesarResponse> {
  const startTime = Date.now();
  
  // Filter out errored responses and build the prompt
  const validResponses = modelResponses
    .filter(r => r.response && !r.error)
    .map(r => ({
      modelId: r.modelId,
      modelName: MODEL_NAMES[r.modelId] || r.modelId,
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
      case "claude-3-5-sonnet":
        const claudeResponse = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2048,
          messages: [{ role: "user", content: caesarPrompt }],
        });
        const claudeContent = claudeResponse.content[0];
        responseText = claudeContent.type === "text" ? claudeContent.text : "";
        break;
        
      case "gpt-4o":
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: caesarPrompt }],
          max_tokens: 2048,
        });
        responseText = openaiResponse.choices[0]?.message?.content || "";
        break;
        
      case "gemini-flash":
        const geminiResult = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: caesarPrompt }] }],
        });
        responseText = geminiResult.text || "";
        break;
        
      case "grok":
        const grokResponse = await openrouter.chat.completions.create({
          model: "x-ai/grok-2-1212",
          messages: [{ role: "user", content: caesarPrompt }],
          max_tokens: 2048,
        });
        responseText = grokResponse.choices[0]?.message?.content || "";
        break;
    }
    
    // Parse the JSON response
    // Try to extract JSON from the response (it might have markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find JSON object directly
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

export async function generateMaximus(
  userPrompt: string,
  modelResponses: LLMResponse[],
  maximusModel: MaximusModelId
): Promise<MaximusResponse> {
  const startTime = Date.now();
  
  // Filter out errored responses and build the prompt
  const validResponses = modelResponses
    .filter(r => r.response && !r.error)
    .map(r => ({
      modelId: r.modelId,
      modelName: MODEL_NAMES[r.modelId] || r.modelId,
      response: r.response!,
    }));
  
  if (validResponses.length < 2) {
    return {
      error: "Need at least 2 valid responses to synthesize",
      maximusModel: maximusModel,
    };
  }
  
  const maximusPrompt = buildMaximusPrompt(userPrompt, validResponses);
  
  try {
    let responseText = "";
    let tokenCount: number | undefined;
    
    switch (maximusModel) {
      case "claude-3-5-sonnet":
        const claudeResponse = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{ role: "user", content: maximusPrompt }],
        });
        const claudeContent = claudeResponse.content[0];
        responseText = claudeContent.type === "text" ? claudeContent.text : "";
        tokenCount = claudeResponse.usage?.output_tokens;
        break;
        
      case "gpt-4o":
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: maximusPrompt }],
          max_tokens: 4096,
        });
        responseText = openaiResponse.choices[0]?.message?.content || "";
        tokenCount = openaiResponse.usage?.completion_tokens;
        break;
        
      case "gemini-flash":
        const geminiResult = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: maximusPrompt }] }],
        });
        responseText = geminiResult.text || "";
        tokenCount = geminiResult.candidates?.[0]?.tokenCount;
        break;
        
      case "grok":
        const grokResponse = await openrouter.chat.completions.create({
          model: "x-ai/grok-2-1212",
          messages: [{ role: "user", content: maximusPrompt }],
          max_tokens: 4096,
        });
        responseText = grokResponse.choices[0]?.message?.content || "";
        tokenCount = grokResponse.usage?.completion_tokens;
        break;
    }
    
    return {
      synthesis: responseText,
      generationTime: Date.now() - startTime,
      maximusModel: maximusModel,
      tokenCount,
    };
  } catch (error: any) {
    console.error("Maximus generation error:", error);
    return {
      error: error.message || "Failed to generate synthesis",
      generationTime: Date.now() - startTime,
      maximusModel: maximusModel,
    };
  }
}
