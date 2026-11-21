/**
 * Demo per i colleghi: un'attività di prova per ogni collega, con dati inventati e tutte le fasi «vive»
 * (scritto in corso e concluso, quiz, interrogazioni programmate e svolte, tempi e ripasso), un codice docente
 * valido solo lì e una pagina pubblica di prova. Si cancella da sola dopo 14 giorni.
 * Resta fuori da tutto il resto: elenco delle attività, pagina pubblica principale, numeri della pagina promo, Dropbox.
 */
const crypto = require('crypto');
const L = require('./logica');
const ED = require('./edizioni');
const CAT = require('./catalogo');
const { db: apri } = require('./firestore');

const GIORNI = 14;
const NOMI_A = ['Bassi Chiara', 'Colombo Andrea', 'Esposito Aurora', 'Fabbri Leonardo', 'Gentile Sofia', 'Leone Matteo', 'Mancini Giorgia', 'Pellegrini Tommaso'];
const NOMI_B = ['Rizzi Alice', 'Sartori Davide', 'Testa Emma', 'Valentini Lorenzo', 'Vitale Beatrice', 'Zanella Nicolò', 'Donati Gaia', 'Marchi Riccardo'];
const err = (m) => L.errore(m);

function casuale(seme) { let h = 2166136261; for (const c of String(seme)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
const fmt = (ms) => { const p = Object.fromEntries(new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(ms)).map((x) => [x.type, x.value])); return p.day + '/' + p.month + '/' + p.year + ' ' + p.hour + ':' + p.minute; };
const giornoIso = (ms) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date(ms));

/* contenuto della demo (config, alunni, termini, registro dei tempi) costruito in memoria e scritto in una volta */
async function contenuto(base, id, nome, codiciUsati, now) {
  const D = (g, h) => now + g * 86400000 + (h || 0) * 3600000, iso = (ms) => new Date(ms).toISOString();
  const E = await require('./banca').elenchi(base);
  const termini = {}; [1, 2, 3, 4].forEach((n) => { termini[n] = (E['banca:' + n] || []).slice(0, 16); if (termini[n].length < 16) err('Banca termini insufficiente per la demo.'); });
  const p = { nome: 'Demo · ' + nome, as: '2026/27', termini, regole: null,
    classi: [{ nome: '3A', tpa: 4, modo: 'misto', alunni: NOMI_A.map((n) => ({ nome: n })), partenza: iso(D(-9)), scadenza: iso(D(1)) },
      { nome: '3B', tpa: 4, modo: 'misto', alunni: NOMI_B.map((n) => ({ nome: n })), partenza: iso(D(-3)), scadenza: iso(D(4)) }] };
  const vuoto = { config: { docenti: [] }, alunni: [], termini: [] };
  const { config, alunni, docs } = ED.costruisci(vuoto, p, codiciUsati);
  delete config.docenti;
  config.edizione = Object.assign({}, config.edizione, { id: 'demo-' + id });
  // 3A: scritto concluso due giorni fa, quiz aperto; 3B: scritto in corso
  config.calendario = Object.assign({}, config.calendario || {}, { '3A': Object.assign({}, (config.calendario || {})['3A'] || {}, { partenza: iso(D(-9)), scadenzaIt: iso(D(-2)) }) });
  config.quiz = { soglia: 30, scadenze: { '3A': iso(D(5)), '3B': null }, partenze: { '3A': iso(D(-2)), '3B': null } };
  config.demo = { nome, creata: iso(now), scade: iso(D(GIORNI)) };
  CAT.imposta(config);
  const cat = CAT.materializza(config).cat, tutti = [];
  Object.keys(cat).forEach((a) => cat[a].forEach((x, k) => tutti.push({ a: Number(a), k, it: x[0] })));
  const classe = {}; alunni.forEach((a) => { classe[a.id] = a.classe; });
  const rnd = casuale(id);

  // scritto: risposte, approvazioni, rimandate (3A tutto consegnato; 3B a metà)
  docs.forEach((t, i) => {
    const k = L.indiceTermine(t), ops = L.opzioni(t, 'it'), sbagliata = ops.find((x) => x !== k), r = rnd(), cl = classe[t.alunno_id];
    const quando = cl === '3A' ? D(-8 + Math.floor(rnd() * 5), 15 + Math.floor(rnd() * 4)) : D(-3 + Math.floor(rnd() * 3), 15 + Math.floor(rnd() * 4));
    const at = fmt(quando), at2 = fmt(quando + 3600000 * 20);
    const giusta = { scelta_it: k, stato_it: 'approvata', da_it: 'prof. ' + nome, aggiornato: at, invii_it: 1, tent_it: 1, primo_ok_it: true, errori_it: 0, scartate_it: [], storia_it: [{ i: k, ok: true, at }] };
    const dopoErrore = { scelta_it: k, stato_it: 'approvata', da_it: 'prof. ' + nome, aggiornato: at2, invii_it: 2, tent_it: 2, primo_ok_it: false, errori_it: 1, scartate_it: [sbagliata], storia_it: [{ i: sbagliata, ok: false, at }, { i: k, ok: true, at: at2 }] };
    const inAttesa = { scelta_it: k, stato_it: 'inviata', aggiornato: at, invii_it: 1, tent_it: 1, primo_ok_it: true, errori_it: 0, scartate_it: [], storia_it: [{ i: k, ok: true, at }] };
    const rimandata = { scelta_it: sbagliata, stato_it: 'correggere', commento_it: 'Rileggi bene: manca il dettaglio principale.', da_it: 'prof. ' + nome, aggiornato: at, invii_it: 1, tent_it: 1, primo_ok_it: false, errori_it: 1, scartate_it: [sbagliata], storia_it: [{ i: sbagliata, ok: false, at }] };
    if (cl === '3A') Object.assign(t, r < 0.72 ? giusta : r < 0.94 ? dopoErrore : inAttesa);
    else if (r < 0.34) Object.assign(t, giusta);
    else if (r < 0.48) Object.assign(t, dopoErrore);
    else if (r < 0.64) Object.assign(t, inAttesa);
    else if (r < 0.76) Object.assign(t, rimandata);
  });

  // quiz, interrogazioni e tempi
  const A = alunni.filter((a) => a.classe === '3A'), attivita = [];
  const propri = (a) => new Set(docs.filter((t) => t.alunno_id === a.id).map((t) => t.area + '-' + L.indiceTermine(t)));
  const quiz = (n, sup) => {
    const scelti = tutti.slice().sort(() => rnd() - 0.5).slice(0, n), ok = {}; scelti.forEach((x) => { ok[x.a + '-' + x.k] = 1; });
    const ses = [0, 1, 2].slice(0, sup ? 3 : 2).map((g) => { const i = D(-2 + g, 16); return { i: iso(i), f: iso(i + 1500000), ms: 1500000, r: 18, c: 14, e: 4, s: 0, n: 14, p: 8 }; });
    return Object.assign({ ok, seq: 0, max: n, sessioni: ses, disp: ['telefono'], subentri: 0, pos: [] }, sup ? { superata: ses[ses.length - 1].f, msSup: ses.reduce((x, y) => x + y.ms, 0) } : {});
  };
  A.forEach((a, i) => {
    if (i <= 3) a.quiz = quiz(30, true);
    else if (i <= 5) a.quiz = quiz(10 + i * 3, false);
    else if (i === 6) a.quiz = quiz(5, false);
  });
  // interrogazione svolta (A0), due programmate (A1 domani, A2 tra tre giorni), A3 da programmare
  {
    const a = A[0], miei = propri(a), sc = tutti.filter((x) => !miei.has(x.a + '-' + x.k)).sort(() => rnd() - 0.5).slice(0, 10), esiti = [1, 1, 1, 0.5, 1, 1, 0, 1, 0.5, 1];
    const punti = esiti.reduce((x, y) => x + y, 0), voto = require('./orale').votoOrale(punti, false, config, 10);
    a.orale = { data: iso(D(-1, 10)), docente: 'prof. ' + nome, escluso: false, punti, voto, votoCalcolato: voto, manuale: false, cambi: 0, nota: '', domande: 10, bes: false, scelti: false, termini: sc.map((x, j) => ({ a: x.a, k: x.k, it: x.it, e: esiti[j] })) };
    a.orale_piano = { data: giornoIso(D(-1)), ora: 2, fissata: iso(D(-2, 18)) };
  }
  A[1].orale_piano = { data: giornoIso(D(1)), ora: 2, fissata: iso(D(-1, 17)) };
  A[2].orale_piano = { data: giornoIso(D(3)), ora: 4, fissata: iso(D(-1, 17)) };
  alunni.forEach((a, i) => {
    const giorni = a.classe === '3A' ? 9 : 3, ses = [];
    for (let g = 0; g < giorni; g++) { if (rnd() < 0.25) continue; const ini = D(-giorni + g, 15 + Math.floor(rnd() * 5)); ses.push({ inizio: iso(ini), fine: iso(ini + 60000 * (8 + Math.floor(rnd() * 30))), n: 10, disp: rnd() < 0.7 ? 'telefono' : 'computer' }); }
    if (!ses.length) return;
    const doc = { id: a.id, sessioni: ses, accessi: ses.length, risposte: 4, primo: ses[0].inizio, ultimo: ses[ses.length - 1].fine };
    if (a.orale_piano) { const pub = [0, 1].map((g) => { const ini = D(-1 + g * 0.5, 19); return { inizio: iso(ini), fine: iso(Math.min(ini + 60000 * (15 + Math.floor(rnd() * 20)), now - 60000)), n: 15, disp: 'telefono' }; }).filter((x) => Date.parse(x.fine) > Date.parse(x.inizio)); if (pub.length) { doc.pubblica = pub; doc.ultimoPubblica = pub[pub.length - 1].fine; } }
    attivita.push(doc);
  });
  // codici di prova per vedere l'app dal lato degli studenti
  const prova = [
    { codice: A[4].codice, nome: A[4].nome, cosa: 'quiz in corso (3A): app dello studente e pagina del quiz' },
    { codice: A[1].codice, nome: A[1].nome, cosa: 'quiz superato, interrogazione fissata: vede solo data e invito a esercitarsi' },
    { codice: A[3].codice, nome: A[3].nome, cosa: 'quiz superato, data non ancora fissata: vede solo i complimenti' },
    { codice: alunni.find((a) => a.classe === '3B').codice, nome: alunni.find((a) => a.classe === '3B').nome, cosa: 'scritto in corso (3B): termini da scegliere' }];
  config.demo.prova = prova;
  return { config, alunni, termini: docs, attivita, classi: config.classi, nome: p.nome };
}

async function codiciTutti(base) {
  const reg = await base.leggiRegistro(), out = await base.codiciAlunni();
  for (const x of reg) out.push(...await apri(x.id).codiciAlunni());
  return out;
}
function nuovoId(reg) { let id; do { id = 'demo-' + crypto.randomBytes(4).toString('hex').slice(0, 6); } while (reg.some((x) => x.id === id)); return id; }

/* nuova demo per un collega: attività di prova + codice docente valido solo lì */
async function crea(nome) {
  const SP = require('./spazi'), base = apri('main');
  nome = String(nome || '').replace(/\s+/g, ' ').trim();
  if (nome.length < 3 || nome.length > 60) err('Scrivi nome e cognome del collega.');
  await pulisci(base);
  const reg = await base.leggiRegistro(), id = nuovoId(reg), now = Date.now();
  const c = await contenuto(base, id, nome, await codiciTutti(base), now);
  await apri(id).sostituisciTutto({ config: c.config, alunni: c.alunni, termini: c.termini, attivita: c.attivita });
  await base.scriviRegistro((await base.leggiRegistro()).concat([{ id, nome: c.nome, as: '2026/27', ed: c.config.edizione.id, classi: c.classi, creata: new Date(now).toISOString(), bozza: false, demo: true, scade: c.config.demo.scade }]));
  const tit = await SP.impostaTitolare(base, id, nome, await codiciTutti(base), { demo: true });
  SP.svuota();
  return { id, nome, codice: tit.codice, scade: c.config.demo.scade };
}
/* «Ricomincia la demo»: stessi codici (docente e alunni), dati di partenza */
async function ricomincia(d, { codice }) {
  const stato = await d.leggiTutto(), chi = L.identifica(stato, codice);
  if (!stato.config.demo) err('Questa non è una demo.');
  if (chi.ruolo !== 'docente') err('Operazione riservata al docente.');
  const base = apri('main'), now = Date.now();
  const vecchi = stato.alunni.map((a) => a.codice), altri = (await codiciTutti(base)).filter((x) => vecchi.indexOf(x) < 0);
  const c = await contenuto(base, d.spazio, stato.config.demo.nome, altri, now);
  // gli alunni tengono i codici di prima, la scadenza resta quella
  c.alunni.forEach((a, i) => { if (stato.alunni[i]) a.codice = stato.alunni[i].codice; });
  c.config.demo = Object.assign({}, c.config.demo, { creata: stato.config.demo.creata, scade: stato.config.demo.scade, accessi: stato.config.demo.accessi || 0, ultimo: stato.config.demo.ultimo || null });
  const mappa = {}; stato.alunni.forEach((a, i) => { if (c.alunni[i]) mappa[c.alunni[i].codice] = a.codice; });
  c.config.demo.prova = (c.config.demo.prova || []).map((x) => Object.assign({}, x));
  // i codici di prova vanno ricalcolati sugli alunni con i codici vecchi
  c.config.demo.prova.forEach((x) => { const al = c.alunni.find((a) => a.nome === x.nome); if (al) x.codice = al.codice; });
  await d.sostituisciTutto({ config: c.config, alunni: c.alunni, termini: c.termini, attivita: c.attivita });
  return { ok: true };
}
/* demo scadute: si cancellano (dati, codice del collega, voce nel registro) */
async function cancella(base, id) {
  const SP = require('./spazi'), d = apri(id);
  await d.sostituisciTutto({ config: {}, alunni: [], termini: [], attivita: [] });
  await d.cancellaConfig();
  await base.scriviRegistro((await base.leggiRegistro()).filter((x) => x.id !== id));
  await SP.togliTitolare(base, id);
  SP.svuota();
}
async function pulisci(base) {
  const now = Date.now(), reg = await base.leggiRegistro();
  for (const x of reg.filter((y) => y.demo && y.scade && Date.parse(y.scade) <= now)) await cancella(base, x.id);
}
/* elenco per la sezione Promo App */
async function elenco(base) {
  const reg = (await base.leggiRegistro()).filter((x) => x.demo), cm = await base.leggiConfig(), out = [];
  for (const x of reg) {
    const cfg = await apri(x.id).leggiConfig(), doc = ((cm && cm.docenti) || []).find((y) => y.attivita === x.id && !y.admin);
    out.push({ id: x.id, nome: (cfg && cfg.demo && cfg.demo.nome) || x.nome, creata: x.creata, scade: x.scade, codice: doc ? doc.codice : null, accessi: (cfg && cfg.demo && cfg.demo.accessi) || 0, ultimo: (cfg && cfg.demo && cfg.demo.ultimo) || null });
  }
  return out.sort((a, b) => (a.creata < b.creata ? 1 : -1));
}
/* accesso del collega alla sua demo: si conta (si vede nella Promo App) */
async function segnaAccesso(d) {
  const cfg = await d.leggiConfig();
  if (!cfg || !cfg.demo) return;
  await d.scriviConfig({ demo: Object.assign({}, cfg.demo, { accessi: (cfg.demo.accessi || 0) + 1, ultimo: new Date().toISOString() }) });
}
module.exports = { crea, ricomincia, cancella, pulisci, elenco, segnaAccesso, GIORNI };
