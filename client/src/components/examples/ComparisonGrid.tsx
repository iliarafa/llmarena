import ComparisonGrid, { type ModelResponse } from "../ComparisonGrid";
import { AVAILABLE_MODELS } from "../ModelSelector";

export default function ComparisonGridExample() {
  const selectedModels = AVAILABLE_MODELS.slice(0, 4);
  
  const mockResponses: ModelResponse[] = [
    {
      modelId: "gpt-4o",
      response: "This is GPT-4o's response to your prompt. It provides detailed and thoughtful analysis.",
      generationTime: 1234,
      tokenCount: 456
    },
    {
      modelId: "claude-sonnet",
      isLoading: true
    },
    {
      modelId: "gemini-flash",
      response: "Gemini Flash provides a quick and efficient response here.",
      generationTime: 890,
      tokenCount: 234
    },
    {
      modelId: "grok",
      error: "Failed to connect to model"
    }
  ];

  return (
    <div className="p-6">
      <ComparisonGrid models={selectedModels} responses={mockResponses} />
    </div>
  );
}
