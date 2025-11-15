import ComparisonCard from "../ComparisonCard";
import { AVAILABLE_MODELS } from "../ModelSelector";

export default function ComparisonCardExample() {
  const mockResponse = `Here's a comprehensive analysis of the question you asked. This response demonstrates how the model would typically format and structure its output.

Key points to consider:
1. First important aspect
2. Second crucial element
3. Third significant factor

In conclusion, this shows how the card displays longer responses with proper formatting and scrolling capabilities.`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <ComparisonCard
        model={AVAILABLE_MODELS[0]}
        response={mockResponse}
        generationTime={1234}
        tokenCount={456}
      />
      <ComparisonCard
        model={AVAILABLE_MODELS[1]}
        isLoading={true}
      />
      <ComparisonCard
        model={AVAILABLE_MODELS[2]}
        error="Failed to generate response. Please try again."
      />
      <ComparisonCard
        model={AVAILABLE_MODELS[3]}
      />
    </div>
  );
}
