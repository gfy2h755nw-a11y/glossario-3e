/**
 * Quiz (parte della prova, nella pagina /quiz con il codice personale) e interrogazione orale (area docenti).
 *
 * Quiz: un termine e quattro definizioni, 60 secondi. Si apre quando il docente fissa la scadenza della classe.
 * A ogni risposta giusta il termine è «indovinato»; a ogni risposta sbagliata o non data NON si mostra quella giusta
 * e si torna indietro di 5 termini (gli ultimi indovinati). I progressi restano tra una sessione e l'altra.
 * La prova è superata quando i termini indovinati raggiungono la soglia (di norma tutti i termini del glossario):
 * solo allora l'alunno è ammesso all'interrogazione. Chi non la supera entro la scadenza non viene interrogato e non ha voto.
 * Per ogni sessione si registrano inizio, tempo di gioco, risposte, corrette, errori, scadute, termini nuovi e termini persi.
 *
 * Orale: il docente pesca 10 termini (bilanciati sulle aree, mai quelli dell'alunno, di preferenza i meno usciti nella classe)
 * e segna ogni risposta come corretta (1), parziale (½) o sbagliata (0). Voto = 3 + ½ per punto (massimo 8);
 * per gli esclusi 3 + ¼ per punto (massimo 5,5). Il voto finale (media con lo scritto) si calcola in logica.valuta.
 *
 * Tutto è salvato nel documento dell'alunno (campi quiz, orale, orale_bozza, orale_storico): entra da solo nei backup e nell'archivio.
 */
const L = require('./logica');
const CAT = require('./catalogo');
const DATI = require('./dati');

const QUIZ = { secondi: 60, tolleranza: 4, soglia: 260, maxSessioni: 300, opzioni: 4, passo: 5 };
const LETTERE = 'ABCDEFGH';
const ORALE = { domande: 10, base: 3, passo: 0.5, passoEsclusi: 0.25 };
const caso = (n) => require('crypto').randomInt(n);
const chiave = (a, k) => a + '-' + k;

function catalogo(stato) { return CAT.materializza(stato.config).cat; }
function tutte(cat) { const out = []; Object.keys(cat).forEach((a) => cat[a].forEach((x, k) => out.push({ a: Number(a), k }))); return out; }

/* ---------------- quiz ---------------- */
/* regole del quiz per una classe: quanti termini servono e fino a quando. Il quiz è aperto solo se il docente ha fissato la scadenza. */
const TOT = new WeakMap(); // totale dei termini per configurazione (evita di ricostruire il catalogo a ogni alunno)
function totaleDi(config) {
  if (!config || typeof config !== 'object') return tutte(CAT.materializza(config).cat).length;
  if (!TOT.has(config)) TOT.set(config, tutte(CAT.materializza(config).cat).length);
  return TOT.get(config);
}
function cfgQuiz(config, classe, tot, alunno) {
  const q = (config && config.quiz) || {}, totale = tot || totaleDi(config);
  const n = Number(q.soglia), sc = (q.scadenze || {})[classe] || null;
  // proroga individuale: vale solo se la classe ha il quiz aperto e se è più tarda della scadenza della classe
  const pr = alunno && alunno.quiz_proroga && sc && Date.parse(alunno.quiz_proroga) > Date.parse(sc) ? alunno.quiz_proroga : null;
  const scad = pr || sc;
  return { soglia: n >= 1 ? Math.min(Math.round(n), totale) : totale, totale, scadenza: scad, scadenzaClasse: sc, proroga: pr, aperto: !!scad, scaduto: !!scad && Date.now() > Date.parse(scad), passo: QUIZ.passo };
}
/* lettura leggera (configurazione + un alunno): il quiz fa una richiesta a ogni risposta e non deve rileggere tutto il glossario */
async function contestoQuiz(db, codice) {
  const c = String(codice == null ? '' : codice).trim().toUpperCase();
  if (!c) L.errore('Inserisci il tuo codice.');
  const config = await db.leggiConfig();
  if (!config) L.errore('Glossario non ancora configurato.');
  const a = await db.leggiAlunnoCodice(c);
  if (!a) {
    if ((config.docenti || []).some((d) => d.codice && String(d.codice).trim().toUpperCase() === c)) L.errore('Il quiz è riservato agli alunni: inserisci il tuo codice personale.');
    L.errore('Codice non riconosciuto. Controlla di averlo scritto bene.');
  }
  const cat = CAT.materializza(config).cat;
  return { a, cat, cfg: cfgQuiz(config, L.classeDi(a), tutte(cat).length, a) };
}
const giorno = (iso) => new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
function controllaAccesso(q, cfg) {
  if (!cfg.aperto) L.errore('Il quiz non è ancora aperto: il docente comunicherà quando inizia.');
  if (cfg.scaduto && !(q && q.superata)) L.errore('Il tempo per il quiz è scaduto il ' + giorno(cfg.scadenza) + '. Hai indovinato ' + Object.keys((q && q.ok) || {}).length + ' termini su ' + cfg.soglia + '.');
}
function riepilogoQuiz(q, cfg) {
  const s = (q && q.sessioni) || [], c = cfg || { soglia: QUIZ.soglia, scadenza: null, aperto: false, scaduto: false };
  const ind = Object.keys((q && q.ok) || {}).length, sup = (q && q.superata) || null;
  return { indovinati: ind, soglia: c.soglia, superata: sup, sessioni: s.length, scadenza: c.scadenza || null, proroga: c.proroga || null, scadenzaClasse: c.scadenzaClasse || null,
    // stato rispetto all'ammissione all'orale
    stato: sup ? 'superato' : !c.aperto ? 'chiuso' : c.scaduto ? 'scaduto' : s.length ? 'in corso' : 'non iniziato',
    prima: s.length ? s[0].i : null, ultima: s.length ? (s[s.length - 1].f || s[s.length - 1].i) : null,
    risposte: s.reduce((x, y) => x + (y.r || 0), 0), corrette: s.reduce((x, y) => x + (y.c || 0), 0), errori: s.reduce((x, y) => x + (y.e || 0), 0), persi: s.reduce((x, y) => x + (y.p || 0), 0),
    massimo: Math.max(ind, (q && q.max) || 0), ms: s.reduce((x, y) => x + (y.ms || 0), 0) };
}
function nuovaDomanda(cat, q, stessa) {
  const tutti = tutte(cat), ok = q.ok || {}, prec = q.corrente ? chiave(q.corrente.a, q.corrente.k) : '';
  let t;
  if (stessa && q.corrente && cat[q.corrente.a] && cat[q.corrente.a][q.corrente.k] && !ok[prec]) t = { a: q.corrente.a, k: q.corrente.k }; // domanda lasciata a metà: si ripresenta lo stesso termine
  else {
    // sempre un termine non ancora indovinato; a prova superata (o se resta solo quello appena chiesto) un ripasso qualsiasi
    let rosa = tutti.filter((x) => !ok[chiave(x.a, x.k)] && chiave(x.a, x.k) !== prec);
    if (!rosa.length) rosa = tutti.filter((x) => !ok[chiave(x.a, x.k)]);
    if (!rosa.length) rosa = tutti.filter((x) => chiave(x.a, x.k) !== prec);
    t = rosa[caso(rosa.length)];
  }
  const voci = cat[t.a];
  // le definizioni sbagliate sono di altri termini della stessa area, con testi tutti diversi; l'ordine è casuale
  const altri = voci.map((x, k) => k).filter((k) => k !== t.k && voci[k][1] !== voci[t.k][1]);
  for (let x = altri.length - 1; x > 0; x--) { const y = caso(x + 1); [altri[x], altri[y]] = [altri[y], altri[x]]; }
  const o = [t.k], testi = { [voci[t.k][1]]: 1 };
  altri.forEach((k) => { if (o.length < QUIZ.opzioni && !testi[voci[k][1]]) { testi[voci[k][1]] = 1; o.push(k); } });
  for (let x = o.length - 1; x > 0; x--) { const y = caso(x + 1); [o[x], o[y]] = [o[y], o[x]]; }
  return { a: t.a, k: t.k, o, g: LETTERE[o.indexOf(t.k)], t: Date.now() };
}
function vistaDomanda(cat, cur, n) {
  const ar = DATI.AREE.find((x) => String(x.n) === String(cur.a)) || {};
  const d = { n, area: cur.a, nomeArea: ar.it || '', colore: ar.colore || '', termine: cat[cur.a][cur.k][0], secondi: QUIZ.secondi, lettere: cur.o.map((k, i) => LETTERE[i]) };
  cur.o.forEach((k, i) => { d[LETTERE[i]] = cat[cur.a][k][1]; });
  return d;
}
async function quizInizio(db, { codice }) {
  const { a, cat, cfg } = await contestoQuiz(db, codice);
  controllaAccesso(a.quiz, cfg);
  const v = a.quiz || {};
  const q = { ok: v.ok || {}, seq: v.seq || 0, max: v.max || 0, sessioni: (v.sessioni || []).slice(-(QUIZ.maxSessioni - 1)), superata: v.superata || null, corrente: v.corrente || null };
  const ora = new Date().toISOString();
  q.sessioni.push({ i: ora, f: ora, ms: 0, r: 0, c: 0, e: 0, s: 0, n: 0, p: 0 });
  q.corrente = nuovaDomanda(cat, q, true);
  await db.sostituisciQuiz(a.id, q);
  return { nome: L.nomePubblico(a.nome), stato: riepilogoQuiz(q, cfg), sessione: { r: 0, c: 0, e: 0, n: 0, p: 0, ms: 0 }, totale: cfg.totale, passo: QUIZ.passo, domanda: vistaDomanda(cat, q.corrente, 1) };
}
async function quizRisposta(db, { codice, scelta, pausa }) {
  const { a, cat, cfg } = await contestoQuiz(db, codice);
  const q = a.quiz;
  controllaAccesso(q, cfg);
  if (!q || !q.corrente || !q.sessioni || !q.sessioni.length || !cat[q.corrente.a] || !cat[q.corrente.a][q.corrente.k]) L.errore('Sessione scaduta: ricomincia il quiz.');
  // il tempo parte quando la domanda compare: si toglie la pausa passata a leggere l'esito della precedente (al massimo 15 secondi)
  const cur = q.corrente, ora = Date.now(), tempo = Math.max(0, ora - cur.t - Math.min(Math.max(Number(pausa) || 0, 0), 15000));
  const scaduta = tempo > (QUIZ.secondi + QUIZ.tolleranza) * 1000 || !scelta || LETTERE.slice(0, (cur.o || [0, 1]).length).indexOf(scelta) < 0;
  const corretta = !scaduta && scelta === cur.g;
  const s = q.sessioni[q.sessioni.length - 1], kk = chiave(cur.a, cur.k);
  q.ok = q.ok || {};
  s.r = (s.r || 0) + 1; s.ms = (s.ms || 0) + Math.min(tempo, (QUIZ.secondi + QUIZ.tolleranza) * 1000); s.f = new Date(ora).toISOString();
  if (scaduta) s.s = (s.s || 0) + 1;
  let persi = 0;
  if (corretta) {
    s.c = (s.c || 0) + 1;
    if (!q.ok[kk]) { q.seq = (q.seq || 0) + 1; q.ok[kk] = q.seq; s.n = (s.n || 0) + 1; }
  } else {
    s.e = (s.e || 0) + 1;
    // risposta sbagliata o non data: non si mostra quella giusta e si torna indietro di 5 termini (gli ultimi indovinati). A prova superata non si perde più nulla.
    if (!q.superata) {
      const ultimi = Object.keys(q.ok).sort((x, y) => (q.ok[y] || 0) - (q.ok[x] || 0)).slice(0, QUIZ.passo);
      ultimi.forEach((k) => { delete q.ok[k]; }); persi = ultimi.length; s.p = (s.p || 0) + persi;
    }
  }
  const ind = Object.keys(q.ok).length;
  q.max = Math.max(q.max || 0, ind);
  if (!q.superata && ind >= cfg.soglia) q.superata = new Date(ora).toISOString();
  const esito = { corretta, scaduta, persi, termine: cat[cur.a][cur.k][0] };
  if (corretta) esito.giusta = cur.g; // la risposta giusta non si svela mai dopo un errore
  q.corrente = nuovaDomanda(cat, q, false);
  await db.sostituisciQuiz(a.id, q);
  return { esito, stato: riepilogoQuiz(q, cfg), sessione: { r: s.r, c: s.c, e: s.e || 0, n: s.n, p: s.p || 0, ms: s.ms }, domanda: vistaDomanda(cat, q.corrente, s.r + 1) };
}
/* tabellone del quiz per i docenti */
function tabelloneQuiz(stato) {
  const tot = tutte(catalogo(stato)).length;
  return stato.alunni.map((a) => Object.assign({ id: a.id }, riepilogoQuiz(a.quiz, cfgQuiz(stato.config, L.classeDi(a), tot, a)), {
    ultime: ((a.quiz && a.quiz.sessioni) || []).slice(-60).map((s) => ({ i: s.i, ms: s.ms || 0, r: s.r || 0, c: s.c || 0, e: s.e || 0, s: s.s || 0, n: s.n || 0, p: s.p || 0 })) }));
}

/* ---------------- interrogazione orale ---------------- */
function votoOrale(punti, escluso) { return Math.round((ORALE.base + (escluso ? ORALE.passoEsclusi : ORALE.passo) * punti) * 1000) / 1000; }
function docenteVoti(stato, codice) { const chi = L.identifica(stato, codice); L.permesso(chi, 'voti'); return chi; }
function alunno(stato, id) { const a = stato.alunni.find((x) => x.id === id); if (!a) L.errore('Alunno non trovato.'); return a; }
function propri(stato, a) { const s = {}; stato.termini.filter((t) => t.alunno_id === a.id).forEach((t) => { s[chiave(t.area, L.indiceTermine(t))] = 1; }); return s; }
/* quante volte ogni termine è già uscito nelle interrogazioni (fatte o in corso) della classe */
function usciti(stato, a) {
  const n = {}, cl = L.classeDi(a);
  stato.alunni.filter((x) => x.id !== a.id && L.classeDi(x) === cl).forEach((x) => {
    [].concat((x.orale && x.orale.termini) || [], (x.orale_bozza && x.orale_bozza.termini) || []).forEach((t) => { const k = chiave(t.a, t.k); n[k] = (n[k] || 0) + 1; });
  });
  return n;
}
function scegliIn(cat, area, quanti, vietati, freq) {
  const cand = cat[area].map((x, k) => ({ a: Number(area), k, f: freq[chiave(area, k)] || 0, z: caso(1000000) })).filter((x) => !vietati[chiave(x.a, x.k)]);
  cand.sort((x, y) => x.f - y.f || x.z - y.z);
  return cand.slice(0, quanti).map((x) => ({ a: x.a, k: x.k }));
}
function vistaBozza(cat, b) {
  return { data: b.data, cambi: b.cambi || 0, termini: b.termini.map((t) => ({ area: t.a, k: t.k, it: cat[t.a][t.k][0], def: cat[t.a][t.k][1] })) };
}
async function oralePesca(db, { codice, alunno: id, nuova }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato);
  // all'interrogazione è ammesso solo chi ha completato il quiz
  if (!(a.quiz && a.quiz.superata)) {
    const rq = riepilogoQuiz(a.quiz, cfgQuiz(stato.config, L.classeDi(a), null, a));
    L.errore(a.nome + ' non è ammesso all\'interrogazione: non ha completato il quiz (' + rq.indovinati + ' termini su ' + rq.soglia + ').');
  }
  if (a.orale_bozza && !nuova) return { alunno: a.id, bozza: vistaBozza(cat, a.orale_bozza) };
  const aree = Object.keys(cat).map(Number).sort((x, y) => x - y), miei = propri(stato, a), freq = usciti(stato, a);
  // 10 domande: parti uguali per area, il resto alle aree a rotazione (cambia a ogni interrogazione della classe)
  const fatte = stato.alunni.filter((x) => L.classeDi(x) === L.classeDi(a) && (x.orale || x.orale_bozza) && x.id !== a.id).length;
  const quota = aree.map(() => Math.floor(ORALE.domande / aree.length));
  for (let i = 0, r = ORALE.domande - quota.reduce((x, y) => x + y, 0); i < r; i++) quota[(fatte + i) % aree.length]++;
  let termini = []; const vietati = Object.assign({}, miei);
  aree.forEach((ar, i) => { const s = scegliIn(cat, ar, quota[i], vietati, freq); s.forEach((t) => { vietati[chiave(t.a, t.k)] = 1; }); termini = termini.concat(s); });
  // se un'area non ha abbastanza termini non suoi, si completa con le altre
  for (let i = 0; termini.length < ORALE.domande && i < aree.length * 3; i++) { const s = scegliIn(cat, aree[i % aree.length], 1, vietati, freq); s.forEach((t) => { vietati[chiave(t.a, t.k)] = 1; termini.push(t); }); }
  if (termini.length < ORALE.domande) L.errore('Non ci sono abbastanza termini per l\'interrogazione.');
  for (let x = termini.length - 1; x > 0; x--) { const y = caso(x + 1); [termini[x], termini[y]] = [termini[y], termini[x]]; }
  const bozza = { data: new Date().toISOString(), termini, cambi: 0 };
  await db.scriviAlunno(a.id, { orale_bozza: bozza });
  return { alunno: a.id, bozza: vistaBozza(cat, bozza) };
}
async function oraleCambia(db, { codice, alunno: id, pos }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato), b = a.orale_bozza;
  if (!b || !b.termini || !b.termini[pos]) L.errore('Interrogazione non trovata: pesca di nuovo i termini.');
  const vietati = propri(stato, a); b.termini.forEach((t) => { vietati[chiave(t.a, t.k)] = 1; });
  const s = scegliIn(cat, b.termini[pos].a, 1, vietati, usciti(stato, a));
  if (!s.length) L.errore('Non ci sono altri termini disponibili in quest\'area.');
  const bozza = { data: b.data, termini: b.termini.map((t, i) => (i === Number(pos) ? s[0] : t)), cambi: (b.cambi || 0) + 1 };
  await db.scriviAlunno(a.id, { orale_bozza: bozza });
  return { alunno: a.id, bozza: vistaBozza(cat, bozza) };
}
async function oraleSalva(db, { codice, alunno: id, esiti, nota }) {
  const stato = await db.leggiTutto(), chi = docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato), b = a.orale_bozza;
  if (!b || !b.termini) L.errore('Interrogazione non trovata: pesca di nuovo i termini.');
  if (!Array.isArray(esiti) || esiti.length !== b.termini.length || esiti.some((e) => [0, 0.5, 1].indexOf(e) < 0)) L.errore('Segna l\'esito di tutte le risposte prima di salvare.');
  const escluso = L.valuta(stato, a, Date.now()).escluso, punti = esiti.reduce((x, y) => x + y, 0);
  const orale = { data: new Date().toISOString(), docente: chi.nome, escluso, punti, voto: votoOrale(punti, escluso), cambi: b.cambi || 0, nota: String(nota || '').replace(/\s+/g, ' ').trim().slice(0, 300),
    termini: b.termini.map((t, i) => ({ a: t.a, k: t.k, it: cat[t.a][t.k][0], e: esiti[i] })) };
  const storico = (a.orale_storico || []).concat(a.orale ? [a.orale] : []).slice(-5);
  await db.scriviAlunno(a.id, { orale, orale_bozza: null, orale_storico: storico });
  return { alunno: a.id, orale: { punti, voto: orale.voto, escluso } };
}
async function oraleAnnulla(db, { codice, alunno: id, bozza }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const a = alunno(stato, id);
  if (bozza) await db.scriviAlunno(a.id, { orale_bozza: null });
  else await db.scriviAlunno(a.id, { orale: null, orale_bozza: null, orale_storico: (a.orale_storico || []).concat(a.orale ? [a.orale] : []).slice(-5) });
  return { alunno: a.id };
}

/* proroga individuale del quiz: data successiva alla scadenza della classe (data vuota = togli la proroga) */
async function quizProroga(db, { codice, alunno: id, data }) {
  const stato = await db.leggiTutto(); L.permesso(L.identifica(stato, codice), 'studenti');
  const a = alunno(stato, id), sc = ((stato.config.quiz || {}).scadenze || {})[L.classeDi(a)];
  if (!data) { await db.scriviAlunno(a.id, { quiz_proroga: null }); return { alunno: a.id, proroga: null }; }
  if (!sc) L.errore('Il quiz della ' + L.classeDi(a) + ' non è ancora aperto: fissa prima la scadenza della classe.');
  const iso = L.isoValida(data);
  if (Date.parse(iso) <= Date.parse(sc)) L.errore('La proroga deve essere successiva alla scadenza del quiz della ' + L.classeDi(a) + ' (' + giorno(sc) + ').');
  if (Date.parse(iso) <= Date.now()) L.errore('La proroga deve essere nel futuro.');
  await db.scriviAlunno(a.id, { quiz_proroga: iso });
  return { alunno: a.id, proroga: iso };
}

module.exports = { quizProroga, QUIZ, ORALE, cfgQuiz, quizInizio, quizRisposta, tabelloneQuiz, riepilogoQuiz, votoOrale, oralePesca, oraleCambia, oraleSalva, oraleAnnulla };
