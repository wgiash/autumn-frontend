/* Lazy postgres.js singleton. One driver everywhere: the query layer, the
   seed and the verify scripts all speak SQL over DATABASE_URL (Supabase
   Postgres). `prepare: false` keeps the client compatible with pooled
   connections; the client is created on first use so importing this module
   never opens a socket. */
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

let client: Sql | undefined;

export function getSql(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = postgres(url, {
      prepare: false,
      ssl: "require",
      /* serverless-friendly: one connection per instance (Supabase's
         transaction pooler multiplexes behind it), released when idle */
      max: 1,
      idle_timeout: 20,
    });
  }
  return client;
}
