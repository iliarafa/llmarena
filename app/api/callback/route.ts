export async function GET() {
  return Response.json({
    error: "Gone",
    message: "Replit Auth has been removed. Create a guest token to use the app.",
  }, { status: 410 });
}
