/**
 * Glossario odontotecnico bilingue – Classe 3E – a.s. 2026/27
 * Funzione Netlify: unico punto di accesso ai dati (Firestore).
 * POST /api  { azione, ...parametri }
 */
const logica = require('./lib/logica');
const { db } = require('./lib/firestore');

const AZIONI = {
  login: (d, p) => logica.login(d, p),
  scegli: (d, p) => logica.scegli(d, p),
  revisiona: (d, p) => logica.revisiona(d, p),
  approvacorrette: (d, p) => logica.approvaCorrette(d, p),
  chiusura: (d, p) => logica.impostaChiusura(d, p),
  impostazioni: (d, p) => logica.impostazioniAdmin(d, p),
  voto: (d, p) => logica.votoManuale(d, p),
  riammetti: (d, p) => logica.riammetti(d, p),
  setup: (d, p) => logica.setup(d, p, process.env.SETUP_KEY)
};

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
    return risposta(200, { ok: true, dati: await fn(d, p) });
  } catch (e) {
    if (e instanceof logica.ErroreUtente || e.utente) {
      if (/Codice non riconosciuto|Chiave di configurazione/.test(e.message)) await new Promise((r) => setTimeout(r, 800));
      return risposta(400, { errore: e.message });
    }
    console.error(e);
    return risposta(500, { errore: 'Errore del server: ' + (e.message || 'riprova tra poco.') });
  }
};
