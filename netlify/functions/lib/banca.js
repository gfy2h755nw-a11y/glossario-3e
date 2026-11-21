/* Banca termini modificabile dall'app.
 * I termini di partenza restano nel codice (banca-termini.js per le 4 aree del laboratorio, pacchetti.js per gli elenchi pronti);
 * le modifiche del prof. Cerrato stanno in un solo documento Firestore (config/_banca) e si applicano sopra:
 *   mod[fonte] = { agg: [[termine, definizione]], via: [chiave], cor: { chiave: [termine, definizione] } }
 * fonte: 'banca:N' oppure 'pk:ID:N' (come nella procedura «Nuova attività»). */
const BASE = require('./banca-termini');
const PK = require('./pacchetti');
const DATI = require('./dati');
const SIM = require('./simili');
const L = require('./logica');

const K = (t) => SIM.chiave(t) || String(t || '').toLowerCase().trim();
const err = (m) => L.errore(m);
let cache = null, cacheT = 0;
const CACHE_MS = 60000;

function fontiBase() {
  const out = [];
  DATI.AREE.forEach((a) => out.push({ f: 'banca:' + a.n, gruppo: 'Banca del laboratorio (3ª)', it: a.it, colore: a.colore, base: BASE[a.n] || [] }));
  Object.keys(PK).forEach((id) => PK[id].aree.forEach((a, i) => { const k = String(i + 1); out.push({ f: 'pk:' + id + ':' + k, gruppo: 'Elenco pronto: ' + PK[id].nome, it: a.it, colore: a.colore, base: PK[id].termini[k] || [] }); }));
  return out;
}
/* elenco di una fonte con le modifiche: [termine, definizione, stato, chiave] (stato: base | corretto | aggiunto) */
function applica(base, m) {
  m = m || {};
  const via = new Set(m.via || []), cor = m.cor || {}, out = [];
  base.forEach((x) => { const k = K(x[0]); if (via.has(k)) return; const c = cor[k]; out.push(c ? [c[0], c[1], 'corretto', k] : [x[0], x[1], 'base', k]); });
  (m.agg || []).forEach((x) => out.push([x[0], x[1], 'aggiunto', K(x[0])]));
  return out;
}
async function leggiMod(db, fresco) {
  if (!fresco && cache && Date.now() - cacheT < CACHE_MS) return cache;
  const d = db.leggiBanca ? await db.leggiBanca() : null;
  cache = (d && d.mod) || {}; cacheT = Date.now();
  return cache;
}
/* { fonte: [[termine, definizione]] } con le modifiche applicate: lo usa la generazione dei termini */
async function elenchi(db) {
  const mod = await leggiMod(db), o = {};
  fontiBase().forEach((F) => { o[F.f] = applica(F.base, mod[F.f]).map((x) => [x[0], x[1]]); });
  return o;
}
async function conteggi(db) {
  const E = await elenchi(db), banca = {}, pk = {};
  Object.keys(E).forEach((f) => { let m = /^banca:(\d)$/.exec(f); if (m) { banca[m[1]] = E[f].length; return; } m = /^pk:(.+):(\d)$/.exec(f); if (m) { (pk[m[1]] = pk[m[1]] || {})[m[2]] = E[f].length; } });
  return { banca, pk };
}
/* solo il prof. Cerrato: basta la configurazione dell'attività principale */
async function soloCerrato(db, codice) {
  const config = await db.leggiConfig();
  L.soloAdmin(L.identifica({ config: config || {}, alunni: [], termini: [] }, codice));
}
function chiaviUsate(config) {
  const s = new Set();
  DATI.AREE.forEach((a) => (DATI.TERMINI[a.n] || []).forEach((t) => s.add(K(t[0]))));
  ((config && config.catalogo) ? Object.values(config.catalogo) : []).forEach((ar) => (ar || []).forEach((t) => s.add(K(Array.isArray(t) ? t[0] : (t && (t.it || t.termine))))));
  return s;
}
async function banca(db, { codice }) {
  await soloCerrato(db, codice);
  const mod = await leggiMod(db, true);
  const usati = chiaviUsate(await db.leggiConfig());
  const archivi = db.leggiArchivi ? await db.leggiArchivi() : [];
  archivi.forEach((m) => (m.terminiUsati || []).forEach((x) => usati.add(K(x[1]))));
  return {
    fonti: fontiBase().map((F) => ({ f: F.f, gruppo: F.gruppo, it: F.it, colore: F.colore, termini: applica(F.base, mod[F.f]).map((x) => x.concat([usati.has(x[3])])) })),
    tolti: Object.fromEntries(fontiBase().map((F) => [F.f, F.base.filter((x) => (mod[F.f] && (mod[F.f].via || []).indexOf(K(x[0])) >= 0)).map((x) => [x[0], x[1], K(x[0])])]))
  };
}
function pulisci(t, d) {
  t = String(t || '').replace(/\s+/g, ' ').trim(); d = String(d || '').replace(/\s+/g, ' ').trim();
  if (t.length < 2 || t.length > 60) err('Il termine deve avere da 2 a 60 caratteri.');
  if (d.length < 15 || d.length > 220) err('La definizione deve avere da 15 a 220 caratteri: ' + t + '.');
  return [t, d];
}
/* cerca un doppione in tutte le fonti e nel glossario 2026/27 (salta la voce che si sta correggendo) */
function doppione(mod, t, d, salta) {
  const elenco = [];
  fontiBase().forEach((F) => applica(F.base, mod[F.f]).forEach((x) => { if (!(salta && salta.f === F.f && salta.k === x[3])) elenco.push({ termine: x[0], def: x[1], dove: F.it + ' (' + F.gruppo + ')' }); }));
  DATI.AREE.forEach((a) => (DATI.TERMINI[a.n] || []).forEach((x, k) => elenco.push({ termine: x[0], def: ((DATI.DEFINIZIONI[a.n] || [])[k] || [''])[0], dove: 'glossario 2026/27 (3E e 3F)' })));
  return SIM.trovaSimile(t, d, elenco);
}
async function salva(db, { codice, op, fonte, k, t, d, righe, forza }) {
  await soloCerrato(db, codice);
  const F = fontiBase().find((x) => x.f === fonte);
  if (!F) err('Area non trovata.');
  const mod = JSON.parse(JSON.stringify(await leggiMod(db, true)));
  const m = mod[fonte] = mod[fonte] || {};
  m.agg = m.agg || []; m.via = m.via || []; m.cor = m.cor || {};
  const inBase = (kk) => F.base.some((x) => K(x[0]) === kk);
  const out = { aggiunti: 0, saltati: [] };
  const aggiungi = (tt, dd) => {
    const [a, b] = pulisci(tt, dd), s = forza ? null : doppione(mod, a, b);
    if (s) return out.saltati.push({ t: a, simile: s.termine, dove: s.dove, motivo: s.motivo });
    m.agg.push([a, b]); out.aggiunti++;
  };
  if (op === 'agg') { aggiungi(t, d); if (out.saltati.length) { const s = out.saltati[0]; err('Esiste già un termine simile: «' + s.simile + '» in ' + s.dove + ' (' + s.motivo + ').'); } }
  else if (op === 'aggmolti') {
    if (!Array.isArray(righe) || !righe.length) err('Nessun termine da aggiungere.');
    if (righe.length > 200) err('Al massimo 200 termini alla volta.');
    righe.forEach((r) => { try { aggiungi(r[0], r[1]); } catch (e) { out.saltati.push({ t: String(r[0] || ''), motivo: e.message }); } });
  } else if (op === 'cor') {
    const [a, b] = pulisci(t, d), s = forza ? null : doppione(mod, a, b, { f: fonte, k });
    if (s) err('Esiste già un termine simile: «' + s.simile + '» in ' + s.dove + ' (' + s.motivo + ').');
    const i = m.agg.findIndex((x) => K(x[0]) === k);
    if (i >= 0) m.agg[i] = [a, b];
    else if (inBase(k)) m.cor[k] = [a, b];
    else err('Termine non trovato: ricarica la pagina.');
  } else if (op === 'via') {
    const i = m.agg.findIndex((x) => K(x[0]) === k);
    if (i >= 0) m.agg.splice(i, 1);
    else if (inBase(k)) { delete m.cor[k]; if (m.via.indexOf(k) < 0) m.via.push(k); }
    else err('Termine non trovato: ricarica la pagina.');
  } else if (op === 'ripristina') {
    m.via = m.via.filter((x) => x !== k); delete m.cor[k];
  } else err('Operazione non valida.');
  if (!m.agg.length) delete m.agg; if (!m.via.length) delete m.via; if (!Object.keys(m.cor).length) delete m.cor;
  if (!Object.keys(m).length) delete mod[fonte];
  await db.scriviBanca({ mod, aggiornata: new Date().toISOString() });
  cache = mod; cacheT = Date.now();
  return out;
}
module.exports = { soloCerrato, elenchi, conteggi, banca, salva, fontiBase, applica, K };
