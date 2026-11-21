/**
 * Edizioni del glossario: archivio di quelle concluse (consultabili), nuova edizione (stesse o nuove classi,
 * termini nuovi, date nuove), classe aggiunta all'edizione in corso, generatore di termini senza ripetizioni.
 */
const L = require('./logica');
const CAT = require('./catalogo');
const SIM = require('./simili');
const BANCA = require('./banca-termini');
const DATI = require('./dati');
const auto = require('./automatico');
const DBX = require('./dropbox');

const AREE = DATI.AREE.map((a) => String(a.n)); // le 4 aree del laboratorio (banca termini)
const numAree = (k) => Array.from({ length: k }, (x, i) => String(i + 1));
const nAreeDi = (config) => (config && Array.isArray(config.aree) && config.aree.length ? config.aree.length : DATI.AREE.length);
const err = (m) => L.errore(m);

async function adminDa(db, codice) {
  const stato = await db.leggiTutto();
  const chi = L.identifica(stato, codice); L.soloAdmin(chi);
  return { stato, chi };
}
function riepilogo(stato) {
  const now = Date.now(), voti = stato.alunni.map((a) => L.valuta(stato, a, now).voto).filter((v) => typeof v === 'number');
  return {
    alunni: stato.alunni.length, termini: stato.termini.length,
    approvate: stato.termini.filter((t) => t.stato_it === 'approvata').length,
    mediaVoto: voti.length ? Math.round(voti.reduce((x, y) => x + y, 0) / voti.length * 100) / 100 : null
  };
}

/* ---------- archivio ---------- */
async function archivia(db, { codice, sovrascrivi }) {
  const { stato } = await adminDa(db, codice);
  const config = stato.config;
  if (!config.chiusa) err('Prima chiudi l\'app agli alunni (riquadro «Accesso degli alunni»): l\'archivio fotografa il lavoro concluso.');
  const ed = L.edizioneDi(config);
  if (config.archiviata === ed.id && !sovrascrivi) err('Questa edizione è già in archivio. Per aggiornare la copia archiviata conferma la sovrascrittura.');
  const now = Date.now(), grezzo = await db.backupGrezzo();
  const full = auto.backupDa(grezzo, now);
  const imp = L.impostazioni(config);
  const meta = Object.assign({ id: ed.id, nome: ed.nome, as: ed.as, classi: imp.classi, creata: ed.creata, archiviata: new Date(now).toISOString(),
    pubblico: L.pubblicoDa(stato), terminiUsati: CAT.elencoTermini(config, '').map((x) => [x.area, x.termine, x.def]) }, riepilogo(stato));
  await db.scriviArchivio(meta, JSON.stringify(full));
  await db.scriviConfig({ archiviata: ed.id });
  // copia anche su Dropbox, se collegato: dati completi e Word delle definizioni approvate
  let dropbox = 'non collegato';
  const segreto = await db.leggiSegreto('dropbox');
  if (DBX.configurato() && segreto && segreto.refresh) {
    try {
      const token = await DBX.tokenAccesso(segreto), base = '/Archivio/' + ed.id;
      await DBX.carica(token, base + '_dati_completi.json', Buffer.from(JSON.stringify(full, null, 1), 'utf8'));
      await DBX.carica(token, base + '_definizioni_approvate.docx', await wordDa(full));
      // anche il report completo e la tabella dei voti con i giudizi (per Excel e per Argo)
      const st = auto.statoDa(full);
      await DBX.carica(token, base + '_report.pdf', await require('./report').creaReport(st.stato, st.attivita, now));
      await DBX.carica(token, base + '_voti.csv', votiCsv(stato, now));
      dropbox = 'ok';
    } catch (e) { dropbox = 'errore: ' + String(e.message || e).slice(0, 200); }
  }
  return { id: ed.id, nome: ed.nome, dropbox };
}
/* voti finali con scritto, orale e giudizio, in ordine alfabetico (separatore ; e decimali con la virgola, come vuole Excel in italiano) */
function votiCsv(stato, now) {
  const OR = require('./orale'), G = require('./giudizi');
  const tab = OR.tabelloneQuiz(stato), fv = (n) => (n == null ? '' : String(Math.round(n * 100) / 100).replace('.', ','));
  const q = (v) => { v = String(v == null ? '' : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const righe = stato.alunni.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'it')).map((a) => {
    const v = L.valuta(stato, a, now), z = tab.find((x) => x.id === a.id);
    return [a.nome, L.classeDi(a), v.escluso ? 'escluso' : fv(v.voto), v.orale ? fv(v.orale.voto) : '', fv(v.finale), a.giudizio || G.auto(v, z)].map(q).join(';');
  });
  return Buffer.from('\ufeff' + ['Alunno;Classe;Scritto;Orale;Finale;Giudizio'].concat(righe).join('\r\n'), 'utf8');
}
function statoDaArchivio(full) {
  const { stato, attivita } = auto.statoDa(full);
  stato.attivita = attivita; stato.dropbox = null; stato.archivio = [];
  return stato;
}
async function caricaArchivio(db, id) {
  const full = await db.leggiArchivioDati(id);
  if (!full) err('Edizione non trovata in archivio.');
  return full;
}
/* l'edizione archiviata vista come la vedeva il docente, in sola lettura */
async function consultaArchivio(db, { codice, id }) {
  const { chi } = await adminDa(db, codice);
  const full = await caricaArchivio(db, id);
  const stato = statoDaArchivio(full);
  const out = CAT.con(full.config, () => L.pacchetto(stato, Object.assign({}, chi)));
  const ed = L.edizioneDi(full.config);
  out.solaLettura = true;
  out.edizioneArchivio = { id: ed.id, nome: ed.nome, as: ed.as, archiviata: full.creato };
  out.config.chiusa = true;
  return out;
}
async function wordDa(full) {
  const { creaWord } = require('./word');
  const stato = statoDaArchivio(full);
  // definizioni calcolate con il catalogo dell'edizione archiviata, prima di generare il file
  CAT.con(full.config, () => stato.termini.forEach((t) => { t._def = t.stato_it === 'approvata' && t.scelta_it != null ? L.testoDef(t.area, t.scelta_it, 'it') : ''; }));
  return creaWord(stato, Date.now());
}
async function fileArchivio(db, { codice, id, tipo }) {
  await adminDa(db, codice);
  const full = await caricaArchivio(db, id);
  if (tipo === 'word') return { nome: 'Glossario_' + id + '_definizioni_approvate.docx', base64: (await wordDa(full)).toString('base64') };
  return { nome: 'Glossario_' + id + '_dati_completi.json', testo: JSON.stringify(full, null, 1) };
}

/* ---------- pagina pubblica: edizione in corso o archiviata ---------- */
async function pubblico(db, { ed } = {}) {
  const archivi = db.leggiArchivi ? await db.leggiArchivi() : [];
  let corrente = null;
  try { corrente = await db.leggiTutto(); } catch (e) { corrente = null; }
  const edCorr = corrente ? L.edizioneDi(corrente.config) : null;
  const elenco = archivi.map((m) => ({ id: m.id, nome: m.nome, as: m.as, classi: m.classi }));
  if (edCorr && !elenco.some((m) => m.id === edCorr.id)) elenco.push({ id: edCorr.id, nome: edCorr.nome, as: edCorr.as, classi: L.impostazioni(corrente.config).classi, inCorso: true });
  elenco.sort((x, y) => String(y.as).localeCompare(String(x.as)) || String(y.id).localeCompare(String(x.id)));
  if (ed && (!edCorr || ed !== edCorr.id)) {
    const m = archivi.find((x) => x.id === ed);
    if (!m) err('Edizione non trovata.');
    return Object.assign({}, m.pubblico, { edizioni: elenco, archiviata: true });
  }
  if (!corrente) return { aree: [], classi: {}, edizioni: elenco };
  const cur = L.pubblicoDa(corrente);
  // edizione in corso da sola (scelta nel menu) oppure, di norma, il glossario completo: ogni edizione archiviata lo arricchisce
  if (ed || !archivi.length || (db.spazio && db.spazio !== 'main')) return Object.assign(cur, { edizioni: elenco, archiviata: false, completo: false });
  return Object.assign(unisciEdizioni(cur, archivi.filter((m) => !edCorr || m.id !== edCorr.id)), { edizioni: elenco, archiviata: false, completo: true });
}
/* glossario completo: le aree si uniscono per nome; un termine già presente non si ripete (vale la definizione più recente approvata) */
function unisciEdizioni(cur, archivi) {
  const out = Object.assign({}, cur, { aree: cur.aree.map((a) => Object.assign({}, a, { termini: a.termini.slice() })), classi: Object.assign({}, cur.classi) });
  const nn = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  archivi.slice().sort((x, y) => String(y.as).localeCompare(String(x.as))).forEach((m) => {
    const P = m.pubblico || {}, as = m.as || '';
    (P.aree || []).forEach((pa) => {
      let a = out.aree.find((x) => nn(x.it) === nn(pa.it));
      if (!a) { a = Object.assign({}, pa, { n: out.aree.length + 1, numero: pa.numero, termini: [] }); out.aree.push(a); }
      (pa.termini || []).forEach((t) => {
        if (!t.def) return;
        const gia = a.termini.find((x) => nn(x.termine) === nn(t.termine));
        const voce = { termine: t.termine, def: t.def, autore: (t.autore || '') + (as ? ' · a.s. ' + as : '') };
        if (!gia) a.termini.push(voce);
        else if (!gia.def) Object.assign(gia, voce);
      });
    });
    Object.keys(P.classi || {}).forEach((c) => { const k = as ? c + ' (' + as + ')' : c; if (!out.classi[k]) out.classi[k] = P.classi[c]; });
  });
  return out;
}

/* ---------- termini già usati e generatore ---------- */
async function terminiUsati(db, config) {
  const usati = CAT.elencoTermini(config, 'edizione in corso');
  // l'edizione 2026/27 (3E e 3F) resta sempre tra gli usati, anche dopo una nuova edizione
  if (config && config.catalogo) DATI.AREE.forEach((a) => DATI.TERMINI[a.n].forEach((t, k) => usati.push({ area: a.n, termine: t[0], def: (DATI.DEFINIZIONI[a.n][k] || [''])[0], dove: 'a.s. 2026/27 (3E e 3F)' })));
  const archivi = db.leggiArchivi ? await db.leggiArchivi() : [];
  archivi.forEach((m) => (m.terminiUsati || []).forEach((x) => usati.push({ area: x[0], termine: x[1], def: x[2], dove: 'archivio ' + m.nome + ' (' + m.as + ')' })));
  return usati;
}
function mescola(arr, seme) {
  let s = (Number(seme) || 1) >>> 0; const r = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}
/* richiesta: { '1': quanti, ... }; escludi: termini da non proporre (già scartati dal docente o già scelti) */
/* fonte di un'area: 'banca:N' (banca delle 4 aree del laboratorio) oppure 'pk:ID:N' (area N di un elenco pronto) */
function elencoFonte(f) {
  const m = /^banca:(\d)$/.exec(f || '');
  if (m) { if (!BANCA[m[1]]) err('Area della banca non trovata.'); return BANCA[m[1]]; }
  const k = /^pk:([a-z0-9-]+):(\d)$/.exec(f || '');
  const P = k ? require('./pacchetti')[k[1]] : null;
  if (!P || !P.termini[k[2]]) err('Elenco di termini non trovato.');
  return P.termini[k[2]];
}
async function generaTermini(db, { codice, richiesta, escludi, seme, pacchetto, fonti }) {
  const { stato } = await adminDa(db, codice);
  const usati = await terminiUsati(db, stato.config);
  const via = new Set((escludi || []).map((t) => SIM.chiave(t)));
  const aree = {}, disponibili = {}, mancano = {};
  // fonti scelte area per area (procedura guidata), elenco pronto intero oppure banca delle 4 aree del laboratorio
  const F = fonti && typeof fonti === 'object' ? Object.keys(fonti).filter((n) => /^[1-6]$/.test(n) && fonti[n] !== 'mia') : null;
  const P = !F && pacchetto ? require('./pacchetti')[pacchetto] : null;
  if (!F && pacchetto && !P) err('Elenco di termini non trovato.');
  const fonte = F ? Object.fromEntries(F.map((n) => [n, elencoFonte(fonti[n])])) : P ? P.termini : BANCA;
  (F || (P ? Object.keys(P.termini) : AREE)).forEach((n) => {
    const chiesti = Math.max(0, Math.min(500, Number((richiesta || {})[n]) || 0));
    const liberi = fonte[n].map((x, i) => ({ t: x[0], d: x[1], i })).filter((x) => !via.has(SIM.chiave(x.t)) && !SIM.trovaSimile(x.t, x.d, usati));
    disponibili[n] = liberi.length;
    const scelti = (seme ? mescola(liberi, seme) : liberi).slice(0, chiesti).sort((x, y) => x.i - y.i);
    aree[n] = scelti.map((x) => [x.t, x.d].concat(CAT.traduzionePronta(x.t) || ['', '']));
    if (scelti.length < chiesti) mancano[n] = chiesti - scelti.length;
  });
  return { aree, disponibili, mancano };
}
/* controllo dei termini scritti dal docente: somiglianze con quelli già usati e tra loro */
async function verificaTermini(db, { codice, termini }) {
  const { stato } = await adminDa(db, codice);
  const usati = await terminiUsati(db, stato.config);
  const visti = [];
  const esiti = (termini || []).map((x) => {
    const t = String(x.termine || '').replace(/\s+/g, ' ').trim(), d = String(x.def || '').replace(/\s+/g, ' ').trim();
    let problema = null;
    if (!t || !d) problema = 'Servono sia il termine sia la definizione.';
    else if (t.length > 80) problema = 'Termine troppo lungo (massimo 80 caratteri).';
    else if (d.length > 300) problema = 'Definizione troppo lunga (massimo 300 caratteri).';
    const simile = problema ? null : (SIM.trovaSimile(t, d, usati) || SIM.trovaSimile(t, d, visti));
    visti.push({ termine: t, def: d, dove: 'questo elenco' });
    return { termine: t, def: d, area: x.area, problema, simile };
  });
  return { esiti };
}

/* ---------- assegnazione dei termini agli alunni di una classe ---------- */
// modo 'gruppi': alunni divisi in 4 gruppi consecutivi, uno per area; modo 'misto': termini di tutte le aree a ciascuno
function piano(classe, nA) {
  const n = classe.alunni.length, tpa = classe.tpa, NA = nA || 4, AR = numAree(NA);
  const base = Math.floor(n / NA), extra = n % NA, gruppo = [];
  for (let g = 0, i = 0; g < NA; g++) for (let k = 0; k < base + (g < extra ? 1 : 0); k++, i++) gruppo[i] = g + 1;
  return classe.alunni.map((al, i) => {
    const aree = {}; AR.forEach((a) => { aree[a] = 0; });
    if (classe.modo === 'gruppi') aree[gruppo[i]] = tpa;
    else { const b = Math.floor(tpa / NA), r = tpa % NA; AR.forEach((a) => { aree[a] = b; }); for (let k = 0; k < r; k++) aree[((i + k) % NA) + 1]++; }
    return { al, gruppo: classe.modo === 'gruppi' ? String(gruppo[i]) : 'M', aree };
  });
}
function fabbisogno(classi, nA) {
  const AR = numAree(nA || 4), tot = {}; AR.forEach((a) => { tot[a] = 0; });
  classi.forEach((c) => piano(c, nA).forEach((p) => AR.forEach((a) => { tot[a] += p.aree[a]; })));
  return tot;
}
const NOME_CLASSE = /^[0-9][A-Z]{1,3}$|^[A-Z0-9]{1,6}$/;
function validaClasse(c, i) {
  const nome = String(c.nome || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!nome || !NOME_CLASSE.test(nome)) err('Classe ' + (i + 1) + ': nome non valido (es. 4E, 3A).');
  const tpa = Number(c.tpa);
  if (!(tpa >= 4 && tpa <= 30) || Math.floor(tpa) !== tpa) err('Classe ' + nome + ': i termini a testa vanno da 4 a 30.');
  if (c.modo !== 'gruppi' && c.modo !== 'misto') err('Classe ' + nome + ': scegli come distribuire i termini.');
  const alunni = (c.alunni || []).map((a) => ({ nome: String(a.nome || '').replace(/\s+/g, ' ').trim(), riprendi: a.riprendi || null })).filter((a) => a.nome);
  if (!alunni.length) err('Classe ' + nome + ': inserisci almeno un alunno.');
  if (alunni.length > 40) err('Classe ' + nome + ': massimo 40 alunni.');
  const doppi = alunni.map((a) => a.nome.toLowerCase()).filter((x, k, arr) => arr.indexOf(x) !== k);
  if (doppi.length) err('Classe ' + nome + ': nome ripetuto (' + doppi[0] + ').');
  if (!c.scadenza) err('Classe ' + nome + ': manca la scadenza.');
  const scad = L.isoValida(c.scadenza), part = c.partenza ? L.isoValida(c.partenza) : null;
  if (part && Date.parse(part) >= Date.parse(scad)) err('Classe ' + nome + ': la partenza deve venire prima della scadenza.');
  if (Date.parse(scad) <= Date.now()) err('Classe ' + nome + ': la scadenza deve essere nel futuro.');
  return { nome, tpa, modo: c.modo, alunni, partenza: part, scadenza: scad };
}
function validaTermini(termini, fab, esistenti) {
  const out = {}, AR = Object.keys(fab);
  AR.forEach((n) => {
    const pulisci = (v) => String(v || '').replace(/\s+/g, ' ').trim();
    // termine, definizione e, se ci sono, la loro traduzione inglese
    const lista = ((termini || {})[n] || []).map((x) => { const it = pulisci(x[0]), pr = CAT.traduzionePronta(it) || []; return [it, pulisci(x[1]), pulisci(x[2]).slice(0, 100) || pr[0] || '', pulisci(x[3]).slice(0, 400) || pr[1] || '']; });
    if (lista.length !== fab[n]) err('Area ' + n + ': servono ' + fab[n] + ' termini, ne sono arrivati ' + lista.length + '.');
    lista.forEach((x) => { if (!x[0] || !x[1]) err('Area ' + n + ': ogni termine deve avere la sua definizione.'); if (x[0].length > 80 || x[1].length > 300) err('Area ' + n + ': «' + x[0].slice(0, 40) + '» è troppo lungo.'); });
    out[n] = lista;
  });
  // nessun doppione tra i termini nuovi, né con quelli dell'edizione in cui finiscono (stessi cartelloni)
  const visti = (esistenti || []).slice();
  AR.forEach((n) => out[n].forEach((x) => {
    const s = SIM.trovaSimile(x[0], '', visti);
    if (s) err('«' + x[0] + '» è troppo simile a «' + s.termine + '»' + (s.dove ? ' (' + s.dove + ')' : '') + ': sostituiscilo.');
    visti.push({ termine: x[0], def: x[1], dove: 'stesso elenco' });
  }));
  return out;
}
function giorniValidi(g) { const n = Number(g); if (!(n >= 1 && n <= 30) || Math.floor(n) !== n) err('Giorni per i termini ricevuti: da 1 a 30.'); return n; }
function terminiDoc(n, k0, lista, assegna) {
  return lista.map((x, j) => {
    const t = { id: 'T' + n + L.pad2(k0 + j + 1), area: String(n), termine_it: x[0], termine_en: x[2] || '', alunno_id: assegna[j], aggiornato: '' };
    ['it', 'en'].forEach((l) => Object.assign(t, L.AZZERA(l)));
    return t;
  });
}
/* distribuisce i termini dell'area n agli alunni, nell'ordine del piano */
function assegnazioni(piani, n) { const out = []; piani.forEach((p) => { for (let k = 0; k < p.aree[n]; k++) out.push(p.id); }); return out; }
function idAlunno(classe, i, usati) {
  const pref = classe.replace(/[^A-Z0-9]/g, '');
  let k = i + 1, id; do { id = pref + '-' + L.pad2(k); k++; } while (usati.has(id));
  usati.add(id); return id;
}
function controllaAree(cat) {
  Object.keys(cat).forEach((n) => { const tot = (cat[n] || []).length; if (tot > 0 && tot < 8) err('Area ' + n + ': con meno di 8 termini non si possono formare le 8 alternative. Cambia il numero di termini a testa o la distribuzione.'); });
}

/* chiusura dell'edizione in corso decisa dal docente: app chiusa agli alunni e copia in archivio */
async function chiudiEdizione(db, { codice }) {
  await adminDa(db, codice);
  await db.scriviConfig({ chiusa: true });
  const r = await archivia(db, { codice, sovrascrivi: true });
  return Object.assign({ chiusa: true }, r);
}

/* ---------- aree e regole di una nuova edizione o attività ---------- */
const COLORI = ['#2E6DB4', '#1F8A70', '#B5532A', '#7A4FA0', '#C2185B', '#5D6D2E'];
function validaAree(aree) {
  if (aree == null) return null; // le 4 aree del laboratorio
  if (!Array.isArray(aree) || aree.length < 1 || aree.length > 6) err('Le aree (cartelloni) vanno da 1 a 6.');
  const out = aree.map((a, i) => {
    const it = String((a && a.it) || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!it) err('Dai un nome all\'area ' + (i + 1) + '.');
    const col = /^#[0-9A-Fa-f]{6}$/.test((a && a.colore) || '') ? a.colore.toUpperCase() : COLORI[i];
    // motto (una parola o una frase, sul cartellone sopra il nastro) e numero grande nella testata: scelti dal docente
    const motto = String((a && a.motto) || '').replace(/\s+/g, ' ').trim();
    if (motto.length > 60) err('Area ' + (i + 1) + ': il motto può avere al massimo 60 caratteri.');
    const numero = String((a && a.numero) || '').replace(/\s+/g, '').trim();
    if (numero.length > 3) err('Area ' + (i + 1) + ': il numero in alto può avere al massimo 3 caratteri.');
    return { n: i + 1, it, en: String((a && a.en) || '').replace(/\s+/g, ' ').trim().slice(0, 60), colore: col, motto, numero: numero || String(i + 1).padStart(2, '0') };
  });
  if (new Set(out.map((a) => a.it.toLowerCase())).size !== out.length) err('Due aree hanno lo stesso nome.');
  return out;
}
/* costruisce configurazione, alunni e termini di una nuova edizione (o attività parallela) senza scrivere nulla */
function costruisci(stato, p, usatiCodiciEsterni) {
  const config = stato.config, edCorr = L.edizioneDi(config);
  const nome = String(p.nome || '').replace(/\s+/g, ' ').trim(), as = String(p.as || '').trim();
  if (!nome) err('Dai un nome alla nuova edizione.');
  if (!/^\d{4}\/\d{2}$/.test(as)) err('Anno scolastico non valido (es. 2027/28).');
  const aree = validaAree(p.aree), nA = aree ? aree.length : DATI.AREE.length;
  const classi = (p.classi || []).map(validaClasse);
  if (!classi.length) err('Inserisci almeno una classe.');
  if (new Set(classi.map((c) => c.nome)).size !== classi.length) err('Due classi hanno lo stesso nome.');
  const fab = fabbisogno(classi, nA);
  const usatiCodici = new Set((config.docenti || []).map((d) => d.codice).concat(usatiCodiciEsterni || [])), usatiId = new Set();
  const vecchi = {}; stato.alunni.forEach((a) => { vecchi[a.id] = a; });
  // alunni ripresi dall'edizione precedente: stesso codice e stessa scheda
  classi.forEach((c) => c.alunni.forEach((a) => { if (a.riprendi) { if (!vecchi[a.riprendi]) err('Alunno da riprendere non trovato: ' + a.nome + '.'); if (usatiId.has(a.riprendi)) err(a.nome + ' compare due volte.'); usatiId.add(a.riprendi); usatiCodici.add(vecchi[a.riprendi].codice); } }));
  const termini = validaTermini(p.termini, fab, []);
  const alunni = [], piani = [];
  classi.forEach((c) => piano(c, nA).forEach((pp, i) => {
    const rr = pp.al.riprendi ? vecchi[pp.al.riprendi] : null;
    const id = rr ? rr.id : idAlunno(c.nome, i, usatiId);
    alunni.push({ id, nome: rr ? rr.nome : pp.al.nome, gruppo: pp.gruppo, classe: c.nome, codice: rr ? rr.codice : L.generaCodice(usatiCodici), voto_manuale: null, riammesso: false });
    piani.push({ id, aree: pp.aree });
  }));
  const catalogo = {}; numAree(nA).forEach((n) => { catalogo[n] = termini[n]; });
  controllaAree(catalogo);
  const docs = []; numAree(nA).forEach((n) => docs.push(...terminiDoc(n, 0, termini[n], assegnazioni(piani, n))));
  const scadMax = classi.map((c) => c.scadenza).sort().slice(-1)[0], partMin = classi.map((c) => c.partenza).filter(Boolean).sort()[0] || null;
  const nuovaConfig = {
    chiusa: false, docenti: p.colleghi ? L.nuoviColleghi(config, { alunni }, p.colleghi) : config.docenti, proposta: p.proposta === 'A' || p.proposta === 'B' ? p.proposta : (config.proposta || DATI.VALUTAZIONE.proposta), lingue: ['it'], versioneDati: 4,
    giorniIt: p.giorniIt != null ? giorniValidi(p.giorniIt) : (config.giorniIt || DATI.EREDITA.giorniIt), giorniEn: config.giorniEn || DATI.EREDITA.giorniEn,
    riassegnazione: p.riassegnazione === 'manuale' ? 'manuale' : p.riassegnazione === 'auto' ? 'auto' : (config.riassegnazione || 'auto'),
    classi: classi.map((c) => c.nome), partenza: partMin, scadenze: { it: scadMax, en: new Date(Date.parse(scadMax) + 7 * 86400000).toISOString() },
    calendario: Object.fromEntries(classi.map((c) => [c.nome, { partenza: c.partenza, scadenzaIt: c.scadenza }])),
    tpaClassi: Object.fromEntries(classi.map((c) => [c.nome, c.tpa])),
    catalogo, blocchi: {}, edizione: { id: '', nome, as, creata: new Date().toISOString() }, archiviata: null
  };
  if (aree) nuovaConfig.aree = aree;
  if (p.regole) nuovaConfig.regole = require('./regole').valida(p.regole);
  return { config: nuovaConfig, alunni, docs, nome, as, edCorr };
}
async function nuovoIdEdizione(db, as, altri) {
  const giaUsati = new Set((await db.leggiArchivi()).map((m) => m.id).concat(altri || []));
  let id = '', k = 1; do { id = as.replace('/', '-') + '-' + k; k++; } while (giaUsati.has(id));
  return id;
}

/* ---------- nuova edizione ---------- */
async function nuovaEdizione(db, p) {
  const { stato } = await adminDa(db, p.codice);
  const config = stato.config;
  const altri = await (db.codiciAltriSpazi ? db.codiciAltriSpazi() : []);
  const { config: nuovaConfig, alunni, docs, nome, as, edCorr } = costruisci(stato, p, altri);
  const reg = db.leggiRegistro ? await db.leggiRegistro() : [];
  const id = await nuovoIdEdizione(db, as, [edCorr.id].concat(reg.map((x) => x.ed || '')));
  nuovaConfig.edizione.id = id;
  // l'edizione in corso, se non è già in archivio, si chiude agli alunni e si archivia (resta consultabile)
  let archiviata = null;
  if (config.archiviata !== edCorr.id) {
    await db.scriviConfig({ chiusa: true });
    archiviata = (await archivia(db, { codice: p.codice, sovrascrivi: true })).id;
  }
  const copia = await auto.copiaPrima(db, 'nuova_edizione');
  await db.sostituisciTutto({ config: nuovaConfig, alunni, termini: docs, attivita: [] });
  return { id, nome, as, alunni: alunni.length, termini: docs.length, copiaDropbox: copia, archiviata };
}

/* ---------- classe aggiunta all'edizione in corso ---------- */
async function aggiungiClasse(db, p) {
  const { stato } = await adminDa(db, p.codice);
  const config = stato.config, imp = L.impostazioni(config), ed = L.edizioneDi(config);
  if (config.archiviata === ed.id) err('Questa edizione è già in archivio: per lavorare con nuove classi crea una nuova edizione.');
  const c = validaClasse(p.classe || {}, 0);
  if (imp.classi.indexOf(c.nome) >= 0) err('La classe ' + c.nome + ' c\'è già in questa edizione.');
  if (c.alunni.some((a) => a.riprendi)) err('In una classe aggiunta gli alunni sono tutti nuovi.');
  const nA = nAreeDi(config), fab = fabbisogno([c], nA);
  const { cat, blocchi } = CAT.materializza(config);
  const esistenti = []; numAree(nA).forEach((n) => (cat[n] || []).forEach((x) => esistenti.push({ termine: x[0], def: x[1], dove: 'edizione in corso' })));
  const termini = validaTermini(p.termini, fab, esistenti);
  // gli alunni con questa classe ma senza classe registrata vengono da un tentativo interrotto: i loro id si riusano
  const altri = await (db.codiciAltriSpazi ? db.codiciAltriSpazi() : []);
  const usatiCodici = new Set(stato.alunni.map((a) => a.codice).concat((config.docenti || []).map((d) => d.codice), altri)), usatiId = new Set(stato.alunni.filter((a) => a.classe !== c.nome).map((a) => a.id));
  const alunni = [], piani = [];
  piano(c, nA).forEach((pp, i) => {
    const id = idAlunno(c.nome, i, usatiId);
    alunni.push({ id, nome: pp.al.nome, gruppo: pp.gruppo, classe: c.nome, codice: L.generaCodice(usatiCodici), voto_manuale: null, riammesso: false });
    piani.push({ id, aree: pp.aree });
  });
  const docs = [];
  numAree(nA).forEach((n) => {
    if (!termini[n].length) return;
    const k0 = (cat[n] || []).length;
    blocchi[n] = (blocchi[n] || []).concat([k0]); // i termini nuovi formano un blocco: le domande già assegnate non cambiano
    cat[n] = (cat[n] || []).concat(termini[n]);
    docs.push(...terminiDoc(n, k0, termini[n], assegnazioni(piani, n)));
  });
  controllaAree(cat);
  const calendario = Object.assign({}, imp.calendario);
  // le classi già presenti tengono le loro date: si scrivono esplicitamente, così la nuova non le cambia
  imp.classi.forEach((k) => { if (!calendario[k]) { const ic = L.impClasse(imp, k); calendario[k] = { partenza: ic.partenza || null, scadenzaIt: ic.scadenzaIt }; } });
  calendario[c.nome] = { partenza: c.partenza, scadenzaIt: c.scadenza };
  await db.aggiungiAlunni(alunni);
  await db.aggiungiTermini(docs);
  await db.scriviConfig({ catalogo: cat, blocchi, classi: imp.classi.concat([c.nome]), calendario, tpaClassi: Object.assign({}, imp.tpaClassi, { [c.nome]: c.tpa }) });
  return { classe: c.nome, alunni: alunni.length, termini: docs.length };
}

/* fabbisogno per il generatore (senza scrivere nulla) */
function calcolaFabbisogno(p) {
  const classi = (p.classi || []).map((c) => ({ nome: c.nome, tpa: Number(c.tpa) || 0, modo: c.modo, alunni: (c.alunni || []).filter((a) => String(a.nome || '').trim()) }));
  return fabbisogno(classi, Math.max(1, Math.min(6, Number(p.nAree) || 4)));
}

module.exports = { costruisci, nuovoIdEdizione, validaAree, nAreeDi, numAree, chiudiEdizione, archivia, consultaArchivio, fileArchivio, pubblico, generaTermini, verificaTermini, nuovaEdizione, aggiungiClasse, calcolaFabbisogno, piano , votiCsv };
