import { useState } from "react";
import { Crown, Sword, EyeOff } from "lucide-react";
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
  caesarEnabled?: boolean;
  maximusEnabled?: boolean;
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
  caesarEnabled = false,
  maximusEnabled = false,
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

  const hasActiveFeatures = caesarEnabled || maximusEnabled || blindModeEnabled;

  const FeatureDescriptions = () => hasActiveFeatures ? (
    <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300" data-testid="feature-descriptions">
      {caesarEnabled && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-full" data-testid="feature-desc-caesar">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-700 dark:text-amber-300">Evaluates responses and picks the winner</span>
        </div>
      )}
      {maximusEnabled && (
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 rounded-full" data-testid="feature-desc-maximus">
          <Sword className="h-4 w-4 text-[#800020]" />
          <span className="text-sm text-rose-700 dark:text-rose-300">Synthesize the best insights from all responses</span>
        </div>
      )}
      {blindModeEnabled && (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/30 rounded-full" data-testid="feature-desc-blind">
          <EyeOff className="h-4 w-4 text-purple-600" />
          <span className="text-sm text-purple-700 dark:text-purple-300">Models hidden until you vote or reveal</span>
        </div>
      )}
    </div>
  ) : null;

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6">
        <FeatureDescriptions />
      </div>
    );
  }

  const showBlindLabel = blindModeEnabled && !blindModeRevealed;
  
  const activeModel = models[activeIndex];
  const activeResponseData = activeModel ? responses.find(r => r.modelId === activeModel.id) : undefined;
  const activeContenderLabel = CONTENDER_LABELS[activeIndex] || `Contender ${activeIndex + 1}`;

  return (
    <div className="space-y-3">
      {/* Feature Descriptions */}
      <FeatureDescriptions />

      {/* Mobile Segmented Control Switcher */}
      <div 
        className="md:hidden sticky top-12 z-40 py-2 px-4"
        data-testid="model-switcher-bar"
      >
        <div className="bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm p-1 flex justify-between gap-1">
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
                    : 'text-gray-500'
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
            className="fade-in-animation"
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
