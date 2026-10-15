import { createWallet, requireWallet } from "@/lib/v2";
import { v2error } from "@/lib/v2http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: new guest wallet. GET: balance for Bearer wallet token. */
export async function POST() {
  try {
    const w = await createWallet();
    return Response.json({ wallet: w.token, tokens: w.tokens, signedIn: false });
  } catch (e) { return v2error(e); }
}
export async function GET(request: Request) {
  try {
    const w = await requireWallet(request);
    return Response.json({ wallet: w.token, tokens: w.tokens, signedIn: !!w.user_id });
  } catch (e) { return v2error(e); }
}
