import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Coins, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CreditTier {
  credits: number;
  price: number;
  name: string;
  savings?: string;
  popular?: boolean;
  comparisons: string;
}

const creditTiers: CreditTier[] = [
  {
    credits: 20,
    price: 2.50,
    name: "Starter",
    comparisons: "2-6 comparisons",
  },
  {
    credits: 100,
    price: 10.00,
    name: "Popular",
    savings: "Save 20%",
    popular: true,
    comparisons: "10-33 comparisons",
  },
  {
    credits: 500,
    price: 40.00,
    name: "Pro",
    savings: "Save 36%",
    comparisons: "50-166 comparisons",
  },
  {
    credits: 1000,
    price: 70.00,
    name: "Ultimate",
    savings: "Save 44%",
    comparisons: "100-333 comparisons",
  },
];

export default function Purchase() {
  const [purchasingCredits, setPurchasingCredits] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handlePurchase = async (credits: number) => {
    setPurchasingCredits(credits);
    
    try {
      const res = await apiRequest("POST", "/api/create-checkout-session", { credits });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create checkout session");
      }
      
      const { url } = await res.json();
      
      if (!url) {
        throw new Error("No checkout URL returned");
      }
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setPurchasingCredits(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Purchase Credits</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Credit Pack</h2>
          <p className="text-muted-foreground text-lg">
            Pay only for what you use. Credits never expire.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creditTiers.map((tier) => (
            <Card
              key={tier.credits}
              className={tier.popular ? "border-primary shadow-lg relative" : "relative"}
              data-testid={`credit-tier-${tier.credits}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{tier.name}</span>
                  {tier.savings && (
                    <Badge variant="secondary" className="text-xs">
                      {tier.savings}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{tier.comparisons}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${tier.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <Coins className="w-4 h-4" />
                    <span className="font-medium">{tier.credits} credits</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${(tier.price / tier.credits).toFixed(3)} per credit
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Never expires</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>All 4 AI models</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Instant delivery</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(tier.credits)}
                  disabled={purchasingCredits !== null}
                  data-testid={`button-purchase-${tier.credits}`}
                >
                  {purchasingCredits === tier.credits ? "Processing..." : `Buy ${tier.credits} Credits`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Secure payment powered by Stripe. All prices in USD.</p>
        </div>
      </main>
    </div>
  );
}
