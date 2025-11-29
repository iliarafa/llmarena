import { useState } from "react";
import ComparisonCard from "./ComparisonCard";
import type { Model } from "./ModelSelector";
import type { CaesarResponse } from "./CaesarCard";

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
  blindModeEnabled?: boolean;
  blindModeRevealed?: boolean;
  onVote?: (modelId: string) => void;
  caesarResponse?: CaesarResponse;
}

const CONTENDER_LABELS = ["Contender A", "Contender B", "Contender C", "Contender D"];

export default function ComparisonGrid({ 
  models, 
  responses, 
  prompt,
  blindModeEnabled = false,
  blindModeRevealed = false,
  onVote,
  caesarResponse,
}: ComparisonGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const getModelLabel = (index: number): string => {
    const labels = ["A", "B", "C", "D"];
    return labels[index] || `${index + 1}`;
  };

  const hasHallucinationWarning = (modelIndex: number): boolean => {
    if (!caesarResponse?.verdict?.hallucination_warning?.detected) return false;
    const label = getModelLabel(modelIndex);
    return caesarResponse.verdict.hallucination_warning.suspects.includes(label);
  };

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

  const showBlindLabel = blindModeEnabled && !blindModeRevealed;
  
  const activeModel = models[activeIndex];
  const activeResponseData = activeModel ? responses.find(r => r.modelId === activeModel.id) : undefined;
  const activeContenderLabel = CONTENDER_LABELS[activeIndex] || `Contender ${activeIndex + 1}`;

  return (
    <div className="space-y-3">
      {/* Mobile Segmented Control Switcher */}
      <div 
        className="md:hidden sticky top-12 z-40 py-2 px-4"
        data-testid="model-switcher-bar"
      >
        <div className="bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm p-1 rounded-xl flex justify-between">
          {models.map((model, index) => {
            const contenderLabel = CONTENDER_LABELS[index] || `${index + 1}`;
            const isActive = activeIndex === index;
            const hasWarning = hasHallucinationWarning(index);
            
            return (
              <button
                key={model.id}
                onClick={() => setActiveIndex(index)}
                className={`relative flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                data-testid={`switcher-${model.id}`}
              >
                {showBlindLabel ? contenderLabel.replace('Contender ', '') : model.shortName}
                {hasWarning && (
                  <span 
                    className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                    data-testid={`warning-dot-${model.id}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Single Response View with Fade Animation */}
      <div className="md:hidden">
        {activeModel && (
          <div 
            key={activeModel.id}
            className="animate-in fade-in duration-200"
            data-testid={`response-view-${activeModel.id}`}
          >
            <ComparisonCard
              model={activeModel}
              response={activeResponseData?.response}
              isLoading={activeResponseData?.isLoading}
              error={activeResponseData?.error}
              generationTime={activeResponseData?.generationTime}
              tokenCount={activeResponseData?.tokenCount}
              prompt={prompt}
              blindModeLabel={showBlindLabel ? activeContenderLabel : undefined}
              onVote={blindModeEnabled && !blindModeRevealed ? onVote : undefined}
            />
          </div>
        )}
      </div>

      {/* Desktop Grid View (unchanged) */}
      <div 
        className={`hidden md:grid gap-6 ${
          models.length === 1 
            ? 'grid-cols-1 max-w-3xl mx-auto' 
            : models.length === 2 
            ? 'grid-cols-2' 
            : models.length === 3
            ? 'grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-2'
        }`}
      >
        {models.map((model, index) => {
          const responseData = responses.find(r => r.modelId === model.id);
          const contenderLabel = CONTENDER_LABELS[index] || `Contender ${index + 1}`;
          
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
              blindModeLabel={showBlindLabel ? contenderLabel : undefined}
              onVote={blindModeEnabled && !blindModeRevealed ? onVote : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
