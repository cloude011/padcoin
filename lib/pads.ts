export type Genre = "Sequels" | "Name games" | "Launchpad lore";
export type Pad = {
  id: string; name: string; punchline: string; genre: Genre; color: string;
  sprite: [number, number]; asset?: string; featured?: boolean; title?: string; badge?: string;
  note?: string; sources?: { label: string; url: string }[];
};
const roster: [string, string, Genre, string][] = [
  ["Pons", "Because crypto needed another sequel.", "Sequels", "#d8e2d5"],
  ["Pons V2", "Pons 2: the pad returns.", "Sequels", "#d8e2d5"],
  ["Flap", "Even the butterfly has a tax department.", "Launchpad lore", "#9b75ff"],
  ["FlapTax", "The butterfly found an accountant.", "Sequels", "#9b75ff"],
  ["Noxa", "Sounds like the final boss of the launchpad tutorial.", "Name games", "#c8b598"],
  ["Trench", "The destination is in the name.", "Name games", "#ff6d61"],
  ["Bow", "Another pad enters. The crowd takes a bow.", "Name games", "#49d3a2"],
  ["Varo", "Four letters. Infinite main-character energy.", "Name games", "#c9a788"],
  ["Pools Instant", "Just add hype. Instant launchpad.", "Name games", "#b1ce69"],
  ["Pools CCA", "The launchpad alphabet soup got a pool.", "Sequels", "#68cfe5"],
  ["Pools.fun", "The pool party now has a ticker.", "Name games", "#df88bd"],
  ["StonkLauncher", "Wall Street vocabulary. Arcade energy.", "Name games", "#ffa250"],
  ["StonkBrokers", "The suit is formal. The name says stonk.", "Name games", "#ffa250"],
  ["Dontblink", "The entire brand is a staring contest.", "Name games", "#a29aff"],
  ["o1 Stock", "Your launchpad now has a business-casual outfit.", "Sequels", "#cbc5ef"],
  ["o1", "Even the name looks like a version number.", "Name games", "#eceae1"],
  ["Rally", "A pep talk with a launch button.", "Name games", "#d5df72"],
  ["Sentry", "Standing guard at the entrance to the hype.", "Name games", "#6dd1b6"],
  ["Pair", "Because apparently every pad needs a plus-one.", "Name games", "#bea2d1"],
  ["Circus", "Finally, an honest name.", "Name games", "#ebba72"],
  ["RobinVista", "The launchpad installed a new view.", "Name games", "#a2d078"],
  ["Letscash", "At least the brainstorming meeting was brief.", "Name games", "#e1c677"],
  ["Orbofi", "Somewhere, a sci-fi novelist wants their title back.", "Name games", "#8bafff"],
  ["Long.xyz", "The name is long. The URL is short.", "Name games", "#90a9ff"],
  ["Lunch", "Your lunch break has a launchpad now.", "Name games", "#c8db8b"],
  ["Bags", "The bag comes included.", "Name games", "#53ed70"],
  ["Livo", "The launchpad naming department discovered vowels.", "Name games", "#8ad7d5"],
  ["Virtuals", "Even the launchpad's identity is virtual.", "Name games", "#77cbbf"],
  ["Bankr", "Your bad idea can deploy itself.", "Launchpad lore", "#ff956f"],
  ["Anoncoin", "Even the name declined to introduce itself.", "Name games", "#c4c7c4"],
  ["Doppler", "You can hear another launchpad approaching.", "Name games", "#e2e5dc"],
  ["Clanker", "The name is the sound of the next launchpad arriving.", "Name games", "#b993ed"],
  ["Klik", "Four letters. One suspiciously satisfying sound.", "Name games", "#b988f6"],
  ["Dyor", "Even the brand name assigns homework.", "Name games", "#74cfe0"],
  ["Dyor V3", "The homework has a third edition.", "Sequels", "#b7d67f"],
  ["Ape.store", "The jungle got a checkout page.", "Name games", "#e0c878"],
  ["Based.bid", "The auctioneer learned crypto slang.", "Name games", "#aad78e"],
  ["LaunchHood", "The naming meeting was just two sticky notes.", "Name games", "#75df86"],
  ["Coinbarrel", "Someone put the token factory in a barrel.", "Name games", "#adcf90"],
  ["Leavehood", "Finally, a launchpad with an exit in its name.", "Name games", "#d4de79"],
  ["Hood", "The whole neighborhood got a launch button.", "Name games", "#75d783"],
  ["Robinfun", "The Hood's launchpad scene put on a party hat.", "Name games", "#80e289"],
  ["Lemon.fun", "When life gives you launchpads, add a lemon.", "Name games", "#f0e67d"],
  ["Nasdank", "Wall Street got autocorrected by a meme.", "Name games", "#d2df8d"],
  ["Meme.bid", "The punchline now takes bids.", "Name games", "#d7dd7a"],
  ["GameStonks", "The stonks came with a side quest.", "Name games", "#aaadf8"],
  ["Par", "Another pad. Apparently, par for the course.", "Name games", "#d5af81"],
  ["HypeTerminal", "Finally, a terminal that names its operating system.", "Name games", "#77d4c9"],
  ["Sushi", "Even dinner has an entry on this board.", "Name games", "#88d4ee"],
  ["Commodities", "Someone invited the economics textbook to the party.", "Name games", "#76d7ab"],
  ["Paired", "Pair's plus-one finally showed up.", "Name games", "#d4d37b"],
  ["Goo", "The launchpad naming meeting got sticky.", "Name games", "#d4ff3e"],
  ["Clank", "Big teeth. Bigger beta energy.", "Name games", "#c7b3ff"],
];
const extras: Record<string, Partial<Pad>> = {
  "Clank": { asset: "clank.png", badge: "Beta", note: "Clank pairs a toothy purple mascot with a Beta badge. The punchline is about the mascot and that release label." },
  "Pons": { asset: "pons.png", featured: true, title: "Pons / Pons V2", note: "Pons documents both V1 and V2. The joke treats launchpad versions like a movie franchise.", sources: [{ label: "Pons documentation", url: "https://docs.ponsfamily.com/" }] },
  "Pons V2": { asset: "pons.png", sources: [{ label: "Pons documentation", url: "https://docs.ponsfamily.com/" }] },
  "Flap": { asset: "flap.png", featured: true, title: "Flap / FlapTax", note: "Flap's butterfly branding meets its documented customizable token taxes. The tax receipt writes itself.", sources: [{ label: "Flap documentation", url: "https://docs.flap.sh/flap" }] },
  "FlapTax": { asset: "flap.png", sources: [{ label: "Flap documentation", url: "https://docs.flap.sh/flap" }] },
  "Circus": { asset: "circus.svg", featured: true, note: "Circus is a real launchpad name. This punchline is about the launchpad scene's theatrical energy.", sources: [{ label: "Circus website", url: "https://circus.trade/" }] },
  "Trench": { asset: "trench.png", featured: true, note: "Trench is the brand name and crypto slang for the memecoin scene. A name joke, served with a shovel.", sources: [{ label: "Trench website", url: "https://trench.today/" }] },
  "Bankr": { asset: "bankr.png", featured: true, note: "Bankr documents token launches through natural-language prompts. The idea can be questionable; the deploy command is very real.", sources: [{ label: "Bankr token launching", url: "https://docs.bankr.bot/token-launching/overview/" }] },
  "Bags": { asset: "bags.png", featured: true, note: "Bags has a money-bag mark. The punchline turns crypto's favorite accessory into an airline baggage claim.", sources: [{ label: "Bags documentation", url: "https://docs.bags.fm/robinhood/overview" }] },
  "StonkBrokers": { asset: "stonkbrokers.png", sources: [{ label: "StonkBrokers website", url: "https://stonkbrokers.io/launcher" }] },
};
export const pads: Pad[] = roster.map(([name, punchline, genre, color], i) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name, punchline, genre, color,
  sprite: i === 51 ? [17, 1] : [Math.floor(i / 3), i % 3], ...extras[name],
}));
export const featuredOrder = ["pons", "flap", "circus", "trench", "bankr", "bags"];
export const padById = new Map(pads.map(pad => [pad.id, pad]));
export type Roast = { id: string; padId: string; punchline: string; author: string; createdAt: number; editorial?: boolean };
export const editorialRoasts: Roast[] = pads.map(pad => ({ id: `editorial-${pad.id}`, padId: pad.id, punchline: pad.punchline, author: "PADCOIN", createdAt: 0, editorial: true }));
