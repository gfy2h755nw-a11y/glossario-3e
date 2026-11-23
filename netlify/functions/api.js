/**
 * Glossario odontotecnico bilingue – Classe 3E – a.s. 2026/27
 * Funzione Netlify: unico punto di accesso ai dati (Firestore).
 * POST /api  { azione, ...parametri }
 */
const logica = require('./lib/logica');
const { db } = require('./lib/firestore');
const SP = require('./lib/spazi');
const ATT = require('./lib/attivita');
const auto = require('./lib/automatico');
const DBX = require('./lib/dropbox');
const ED = require('./lib/edizioni');
const OR = require('./lib/orale');
const STAT = require('./lib/statistiche');
const PUBB = require('./lib/pubblicazione');
const SALUTE = require('./lib/salute');

const AZIONI = {
  login: (d, p) => logica.login(d, p),
  scegli: (d, p) => logica.scegli(d, p),
  revisiona: (d, p) => logica.revisiona(d, p),
  approvacorrette: (d, p) => logica.approvaCorrette(d, p),
  chiusura: (d, p) => logica.impostaChiusura(d, p),
  impostazioni: (d, p) => logica.impostazioniAdmin(d, p),
  voto: (d, p) => logica.votoManuale(d, p),
  riammetti: (d, p) => logica.riammetti(d, p),
  anteprimariammissione: (d, p) => logica.anteprimaRiammissione(d, p),
  // proroga individuale, blocco della riassegnazione automatica, passaggio dei termini deciso dal docente
  proroga: (d, p) => logica.prorogaAlunno(d, p),
  bloccoriassegnazione: (d, p) => logica.bloccoRiassegnazione(d, p),
  trasferisci: (d, p) => logica.trasferisciTermini(d, p),
  // edizioni: archivio, nuova edizione, classe aggiunta, generatore di termini
  archivia: (d, p) => ED.archivia(d, p),
  chiudiedizione: (d, p) => ED.chiudiEdizione(d, p),
  // inglese per i cartelloni bilingui e colleghi docenti con le loro facoltà
  traduzioni: (d, p) => logica.traduzioni(d, p),
  salvatraduzioni: (d, p) => logica.salvaTraduzioni(d, p),
  // revisione dei cartelloni prima della stampa: termine e definizione corretti dal docente
  revisionecartelloni: (d, p) => logica.revisioneCartelloni(d, p),
  salvarevisione: (d, p) => logica.salvaRevisione(d, p),
  giudizio: (d, p) => logica.salvaGiudizio(d, p),
  colleghi: (d, p) => logica.colleghi(d, p),
  archivioconsulta: (d, p) => ED.consultaArchivio(d, p),
  archiviofile: (d, p) => ED.fileArchivio(d, p),
  generatermini: (d, p) => ED.generaTermini(d, p),
  verificatermini: (d, p) => ED.verificaTermini(d, p),
  nuovaedizione: (d, p) => ED.nuovaEdizione(d, p),
  aggiungiclasse: (d, p) => ED.aggiungiClasse(d, p),
  // quiz di esercitazione (pagina pubblica, con il codice personale) e interrogazione orale (docenti con la facoltà «voti»)
  quizinizio: (d, p) => OR.quizInizio(d, p),
  quizrisposta: (d, p) => OR.quizRisposta(d, p),
  quizregole: (d, p) => OR.quizRegole(d, p),
  quizproroga: (d, p) => OR.quizProroga(d, p),
  quizpersonale: (d, p) => OR.quizPersonale(d, p),
  quizdimezza: (d, p) => OR.quizDimezza(d, p),
  pianoorale: (d, p) => OR.pianoOrale(d, p),
  oraleprova: (d, p) => OR.oraleProva(d, p),
  oralepesca: (d, p) => OR.oralePesca(d, p),
  oralecambia: (d, p) => OR.oraleCambia(d, p),
  oralecatalogo: (d, p) => OR.oraleCatalogo(d, p),
  oraleimposta: (d, p) => OR.oraleImposta(d, p),
  oralesceglieuno: (d, p) => OR.oraleScegliUno(d, p),
  oralesalva: (d, p) => OR.oraleSalva(d, p),
  oraleannulla: (d, p) => OR.oraleAnnulla(d, p),
  setup: (d, p) => logica.setup(d, p, process.env.SETUP_KEY),
  // segnale di presenza (ogni minuto, app aperta in primo piano): serve solo al registro attività
  presenza: async () => ({}),
  // ripasso sulla pagina pubblica (codice dell'alunno ricordato sul dispositivo): il tempo va nel suo registro
  presenzapubblica: async (d, p) => { const a = p.codice ? await d.alunnoDaCodice(p.codice) : null; return a ? { nome: logica.nomePubblico(a.nome) } : {}; },
  // pagina pubblica /glossario: nessun codice richiesto, solo definizioni approvate
  pubblico: (d, p) => pubblicoInCache(d, p),
  // home dei glossari: i glossari pubblicati (LIVE), ognuno con docente, materia e numeri
  glossari: () => glossariInCache(),
  // il docente manda online sulla pagina pubblica termini e definizioni approvati
  pubblicaglossario: (d, p) => PUBB.pubblica(d, p),
  ritiraglossario: (d, p) => PUBB.ritira(d, p),
  // salute dell'app (solo il prof. Cerrato): errori degli ultimi 30 giorni e «segna come visti»
  salute: async (d, p) => { await logica.verificaAdmin(db('main'), p.codice); const m = (await db('main').leggiSalute()) || {}; return { errori: await SALUTE.elenco(db('main'), 30), letti: m.letti || '' }; },
  saluteletti: async (d, p) => { await logica.verificaAdmin(db('main'), p.codice); const letti = new Date().toISOString(); await db('main').scriviSalute({ letti }); return SALUTE.riepilogo(db('main')); },
  // statistiche della pagina pubblica, solo per il prof. Cerrato
  statistiche: async (d, p) => {
    await logica.verificaAdmin(db('main'), p.codice);
    const nomi = {}; (await glossariInCache()).forEach((g) => { nomi[g.id] = g.titolo; });
    return STAT.riepilogo(db('main'), p.periodo === 'anno' ? 'anno' : [7, 30].indexOf(Number(p.periodo)) >= 0 ? Number(p.periodo) : 30, nomi);
  },
  // attività parallele: nuova attività con classi, aree, termini e regole propri; elenco; rimozione dall'elenco (i dati restano in archivio)
  nuovaattivita: (d, p) => SP.nuovaAttivita(d, p),
  attivitaelenco: (d, p) => SP.elenco(d, p),
  rimuoviattivita: (d, p) => SP.rimuovi(d, p),
  salvaaree: (d, p) => SP.salvaAree(d, p),
  mandalive: (d, p) => SP.mandaLive(d, p),
  numericartelloni: (d, p) => SP.numeriCartelloni(d, p),
  concessione: (d, p) => SP.salvaConcessione(d, p),
  codicetitolare: (d, p) => SP.codiceTitolare(d, p),
  promo: (d, p) => require('./lib/promo').entra(d, p),
  promonumeri: (d, p) => require('./lib/promo').numeriPubblici(d, p),
  promotempo: (d, p) => require('./lib/promo').tempo(d, p),
  promotogli: (d, p) => require('./lib/promo').togli(d, p),
  promoaggiorna: (d, p) => require('./lib/promo').aggiornaNumeri(d, p),
  promostato: (d, p) => require('./lib/promo').stato(d, p),
  promocodice: (d, p) => require('./lib/promo').cambiaCodice(d, p),
  banca: (d, p) => require('./lib/banca').banca(d, p),
  bancasalva: (d, p) => require('./lib/banca').salva(d, p),
  bozzawz: (d, p) => require('./lib/bozza').leggi(d, p),
  salvabozzawz: (d, p) => require('./lib/bozza').salva(d, p),
  // solo prof. Cerrato: backup, ripristino, Dropbox
  backup: async (d, p) => { await logica.verificaAdmin(d, p.codice); return auto.backupDa(await d.backupGrezzo(true), Date.now()); },
  ripristina: async (d, p) => {
    await logica.verificaAdmin(d, p.codice);
    const b = auto.validaBackup(p.backup);
    // prima di sostituire tutto, una copia dello stato attuale va su Dropbox (se collegato)
    const copia = await auto.copiaPrima(d, 'ripristino');
    await d.sostituisciTutto(b);
    return { alunni: b.alunni.length, termini: b.termini.length, attivita: (b.attivita || []).length, creato: b.creato, copiaDropbox: copia };
  },
  // presentazione PowerPoint di riepilogo (grafici nativi)
  presentazione: async (d, p) => {
    await logica.verificaPermesso(d, p.codice, 'documenti');
    const tutto = auto.statoDa(await d.backupGrezzo());
    const stato = logica.statoClasse(tutto.stato, p.classe);
    const buf = await require('./lib/presentazione').creaPresentazione(stato, tutto.attivita, Date.now());
    return { nome: 'Glossario_' + logica.nomeClassi(stato).replace(/ e /g, '-') + '_report_attivita_' + new Date().toISOString().slice(0, 10) + '.pptx', base64: buf.toString('base64') };
  },
  // presentazione per gli studenti di una classe, con partenza e scadenza prese dalle impostazioni
  presentazionestudenti: async (d, p) => {
    await logica.verificaPermesso(d, p.codice, 'documenti');
    const { stato } = auto.statoDa(await d.backupGrezzo());
    const imp = logica.impostazioni(stato.config);
    const classe = String(p.classe || '');
    if (imp.classi.indexOf(classe) < 0) throw Object.assign(new Error('Classe non valida.'), { utente: true });
    const buf = await require('./lib/deck-studenti').creaDeckStudenti(classe, logica.impClasse(imp, classe), Date.now(), stato);
    return { nome: 'Presentazione_Studenti_Glossario_' + classe + '.pptx', base64: buf.toString('base64') };
  },
  dropboxcollega: async (d, p) => { await logica.verificaAdmin(d, p.codice); return { url: await DBX.linkCollegamento(d) }; },
  dropboxscollega: async (d, p) => { await logica.verificaAdmin(d, p.codice); await d.cancellaSegreto('dropbox'); return { scollegato: true }; },
  // Word con termini e definizioni approvate: si scarica e, se Dropbox è collegato, si salva lì sovrascrivendo
  word: async (d, p) => {
    await logica.verificaPermesso(d, p.codice, 'documenti');
    const now = Date.now();
    const { stato } = auto.statoDa(await d.backupGrezzo());
    const { creaWord, NOME_DROPBOX } = require('./lib/word');
    const buf = await creaWord(stato, now);
    let dropbox = 'non collegato';
    const segreto = await d.leggiSegreto('dropbox');
    if (DBX.configurato() && segreto && segreto.refresh) {
      try { await DBX.carica(await DBX.tokenAccesso(segreto), auto.cartella(d) + NOME_DROPBOX, buf); dropbox = 'ok'; } catch (e) { dropbox = 'errore: ' + String(e.message || e).slice(0, 200); }
    }
    return { nome: 'Glossario_definizioni_approvate.docx', base64: buf.toString('base64'), dropbox, percorso: auto.cartella(d) + NOME_DROPBOX };
  },
  dropboxinvia: async (d, p) => {
    await logica.verificaAdmin(d, p.codice);
    const r = await auto.esegui(d, 'manuale');
    if (r.saltato) throw Object.assign(new Error(r.motivo + '.'), { utente: true });
    return Object.assign(r, { stato: await DBX.statoPubblico(d) });
  }
};
const TRACCIA = { login: 'login', scegli: 'scegli', presenza: 'presenza', presenzapubblica: 'pubblica' };
async function traccia(d, p, event) {
  try {
    const a = await d.alunnoDaCodice(p.codice);
    if (!a) return;
    const now = Date.now(), disp = ATT.dispositivo((event.headers || {})['user-agent']);
    await d.registraAttivita(a.id, (cur) => ATT.aggiorna(cur, now, disp, TRACCIA[p.azione]));
  } catch (e) { console.error('registro attività:', e.message); await segnala(e, 'registro attività', { livello: 'avviso' }); }
}

/* ---------- meno letture sul database ----------
   1) il controllo degli esclusi (manutenzione) legge tutto il glossario: dopo la scadenza si fa al massimo ogni 5 minuti
      per istanza, e di nuovo subito dopo ogni modifica fatta da un docente (proroghe, riammissioni, impostazioni…);
   2) la pagina pubblica e i giochi usano una copia dei dati che si rinnova ogni 2 minuti. */
const TEST = !!process.env.SETUP_KEY && process.env.SETUP_KEY === 'chiave-prova' && /localhost/.test(process.env.URL || '');
const MANUT_MS = 5 * 60 * 1000, PUBBLICO_MS = 2 * 60 * 1000;
const manutUltima = {}, cachePubblico = {};
let cacheGlossari = null, limiteClient = [];
/* errore imprevisto lato server: nel registro della salute dell'app (senza mai bloccare la risposta) */
async function segnala(e, azione, extra) { try { await SALUTE.registra(db('main'), Object.assign({ origine: 'server', messaggio: (e && e.message) || String(e), dettaglio: e && e.stack ? String(e.stack).split('\n').slice(0, 5).join('\n') : '', azione }, extra || {})); } catch (x) { console.error('salute:', x.message); } }
async function glossariInCache() {
  const now = Date.now();
  if (!TEST && cacheGlossari && now - cacheGlossari.t < PUBBLICO_MS) return cacheGlossari.dati;
  const sp = await SP.elencoPubblico(db('main'));
  const ids = sp.length ? sp.map((x) => x.id) : ['main'];
  const out = [];
  for (const id of ids) {
    try {
      const P = await pubblicoInCache(db(id), {});
      let termini = 0, definizioni = 0; (P.aree || []).forEach((a) => { termini += a.termini.length; definizioni += a.termini.filter((t) => t.def).length; });
      const conc = !!P.concessione;
      out.push({ id, titolo: conc ? (P.materia ? 'Glossario di ' + P.materia : 'Glossario') : 'Glossario odontotecnico', materia: P.materia || '', docente: P.docente || '', concessione: P.concessione || '',
        anno: P.anno || '', pubblicato: !!P.pubblicato || definizioni > 0, classi: Object.keys(P.classi || {}), termini, definizioni, aree: (P.aree || []).length, colori: (P.aree || []).map((a) => a.colore) });
    } catch (e) { console.error('glossari:', id, e.message); await segnala(e, 'glossari', { livello: 'avviso', att: id }); }
  }
  cacheGlossari = { t: now, dati: out };
  return out;
}
const SOLO_LETTURA = { salute: 1, saluteletti: 1, glossari: 1, statistiche: 1, presenzapubblica: 1, oralecatalogo: 1, promo: 1, promotempo: 1, promotogli: 1, promonumeri: 1, promostato: 1, promocodice: 1, promoaggiorna: 1, banca: 1, bozzawz: 1, salvabozzawz: 1, login: 1, presenza: 1, pubblico: 1, quizinizio: 1, quizrisposta: 1, quizregole: 1, quizdimezza: 1, scegli: 1, oraleprova: 1, revisionecartelloni: 1, attivitaelenco: 1, word: 1, report: 1, backup: 1, traduzioni: 1 };
async function manutenzioneSeServe(d) {
  const k = d.spazio || 'main', now = Date.now();
  if (!TEST && manutUltima[k] && now - manutUltima[k] < MANUT_MS) return;
  await logica.manutenzione(d);
  manutUltima[k] = now;
}
async function pubblicoInCache(d, p) {
  const k = (d.spazio || 'main') + '|' + (p.ed || ''), c = cachePubblico[k], now = Date.now();
  if (!TEST && c && now - c.t < PUBBLICO_MS) return c.dati;
  const dati = Object.assign(await ED.pubblico(d, { ed: p.ed }), { spazi: await SP.elencoPubblico(d), att: d.spazio });
  cachePubblico[k] = { t: now, dati };
  return dati;
}
// limite giornaliero del database superato (piano gratuito di Firebase): messaggio chiaro invece del codice tecnico
const QUOTA = /RESOURCE_EXHAUSTED|Quota exceeded/i;

const risposta = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return risposta(405, { errore: 'Metodo non consentito.' });
  let p;
  try { p = JSON.parse(event.body || '{}'); } catch (e) { return risposta(400, { errore: 'Richiesta non valida.' }); }
  // statistiche anonime della pagina pubblica: una scrittura sola, senza leggere il glossario
  if (p.azione === 'visita') {
    try { await STAT.registra(db('main'), p, event.headers || {}); } catch (e) { console.error('statistiche:', e.message); await segnala(e, 'visita', { livello: 'avviso' }); }
    return risposta(200, { ok: true });
  }
  if (p.azione === 'erroreclient') {
    const now = Date.now(); limiteClient = limiteClient.filter((t) => now - t < 60000);
    if (limiteClient.length < 30) { limiteClient.push(now); try { await SALUTE.registra(db('main'), { origine: p.origine, messaggio: p.messaggio, dettaglio: p.dettaglio, azione: p.azione2, ruolo: p.ruolo, pagina: p.pagina, disp: p.disp }); } catch (e) { console.error('salute:', e.message); } }
    return risposta(200, { ok: true });
  }
  const fn = AZIONI[p.azione];
  if (!fn) return risposta(400, { errore: 'Azione sconosciuta.' });
  try {
    // attività: quella scelta dal docente (att) oppure, per gli alunni, quella del loro codice
    const d = await SP.risolvi(db, p);
    if (p.azione !== 'setup' && d.spazio === 'main') await logica.migra(d);
    if (p.azione === 'login' || p.azione === 'scegli') await manutenzioneSeServe(d);
    const dati = await fn(d, p);
    // dopo una modifica del docente il prossimo accesso rifà subito il controllo degli esclusi
    if (!SOLO_LETTURA[p.azione]) delete manutUltima[d.spazio || 'main'];
    // attività create, mandate LIVE o tolte: la pagina pubblica le mostra subito
    if (p.azione === 'mandalive' || p.azione === 'nuovaattivita' || p.azione === 'rimuoviattivita' || p.azione === 'concessione' || p.azione === 'pubblicaglossario' || p.azione === 'ritiraglossario') { Object.keys(cachePubblico).forEach((k) => delete cachePubblico[k]); cacheGlossari = null; }
    if (p.azione === 'login' && dati && dati.utente && dati.utente.admin && d.spazio === 'main') { try { await SP.pulisciResidui(d); } catch (e) { console.error('pulizia:', e.message); await segnala(e, 'pulizia', { livello: 'avviso' }); } }
    if (p.azione === 'login' && dati && dati.utente && dati.utente.admin) { try { dati.salute = await SALUTE.riepilogo(db('main')); } catch (e) { console.error('salute:', e.message); } }
    if (p.azione === 'login' && dati && dati.utente && dati.utente.ruolo === 'alunno') dati.att = d.spazio; // link alla pagina pubblica della sua attività
    if (p.azione === 'login' && dati && dati.utente && dati.utente.ruolo === 'docente') Object.assign(dati, { att: d.spazio, spazi: dati.utente.gestore ? (await SP.elencoDocente(d)).filter((x) => x.id === d.spazio) : await SP.elencoDocente(d) });
    if (TRACCIA[p.azione] && p.codice) await traccia(d, p, event);
    return risposta(200, { ok: true, dati });
  } catch (e) {
    if (e instanceof logica.ErroreUtente || e.utente) {
      if (/Codice non riconosciuto|Chiave di configurazione/.test(e.message)) await new Promise((r) => setTimeout(r, 800));
      return risposta(400, { errore: e.message });
    }
    console.error(e);
    await segnala(e, p.azione, { att: p.att, livello: QUOTA.test(e.message || '') ? 'avviso' : 'errore' });
    if (QUOTA.test(e.message || '')) return risposta(503, { errore: 'In questo momento il glossario non è raggiungibile per troppi accessi. Riprova più tardi: i tuoi dati sono al sicuro.' });
    return risposta(500, { errore: 'Errore del server: ' + (e.message || 'riprova tra poco.') + ' (l\'errore è stato registrato)' });
  }
};
