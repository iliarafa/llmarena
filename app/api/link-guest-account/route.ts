export async function POST() {
  return Response.json({
    error: "Gone",
    message: "Account linking is unavailable. Replit Auth has been removed; guest tokens are the primary path.",
  }, { status: 410 });
}
