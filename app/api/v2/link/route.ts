import { auth } from "@/auth";
import { allowedReturn, linkWallet } from "@/lib/v2";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Sign-in bridge for iliasr.nyc/compare. The browser is sent here
 * (top-level navigation, so Auth.js cookies stay first-party on llmarena).
 * Not signed in -> Auth.js sign-in page, then back here. Signed in -> the
 * guest wallet is merged into the account wallet and the browser returns
 * to iliasr.nyc with the account wallet token in the URL fragment.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = allowedReturn(url.searchParams.get("return"));
  if (!back) return new Response("Return URL not allowed", { status: 400 });
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  if (!userId) {
    const signin = new URL("/api/auth/signin", url.origin);
    signin.searchParams.set("callbackUrl", url.toString());
    return Response.redirect(signin.toString(), 302);
  }
  const w = await linkWallet(url.searchParams.get("wallet"), userId);
  return Response.redirect(`${back.split("#")[0]}#wallet=${w.token}`, 302);
}
