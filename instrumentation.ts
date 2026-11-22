// One-time maintenance for the approved Hostinger demo deployment.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.SINGLE_ACADEMY_HOST?.trim().toLowerCase() !== "romantic-purple-hyena-71.hostingersite.com") return;
  const { resetDemo } = await import("./scripts/reset-demo-once");
  await resetDemo();
}
