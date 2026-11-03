/**
 * Dropbox: collegamento OAuth (token di lunga durata) e caricamento file nella cartella dell'app.
 * Variabili Netlify: DROPBOX_APP_KEY, DROPBOX_APP_SECRET. URL (impostata da Netlify) = indirizzo del sito.
 * Il token resta in Firestore, raccolta "segreti", documento "dropbox": non arriva mai al browser.
 */
const crypto = require('crypto');

const BASE = {
  www: process.env.DROPBOX_TEST_BASE || 'https://www.dropbox.com',
  api: process.env.DROPBOX_TEST_BASE || 'https://api.dropboxapi.com',
  content: process.env.DROPBOX_TEST_BASE || 'https://content.dropboxapi.com'
};

const configurato = () => !!(process.env.DROPBOX_APP_KEY && process.env.DROPBOX_APP_SECRET);
const sito = () => String(process.env.URL || '').replace(/\/$/, '');
const redirectUri = () => sito() + '/dropbox';

function richiedeConfig() {
  if (!configurato()) throw Object.assign(new Error('Dropbox non configurato: aggiungi DROPBOX_APP_KEY e DROPBOX_APP_SECRET nelle variabili di Netlify e rifai il deploy.'), { utente: true });
  if (!sito()) throw Object.assign(new Error('Indirizzo del sito sconosciuto (variabile URL di Netlify).'), { utente: true });
}

/* 1. link per autorizzare: lo stato casuale protegge da richieste false */
async function linkCollegamento(db) {
  richiedeConfig();
  const stato = crypto.randomBytes(16).toString('hex');
  await db.scriviSegreto('dropbox', { attesa: { stato, scade: Date.now() + 15 * 60000 } });
  const q = new URLSearchParams({ client_id: process.env.DROPBOX_APP_KEY, response_type: 'code', token_access_type: 'offline', redirect_uri: redirectUri(), state: stato });
  return BASE.www + '/oauth2/authorize?' + q.toString();
}

async function postForm(url, campi) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(campi).toString() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Dropbox: ' + (j.error_description || j.error_summary || j.error || r.status));
  return j;
}

/* 2. ritorno da Dropbox: scambio del codice con il token di lunga durata */
async function completaCollegamento(db, code, stato) {
  richiedeConfig();
  const s = (await db.leggiSegreto('dropbox')) || {};
  if (!s.attesa || s.attesa.stato !== stato || Date.now() > s.attesa.scade) throw new Error('Richiesta scaduta o non valida: riprova da "Collega Dropbox" nell\'app.');
  const j = await postForm(BASE.api + '/oauth2/token', { code, grant_type: 'authorization_code', redirect_uri: redirectUri(), client_id: process.env.DROPBOX_APP_KEY, client_secret: process.env.DROPBOX_APP_SECRET });
  if (!j.refresh_token) throw new Error('Dropbox non ha restituito un token di lunga durata.');
  let account = '';
  try {
    const r = await fetch(BASE.api + '/2/users/get_current_account', { method: 'POST', headers: { Authorization: 'Bearer ' + j.access_token } });
    const a = await r.json(); account = (a.name && a.name.display_name ? a.name.display_name : '') + (a.email ? ' (' + a.email + ')' : '');
  } catch (e) { /* facoltativo */ }
  await db.scriviSegreto('dropbox', { refresh: j.refresh_token, account, collegato: new Date().toISOString(), attesa: null });
}

async function tokenAccesso(s) {
  const j = await postForm(BASE.api + '/oauth2/token', { grant_type: 'refresh_token', refresh_token: s.refresh, client_id: process.env.DROPBOX_APP_KEY, client_secret: process.env.DROPBOX_APP_SECRET });
  return j.access_token;
}

/* 3. caricamento: percorsi relativi alla cartella dell'app (Dropbox › App › <nome app>) */
async function carica(token, percorso, contenuto) {
  // l'intestazione accetta solo ASCII: i caratteri accentati vanno codificati
  const arg = JSON.stringify({ path: percorso, mode: 'overwrite', mute: true }).replace(/[\u007f-￿]/g, (c) => '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4));
  const r = await fetch(BASE.content + '/2/files/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': arg },
    body: contenuto
  });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error('Caricamento di ' + percorso + ' non riuscito (' + r.status + ') ' + t.slice(0, 200)); }
  return r.json();
}

/* stato da mostrare nell'app (senza token) */
async function statoPubblico(db) {
  const s = (await db.leggiSegreto('dropbox')) || {};
  return { configurato: configurato(), collegato: !!s.refresh, account: s.account || '', dal: s.collegato || null,
    ultimoInvio: s.ultimoInvio || null, esito: s.esito || '', file: s.file || [] };
}

module.exports = { configurato, linkCollegamento, completaCollegamento, tokenAccesso, carica, statoPubblico, redirectUri };
