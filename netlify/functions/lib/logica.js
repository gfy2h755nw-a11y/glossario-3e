/**
 * Logica del Glossario 3E – modalità "scegli la definizione tra 8".
 * Le risposte giuste restano sul server: agli alunni arrivano solo le lettere A–H con i testi.
 * Il database è passato come "db": leggiTutto(), scriviConfig(mod), esisteGlossario(),
 * creaGlossario(config, alunni, termini), transazione(fn) con ctx.leggiTutto() / ctx.scriviTermine(id, mod).
 */
const DATI = require('./dati');

const N_OPZIONI = 8;
const LETTERE = 'ABCDEFGH';

class ErroreUtente extends Error {}
const errore = (m) => { throw new ErroreUtente(m); };

function norm(s) { return String(s == null ? '' : s).trim().toUpperCase(); }
function pulisci(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 300); }
function pad2(n) { return ('0' + n).slice(-2); }
function adesso() {
  return new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    .format(new Date()).replace(',', '');
}
function generaCodice(usati) {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const crypto = require('crypto');
  let c;
  do {
    c = '';
    const b = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) c += alfabeto[b[i] % alfabeto.length];
  } while (usati && usati.has(c));
  if (usati) usati.add(c);
  return c;
}

/* ---------- alternative: la giusta + 7 termini vicini della stessa area, ordine fisso per termine e lingua ---------- */
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function indiceTermine(t) { return Number(String(t.id).slice(2)) - 1; }
function opzioni(t, l) {
  const k = indiceTermine(t), n = DATI.DEFINIZIONI[t.area].length;
  const cand = [], d = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7, 8, -8, 9, -9];
  for (let i = 0; i < d.length && cand.length < N_OPZIONI - 1; i++) { const j = k + d[i]; if (j >= 0 && j < n) cand.push(j); }
  const ops = [k].concat(cand), r = rng(hash(t.id + l));
  for (let x = ops.length - 1; x > 0; x--) { const y = Math.floor(r() * (x + 1)); [ops[x], ops[y]] = [ops[y], ops[x]]; }
  return ops;
}
function testoDef(area, idx, l) { const d = DATI.DEFINIZIONI[area][idx]; return d ? d[l === 'it' ? 0 : 1] : ''; }
function giusta(t) { return indiceTermine(t); }

/* ---------- identità ---------- */
function identifica(stato, codice) {
  const c = norm(codice);
  if (!c) errore('Inserisci il tuo codice.');
  const doc = (stato.config.docenti || []).find((d) => d.codice && norm(d.codice) === c);
  if (doc) return { ruolo: 'docente', nome: doc.nome, lingua: doc.lingua || 'it' };
  const a = stato.alunni.find((x) => norm(x.codice) === c);
  if (a) return { ruolo: 'alunno', id: a.id, nome: a.nome, gruppo: String(a.gruppo) };
  errore('Codice non riconosciuto. Controlla di averlo scritto bene.');
}

/* ---------- cosa vede chi ---------- */
function campo(t, l, nome) { return t[nome + '_' + l]; }
function vistaTermine(t, chi) {
  const base = { id: t.id, area: Number(t.area), it: t.termine_it, en: t.termine_en, alunno: t.alunno_id, agg: t.aggiornato || '' };
  const mio = chi.ruolo === 'alunno' && t.alunno_id === chi.id;
  ['it', 'en'].forEach((l) => {
    const L = l === 'it' ? 'It' : 'En';
    const st = campo(t, l, 'stato') || '', sc = campo(t, l, 'scelta');
    base['stato' + L] = st;
    base['da' + L] = campo(t, l, 'da') || '';
    // testo approvato: lo vedono tutti (serve per il cartellone)
    base['def' + L] = st === 'approvata' && sc != null ? testoDef(t.area, sc, l) : '';
    if (chi.ruolo === 'docente') {
      base['scelta' + L] = sc != null ? testoDef(t.area, sc, l) : '';
      base['ok' + L] = sc != null ? sc === giusta(t) : null;
      base['giusta' + L] = testoDef(t.area, giusta(t), l);
      base['comm' + L] = campo(t, l, 'commento') || '';
      base['tent' + L] = campo(t, l, 'tent') || 0;
      base['primoOk' + L] = campo(t, l, 'primo_ok');
      if (st === 'inviata') base['def' + L] = base['scelta' + L];
    } else if (mio) {
      base['comm' + L] = campo(t, l, 'commento') || '';
      const sbloccata = l === 'it' || t.stato_it === 'approvata';
      if (sbloccata) {
        const ops = opzioni(t, l), scartate = campo(t, l, 'scartate') || [];
        base['opz' + L] = ops.map((idx, i) => ({ l: LETTERE[i], t: testoDef(t.area, idx, l), no: scartate.indexOf(idx) >= 0 }));
        base['scelta' + L] = sc != null ? LETTERE[ops.indexOf(sc)] : null;
      }
    }
  });
  return base;
}

function pacchetto(stato, chi) {
  let termini = stato.termini;
  if (chi.ruolo === 'alunno') termini = termini.filter((t) => String(t.area) === chi.gruppo);
  const out = {
    utente: chi,
    config: { chiusa: !!stato.config.chiusa, tappe: stato.config.tappe || [], docenti: (stato.config.docenti || []).map((d) => d.nome) },
    aree: DATI.AREE,
    alunni: stato.alunni.map((a) => ({ id: a.id, nome: a.nome, gruppo: String(a.gruppo) })),
    termini: termini.map((t) => vistaTermine(t, chi))
  };
  if (chi.ruolo === 'docente') out.codiciAlunni = stato.alunni.map((a) => ({ id: a.id, nome: a.nome, gruppo: String(a.gruppo), codice: a.codice }));
  return out;
}

function trova(stato, id) { const t = stato.termini.find((x) => x.id === String(id)); if (!t) errore('Termine non trovato.'); return t; }
function lingua(l) { if (l !== 'it' && l !== 'en') errore('Lingua non valida.'); }
function soloDocente(chi) { if (chi.ruolo !== 'docente') errore('Operazione riservata ai docenti.'); }

/* ---------- azioni ---------- */
async function login(db, { codice }) {
  const stato = await db.leggiTutto();
  return pacchetto(stato, identifica(stato, codice));
}

async function scegli(db, { codice, id, lingua: l, lettera }) {
  return db.transazione(async (tx) => {
    const stato = await (tx.leggiTermine ? tx.leggiTermine(id) : tx.leggiTutto());
    const chi = identifica(stato, codice);
    if (chi.ruolo !== 'alunno') errore('Solo gli alunni scelgono le definizioni.');
    if (stato.config.chiusa) errore("L'app è chiusa: le scelte non sono più modificabili.");
    lingua(l);
    const t = trova(stato, id);
    if (t.alunno_id !== chi.id) errore('Questo termine non è assegnato a te.');
    if (l === 'en' && t.stato_it !== 'approvata') errore("L'inglese si sblocca dopo l'approvazione dell'italiano.");
    const st = campo(t, l, 'stato') || '';
    if (st === 'approvata') errore('Scelta già approvata: non è più modificabile.');
    const i = LETTERE.indexOf(norm(lettera));
    if (i < 0) errore('Seleziona una delle 8 definizioni.');
    const idx = opzioni(t, l)[i];
    if ((campo(t, l, 'scartate') || []).indexOf(idx) >= 0) errore('Questa definizione è già stata scartata: scegline un\'altra.');
    if (st === 'inviata' && campo(t, l, 'scelta') === idx) errore('Hai già inviato questa scelta.');
    const mod = { ['scelta_' + l]: idx, ['stato_' + l]: 'inviata', aggiornato: adesso() };
    if (st !== 'inviata') mod['tent_' + l] = (campo(t, l, 'tent') || 0) + 1;
    if (campo(t, l, 'primo_ok') == null) mod['primo_ok_' + l] = idx === giusta(t);
    tx.scriviTermine(t.id, mod);
    return vistaTermine(Object.assign({}, t, mod), chi);
  });
}

async function revisiona(db, { codice, id, lingua: l, esito, commento }) {
  return db.transazione(async (tx) => {
    const stato = await (tx.leggiTermine ? tx.leggiTermine(id) : tx.leggiTutto());
    const chi = identifica(stato, codice); soloDocente(chi); lingua(l);
    const t = trova(stato, id);
    const sc = campo(t, l, 'scelta'), st = campo(t, l, 'stato') || '';
    const mod = { aggiornato: adesso() };
    if (esito === 'approvata') {
      if (sc == null) errore("L'alunno non ha ancora scelto.");
      if (l === 'en' && t.stato_it !== 'approvata') errore("Approva prima l'italiano.");
      Object.assign(mod, { ['stato_' + l]: 'approvata', ['da_' + l]: chi.nome, ['commento_' + l]: pulisci(commento) });
    } else if (esito === 'correggere') {
      if (st !== 'inviata' || sc == null) errore('Si può rimandare solo una scelta inviata.');
      const scartate = (campo(t, l, 'scartate') || []).slice();
      if (scartate.indexOf(sc) < 0) scartate.push(sc);
      Object.assign(mod, { ['stato_' + l]: 'correggere', ['scelta_' + l]: null, ['scartate_' + l]: scartate, ['commento_' + l]: pulisci(commento), ['da_' + l]: '' });
    } else if (esito === 'riapri') {
      if (st !== 'approvata') errore('La scelta non è approvata.');
      Object.assign(mod, { ['stato_' + l]: 'inviata', ['da_' + l]: '' });
      if (l === 'it' && t.stato_en === 'approvata') Object.assign(mod, { stato_en: 'inviata', da_en: '' });
    } else errore('Esito non valido.');
    tx.scriviTermine(t.id, mod);
    return vistaTermine(Object.assign({}, t, mod), chi);
  });
}

async function approvaCorrette(db, { codice, lingua: l, area }) {
  return db.transazione(async (tx) => {
    const stato = await tx.leggiTutto();
    const chi = identifica(stato, codice); soloDocente(chi); lingua(l);
    let n = 0;
    stato.termini.forEach((t) => {
      if (area && area !== 'tutte' && String(t.area) !== String(area)) return;
      if (campo(t, l, 'stato') === 'inviata' && campo(t, l, 'scelta') === giusta(t) && (l === 'it' || t.stato_it === 'approvata')) {
        tx.scriviTermine(t.id, { ['stato_' + l]: 'approvata', ['da_' + l]: chi.nome, aggiornato: adesso() });
        n++;
      }
    });
    return { approvate: n };
  });
}

async function impostaChiusura(db, { codice, chiusa }) {
  const stato = await db.leggiTutto();
  soloDocente(identifica(stato, codice));
  await db.scriviConfig({ chiusa: !!chiusa });
  return { chiusa: !!chiusa };
}

function terminiIniziali() {
  const termini = [];
  DATI.AREE.forEach((area) => {
    DATI.TERMINI[area.n].forEach((tt, k) => {
      const t = {
        id: 'T' + area.n + pad2(k + 1), area: String(area.n), termine_it: tt[0], termine_en: tt[1],
        alunno_id: 'A' + pad2((area.n - 1) * 4 + Math.floor(k / 5) + 1), aggiornato: ''
      };
      ['it', 'en'].forEach((l) => Object.assign(t, { ['scelta_' + l]: null, ['stato_' + l]: '', ['commento_' + l]: '', ['tent_' + l]: 0, ['primo_ok_' + l]: null, ['scartate_' + l]: [], ['da_' + l]: '' }));
      termini.push(t);
    });
  });
  return termini;
}

async function setup(db, { chiave }, chiaveAttesa) {
  if (!chiaveAttesa) errore('Variabile SETUP_KEY non impostata su Netlify.');
  if (String(chiave || '') !== chiaveAttesa) errore('Chiave di configurazione errata.');
  if (await db.esisteGlossario()) errore('Il glossario è già configurato. Per ricominciare, cancella le raccolte in Firestore.');
  const usati = new Set();
  const config = {
    chiusa: false,
    docenti: DATI.DOCENTI.map((d) => ({ nome: d.nome, lingua: d.lingua, codice: generaCodice(usati) })),
    tappe: DATI.TAPPE
  };
  const alunni = DATI.NOMI_ALUNNI.map((nome, i) => ({ id: 'A' + pad2(i + 1), nome, gruppo: String(Math.floor(i / 4) + 1), codice: generaCodice(usati) }));
  const termini = terminiIniziali();
  await db.creaGlossario(config, alunni, termini);
  return { docenti: config.docenti.map((d) => ({ nome: d.nome, codice: d.codice })), alunni: alunni.length, termini: termini.length };
}

module.exports = { login, scegli, revisiona, approvaCorrette, impostaChiusura, setup, ErroreUtente, opzioni, terminiIniziali };
