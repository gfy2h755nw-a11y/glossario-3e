/**
 * Attività parallele: ognuna ha le sue classi, aree (cartelloni), termini, scritto, quiz, interrogazione e voto finale,
 * in uno spazio dati separato (vedi firestore.js). L'attività di sempre (3E e 3F) è «main» e non cambia.
 * Il docente sceglie l'attività su cui lavorare (parametro att); gli alunni entrano con il codice e finiscono nella loro.
 */
const L = require('./logica');
const ED = require('./edizioni');
const { db: apri } = require('./firestore');

const err = (m) => L.errore(m);
const norm = (c) => String(c == null ? '' : c).trim().toUpperCase();
// azioni degli alunni: l'attività si ricava dal codice
const DA_CODICE = { login: 1, scegli: 1, presenza: 1, quizinizio: 1, quizrisposta: 1, quizregole: 1, quizdimezza: 1 };

// elenco in memoria per pochi secondi: il quiz fa una richiesta a ogni risposta
let cache = { t: 0, elenco: null };
async function registro(base, fresco) {
  if (!fresco && cache.elenco && Date.now() - cache.t < 20000) return cache.elenco;
  const elenco = await base.leggiRegistro();
  cache = { t: Date.now(), elenco };
  return elenco;
}
function svuota() { cache = { t: 0, elenco: null }; titolari = { t: 0, mappa: null }; }

/* codici dei colleghi titolari → la loro attività (in memoria per pochi secondi; il controllo vero è in identifica) */
let titolari = { t: 0, mappa: null };
async function mappaTitolari(base, fresco) {
  if (!fresco && titolari.mappa && Date.now() - titolari.t < 20000) return titolari.mappa;
  const cfg = await base.leggiConfig();
  const m = {}; ((cfg && cfg.docenti) || []).forEach((x) => { if (x.attivita && !x.admin && x.codice) m[norm(x.codice)] = x.attivita; });
  titolari = { t: Date.now(), mappa: m };
  return m;
}

async function risolvi(dbf, p) {
  const base = dbf('main');
  // collega titolare: qualunque richiesta con il suo codice va nella sua attività, e solo lì
  if (p.codice && p.azione !== 'setup') {
    const c = norm(p.codice);
    let m = await mappaTitolari(base);
    if (!m[c] && p.azione === 'login') m = await mappaTitolari(base, true);
    if (m[c]) {
      if (p.att && p.att !== m[c] && p.azione !== 'login') err('Con questo codice puoi entrare solo nella tua attività.');
      const reg = await registro(base);
      if (!reg.some((x) => x.id === m[c]) && !(await registro(base, true)).some((x) => x.id === m[c])) err('La tua attività non è più disponibile: chiedi al prof. Cerrato.');
      return dbf(m[c]);
    }
  }
  if (p.att && p.att !== 'main') {
    const reg = await registro(base);
    if (!reg.some((x) => x.id === p.att) && !(await registro(base, true)).some((x) => x.id === p.att)) {
      if (p.azione === 'pubblico') return base; // link vecchio della pagina pubblica: si mostra il glossario principale
      err('Questa attività non c\'è più: ricarica la pagina.');
    }
    // attività in preparazione: non compare nella pagina pubblica
    if (p.azione === 'pubblico' && reg.some((x) => x.id === p.att && x.bozza)) return base;
    return dbf(p.att);
  }
  if (p.att === 'main' || !DA_CODICE[p.azione] || !p.codice) return base;
  const reg = await registro(base);
  if (!reg.length) return base;
  const c = norm(p.codice);
  if (await base.alunnoDaCodice(c)) return base;
  for (const x of reg) { const d = dbf(x.id); if (await d.alunnoDaCodice(c)) return d; }
  return base;
}

async function principale(d) {
  const cfg = d.spazio === 'main' ? null : await d.configPrincipale();
  return cfg;
}
/* elenco per la barra del docente: attività principale + parallele */
async function elencoDocente(d) {
  const base = apri('main'), reg = await registro(base, true);
  const cm = (await base.configPrincipale()) || {};
  const ed = L.edizioneDi(cm);
  return [{ id: 'main', nome: ed.nome, as: ed.as, classi: L.impostazioni(cm).classi }].concat(reg.map((x) => ({ id: x.id, nome: x.nome, as: x.as, classi: x.classi, bozza: !!x.bozza })));
}
/* elenco per la pagina pubblica (solo nomi) */
async function elencoPubblico(d) {
  const reg = await registro(apri('main'));
  if (!reg.length) return [];
  return elencoDocente(d).then((e) => e.filter((x) => !x.bozza).map((x) => ({ id: x.id, nome: x.nome, as: x.as, classi: x.classi })));
}
async function elenco(d, { codice }) {
  const stato = await d.leggiTutto(); L.soloAdmin(L.identifica(stato, codice));
  return { spazi: await elencoDocente(d) };
}

function idDa(nome, usati) {
  const base = String(nome).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'attivita';
  let id = base, k = 2;
  while (usati.has(id) || id === 'main') { id = base + '-' + k; k++; }
  return id;
}
/* nuova attività parallela: non tocca quelle in corso */
async function nuovaAttivita(d, p) {
  const base = apri('main');
  const statoMain = await base.leggiTutto();
  L.soloAdmin(L.identifica(statoMain, p.codice));
  const reg = await registro(base, true);
  // codici di tutti gli alunni di tutte le attività: restano unici, così il codice porta sempre all'attività giusta
  const codici = await base.codiciAlunni();
  for (const x of reg) codici.push(...await apri(x.id).codiciAlunni());
  // si parte da uno stato vuoto (nessun alunno da riprendere), con i docenti di sempre
  const vuoto = { config: { docenti: statoMain.config.docenti || [], proposta: statoMain.config.proposta, giorniIt: statoMain.config.giorniIt, riassegnazione: statoMain.config.riassegnazione }, alunni: [], termini: [] };
  const { config, alunni, docs, nome, as } = ED.costruisci(vuoto, Object.assign({}, p, { colleghi: null }), codici);
  const id = idDa(nome, new Set(reg.map((x) => x.id)));
  const edMain = L.edizioneDi(statoMain.config);
  config.edizione.id = await ED.nuovoIdEdizione(base, as, [edMain.id].concat(reg.map((x) => x.ed || '')));
  delete config.docenti; // i docenti sono quelli dell'attività principale
  // di solito si crea in preparazione (stand-by): gli alunni non entrano finché il docente non la manda LIVE
  const bozza = p.live !== true;
  if (bozza) config.bozza = true;
  // attività offerta a un collega: il suo nome come docente e «Per gentile concessione del Prof. Danilo Cerrato» ovunque
  const conc = concessioneValida(p.concessione);
  if (conc) config.concessione = conc;
  const nd = apri(id);
  await nd.sostituisciTutto({ config, alunni, termini: docs, attivita: [] });
  await base.scriviRegistro(reg.concat([{ id, nome, as, ed: config.edizione.id, classi: config.classi, creata: new Date().toISOString(), bozza }]));
  // il collega riceve un codice docente valido solo per questa attività
  let titolare = null;
  if (conc) titolare = await impostaTitolare(base, id, conc.docente, codici.concat(alunni.map((a) => a.codice)));
  svuota();
  return { id, nome, as, bozza, alunni: alunni.length, termini: docs.length, classi: config.classi, aree: config.aree || null, titolare };
}
/* togli un'attività dall'elenco: prima la si chiude agli alunni e la si archivia (resta consultabile in Archivio) */
async function rimuovi(d, { codice, id }) {
  const base = apri('main');
  const statoMain = await base.leggiTutto();
  L.soloAdmin(L.identifica(statoMain, codice));
  const reg = await registro(base, true);
  if (!reg.some((x) => x.id === id)) err('Attività non trovata.');
  const nd = apri(id);
  await nd.scriviConfig({ chiusa: true });
  const arch = await ED.archivia(nd, { codice, sovrascrivi: true });
  await base.scriviRegistro(reg.filter((x) => x.id !== id));
  await togliTitolare(base, id); // il codice del collega smette di funzionare
  svuota();
  return { id, archiviata: arch.id };
}

/* nomi, colori, numeri e motti dei cartelloni di un'attività con aree proprie (il numero di aree non cambia) */
async function salvaAree(d, { codice, aree }) {
  const stato = await d.leggiTutto(); L.soloGestore(L.identifica(stato, codice));
  const vecchie = stato.config.aree;
  if (!Array.isArray(vecchie) || !vecchie.length) err('Questa attività usa le 4 aree del laboratorio: nomi e motti restano quelli.');
  if (!Array.isArray(aree) || aree.length !== vecchie.length) err('Il numero delle aree non si può cambiare.');
  const nuove = ED.validaAree(aree);
  await d.scriviConfig({ aree: nuove });
  return { aree: nuove };
}
function concessioneValida(c) {
  if (!c || typeof c !== 'object') return null;
  const docente = String(c.docente || '').replace(/\s+/g, ' ').trim(), materia = String(c.materia || '').replace(/\s+/g, ' ').trim();
  if (!docente) return null;
  if (docente.length > 60 || materia.length > 60) err('Nome del docente e materia: al massimo 60 caratteri.');
  return { docente, materia };
}
/* attività di un collega: docente e materia da stampare, con la dicitura di concessione (vuoto = attività del prof. Cerrato) */
async function salvaConcessione(d, { codice, concessione }) {
  if (d.spazio === 'main') err('L\'attività principale è del prof. Cerrato.');
  const stato = await d.leggiTutto(); L.soloAdmin(L.identifica(stato, codice));
  const conc = concessioneValida(concessione);
  await d.scriviConfig({ concessione: conc });
  // il nome del collega titolare segue quello scritto qui
  const base = apri('main'), cm = await base.leggiConfig(), doc = ((cm && cm.docenti) || []).find((x) => x.attivita === d.spazio && !x.admin);
  if (doc && conc && doc.nome !== conc.docente) await base.scriviConfig({ docenti: cm.docenti.map((x) => (x === doc ? Object.assign({}, x, { nome: conc.docente }) : x)) });
  return { concessione: conc };
}
/* numero grande nella testata dei cartelloni (attività con le 4 aree del laboratorio); vuoto = numero normale (01, 02…) */
async function numeriCartelloni(d, { codice, numeri }) {
  const stato = await d.leggiTutto(); L.soloGestore(L.identifica(stato, codice));
  if (Array.isArray(stato.config.aree) && stato.config.aree.length) err('In questa attività il numero si cambia insieme al nome dell\'area, nella pagina Cartelloni.');
  const out = {};
  Object.keys(numeri || {}).forEach((n) => {
    if (!/^[1-9]$/.test(n)) err('Cartellone non valido.');
    const v = String(numeri[n] == null ? '' : numeri[n]).trim();
    if (v.length > 3) err('Il numero del cartellone ha al massimo 3 caratteri.');
    if (v) out[n] = v;
  });
  await d.scriviConfig({ numeriCartelloni: out });
  return { numeri: out };
}
/* attività in preparazione → LIVE: da qui gli alunni possono entrare con il loro codice */
async function mandaLive(d, { codice }) {
  if (d.spazio === 'main') err('L\'attività principale è già attiva.');
  const base = apri('main');
  const cfg = await d.leggiConfig();
  if (!cfg) err('Attività non trovata.');
  L.soloGestore(L.identifica({ config: cfg, alunni: [], termini: [] }, codice));
  if (!cfg.bozza) return { live: true, gia: true };
  const imp = L.impostazioni(cfg), ora = Date.now();
  const scadute = imp.classi.filter((c) => Date.parse(L.impClasse(imp, c).scadenzaIt) <= ora);
  if (scadute.length) err('La scadenza dello scritto è già passata per ' + scadute.join(', ') + ': aggiornala in «Scadenze e valutazione» prima di andare LIVE.');
  await d.scriviConfig({ bozza: false, live: new Date().toISOString() });
  const reg = await registro(base, true);
  await base.scriviRegistro(reg.map((x) => (x.id === d.spazio ? Object.assign({}, x, { bozza: false }) : x)));
  svuota();
  return { live: true };
}
/* ---- codice del collega titolare (docente legato a una sola attività) ---- */
async function codiciUsati(base) {
  const reg = await registro(base, true), out = await base.codiciAlunni();
  for (const x of reg) out.push(...await apri(x.id).codiciAlunni());
  return out;
}
async function impostaTitolare(base, id, nome, usatiAlunni) {
  const cm = await base.leggiConfig(), docenti = (cm && cm.docenti) || [];
  const usati = new Set(docenti.map((x) => x.codice).concat(usatiAlunni || []));
  const prima = docenti.find((x) => x.attivita === id && !x.admin);
  const nuovo = { nome, codice: L.generaCodice(usati), lingua: 'it', admin: false, attivita: id, permessi: { revisione: true, voti: true, studenti: true, documenti: true, codici: true } };
  await base.scriviConfig({ docenti: docenti.filter((x) => x !== prima).concat([nuovo]) });
  titolari = { t: 0, mappa: null };
  return { nome: nuovo.nome, codice: nuovo.codice };
}
async function togliTitolare(base, id) {
  const cm = await base.leggiConfig(), docenti = (cm && cm.docenti) || [];
  if (docenti.some((x) => x.attivita === id && !x.admin)) await base.scriviConfig({ docenti: docenti.filter((x) => !(x.attivita === id && !x.admin)) });
  titolari = { t: 0, mappa: null };
}
/* dal prof. Cerrato, nelle impostazioni dell'attività del collega: nuovo codice (il vecchio smette di funzionare) o accesso tolto */
async function codiceTitolare(d, { codice, op }) {
  if (d.spazio === 'main') err('L\'attività principale è del prof. Cerrato.');
  const stato = await d.leggiTutto(); L.soloAdmin(L.identifica(stato, codice));
  const base = apri('main');
  if (op === 'togli') { await togliTitolare(base, d.spazio); return { titolare: null }; }
  const conc = stato.config.concessione;
  if (!conc || !conc.docente) err('Prima scrivi il nome del collega (attività per un collega).');
  return { titolare: await impostaTitolare(base, d.spazio, conc.docente, await codiciUsati(base)) };
}
module.exports = { codiceTitolare, salvaConcessione, numeriCartelloni, mandaLive, salvaAree, risolvi, elencoDocente, elencoPubblico, elenco, nuovaAttivita, rimuovi, svuota, principale };
