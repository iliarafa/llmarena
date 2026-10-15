import { clientIp, createWallet, requireWallet, walletRateLimited } from "@/lib/v2";
import { v2error } from "@/lib/v2http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: new guest wallet. GET: balance for Bearer wallet token. */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (await walletRateLimited(ip)) return Response.json({ error: "Too many new wallets. Try again in a bit." }, { status: 429 });
    const w = await createWallet(null, ip);
    return Response.json({ wallet: w.token, tokens: w.tokens, signedIn: false });
  } catch (e) { return v2error(e); }
}
export async function GET(request: Request) {
  try {
    const w = await requireWallet(request);
    return Response.json({ wallet: w.token, tokens: w.tokens, signedIn: !!w.user_id });
  } catch (e) { return v2error(e); }
}
