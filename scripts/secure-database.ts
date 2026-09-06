import { readFileSync } from "node:fs";
import { getSql } from "../src/lib/db";

async function main() {
  const sql = getSql();
  try {
    const migration = readFileSync(
      new URL("../supabase/migrations/202609060001_restrict_client_access.sql", import.meta.url),
      "utf8",
    );
    await sql.begin(async (transaction) => {
      await transaction.unsafe(migration);
    });
    console.log("Client access restricted. Existing records preserved.");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
