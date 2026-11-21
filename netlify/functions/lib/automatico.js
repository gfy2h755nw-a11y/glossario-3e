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

/* cartella Dropbox di un'attività: la principale (3E e 3F) resta alla radice, le altre in /Attivita/<id> */
const cartella = (db) => (!db.spazio || db.spazio === 'main' ? '' : '/Attivita/' + db.spazio);
async function inviaSpazio(db, token, now) {
  const C = cartella(db);
  const grezzo = await db.backupGrezzo(!C); // l'archivio delle edizioni concluse va con la principale (è comune)
  if (!grezzo.config) return null;
  const { stato, attivita } = statoDa(grezzo);
  const pdf = await creaReport(stato, attivita, now);
  const json = Buffer.from(JSON.stringify(backupDa(grezzo, now), null, 1), 'utf8');
  const t = timbro(now), nome = C ? db.spazio : 'glossario-3e';
  const file = [C + '/Backup/' + nome + '_backup_' + t + '.json', C + '/Report/Report_Glossario_' + (C ? db.spazio : '3E') + '_' + t + '.pdf', C + '/Report_ULTIMO.pdf'];
  await dbx.carica(token, file[0], json);
  await dbx.carica(token, file[1], pdf);
  await dbx.carica(token, file[2], pdf);
  // Word delle definizioni approvate: sempre lo stesso file, sovrascritto
  await dbx.carica(token, C + NOME_DROPBOX, await creaWord(stato, now));
  file.push(C + NOME_DROPBOX);
  return { file, kb: Math.round((pdf.length + json.length) / 1024) };
}
/* backup + report + Word su Dropbox: dell'attività principale e di tutte le attività in parallelo */
async function esegui(db, motivo) {
  const now = Date.now();
  const segreto = await db.leggiSegreto('dropbox');
  if (!dbx.configurato() || !segreto || !segreto.refresh) return { saltato: true, motivo: 'Dropbox non collegato' };
  try {
    const { db: apri } = require('./firestore');
    const principale = db.spazio && db.spazio !== 'main' ? apri('main') : db;
    try { await require('./demo').pulisci(principale); } catch (e) { /* le demo scadute si tolgono alla prossima occasione */ }
    const reg = (principale.leggiRegistro ? await principale.leggiRegistro() : []).filter((x) => !x.demo); // le demo non vanno su Dropbox
    const token = await dbx.tokenAccesso(segreto);
    const r0 = await inviaSpazio(principale, token, now);
    if (!r0) return { saltato: true, motivo: 'Glossario non ancora configurato' };
    const file = r0.file.slice(); let kb = r0.kb; const attivita = [];
    for (const x of reg) {
      try { const r = await inviaSpazio(apri(x.id), token, now); if (r) { file.push(...r.file); kb += r.kb; attivita.push({ id: x.id, nome: x.nome, esito: 'ok' }); } }
      catch (e) { attivita.push({ id: x.id, nome: x.nome, esito: 'errore: ' + String(e.message || e).slice(0, 200) }); }
    }
    const errAtt = attivita.filter((a) => a.esito !== 'ok');
    await principale.scriviSegreto('dropbox', { ultimoInvio: new Date(now).toISOString(), esito: errAtt.length ? 'ok, ma non per: ' + errAtt.map((a) => a.nome).join(', ') : 'ok', motivo: motivo || '', file, attivita });
    return { ok: true, file, kb, attivita };
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
  if (b.archivio && (!Array.isArray(b.archivio) || !Array.isArray(b.archivio_parti || []))) no('archivio non valido');
  return b;
}

/* copia dello stato attuale su Dropbox prima di un ripristino o di una nuova edizione (se Dropbox è collegato) */
async function copiaPrima(db, motivo) {
  const segreto = await db.leggiSegreto('dropbox');
  if (!dbx.configurato() || !segreto || !segreto.refresh) return 'non collegato';
  try {
    const now = Date.now(), grezzo = await db.backupGrezzo(true);
    const percorso = cartella(db) + '/Backup/prima_di_' + motivo + '_' + timbro(now) + '.json';
    await dbx.carica(await dbx.tokenAccesso(segreto), percorso, Buffer.from(JSON.stringify(backupDa(grezzo, now), null, 1), 'utf8'));
    return percorso;
  } catch (e) { return 'errore: ' + String(e.message || e).slice(0, 200); }
}

module.exports = { cartella, esegui, backupDa, statoDa, validaBackup, copiaPrima, timbro, FORMATO };
