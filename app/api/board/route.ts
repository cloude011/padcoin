import { getDatabase } from "../../../db";
import { actorFor } from "../../../lib/validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const actor = actorFor(request);
    const [roasts, totals, voted] = await db.batch([
      "SELECT id, pad_id AS padId, punchline, author, created_at AS createdAt FROM roasts ORDER BY created_at DESC LIMIT 200",
      "SELECT roast_id AS id, COUNT(*) AS count FROM votes GROUP BY roast_id",
      { sql: "SELECT roast_id AS id FROM votes WHERE actor = ?", args: [actor] },
    ], "read");
    return Response.json({ roasts: roasts.rows, counts: Object.fromEntries(totals.rows.map(row => [row.id, Number(row.count)])), voted: voted.rows.map(row => row.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Board read failed", error);
    return Response.json({ error: "The board couldn't sync. Try again in a moment." }, { status: 503 });
  }
}
