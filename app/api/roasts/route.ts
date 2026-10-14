import { getDatabase } from "../../../db";
import { actorFor, isSameOrigin, validateRoast } from "../../../lib/validation";
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Please submit from PADCOIN." }, { status: 403 });
  let actor: string, payload: ReturnType<typeof validateRoast>;
  try {
    if (Number(request.headers.get("content-length") || 0) > 4096) throw new Error("That's a little too much roast.");
    payload = validateRoast(await request.json()); actor = actorFor(request);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Check your punchline and try again." }, { status: 400 });
  }
  try {
    const db = await getDatabase();
    const recent = await db.execute({ sql: "SELECT COUNT(*) AS count FROM roasts WHERE actor = ? AND created_at > ?", args: [actor, Date.now() - 3600000] });
    if (Number(recent.rows[0]?.count) >= 6) return Response.json({ error: "Six roasts in an hour. Let the pads cool off before the next one." }, { status: 429 });
    const roast = { id: crypto.randomUUID(), ...payload, createdAt: Date.now() };
    await db.execute({ sql: "INSERT INTO roasts (id, pad_id, punchline, author, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)", args: [roast.id, roast.padId, roast.punchline, roast.author, actor, roast.createdAt] });
    return Response.json({ roast }, { status: 201 });
  } catch (error) {
    console.error("Roast submit failed", error);
    return Response.json({ error: "Couldn't save that roast. Your draft is still here; try again." }, { status: 503 });
  }
}
