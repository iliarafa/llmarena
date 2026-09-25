"use client";

import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";

export function signInWith(provider: "google" | "github") {
  void signIn(provider, { redirectTo: "/" });
}

export function SignInButtons({
  className = "",
  testIdSuffix = "",
}: {
  className?: string;
  testIdSuffix?: string;
}) {
  const suffix = testIdSuffix ? `-${testIdSuffix}` : "";
  const buttonClass =
    "w-full h-10 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors inline-flex items-center justify-center gap-2";

  return (
    <div className={`grid grid-cols-2 gap-2 w-full max-w-sm ${className}`}>
      <button
        type="button"
        onClick={() => signInWith("google")}
        className={buttonClass}
        aria-label="Sign in with Google"
        data-testid={`button-signin-google${suffix}`}
      >
        <FaGoogle className="w-4 h-4" />
        <span><span className="hidden sm:inline">Sign in with </span>Google</span>
      </button>
      <button
        type="button"
        onClick={() => signInWith("github")}
        className={buttonClass}
        aria-label="Sign in with GitHub"
        data-testid={`button-signin-github${suffix}`}
      >
        <FaGithub className="w-4 h-4" />
        <span><span className="hidden sm:inline">Sign in with </span>GitHub</span>
      </button>
    </div>
  );
}
