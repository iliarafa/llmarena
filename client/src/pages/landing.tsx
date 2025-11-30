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

        {/* Auth Section - Borderless Typographic */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-12 max-w-2xl mx-auto mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white" data-testid="text-try-guest-title">
              Try as Guest
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
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
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white" data-testid="text-sign-in-title">
              Sign In
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
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

        {/* Mobile Feature List - Premium Borderless Typographic List */}
        <div className="my-8 md:hidden flex flex-col max-w-2xl mx-auto">
          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4"
            data-testid="feature-list-compare"
          >
            <Zap className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform">Compare Models</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">Run GPT-4o, Claude, Gemini and Grok side by side to find the best answer.</p>
            </div>
          </div>

          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4"
            data-testid="feature-list-paygo"
          >
            <Sparkles className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform">Pay As You Go</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">No subscriptions. Buy credits starting at $2.50. Credits never expire.</p>
            </div>
          </div>

          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4"
            data-testid="feature-list-privacy"
          >
            <Shield className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform">True Privacy</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">Your prompts and responses vanish from RAM instantly when the session ends.</p>
            </div>
          </div>

          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4"
            data-testid="feature-list-blind"
          >
            <Eye className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform">Blind Mode</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">Model identities are hidden and scrambled using Fisher-Yates shuffling.</p>
            </div>
          </div>

          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4"
            data-testid="feature-list-caesar"
          >
            <Crown className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform">Caesar</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">Delivers objective verdicts and identifies factual divergences with Hallucination Alerts.</p>
            </div>
          </div>

          <div 
            className="group py-6 flex flex-row items-start gap-4"
            data-testid="feature-list-maximus"
          >
            <Sword className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform">Maximus</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">Synthesizes the best insights from all 4 models into one perfect response.</p>
            </div>
          </div>
        </div>

        {/* Desktop Feature List - Premium Borderless Typographic List */}
        <div className="hidden md:flex flex-col max-w-2xl mx-auto">
          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4 pt-[12px] pb-[12px]"
            data-testid="feature-tile-compare"
          >
            <Zap className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform text-[14px]">Compare Models</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-[12px]">Run GPT-4o, Claude, Gemini and Grok side by side to find the best answer.</p>
            </div>
          </div>

          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4 pt-[12px] pb-[12px]"
            data-testid="feature-tile-paygo"
          >
            <Sparkles className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform text-[14px]">Pay As You Go</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-[12px]">No subscriptions. Buy credits starting at $3.00. Credits never expire.</p>
            </div>
          </div>

          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4 pt-[12px] pb-[12px]"
            data-testid="feature-tile-privacy"
          >
            <Shield className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform text-[14px]">True Privacy</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-[12px]">Your prompts and responses vanish from RAM instantly when the session ends.</p>
            </div>
          </div>

          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4 pt-[12px] pb-[12px]"
            data-testid="feature-tile-blind"
          >
            <Eye className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform text-[14px]">Blind Mode</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-[12px]">Model identities are hidden and scrambled using Fisher-Yates shuffling.</p>
            </div>
          </div>

          <div 
            className="group py-6 border-b border-gray-100 dark:border-gray-800 flex flex-row items-start gap-4 pt-[12px] pb-[12px]"
            data-testid="feature-tile-caesar"
          >
            <Crown className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform text-[14px]">Caesar</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">Delivers objective verdicts and identifies factual divergences with Hallucination Alerts.</p>
            </div>
          </div>

          <div 
            className="group py-6 flex flex-row items-start gap-4 pt-[12px] pb-[12px]"
            data-testid="feature-tile-maximus"
          >
            <Sword className="w-5 h-5 text-gray-900 dark:text-white shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="font-black tracking-tight text-gray-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform text-[14px] pt-[0px] pb-[0px]">Maximus</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">Synthesizes the best insights from all 4 models into one perfect response.</p>
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
