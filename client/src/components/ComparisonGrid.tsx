import { useState, useRef, useEffect, useCallback } from "react";
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
  blindModeEnabled?: boolean;
  blindModeRevealed?: boolean;
  onVote?: (modelId: string) => void;
}

const CONTENDER_LABELS = ["Contender A", "Contender B", "Contender C", "Contender D"];

export default function ComparisonGrid({ 
  models, 
  responses, 
  prompt,
  blindModeEnabled = false,
  blindModeRevealed = false,
  onVote,
}: ComparisonGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const programmaticScrollTarget = useRef<number | null>(null);
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateActiveIndex = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return 0;
    
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    cardRefs.current.forEach((card, index) => {
      if (card) {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(cardCenter - containerCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });
    
    return closestIndex;
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    const targetCard = cardRefs.current[index];
    if (!container || !targetCard) return;
    
    programmaticScrollTarget.current = index;
    setActiveIndex(index);
    
    const containerRect = container.getBoundingClientRect();
    const cardRect = targetCard.getBoundingClientRect();
    const scrollLeft = container.scrollLeft + cardRect.left - containerRect.left - (containerRect.width - cardRect.width) / 2;
    
    container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || models.length === 0) return;

    const handleScrollEnd = () => {
      programmaticScrollTarget.current = null;
      const newIndex = calculateActiveIndex();
      setActiveIndex(newIndex);
    };

    const handleScroll = () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
      
      if (programmaticScrollTarget.current !== null) {
        scrollEndTimeoutRef.current = setTimeout(handleScrollEnd, 150);
        return;
      }
      
      scrollEndTimeoutRef.current = setTimeout(() => {
        const newIndex = calculateActiveIndex();
        setActiveIndex(newIndex);
      }, 50);
    };

    const handleResize = () => {
      if (programmaticScrollTarget.current === null) {
        scrollToIndex(activeIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    const resizeObserver = new ResizeObserver(() => {
      if (programmaticScrollTarget.current === null && cardRefs.current[activeIndex]) {
        scrollToIndex(activeIndex);
      }
    });
    resizeObserver.observe(container);
    
    const initialIndex = calculateActiveIndex();
    setActiveIndex(initialIndex);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, [models.length, calculateActiveIndex, scrollToIndex, activeIndex]);

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

  return (
    <div className="space-y-3">
      <div 
        className="flex gap-2 justify-center md:hidden sticky top-12 z-40 py-2 bg-gradient-to-b from-white to-white/80 dark:from-gray-950 dark:to-gray-950/80 backdrop-blur-sm"
        data-testid="model-indicator-bar"
      >
        {models.map((model, index) => {
          const contenderLabel = CONTENDER_LABELS[index] || `${index + 1}`;
          return (
            <button
              key={model.id}
              onClick={() => scrollToIndex(index)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                activeIndex === index
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}
              data-testid={`indicator-${model.id}`}
            >
              {showBlindLabel ? contenderLabel.replace('Contender ', '') : model.shortName}
            </button>
          );
        })}
      </div>

      <div 
        ref={scrollContainerRef}
        className="
          flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth
          -mx-4 px-4 pb-4
          md:hidden
        "
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        data-testid="carousel-container"
      >
        {models.map((model, index) => {
          const responseData = responses.find(r => r.modelId === model.id);
          const contenderLabel = CONTENDER_LABELS[index] || `Contender ${index + 1}`;
          
          return (
            <div 
              key={model.id}
              ref={(el) => { cardRefs.current[index] = el; }}
              className="w-[85vw] flex-shrink-0 snap-center"
              data-testid={`carousel-card-${model.id}`}
            >
              <ComparisonCard
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
            </div>
          );
        })}
      </div>

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
