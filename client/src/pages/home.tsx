import { useState } from "react";
import ModelSelector, { AVAILABLE_MODELS, type ModelId } from "@/components/ModelSelector";
import PromptInput from "@/components/PromptInput";
import ComparisonGrid, { type ModelResponse } from "@/components/ComparisonGrid";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(["gpt-4o", "claude-sonnet"]);
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const { toast } = useToast();

  // todo: remove mock functionality
  const handleCompare = async () => {
    if (selectedModels.length === 0) {
      toast({
        title: "No models selected",
        description: "Please select at least one model to compare",
        variant: "destructive"
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to send to the models",
        variant: "destructive"
      });
      return;
    }

    // Set all selected models to loading state
    setResponses(
      selectedModels.map(modelId => ({
        modelId,
        isLoading: true
      }))
    );

    // Mock API calls - simulate different response times
    selectedModels.forEach((modelId, index) => {
      setTimeout(() => {
        setResponses(prev => 
          prev.map(r => 
            r.modelId === modelId
              ? {
                  modelId,
                  response: `This is a mock response from ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name}.\n\nYour prompt was: "${prompt}"\n\nIn a real implementation, this would be an actual AI-generated response with detailed analysis and insights tailored to your question.`,
                  generationTime: Math.floor(Math.random() * 2000) + 500,
                  tokenCount: Math.floor(Math.random() * 500) + 200
                }
              : r
          )
        );
      }, (index + 1) * 800);
    });

    toast({
      title: "Generating responses",
      description: `Comparing across ${selectedModels.length} model${selectedModels.length > 1 ? 's' : ''}`
    });
  };

  const models = AVAILABLE_MODELS.filter(m => selectedModels.includes(m.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold" data-testid="text-app-title">LLM Arena</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Compare responses across multiple AI models
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <ModelSelector 
            selectedModels={selectedModels}
            onSelectionChange={setSelectedModels}
          />
          
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleCompare}
            isLoading={responses.some(r => r.isLoading)}
            disabled={selectedModels.length === 0}
          />
        </div>

        <div className="pt-8">
          <ComparisonGrid 
            models={models}
            responses={responses}
          />
        </div>
      </main>
    </div>
  );
}
