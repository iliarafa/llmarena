export async function GET() {
  return Response.json({
    error: "Gone",
    message: "Replit Auth has been removed. Clear your guest token in the browser to sign out.",
  }, { status: 410 });
}
