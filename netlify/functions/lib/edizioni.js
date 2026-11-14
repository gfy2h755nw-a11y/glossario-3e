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

const AREE = DATI.AREE.map((a) => String(a.n));
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
      dropbox = 'ok';
    } catch (e) { dropbox = 'errore: ' + String(e.message || e).slice(0, 200); }
  }
  return { id: ed.id, nome: ed.nome, dropbox };
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
  return Object.assign(L.pubblicoDa(corrente), { edizioni: elenco, archiviata: false });
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
async function generaTermini(db, { codice, richiesta, escludi, seme }) {
  const { stato } = await adminDa(db, codice);
  const usati = await terminiUsati(db, stato.config);
  const via = new Set((escludi || []).map((t) => SIM.chiave(t)));
  const aree = {}, disponibili = {}, mancano = {};
  AREE.forEach((n) => {
    const chiesti = Math.max(0, Math.min(500, Number((richiesta || {})[n]) || 0));
    const liberi = BANCA[n].map((x, i) => ({ t: x[0], d: x[1], i })).filter((x) => !via.has(SIM.chiave(x.t)) && !SIM.trovaSimile(x.t, x.d, usati));
    disponibili[n] = liberi.length;
    const scelti = (seme ? mescola(liberi, seme) : liberi).slice(0, chiesti).sort((x, y) => x.i - y.i);
    aree[n] = scelti.map((x) => [x.t, x.d]);
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
function piano(classe) {
  const n = classe.alunni.length, tpa = classe.tpa;
  const base = Math.floor(n / 4), extra = n % 4, gruppo = [];
  for (let g = 0, i = 0; g < 4; g++) for (let k = 0; k < base + (g < extra ? 1 : 0); k++, i++) gruppo[i] = g + 1;
  return classe.alunni.map((al, i) => {
    const aree = { 1: 0, 2: 0, 3: 0, 4: 0 };
    if (classe.modo === 'gruppi') aree[gruppo[i]] = tpa;
    else { const b = Math.floor(tpa / 4), r = tpa % 4; AREE.forEach((a) => { aree[a] = b; }); for (let k = 0; k < r; k++) aree[((i + k) % 4) + 1]++; }
    return { al, gruppo: classe.modo === 'gruppi' ? String(gruppo[i]) : 'M', aree };
  });
}
function fabbisogno(classi) {
  const tot = { 1: 0, 2: 0, 3: 0, 4: 0 };
  classi.forEach((c) => piano(c).forEach((p) => AREE.forEach((a) => { tot[a] += p.aree[a]; })));
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
  const out = {};
  AREE.forEach((n) => {
    const lista = ((termini || {})[n] || []).map((x) => [String(x[0] || '').replace(/\s+/g, ' ').trim(), String(x[1] || '').replace(/\s+/g, ' ').trim()]);
    if (lista.length !== fab[n]) err('Area ' + n + ': servono ' + fab[n] + ' termini, ne sono arrivati ' + lista.length + '.');
    lista.forEach((x) => { if (!x[0] || !x[1]) err('Area ' + n + ': ogni termine deve avere la sua definizione.'); if (x[0].length > 80 || x[1].length > 300) err('Area ' + n + ': «' + x[0].slice(0, 40) + '» è troppo lungo.'); });
    out[n] = lista;
  });
  // nessun doppione tra i termini nuovi, né con quelli dell'edizione in cui finiscono (stessi cartelloni)
  const visti = (esistenti || []).slice();
  AREE.forEach((n) => out[n].forEach((x) => {
    const s = SIM.trovaSimile(x[0], '', visti);
    if (s) err('«' + x[0] + '» è troppo simile a «' + s.termine + '»' + (s.dove ? ' (' + s.dove + ')' : '') + ': sostituiscilo.');
    visti.push({ termine: x[0], def: x[1], dove: 'stesso elenco' });
  }));
  return out;
}
function terminiDoc(n, k0, lista, assegna) {
  return lista.map((x, j) => {
    const t = { id: 'T' + n + L.pad2(k0 + j + 1), area: String(n), termine_it: x[0], termine_en: '', alunno_id: assegna[j], aggiornato: '' };
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
  AREE.forEach((n) => { const tot = (cat[n] || []).length; if (tot > 0 && tot < 8) err('Area ' + n + ': con meno di 8 termini non si possono formare le 8 alternative. Cambia il numero di termini a testa o la distribuzione.'); });
}

/* ---------- nuova edizione ---------- */
async function nuovaEdizione(db, p) {
  const { stato } = await adminDa(db, p.codice);
  const config = stato.config, edCorr = L.edizioneDi(config);
  if (config.archiviata !== edCorr.id) err('Prima archivia l\'edizione in corso (riquadro «Edizioni e archivio»): i suoi dati restano consultabili.');
  const nome = String(p.nome || '').replace(/\s+/g, ' ').trim(), as = String(p.as || '').trim();
  if (!nome) err('Dai un nome alla nuova edizione.');
  if (!/^\d{4}\/\d{2}$/.test(as)) err('Anno scolastico non valido (es. 2027/28).');
  const classi = (p.classi || []).map(validaClasse);
  if (!classi.length) err('Inserisci almeno una classe.');
  if (new Set(classi.map((c) => c.nome)).size !== classi.length) err('Due classi hanno lo stesso nome.');
  const fab = fabbisogno(classi);
  const usatiCodici = new Set((config.docenti || []).map((d) => d.codice)), usatiId = new Set();
  const vecchi = {}; stato.alunni.forEach((a) => { vecchi[a.id] = a; });
  // alunni ripresi dall'edizione precedente: stesso codice e stessa scheda
  classi.forEach((c) => c.alunni.forEach((a) => { if (a.riprendi) { if (!vecchi[a.riprendi]) err('Alunno da riprendere non trovato: ' + a.nome + '.'); if (usatiId.has(a.riprendi)) err(a.nome + ' compare due volte.'); usatiId.add(a.riprendi); usatiCodici.add(vecchi[a.riprendi].codice); } }));
  const termini = validaTermini(p.termini, fab, []);
  const alunni = [], piani = [];
  classi.forEach((c) => piano(c).forEach((pp, i) => {
    const r = pp.al.riprendi ? vecchi[pp.al.riprendi] : null;
    const id = r ? r.id : idAlunno(c.nome, i, usatiId);
    alunni.push({ id, nome: r ? r.nome : pp.al.nome, gruppo: pp.gruppo, classe: c.nome, codice: r ? r.codice : L.generaCodice(usatiCodici), voto_manuale: null, riammesso: false });
    piani.push({ id, aree: pp.aree });
  }));
  const catalogo = {}; AREE.forEach((n) => { catalogo[n] = termini[n]; });
  controllaAree(catalogo);
  const docs = []; AREE.forEach((n) => docs.push(...terminiDoc(n, 0, termini[n], assegnazioni(piani, n))));
  const giaUsati = new Set((await db.leggiArchivi()).map((m) => m.id).concat([edCorr.id]));
  let id = '', k = 1; do { id = as.replace('/', '-') + '-' + k; k++; } while (giaUsati.has(id));
  const scadMax = classi.map((c) => c.scadenza).sort().slice(-1)[0], partMin = classi.map((c) => c.partenza).filter(Boolean).sort()[0] || null;
  const nuovaConfig = {
    chiusa: false, docenti: config.docenti, proposta: config.proposta || DATI.VALUTAZIONE.proposta, lingue: ['it'], versioneDati: 4,
    giorniIt: config.giorniIt || DATI.EREDITA.giorniIt, giorniEn: config.giorniEn || DATI.EREDITA.giorniEn,
    riassegnazione: p.riassegnazione === 'manuale' ? 'manuale' : p.riassegnazione === 'auto' ? 'auto' : (config.riassegnazione || 'auto'),
    classi: classi.map((c) => c.nome), partenza: partMin, scadenze: { it: scadMax, en: new Date(Date.parse(scadMax) + 7 * 86400000).toISOString() },
    calendario: Object.fromEntries(classi.map((c) => [c.nome, { partenza: c.partenza, scadenzaIt: c.scadenza }])),
    tpaClassi: Object.fromEntries(classi.map((c) => [c.nome, c.tpa])),
    catalogo, blocchi: {}, edizione: { id, nome, as, creata: new Date().toISOString() }, archiviata: null
  };
  const copia = await auto.copiaPrima(db, 'nuova_edizione');
  await db.sostituisciTutto({ config: nuovaConfig, alunni, termini: docs, attivita: [] });
  return { id, nome, as, alunni: alunni.length, termini: docs.length, copiaDropbox: copia };
}

/* ---------- classe aggiunta all'edizione in corso ---------- */
async function aggiungiClasse(db, p) {
  const { stato } = await adminDa(db, p.codice);
  const config = stato.config, imp = L.impostazioni(config), ed = L.edizioneDi(config);
  if (config.archiviata === ed.id) err('Questa edizione è già in archivio: per lavorare con nuove classi crea una nuova edizione.');
  const c = validaClasse(p.classe || {}, 0);
  if (imp.classi.indexOf(c.nome) >= 0) err('La classe ' + c.nome + ' c\'è già in questa edizione.');
  if (c.alunni.some((a) => a.riprendi)) err('In una classe aggiunta gli alunni sono tutti nuovi.');
  const fab = fabbisogno([c]);
  const { cat, blocchi } = CAT.materializza(config);
  const esistenti = []; AREE.forEach((n) => (cat[n] || []).forEach((x) => esistenti.push({ termine: x[0], def: x[1], dove: 'edizione in corso' })));
  const termini = validaTermini(p.termini, fab, esistenti);
  // gli alunni con questa classe ma senza classe registrata vengono da un tentativo interrotto: i loro id si riusano
  const usatiCodici = new Set(stato.alunni.map((a) => a.codice).concat((config.docenti || []).map((d) => d.codice))), usatiId = new Set(stato.alunni.filter((a) => a.classe !== c.nome).map((a) => a.id));
  const alunni = [], piani = [];
  piano(c).forEach((pp, i) => {
    const id = idAlunno(c.nome, i, usatiId);
    alunni.push({ id, nome: pp.al.nome, gruppo: pp.gruppo, classe: c.nome, codice: L.generaCodice(usatiCodici), voto_manuale: null, riammesso: false });
    piani.push({ id, aree: pp.aree });
  });
  const docs = [];
  AREE.forEach((n) => {
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
  return fabbisogno(classi);
}

module.exports = { archivia, consultaArchivio, fileArchivio, pubblico, generaTermini, verificaTermini, nuovaEdizione, aggiungiClasse, calcolaFabbisogno, piano };
