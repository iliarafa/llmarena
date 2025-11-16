import ComparisonCard from "./ComparisonCard";
import type { Model } from "./ModelSelector";

export interface ModelResponse {
  modelId: string;
  response?: string;
  isLoading?: boolean;
  error?: string;
  generationTime?: number;
  tokenCount?: number;
}

interface ComparisonGridProps {
  models: Model[];
  responses: ModelResponse[];
  prompt?: string;
}

export default function ComparisonGrid({ models, responses, prompt }: ComparisonGridProps) {
  if (models.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-muted-foreground">
            Select models and enter a prompt to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`grid gap-6 ${
        models.length === 1 
          ? 'grid-cols-1 max-w-3xl mx-auto' 
          : models.length === 2 
          ? 'grid-cols-1 md:grid-cols-2' 
          : models.length === 3
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
      }`}
    >
      {models.map((model) => {
        const responseData = responses.find(r => r.modelId === model.id);
        
        return (
          <ComparisonCard
            key={model.id}
            model={model}
            response={responseData?.response}
            isLoading={responseData?.isLoading}
            error={responseData?.error}
            generationTime={responseData?.generationTime}
            tokenCount={responseData?.tokenCount}
            prompt={prompt}
          />
        );
      })}
    </div>
  );
}
