/**
 * Glossario odontotecnico bilingue – Classe 3E – a.s. 2026/27
 * Funzione Netlify: unico punto di accesso ai dati (Firestore).
 * POST /api  { azione, ...parametri }
 */
const logica = require('./lib/logica');
const { db } = require('./lib/firestore');
const ATT = require('./lib/attivita');
const auto = require('./lib/automatico');
const DBX = require('./lib/dropbox');
const ED = require('./lib/edizioni');

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
  archivioconsulta: (d, p) => ED.consultaArchivio(d, p),
  archiviofile: (d, p) => ED.fileArchivio(d, p),
  generatermini: (d, p) => ED.generaTermini(d, p),
  verificatermini: (d, p) => ED.verificaTermini(d, p),
  nuovaedizione: (d, p) => ED.nuovaEdizione(d, p),
  aggiungiclasse: (d, p) => ED.aggiungiClasse(d, p),
  setup: (d, p) => logica.setup(d, p, process.env.SETUP_KEY),
  // segnale di presenza (ogni minuto, app aperta in primo piano): serve solo al registro attività
  presenza: async () => ({}),
  // pagina pubblica /glossario: nessun codice richiesto, solo definizioni approvate
  pubblico: (d, p) => ED.pubblico(d, { ed: p.ed }),
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
    await logica.verificaAdmin(d, p.codice);
    const tutto = auto.statoDa(await d.backupGrezzo());
    const stato = logica.statoClasse(tutto.stato, p.classe);
    const buf = await require('./lib/presentazione').creaPresentazione(stato, tutto.attivita, Date.now());
    return { nome: 'Glossario_' + logica.nomeClassi(stato).replace(/ e /g, '-') + '_report_attivita_' + new Date().toISOString().slice(0, 10) + '.pptx', base64: buf.toString('base64') };
  },
  // presentazione per gli studenti di una classe, con partenza e scadenza prese dalle impostazioni
  presentazionestudenti: async (d, p) => {
    await logica.verificaAdmin(d, p.codice);
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
    await logica.verificaAdmin(d, p.codice);
    const now = Date.now();
    const { stato } = auto.statoDa(await d.backupGrezzo());
    const { creaWord, NOME_DROPBOX } = require('./lib/word');
    const buf = await creaWord(stato, now);
    let dropbox = 'non collegato';
    const segreto = await d.leggiSegreto('dropbox');
    if (DBX.configurato() && segreto && segreto.refresh) {
      try { await DBX.carica(await DBX.tokenAccesso(segreto), NOME_DROPBOX, buf); dropbox = 'ok'; } catch (e) { dropbox = 'errore: ' + String(e.message || e).slice(0, 200); }
    }
    return { nome: 'Glossario_definizioni_approvate.docx', base64: buf.toString('base64'), dropbox, percorso: NOME_DROPBOX };
  },
  dropboxinvia: async (d, p) => {
    await logica.verificaAdmin(d, p.codice);
    const r = await auto.esegui(d, 'manuale');
    if (r.saltato) throw Object.assign(new Error(r.motivo + '.'), { utente: true });
    return Object.assign(r, { stato: await DBX.statoPubblico(d) });
  }
};
const TRACCIA = { login: 'login', scegli: 'scegli', presenza: 'presenza' };
async function traccia(d, p, event) {
  try {
    const a = await d.alunnoDaCodice(p.codice);
    if (!a) return;
    const now = Date.now(), disp = ATT.dispositivo((event.headers || {})['user-agent']);
    await d.registraAttivita(a.id, (cur) => ATT.aggiorna(cur, now, disp, TRACCIA[p.azione]));
  } catch (e) { console.error('registro attività:', e.message); }
}

const risposta = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return risposta(405, { errore: 'Metodo non consentito.' });
  let p;
  try { p = JSON.parse(event.body || '{}'); } catch (e) { return risposta(400, { errore: 'Richiesta non valida.' }); }
  const fn = AZIONI[p.azione];
  if (!fn) return risposta(400, { errore: 'Azione sconosciuta.' });
  try {
    const d = db();
    if (p.azione !== 'setup') await logica.migra(d);
    if (p.azione === 'login' || p.azione === 'scegli') await logica.manutenzione(d);
    const dati = await fn(d, p);
    if (TRACCIA[p.azione] && p.codice) await traccia(d, p, event);
    return risposta(200, { ok: true, dati });
  } catch (e) {
    if (e instanceof logica.ErroreUtente || e.utente) {
      if (/Codice non riconosciuto|Chiave di configurazione/.test(e.message)) await new Promise((r) => setTimeout(r, 800));
      return risposta(400, { errore: e.message });
    }
    console.error(e);
    return risposta(500, { errore: 'Errore del server: ' + (e.message || 'riprova tra poco.') });
  }
};
