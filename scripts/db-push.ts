/* Applies supabase/schema.sql to DATABASE_URL. Re-runnable: the schema file
   drops each object before creating it. Run with
   `npm run db:push` (node --env-file=.env.local + tsx). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { assertDemoReset } from "./demo-safety";

async function main() {
  assertDemoReset();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (use --env-file=.env.local)");
  const sql = postgres(url, { prepare: false, ssl: "require", max: 1, onnotice: () => {} });
  const ddl = readFileSync(join(import.meta.dirname, "..", "supabase", "schema.sql"), "utf8");
  try {
    await sql.begin(async (transaction) => {
      await transaction.unsafe(ddl);
    });
    console.log("schema applied");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
