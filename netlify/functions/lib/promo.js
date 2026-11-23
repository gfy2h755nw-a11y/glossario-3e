/* Pagina di presentazione per i colleghi (/scopri?c=CODICE) e sezione «Promo App» del prof. Cerrato.
 * Un solo documento Firestore (config/_promo): { codice, creato, visite: [{ nome, cognome, prima, ultima, volte }] }.
 * Il collega entra con il link (che contiene il codice) scrivendo nome e cognome: la visita viene registrata. */
const crypto = require('crypto');
const L = require('./logica');
const { soloCerrato } = require('./banca');
const MAX_VISITE = 500;
const VALIDI_MS = 60 * 60 * 1000; // numeri ricalcolati al massimo una volta l'ora (ogni calcolo legge tutti i dati)

/* numeri reali di tutte le attività in corso (esclusa quella in preparazione): solo totali, nessun nome */
async function calcolaNumeri() {
  const { db: apri } = require('./firestore'), ATT = require('./attivita');
  const base = apri('main'), reg = (await base.leggiRegistro()).filter((x) => !x.bozza);
  const spazi = ['main'].concat(reg.map((x) => x.id)), now = Date.now();
  const classi = new Set(); let alunni = 0, termini = 0, approvate = 0, minuti = 0;
  for (const id of spazi) {
    const d = apri(id), st = await d.leggiTutto(), att = (d.leggiAttivita ? await d.leggiAttivita() : null) || {};
    if (st.config && st.config.bozza) continue;
    (st.alunni || []).forEach((a) => { alunni++; classi.add(a.classe || '3E'); minuti += ATT.riepilogo(att[a.id], now).minuti; });
    (st.termini || []).filter((t) => !t.ereditato).forEach((t) => { termini++; if (t.stato_it === 'approvata') approvate++; });
  }
  return { classi: classi.size, alunni, termini, approvate, perc: termini ? Math.round(approvate / termini * 100) : 0, minuti, aggiornato: new Date(now).toISOString() };
}
async function numeri(db, P, forza) {
  P = P || await leggi(db);
  if (!forza && P.numeri && Date.now() - Date.parse(P.numeri.aggiornato) < VALIDI_MS) return P.numeri;
  const n = await calcolaNumeri();
  await db.scriviPromo(Object.assign({}, await leggi(db), { numeri: n }));
  return n;
}
function codiceGiusto(P, c) { if (!P.codice || String(c || '').trim().toUpperCase() !== P.codice) L.errore('Il link non è più valido: chiedi al prof. Cerrato quello aggiornato.'); }
/* la pagina chiede i numeri (anche a chi è già entrato da quel dispositivo) */
async function numeriPubblici(db, { c }) { const P = await leggi(db); codiceGiusto(P, c); return { numeri: await numeri(db, P) }; }
const nuovoCodice = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const b = crypto.randomBytes(8); for (let i = 0; i < 8; i++) s += A[b[i] % A.length]; return s; };
const pulisci = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const titolo = (s) => pulisci(s).toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

async function leggi(db) { return (await db.leggiPromo()) || {}; }
/* il collega entra: codice giusto + nome e cognome */
async function entra(db, { c, nome, cognome }) {
  const P = await leggi(db);
  codiceGiusto(P, c);
  const n = titolo(nome), co = titolo(cognome);
  if (n.length < 2 || co.length < 2 || n.length > 40 || co.length > 40) L.errore('Scrivi nome e cognome.');
  const ora = new Date().toISOString(), V = P.visite || [];
  const k = (n + ' ' + co).toLowerCase(), x = V.find((v) => (v.nome + ' ' + v.cognome).toLowerCase() === k);
  if (x) { x.ultima = ora; x.volte = (x.volte || 1) + 1; } else V.push({ nome: n, cognome: co, prima: ora, ultima: ora, volte: 1 });
  V.sort((a, b) => (a.ultima < b.ultima ? 1 : -1));
  await db.scriviPromo(Object.assign({}, P, { visite: V.slice(0, MAX_VISITE) }));
  return { ok: true, numeri: await numeri(db) };
}
/* tempo passato sulla pagina dal collega (pagina in primo piano), e ritorno dallo stesso dispositivo */
async function tempo(db, { c, nome, cognome, sec, nuova }) {
  const P = await leggi(db);
  codiceGiusto(P, c);
  const k = (titolo(nome) + ' ' + titolo(cognome)).toLowerCase(), V = P.visite || [], x = V.find((v) => (v.nome + ' ' + v.cognome).toLowerCase() === k);
  // tolto dall'elenco ma torna sulla pagina dallo stesso dispositivo: ricompare come nuova visita
  if (!x) {
    if (!nuova) return { ok: false };
    const n = titolo(nome), co = titolo(cognome); if (n.length < 2 || co.length < 2) return { ok: false };
    const ora = new Date().toISOString(); V.unshift({ nome: n, cognome: co, prima: ora, ultima: ora, volte: 1 });
    await db.scriviPromo(Object.assign({}, P, { visite: V.slice(0, MAX_VISITE) }));
    return { ok: true };
  }
  const s = Math.round(Number(sec) || 0);
  if (s > 0 && s <= 3600) x.secondi = (x.secondi || 0) + s;
  if (nuova) { x.volte = (x.volte || 1) + 1; x.ultima = new Date().toISOString(); V.sort((a, b) => (a.ultima < b.ultima ? 1 : -1)); }
  if (!(s > 0) && !nuova) return { ok: true };
  await db.scriviPromo(Object.assign({}, P, { visite: V }));
  return { ok: true };
}
/* togli un collega dall'elenco delle visite (solo il prof. Cerrato) */
async function togli(db, { codice, nome, cognome }) {
  await soloCerrato(db, codice);
  const P = await leggi(db), k = (titolo(nome) + ' ' + titolo(cognome)).toLowerCase();
  const V = (P.visite || []).filter((v) => (v.nome + ' ' + v.cognome).toLowerCase() !== k);
  if (V.length === (P.visite || []).length) L.errore('Collega non trovato nell\'elenco.');
  await db.scriviPromo(Object.assign({}, P, { visite: V }));
  return { visite: V };
}
/* sezione «Promo App»: codice (creato la prima volta) e visite */
async function stato(db, { codice }) {
  await soloCerrato(db, codice);
  let P = await leggi(db);
  if (!P.codice) { P = Object.assign({}, P, { codice: nuovoCodice(), creato: new Date().toISOString(), visite: P.visite || [] }); await db.scriviPromo(P); }
  return { codice: P.codice, creato: P.creato, visite: P.visite || [], numeri: P.numeri || null };
}
/* «Aggiorna ora» dalla sezione Promo App */
async function aggiornaNumeri(db, { codice }) { await soloCerrato(db, codice); return { numeri: await numeri(db, null, true) }; }
/* nuovo codice: il link vecchio smette di funzionare; le visite restano */
async function cambiaCodice(db, { codice }) {
  await soloCerrato(db, codice);
  const P = await leggi(db);
  const nuovo = Object.assign({}, P, { codice: nuovoCodice(), creato: new Date().toISOString(), visite: P.visite || [] });
  await db.scriviPromo(nuovo);
  return { codice: nuovo.codice, creato: nuovo.creato, visite: nuovo.visite };
}
module.exports = { entra, tempo, togli, stato, cambiaCodice, numeriPubblici, aggiornaNumeri, calcolaNumeri };
