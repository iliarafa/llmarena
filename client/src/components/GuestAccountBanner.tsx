import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface GuestAccountBannerProps {
  creditBalance: number;
}

export default function GuestAccountBanner({ creditBalance }: GuestAccountBannerProps) {
  if (creditBalance === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5" data-testid="guest-account-banner">
      <CardContent className="py-4">
        <div className="flex items-start gap-3 flex-wrap">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">
              Credits are tied to this browser
            </p>
            <p className="text-sm text-muted-foreground">
              You have {creditBalance.toFixed(0)} credits on your guest token. Save the token if you want to keep access after clearing site data. Signed-in accounts are not available yet.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
