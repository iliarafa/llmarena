import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Sparkles, Zap, Shield, Check, Crown, Eye } from "lucide-react";
import llmFightImage from "@assets/LLMfight_1763256670295.png";

export default function Landing() {
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16 pb-24 md:pb-16">
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
              className="w-40 md:w-64 h-auto opacity-90 drop-shadow-lg"
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
        </div>

        <div className="hidden md:grid md:grid-cols-2 md:gap-5 mb-6 md:mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 md:p-6 shadow-sm flex flex-col">
            <div className="mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1" data-testid="text-try-guest-title">
                Try as Guest
              </h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                No sign-up required. Get a secure token and buy credits anonymously.
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              {!guestToken ? (
                <Button 
                  onClick={handleCreateGuestToken}
                  disabled={isCreatingToken}
                  className="w-full font-medium bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  size="lg"
                  data-testid="button-create-guest-token"
                >
                  {isCreatingToken ? "Creating..." : "Create Guest Token"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Your Guest Token:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs break-all font-mono text-gray-700 dark:text-gray-300" data-testid="text-guest-token">
                        {guestToken}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyToken}
                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        data-testid="button-copy-token"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Guest token auto-saves in your browser for sign-up-free access.
                  </p>
                  <Button
                    onClick={() => window.location.href = "/"}
                    className="w-full font-medium bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    data-testid="button-continue-guest"
                  >
                    Continue to Arena
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 md:p-6 shadow-sm flex flex-col">
            <div className="mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1" data-testid="text-sign-in-title">
                Sign In
              </h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                Create an account with Google, Apple, GitHub, or email to preserve your credits across devices.
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <Button 
                onClick={handleSignIn}
                className="w-full font-medium bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                size="lg"
                data-testid="button-sign-in"
              >
                Sign In / Create Account
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 mb-3 md:mb-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-2 md:gap-3 md:mb-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Compare 4 Models</h3>
            </div>
            <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              See responses from GPT-4o, Claude Sonnet, Gemini Flash, and Grok side-by-side
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-2 md:gap-3 md:mb-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Pay As You Go</h3>
            </div>
            <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Buy credits when you need them. No monthly subscription or commitments.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 md:gap-3 md:mb-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">True Privacy</h3>
            </div>
            <div className="hidden md:block space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" strokeWidth={2.5} />
                <p className="text-sm text-gray-500 dark:text-gray-400">Zero data collection</p>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" strokeWidth={2.5} />
                <p className="text-sm text-gray-500 dark:text-gray-400">Prompts never stored</p>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" strokeWidth={2.5} />
                <p className="text-sm text-gray-500 dark:text-gray-400">Complete anonymity</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-2 md:gap-3 md:mb-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Crown className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Caesar</h3>
            </div>
            <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Let an AI arbiter analyze and score responses across accuracy, clarity, creativity, and safety.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-2 md:gap-3 md:mb-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Eye className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Blind Mode</h3>
            </div>
            <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Evaluate responses without bias. Model names are hidden until you vote or reveal results.
            </p>
          </div>
        </div>

        <footer className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">v 1.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This Whole World LLC — November 2025</p>
        </footer>
      </div>

      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-gray-950/85 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 safe-area-inset-bottom"
        data-testid="mobile-cta-dock"
      >
        {!guestToken ? (
          <div className="flex flex-row gap-3">
            <Button 
              onClick={handleCreateGuestToken}
              disabled={isCreatingToken}
              className="flex-1 h-10 font-medium bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              data-testid="button-create-guest-token-mobile"
            >
              {isCreatingToken ? "Creating..." : "Create Guest Token"}
            </Button>
            <Button 
              onClick={handleSignIn}
              variant="ghost"
              className="h-10 px-4 font-medium text-gray-600 dark:text-gray-400"
              data-testid="button-sign-in-mobile"
            >
              Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <code className="flex-1 text-xs truncate font-mono text-gray-600 dark:text-gray-300" data-testid="text-guest-token-mobile">
                {guestToken}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToken}
                className="h-7 px-2 text-gray-500"
                data-testid="button-copy-token-mobile"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button
              onClick={() => window.location.href = "/"}
              className="w-full h-10 font-medium bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              data-testid="button-continue-guest-mobile"
            >
              Continue to Arena
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
