/* Pubblicazione del glossario sulla pagina pubblica: termini, definizioni e autori vanno online solo quando
   il docente preme «Pubblica sulla pagina pubblica». Fino ad allora la pagina pubblica mostra l'ultima versione
   pubblicata (o nessun termine, se non è mai stato pubblicato). */
const L = require('./logica');

const contaDef = (P) => (P.aree || []).reduce((s, a) => s + a.termini.filter((t) => t.def).length, 0);
const chiave = (a, t) => String(a.it || a.n) + '|' + String(t.termine).toLowerCase();

/* confronto tra ciò che è pubblicato e ciò che è approvato adesso */
function differenze(snap, cur) {
  const prima = {};
  ((snap && snap.aree) || []).forEach((a) => a.termini.forEach((t) => { if (t.def) prima[chiave(a, t)] = t.def + '\u0001' + (t.autore || ''); }));
  let nuove = 0, cambiate = 0, tolte = 0; const ora = {};
  (cur.aree || []).forEach((a) => a.termini.forEach((t) => {
    if (!t.def) return;
    const k = chiave(a, t), v = t.def + '\u0001' + (t.autore || ''); ora[k] = 1;
    if (!(k in prima)) nuove++; else if (prima[k] !== v) cambiate++;
  }));
  Object.keys(prima).forEach((k) => { if (!ora[k]) tolte++; });
  return { nuove, cambiate, tolte, totale: nuove + cambiate + tolte };
}

function riepilogo(meta, cur) {
  const d = differenze(meta && meta.dati, cur);
  return { pubblicato: !!meta, il: meta ? meta.il : null, da: meta ? meta.da : '', n: meta ? meta.n : 0, approvate: contaDef(cur), novita: d };
}

/* stato per il docente (con il glossario già letto) */
async function stato(db, statoGl) {
  if (!db.leggiPubblicazione || !statoGl || !statoGl.config) return null;
  return riepilogo(await db.leggiPubblicazione(), L.pubblicoDa(statoGl));
}

async function pubblica(db, { codice }) {
  const st = await db.leggiTutto();
  const chi = L.identifica(st, codice); L.soloGestore(chi);
  const cur = L.pubblicoDa(st);
  const meta = { il: new Date().toISOString(), da: chi.nome, n: contaDef(cur), dati: JSON.parse(JSON.stringify({ aree: cur.aree, classi: cur.classi })) }; // Firestore non accetta campi «undefined» (es. numero dell'area non impostato)
  await db.scriviPubblicazione(meta);
  return riepilogo(meta, cur);
}

module.exports = { pubblica, stato, differenze, contaDef };
