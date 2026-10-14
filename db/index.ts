import { createClient, type Client } from "@libsql/client/web";

let client: Client | undefined;
let ready: Promise<unknown> | undefined;

const schema = [
  "CREATE TABLE IF NOT EXISTS roasts (id TEXT PRIMARY KEY NOT NULL, pad_id TEXT NOT NULL, punchline TEXT NOT NULL, author TEXT NOT NULL, actor TEXT NOT NULL, created_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS roasts_actor_created ON roasts (actor, created_at)",
  "CREATE TABLE IF NOT EXISTS votes (roast_id TEXT NOT NULL, actor TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (roast_id, actor))",
];

// Initialize only when an API request arrives; builds do not need credentials.
export async function getDatabase() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || (!url.startsWith("file:") && !authToken)) {
      throw new Error("Connect a Turso database to this Vercel project.");
    }
    if (process.env.VERCEL && url.startsWith("file:")) {
      throw new Error("Vercel requires a persistent remote database.");
    }
    client = createClient({ url, authToken });
  }
  if (!ready) {
    ready = client.batch(schema, "write").catch(error => {
      ready = undefined;
      throw error;
    });
  }
  await ready;
  return client;
}
