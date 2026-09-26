"use server";

import { signIn } from "@/auth";

/**
 * Starts Google/GitHub OAuth from a Server Action.
 * Auth.js skips its double-submit CSRF check here because the action POST is
 * already same-origin. The client `signIn()` path POSTs `/api/auth/signin/*`
 * and fails with MissingCSRF when `__Host-authjs.csrf-token` is not accepted.
 */
export async function signInWithProvider(provider: "google" | "github"): Promise<string> {
  const url = await signIn(provider, { redirectTo: "/", redirect: false });
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("Could not start sign in");
  }
  return url;
}
