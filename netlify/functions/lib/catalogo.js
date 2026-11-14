/**
 * Catalogo dei termini dell'edizione in corso: per ogni area l'elenco [termine, definizione corretta].
 * L'edizione 2026/27 (3E e 3F) usa i dati di dati.js; le edizioni nuove e le classi aggiunte
 * salvano il catalogo in config.catalogo, con config.blocchi = punti di inizio dei termini aggiunti in seguito.
 * Le alternative di ogni domanda si prendono dentro il blocco del termine (se il blocco è piccolo, anche da quelli precedenti):
 * aggiungere termini non cambia mai le domande già assegnate.
 * Il catalogo attivo si imposta a ogni lettura della configurazione (Netlify esegue una richiesta alla volta per istanza).
 */
const DATI = require('./dati');
const EN = require('./inglese'); // traduzioni in inglese tecnico dei termini senza inglese in dati.js e della banca

let attivo = null; // { cat, blocchi }

function daDati() {
  const cat = {};
  DATI.AREE.forEach((a) => { cat[a.n] = DATI.TERMINI[a.n].map((t, k) => [t[0], (DATI.DEFINIZIONI[a.n][k] || [''])[0], t[1] || (EN[t[0]] || [])[0] || '', (DATI.DEFINIZIONI[a.n][k] || ['', ''])[1] || (EN[t[0]] || [])[1] || '']); });
  return cat;
}
function imposta(config) {
  attivo = config && config.catalogo ? { cat: config.catalogo, blocchi: config.blocchi || {} } : null;
}
function corrente() { return attivo; }
function ripristina(prec) { attivo = prec; }
/* esegue fn (sincrona) con il catalogo di un'altra configurazione, poi rimette quello di prima */
function con(config, fn) {
  const prec = attivo; imposta(config);
  try { return fn(); } finally { attivo = prec; }
}
function area(n) {
  if (attivo && attivo.cat[n]) return attivo.cat[n];
  return null;
}
function lunghezza(n) { const a = area(n); return a ? a.length : DATI.DEFINIZIONI[n].length; }
function definizione(n, idx, l) {
  const a = area(n);
  if (a) { const x = a[idx]; return x ? (l === 'en' ? (x[3] || (EN[x[0]] || [])[1] || '') : (x[1] || '')) : ''; }
  const d = DATI.DEFINIZIONI[n][idx]; if (!d) return '';
  return l === 'it' ? d[0] : (d[1] || (EN[(DATI.TERMINI[n][idx] || [])[0]] || [])[1] || '');
}
/* termine inglese della voce k (correzioni del docente nel catalogo, poi dati.js, poi traduzioni pronte) */
function termineEn(n, k) {
  const a = area(n);
  if (a) { const x = a[k]; return x ? (x[2] || (EN[x[0]] || [])[0] || '') : ''; }
  const t = DATI.TERMINI[n][k]; return t ? (t[1] || (EN[t[0]] || [])[0] || '') : '';
}
function traduzionePronta(it) { return EN[it] || null; }
/* intervallo [da, a) del blocco a cui appartiene l'indice k */
function blocco(n, k) {
  const b = (attivo && attivo.blocchi && attivo.blocchi[n]) || [];
  let da = 0, a = lunghezza(n);
  b.forEach((x) => { if (x <= k && x > da) da = x; if (x > k && x < a) a = x; });
  return [da, a];
}
/* catalogo completo da salvare (materializza quello di dati.js se serve) */
function materializza(config) {
  if (config && config.catalogo) return { cat: JSON.parse(JSON.stringify(config.catalogo)), blocchi: JSON.parse(JSON.stringify(config.blocchi || {})) };
  return { cat: daDati(), blocchi: {} };
}
/* tutti i termini di una configurazione (per il controllo delle somiglianze) */
function elencoTermini(config, dove) {
  const { cat } = materializza(config); const out = [];
  Object.keys(cat).forEach((n) => cat[n].forEach((x) => out.push({ area: Number(n), termine: x[0], def: x[1], dove })));
  return out;
}

module.exports = { termineEn, traduzionePronta, imposta, corrente, ripristina, con, lunghezza, definizione, blocco, materializza, elencoTermini, daDati };
