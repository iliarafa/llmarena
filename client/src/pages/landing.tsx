import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Sparkles, Zap, Shield, Check, Gavel, Eye } from "lucide-react";
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
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h1 
            className="text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-3" 
            data-testid="text-landing-title"
          >
            LLM Arena
          </h1>
          <p className="text-sm font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Frontier Models Parallel Generations
          </p>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide">
            Anthropic / Google / OpenAI / xAI
          </p>
          
          <div className="flex justify-center mt-10 mb-10">
            <img 
              src={llmFightImage} 
              alt="AI models competing" 
              className="w-64 h-auto opacity-90 drop-shadow-lg"
            />
          </div>
          
          <div className="flex justify-center mb-8">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" 
              data-testid="privacy-guarantee-badge"
            >
              <Shield className="w-4 h-4 text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
              <span 
                className="text-xs font-semibold text-gray-700 dark:text-gray-200 tracking-tight" 
                data-testid="text-privacy-guarantee"
              >
                Your prompts and responses are never stored or logged
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Zap className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Compare 4 Models</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              See responses from GPT-4o, Claude Sonnet, Gemini Flash, and Grok side-by-side
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Sparkles className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Pay As You Go</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Buy credits when you need them. No monthly subscription or commitments.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Shield className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">True Privacy</h3>
            </div>
            <div className="space-y-2">
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

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Gavel className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Caesar Judge</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Let an AI arbiter analyze and score responses across accuracy, clarity, creativity, and safety.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Eye className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Blind Mode</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Evaluate responses without bias. Model names are hidden until you vote or reveal results.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" data-testid="text-try-guest-title">
                Try as Guest
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" data-testid="text-sign-in-title">
                Sign In
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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

        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">v 1.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This Whole World LLC — November 2025</p>
        </footer>
      </div>
    </div>
  );
}
