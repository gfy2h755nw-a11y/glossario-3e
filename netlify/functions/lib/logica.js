/**
 * Logica del Glossario 3E – modalità "scegli la definizione tra 8".
 * Le risposte giuste restano sul server: agli alunni arrivano solo le lettere A–H con i testi.
 * Il database è passato come "db": leggiTutto(), scriviConfig(mod), esisteGlossario(),
 * creaGlossario(config, alunni, termini), transazione(fn) con ctx.leggiTutto() / ctx.scriviTermine(id, mod).
 */
const DATI = require('./dati');
const ATT = require('./attivita');
const DBX = require('./dropbox');
const CAT = require('./catalogo');
const SIM = require('./simili');
const BANCA = require('./banca-termini');

const N_OPZIONI = 8;
const LETTERE = 'ABCDEFGH';

class ErroreUtente extends Error {}
const errore = (m) => { throw new ErroreUtente(m); };

function norm(s) { return String(s == null ? '' : s).trim().toUpperCase(); }
function pulisci(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 300); }
function pad2(n) { return ('0' + n).slice(-2); }
function adesso() {
  return new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    .format(new Date()).replace(',', '');
}
function generaCodice(usati) {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const crypto = require('crypto');
  let c;
  do {
    c = '';
    const b = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) c += alfabeto[b[i] % alfabeto.length];
  } while (usati && usati.has(c));
  if (usati) usati.add(c);
  return c;
}

/* ---------- alternative: la giusta + 7 termini vicini della stessa area, ordine fisso per termine e lingua ---------- */
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function indiceTermine(t) { return Number(String(t.id).slice(2)) - 1; }
function opzioni(t, l) {
  const k = indiceTermine(t), [lo, hi] = CAT.blocco(t.area, k);
  const cand = [], d = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7, 8, -8, 9, -9];
  for (let i = 0; i < d.length && cand.length < N_OPZIONI - 1; i++) { const j = k + d[i]; if (j >= lo && j < hi) cand.push(j); }
  // blocco con meno di 8 termini (classe aggiunta con pochi termini in quest'area): si completano con i termini precedenti più vicini
  for (let j = lo - 1; j >= 0 && cand.length < N_OPZIONI - 1; j--) cand.push(j);
  const ops = [k].concat(cand), r = rng(hash(t.id + l));
  for (let x = ops.length - 1; x > 0; x--) { const y = Math.floor(r() * (x + 1)); [ops[x], ops[y]] = [ops[y], ops[x]]; }
  return ops;
}
function testoDef(area, idx, l) { return CAT.definizione(area, idx, l); }
function giusta(t) { return indiceTermine(t); }

/* ---------- identità ---------- */
function identifica(stato, codice) {
  const c = norm(codice);
  if (!c) errore('Inserisci il tuo codice.');
  const doc = (stato.config.docenti || []).find((d) => d.codice && norm(d.codice) === c);
  if (doc) {
    const def = DATI.DOCENTI.find((d) => d.nome === doc.nome) || {};
    return { ruolo: 'docente', nome: doc.nome, lingua: doc.lingua || def.lingua || 'it', admin: !!(doc.admin || def.admin) };
  }
  const a = stato.alunni.find((x) => norm(x.codice) === c);
  if (a) return { ruolo: 'alunno', id: a.id, nome: a.nome, gruppo: String(a.gruppo), classe: classeDi(a), _a: a };
  errore('Codice non riconosciuto. Controlla di averlo scritto bene.');
}

/* ---------- impostazioni e valutazione ---------- */
const PENALITA = { A: 0.25, B: 0.5 };
function impostazioni(config) {
  const sc = config.scadenze || {};
  return {
    scadenzaIt: sc.it || DATI.SCADENZE.it,
    scadenzaEn: sc.en || DATI.SCADENZE.en,
    proposta: PENALITA[config.proposta] ? config.proposta : DATI.VALUTAZIONE.proposta,
    votoMax: DATI.VALUTAZIONE.votoMax,
    votoMaxErede: DATI.VALUTAZIONE.votoMaxErede,
    tetto: DATI.VALUTAZIONE.tettoEredeInRitardo,
    giorniIt: Number(config.giorniIt) > 0 ? Number(config.giorniIt) : DATI.EREDITA.giorniIt,
    giorniEn: Number(config.giorniEn) > 0 ? Number(config.giorniEn) : DATI.EREDITA.giorniEn,
    votoMin: DATI.VALUTAZIONE.votoMin,
    votoEsclusione: DATI.VALUTAZIONE.votoEsclusione,
    lingue: Array.isArray(config.lingue) && config.lingue.length ? (config.lingue.filter((l) => DATI.LINGUE.indexOf(l) >= 0).length ? config.lingue.filter((l) => DATI.LINGUE.indexOf(l) >= 0) : DATI.LINGUE.slice()) : DATI.LINGUE,
    partenza: config.partenza !== undefined ? config.partenza : DATI.PARTENZA,
    classi: Array.isArray(config.classi) && config.classi.length ? config.classi : DATI.CLASSI,
    // date diverse per classe: { '3F': { partenza, scadenzaIt } } (se manca, valgono quelle generali)
    calendario: config.calendario && typeof config.calendario === 'object' ? config.calendario : {},
    // 'auto': i termini degli esclusi passano a sorte a un compagno; 'manuale': decide il docente
    riassegnazione: config.riassegnazione === 'manuale' ? 'manuale' : 'auto',
    tpaClassi: config.tpaClassi || {},
    edizione: edizioneDi(config)
  };
}
function edizioneDi(config) {
  const e = (config && config.edizione) || {};
  const classi = Array.isArray(config && config.classi) && config.classi.length ? config.classi : DATI.CLASSI;
  const elenco = classi.length > 1 ? classi.slice(0, -1).join(', ') + ' e ' + classi[classi.length - 1] : classi.join('');
  return { id: e.id || '2026-27-1', nome: e.nome || 'Glossario odontotecnico ' + elenco, as: e.as || '2026/27', creata: e.creata || null };
}
/* impostazioni viste da una classe: partenza e scadenza della classe se diverse da quelle generali */
function impClasse(imp, classe) {
  const c = (imp.calendario || {})[classe] || {};
  return Object.assign({}, imp, { partenza: c.partenza !== undefined ? c.partenza : imp.partenza, scadenzaIt: c.scadenzaIt || imp.scadenzaIt });
}
/* scadenza personale (ms): quella della classe, oppure la proroga se più tarda */
function scadenzaAlunno(imp, a) {
  const base = Date.parse(impClasse(imp, classeDi(a)).scadenzaIt), p = a && a.proroga ? Date.parse(a.proroga) : 0;
  return Math.max(base, p || 0);
}
/* la scadenza più vicina tra tutte le classi e le proroghe (prima non può esserci nessun escluso) */
function primaScadenza(imp) {
  return Math.min.apply(null, [Date.parse(imp.scadenzaIt)].concat(imp.classi.map((c) => Date.parse(impClasse(imp, c).scadenzaIt))));
}
function termPerAlunno(imp, classe) { return Number(imp.tpaClassi[classe]) > 0 ? Number(imp.tpaClassi[classe]) : DATI.TERMINI_PER_ALUNNO; }
// il compito è partito? (senza data di partenza gli alunni restano in attesa)
function partito(imp, now) { return !!imp.partenza && (now || Date.now()) >= Date.parse(imp.partenza); }
const classeDi = (a) => (a && a.classe) || '3E';
const fmtN = (n) => String(n).replace('.', ',');
// arrotondamento al quarto di voto più vicino: sotto la metà per difetto, dalla metà in su per eccesso (7,375 → 7,5; 7,3 → 7,25)
function arrot(x) { return Math.floor(x * 4 + 0.5 + 1e-9) / 4; }
function ratio(imp) {
  const p = String(PENALITA[imp.proposta]).replace('.', ',');
  if (!conInglese(imp)) {
    return 'Il voto si calcola sulle risposte in italiano: si parte da ' + fmtN(imp.votoMax) + ' e si tolgono ' + p +
      ' punti per ogni risposta errata (proposta ' + imp.proposta + '), senza scendere sotto ' + imp.votoMin + '. ' +
      'Il voto compare dalla prima risposta inviata. ' +
      'Chi non risponde a tutti i termini entro la scadenza viene escluso dal compito con voto ' + imp.votoEsclusione + '. ' +
      (imp.riassegnazione === 'manuale' ? 'I termini dell\'alunno escluso passano ai compagni scelti dal docente: chi li riceve ha i giorni indicati dal docente (di norma ' + imp.giorniIt + ') per rispondere ' :
        'I termini dell\'alunno escluso passano automaticamente, a sorte, a un compagno della stessa classe: chi li riceve ha ' + imp.giorniIt + ' giorni per rispondere ') +
      'e il suo voto massimo sale da ' + fmtN(imp.votoMax) + ' a ' + fmtN(imp.votoMaxErede) + ', con le stesse penalità. ' +
      'Se non risponde in tempo ai termini ricevuti non viene escluso, ma il suo voto finale scende a ' + imp.tetto + ' se era ' + imp.tetto + ' o più; se era sotto ' + imp.tetto + ' resta quello. ' +
      'Il docente può concedere una proroga individuale della scadenza. ' +
      'Il voto inserito a mano dal docente sostituisce il voto finale calcolato.';
  }
  return 'Il voto di italiano e quello di inglese si calcolano separatamente: si parte da ' + fmtN(imp.votoMax) + ' e si tolgono ' + p +
    ' punti per ogni risposta errata (proposta ' + imp.proposta + '), senza scendere sotto ' + imp.votoMin + '. ' +
    'Il voto finale è la media dei due, arrotondata al quarto di voto più vicino: per difetto se la parte decimale è sotto la metà, per eccesso dalla metà in su (es. 6,75 e 8 → media 7,375 → 7,5). ' +
    'Il voto finale compare quando ci sono risposte in entrambe le lingue. ' +
    'Chi non risponde a tutti i termini entro la scadenza viene escluso dal compito con voto ' + imp.votoEsclusione + '. ' +
    'I termini dell\'alunno escluso passano automaticamente, a sorte, a un compagno: chi li riceve ha ' + imp.giorniIt + ' giorni per l\'italiano e ' + imp.giorniEn +
    ' per l\'inglese e il suo voto massimo sale da ' + fmtN(imp.votoMax) + ' a ' + fmtN(imp.votoMaxErede) + ', con le stesse penalità. ' +
    'Se non risponde in tempo ai termini ricevuti non viene escluso, ma il suo voto finale scende a ' + imp.tetto + ' se era ' + imp.tetto + ' o più; se era sotto ' + imp.tetto + ' resta quello. ' +
    'Il voto inserito a mano dal docente sostituisce il voto finale calcolato.';
}
const conInglese = (imp) => imp.lingue.indexOf('en') >= 0;
const nTer = (n) => n === 1 ? '1 termine' : n + ' termini';
/* Stato di un alunno: conteggi, esclusione, voto. now = ms */
function valuta(stato, a, now) {
  const imp = impostazioni(stato.config);
  const miei = stato.termini.filter((t) => t.alunno_id === a.id);
  const c = { inviate: 0, corrette: 0, errate: 0, daApprovare: 0, approvate: 0, mancanti: 0, it: { inviate: 0, errate: 0 }, en: { inviate: 0, errate: 0 } };
  const EN = conInglese(imp);
  imp.lingue.forEach((l) => {
    miei.forEach((t) => {
      const inv = campo(t, l, 'invii') || 0, err = campo(t, l, 'errori') || 0;
      c.inviate += inv; c.errate += err; c.corrette += inv - err;
      c[l].inviate += inv; c[l].errate += err;
      if (campo(t, l, 'stato') === 'inviata') c.daApprovare++;
      if (campo(t, l, 'stato') === 'approvata') c.approvate++;
    });
  });
  const mancaIt = miei.filter((t) => !(campo(t, 'it', 'tent') > 0)).length;
  // inglese: contano tutti i termini, approvati o no in italiano
  const mancaEn = EN ? miei.filter((t) => !(campo(t, 'en', 'tent') > 0)).length : 0;
  // ogni termine ha la sua scadenza: quella generale, o quella dei termini ereditati
  // esclusione: solo per i termini propri; per quelli ricevuti il ritardo porta il voto a non più di 6
  const scaduti = (l) => miei.filter((t) => !t.ereditato && now > scadenzaTermine(t, l, imp, a) && !(campo(t, l, 'tent') > 0)).length;
  const ritardiEredita = miei.filter((t) => t.ereditato && imp.lingue.some((l) => now > scadenzaTermine(t, l, imp, a) && !(campo(t, l, 'tent') > 0))).length;
  const tetto = !!a.tetto || ritardiEredita > 0;
  const sIt = scaduti('it'), sEn = EN ? scaduti('en') : 0;
  let motivo = a.esclusione ? a.esclusione.motivo : '';
  if (!motivo && sIt) motivo = nTer(sIt) + ' senza risposta in italiano alla scadenza';
  else if (!motivo && sEn) motivo = nTer(sEn) + ' senza risposta in inglese alla scadenza';
  const escluso = !!motivo && !a.riammesso;
  const ereditati = miei.filter((t) => t.ereditato).length;
  const max = ereditati ? imp.votoMaxErede : imp.votoMax;
  // un voto per lingua (solo se ci sono risposte in quella lingua), poi la media arrotondata
  const votoLingua = (l) => c[l].inviate ? Math.max(imp.votoMin, Math.min(max, max - PENALITA[imp.proposta] * c[l].errate)) : null;
  const votoIt = votoLingua('it'), votoEn = EN ? votoLingua('en') : null;
  // solo italiano: il voto finale è quello di italiano; con l'inglese, la media dei due
  const media = EN ? (votoIt != null && votoEn != null ? (votoIt + votoEn) / 2 : null) : votoIt;
  const calcolato = media != null ? arrot(media) : null;
  const manuale = typeof a.voto_manuale === 'number' ? a.voto_manuale : null;
  const voto = manuale != null ? manuale : escluso ? imp.votoEsclusione : (tetto && calcolato != null ? Math.min(calcolato, imp.tetto) : calcolato);
  return Object.assign(c, { id: a.id, nome: a.nome, gruppo: String(a.gruppo), classe: classeDi(a), escluso, motivo: escluso ? motivo : '', riammesso: !!a.riammesso && !!motivo,
    votoIt, votoEn, media, calcolato, manuale, voto, mancaIt, mancaEn, votoMax: max, ereditati,
    riassegnatoA: a.riassegnato_a || null, riassegnatiA: a.riassegnati_a || (a.riassegnato_a ? [a.riassegnato_a] : []), termini: miei.length, tetto, tettoValore: imp.tetto,
    scadenza: new Date(scadenzaAlunno(imp, a)).toISOString(), proroga: a.proroga || null, bloccoRiass: !!a.blocco_riass,
    rimandate: miei.filter((t) => campo(t, 'it', 'stato') === 'correggere').length,
    scadenzaRicevuti: (miei.filter((t) => t.ereditato && t.scad_it).map((t) => scadenzaTermine(t, 'it', imp, a)).sort((x, y) => x - y)[0] || null),
    mancaRicevuti: miei.filter((t) => t.ereditato && !(campo(t, 'it', 'tent') > 0)).length,
    lingue: imp.lingue, motivoTetto: tetto ? (a.tetto ? a.tetto.motivo : (ritardiEredita === 1 ? '1 termine ricevuto' : ritardiEredita + ' termini ricevuti') + ' senza risposta alla scadenza') : '' });
}
function scadenzaTermine(t, l, imp, a) {
  const own = campo(t, l, 'scad');
  const base = own ? Date.parse(own) : (l === 'it' ? (a ? scadenzaAlunno(imp, a) : Date.parse(imp.scadenzaIt)) : Date.parse(imp.scadenzaEn));
  const p = a && a.proroga ? Date.parse(a.proroga) : 0;
  return Math.max(base, p || 0);
}
function messaggioEsclusione() { return 'SEI STATO ESCLUSO DAL COMPITO CAUSA MANCATO RISPETTO DELLA DATA DI CONSEGNA - IL TUO VOTO FINALE SARÀ 4.'; }

/* ---------- cosa vede chi ---------- */
function campo(t, l, nome) { return t[nome + '_' + l]; }
function vistaTermine(t, chi, lingue) {
  lingue = lingue || ['it', 'en'];
  const base = { id: t.id, area: Number(t.area), it: t.termine_it, en: t.termine_en, alunno: t.alunno_id, agg: t.aggiornato || '',
    ereditato: !!t.ereditato, alunnoOrig: t.alunno_orig || null, scadIt: t.scad_it || null, scadEn: t.scad_en || null };
  const mio = chi.ruolo === 'alunno' && t.alunno_id === chi.id;
  lingue.forEach((l) => {
    const L = l === 'it' ? 'It' : 'En';
    const st = campo(t, l, 'stato') || '', sc = campo(t, l, 'scelta');
    base['stato' + L] = st;
    base['da' + L] = campo(t, l, 'da') || '';
    // testo approvato: lo vedono tutti (serve per il cartellone)
    base['def' + L] = st === 'approvata' && sc != null ? testoDef(t.area, sc, l) : '';
    if (chi.ruolo === 'docente') {
      base['scelta' + L] = sc != null ? testoDef(t.area, sc, l) : '';
      base['ok' + L] = sc != null ? sc === giusta(t) : null;
      base['giusta' + L] = testoDef(t.area, giusta(t), l);
      base['comm' + L] = campo(t, l, 'commento') || '';
      base['tent' + L] = campo(t, l, 'tent') || 0;
      base['primoOk' + L] = campo(t, l, 'primo_ok');
      base['storia' + L] = (campo(t, l, 'storia') || []).map((x) => ({ ok: x.ok, t: testoDef(t.area, x.i, l), at: x.at }));
      if (st === 'inviata') base['def' + L] = base['scelta' + L];
    } else if (mio) {
      base['comm' + L] = campo(t, l, 'commento') || '';
      const sbloccata = l === 'it' || t.stato_it === 'approvata';
      if (sbloccata) {
        const ops = opzioni(t, l), scartate = campo(t, l, 'scartate') || [];
        base['opz' + L] = ops.map((idx, i) => ({ l: LETTERE[i], t: testoDef(t.area, idx, l), no: scartate.indexOf(idx) >= 0 }));
        base['scelta' + L] = sc != null ? LETTERE[ops.indexOf(sc)] : null;
      }
    }
  });
  return base;
}

function tappe(imp, classe) {
  const g = (iso) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
  const en = conInglese(imp);
  // le date del calendario 2026/27 valgono solo per 3E e 3F di quell'edizione; per le altre classi tappe ricavate dalle loro date
  if (imp.edizione.id !== '2026-27-1' || (classe && classe !== '3E' && classe !== '3F')) {
    const out = [];
    if (imp.partenza) out.push({ data: g(imp.partenza), chiave: 'partenza', testo: 'Partenza: si apre l\'app' });
    out.push({ data: g(imp.scadenzaIt), chiave: 'it', testo: 'Scadenza: risposta a tutti i termini' });
    out.push({ data: g(new Date(Date.parse(imp.scadenzaIt) + 7 * 86400000).toISOString()), testo: 'Circa una settimana dopo: definizioni approvate dal prof. Cerrato' });
    return out;
  }
  return DATI.TAPPE.filter((t) => (en ? !t.soloIt : t.lingua !== 'en') && (t.chiave !== 'partenza' || imp.partenza)).map((t) => t.chiave === 'partenza' ? Object.assign({}, t, { data: g(imp.partenza) }) : t.chiave === 'it' ? Object.assign({}, t, { data: g(imp.scadenzaIt) }) : t.chiave === 'en' ? Object.assign({}, t, { data: g(imp.scadenzaEn) }) : t)
    .sort((a, b) => a.data.localeCompare(b.data));
}
function pacchetto(stato, chi) {
  const now = Date.now(), imp0 = impostazioni(stato.config);
  let imp = imp0;
  if (chi.ruolo === 'alunno') {
    const v = valuta(stato, chi._a, now);
    if (v.escluso) return { utente: { ruolo: 'alunno', nome: chi.nome }, escluso: true, messaggio: messaggioEsclusione() };
    // l'alunno vede partenza della sua classe e scadenza personale (classe o proroga)
    imp = Object.assign(impClasse(imp0, chi.classe), { scadenzaIt: new Date(scadenzaAlunno(imp0, chi._a)).toISOString() });
    const nMiei = stato.termini.filter((t) => t.alunno_id === chi.id && !t.ereditato).length || termPerAlunno(imp0, chi.classe);
    // prima della partenza: solo il conto alla rovescia
    if (!partito(imp, now)) return { utente: { ruolo: 'alunno', nome: chi.nome, classe: chi.classe }, nonPartito: true, partenza: imp.partenza, ora: new Date(now).toISOString(),
      config: { chiusa: !!stato.config.chiusa, classi: imp.classi, scadenzaIt: imp.scadenzaIt, terminiPerAlunno: nMiei, lingue: imp.lingue, proroga: !!chi._a.proroga, edizione: imp.edizione } };
  }
  let termini = stato.termini;
  if (chi.ruolo === 'alunno') {
    // la sua area, più le aree dei termini ricevuti da compagni esclusi (per l'anteprima dei cartelloni)
    // le aree dei suoi termini (per la 3E è la sua area; per la 3F sono tutte e quattro)
    const aree = new Set((/^[1-4]$/.test(chi.gruppo) ? [chi.gruppo] : []).concat(termini.filter((t) => t.alunno_id === chi.id).map((t) => String(t.area))));
    termini = termini.filter((t) => aree.has(String(t.area)));
  }
  const out = {
    utente: chi,
    config: { chiusa: !!stato.config.chiusa, tappe: tappe(imp, chi.ruolo === 'alunno' ? chi.classe : null), lingue: imp.lingue, classi: imp.classi, partenza: imp.partenza,
      terminiPerAlunno: chi.ruolo === 'alunno' ? (stato.termini.filter((t) => t.alunno_id === chi.id && !t.ereditato).length || termPerAlunno(imp0, chi.classe)) : DATI.TERMINI_PER_ALUNNO,
      scadenzaIt: imp.scadenzaIt, scadenzaEn: imp.scadenzaEn, proroga: chi.ruolo === 'alunno' ? !!(chi._a && chi._a.proroga) : undefined, edizione: imp.edizione,
      riassegnazione: imp.riassegnazione,
      docenti: (stato.config.docenti || []).map((d) => d.nome) },
    ora: new Date(now).toISOString(),
    aree: DATI.AREE,
    alunni: stato.alunni.map((a) => ({ id: a.id, nome: a.nome, gruppo: String(a.gruppo), classe: classeDi(a) })),
    termini: termini.map((t) => vistaTermine(t, chi, imp.lingue))
  };
  delete out.utente._a;
  if (chi.ruolo === 'alunno') {
    const v = valuta(stato, chi._a || stato.alunni.find((a) => a.id === chi.id), now);
    out.voto = { voto: v.voto, votoIt: v.votoIt, votoEn: v.votoEn, media: v.media, manuale: v.manuale != null, escluso: v.escluso, votoMax: v.votoMax, ereditati: v.ereditati,
      tetto: v.tetto, tettoValore: v.tettoValore, calcolato: v.calcolato,
      errIt: v.it.errate, errEn: v.en.errate, invIt: v.it.inviate, invEn: v.en.inviate, errate: v.errate, corrette: v.corrette, inviate: v.inviate, ratio: ratio(imp) };
  }
  if (chi.ruolo === 'docente') {
    const val = stato.alunni.map((a) => valuta(stato, a, now));
    // vista condivisa: conteggi per studente
    out.panoramica = val.map((v) => ({ id: v.id, nome: v.nome, gruppo: v.gruppo, classe: v.classe, inviate: v.inviate, corrette: v.corrette, errate: v.errate,
      daApprovare: v.daApprovare, approvate: v.approvate, escluso: v.escluso, motivo: v.motivo, mancaIt: v.mancaIt, mancaEn: v.mancaEn,
      termini: v.termini, ereditati: v.ereditati, riassegnatoA: v.riassegnatoA, riassegnatiA: v.riassegnatiA,
      scadenza: v.scadenza, proroga: v.proroga, bloccoRiass: v.bloccoRiass, rimandate: v.rimandate, riammesso: v.riammesso,
      scadenzaRicevuti: v.scadenzaRicevuti ? new Date(v.scadenzaRicevuti).toISOString() : null, mancaRicevuti: v.mancaRicevuti }));
    if (chi.admin) {
      out.codiciAlunni = stato.alunni.map((a) => ({ id: a.id, nome: a.nome, gruppo: String(a.gruppo), classe: classeDi(a), codice: a.codice,
        termini: stato.termini.filter((t) => t.alunno_id === a.id).map((t) => ({ area: t.area, it: t.termine_it })) }));
      out.admin = { impostazioni: imp, penalita: PENALITA, ratio: ratio(imp), archivio: stato.archivio || [], archiviata: stato.config.archiviata || null,
        date: Object.fromEntries(imp.classi.map((c) => { const ic = impClasse(imp, c); return [c, { partenza: ic.partenza || null, scadenzaIt: ic.scadenzaIt, propria: !!imp.calendario[c] }]; })),
        tpa: Object.fromEntries(imp.classi.map((c) => [c, termPerAlunno(imp, c)])),
        voti: val.map((v) => ({ id: v.id, voto: v.voto, votoIt: v.votoIt, votoEn: v.votoEn, media: v.media, errIt: v.it.errate, errEn: v.en.errate, votoMax: v.votoMax, ereditati: v.ereditati,
          tetto: v.tetto, motivoTetto: v.motivoTetto,
          calcolato: v.calcolato, manuale: v.manuale, escluso: v.escluso, riammesso: v.riammesso, motivo: v.motivo })),
        attivita: stato.attivita ? Object.fromEntries(stato.alunni.map((a) => [a.id, ATT.riepilogo(stato.attivita[a.id], now)])) : null,
        dropbox: stato.dropbox || null };
    }
  }
  return out;
}

function elencoLeggero(metas) {
  return (metas || []).map((m) => ({ id: m.id, nome: m.nome, as: m.as, classi: m.classi, creata: m.creata || null, archiviata: m.archiviata, alunni: m.alunni, termini: m.termini, approvate: m.approvate, mediaVoto: m.mediaVoto }))
    .sort((x, y) => String(y.archiviata).localeCompare(String(x.archiviata)));
}
function trova(stato, id) { const t = stato.termini.find((x) => x.id === String(id)); if (!t) errore('Termine non trovato.'); return t; }
function lingua(l, stato) {
  if (l !== 'it' && l !== 'en') errore('Lingua non valida.');
  if (stato && impostazioni(stato.config).lingue.indexOf(l) < 0) errore('In questa fase si lavora solo in italiano.');
}
function soloDocente(chi) { if (chi.ruolo !== 'docente') errore('Operazione riservata ai docenti.'); }

/* ---------- azioni ---------- */
async function login(db, { codice }) {
  const stato = await db.leggiTutto();
  const chi = identifica(stato, codice);
  if (chi.ruolo === 'docente' && chi.admin && db.leggiAttivita) {
    [stato.attivita, stato.dropbox, stato.archivio] = await Promise.all([db.leggiAttivita(), DBX.statoPubblico(db), db.leggiArchivi ? db.leggiArchivi().then(elencoLeggero) : []]);
  }
  return pacchetto(stato, chi);
}
/* controllo leggero (solo config) per le azioni del prof. Cerrato */
async function verificaAdmin(db, codice) {
  const config = await db.leggiConfig();
  if (!config) errore('Glossario non ancora configurato.');
  const chi = identifica({ config, alunni: [] }, codice);
  soloAdmin(chi);
  return chi;
}

async function scegli(db, { codice, id, lingua: l, lettera }) {
  return db.transazione(async (tx) => {
    const stato = await tx.leggiTutto();
    const chi = identifica(stato, codice);
    if (chi.ruolo !== 'alunno') errore('Solo gli alunni scelgono le definizioni.');
    const now = Date.now(), imp = impostazioni(stato.config);
    if (valuta(stato, chi._a, now).escluso) errore(messaggioEsclusione());
    if (!partito(impClasse(imp, chi.classe), now)) errore('Il compito non è ancora partito.');
    if (stato.config.chiusa) errore("L'app è chiusa: le scelte non sono più modificabili.");
    lingua(l, stato);
    const t = trova(stato, id);
    if (t.alunno_id !== chi.id) errore('Questo termine non è assegnato a te.');
    if (l === 'en' && t.stato_it !== 'approvata') errore("L'inglese si sblocca dopo l'approvazione dell'italiano.");
    const st = campo(t, l, 'stato') || '';
    if (st === 'approvata') errore('Scelta già approvata: non è più modificabile.');
    const i = LETTERE.indexOf(norm(lettera));
    if (i < 0) errore('Seleziona una delle 8 definizioni.');
    const idx = opzioni(t, l)[i];
    if ((campo(t, l, 'scartate') || []).indexOf(idx) >= 0) errore('Questa definizione è già stata scartata: scegline un\'altra.');
    if (st === 'inviata' && campo(t, l, 'scelta') === idx) errore('Hai già inviato questa scelta.');
    const scad = scadenzaTermine(t, l, imp, chi._a);
    if (now > scad && !(campo(t, l, 'tent') > 0) && !chi._a.riammesso && !t.ereditato) errore('La scadenza per ' + (l === 'it' ? "l'italiano" : "l'inglese") + ' è passata.');
    const ok = idx === giusta(t);
    const storia = (campo(t, l, 'storia') || []).concat([{ i: idx, ok, at: adesso() }]);
    const mod = { ['scelta_' + l]: idx, ['stato_' + l]: 'inviata', aggiornato: adesso(),
      ['invii_' + l]: (campo(t, l, 'invii') || 0) + 1, ['errori_' + l]: (campo(t, l, 'errori') || 0) + (ok ? 0 : 1), ['storia_' + l]: storia };
    if (st !== 'inviata') mod['tent_' + l] = (campo(t, l, 'tent') || 0) + 1;
    if (campo(t, l, 'primo_ok') == null) mod['primo_ok_' + l] = ok;
    tx.scriviTermine(t.id, mod);
    return vistaTermine(Object.assign({}, t, mod), chi, impostazioni(stato.config).lingue);
  });
}

async function revisiona(db, { codice, id, lingua: l, esito, commento }) {
  return db.transazione(async (tx) => {
    const stato = await (tx.leggiTermine ? tx.leggiTermine(id) : tx.leggiTutto());
    const chi = identifica(stato, codice); soloDocente(chi); lingua(l, stato);
    const t = trova(stato, id);
    const sc = campo(t, l, 'scelta'), st = campo(t, l, 'stato') || '';
    const mod = { aggiornato: adesso() };
    if (esito === 'approvata') {
      if (sc == null) errore("L'alunno non ha ancora scelto.");
      if (l === 'en' && t.stato_it !== 'approvata') errore("Approva prima l'italiano.");
      Object.assign(mod, { ['stato_' + l]: 'approvata', ['da_' + l]: chi.nome, ['commento_' + l]: pulisci(commento) });
    } else if (esito === 'correggere') {
      if (st !== 'inviata' || sc == null) errore('Si può rimandare solo una scelta inviata.');
      const scartate = (campo(t, l, 'scartate') || []).slice();
      if (scartate.indexOf(sc) < 0) scartate.push(sc);
      Object.assign(mod, { ['stato_' + l]: 'correggere', ['scelta_' + l]: null, ['scartate_' + l]: scartate, ['commento_' + l]: pulisci(commento), ['da_' + l]: '' });
    } else if (esito === 'riapri') {
      if (st !== 'approvata') errore('La scelta non è approvata.');
      Object.assign(mod, { ['stato_' + l]: 'inviata', ['da_' + l]: '' });
      if (l === 'it' && t.stato_en === 'approvata') Object.assign(mod, { stato_en: 'inviata', da_en: '' });
    } else errore('Esito non valido.');
    tx.scriviTermine(t.id, mod);
    return vistaTermine(Object.assign({}, t, mod), chi, impostazioni(stato.config).lingue);
  });
}

async function approvaCorrette(db, { codice, lingua: l, area }) {
  return db.transazione(async (tx) => {
    const stato = await tx.leggiTutto();
    const chi = identifica(stato, codice); soloDocente(chi); lingua(l, stato);
    let n = 0;
    stato.termini.forEach((t) => {
      if (area && area !== 'tutte' && String(t.area) !== String(area)) return;
      if (campo(t, l, 'stato') === 'inviata' && campo(t, l, 'scelta') === giusta(t) && (l === 'it' || t.stato_it === 'approvata')) {
        tx.scriviTermine(t.id, { ['stato_' + l]: 'approvata', ['da_' + l]: chi.nome, aggiornato: adesso() });
        n++;
      }
    });
    return { approvate: n };
  });
}

function soloAdmin(chi) { if (chi.ruolo !== 'docente' || !chi.admin) errore('Operazione riservata al prof. Cerrato.'); }
function isoValida(s) { const t = Date.parse(s); if (!s || isNaN(t)) errore('Data non valida.'); return new Date(t).toISOString(); }

async function impostazioniAdmin(db, { codice, scadenzaIt, scadenzaEn, proposta, giorniIt, giorniEn, partenza, calendario, riassegnazione }) {
  const stato = await db.leggiTutto();
  soloAdmin(identifica(stato, codice));
  const mod = {};
  if (scadenzaIt || scadenzaEn) mod.scadenze = Object.assign({}, stato.config.scadenze || {}, scadenzaIt ? { it: isoValida(scadenzaIt) } : {}, scadenzaEn ? { en: isoValida(scadenzaEn) } : {});
  if (proposta) { if (!PENALITA[proposta]) errore('Proposta non valida.'); mod.proposta = proposta; }
  [['giorniIt', giorniIt], ['giorniEn', giorniEn]].forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    const n = Number(v); if (!(n >= 1 && n <= 14)) errore('I giorni per i termini ereditati vanno da 1 a 14.'); mod[k] = n;
  });
  if (partenza !== undefined) mod.partenza = partenza ? isoValida(partenza) : null;
  if (riassegnazione !== undefined && riassegnazione !== null) {
    if (riassegnazione !== 'auto' && riassegnazione !== 'manuale') errore('Modalità di riassegnazione non valida.');
    mod.riassegnazione = riassegnazione;
  }
  if (calendario !== undefined && calendario !== null) {
    // { classe: { partenza: ISO|null|'' , scadenzaIt: ISO|'' } }: i campi vuoti tornano alle date generali
    const imp0 = impostazioni(stato.config), cal = {};
    Object.keys(calendario).forEach((c) => {
      if (imp0.classi.indexOf(c) < 0) errore('Classe sconosciuta: ' + c + '.');
      const x = calendario[c] || {}, r = {};
      if ('partenza' in x) r.partenza = x.partenza ? isoValida(x.partenza) : null;
      if (!x.scadenzaIt) errore('Classe ' + c + ': manca la scadenza.');
      r.scadenzaIt = isoValida(x.scadenzaIt);
      cal[c] = r;
    });
    mod.calendario = cal;
  }
  const dopo = impostazioni(Object.assign({}, stato.config, mod));
  if (dopo.partenza && Date.parse(dopo.partenza) >= Date.parse(dopo.scadenzaIt)) errore('La partenza deve venire prima della scadenza.');
  dopo.classi.forEach((c) => {
    const ic = impClasse(dopo, c);
    if (ic.partenza && Date.parse(ic.partenza) >= Date.parse(ic.scadenzaIt)) errore('Classe ' + c + ': la partenza deve venire prima della scadenza.');
  });
  await db.scriviConfig(mod);
  return dopo;
}

async function votoManuale(db, { codice, alunno, voto }) {
  const stato = await db.leggiTutto();
  soloAdmin(identifica(stato, codice));
  const a = stato.alunni.find((x) => x.id === alunno); if (!a) errore('Alunno non trovato.');
  let v = null;
  if (voto !== null && voto !== '' && voto !== undefined) {
    v = Number(String(voto).replace(',', '.'));
    if (isNaN(v) || v < 1 || v > 10) errore('Voto non valido (da 1 a 10).');
    v = arrot(v);
  }
  await db.scriviAlunno(a.id, { voto_manuale: v });
  return { alunno: a.id, voto_manuale: v };
}

/* Riammissione: l'alunno torna nel compito e, se i suoi termini erano già passati a un compagno, gli vengono restituiti.
   modo 'tutti': tornano tutti (le risposte date dal compagno si azzerano); 'non_risposti': restano al compagno quelli a cui ha già risposto. */
function terminiRestituibili(stato, a) {
  const nomi = {}; stato.alunni.forEach((x) => { nomi[x.id] = x.nome; });
  const ts = stato.termini.filter((t) => t.ereditato && t.alunno_orig === a.id && t.alunno_id !== a.id);
  const risposto = (t) => ['it', 'en'].some((l) => campo(t, l, 'tent') > 0 || !!campo(t, l, 'stato'));
  const eredi = {};
  ts.forEach((t) => { const e = eredi[t.alunno_id] = eredi[t.alunno_id] || { id: t.alunno_id, nome: nomi[t.alunno_id] || t.alunno_id, termini: 0, risposti: 0 }; e.termini++; if (risposto(t)) e.risposti++; });
  return { ts, risposto, eredi: Object.values(eredi) };
}
async function anteprimaRiammissione(db, { codice, alunno }) {
  const stato = await db.leggiTutto();
  soloAdmin(identifica(stato, codice));
  const a = stato.alunni.find((x) => x.id === alunno); if (!a) errore('Alunno non trovato.');
  const r = terminiRestituibili(stato, a);
  return { alunno: a.id, nome: a.nome, termini: r.ts.length, risposti: r.ts.filter(r.risposto).length, eredi: r.eredi };
}
/* restituisce all'alunno a i suoi termini passati ad altri (tutti, o solo quelli a cui il compagno non ha ancora risposto) */
function restituisci(tx, stato, a, modo) {
  const { ts, risposto } = terminiRestituibili(stato, a);
  const torna = ts.filter((t) => modo === 'tutti' || !risposto(t));
  const toccati = new Set(torna.map((t) => t.alunno_id));
  torna.forEach((t) => {
    const mod = Object.assign({ alunno_id: a.id, alunno_orig: null, ereditato: false, scad_it: null, scad_en: null, aggiornato: adesso() }, AZZERA('it'), AZZERA('en'));
    Object.assign(t, mod); tx.scriviTermine(t.id, mod);
  });
  // chi li aveva ricevuti: se non ha più termini di questo alunno lo si toglie dai "donatori"; senza termini ricevuti torna al voto massimo normale
  toccati.forEach((id) => {
    const e = stato.alunni.find((x) => x.id === id); if (!e) return;
    const suoi = stato.termini.filter((t) => t.alunno_id === id && t.ereditato);
    const da = (e.eredita_da || []).filter((d) => d !== a.id || suoi.some((t) => t.alunno_orig === a.id));
    const mod = { eredita_da: da, ereditati: da.length };
    if (!suoi.length) mod.tetto = null;
    Object.assign(e, mod); tx.scriviAlunno(id, mod);
  });
  const ancora = [...new Set(stato.termini.filter((t) => t.ereditato && t.alunno_orig === a.id && t.alunno_id !== a.id).map((t) => t.alunno_id))];
  const restano = ts.length - torna.length;
  const modA = Object.assign(torna.length ? { riassegnato: false } : {}, { riassegnati_a: ancora, riassegnato_a: ancora[0] || null });
  Object.assign(a, modA); tx.scriviAlunno(a.id, modA);
  return { restituiti: torna.length, restano };
}
async function riammetti(db, { codice, alunno, riammesso, modo }) {
  const stato0 = await db.leggiTutto();
  soloAdmin(identifica(stato0, codice));
  if (!stato0.alunni.some((x) => x.id === alunno)) errore('Alunno non trovato.');
  if (!riammesso) { await db.scriviAlunno(alunno, { riammesso: false }); return { alunno, riammesso: false, restituiti: 0 }; }
  return db.transazione(async (tx) => {
    const stato = await tx.leggiTutto();
    const a = stato.alunni.find((x) => x.id === alunno);
    const r = restituisci(tx, stato, a, modo);
    tx.scriviAlunno(a.id, { riammesso: true });
    return { alunno: a.id, riammesso: true, restituiti: r.restituiti, restano: r.restano };
  });
}

/* ---------- proroga individuale ---------- */
/* data: ISO (nuova scadenza personale) oppure null (si torna alla scadenza della classe).
   Se l'alunno era già escluso, la proroga lo rimette nel compito; se i suoi termini erano già passati ad altri,
   tornano a lui secondo "modo" ('tutti' o 'non_risposti'). */
async function prorogaAlunno(db, { codice, alunno, data, modo }) {
  const stato0 = await db.leggiTutto();
  soloAdmin(identifica(stato0, codice));
  const a0 = stato0.alunni.find((x) => x.id === alunno); if (!a0) errore('Alunno non trovato.');
  const imp = impostazioni(stato0.config), now = Date.now();
  const base = Date.parse(impClasse(imp, classeDi(a0)).scadenzaIt);
  let iso = null;
  if (data) {
    iso = isoValida(data);
    if (Date.parse(iso) <= base) errore('La proroga deve essere successiva alla scadenza della classe ' + classeDi(a0) + ' (' + new Date(base).toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' }) + ').');
    if (Date.parse(iso) <= now) errore('La proroga deve essere nel futuro.');
  }
  return db.transazione(async (tx) => {
    const stato = await tx.leggiTutto();
    const a = stato.alunni.find((x) => x.id === alunno);
    let restituiti = 0, restano = 0;
    const mod = { proroga: iso };
    if (iso) {
      // la proroga annulla un'esclusione già registrata e la riammissione non serve più
      if (a.esclusione) mod.esclusione = null;
      if (a.riammesso) mod.riammesso = false;
      const r = restituisci(tx, stato, a, modo === 'non_risposti' ? 'non_risposti' : 'tutti');
      restituiti = r.restituiti; restano = r.restano;
    }
    tx.scriviAlunno(a.id, mod);
    return { alunno: a.id, proroga: iso, restituiti, restano };
  });
}
async function bloccoRiassegnazione(db, { codice, alunno, blocco }) {
  const stato = await db.leggiTutto();
  soloAdmin(identifica(stato, codice));
  if (!stato.alunni.some((x) => x.id === alunno)) errore('Alunno non trovato.');
  await db.scriviAlunno(alunno, { blocco_riass: !!blocco });
  return { alunno, blocco: !!blocco };
}

/* ---------- passaggio dei termini deciso dal docente ---------- */
/* da: alunno che cede i termini; a: compagno che li riceve; termini: elenco di id; scadenza: ISO per chi li riceve */
async function trasferisciTermini(db, { codice, da, a: verso, termini, scadenza }) {
  const stato0 = await db.leggiTutto();
  const chi = identifica(stato0, codice); soloAdmin(chi);
  if (!Array.isArray(termini) || !termini.length) errore('Seleziona almeno un termine.');
  if (da === verso) errore('Scegli un compagno diverso dall\'alunno che cede i termini.');
  const imp = impostazioni(stato0.config), now = Date.now();
  const scad = scadenza ? isoValida(scadenza) : new Date(now + imp.giorniIt * 86400000).toISOString();
  if (Date.parse(scad) <= now) errore('La scadenza per chi riceve i termini deve essere nel futuro.');
  return db.transazione(async (tx) => {
    const stato = await tx.leggiTutto();
    const src = stato.alunni.find((x) => x.id === da), dst = stato.alunni.find((x) => x.id === verso);
    if (!src) errore('Alunno che cede i termini non trovato.');
    if (!dst) errore('Alunno che riceve i termini non trovato.');
    const vDst = valuta(stato, dst, now);
    if (vDst.escluso) errore(dst.nome + ' è escluso dal compito: scegli un altro compagno.');
    const vSrc = valuta(stato, src, now);
    const ts = termini.map((id) => stato.termini.find((t) => t.id === String(id)));
    if (ts.some((t) => !t)) errore('Uno dei termini selezionati non esiste.');
    if (ts.some((t) => t.alunno_id !== src.id)) errore('Uno dei termini selezionati non è (più) assegnato a ' + src.nome + ': ricarica la pagina.');
    if (ts.some((t) => t.stato_it === 'approvata')) errore('Un termine già approvato non si può passare: deselezionalo.');
    // chi cede: se è escluso si registra l'esclusione (resta escluso anche senza termini) e l'app non riassegna più nulla in automatico
    const modSrc = { riassegnato: true, riassegnati_a: [...new Set((src.riassegnati_a || (src.riassegnato_a ? [src.riassegnato_a] : [])).concat([dst.id]))] };
    modSrc.riassegnato_a = modSrc.riassegnati_a[0];
    if (vSrc.escluso && !src.esclusione) modSrc.esclusione = { motivo: vSrc.motivo, at: new Date(now).toISOString() };
    ts.forEach((t) => {
      tx.scriviTermine(t.id, Object.assign({ alunno_id: dst.id, alunno_orig: t.alunno_orig || src.id, ereditato: true, scad_it: scad, scad_en: scad, aggiornato: adesso(), passato_da: chi.nome }, AZZERA('it'), AZZERA('en')));
    });
    tx.scriviAlunno(src.id, modSrc);
    const orig = [...new Set(ts.map((t) => t.alunno_orig || src.id))];
    const eredita = [...new Set((dst.eredita_da || []).concat(orig))];
    tx.scriviAlunno(dst.id, { eredita_da: eredita, ereditati: eredita.length });
    return { da: src.id, a: dst.id, passati: ts.length, scadenza: scad };
  });
}

/* ---------- riassegnazione automatica dei termini degli esclusi ---------- */
const AZZERA = (l) => ({ ['scelta_' + l]: null, ['stato_' + l]: '', ['commento_' + l]: '', ['tent_' + l]: 0, ['primo_ok_' + l]: null,
  ['scartate_' + l]: [], ['da_' + l]: '', ['invii_' + l]: 0, ['errori_' + l]: 0, ['storia_' + l]: [] });
function caso(n) { return require('crypto').randomInt(n); }
/* Applica le riassegnazioni allo stato in memoria e restituisce le scritture da fare. */
function pianoRiassegnazione(stato, now, sceltaCasuale) {
  const imp = impostazioni(stato.config);
  const wT = {}, wA = {}, eventi = [], senzaErede = new Set();
  const scriviT = (t, mod) => { Object.assign(t, mod); wT[t.id] = Object.assign(wT[t.id] || {}, mod); };
  const scriviA = (a, mod) => { Object.assign(a, mod); wA[a.id] = Object.assign(wA[a.id] || {}, mod); };
  for (let giro = 0; giro < stato.alunni.length; giro++) {
    const val = stato.alunni.map((a) => ({ a, v: valuta(stato, a, now) }));
    // in modalità manuale, o per gli alunni bloccati dal docente, i termini restano dove sono finché decide il docente
    const daFare = val.filter((x) => x.v.escluso && !x.a.riassegnato && x.v.termini > 0 && !senzaErede.has(x.a.id) && imp.riassegnazione !== 'manuale' && !x.a.blocco_riass);
    if (!daFare.length) break;
    daFare.forEach(({ a, v }) => {
      const esclusiOra = new Set(stato.alunni.map((x) => x).filter((x) => x.esclusione || valuta(stato, x, now).escluso).map((x) => x.id));
      // a sorte tra i compagni della stessa classe non esclusi che non hanno già ricevuto i termini di un altro (al massimo un "carico" a testa)
      const cand = stato.alunni.filter((x) => x.id !== a.id && classeDi(x) === classeDi(a) && !esclusiOra.has(x.id) && !(x.ereditati > 0));
      if (!a.esclusione) scriviA(a, { esclusione: { motivo: v.motivo, at: new Date(now).toISOString() } });
      if (!cand.length) { senzaErede.add(a.id); eventi.push({ da: a.id, a: null }); return; } // nessuno disponibile: si riprova al prossimo accesso
      scriviA(a, { riassegnato: true });
      const erede = cand[sceltaCasuale(cand.length)];
      const scadIt = new Date(now + imp.giorniIt * 86400000).toISOString(), scadEn = new Date(now + imp.giorniEn * 86400000).toISOString();
      stato.termini.filter((t) => t.alunno_id === a.id).forEach((t) => {
        scriviT(t, Object.assign({ alunno_id: erede.id, alunno_orig: t.alunno_orig || a.id, ereditato: true, scad_it: scadIt, scad_en: scadEn, aggiornato: adesso() }, AZZERA('it'), AZZERA('en')));
      });
      scriviA(a, { riassegnato_a: erede.id, riassegnati_a: [erede.id] });
      scriviA(erede, { ereditati: (erede.ereditati || 0) + 1, eredita_da: (erede.eredita_da || []).concat([a.id]) });
      eventi.push({ da: a.id, a: erede.id });
    });
  }
  // esclusi non riassegnati (modalità manuale o alunno bloccato): si registra comunque l'esclusione
  stato.alunni.forEach((a) => {
    if (a.esclusione) return;
    const v = valuta(stato, a, now);
    if (v.escluso) { scriviA(a, { esclusione: { motivo: v.motivo, at: new Date(now).toISOString() } }); eventi.push({ escluso: a.id }); }
  });
  // tetto a 6 per chi non ha risposto in tempo ai termini ricevuti: si registra e resta anche se poi completa
  stato.alunni.forEach((a) => {
    if (a.tetto) return;
    const v = valuta(stato, a, now);
    if (v.tetto && !v.escluso) { scriviA(a, { tetto: { motivo: v.motivoTetto, at: new Date(now).toISOString() } }); eventi.push({ tetto: a.id }); }
  });
  return { wT, wA, eventi };
}
async function manutenzione(db, sceltaCasuale) {
  // prima della scadenza di italiano non può esserci nessun escluso: basta una lettura
  if (db.leggiConfig) {
    const cfg = await db.leggiConfig();
    if (!cfg || Date.now() <= primaScadenza(impostazioni(cfg))) return [];
  }
  return db.transazione(async (tx) => {
    const stato = await tx.leggiTutto();
    const piano = pianoRiassegnazione(stato, Date.now(), sceltaCasuale || caso);
    Object.keys(piano.wT).forEach((id) => tx.scriviTermine(id, piano.wT[id]));
    Object.keys(piano.wA).forEach((id) => tx.scriviAlunno(id, piano.wA[id]));
    return piano.eventi;
  });
}

async function impostaChiusura(db, { codice, chiusa }) {
  const stato = await db.leggiTutto();
  soloDocente(identifica(stato, codice));
  await db.scriviConfig({ chiusa: !!chiusa });
  return { chiusa: !!chiusa };
}

// i primi 20 termini di ogni area: 5 a testa; i termini 21-40 (seconda fase): altri 5 a testa, nello stesso ordine
// 3F (termini 41-65 di ogni area): 2 termini per area a testa (41-60), più 5 termini per area (61-65) distribuiti
// in modo che ogni alunno ne abbia 2 in più in due aree diverse: 10 termini a testa, 25 per area
function alunnoIniziale(area, k) {
  area = Number(area);
  if (k < 40) return 'A' + pad2((area - 1) * 4 + Math.floor((k % 20) / 5) + 1);
  const j = k - 40;
  if (j < 20) return 'F' + pad2(Math.floor(j / 2) + 1);
  return 'F' + pad2((((area - 1) * 5 + (j - 20)) % 10) + 1);
}
function alunniIniziali(usati) {
  return DATI.NOMI_ALUNNI.map((nome, i) => ({ id: 'A' + pad2(i + 1), nome, gruppo: String(Math.floor(i / 4) + 1), classe: '3E', codice: generaCodice(usati), voto_manuale: null, riammesso: false }))
    .concat(DATI.CLASSI.indexOf('3F') >= 0 ? DATI.NOMI_3F.map((nome, i) => ({ id: 'F' + pad2(i + 1), nome, gruppo: 'F', classe: '3F', codice: generaCodice(usati), voto_manuale: null, riammesso: false })) : []);
}
function terminiIniziali() {
  const termini = [];
  DATI.AREE.forEach((area) => {
    DATI.TERMINI[area.n].forEach((tt, k) => {
      const t = {
        id: 'T' + area.n + pad2(k + 1), area: String(area.n), termine_it: tt[0], termine_en: tt[1],
        alunno_id: alunnoIniziale(area.n, k), aggiornato: ''
      };
      ['it', 'en'].forEach((l) => Object.assign(t, { ['scelta_' + l]: null, ['stato_' + l]: '', ['commento_' + l]: '', ['tent_' + l]: 0, ['primo_ok_' + l]: null, ['scartate_' + l]: [], ['da_' + l]: '',
        ['invii_' + l]: 0, ['errori_' + l]: 0, ['storia_' + l]: [] }));
      termini.push(t);
    });
  });
  return termini;
}

/* Aggiornamento del glossario già in uso alla seconda fase (una volta sola, al primo accesso dopo il deploy):
 * aggiunge i termini 21-40 di ogni area, 5 in più a testa, e passa al solo italiano con la nuova scadenza.
 * Risposte, voti, codici e registro accessi restano come sono. */
const SCADENZA_IT_PRIMA_FASE = Date.parse('2026-11-13T23:59:00+01:00');
let migrato = false;
async function migra(db) {
  if (migrato || !db.leggiConfig) return 0;
  const cfg = await db.leggiConfig();
  if (!cfg) return 0;
  const v = cfg.versioneDati || 1;
  if (v >= 4) { migrato = true; return 0; }
  const stato = await db.leggiTutto();
  const mod = { versioneDati: 4 };
  let nAggiunti = 0;
  // quarta fase: l'app è solo del docente admin, solo italiano
  const docenti = (cfg.docenti || []).filter((d) => d.admin || DATI.DOCENTI.some((x) => x.nome === d.nome));
  if (docenti.length !== (cfg.docenti || []).length) mod.docenti = docenti;
  mod.lingue = DATI.LINGUE.slice();
  if (v >= 3) { await db.scriviConfig(mod); migrato = true; return 0; }
  if (v < 2) { // seconda fase: solo italiano, 10 termini a testa, scadenza 20/11
    if (!Array.isArray(cfg.lingue)) mod.lingue = DATI.LINGUE.slice();
    const sc = cfg.scadenze || {};
    if (!sc.it || Date.parse(sc.it) === SCADENZA_IT_PRIMA_FASE) mod.scadenze = Object.assign({}, sc, { it: DATI.SCADENZE.it });
    if (!cfg.giorniIt || Number(cfg.giorniIt) === 2) mod.giorniIt = DATI.EREDITA.giorniIt;
  }
  // terza fase: la 3F (10 alunni, 100 termini), classe sugli alunni, partenza decisa dal docente, proposta B
  const usati = new Set(stato.alunni.map((a) => a.codice).concat((cfg.docenti || []).map((d) => d.codice)));
  const nuoviAlunni = alunniIniziali(usati).filter((a) => !stato.alunni.some((x) => x.id === a.id));
  const classe = stato.alunni.filter((a) => !a.classe).map((a) => ({ id: a.id, classe: '3E' }));
  if (nuoviAlunni.length || classe.length) await db.aggiungiAlunni(classe.concat(nuoviAlunni));
  const esistenti = new Set(stato.termini.map((t) => t.id));
  const nuovi = terminiIniziali().filter((t) => !esistenti.has(t.id));
  if (nuovi.length) await db.aggiungiTermini(nuovi);
  nAggiunti = nuovi.length;
  if (cfg.partenza === undefined) mod.partenza = DATI.PARTENZA;
  mod.classi = DATI.CLASSI.slice();
  mod.proposta = DATI.VALUTAZIONE.proposta;
  await db.scriviConfig(mod);
  migrato = true;
  return nAggiunti;
}

async function setup(db, { chiave }, chiaveAttesa) {
  if (!chiaveAttesa) errore('Variabile SETUP_KEY non impostata su Netlify.');
  if (String(chiave || '') !== chiaveAttesa) errore('Chiave di configurazione errata.');
  if (await db.esisteGlossario()) errore('Il glossario è già configurato. Per ricominciare, cancella le raccolte in Firestore.');
  const usati = new Set();
  const config = {
    chiusa: false,
    docenti: DATI.DOCENTI.map((d) => ({ nome: d.nome, lingua: d.lingua, admin: !!d.admin, codice: generaCodice(usati) })),
    scadenze: Object.assign({}, DATI.SCADENZE),
    proposta: DATI.VALUTAZIONE.proposta,
    lingue: DATI.LINGUE.slice(),
    classi: DATI.CLASSI.slice(),
    partenza: DATI.PARTENZA,
    versioneDati: 4
  };
  const alunni = alunniIniziali(usati);
  const termini = terminiIniziali();
  await db.creaGlossario(config, alunni, termini);
  return { docenti: config.docenti.map((d) => ({ nome: d.nome, codice: d.codice })), alunni: alunni.length, termini: termini.length };
}

function riprovaMigrazione() { migrato = false; } // solo per i test
/* nome pubblico: nome per esteso e cognome puntato ("Bertelà Linda" → "Linda B.", "Dalle Luche Grace" → "Grace D.L.") */
const PARTICELLE = ['da', 'dal', 'dalla', 'dalle', 'de', 'dei', 'del', 'della', 'delle', 'di', 'la', 'lo', 'li', 'van', 'von', 'mc', 'mac'];
const NOMI_PUBBLICI = { 'Giannarelli Rigel Francesca Lina': 'Francesca G.' }; // nome d'uso scelto dal docente
function nomePubblico(completo) {
  if (NOMI_PUBBLICI[String(completo || '').trim()]) return NOMI_PUBBLICI[String(completo).trim()];
  const p = String(completo || '').trim().split(/\s+/).filter(Boolean);
  if (p.length < 2) return p.join(' ');
  let n = 1; while (n < p.length - 1 && PARTICELLE.indexOf(p[n - 1].toLowerCase()) >= 0) n++;
  return p.slice(n).join(' ') + ' ' + p.slice(0, n).map((x) => x.charAt(0).toUpperCase() + '.').join('');
}

/* pagina pubblica di consultazione: solo termini e definizioni approvate, nessun dato riservato */
async function pubblico(db) {
  const stato = await db.leggiTutto();
  if (!stato.config) return { aree: [], classi: {} };
  return pubblicoDa(stato);
}
function pubblicoDa(stato) {
  const imp = impostazioni(stato.config);
  const nomi = {}; stato.alunni.forEach((a) => { nomi[a.id] = nomePubblico(a.nome); });
  const classi = {};
  imp.classi.forEach((c) => { classi[c] = stato.alunni.filter((a) => classeDi(a) === c).sort((x, y) => x.nome.localeCompare(y.nome, 'it')).map((a) => nomePubblico(a.nome)); });
  const aree = DATI.AREE.map((a) => {
    const ts = stato.termini.filter((t) => String(t.area) === String(a.n)).sort((x, y) => Number(String(x.id).slice(2)) - Number(String(y.id).slice(2)));
    return { n: a.n, it: a.it, colore: a.colore, termini: ts.map((t) => {
      const ok = t.stato_it === 'approvata' && t.scelta_it != null;
      return { n: Number(String(t.id).slice(2)), termine: t.termine_it, def: ok ? testoDef(t.area, t.scelta_it, 'it') : '', autore: ok ? (nomi[t.alunno_id] || '') : '' };
    }) };
  });
  return { docente: 'Prof. Danilo Cerrato', materia: 'Laboratorio odontotecnico', scuola: 'Istituto Barsanti - sede Salvetti, Massa', anno: imp.edizione.as,
    edizione: { id: imp.edizione.id, nome: imp.edizione.nome, as: imp.edizione.as }, classi, aree, aggiornato: new Date().toISOString() };
}

/* filtro per classe (report e presentazione) */
function statoClasse(stato, classe) {
  if (!classe || classe === 'tutte') return stato;
  const ids = new Set(stato.alunni.filter((a) => classeDi(a) === classe).map((a) => a.id));
  return Object.assign({}, stato, { alunni: stato.alunni.filter((a) => ids.has(a.id)), termini: stato.termini.filter((t) => ids.has(t.alunno_id)) });
}
function nomeClassi(stato) { const c = []; stato.alunni.forEach((a) => { const k = classeDi(a); if (c.indexOf(k) < 0) c.push(k); }); return (c.length ? c.sort() : ['3E']).join(' e '); }
function etichettaAl(a) { return /^[1-4]$/.test(String(a.gruppo)) ? classeDi(a) + '·' + a.gruppo : classeDi(a); }
module.exports = {
  anteprimaRiammissione, prorogaAlunno, bloccoRiassegnazione, trasferisciTermini, pubblicoDa, edizioneDi, impClasse, scadenzaAlunno, termPerAlunno,
  identifica, soloAdmin, pacchetto, generaCodice, pad2, errore, isoValida, AZZERA, campo, elencoLeggero, PENALITA, adesso, nomePubblico, pubblico, testoDef, statoClasse, nomeClassi, etichettaAl, classeDi, riprovaMigrazione, migra, alunnoIniziale, alunniIniziali, partito, impostazioni, ratio, verificaAdmin, manutenzione, pianoRiassegnazione, login, scegli, revisiona, approvaCorrette, impostaChiusura, impostazioniAdmin, votoManuale, riammetti, setup, ErroreUtente, opzioni, terminiIniziali, valuta };
