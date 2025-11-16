import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Sparkles, Zap, Shield } from "lucide-react";
import llmFightImage from "@assets/LLMfight_1763256370491.png";

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
      
      // Store token in localStorage for persistence
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-landing-title">
            LLM Arena
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Get responses from GPT-4o, Claude, Gemini, and Grok in one view
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            Pay-per-use with prepaid credits. No subscription required.
          </p>
          <div className="flex justify-center">
            <img 
              src={llmFightImage} 
              alt="AI models competing" 
              className="w-64 h-auto opacity-90"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover-elevate">
            <CardHeader>
              <Zap className="w-8 h-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Compare 4 Models</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See responses from GPT-4o, Claude Sonnet, Gemini Flash, and Grok side-by-side
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <Sparkles className="w-8 h-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Pay As You Go</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Buy credits when you need them. No monthly subscription or commitments.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <Shield className="w-8 h-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Privacy First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use as a guest with just a token, or create an account to preserve your credits
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle data-testid="text-try-guest-title">Try as Guest</CardTitle>
              <CardDescription className="min-h-[48px]">
                No sign-up required. Get a secure token and buy credits anonymously.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end space-y-4">
              {!guestToken ? (
                <Button 
                  onClick={handleCreateGuestToken}
                  disabled={isCreatingToken}
                  className="w-full"
                  size="lg"
                  data-testid="button-create-guest-token"
                >
                  {isCreatingToken ? "Creating..." : "Create Guest Token"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-2">Your Guest Token:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs break-all font-mono" data-testid="text-guest-token">
                        {guestToken}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyToken}
                        data-testid="button-copy-token"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Save this token! You'll need it to access your credits. It's stored in your browser, but we recommend saving it somewhere safe.
                  </p>
                  <Button
                    onClick={() => window.location.href = "/"}
                    className="w-full"
                    data-testid="button-continue-guest"
                  >
                    Continue as Guest
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle data-testid="text-sign-in-title">Sign In</CardTitle>
              <CardDescription className="min-h-[48px]">
                Create an account with Google, Apple, GitHub, or email to preserve your credits across devices and sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <Button 
                onClick={handleSignIn}
                variant="default"
                className="w-full"
                size="lg"
                data-testid="button-sign-in"
              >
                Sign In / Create Account
              </Button>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>v 1.0</p>
          <p>This Whole World LLC - November 2025</p>
        </footer>
      </div>
    </div>
  );
}
