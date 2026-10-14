import { featuredOrder, padById, type Roast } from "./pads";
export type View = "featured" | "all" | "community" | "saved";
export type Sort = "featured" | "votes" | "az" | "newest";
export function selectRoasts(roasts: Roast[], options: { view: View; query: string; genre: string; selected: string; saved: Set<string>; counts: Record<string, number>; sort: Sort }) {
  const query = options.query.trim().toLowerCase();
  const filtered = roasts.filter(roast => {
    const pad = padById.get(roast.padId);
    if (!pad) return false;
    if (options.selected && pad.id !== options.selected) return false;
    if (options.genre !== "all" && options.genre !== pad.genre) return false;
    if (query && !`${pad.name} ${pad.title || ""} ${roast.punchline}`.toLowerCase().includes(query)) return false;
    if (options.view === "featured" && !query && (!roast.editorial || !pad.featured)) return false;
    if (options.view === "community" && roast.editorial) return false;
    if (options.view === "saved" && !options.saved.has(roast.id)) return false;
    return true;
  });
  return filtered.sort((a, b) => {
    if (options.sort === "votes") return (options.counts[b.id] || 0) - (options.counts[a.id] || 0) || b.createdAt - a.createdAt;
    if (options.sort === "az") return padById.get(a.padId)!.name.localeCompare(padById.get(b.padId)!.name) || b.createdAt - a.createdAt;
    if (options.sort === "newest") return b.createdAt - a.createdAt;
    const rank = (r: Roast) => { const i = featuredOrder.indexOf(r.padId); return r.editorial && i >= 0 ? i : 100; };
    return rank(a) - rank(b) || b.createdAt - a.createdAt;
  });
}
