import { useState } from "react";
import ModelSelector, { AVAILABLE_MODELS, type ModelId, type JudgeModelId } from "@/components/ModelSelector";
import PromptInput from "@/components/PromptInput";
import ComparisonGrid, { type ModelResponse } from "@/components/ComparisonGrid";
import CaesarCard, { type CaesarResponse } from "@/components/CaesarCard";
import HistorySidebar from "@/components/HistorySidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useAccountLinking } from "@/hooks/useAccountLinking";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { saveBattle, type Battle } from "@/lib/battleHistory";
import { generatePDF, downloadMarkdown, downloadJSON } from "@/lib/reportExporter";
import GuestAccountBanner from "@/components/GuestAccountBanner";
import { Button } from "@/components/ui/button";
import { LogOut, User, Coins, CreditCard, BarChart3, BookOpen, FileDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<ModelId[]>([]);
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [caesarEnabled, setCaesarEnabled] = useState(false);
  const [caesarJudgeModel, setCaesarJudgeModel] = useState<JudgeModelId>("gemini-flash");
  const [caesarResponse, setCaesarResponse] = useState<CaesarResponse | undefined>();
  const [caesarLoading, setCaesarLoading] = useState(false);
  const [blindModeEnabled, setBlindModeEnabled] = useState(false);
  const [blindModeRevealed, setBlindModeRevealed] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { creditBalance } = useCreditBalance();
  const [, setLocation] = useLocation();
  useAccountLinking();
  
  const isGuest = !isAuthenticated && !!localStorage.getItem("guestToken");
  
  // Calculate credit cost based on tiered pricing
  const creditCostMap: Record<number, number> = {
    1: 3,
    2: 5,
    3: 7,
    4: 10,
  };
  const baseCreditCost = creditCostMap[selectedModels.length] || 0;
  const caesarCost = caesarEnabled ? 3 : 0;
  const creditCost = baseCreditCost + caesarCost;

  // Create model name mapping for Caesar card
  const modelNames: { [modelId: string]: string } = {};
  AVAILABLE_MODELS.forEach(m => {
    modelNames[m.id] = m.name;
  });

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

    // Reset blind mode reveal state for new comparison
    if (blindModeEnabled) {
      setBlindModeRevealed(false);
    }

    // Set all selected models to loading state
    setResponses(
      selectedModels.map(modelId => ({
        modelId,
        isLoading: true
      }))
    );
    
    // Set Caesar to loading if enabled
    if (caesarEnabled) {
      setCaesarLoading(true);
      setCaesarResponse(undefined);
    }

    toast({
      title: "Generating responses",
      description: `Comparing across ${selectedModels.length} model${selectedModels.length > 1 ? 's' : ''}${caesarEnabled ? ' + Caesar judging' : ''}`
    });

    try {
      const res = await apiRequest("POST", "/api/compare", {
        prompt,
        modelIds: selectedModels,
        caesarEnabled,
        caesarJudgeModel: caesarEnabled ? caesarJudgeModel : undefined,
      });

      if (res.status === 402) {
        const errorData = await res.json();
        
        setResponses(
          selectedModels.map(modelId => ({
            modelId,
            error: "Insufficient credits"
          }))
        );
        setCaesarLoading(false);
        
        toast({
          title: "Insufficient Credits",
          description: `You need ${errorData.required} credits but only have ${errorData.available}. Purchase more credits to continue.`,
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => setLocation("/purchase")}>
              Buy Credits
            </Button>
          ),
        });
        return;
      }

      const result = await res.json();
      setResponses(result.responses);
      
      // Set Caesar response if present and auto-reveal blind mode
      if (result.caesar) {
        setCaesarResponse(result.caesar);
        if (blindModeEnabled) {
          setBlindModeRevealed(true);
        }
      }
      setCaesarLoading(false);
      
      // Invalidate credit balance queries to refresh the displayed balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guest/verify"] });
      
      // Save battle to local history
      const validResponses = result.responses.filter((r: ModelResponse) => r.response && !r.error);
      if (validResponses.length > 0) {
        const battleResponses = validResponses.map((r: ModelResponse) => ({
          modelId: r.modelId,
          modelName: modelNames[r.modelId] || r.modelId,
          response: r.response!,
          generationTime: r.generationTime,
          tokenCount: r.tokenCount,
        }));

        const caesarResult = result.caesar?.verdict ? {
          winner: result.caesar.verdict.winner,
          winnerModelName: result.caesar.verdict.winner === "Tie" 
            ? "Tie" 
            : modelNames[result.caesar.modelMapping[result.caesar.verdict.winner]] || result.caesar.verdict.winner,
          confidence: result.caesar.verdict.confidence,
          oneLineVerdict: result.caesar.verdict.one_line_verdict,
          detailedReasoning: result.caesar.verdict.detailed_reasoning || [],
          scores: result.caesar.verdict.scores || {},
          judgeModel: result.caesar.judgeModel,
          modelMapping: result.caesar.modelMapping,
        } : undefined;

        saveBattle({
          prompt,
          responses: battleResponses,
          caesar: caesarResult,
          blindMode: blindModeEnabled,
        });
        setHistoryRefreshTrigger(prev => prev + 1);
      }

      // Show success message with credits used (with guards for missing fields)
      if (result.creditsUsed !== undefined && result.creditsRemaining !== undefined) {
        toast({
          title: "Comparison Complete",
          description: `Used ${result.creditsUsed} credits. You have ${result.creditsRemaining} credits remaining.`,
        });
      } else {
        toast({
          title: "Comparison Complete",
          description: "Responses generated successfully.",
        });
      }
    } catch (error: any) {
      console.error("Comparison error:", error);
      
      setResponses(
        selectedModels.map(modelId => ({
          modelId,
          error: "Failed to generate response"
        }))
      );
      setCaesarLoading(false);

      toast({
        title: "Error",
        description: "Failed to generate comparisons. Please try again.",
        variant: "destructive"
      });
    }
  };

  const models = AVAILABLE_MODELS.filter(m => selectedModels.includes(m.id));

  // Handle voting in blind mode - reveals the model names
  const handleVote = (modelId: string) => {
    if (blindModeEnabled && !blindModeRevealed) {
      setBlindModeRevealed(true);
      toast({
        title: "Vote Recorded!",
        description: `You voted for the response. Model identities revealed!`,
      });
    }
  };

  // Load a battle from history
  const handleLoadBattle = (battle: Battle) => {
    setPrompt(battle.prompt);
    setBlindModeEnabled(battle.blindMode);
    setBlindModeRevealed(true); // Always reveal when loading from history
    
    // Convert battle responses back to ModelResponse format
    const loadedResponses: ModelResponse[] = battle.responses.map(r => ({
      modelId: r.modelId,
      response: r.response,
      generationTime: r.generationTime,
      tokenCount: r.tokenCount,
    }));
    setResponses(loadedResponses);
    
    // Set selected models from the battle
    const modelIds = battle.responses.map(r => r.modelId as ModelId);
    setSelectedModels(modelIds);
    
    // Restore Caesar response if available
    if (battle.caesar) {
      const caesarResp: CaesarResponse = {
        verdict: {
          winner: battle.caesar.winner as "A" | "B" | "C" | "D" | "Tie",
          confidence: battle.caesar.confidence,
          one_line_verdict: battle.caesar.oneLineVerdict,
          detailed_reasoning: battle.caesar.detailedReasoning || [],
          scores: battle.caesar.scores || {},
        },
        judgeModel: battle.caesar.judgeModel,
        modelMapping: battle.caesar.modelMapping || {},
      };
      setCaesarResponse(caesarResp);
      setCaesarEnabled(true);
    } else {
      setCaesarResponse(undefined);
      setCaesarEnabled(false);
    }
    
    toast({
      title: "Battle Loaded",
      description: "Viewing saved battle from history",
    });
  };

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold" data-testid="text-app-title">LLM Arena</h1>
            <HistorySidebar 
              onLoadBattle={handleLoadBattle}
              refreshTrigger={historyRefreshTrigger}
            />
            <Link href="/notebook">
              <Button variant="ghost" size="sm" className="text-[#616161] dark:text-white" data-testid="link-notebook">
                <BookOpen className="w-4 h-4 mr-2" />
                Notebook
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground hidden sm:flex">
              <Coins className="w-4 h-4" />
              <span data-testid="text-header-credits">{creditBalance.toFixed(0)} credits</span>
              <Link href="/purchase">
                <Button variant="ghost" size="sm" className="h-8 text-[#383838] dark:text-[#d4d4d4]" data-testid="button-header-buy-credits">
                  Buy Credits
                </Button>
              </Link>
            </div>
            
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
                <div className="px-2 py-1.5 text-sm" data-testid="text-credit-balance">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Coins className="w-4 h-4" />
                    <span className="font-medium">{creditBalance.toFixed(0)} credits</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem data-testid="button-dashboard">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/purchase">
                  <DropdownMenuItem data-testid="button-buy-credits">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Buy Credits
                  </DropdownMenuItem>
                </Link>
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
          {isGuest && <GuestAccountBanner creditBalance={creditBalance} />}
          
          <ModelSelector 
            selectedModels={selectedModels}
            onSelectionChange={setSelectedModels}
            caesarEnabled={caesarEnabled}
            onCaesarToggle={setCaesarEnabled}
            caesarJudgeModel={caesarJudgeModel}
            onCaesarJudgeChange={setCaesarJudgeModel}
            blindModeEnabled={blindModeEnabled}
            onBlindModeToggle={setBlindModeEnabled}
          />
          
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleCompare}
            isLoading={responses.some(r => r.isLoading) || caesarLoading}
            disabled={selectedModels.length === 0}
            creditCost={creditCost}
            creditBalance={creditBalance}
          />
        </div>

        <div className="pt-8">
          {responses.some(r => r.response && !r.error) && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Comparison Results</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-download-report">
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => {
                      generatePDF({
                        prompt,
                        responses,
                        modelNames,
                        caesar: caesarResponse,
                        blindMode: blindModeEnabled && !blindModeRevealed,
                      });
                      toast({
                        title: "PDF Generated",
                        description: blindModeEnabled && !blindModeRevealed 
                          ? "Report downloaded - model names are revealed in export"
                          : "Your comparison report has been downloaded",
                      });
                    }}
                    data-testid="button-export-pdf"
                  >
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      downloadMarkdown({
                        prompt,
                        responses,
                        modelNames,
                        caesar: caesarResponse,
                        blindMode: blindModeEnabled && !blindModeRevealed,
                      });
                      toast({
                        title: "Markdown Generated",
                        description: blindModeEnabled && !blindModeRevealed 
                          ? "Report downloaded - model names are revealed in export"
                          : "Your comparison report has been downloaded",
                      });
                    }}
                    data-testid="button-export-markdown"
                  >
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      downloadJSON({
                        prompt,
                        responses,
                        modelNames,
                        caesar: caesarResponse,
                        blindMode: blindModeEnabled && !blindModeRevealed,
                      });
                      toast({
                        title: "JSON Generated",
                        description: blindModeEnabled && !blindModeRevealed 
                          ? "Report downloaded - model names are revealed in export"
                          : "Your comparison report has been downloaded",
                      });
                    }}
                    data-testid="button-export-json"
                  >
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <div className={`grid gap-6 ${caesarEnabled || caesarResponse ? 'lg:grid-cols-[1fr_350px]' : ''}`}>
            <ComparisonGrid 
              models={models}
              responses={responses}
              prompt={prompt}
              blindModeEnabled={blindModeEnabled}
              blindModeRevealed={blindModeRevealed}
              onVote={handleVote}
            />
            {(caesarEnabled || caesarResponse) && (
              <div className="lg:sticky lg:top-24 lg:self-start">
                <CaesarCard 
                  caesarResponse={caesarResponse}
                  isLoading={caesarLoading}
                  modelNames={modelNames}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
