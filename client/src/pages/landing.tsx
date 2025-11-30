import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Sparkles, Zap, Shield, Check, Crown, Eye, LucideIcon, Sword } from "lucide-react";
import { Link } from "wouter";
import llmFightImage from "@assets/Gemini_Generated_Image_d61xiad61xiad61x.png";

interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  extraContent?: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    id: "compare",
    icon: Zap,
    title: "Compare Models",
    description: "See responses from GPT-4o, Claude Sonnet, Gemini Flash, and Grok side-by-side. Compare how different AI models approach the same prompt and find the best response for your needs.",
  },
  {
    id: "paygo",
    icon: Sparkles,
    title: "Pay As You Go",
    description: "Buy credits when you need them. No monthly subscription or commitments. Start with as few as 50 credits and top up anytime.",
  },
  {
    id: "privacy",
    icon: Shield,
    title: "True Privacy",
    description: "Your data stays yours. We never store your prompts, never log your responses, and never collect personal information. Complete anonymity guaranteed.",
    extraContent: (
      <div className="space-y-2 mt-4">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" strokeWidth={2.5} />
          <p className="text-sm text-gray-600 dark:text-gray-400">Zero data collection</p>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" strokeWidth={2.5} />
          <p className="text-sm text-gray-600 dark:text-gray-400">Prompts never stored</p>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" strokeWidth={2.5} />
          <p className="text-sm text-gray-600 dark:text-gray-400">Complete anonymity</p>
        </div>
      </div>
    ),
  },
  {
    id: "caesar",
    icon: Crown,
    title: "Caesar",
    description: "Let an AI arbiter analyze and score responses across accuracy, clarity, creativity, and safety. Get an unbiased verdict on which model performed best for your specific prompt.",
  },
  {
    id: "blind",
    icon: Eye,
    title: "Blind Mode",
    description: "Evaluate responses without bias. Model names are hidden until you vote or reveal results. Make your choice based purely on quality, not brand recognition.",
  },
  {
    id: "maximus",
    icon: Sword,
    title: "Maximus",
    description: "The ultimate synthesizer. Distills the best insights from all 4 models into one perfect response.",
  },
];

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
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

        {/* Mobile Feature List - Static vertical stack */}
        <div className="my-8 md:hidden flex flex-col gap-3">
          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-row items-start gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            data-testid="feature-list-compare"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0">
              <Zap className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Compare Models</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">Run 4 frontier models side-by-side (GPT-4o, Claude, Gemini, Grok) to find the best answer.</p>
            </div>
          </div>

          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-row items-start gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            data-testid="feature-list-paygo"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Pay As You Go</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">No subscriptions. Buy credits starting at $2.50. Credits never expire.</p>
            </div>
          </div>

          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-row items-start gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            data-testid="feature-list-privacy"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0">
              <Shield className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">True Privacy</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">Zero data logging. Your prompts and responses vanish from RAM instantly when the session ends.</p>
            </div>
          </div>

          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-row items-start gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            data-testid="feature-list-blind"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0">
              <Eye className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Blind Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">True unbiased evaluation. Model identities are hidden and scrambled using Fisher-Yates shuffling.</p>
            </div>
          </div>

          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-row items-start gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            data-testid="feature-list-caesar"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0">
              <Crown className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Caesar</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">AI Arbiter. Delivers objective verdicts and identifies factual divergences with Hallucination Alerts.</p>
            </div>
          </div>

          <div 
            className="bg-white dark:bg-gray-900 border border-gray-900 dark:border-gray-100 rounded-xl p-4 flex flex-row items-start gap-4 hover:border-gray-700 dark:hover:border-gray-300 transition-colors"
            data-testid="feature-list-maximus"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0">
              <Sword className="w-5 h-5 text-gray-900 dark:text-gray-100" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Maximus</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">Synthesizes the best insights from all 4 models into one perfect response.</p>
            </div>
          </div>
        </div>

        {/* Desktop Feature Grid */}
        <div className="hidden md:block space-y-5">
          {/* Row 1: Compare Models | Pay As You Go */}
          <div className="grid grid-cols-2 gap-5">
            <div 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
              data-testid="feature-tile-compare"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Zap className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Compare Models</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                See responses from GPT-4o, Claude Sonnet, Gemini Flash, and Grok side-by-side
              </p>
            </div>

            <div 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
              data-testid="feature-tile-paygo"
            >
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
          </div>

          {/* Row 2: True Privacy | Blind Mode */}
          <div className="grid grid-cols-2 gap-5">
            <div 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
              data-testid="feature-tile-privacy"
            >
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

            <div 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
              data-testid="feature-tile-blind"
            >
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

          {/* Row 3: Caesar | Maximus */}
          <div className="grid grid-cols-2 gap-5">
            <div 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
              data-testid="feature-tile-caesar"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Crown className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Caesar</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Let an AI arbiter analyze and score responses across accuracy, clarity, creativity, and safety.
              </p>
            </div>

            <div 
              className="bg-white dark:bg-gray-900 border border-gray-900 dark:border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-700 dark:hover:border-gray-300 transition-all duration-200"
              data-testid="feature-tile-maximus"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Sword className="w-5 h-5 text-gray-900 dark:text-gray-100" strokeWidth={2} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Maximus</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                The ultimate synthesizer. Distills the best insights from all 4 models into one perfect response.
              </p>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-auto py-6 md:py-8 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">v 1.0</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This Whole World LLC — November 2025</p>
      </footer>
    </div>
  );
}
