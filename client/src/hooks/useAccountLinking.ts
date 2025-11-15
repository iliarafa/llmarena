import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useAccountLinking() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const linkAccount = async () => {
      // Only run if user just authenticated
      if (!isAuthenticated) return;

      // Check if there's a guest token to link
      const guestToken = localStorage.getItem("guestToken");
      if (!guestToken) return;

      // Check if we've already tried linking this token
      const linkedKey = `linked_${guestToken}`;
      if (localStorage.getItem(linkedKey)) return;

      try {
        const res = await apiRequest("POST", "/api/link-guest-account", {
          guestToken,
        });

        // Check for HTTP errors
        if (!res.ok) {
          throw new Error(`Linking failed with status ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          // Mark this token as linked so we don't try again
          localStorage.setItem(linkedKey, "true");
          
          // Clear the guest token
          localStorage.removeItem("guestToken");

          // Invalidate queries to refresh user data
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

          // Show success message
          toast({
            title: "Account Linked!",
            description: `Successfully transferred ${data.creditsTransferred} credits to your account.`,
          });
        }
      } catch (error) {
        console.error("Account linking error:", error);
        // Clear the guest token on error to prevent repeated attempts
        localStorage.removeItem("guestToken");
        // Mark as attempted to prevent infinite loops
        localStorage.setItem(linkedKey, "attempted");
      }
    };

    linkAccount();
  }, [isAuthenticated, toast]);
}
