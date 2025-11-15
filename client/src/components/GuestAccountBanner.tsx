import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface GuestAccountBannerProps {
  creditBalance: number;
}

export default function GuestAccountBanner({ creditBalance }: GuestAccountBannerProps) {
  if (creditBalance === 0) {
    return null;
  }

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <Card className="border-primary/20 bg-primary/5" data-testid="guest-account-banner">
      <CardContent className="py-4">
        <div className="flex items-start gap-3 flex-wrap">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">
              Save your credits across devices
            </p>
            <p className="text-sm text-muted-foreground">
              You have {creditBalance.toFixed(0)} credits. Create a free account to preserve your credits and access them from any device.
            </p>
          </div>
          <Button onClick={handleSignIn} size="sm" data-testid="button-create-account">
            Create Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
