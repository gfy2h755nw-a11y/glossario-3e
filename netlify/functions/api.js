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

const AZIONI = {
  login: (d, p) => logica.login(d, p),
  scegli: (d, p) => logica.scegli(d, p),
  revisiona: (d, p) => logica.revisiona(d, p),
  approvacorrette: (d, p) => logica.approvaCorrette(d, p),
  chiusura: (d, p) => logica.impostaChiusura(d, p),
  impostazioni: (d, p) => logica.impostazioniAdmin(d, p),
  voto: (d, p) => logica.votoManuale(d, p),
  riammetti: (d, p) => logica.riammetti(d, p),
  setup: (d, p) => logica.setup(d, p, process.env.SETUP_KEY),
  // segnale di presenza (ogni minuto, app aperta in primo piano): serve solo al registro attività
  presenza: async () => ({}),
  // solo prof. Cerrato: backup, ripristino, Dropbox
  backup: async (d, p) => { await logica.verificaAdmin(d, p.codice); return auto.backupDa(await d.backupGrezzo(), Date.now()); },
  ripristina: async (d, p) => {
    await logica.verificaAdmin(d, p.codice);
    const b = auto.validaBackup(p.backup);
    await d.ripristina(b);
    return { alunni: b.alunni.length, termini: b.termini.length, attivita: (b.attivita || []).length, creato: b.creato };
  },
  // presentazione PowerPoint di riepilogo (grafici nativi)
  presentazione: async (d, p) => {
    await logica.verificaAdmin(d, p.codice);
    const { stato, attivita } = auto.statoDa(await d.backupGrezzo());
    const buf = await require('./lib/presentazione').creaPresentazione(stato, attivita, Date.now());
    return { nome: 'Glossario_3E_report_attivita_' + new Date().toISOString().slice(0, 10) + '.pptx', base64: buf.toString('base64') };
  },
  dropboxcollega: async (d, p) => { await logica.verificaAdmin(d, p.codice); return { url: await DBX.linkCollegamento(d) }; },
  dropboxscollega: async (d, p) => { await logica.verificaAdmin(d, p.codice); await d.cancellaSegreto('dropbox'); return { scollegato: true }; },
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
