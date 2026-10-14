"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronDown, Copy, Dice5, Flame, Info, LoaderCircle, Menu, Pause, Play, Plus, Search, Sparkles, X } from "lucide-react";
import { editorialRoasts, padById, pads, type Pad, type Roast } from "../lib/pads";
import { selectRoasts, type Sort, type View } from "../lib/board";

type BoardData = { roasts: Roast[]; counts: Record<string, number>; voted: string[] };
type Modal = { kind: "submit"; padId?: string } | { kind: "detail"; roast: Roast } | null;

function getSession() {
  try {
    const old = localStorage.getItem("padcoin-session");
    if (old && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(old)) return old;
    const id = crypto.randomUUID(); localStorage.setItem("padcoin-session", id); return id;
  } catch { return crypto.randomUUID(); }
}
function Logo({ pad, large = false }: { pad: Pad; large?: boolean }) {
  if (pad.id === "clank") return <span className={`clank-logo ${large ? "large" : ""}`} aria-hidden="true" />;
  if (pad.asset) return <img className={`pad-logo ${large ? "large" : ""} logo-${pad.id}`} src={`/assets/${pad.asset}`} alt="" loading="lazy" draggable="false" />;
  const [row, column] = pad.sprite;
  const x = [30, 153, 274][column]; const y = 24 + row * (487 / 17);
  return <span className={`sprite-shell ${large ? "large" : ""}`} aria-hidden="true"><span className="sprite" style={{ backgroundPosition: `${-(x - 8)}px ${-(y - 8)}px` }} /></span>;
}
function Wordmark() {
  return <span className="wordmark wordmark-v2"><img src="/assets/padcoin-wordmark-purple.png" alt="PADCOIN" width="720" height="128" /></span>;
}
function localDate(timestamp: number) {
  if (Date.now() - timestamp < 60000) return "just now";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(timestamp);
}

export default function Home() {
  const [view, setView] = useState<View>("featured");
  const [query, setQuery] = useState(""); const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState<Sort>("featured"); const [selected, setSelected] = useState("");
  const [community, setCommunity] = useState<Roast[]>([]); const [counts, setCounts] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set()); const [saved, setSaved] = useState<Set<string>>(new Set());
  const [pendingVotes, setPendingVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true); const [syncError, setSyncError] = useState("");
  const [limit, setLimit] = useState(12); const [rosterQuery, setRosterQuery] = useState("");
  const [modal, setModal] = useState<Modal>(null); const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState(""); const [submitPad, setSubmitPad] = useState(pads[0].id);
  const [draft, setDraft] = useState(""); const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false); const [formError, setFormError] = useState("");
  const [motionPaused, setMotionPaused] = useState(false); const [reducedMotion, setReducedMotion] = useState(false);
  const [heatBursts, setHeatBursts] = useState<Record<string, number>>({});
  const motionRoot = useRef<HTMLElement>(null); const burstTimers = useRef(new Map<string, number>());
  const sessionRef = useRef(""); const dialogRef = useRef<HTMLDialogElement>(null);
  const queryRef = useRef<HTMLInputElement>(null); const pendingRef = useRef(new Set<string>());
  const modalCloseRef = useRef<HTMLElement | null>(null);

  const request = useCallback(async <T,>(url: string, payload?: unknown): Promise<T> => {
    if (!sessionRef.current) sessionRef.current = getSession();
    const response = await fetch(url, { method: payload === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", "x-padcoin-session": sessionRef.current }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) });
    const data = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(data.error || "Something didn't land. Try again.");
    return data;
  }, []);
  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request<BoardData>("/api/board");
      setCommunity(data.roasts); setCounts(data.counts); setVoted(new Set(data.voted)); setSyncError("");
    } catch (error) { setSyncError(error instanceof Error ? error.message : "The board couldn't sync."); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => {
    sessionRef.current = getSession();
    try { setMotionPaused(localStorage.getItem("padcoin-motion-paused") === "1"); } catch { /* preference stays local to this visit */ }
    try { const ids = JSON.parse(localStorage.getItem("padcoin-saved") || "[]"); if (Array.isArray(ids)) setSaved(new Set(ids.filter(id => typeof id === "string"))); } catch { /* preferences are optional */ }
    const pad = new URLSearchParams(location.search).get("pad");
    if (pad && padById.has(pad)) { setSelected(pad); setView("all"); }
    void loadBoard();
  }, [loadBoard]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches); update();
    media.addEventListener("change", update);
    const timers = burstTimers.current;
    return () => { media.removeEventListener("change", update); timers.forEach(timer => window.clearTimeout(timer)); };
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 4300); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { setLimit(12); }, [view, query, genre, sort, selected]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (modal) {
      if (!dialog.open) {
        modalCloseRef.current = document.activeElement as HTMLElement;
        dialog.showModal();
      }
      document.body.style.overflow = "hidden";
    } else if (!modal && dialog.open) {
      dialog.close(); document.body.style.overflow = "";
      modalCloseRef.current?.focus();
    }
    return () => { document.body.style.overflow = ""; };
  }, [modal]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "/" && !modal && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLSelectElement)) {
        event.preventDefault(); document.getElementById("board")?.scrollIntoView({ behavior: "smooth" }); queryRef.current?.focus();
      }
    };
    window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener);
  }, [modal]);

  const allRoasts = useMemo(() => [...editorialRoasts, ...community], [community]);
  const result = useMemo(() => selectRoasts(allRoasts, { view, query, genre, selected, saved, counts, sort }), [allRoasts, view, query, genre, selected, saved, counts, sort]);
  const filteredRoster = useMemo(() => pads.filter(pad => pad.name.toLowerCase().includes(rosterQuery.toLowerCase().trim())), [rosterQuery]);
  const activePad = selected ? padById.get(selected) : undefined;
  const detailedPad = modal?.kind === "detail" ? padById.get(modal.roast.padId) : undefined;
  const motionStopped = motionPaused || reducedMotion;

  useEffect(() => {
    const targets = motionRoot.current?.querySelectorAll<HTMLElement>("[data-motion]");
    if (!targets) return;
    if (!("IntersectionObserver" in window)) { targets.forEach(target => target.classList.add("in-view")); return; }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle("in-view", entry.isIntersecting));
    }, { rootMargin: "80px" });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [result, filteredRoster, limit]);

  function toggleMotion() {
    const next = !motionPaused; setMotionPaused(next);
    try { localStorage.setItem("padcoin-motion-paused", next ? "1" : "0"); } catch { /* still works for this visit */ }
  }
  function tiltMachine(event: PointerEvent<HTMLDivElement>) {
    if (motionStopped || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 5}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 7}deg`);
  }
  function celebrateRoast(id: string) {
    if (motionStopped) return;
    const old = burstTimers.current.get(id); if (old) window.clearTimeout(old);
    setHeatBursts(previous => ({ ...previous, [id]: Date.now() }));
    burstTimers.current.set(id, window.setTimeout(() => {
      setHeatBursts(previous => { const next = { ...previous }; delete next[id]; return next; });
      burstTimers.current.delete(id);
    }, 1150));
  }

  function openSubmit(padId?: string) { if (padId) setSubmitPad(padId); setFormError(""); setModal({ kind: "submit", padId }); setMobileNav(false); }
  function choosePad(id: string) {
    setSelected(id); setView("all"); setQuery(""); setGenre("all"); setSort("featured");
    const url = new URL(location.href); url.searchParams.set("pad", id); url.hash = "board"; history.replaceState(null, "", url);
    document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
  }
  function resetBoard() {
    setSelected(""); setQuery(""); setGenre("all"); setView("all");
    const url = new URL(location.href); url.searchParams.delete("pad"); history.replaceState(null, "", url);
  }
  function toggleSave(id: string) {
    const next = new Set(saved); if (next.has(id)) next.delete(id); else next.add(id);
    setSaved(next); try { localStorage.setItem("padcoin-saved", JSON.stringify([...next])); } catch { setToast("Saved for this visit."); }
  }
  async function vote(roast: Roast) {
    if (pendingRef.current.has(roast.id)) return;
    pendingRef.current.add(roast.id); setPendingVotes(new Set(pendingRef.current));
    try {
      const data = await request<{ count: number; active: boolean }>("/api/votes", { id: roast.id, active: !voted.has(roast.id) });
      setCounts(prev => ({ ...prev, [roast.id]: data.count }));
      setVoted(prev => { const next = new Set(prev); if (data.active) next.add(roast.id); else next.delete(roast.id); return next; });
      if (data.active) celebrateRoast(roast.id);
      setToast(data.active ? "Roasted. Your vote is on the board." : "Vote removed. A moment of mercy.");
    } catch (error) { setToast(error instanceof Error ? error.message : "That vote didn't land."); }
    finally { pendingRef.current.delete(roast.id); setPendingVotes(new Set(pendingRef.current)); }
  }
  async function copyRoast(roast?: Roast) {
    const url = new URL(location.origin); if (roast) { url.searchParams.set("pad", roast.padId); url.hash = "board"; }
    const text = roast ? `${padById.get(roast.padId)?.name}: ${roast.punchline}\n\n${url}` : `Another day. Another launchpad.\n${url}`;
    try { await navigator.clipboard.writeText(text); setToast("Copied. Let the group chat decide."); }
    catch { setToast("Clipboard unavailable. Copy the page URL to share this roast."); }
  }
  function randomRoast() { const roast = editorialRoasts[Math.floor(Math.random() * editorialRoasts.length)]; setModal({ kind: "detail", roast }); }
  async function submitRoast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setFormError("");
    try {
      const data = await request<{ roast: Roast }>("/api/roasts", { padId: submitPad, punchline: draft, author });
      setCommunity(prev => [data.roast, ...prev]); setView("community"); setSelected(""); setQuery(""); setGenre("all"); setSort("newest");
      setModal(null); setDraft(""); setToast("Your roast is live. The board has a new punchline.");
      document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) { setFormError(error instanceof Error ? error.message : "Couldn't save your roast. Try again."); }
    finally { setSubmitting(false); }
  }

  return <>
    <a className="skip-link" href="#board">Skip to the roast board</a>
    <div className="bg-fx" aria-hidden="true"><span className="bg-glow" /><span className="bg-grid" /><span className="bg-pattern" /><span className="bg-halo" /><span className="bg-face" /></div>
    <div className="launch-banner" role="note"><div className="launch-banner-inner"><img src="/assets/clank-face.png" alt="" width="22" height="22" /><span><strong>$PAD</strong> is coming on <strong>Clanktrade</strong></span><img src="/assets/clank-face.png" alt="" width="22" height="22" className="launch-banner-mirror" /></div></div>
    <header className="site-header">
      <div className="header-inner">
        <a href="#home" className="brand" aria-label="PADCOIN home"><Wordmark /></a>
        <nav className={`navigation ${mobileNav ? "open" : ""}`} aria-label="Main navigation">
          <a href="#board" onClick={() => setMobileNav(false)}>Roast board</a>
          <a href="#roster" onClick={() => setMobileNav(false)}>The roster <span>{pads.length}</span></a>
          <a href="#about" onClick={() => setMobileNav(false)}>The thesis</a>
        </nav>
        <div className="header-actions"><span className="status-pill"><i /> INDEPENDENT SATIRE</span><button className="button small lime" onClick={() => openSubmit()}>Submit a roast <Plus size={16} /></button><button className="icon-button menu-button" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? "Close navigation" : "Open navigation"} aria-expanded={mobileNav}>{mobileNav ? <X size={22} /> : <Menu size={22} />}</button></div>
      </div>
    </header>
    <main id="home" ref={motionRoot} className={motionStopped ? "motion-paused" : ""}>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="mini-star">✳</span> THE HOOD'S UNOFFICIAL ROAST BOARD</div>
          <h1 id="hero-title">ANOTHER DAY.<br />ANOTHER<br /><span>LAUNCHPAD.</span></h1>
          <p className="hero-description">Everyone brought a launchpad.<br />We brought the punchlines.</p>
          <div className="hero-buttons"><a className="button lime" href="#board">Enter the roast board <ArrowUpRight size={19} /></a><button className="text-button" onClick={randomRoast}><Dice5 size={18} /> Surprise me</button></div>
          <div className="hero-footnote"><div className="tiny-logo-stack">{["pons", "flap", "bankr", "bags"].map(id => <span key={id}><Logo pad={padById.get(id)!} /></span>)}</div><span><strong>{pads.length} entries.</strong> Nobody gets a free pass.</span></div>
        </div>
        <div className="hero-art" data-motion onPointerMove={tiltMachine} onPointerLeave={event => { event.currentTarget.style.removeProperty("--tilt-x"); event.currentTarget.style.removeProperty("--tilt-y"); }}>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <button className="motion-toggle" onClick={toggleMotion} aria-pressed={!motionStopped} disabled={reducedMotion} title={reducedMotion ? "Your device is set to reduced motion." : "Pause or resume the animations"}>{motionStopped ? <Play size={12} /> : <Pause size={12} />}{reducedMotion ? "Reduced motion" : motionPaused ? "Motion off" : "Motion on"}</button>
          <span className="art-coordinate coordinate-top">EXHIBIT 001 / THE PAD MACHINE</span>
          <div className="machine-stage"><img src="/assets/launchpad-machine.webp" alt="A battered launchpad vending machine stuffed with Pons, Flap, Bankr, Bags, Trench and StonkBrokers logos, dispensing yet another launchpad." className="machine" width="1122" height="1402" fetchPriority="high" /></div>
          <div className="hero-floaters" aria-hidden="true">{["flap", "bags", "clank"].map(id => <span key={id} className={`hero-floater floater-${id}`}><Logo pad={padById.get(id)!} /><span>{padById.get(id)!.name}</span><i>↗</i></span>)}</div>
          <button className="machine-label" onClick={randomRoast}><span className="blink-dot" /> DISPENSE A PUNCHLINE <ArrowUpRight size={15} /></button>
          <span className="art-coordinate coordinate-bottom">ENDLESS SUPPLY. QUESTIONABLE DEMAND.</span>
        </div>
      </section>
      <div className="ticker" aria-label="Every pad thinks it's the main character"><div className="ticker-track" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i}>EVERY PAD THINKS IT'S THE MAIN CHARACTER <b>✳</b></span>)}</div></div>
      <section className="board-section container" id="board" aria-labelledby="board-title">
        <div className="section-top"><div><div className="eyebrow muted">01 / THE MAIN EVENT</div><h2 id="board-title">THE ROAST BOARD<span className="heading-dot">.</span></h2><p>Pick a pad. Find a punchline. Add a little heat.</p></div><button className="text-button section-action" onClick={() => openSubmit()}><Plus size={18} /> Got a better one? <ArrowUpRight size={18} /></button></div>
        <div className="board-toolbar">
          <div className="tabs" role="group" aria-label="Roast collection">{([["featured", "Featured"], ["all", `All ${pads.length}`], ["community", "Community"], ["saved", "Saved"]] as [View, string][]).map(([id, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setSelected(""); }} aria-pressed={view === id}>{id === "featured" && <Flame size={14} />}{label}{id === "community" && community.length > 0 && <span>{community.length}</span>}</button>)}</div>
          <div className="toolbar-controls"><label className="search-field"><Search size={17} /><input ref={queryRef} aria-label="Search launchpads and punchlines" placeholder="Find a launchpad..." value={query} onChange={e => { setQuery(e.target.value); setSelected(""); if (view === "featured") setView("all"); }} /><kbd>/</kbd>{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}</label><label className="select-field"><span className="sr-only">Sort roasts</span><select value={sort} onChange={e => setSort(e.target.value as Sort)}><option value="featured">Featured first</option><option value="votes">Most roasted</option><option value="az">A–Z</option><option value="newest">Newest first</option></select><ChevronDown size={15} /></label></div>
        </div>
        {(view !== "featured" || query || selected) && <div className="filter-row"><div className="genre-filters">{["all", "Name games", "Sequels", "Launchpad lore"].map(item => <button key={item} aria-pressed={genre === item} className={genre === item ? "active" : ""} onClick={() => setGenre(item)}>{item === "all" ? "Every flavor" : item}</button>)}</div><span className="result-count">{result.length} {result.length === 1 ? "punchline" : "punchlines"}</span></div>}
        {activePad && <div className="selected-filter">In the hot seat: <strong>{activePad.name}</strong><button onClick={resetBoard} aria-label="Clear launchpad filter"><X size={14} /></button><button className="add-specific" onClick={() => openSubmit(activePad.id)}>Add your roast <Plus size={14} /></button></div>}
        {syncError && <div className="sync-error" role="status"><Info size={16} /> {syncError}<button onClick={() => void loadBoard()}>Try again</button></div>}
        <div className="roast-grid">
          {result.slice(0, limit).map((roast, index) => {
            const pad = padById.get(roast.padId)!; const isVoted = voted.has(roast.id); const count = counts[roast.id] || 0;
            const motionSeed = [...pad.id].reduce((total, character) => total + character.charCodeAt(0), 0);
            return <article data-motion className={`roast-card card-${pad.id} ${heatBursts[roast.id] ? "heating" : ""}`} key={roast.id} style={{ "--pad-color": pad.color, "--card-delay": `${Math.min(index, 5) * 45}ms`, "--logo-cycle": `${3.5 + (motionSeed % 20) / 10}s`, "--logo-delay": `${-(motionSeed % 40) / 10}s` } as CSSProperties}>
              <div className="card-top"><span className="card-category">{roast.editorial ? pad.genre : "COMMUNITY ROAST"}</span><button className={`icon-button bookmark ${saved.has(roast.id) ? "saved" : ""}`} aria-label={saved.has(roast.id) ? `Unsave ${pad.name} roast` : `Save ${pad.name} roast`} aria-pressed={saved.has(roast.id)} onClick={() => toggleSave(roast.id)}><Bookmark size={17} fill={saved.has(roast.id) ? "currentColor" : "none"} /></button></div>
              <button className="card-art" onClick={() => setModal({ kind: "detail", roast })} aria-label={`Read the ${pad.name} roast`}>
                <span className="logo-halo" /><span className="logo-motion"><Logo pad={pad} large /></span>
                {roast.editorial && pad.id === "pons" && <span className="prop prop-ticket">PONS<br /><strong>THE SEQUEL</strong><i>ADMIT ONE</i></span>}
                {roast.editorial && pad.id === "flap" && <span className="prop prop-receipt"><b>TAX RECEIPT</b><i>FLAP DEPARTMENT</i><span>––––––––––––</span><span>GOOD LUCK.</span></span>}
                {roast.editorial && pad.id === "circus" && <span className="prop prop-flag">WELCOME<br />TO THE SHOW</span>}
                {roast.editorial && pad.id === "trench" && <span className="prop prop-ticket">YOU ARE<br /><strong>HERE ↓</strong></span>}
                {roast.editorial && pad.id === "bankr" && <span className="prop prop-note">deploy my<br />bad idea ↗</span>}
                {roast.editorial && pad.id === "bags" && <span className="prop prop-luggage">BAGGAGE<br /><strong>CLAIM 01</strong></span>}
              </button>
              <div className="card-copy"><div className="card-brand-row"><h3>{roast.editorial ? pad.title || pad.name : pad.name}{pad.badge && <span className="brand-badge">{pad.badge}</span>}</h3><button className="icon-button" onClick={() => setModal({ kind: "detail", roast })} aria-label={`Why this joke about ${pad.name}?`}><ArrowUpRight size={17} /></button></div><p>{roast.punchline}</p><span className="card-byline">{roast.editorial ? "by PADCOIN / editorial roast" : `by @${roast.author} · ${localDate(roast.createdAt)}`}</span></div>
              <div className="card-bottom"><button className={`vote-button ${isVoted ? "voted" : ""}`} aria-label={`${isVoted ? "Remove vote for" : "Vote for"} the ${pad.name} roast`} aria-pressed={isVoted} disabled={loading || pendingVotes.has(roast.id)} onClick={() => void vote(roast)}>{pendingVotes.has(roast.id) ? <LoaderCircle size={16} className="spin" /> : <Flame size={17} fill={isVoted ? "currentColor" : "none"} />}<span>{isVoted ? "Roasted" : "Add heat"}</span>{count > 0 && <b>{count.toLocaleString()}</b>}</button><button className="icon-button share-button" onClick={() => void copyRoast(roast)} aria-label={`Copy ${pad.name} roast to share`}><Copy size={16} /></button></div>
              {heatBursts[roast.id] && <div className="heat-burst" aria-hidden="true" key={heatBursts[roast.id]}>{Array.from({ length: 6 }, (_, particle) => <Flame key={particle} size={17 + particle % 3 * 4} fill="currentColor" style={{ "--burst-x": `${(particle - 2.5) * 18}px`, "--burst-angle": `${(particle - 2.5) * 14}deg`, "--burst-delay": `${particle * 25}ms`, left: `${18 + particle * 12}%` } as CSSProperties} />)}<span>ROASTED ✳</span></div>}
            </article>;
          })}
        </div>
        {!result.length && <div className="empty-state"><Sparkles size={30} /><h3>{view === "community" ? "THE MIC IS OPEN." : view === "saved" ? "YOUR SHORTLIST IS EMPTY." : "THIS PAD IS HIDING."}</h3><p>{view === "community" ? "Be the first to put a community punchline on the board." : view === "saved" ? "Tap the bookmark on a roast to keep it here." : "Try another name, or clear your filters."}</p><button className="button lime" onClick={() => view === "community" ? openSubmit(selected || undefined) : resetBoard()}>{view === "community" ? "Submit the first roast" : "Explore the board"}<ArrowUpRight size={17} /></button></div>}
        <div className="board-bottom"><span className="micro-text">{loading ? "SYNCING THE BOARD…" : "REAL VOTES. VERY UNREALISTIC EGOS."}</span>{result.length > limit ? <button className="button outline" onClick={() => setLimit(prev => prev + 12)}>Load 12 more <ArrowDown size={17} /></button> : view === "featured" ? <button className="button outline" onClick={resetBoard}>Meet all {pads.length} entries <ArrowRight size={17} /></button> : <button className="text-button" onClick={() => openSubmit(selected || undefined)}>Add your punchline <Plus size={17} /></button>}</div>
      </section>
      <section className="thesis-section" id="about"><div className="thesis-inner container"><span className="big-asterisk" aria-hidden="true">✳</span><div><div className="eyebrow">THE THESIS IS SIMPLE</div><h2>THE HOOD HAS ENOUGH PADS.<br />IT COULD USE A PUNCHLINE.</h2><p>The launchpad wars became their own genre. PADCOIN gives the names, the hype, and the endless sequels a stage. You decide which joke lands.</p></div><button className="button black" onClick={() => openSubmit()}>Take the mic <ArrowUpRight size={19} /></button></div></section>
      <section className="roster-section container" id="roster" aria-labelledby="roster-title"><div className="section-top"><div><div className="eyebrow muted">02 / EVERYONE'S INVITED</div><h2 id="roster-title">NO PAD LEFT UNROASTED<span className="heading-dot">.</span></h2><p>{pads.length} names on the board. Pick your next target.</p></div><span className="roster-total">{pads.length} <span>ENTRIES</span></span></div><div className="roster-top"><span className="micro-text">{filteredRoster.length === pads.length ? "THE FULL CAST" : `${filteredRoster.length} MATCHING NAMES`}</span><label className="search-field roster-search"><Search size={16} /><input aria-label="Search the roster" placeholder="Find a name..." value={rosterQuery} onChange={event => setRosterQuery(event.target.value)} />{rosterQuery && <button aria-label="Clear roster search" onClick={() => setRosterQuery("")}><X size={14} /></button>}</label></div><div className="roster-grid">{filteredRoster.map(pad => <button key={pad.id} data-motion onClick={() => choosePad(pad.id)} className="roster-pill" style={{ "--pad-color": pad.color } as CSSProperties}><Logo pad={pad} /><span>{pad.name}</span><ArrowUpRight size={13} /></button>)}</div>{!filteredRoster.length && <p className="roster-empty">No names found. <button onClick={() => setRosterQuery("")}>Show the full roster</button></p>}</section>
      <section className="closing container"><div className="eyebrow muted">NO WHITEPAPER REQUIRED</div><h2>GOT A BETTER <span>PUNCHLINE?</span></h2><button className="button lime" onClick={() => openSubmit()}>Put it on the board <Plus size={18} /></button></section>
    </main>
    <footer className="site-footer container"><a href="#home" className="brand" aria-label="PADCOIN home"><Wordmark /></a><p>Independent satire. Not affiliated with Robinhood or featured platforms.<br />The jokes are opinions. The logos belong to their owners.</p><div><button className="text-button" onClick={() => void copyRoast()}>Share the board <ArrowUpRight size={16} /></button><a className="text-button" href="#home">Back to top ↑</a></div></footer>
    <div className={`toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">{toast && <><Check size={17} /><span>{toast}</span><button onClick={() => setToast("")} aria-label="Dismiss message"><X size={15} /></button></>}</div>
    <dialog ref={dialogRef} className={`roast-dialog ${motionStopped ? "motion-paused" : ""}`} onCancel={() => setModal(null)} onClose={() => { setModal(null); document.body.style.overflow = ""; }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setModal(null); } }} aria-labelledby="dialog-title">
      <button className="icon-button close-dialog" aria-label="Close dialog" onClick={() => setModal(null)}><X size={21} /></button>
      {modal?.kind === "submit" && <form onSubmit={submitRoast}><div className="eyebrow"><Flame size={16} /> THE MIC IS YOURS</div><h2 id="dialog-title">SERVE IT<br /><span>ROASTED.</span></h2><p className="dialog-description">Give a launchpad the punchline it deserves.</p><label className="form-label">Who's in the hot seat?<select value={submitPad} onChange={event => setSubmitPad(event.target.value)} required>{pads.map(pad => <option value={pad.id} key={pad.id}>{pad.name}</option>)}</select></label><label className="form-label">Your punchline<textarea value={draft} onChange={event => setDraft(event.target.value)} minLength={10} maxLength={180} required placeholder="A name joke. A little launchpad lore. Your best shot." rows={3} /><span className="character-count">{draft.length} / 180</span></label><label className="form-label">Your name <span className="optional">optional</span><input value={author} onChange={event => setAuthor(event.target.value)} maxLength={24} placeholder="anon" autoComplete="nickname" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<button className="button lime submit-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle size={18} className="spin" /> Posting your roast…</> : <>Put it on the board <ArrowUpRight size={18} /></>}</button><p className="form-note">A punchline about a pad. Keep real people out of the hot seat.</p></form>}
      {modal?.kind === "detail" && detailedPad && <div className="detail-content"><div className="eyebrow">IN THE HOT SEAT</div><div className="detail-brand"><Logo pad={detailedPad} large /><span>{detailedPad.name}</span></div><h2 id="dialog-title" className="detail-punchline">“{modal.roast.punchline}”</h2><span className="card-byline">{modal.roast.editorial ? "An editorial roast by PADCOIN" : `A community roast by @${modal.roast.author}`}</span><div className="detail-context"><span className="eyebrow muted">{modal.roast.editorial ? "WHAT'S THE JOKE?" : "THE TARGET"}</span><p>{modal.roast.editorial ? detailedPad.note || "A name-based punchline from the launchpad scene. Every pad thinks it's the main character; this one gets a joke, too." : `A community punchline about ${detailedPad.name}. Vote if it lands, or take the mic with your own.`}</p>{detailedPad.sources?.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="source-link">{source.label}<ArrowUpRight size={15} /></a>)}</div><div className="detail-actions"><button className={`button ${voted.has(modal.roast.id) ? "outline" : "lime"}`} disabled={loading || pendingVotes.has(modal.roast.id)} onClick={() => void vote(modal.roast)}><Flame size={17} />{voted.has(modal.roast.id) ? "Roasted" : "Add heat"}{(counts[modal.roast.id] || 0) > 0 && ` · ${counts[modal.roast.id]}`}</button><button className="button outline" onClick={() => void copyRoast(modal.roast)}><Copy size={16} /> Copy roast</button></div><button className="text-button detail-write" onClick={() => openSubmit(detailedPad.id)}>Got a better one? <Plus size={16} /></button></div>}
      {modal && toast && <p className="dialog-feedback" role="status">{toast}</p>}
    </dialog>
  </>;
}
