import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
}

const creditTiers: CreditTier[] = [
  {
    credits: 20,
    price: 3.00,
    name: "Starter",
  },
  {
    credits: 100,
    price: 10.00,
    name: "Popular",
    savings: "Save 33%",
    popular: true,
  },
  {
    credits: 500,
    price: 25.00,
    name: "Pro",
    savings: "Save 67%",
  },
  {
    credits: 1000,
    price: 50.00,
    name: "Ultimate",
    savings: "Save 67%",
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Purchase Credits</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Choose Your Credit Pack
          </h2>
        </div>

        <div className="flex items-center justify-center gap-6 text-gray-500 dark:text-gray-400 text-sm font-medium mb-10">
          <span>Credits never expire</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>Access all models</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>Instant delivery</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {creditTiers.map((tier) => (
            <div
              key={tier.credits}
              className={`bg-white dark:bg-gray-900 rounded-xl p-6 flex flex-col justify-between transition-all ${
                tier.popular 
                  ? "ring-2 ring-black dark:ring-white border-transparent relative" 
                  : "border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
              }`}
              data-testid={`credit-tier-${tier.credits}`}
            >
              {tier.popular && (
                <div className="text-xs font-bold uppercase tracking-widest text-center text-black dark:text-white mb-4">
                  Most Popular
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{tier.name}</span>
                  {tier.savings && (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {tier.savings}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="font-mono text-4xl font-bold tracking-tighter text-gray-900 dark:text-gray-100">
                    ${tier.price.toFixed(2)}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                    {tier.credits} credits
                  </div>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-4">
                  ${(tier.price / tier.credits).toFixed(3)}/credit
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handlePurchase(tier.credits)}
                  disabled={purchasingCredits !== null}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    tier.popular
                      ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                      : "border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  data-testid={`button-purchase-${tier.credits}`}
                >
                  {purchasingCredits === tier.credits ? "Processing..." : `Buy ${tier.credits} Credits`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-500">
          Secure payment powered by Stripe. All prices in USD.
        </div>
      </main>
    </div>
  );
}
