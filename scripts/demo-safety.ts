export function assertDemoReset(
  env: NodeJS.ProcessEnv = process.env,
  args: readonly string[] = process.argv.slice(2),
) {
  if (env.NODE_ENV === "production") {
    throw new Error("Demo resets are forbidden in production.");
  }
  const project = env.AUTUMN_DEMO_PROJECT_REF;
  if (!project || !args.includes("--confirm-demo-reset")) {
    throw new Error(
      "Destructive demo reset refused. Set AUTUMN_DEMO_PROJECT_REF and pass --confirm-demo-reset.",
    );
  }
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const url = new URL(env.DATABASE_URL);
  const isDirect = url.hostname === `db.${project}.supabase.co`;
  const isPooler = url.hostname.endsWith(".pooler.supabase.com") &&
    decodeURIComponent(url.username).endsWith(`.${project}`);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || (!isDirect && !isPooler)) {
    throw new Error("DATABASE_URL does not match the explicitly designated demo project.");
  }
}
