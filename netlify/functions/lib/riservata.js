/* ---------- glossario riservato (24/11/2026) ----------
 * Pagina segreta /r/CODICE per i docenti di sostegno: tutti i termini approvati di tutte le attività del prof. Cerrato
 * (3E e 3F, 4E e qualunque altra; escluse quelle date in concessione ai colleghi), con la ricerca. Niente nomi di studenti.
 * Si entra dal link (il codice è dentro) scrivendo nome e cognome: ogni ingresso viene registrato con data, ora e tempo.
 * Un solo documento Firestore (config/_riservata nell'attività principale):
 *   { attiva, codice, creato, visite: [{ nome, cognome, prima, ultima, volte, secondi, accessi: [{ il, sec }] }] } */
const crypto = require('crypto');
const L = require('./logica');
const { soloCerrato } = require('./banca');
const { db: apri } = require('./firestore');

const MAX_VISITE = 300, MAX_ACCESSI = 60;
const pulisci = (s) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim();
const titolo = (s) => pulisci(s).toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const nuovoCodice = () => { const A = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; const b = crypto.randomBytes(10); for (let i = 0; i < 10; i++) s += A[b[i] % A.length]; return s; };
const base = () => apri('main');
async function leggi() { return (await base().leggiRiservata()) || {}; }
async function scrivi(R) { await base().scriviRiservata(R); }
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));
async function codiceGiusto(R, k) {
  if (!R.attiva || !R.codice || String(k || '').trim().toLowerCase() !== R.codice) { await attesa(process.env.TEST_ORA ? 0 : 700); L.errore('Pagina non disponibile: il link non è attivo. Chiedi al docente referente.'); }
}
const chiave = (n, c) => (titolo(n) + ' ' + titolo(c)).toLowerCase();

/* i termini approvati di tutte le attività (in memoria per un minuto: ogni lettura legge tutti i dati) */
let cache = { t: 0, dati: null };
async function glossari(forza) {
  if (!forza && cache.dati && Date.now() - cache.t < 60000) return cache.dati;
  const b = base(), reg = await b.leggiRegistro(), out = [];
  for (const id of ['main'].concat(reg.map((x) => x.id))) {
    const st = await apri(id).leggiTutto();
    if (!st.config || st.config.concessione) continue; // attività date ai colleghi: non sono del prof. Cerrato
    const P = L.pubblicoDa(st), imp = L.impostazioni(st.config);
    const termini = [];
    P.aree.forEach((a) => a.termini.forEach((t) => { if (t.def) termini.push({ t: t.termine, d: t.def, a: a.n }); }));
    if (!termini.length && id !== 'main') continue;
    termini.sort((x, y) => x.t.localeCompare(y.t, 'it'));
    out.push({ id, nome: (L.edizioneDi(st.config) || {}).nome || 'Glossario', classi: imp.classi, as: (imp.edizione || {}).as || '', aree: P.aree.map((a) => ({ n: a.n, it: a.it, colore: a.colore })), termini });
  }
  cache = { t: Date.now(), dati: out };
  return out;
}

/* il collega entra: link giusto + nome e cognome → un accesso registrato e i glossari */
async function entra(_d, { k, nome, cognome }) {
  const R = await leggi(); await codiceGiusto(R, k);
  const n = titolo(nome), c = titolo(cognome);
  if (n.length < 2 || c.length < 2 || n.length > 40 || c.length > 40) L.errore('Scrivi nome e cognome.');
  const ora = new Date().toISOString(), V = R.visite || [], kk = chiave(n, c);
  let x = V.find((v) => chiave(v.nome, v.cognome) === kk);
  if (!x) { x = { nome: n, cognome: c, prima: ora, ultima: ora, volte: 0, secondi: 0, accessi: [] }; V.push(x); }
  x.ultima = ora; x.volte = (x.volte || 0) + 1; x.accessi = (x.accessi || []).concat([{ il: ora, sec: 0 }]).slice(-MAX_ACCESSI);
  V.sort((a, b) => (a.ultima < b.ultima ? 1 : -1));
  await scrivi(Object.assign({}, R, { visite: V.slice(0, MAX_VISITE) }));
  return { accesso: ora, nome: n, cognome: c, glossari: await glossari() };
}
/* tempo sulla pagina (solo con la pagina in primo piano), sommato all'accesso in corso */
async function tempo(_d, { k, nome, cognome, accesso, sec }) {
  const R = await leggi(); await codiceGiusto(R, k);
  const s = Math.round(Number(sec) || 0); if (!(s > 0 && s <= 3600)) return { ok: true };
  const V = R.visite || [], x = V.find((v) => chiave(v.nome, v.cognome) === chiave(nome, cognome)); if (!x) return { ok: false };
  const a = (x.accessi || []).find((y) => y.il === accesso) || (x.accessi || []).slice(-1)[0];
  if (a) a.sec = (a.sec || 0) + s;
  x.secondi = (x.secondi || 0) + s;
  await scrivi(Object.assign({}, R, { visite: V }));
  return { ok: true };
}
/* sezione «Glossario riservato» (solo il prof. Cerrato) */
async function stato(_d, { codice }) {
  await soloCerrato(base(), codice);
  let R = await leggi();
  if (!R.codice) { R = Object.assign({ attiva: false, visite: [] }, R, { codice: nuovoCodice(), creato: new Date().toISOString() }); await scrivi(R); }
  const G = await glossari(true);
  return { attiva: !!R.attiva, codice: R.codice, creato: R.creato, visite: R.visite || [], glossari: G.map((g) => ({ nome: g.nome, classi: g.classi, termini: g.termini.length })) };
}
async function imposta(_d, { codice, attiva }) {
  await soloCerrato(base(), codice);
  const R = await leggi(); if (!R.codice) L.errore('Apri prima la sezione Glossario riservato.');
  await scrivi(Object.assign({}, R, { attiva: !!attiva, [attiva ? 'pubblicata' : 'ritirata']: new Date().toISOString() }));
  return stato(_d, { codice });
}
/* nuovo codice: il link vecchio smette subito di funzionare; le visite restano */
async function cambiaCodice(_d, { codice }) {
  await soloCerrato(base(), codice);
  const R = await leggi();
  await scrivi(Object.assign({ visite: [] }, R, { codice: nuovoCodice(), creato: new Date().toISOString() }));
  return stato(_d, { codice });
}
async function togli(_d, { codice, nome, cognome }) {
  await soloCerrato(base(), codice);
  const R = await leggi(), V = (R.visite || []).filter((v) => chiave(v.nome, v.cognome) !== chiave(nome, cognome));
  if (V.length === (R.visite || []).length) L.errore('Collega non trovato nell\'elenco.');
  await scrivi(Object.assign({}, R, { visite: V }));
  return stato(_d, { codice });
}
module.exports = { entra, tempo, stato, imposta, cambiaCodice, togli, glossari };
