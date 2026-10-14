import { getDatabase } from "../../../db";
import { editorialRoasts } from "../../../lib/pads";
import { actorFor, isSameOrigin } from "../../../lib/validation";
const editorialIds = new Set(editorialRoasts.map(roast => roast.id));
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Please vote from PADCOIN." }, { status: 403 });
  let actor: string, id: string, active: boolean;
  try {
    const body = await request.json() as { id?: unknown; active?: unknown };
    if (typeof body.id !== "string" || body.id.length > 100 || typeof body.active !== "boolean") throw new Error("Pick a roast first.");
    id = body.id; active = body.active; actor = actorFor(request);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Try that vote again." }, { status: 400 });
  }
  try {
    const db = await getDatabase();
    if (!editorialIds.has(id) && !(await db.execute({ sql: "SELECT id FROM roasts WHERE id = ?", args: [id] })).rows.length) return Response.json({ error: "That roast isn't on the board." }, { status: 404 });
    const mutation = active
      ? { sql: "INSERT OR IGNORE INTO votes (roast_id, actor, created_at) VALUES (?, ?, ?)", args: [id, actor, Date.now()] }
      : { sql: "DELETE FROM votes WHERE roast_id = ? AND actor = ?", args: [id, actor] };
    const results = await db.batch([mutation, { sql: "SELECT COUNT(*) AS count FROM votes WHERE roast_id = ?", args: [id] }], "write");
    return Response.json({ id, active, count: Number(results[1].rows[0]?.count ?? 0) });
  } catch (error) {
    console.error("Vote failed", error);
    return Response.json({ error: "That vote didn't land. Try again." }, { status: 503 });
  }
}
