/**
 * Attività parallele: ognuna ha le sue classi, aree (cartelloni), termini, scritto, quiz, interrogazione e voto finale,
 * in uno spazio dati separato (vedi firestore.js). L'attività di sempre (3E e 3F) è «main» e non cambia.
 * Il docente sceglie l'attività su cui lavorare (parametro att); gli alunni entrano con il codice e finiscono nella loro.
 */
const L = require('./logica');
const ED = require('./edizioni');
const { db: apri } = require('./firestore');

const err = (m) => L.errore(m);
const norm = (c) => String(c == null ? '' : c).trim().toUpperCase();
// azioni degli alunni: l'attività si ricava dal codice
const DA_CODICE = { login: 1, scegli: 1, presenza: 1, quizinizio: 1, quizrisposta: 1, quizregole: 1 };

// elenco in memoria per pochi secondi: il quiz fa una richiesta a ogni risposta
let cache = { t: 0, elenco: null };
async function registro(base, fresco) {
  if (!fresco && cache.elenco && Date.now() - cache.t < 20000) return cache.elenco;
  const elenco = await base.leggiRegistro();
  cache = { t: Date.now(), elenco };
  return elenco;
}
function svuota() { cache = { t: 0, elenco: null }; }

async function risolvi(dbf, p) {
  const base = dbf('main');
  if (p.att && p.att !== 'main') {
    const reg = await registro(base);
    if (!reg.some((x) => x.id === p.att) && !(await registro(base, true)).some((x) => x.id === p.att)) {
      if (p.azione === 'pubblico') return base; // link vecchio della pagina pubblica: si mostra il glossario principale
      err('Questa attività non c\'è più: ricarica la pagina.');
    }
    return dbf(p.att);
  }
  if (p.att === 'main' || !DA_CODICE[p.azione] || !p.codice) return base;
  const reg = await registro(base);
  if (!reg.length) return base;
  const c = norm(p.codice);
  if (await base.alunnoDaCodice(c)) return base;
  for (const x of reg) { const d = dbf(x.id); if (await d.alunnoDaCodice(c)) return d; }
  return base;
}

async function principale(d) {
  const cfg = d.spazio === 'main' ? null : await d.configPrincipale();
  return cfg;
}
/* elenco per la barra del docente: attività principale + parallele */
async function elencoDocente(d) {
  const base = apri('main'), reg = await registro(base, true);
  const cm = (await base.configPrincipale()) || {};
  const ed = L.edizioneDi(cm);
  return [{ id: 'main', nome: ed.nome, as: ed.as, classi: L.impostazioni(cm).classi }].concat(reg.map((x) => ({ id: x.id, nome: x.nome, as: x.as, classi: x.classi })));
}
/* elenco per la pagina pubblica (solo nomi) */
async function elencoPubblico(d) {
  const reg = await registro(apri('main'));
  if (!reg.length) return [];
  return elencoDocente(d).then((e) => e.map((x) => ({ id: x.id, nome: x.nome, as: x.as, classi: x.classi })));
}
async function elenco(d, { codice }) {
  const stato = await d.leggiTutto(); L.soloAdmin(L.identifica(stato, codice));
  return { spazi: await elencoDocente(d) };
}

function idDa(nome, usati) {
  const base = String(nome).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'attivita';
  let id = base, k = 2;
  while (usati.has(id) || id === 'main') { id = base + '-' + k; k++; }
  return id;
}
/* nuova attività parallela: non tocca quelle in corso */
async function nuovaAttivita(d, p) {
  const base = apri('main');
  const statoMain = await base.leggiTutto();
  L.soloAdmin(L.identifica(statoMain, p.codice));
  const reg = await registro(base, true);
  // codici di tutti gli alunni di tutte le attività: restano unici, così il codice porta sempre all'attività giusta
  const codici = await base.codiciAlunni();
  for (const x of reg) codici.push(...await apri(x.id).codiciAlunni());
  // si parte da uno stato vuoto (nessun alunno da riprendere), con i docenti di sempre
  const vuoto = { config: { docenti: statoMain.config.docenti || [], proposta: statoMain.config.proposta, giorniIt: statoMain.config.giorniIt, riassegnazione: statoMain.config.riassegnazione }, alunni: [], termini: [] };
  const { config, alunni, docs, nome, as } = ED.costruisci(vuoto, Object.assign({}, p, { colleghi: null }), codici);
  const id = idDa(nome, new Set(reg.map((x) => x.id)));
  const edMain = L.edizioneDi(statoMain.config);
  config.edizione.id = await ED.nuovoIdEdizione(base, as, [edMain.id].concat(reg.map((x) => x.ed || '')));
  delete config.docenti; // i docenti sono quelli dell'attività principale
  const nd = apri(id);
  await nd.sostituisciTutto({ config, alunni, termini: docs, attivita: [] });
  await base.scriviRegistro(reg.concat([{ id, nome, as, ed: config.edizione.id, classi: config.classi, creata: new Date().toISOString() }]));
  svuota();
  return { id, nome, as, alunni: alunni.length, termini: docs.length, classi: config.classi, aree: config.aree || null };
}
/* togli un'attività dall'elenco: prima la si chiude agli alunni e la si archivia (resta consultabile in Archivio) */
async function rimuovi(d, { codice, id }) {
  const base = apri('main');
  const statoMain = await base.leggiTutto();
  L.soloAdmin(L.identifica(statoMain, codice));
  const reg = await registro(base, true);
  if (!reg.some((x) => x.id === id)) err('Attività non trovata.');
  const nd = apri(id);
  await nd.scriviConfig({ chiusa: true });
  const arch = await ED.archivia(nd, { codice, sovrascrivi: true });
  await base.scriviRegistro(reg.filter((x) => x.id !== id));
  svuota();
  return { id, archiviata: arch.id };
}

/* nomi, colori, numeri e motti dei cartelloni di un'attività con aree proprie (il numero di aree non cambia) */
async function salvaAree(d, { codice, aree }) {
  const stato = await d.leggiTutto(); L.soloAdmin(L.identifica(stato, codice));
  const vecchie = stato.config.aree;
  if (!Array.isArray(vecchie) || !vecchie.length) err('Questa attività usa le 4 aree del laboratorio: nomi e motti restano quelli.');
  if (!Array.isArray(aree) || aree.length !== vecchie.length) err('Il numero delle aree non si può cambiare.');
  const nuove = ED.validaAree(aree);
  await d.scriviConfig({ aree: nuove });
  return { aree: nuove };
}
module.exports = { salvaAree, risolvi, elencoDocente, elencoPubblico, elenco, nuovaAttivita, rimuovi, svuota, principale };
