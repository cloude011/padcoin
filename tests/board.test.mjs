import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { build } from 'esbuild';

const testDir = mkdtempSync(join(tmpdir(), 'padcoin-vercel-test-'));
process.env.TURSO_DATABASE_URL = 'file:' + join(testDir, 'board.db');
process.env.TURSO_AUTH_TOKEN = '';
const clients = [];
globalThis.__createLibsqlClient = (config) => {
  const client = createClient(config);
  clients.push(client);
  return client;
};
process.on('exit', () => {
  for (const client of clients) client.close();
  rmSync(testDir, { recursive: true, force: true });
});
async function importModule(path) {
  const result = await build({entryPoints:[path],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'local-libsql',setup(builder){builder.onResolve({filter:/^@libsql\/client\/web$/},()=>({path:'local-client',namespace:'local-client'}));builder.onLoad({filter:/.*/,namespace:'local-client'},()=>({contents:'export const createClient = globalThis.__createLibsqlClient;'}));}}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const {pads,editorialRoasts} = await importModule('lib/pads.ts');
const {selectRoasts} = await importModule('lib/board.ts');
const {validateRoast,actorFor} = await importModule('lib/validation.ts');
const board = await importModule('app/api/board/route.ts');
const roasts = await importModule('app/api/roasts/route.ts');
const votes = await importModule('app/api/votes/route.ts');
const session1 = 'dc749a88-b3f1-404e-9acd-a21c15541514';
const session2 = 'be749a88-b3f1-404e-9acd-a21c15541515';
const req = (path, body, session=session1, origin='https://padcoin.test') => new Request('https://padcoin.test'+path,{method:body === undefined ? 'GET':'POST',headers:{origin,'Content-Type':'application/json','x-padcoin-session':session},...(body === undefined ? {}:{body:JSON.stringify(body)})});
const opts = {view:'featured',query:'',genre:'all',selected:'',saved:new Set(),counts:{},sort:'featured'};
assert.equal(pads.length,53);assert.equal(new Set(pads.map(pad=>pad.id)).size,53);
for (const pad of pads) if(pad.asset) assert(existsSync(new URL('../public/assets/'+pad.asset,import.meta.url)),pad.asset);
assert(existsSync(new URL('../public/assets/launchpad-machine.webp',import.meta.url)));
assert.equal(selectRoasts(editorialRoasts,opts).length,6);
assert.equal(selectRoasts(editorialRoasts,{...opts,query:'dyor'}).length,2,'search reaches outside featured');
assert.equal(selectRoasts(editorialRoasts,{...opts,view:'all',selected:'pons-v2'})[0].padId,'pons-v2');
assert.equal(selectRoasts(editorialRoasts,{...opts,view:'all',selected:'clank'})[0].punchline,'Big teeth. Bigger beta energy.');
assert(pads.some(pad=>pad.id==='clanker'),'Clanker remains a separate launchpad');
assert.equal(validateRoast({padId:'clank',punchline:'The beta badge found a mascot.'}).padId,'clank');
assert.equal(selectRoasts(editorialRoasts,{...opts,view:'saved',saved:new Set(['editorial-bags'])})[0].padId,'bags');
assert.equal(selectRoasts(editorialRoasts,{...opts,sort:'votes',counts:{'editorial-bankr':9}})[0].padId,'bankr');
assert.throws(()=>validateRoast({padId:'unknown',punchline:'This is a punchline.'}));
assert.throws(()=>validateRoast({padId:'pons',punchline:'short'}));
assert.throws(()=>validateRoast({padId:'pons',punchline:'a'.repeat(181)}));
assert.equal(validateRoast({padId:'pons',punchline:'  The\n sequel nobody asked for.  ',author:'@tester'}).punchline,'The sequel nobody asked for.');
assert.throws(()=>actorFor(new Request('https://padcoin.test',{headers:{'oai-authenticated-user-id':'test-user'}})), 'Hosting-specific identity headers are not trusted on Vercel');
assert.equal(actorFor(req('/api/board')), 'browser:' + session1);
console.log('PASS: 53 entries, assets, search, filters, saved collection, sorting and validation');

let response = await roasts.POST(req('/api/roasts',{padId:'pons',punchline:'The sequel nobody asked for.',author:'tester'}));
assert.equal(response.status,201);const posted=(await response.json()).roast;
response = await board.GET(req('/api/board'));let state=await response.json();
assert.equal(state.roasts[0].id,posted.id);assert.equal(state.roasts[0].author,'tester');
assert(!('actor' in state.roasts[0]),'private actor ids stay private');
assert.equal((await roasts.POST(req('/api/roasts',{padId:'unknown',punchline:'The sequel nobody asked for.'}))).status,400);
assert.equal((await roasts.POST(req('/api/roasts',{padId:'pons',punchline:'The sequel nobody asked for.'},session1,'https://other.test'))).status,403);
console.log('PASS: submissions persist, board retrieves them, validation and origin checks reject bad writes');

response=await votes.POST(req('/api/votes',{id:posted.id,active:true}));assert.equal((await response.json()).count,1);
response=await votes.POST(req('/api/votes',{id:posted.id,active:true}));assert.equal((await response.json()).count,1,'retry cannot double count');
response=await votes.POST(req('/api/votes',{id:posted.id,active:true},session2));assert.equal((await response.json()).count,2);
response=await votes.POST(req('/api/votes',{id:posted.id,active:false}));assert.equal((await response.json()).count,1);
response=await votes.POST(req('/api/votes',{id:'editorial-flap',active:true}));assert.equal((await response.json()).count,1);
assert.equal((await votes.POST(req('/api/votes',{id:'missing',active:true}))).status,404);
response=await board.GET(req('/api/board'));state=await response.json();
assert.equal(state.counts['editorial-flap'],1);assert(state.voted.includes('editorial-flap'));assert(!state.voted.includes(posted.id));
console.log('PASS: community and editorial votes persist, retries are idempotent, removal works and voter state is isolated');
for(let i=0;i<5;i++) assert.equal((await roasts.POST(req('/api/roasts',{padId:'bags',punchline:'The test punchline number '+i}))).status,201);
assert.equal((await roasts.POST(req('/api/roasts',{padId:'bags',punchline:'The seventh test punchline'}))).status,429);
console.log('PASS: submission rate limit');
// Reopening the same database demonstrates persistence beyond a route client.
const reopened = createClient({ url: process.env.TURSO_DATABASE_URL });
assert.equal((await reopened.execute('SELECT COUNT(*) AS count FROM roasts')).rows[0].count, 6);
assert.equal((await reopened.execute("SELECT COUNT(*) AS count FROM votes WHERE roast_id = 'editorial-flap'")).rows[0].count, 1);
reopened.close();
console.log('PASS: persisted data survives a new database connection');
