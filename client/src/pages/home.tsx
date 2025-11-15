import { useState } from "react";
import ModelSelector, { AVAILABLE_MODELS, type ModelId } from "@/components/ModelSelector";
import PromptInput from "@/components/PromptInput";
import ComparisonGrid, { type ModelResponse } from "@/components/ComparisonGrid";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(["gpt-4o", "claude-sonnet"]);
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const { toast } = useToast();

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

    toast({
      title: "Generating responses",
      description: `Comparing across ${selectedModels.length} model${selectedModels.length > 1 ? 's' : ''}`
    });

    try {
      const res = await apiRequest("POST", "/api/compare", {
        prompt,
        modelIds: selectedModels
      });

      const result = await res.json();
      setResponses(result.responses);
    } catch (error: any) {
      console.error("Comparison error:", error);
      
      setResponses(
        selectedModels.map(modelId => ({
          modelId,
          error: "Failed to generate response"
        }))
      );

      toast({
        title: "Error",
        description: "Failed to generate comparisons. Please try again.",
        variant: "destructive"
      });
    }
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
