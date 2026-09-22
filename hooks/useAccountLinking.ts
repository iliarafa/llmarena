"use client";

import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useAccountLinking() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const linkAccount = async () => {
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

        if (!res.ok) {
          // Drop invalid or already-claimed tokens. Transient failures leave the
          // token in place so the next visit can retry.
          if (res.status === 400 || res.status === 409) {
            localStorage.setItem(linkedKey, "attempted");
            localStorage.removeItem("guestToken");
          }
          return;
        }

        const data = await res.json();

        if (data.success) {
          localStorage.setItem(linkedKey, "true");
          localStorage.removeItem("guestToken");
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

          if (data.creditsTransferred > 0) {
            toast({
              title: "Account Linked!",
              description: `Successfully transferred ${data.creditsTransferred} credits to your account.`,
            });
          }
        }
      } catch (error) {
        console.error("Account linking error:", error);
      }
    };

    linkAccount();
  }, [isAuthenticated, toast]);
}
