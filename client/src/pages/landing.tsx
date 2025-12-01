import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Sparkles, Zap, Shield, Crown, Eye, Sword, Layers, ChevronRight, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Link } from "wouter";
import llmFightImage from "@assets/Gemini_Generated_Image_d61xiad61xiad61x.png";

function BattleModesContent() {
  return (
    <div className="flex flex-col gap-6">
      <div 
        className="group relative pl-6"
        data-testid="battle-mode-blind"
      >
        <Eye className="absolute left-0 top-[2px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors duration-300 ease-out">Blind Mode</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Unbiased evaluation. Identities scrambled using <span className="text-gray-900 dark:text-white font-semibold">Fisher-Yates shuffling</span>.</p>
      </div>

      <div 
        className="group relative pl-6"
        data-testid="battle-mode-caesar"
      >
        <Crown className="absolute left-0 top-[2px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors duration-300 ease-out">Caesar</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">AI Arbiter. Detection of factual divergences with <span className="text-gray-900 dark:text-white font-semibold">Hallucination Alerts</span>.</p>
      </div>

      <div 
        className="group relative pl-6"
        data-testid="battle-mode-maximus"
      >
        <Sword className="absolute left-0 top-[2px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-[#800020] transition-colors duration-300 ease-out">Maximus</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">The Champion. <span className="text-gray-900 dark:text-white font-semibold">Synthesizes</span> best insights into one <span className="text-gray-900 dark:text-white font-semibold">perfect response</span>.</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [isBattleModesOpen, setIsBattleModesOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateGuestToken = async () => {
    setIsCreatingToken(true);
    try {
      const res = await apiRequest("POST", "/api/guest/create", {});
      const data = await res.json();
      
      setGuestToken(data.token);
      
      localStorage.setItem("guestToken", data.token);
      
      toast({
        title: "Guest token created",
        description: "Your token has been saved. You can now purchase credits.",
      });
    } catch (error) {
      console.error("Error creating guest token:", error);
      toast({
        title: "Error",
        description: "Failed to create guest token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleCopyToken = () => {
    if (guestToken) {
      navigator.clipboard.writeText(guestToken);
      toast({
        title: "Token copied",
        description: "Your guest token has been copied to clipboard",
      });
    }
  };

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-8 md:py-16">
        <div className="text-center mb-6 md:mb-8">
          <h1 
            className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 md:mb-3" 
            data-testid="text-landing-title"
          >
            LLM Arena
          </h1>
          <p className="text-xs md:text-sm font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1 md:mb-2">
            Frontier Models Parallel Generations
          </p>
          <p className="text-[10px] md:text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide">
            Anthropic / Google / OpenAI / xAI
          </p>
          
          <div className="flex justify-center mt-6 md:mt-10 mb-4 md:mb-10">
            <img 
              src={llmFightImage} 
              alt="AI models competing" 
              className="w-72 md:w-[431px] h-auto mix-blend-multiply brightness-105 dark:mix-blend-normal dark:invert dark:hue-rotate-180"
            />
          </div>
          
          <div className="flex justify-center mb-4 md:mb-8">
            <div 
              className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" 
              data-testid="privacy-guarantee-badge"
            >
              <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
              <span 
                className="text-[10px] md:text-xs font-semibold text-gray-700 dark:text-gray-200 tracking-tight" 
                data-testid="text-privacy-guarantee"
              >
                Prompts & responses never stored
              </span>
            </div>
          </div>

          <div className="flex flex-row items-center justify-center gap-3 mt-6 md:hidden" data-testid="mobile-hero-cta">
            {!guestToken ? (
              <>
                <Button 
                  onClick={handleCreateGuestToken}
                  disabled={isCreatingToken}
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-medium dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  data-testid="button-create-guest-token-mobile"
                >
                  {isCreatingToken ? "Creating..." : "Create Guest Token"}
                </Button>
                <Button 
                  onClick={handleSignIn}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 dark:text-gray-400 font-medium"
                  data-testid="button-sign-in-mobile"
                >
                  Sign In
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full px-4">
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-sm">
                  <code className="flex-1 text-xs truncate font-mono text-gray-600 dark:text-gray-300" data-testid="text-guest-token-mobile">
                    {guestToken}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyToken}
                    className="text-gray-500"
                    data-testid="button-copy-token-mobile"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => window.location.href = "/"}
                  size="sm"
                  className="w-full max-w-sm bg-gray-900 hover:bg-gray-800 text-white font-medium dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  data-testid="button-continue-guest-mobile"
                >
                  Continue to Arena
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Auth Section - Borderless Typographic */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-12 max-w-2xl mx-auto mb-8 pl-6">
          <div>
            <h3 className="font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-3 text-[15px]" data-testid="text-try-guest-title">
              Try as Guest
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              No sign-up required. Get a secure token and buy credits anonymously.
            </p>
            {!guestToken ? (
              <button 
                onClick={handleCreateGuestToken}
                disabled={isCreatingToken}
                className="w-full h-10 text-sm font-medium rounded-md bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors"
                data-testid="button-create-guest-token"
              >
                {isCreatingToken ? "Creating..." : "Create Guest Token"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs break-all font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded" data-testid="text-guest-token">
                    {guestToken}
                  </code>
                  <button
                    onClick={handleCopyToken}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    data-testid="button-copy-token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => window.location.href = "/"}
                  className="w-full h-10 text-sm font-medium rounded-md bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors"
                  data-testid="button-continue-guest"
                >
                  Continue to Arena
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-3 text-[15px]" data-testid="text-sign-in-title">
              Sign In
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Preserve your credits across devices with Google, Apple, GitHub, or email.
            </p>
            <button 
              onClick={handleSignIn}
              className="w-full h-10 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
              data-testid="button-sign-in"
            >
              Sign In / Create Account
            </button>
          </div>
        </div>

        {/* Mobile Feature List - 4 Items with Progressive Disclosure */}
        <div className="my-8 md:hidden flex flex-col max-w-2xl mx-auto px-4">
          {/* 1. Compare Models */}
          <div 
            className="group relative pl-6 py-4 border-b border-black/5 dark:border-white/5"
            data-testid="feature-list-compare"
          >
            <Zap className="absolute left-0 top-[18px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-sky-500 transition-colors duration-300 ease-out">Compare Models</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Run GPT-4o, Claude, Gemini, and Grok side by side.</p>
          </div>

          {/* 2. Battle Modes - Interactive */}
          <button 
            onClick={() => setIsBattleModesOpen(true)}
            className="group relative pl-6 py-4 border-b border-black/5 dark:border-white/5 text-left w-full flex items-center justify-between"
            data-testid="feature-list-battle-modes"
          >
            <div className="flex-1">
              <Layers className="absolute left-0 top-[18px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors duration-300 ease-out">Battle Modes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Advanced configuration. Configure Blind Mode, Caesar, and Maximus.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors shrink-0 ml-4" />
          </button>

          {/* 3. Pay As You Go */}
          <div 
            className="group relative pl-6 py-4 border-b border-black/5 dark:border-white/5"
            data-testid="feature-list-paygo"
          >
            <Sparkles className="absolute left-0 top-[18px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors duration-300 ease-out">Pay As You Go</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">No subscriptions. Credits starting at $3.00. They never expire.</p>
          </div>

          {/* 4. True Privacy */}
          <div 
            className="group relative pl-6 py-4"
            data-testid="feature-list-privacy"
          >
            <Shield className="absolute left-0 top-[18px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors duration-300 ease-out">True Privacy</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Zero logs. Data vanishes from RAM instantly when session ends.</p>
          </div>
        </div>

        {/* Desktop Feature List - 4 Items with Progressive Disclosure */}
        <div className="hidden md:flex flex-col max-w-2xl mx-auto pl-6">
          {/* 1. Compare Models */}
          <div 
            className="group relative pl-6 py-4 border-b border-black/5 dark:border-white/5"
            data-testid="feature-tile-compare"
          >
            <Zap className="absolute left-0 top-[18px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
            <h3 className="font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-sky-500 transition-colors duration-300 ease-out text-[13px]">Compare Models</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Run GPT-4o, Claude, Gemini, and Grok side by side.</p>
          </div>

          {/* 2. Battle Modes - Interactive */}
          <button 
            onClick={() => setIsBattleModesOpen(true)}
            className="group relative pl-6 py-4 border-b border-black/5 dark:border-white/5 text-left w-full flex items-center justify-between cursor-pointer"
            data-testid="feature-tile-battle-modes"
          >
            <div className="flex-1">
              <Layers className="absolute left-0 top-[18px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
              <h3 className="font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors duration-300 ease-out text-[13px]">Battle Modes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Advanced configuration. Configure Blind Mode, Caesar, and Maximus.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors shrink-0 ml-4" />
          </button>

          {/* 3. Pay As You Go */}
          <div 
            className="group relative pl-6 py-4 border-b border-black/5 dark:border-white/5"
            data-testid="feature-tile-paygo"
          >
            <Sparkles className="absolute left-0 top-[18px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
            <h3 className="font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors duration-300 ease-out text-[13px]">Pay As You Go</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">No subscriptions. Credits starting at $3.00. They never expire.</p>
          </div>

          {/* 4. True Privacy */}
          <div 
            className="group relative pl-6 py-4"
            data-testid="feature-tile-privacy"
          >
            <Shield className="absolute left-0 top-[18px] w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
            <h3 className="font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors duration-300 ease-out text-[13px]">True Privacy</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Zero logs. Data vanishes from RAM instantly when session ends.</p>
          </div>
        </div>
      </div>
      {/* Mobile Bottom Sheet */}
      {isBattleModesOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsBattleModesOpen(false)}
            data-testid="battle-modes-overlay-mobile"
          />
          <div 
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-6 animate-in slide-in-from-bottom duration-300"
            data-testid="battle-modes-sheet-mobile"
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white">Battle Modes</h2>
              <button 
                onClick={() => setIsBattleModesOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                data-testid="button-close-battle-modes-mobile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <BattleModesContent />
          </div>
        </>
      )}
      {/* Desktop Glass Modal */}
      {isBattleModesOpen && (
        <>
          <div 
            className="hidden md:block fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsBattleModesOpen(false)}
            data-testid="battle-modes-overlay-desktop"
          />
          <div 
            className="hidden md:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl z-50 p-8 w-full max-w-md shadow-2xl border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-200"
            data-testid="battle-modes-modal-desktop"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white">Battle Modes</h2>
              <button 
                onClick={() => setIsBattleModesOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                data-testid="button-close-battle-modes-desktop"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <BattleModesContent />
          </div>
        </>
      )}
      <footer className="mt-auto py-6 md:py-8 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">v 1.0</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This Whole World LLC — December 2025</p>
      </footer>
    </div>
  );
}
