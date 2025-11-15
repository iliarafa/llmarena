import { useState } from "react";
import ModelSelector, { AVAILABLE_MODELS, type ModelId } from "@/components/ModelSelector";
import PromptInput from "@/components/PromptInput";
import ComparisonGrid, { type ModelResponse } from "@/components/ComparisonGrid";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(["gpt-4o", "claude-sonnet"]);
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const isGuest = !isAuthenticated && !!localStorage.getItem("guestToken");

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

  const handleLogout = () => {
    if (isGuest) {
      // Clear guest token
      localStorage.removeItem("guestToken");
      window.location.href = "/";
    } else {
      // Redirect to logout endpoint
      window.location.href = "/api/logout";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold" data-testid="text-app-title">LLM Arena</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block">
              Compare responses across multiple AI models
            </p>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel data-testid="text-user-status">
                  {isGuest ? "Guest User" : (user as any)?.email || "User"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="w-4 h-4 mr-2" />
                  {isGuest ? "Clear Token" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
