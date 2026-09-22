import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { Profile } from "next-auth";
import { storage } from "@/lib/storage";

/**
 * Auth.js (NextAuth v5) — Google + GitHub, JWT sessions.
 *
 * Required env (do not commit values):
 * - AUTH_SECRET          encrypts the session JWT. `openssl rand -base64 32`
 * - AUTH_GOOGLE_ID       Google OAuth client id
 * - AUTH_GOOGLE_SECRET   Google OAuth client secret
 * - AUTH_GITHUB_ID       GitHub OAuth client id
 * - AUTH_GITHUB_SECRET   GitHub OAuth client secret
 *
 * Optional:
 * - AUTH_URL             canonical origin, no path (e.g. https://llmarena-rafa1l.vercel.app).
 *                        Auth.js v5 also reads NEXTAUTH_URL if AUTH_URL is unset.
 *                        On Vercel, trustHost is inferred from the VERCEL env var, so
 *                        callbacks follow the request host when AUTH_URL is omitted.
 *
 * Callbacks (register each origin you sign in from):
 * - /api/auth/callback/google
 * - /api/auth/callback/github
 *
 * The users table has no provider-account columns. Google `sub` and GitHub account
 * id are stored on the encrypted JWT (`provider`, `providerAccountId`). The users
 * row is keyed by email, so the same email from either provider maps to one row.
 * New accounts start at 0 credits, matching new guest tokens.
 */
function splitName(name?: string | null): { firstName: string | null; lastName: string | null } {
  const trimmed = name?.trim();
  if (!trimmed) return { firstName: null, lastName: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function profileEmail(email?: string | null, profile?: Profile): string | null {
  const fromProfile = typeof profile?.email === "string" ? profile.email : null;
  const value = (email || fromProfile || "").trim().toLowerCase();
  return value || null;
}

function profileNames(provider: string | undefined, profile: Profile | undefined, fallbackName?: string | null) {
  if (provider === "google" && profile) {
    const given = typeof profile.given_name === "string" ? profile.given_name : null;
    const family = typeof profile.family_name === "string" ? profile.family_name : null;
    if (given || family) return { firstName: given, lastName: family };
  }
  return splitName(fallbackName || (typeof profile?.name === "string" ? profile.name : null));
}

function profileImage(image?: string | null, profile?: Profile): string | null {
  if (image) return image;
  if (typeof profile?.picture === "string") return profile.picture;
  if (typeof profile?.avatar_url === "string") return profile.avatar_url;
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google, GitHub],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = profileEmail(user.email, profile);
      if (!email) return false;
      if (account?.provider === "google" && profile?.email_verified === false) return false;
      return true;
    },
    async jwt({ token, user, account, profile, trigger }) {
      if (trigger !== "signIn" && trigger !== "signUp") return token;
      if (!account) return token;

      const email = profileEmail(user?.email ?? token.email, profile);
      if (!email) return token;

      const names = profileNames(account.provider, profile, user?.name ?? token.name);
      const dbUser = await storage.upsertOAuthUser({
        email,
        firstName: names.firstName,
        lastName: names.lastName,
        profileImageUrl: profileImage(user?.image ?? token.picture, profile),
      });

      token.sub = dbUser.id;
      token.userId = dbUser.id;
      token.email = dbUser.email;
      token.name = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || token.name;
      token.picture = dbUser.profileImageUrl;
      token.provider = account.provider;
      token.providerAccountId = account.providerAccountId;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
