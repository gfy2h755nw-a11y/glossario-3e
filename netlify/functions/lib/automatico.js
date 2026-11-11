/**
 * Backup completo (.json) + report (.pdf) caricati su Dropbox.
 * Usato dalla funzione programmata (ogni sera) e dal pulsante "Invia ora" dell'area admin.
 */
const { creaReport } = require('./report');
const dbx = require('./dropbox');
const { creaWord, NOME_DROPBOX } = require('./word');

const FORMATO = 'glossario3e-backup';

function backupDa(grezzo, now) {
  return Object.assign({ formato: FORMATO, versione: 1, creato: new Date(now).toISOString() }, grezzo);
}
function statoDa(grezzo) {
  const attivita = {};
  (grezzo.attivita || []).forEach((d) => { const { id, ...r } = d; attivita[id] = r; });
  return { stato: { config: grezzo.config, alunni: grezzo.alunni, termini: grezzo.termini }, attivita };
}
function timbro(now) {
  const p = {};
  new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date(now)).forEach((x) => { p[x.type] = x.value; });
  return p.year + '-' + p.month + '-' + p.day + '_' + p.hour + p.minute;
}

async function esegui(db, motivo) {
  const now = Date.now();
  const segreto = await db.leggiSegreto('dropbox');
  if (!dbx.configurato() || !segreto || !segreto.refresh) return { saltato: true, motivo: 'Dropbox non collegato' };
  try {
    const grezzo = await db.backupGrezzo();
    if (!grezzo.config) return { saltato: true, motivo: 'Glossario non ancora configurato' };
    const { stato, attivita } = statoDa(grezzo);
    const pdf = await creaReport(stato, attivita, now);
    const json = Buffer.from(JSON.stringify(backupDa(grezzo, now), null, 1), 'utf8');
    const t = timbro(now), token = await dbx.tokenAccesso(segreto);
    const file = ['/Backup/glossario-3e_backup_' + t + '.json', '/Report/Report_Glossario_3E_' + t + '.pdf', '/Report_ULTIMO.pdf'];
    await dbx.carica(token, file[0], json);
    await dbx.carica(token, file[1], pdf);
    await dbx.carica(token, file[2], pdf);
    // Word delle definizioni approvate: sempre lo stesso file, sovrascritto
    await dbx.carica(token, NOME_DROPBOX, await creaWord(stato, now));
    file.push(NOME_DROPBOX);
    await db.scriviSegreto('dropbox', { ultimoInvio: new Date(now).toISOString(), esito: 'ok', motivo: motivo || '', file });
    return { ok: true, file, kb: Math.round((pdf.length + json.length) / 1024) };
  } catch (e) {
    if (/invalid_grant|expired_access_token|invalid_access_token/.test(String(e.message))) e.message = 'autorizzazione Dropbox scaduta o revocata: premi "Scollega Dropbox" e poi "Collega Dropbox"';
    await db.scriviSegreto('dropbox', { ultimoInvio: new Date(now).toISOString(), esito: 'errore: ' + String(e.message || e).slice(0, 300), motivo: motivo || '' }).catch(() => {});
    throw e;
  }
}

/* controllo del file prima del ripristino */
function validaBackup(b) {
  const no = (m) => { throw Object.assign(new Error('File di backup non valido: ' + m + '.'), { utente: true }); };
  if (!b || typeof b !== 'object') no('non è un file JSON');
  if (b.formato !== FORMATO) no('non è un backup completo del Glossario 3E (usa i file della cartella Backup o "Scarica backup completo")');
  if (!b.config || !Array.isArray(b.config.docenti) || !b.config.docenti.length) no('mancano le impostazioni');
  if (!Array.isArray(b.alunni) || !b.alunni.length || !b.alunni.every((a) => a.id && a.nome && a.codice)) no('elenco alunni incompleto');
  if (!Array.isArray(b.termini) || !b.termini.length || !b.termini.every((t) => t.id && t.area && t.alunno_id)) no('elenco termini incompleto');
  if (b.attivita && !Array.isArray(b.attivita)) no('registro attività non valido');
  return b;
}

module.exports = { esegui, backupDa, statoDa, validaBackup, FORMATO };
