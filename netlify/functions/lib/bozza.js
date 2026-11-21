/* Bozza della procedura «Nuova attività»: salvata a ogni passo, si riprende da qualsiasi dispositivo. */
const L = require('./logica');
const { soloCerrato } = require('./banca');
const MAX = 400000; // caratteri: resta lontano dal limite di 1 MiB del documento

async function leggi(db, { codice }) {
  await soloCerrato(db, codice);
  const x = await db.leggiBozzaWz();
  return x && x.dati ? { dati: x.dati, salvata: x.salvata } : null;
}
async function salva(db, { codice, dati }) {
  await soloCerrato(db, codice);
  if (dati == null) { await db.scriviBozzaWz(null); return { tolta: true }; }
  const s = typeof dati === 'string' ? dati : JSON.stringify(dati);
  if (s.length > MAX) L.errore('Bozza troppo grande per essere salvata.');
  try { JSON.parse(s); } catch (e) { L.errore('Bozza non valida.'); }
  const salvata = new Date().toISOString();
  await db.scriviBozzaWz({ dati: s, salvata });
  return { salvata };
}
module.exports = { leggi, salva };
