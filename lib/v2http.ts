export function v2error(e: any): Response {
  if (e?.status === 401) return Response.json({ error: "Unknown wallet" }, { status: 401 });
  console.error("v2 error:", e);
  return Response.json({ error: "Server error" }, { status: 500 });
}
