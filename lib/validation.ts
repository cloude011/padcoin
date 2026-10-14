import { padById } from "./pads";
export function validateRoast(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Give us a launchpad and a punchline.");
  const data = value as Record<string, unknown>;
  if (typeof data.padId !== "string" || !padById.has(data.padId)) throw new Error("Pick a launchpad from the roster.");
  if (typeof data.punchline !== "string") throw new Error("Your punchline is missing.");
  const punchline = data.punchline.trim().replace(/\s+/g, " ");
  if (punchline.length < 10 || punchline.length > 180) throw new Error("Keep your punchline between 10 and 180 characters.");
  if (data.author !== undefined && typeof data.author !== "string") throw new Error("Use a short name or leave it blank.");
  const author = (typeof data.author === "string" ? data.author.trim().replace(/^@/, "") : "") || "anon";
  if (author.length > 24 || !/^[a-zA-Z0-9_. -]+$/.test(author)) throw new Error("Use up to 24 letters, numbers, spaces, dots or underscores for your name.");
  return { padId: data.padId, punchline, author };
}
export function actorFor(request: Request) {
  const session = request.headers.get("x-padcoin-session");
  if (!session || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(session)) throw new Error("Refresh the page and try again.");
  return `browser:${session}`;
}
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
