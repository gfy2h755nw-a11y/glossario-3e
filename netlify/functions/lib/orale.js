/**
 * Quiz (parte della prova, nella pagina /quiz con il codice personale) e interrogazione orale (area docenti).
 *
 * Quiz: un termine e quattro definizioni, 60 secondi. Si apre quando il docente fissa la scadenza della classe.
 * A ogni risposta giusta il termine è «indovinato»; a ogni risposta sbagliata o non data NON si mostra quella giusta
 * e si torna indietro di 5 termini (gli ultimi indovinati). I progressi restano tra una sessione e l'altra.
 * La prova è superata quando i termini indovinati raggiungono la soglia (di norma tutti i termini del glossario):
 * solo allora l'alunno è ammesso all'interrogazione. Chi non la supera entro la scadenza non viene interrogato e non ha voto.
 * Per ogni sessione si registrano inizio, tempo, risposte, corrette, errori, scadute, termini nuovi e termini persi.
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
const REG = require('./regole');

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
  const scad = pr || sc, R = REG.di(config).quiz;
  // apertura per classe: prima di quell'ora il quiz resta chiuso (vuota = aperto da subito, appena c'è la scadenza)
  const pa = sc ? (q.partenze || {})[classe] || null : null, attesa = !!pa && Date.now() < Date.parse(pa);
  // regole personali dell'alunno (PDP, DSA…): meno termini da indovinare e/o meno termini persi per errore
  const sC = n >= 1 ? Math.min(Math.round(n), totale) : totale;
  const sP = alunno && Number(alunno.quiz_soglia) >= 1 ? Math.min(Math.round(Number(alunno.quiz_soglia)), totale) : null;
  // studente BES: timer personale o nessun timer (secondi 0) e pulsante «Dimezza opzioni»
  const B = alunno && alunno.bes ? alunno.bes : null;
  const pP = alunno && alunno.quiz_passo != null && alunno.quiz_passo !== '' && Number(alunno.quiz_passo) >= 0 ? Math.round(Number(alunno.quiz_passo)) : null;
  return { soglia: sP != null ? sP : sC, sogliaClasse: sC, sogliaPersonale: sP, passoClasse: R.passo, passoPersonale: pP, totale, scadenza: scad, scadenzaClasse: sc, proroga: pr, partenza: pa, attesa, aperto: !!scad && !attesa, scaduto: !!scad && Date.now() > Date.parse(scad),
    passo: pP != null ? pP : R.passo, secondi: B && B.secondi != null ? B.secondi : R.secondi, senzaTempo: !!(B && B.secondi === 0), dimezza: !!(B && B.dimezza !== false), bes: B, opzioni: R.opzioni };
}
/* lettura leggera (configurazione + un alunno): il quiz fa una richiesta a ogni risposta e non deve rileggere tutto il glossario */
/* «Prova il quiz»: il docente entra con il suo codice come uno studente finto. Lo stato della prova sta nella config
   (provaQuiz, una stringa JSON per docente): nessun alunno, nessuna statistica e nessun report lo vedono. */
/* misure da provare: 1 (vecchio link &bes=1) = senza tempo + dimezza; { s, d } = scelte nella pagina della prova */
function besProva(bes) {
  if (bes === 1 || bes === '1' || bes === true) return { secondi: 0, dimezza: true };
  if (bes && typeof bes === 'object' && (bes.s || bes.d)) return { secondi: bes.s ? 0 : null, dimezza: !!bes.d };
  return null;
}
function alunnoProva(config, d, bes) {
  let q = null; try { q = JSON.parse(((config.provaQuiz || {})[d.id || d.codice]) || 'null'); } catch (e) { q = null; }
  const cl = ((config.impostazioni && config.impostazioni.classi) || config.classi || ['3E'])[0];
  return { id: '_prova', nome: 'Prova Docente', classe: cl, gruppo: 1, quiz: q, bes: besProva(bes), _prova: d.id || d.codice };
}
async function salvaQuiz(db, a, q) {
  if (a._prova) return db.scriviConfig({ provaQuiz: { [a._prova]: JSON.stringify(q) } });
  return db.sostituisciQuiz(a.id, q);
}
async function contestoQuiz(db, codice, prova, bes) {
  const c = String(codice == null ? '' : codice).trim().toUpperCase();
  if (!c) L.errore('Inserisci il tuo codice.');
  const config = await db.leggiConfig();
  if (!config) L.errore('Glossario non ancora configurato.');
  const doc = (config.docenti || []).find((d) => d.codice && String(d.codice).trim().toUpperCase() === c);
  if (prova) {
    if (!doc) L.errore('La prova del quiz è riservata ai docenti: inserisci il tuo codice da docente.');
    if (doc.attivita && !doc.admin && config._spazio !== doc.attivita) L.errore('Con questo codice puoi entrare solo nella tua attività.');
    const a = alunnoProva(config, doc, bes), cat = CAT.materializza(config).cat;
    const cfg = Object.assign(cfgQuiz(config, a.classe, tutte(cat).length, a), { aperto: true, attesa: false, scaduto: false, scadenza: new Date(Date.now() + 86400000).toISOString() });
    return { a, cat, cfg, config };
  }
  const a = await db.leggiAlunnoCodice(c);
  if (a && config.bozza) L.errore('L\'attività non è ancora iniziata: il professore la aprirà a breve.');
  if (!a) {
    if ((config.docenti || []).some((d) => d.codice && String(d.codice).trim().toUpperCase() === c)) L.errore('Il quiz è riservato agli alunni: inserisci il tuo codice personale.');
    L.errore('Codice non riconosciuto. Controlla di averlo scritto bene.');
  }
  const cat = CAT.materializza(config).cat;
  return { a, cat, cfg: cfgQuiz(config, L.classeDi(a), tutte(cat).length, a), config };
}
const giorno = (iso) => new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
function controllaAccesso(q, cfg) {
  if (cfg.attesa) L.errore('Il quiz non è ancora aperto: si apre il ' + giorno(cfg.partenza) + '.');
  if (!cfg.aperto) L.errore('Il quiz non è ancora aperto: il docente comunicherà quando inizia.');
  if (cfg.scaduto && !(q && q.superata)) L.errore('Il tempo per il quiz è scaduto il ' + giorno(cfg.scadenza) + '. Hai indovinato ' + Object.keys((q && q.ok) || {}).length + ' termini su ' + cfg.soglia + '.');
}
function riepilogoQuiz(q, cfg) {
  const s = (q && q.sessioni) || [], c = cfg || { soglia: QUIZ.soglia, scadenza: null, aperto: false, scaduto: false };
  const ind = Object.keys((q && q.ok) || {}).length, sup = (q && q.superata) || null;
  const r = { indovinati: ind, soglia: c.soglia, superata: sup, sessioni: s.length, dispositivi: ((q && q.disp) || []).length, subentri: (q && q.subentri) || 0, abbandoni: (q && q.abb) || 0, scadenza: c.scadenza || null, proroga: c.proroga || null, scadenzaClasse: c.scadenzaClasse || null, partenza: c.partenza || null, bes: c.bes ? { secondi: c.bes.secondi != null ? c.bes.secondi : null, dimezza: c.bes.dimezza !== false, etichetta: c.bes.etichetta !== false } : null, sogliaPersonale: c.sogliaPersonale != null ? c.sogliaPersonale : null, sogliaClasse: c.sogliaClasse != null ? c.sogliaClasse : null, passoPersonale: c.passoPersonale != null ? c.passoPersonale : null, passo: c.passo != null ? c.passo : null,
    // stato rispetto all'ammissione all'orale
    stato: sup ? 'superato' : !c.aperto ? 'chiuso' : c.scaduto ? 'scaduto' : s.length ? 'in corso' : 'non iniziato',
    prima: s.length ? s[0].i : null, ultima: s.length ? (s[s.length - 1].f || s[s.length - 1].i) : null,
    risposte: s.reduce((x, y) => x + (y.r || 0), 0), corrette: s.reduce((x, y) => x + (y.c || 0), 0), errori: s.reduce((x, y) => x + (y.e || 0), 0), persi: s.reduce((x, y) => x + (y.p || 0), 0),
    massimo: Math.max(ind, (q && q.max) || 0), ms: s.reduce((x, y) => x + (y.ms || 0), 0) };
  // tempo fino al termine del quiz: al superamento, oppure tutto il tempo speso se la scadenza è passata (o è ancora in corso)
  r.msSup = sup ? (q.msSup != null ? q.msSup : s.filter((y) => y.i <= sup).reduce((x, y) => x + (y.ms || 0), 0)) : null;
  r.msFine = sup ? r.msSup : r.ms;
  r.concluso = r.stato === 'superato' || r.stato === 'scaduto';
  r.giorniSup = sup && s.length ? Math.max(1, Math.round((Date.parse(sup.slice(0, 10)) - Date.parse(String(s[0].i).slice(0, 10))) / 86400000) + 1) : null;
  return r;
}
/* quello che vede lo studente: niente etichette (BES, regole personali), solo i numeri che gli servono */
function perStudente(r) { const o = Object.assign({}, r); delete o.bes; delete o.sogliaPersonale; delete o.passoPersonale; delete o.sogliaClasse; return o; }
function nuovaDomanda(cat, q, stessa, nOpz) {
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
  altri.forEach((k) => { if (o.length < (nOpz || QUIZ.opzioni) && !testi[voci[k][1]]) { testi[voci[k][1]] = 1; o.push(k); } });
  for (let x = o.length - 1; x > 0; x--) { const y = caso(x + 1); [o[x], o[y]] = [o[y], o[x]]; }
  // posizione della risposta giusta: mai la stessa della domanda prima e, tra le altre, una di quelle uscite meno
  // nelle ultime domande, così si distribuisce in modo uniforme tra 1, 2, 3 e 4 senza schemi prevedibili
  const st = (q.pos || []).slice(-8), ultima = st.length ? st[st.length - 1] : -1;
  const conta = o.map((x, i) => st.filter((v) => v === i).length);
  const ammesse = o.map((x, i) => i).filter((i) => i !== ultima || o.length < 2);
  const meno = Math.min.apply(null, ammesse.map((i) => conta[i]));
  const scelte = ammesse.filter((i) => conta[i] <= meno + 1 && (conta[i] === meno || caso(2) === 0));
  const pos = scelte.length ? scelte[caso(scelte.length)] : ammesse[caso(ammesse.length)];
  const qui = o.indexOf(t.k); [o[qui], o[pos]] = [o[pos], o[qui]];
  q.pos = st.concat([pos]);
  return { a: t.a, k: t.k, o, g: LETTERE[o.indexOf(t.k)], t: Date.now() };
}
function vistaDomanda(cat, cur, n, cfg) {
  const ar = CAT.aree().find((x) => String(x.n) === String(cur.a)) || {};
  const d = { n, area: cur.a, nomeArea: ar.it || '', colore: ar.colore || '', termine: cat[cur.a][cur.k][0], secondi: cfg && cfg.senzaTempo ? 0 : (cfg && cfg.secondi) || QUIZ.secondi, lettere: cur.o.map((k, i) => LETTERE[i]),
    dimezza: !!(cfg && cfg.dimezza && cur.o.length > 2 && !cur.dim), dimezzata: !!cur.dim, id: cur.t };
  cur.o.forEach((k, i) => { d[LETTERE[i]] = cat[cur.a][k][1]; });
  return d;
}
/* Una sola sessione per codice: ogni avvio crea un gettone; le risposte con un gettone vecchio (quiz aperto nel frattempo
   su un altro dispositivo) vengono rifiutate. Si registrano i dispositivi usati e le sessioni prese da un altro dispositivo
   mentre la precedente era ancora attiva (segnale per il docente). */
const vistaDi = (a, config) => (a._prova ? ((config && config.provaVista) || {})[a._prova] : a.quiz_vista) || null;
function abbandonata(q, cfg, vista) {
  const cur = q.corrente, v = cur && (cur.v || (vista && Number(vista.t) === cur.t ? Number(vista.v) : 0));
  if (!cur || !v || !q.sessioni.length) return null;
  const s = q.sessioni[q.sessioni.length - 1], lim = cfg.senzaTempo ? 600000 : (cfg.secondi + QUIZ.tolleranza) * 1000;
  s.r = (s.r || 0) + 1; s.e = (s.e || 0) + 1; s.ab = (s.ab || 0) + 1; s.ms = (s.ms || 0) + Math.min(Math.max(0, Date.now() - v), lim);
  let persi = 0;
  if (!q.superata) {
    const ultimi = Object.keys(q.ok).sort((x, y) => (q.ok[y] || 0) - (q.ok[x] || 0)).slice(0, cfg.passo);
    ultimi.forEach((k) => { delete q.ok[k]; }); persi = ultimi.length; s.p = (s.p || 0) + persi;
  }
  q.abb = (q.abb || 0) + 1; q.corrente = null;
  return { persi, indovinati: Object.keys(q.ok).length };
}
/* la domanda è comparsa sullo schermo dello studente: da qui, se esce senza rispondere, conta come non data */
// (in un campo a parte: se arriva insieme alla risposta non la può sovrascrivere)
async function quizVista(db, { codice, tok, id, prova, bes }) {
  const { a, config } = await contestoQuiz(db, codice, prova, bes);
  const q = a.quiz;
  if (!q || !q.corrente || (q.sess && q.sess.tok && tok !== q.sess.tok) || q.corrente.t !== Number(id)) return { ok: true };
  const gia = vistaDi(a, config); if (gia && Number(gia.t) === q.corrente.t) return { ok: true };
  const v = { t: q.corrente.t, v: Date.now() };
  if (a._prova) await db.scriviConfig({ provaVista: { [a._prova]: v } }); else await db.scriviAlunno(a.id, { quiz_vista: v });
  return { ok: true };
}
const SUBENTRO_MS = 10 * 60000;
async function quizInizio(db, { codice, disp, prova, bes, daCapo }) {
  const { a, cat, cfg, config } = await contestoQuiz(db, codice, prova, bes);
  if (a._prova && daCapo) a.quiz = null; // la prova riparte da zero
  controllaAccesso(a.quiz, cfg);
  const v = a.quiz || {};
  const q = { ok: v.ok || {}, seq: v.seq || 0, max: v.max || 0, sessioni: (v.sessioni || []).slice(-(QUIZ.maxSessioni - 1)), superata: v.superata || null, corrente: v.corrente || null,
    disp: (v.disp || []).slice(0, 20), subentri: v.subentri || 0, pos: (v.pos || []).slice(-8) };
  if (v.msSup != null) q.msSup = v.msSup;
  const ora = new Date().toISOString();
  const d = String(disp || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40) || 'sconosciuto';
  if (q.disp.indexOf(d) < 0 && q.disp.length < 20) q.disp.push(d);
  // domanda lasciata a metà (comparsa sullo schermo e mai risposta: pagina chiusa o ricaricata, rete staccata, telefono spento):
  // conta come non data, con la stessa penalità del tempo scaduto. Per tutti, sempre.
  const abbandono = abbandonata(q, cfg, vistaDi(a, config));
  const prec = v.sess, ultima = q.sessioni.length ? Date.parse(q.sessioni[q.sessioni.length - 1].f || q.sessioni[q.sessioni.length - 1].i) : 0;
  if (prec && prec.disp && prec.disp !== d && Date.now() - ultima < SUBENTRO_MS) q.subentri++;
  q.sess = { tok: require('crypto').randomBytes(12).toString('hex'), disp: d, i: ora };
  q.sessioni.push({ i: ora, f: ora, ms: 0, r: 0, c: 0, e: 0, s: 0, n: 0, p: 0 });
  q.corrente = nuovaDomanda(cat, q, true, cfg.opzioni);
  await salvaQuiz(db, a, q);
  return { abbandono, conc: config.concessione || null, tok: q.sess.tok, nome: L.nomePubblico(a.nome), stato: perStudente(riepilogoQuiz(q, cfg)), sessione: { r: 0, c: 0, e: 0, n: 0, p: 0, ms: 0 }, totale: cfg.totale, passo: cfg.passo, secondi: cfg.secondi, opzioni: cfg.opzioni, domanda: vistaDomanda(cat, q.corrente, 1, cfg) };
}
async function quizRisposta(db, { codice, scelta, pausa, tok, prova, bes }) {
  const { a, cat, cfg } = await contestoQuiz(db, codice, prova, bes);
  const q = a.quiz;
  controllaAccesso(q, cfg);
  if (q && q.sess && q.sess.tok && tok !== q.sess.tok) L.errore('Sessione chiusa: il quiz è stato aperto con il tuo codice su un altro telefono o computer. Se sei tu, premi «Inizia» per continuare qui.');
  if (!q || !q.corrente || !q.sessioni || !q.sessioni.length || !cat[q.corrente.a] || !cat[q.corrente.a][q.corrente.k]) L.errore('Sessione scaduta: ricomincia il quiz.');
  // il tempo parte quando la domanda compare: si toglie la pausa passata a leggere l'esito della precedente (al massimo 15 secondi)
  const cur = q.corrente, ora = Date.now(), tempo = Math.max(0, ora - cur.t - Math.min(Math.max(Number(pausa) || 0, 0), 15000));
  const lim = cfg.senzaTempo ? 600000 : (cfg.secondi + QUIZ.tolleranza) * 1000; // senza timer: si contano al massimo 10 minuti per domanda
  const scaduta = (!cfg.senzaTempo && tempo > lim) || !scelta || LETTERE.slice(0, (cur.o || [0, 1]).length).indexOf(scelta) < 0;
  const corretta = !scaduta && scelta === cur.g;
  const s = q.sessioni[q.sessioni.length - 1], kk = chiave(cur.a, cur.k);
  q.ok = q.ok || {};
  s.r = (s.r || 0) + 1; s.ms = (s.ms || 0) + Math.min(tempo, lim); s.f = new Date(ora).toISOString();
  if (scaduta) s.s = (s.s || 0) + 1;
  let persi = 0;
  if (corretta) {
    s.c = (s.c || 0) + 1;
    if (!q.ok[kk]) { q.seq = (q.seq || 0) + 1; q.ok[kk] = q.seq; s.n = (s.n || 0) + 1; }
  } else {
    s.e = (s.e || 0) + 1;
    // risposta sbagliata o non data: non si mostra quella giusta e si torna indietro di 5 termini (gli ultimi indovinati). A prova superata non si perde più nulla.
    if (!q.superata) {
      const ultimi = Object.keys(q.ok).sort((x, y) => (q.ok[y] || 0) - (q.ok[x] || 0)).slice(0, cfg.passo);
      ultimi.forEach((k) => { delete q.ok[k]; }); persi = ultimi.length; s.p = (s.p || 0) + persi;
    }
  }
  const ind = Object.keys(q.ok).length;
  q.max = Math.max(q.max || 0, ind);
  if (!q.superata && ind >= cfg.soglia) {
    q.superata = new Date(ora).toISOString();
    // tempo complessivo passato sul quiz fino al superamento (le risposte date dopo, di ripasso, non contano)
    q.msSup = q.sessioni.reduce((x, y) => x + (y.ms || 0), 0);
  }
  const esito = { corretta, scaduta, persi, termine: cat[cur.a][cur.k][0] };
  if (corretta) esito.giusta = cur.g; // la risposta giusta non si svela mai dopo un errore
  q.corrente = nuovaDomanda(cat, q, false, cfg.opzioni);
  await salvaQuiz(db, a, q);
  return { esito, stato: perStudente(riepilogoQuiz(q, cfg)), sessione: { r: s.r, c: s.c, e: s.e || 0, n: s.n, p: s.p || 0, ms: s.ms }, domanda: vistaDomanda(cat, q.corrente, s.r + 1, cfg) };
}
/* regole del quiz per la pagina d'ingresso (dal codice): se il codice non c'è, quelle di sempre */
async function quizRegole(db, { codice, prova, bes }) {
  const c = String(codice == null ? '' : codice).trim().toUpperCase();
  const config = await db.leggiConfig();
  const a = c && config ? await db.leggiAlunnoCodice(c) : null;
  const R = REG.di(a || prova ? config : {}).quiz;
  // con il codice di un alunno: le sue regole personali, se ne ha (nella prova del docente: quelle scelte per la prova)
  const P = a ? cfgQuiz(config, L.classeDi(a), null, a) : prova && config ? cfgQuiz(config, null, null, { bes: besProva(bes) }) : null;
  return { secondi: P ? P.secondi : R.secondi, opzioni: R.opzioni, passo: P ? P.passo : R.passo, soglia: P ? P.soglia : undefined, senzaTempo: !!(P && P.senzaTempo), dimezza: !!(P && P.dimezza) };
}
/* tabellone del quiz per i docenti */
function tabelloneQuiz(stato) {
  const tot = tutte(catalogo(stato)).length;
  return stato.alunni.map((a) => Object.assign({ id: a.id, piano: a.orale_piano || null }, riepilogoQuiz(a.quiz, cfgQuiz(stato.config, L.classeDi(a), tot, a)), {
    ultime: ((a.quiz && a.quiz.sessioni) || []).slice(-60).map((s) => ({ i: s.i, ms: s.ms || 0, r: s.r || 0, c: s.c || 0, e: s.e || 0, s: s.s || 0, n: s.n || 0, p: s.p || 0, d: s.d || 0 })) }));
}

/* ---------------- interrogazione orale ---------------- */
// con meno domande (studenti BES: la metà) ogni punto vale in proporzione, così il massimo resta lo stesso
function votoOrale(punti, escluso, config, n) { const O = REG.di(config).orale, k = n && n !== O.domande ? O.domande / n : 1; return Math.round((O.base + (escluso ? O.passoEsclusi : O.passo) * punti * k) * 1000) / 1000; }
function domandeDi(a, config) { const ND = REG.di(config).orale.domande; return a && (a.bes && a.bes.etichetta !== false) ? Math.max(1, Math.round(ND / 2)) : ND; }
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
/* evidenza per il docente: per ogni termine già uscito nella classe, chi l'ha avuto (nome breve) */
function chiUsati(stato, a) {
  const n = {}, cl = L.classeDi(a);
  stato.alunni.filter((x) => x.id !== a.id && L.classeDi(x) === cl).forEach((x) => {
    const nome = L.nomePubblico(x.nome);
    ((x.orale && x.orale.termini) || []).forEach((t) => { const k = chiave(t.a, t.k); (n[k] = n[k] || []).push(nome); });
    ((x.orale_bozza && x.orale_bozza.termini) || []).forEach((t) => { const k = chiave(t.a, t.k); (n[k] = n[k] || []).push(nome + ' (in corso)'); });
  });
  return n;
}
function scegliIn(cat, area, quanti, vietati, freq) {
  const cand = cat[area].map((x, k) => ({ a: Number(area), k, f: freq[chiave(area, k)] || 0, z: caso(1000000) })).filter((x) => !vietati[chiave(x.a, x.k)]);
  cand.sort((x, y) => x.f - y.f || x.z - y.z);
  return cand.slice(0, quanti).map((x) => ({ a: x.a, k: x.k }));
}
/* termini su cui si può interrogare: chi ha una soglia del quiz più bassa del totale (es. studenti BES) solo sui termini
   del suo quiz (quelli indovinati); chi ha fatto il quiz su tutti i termini, su tutto il glossario. null = tutto il glossario */
function bacino(stato, a) {
  const cfg = cfgQuiz(stato.config, L.classeDi(a), null, a);
  if (!(cfg.soglia < cfg.totale)) return null;
  const ok = (a.quiz && a.quiz.ok) || {}, b = {};
  Object.keys(ok).forEach((k) => { b[k] = 1; });
  return b;
}
function fuoriBacino(cat, bac) { const v = {}; if (!bac) return v; Object.keys(cat).forEach((ar) => cat[ar].forEach((x, k) => { if (!bac[chiave(ar, k)]) v[chiave(ar, k)] = 1; })); return v; }
function vistaBozza(cat, b, chi) {
  return { data: b.data, cambi: b.cambi || 0, scelti: !!b.scelti, termini: b.termini.map((t) => ({ area: t.a, k: t.k, it: cat[t.a][t.k][0], def: cat[t.a][t.k][1], usati: chi ? (chi[chiave(t.a, t.k)] || []) : [] })) };
}
async function oralePesca(db, { codice, alunno: id, nuova }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato);
  // all'interrogazione è ammesso solo chi ha completato il quiz
  if (!(a.quiz && a.quiz.superata)) {
    const rq = riepilogoQuiz(a.quiz, cfgQuiz(stato.config, L.classeDi(a), null, a));
    L.errore(a.nome + ' non è ammesso all\'interrogazione: non ha completato il quiz (' + rq.indovinati + ' termini su ' + rq.soglia + ').');
  }
  if (a.orale_bozza && !nuova) return { alunno: a.id, bozza: vistaBozza(cat, a.orale_bozza, chiUsati(stato, a)) };
  const aree = Object.keys(cat).map(Number).sort((x, y) => x - y), miei = propri(stato, a), freq = usciti(stato, a);
  // 10 domande: parti uguali per area, il resto alle aree a rotazione (cambia a ogni interrogazione della classe)
  const fatte = stato.alunni.filter((x) => L.classeDi(x) === L.classeDi(a) && (x.orale || x.orale_bozza) && x.id !== a.id).length;
  const ND = domandeDi(a, stato.config);
  const quota = aree.map(() => Math.floor(ND / aree.length));
  for (let i = 0, r = ND - quota.reduce((x, y) => x + y, 0); i < r; i++) quota[(fatte + i) % aree.length]++;
  const bac = bacino(stato, a);
  let termini = []; const vietati = Object.assign({}, miei, fuoriBacino(cat, bac));
  aree.forEach((ar, i) => { const s = scegliIn(cat, ar, quota[i], vietati, freq); s.forEach((t) => { vietati[chiave(t.a, t.k)] = 1; }); termini = termini.concat(s); });
  // se un'area non ha abbastanza termini non suoi, si completa con le altre
  for (let giro = true; termini.length < ND && giro;) { giro = false; for (let i = 0; i < aree.length && termini.length < ND; i++) { const s = scegliIn(cat, aree[i], 1, vietati, freq); s.forEach((t) => { vietati[chiave(t.a, t.k)] = 1; termini.push(t); giro = true; }); } }
  if (termini.length < ND) L.errore(bac ? 'Tra i termini del suo quiz non ce ne sono abbastanza per l\'interrogazione: scegli tu i termini.' : 'Non ci sono abbastanza termini per l\'interrogazione.');
  for (let x = termini.length - 1; x > 0; x--) { const y = caso(x + 1); [termini[x], termini[y]] = [termini[y], termini[x]]; }
  const bozza = { data: new Date().toISOString(), termini, cambi: 0 };
  await db.scriviAlunno(a.id, { orale_bozza: bozza });
  return { alunno: a.id, bozza: vistaBozza(cat, bozza, chiUsati(stato, a)) };
}
/* simulazione dell'interrogazione: termini pescati tra tutti quelli del glossario, niente viene salvato.
   Con termini + pos cambia solo quel termine (nella stessa area). bes = metà dei termini. */
async function oraleProva(db, { codice, bes, termini: att, pos }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const cat = catalogo(stato), aree = Object.keys(cat).map(Number).sort((x, y) => x - y), freq = {};
  if (Array.isArray(att) && pos != null) {
    const t0 = att[Number(pos)]; if (!t0 || !cat[t0.a]) L.errore('Termine non trovato.');
    const vietati = {}; att.forEach((t) => { vietati[chiave(t.a, t.k)] = 1; });
    const s = scegliIn(cat, t0.a, 1, vietati, freq); if (!s.length) L.errore('Non ci sono altri termini disponibili in quest\'area.');
    const nuovi = att.map((t, i) => (i === Number(pos) ? s[0] : { a: t.a, k: t.k }));
    return { bozza: vistaBozza(cat, { data: new Date().toISOString(), termini: nuovi, cambi: 0 }) };
  }
  const ND = domandeDi(bes ? { bes: {} } : null, stato.config), quota = aree.map(() => Math.floor(ND / aree.length));
  for (let i = 0, r = ND - quota.reduce((x, y) => x + y, 0); i < r; i++) quota[caso(aree.length)]++;
  let termini = []; const vietati = {};
  aree.forEach((ar, i) => { const s = scegliIn(cat, ar, quota[i], vietati, freq); s.forEach((t) => { vietati[chiave(t.a, t.k)] = 1; }); termini = termini.concat(s); });
  for (let x = termini.length - 1; x > 0; x--) { const y = caso(x + 1); [termini[x], termini[y]] = [termini[y], termini[x]]; }
  return { bozza: vistaBozza(cat, { data: new Date().toISOString(), termini, cambi: 0 }) };
}
async function oraleCambia(db, { codice, alunno: id, pos }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato), b = a.orale_bozza;
  if (!b || !b.termini || !b.termini[pos]) L.errore('Interrogazione non trovata: pesca di nuovo i termini.');
  const vietati = Object.assign(propri(stato, a), fuoriBacino(cat, bacino(stato, a))); b.termini.forEach((t) => { vietati[chiave(t.a, t.k)] = 1; });
  const s = scegliIn(cat, b.termini[pos].a, 1, vietati, usciti(stato, a));
  if (!s.length) L.errore('Non ci sono altri termini disponibili in quest\'area' + (bacino(stato, a) ? ' tra quelli del suo quiz' : '') + '.');
  const bozza = { data: b.data, termini: b.termini.map((t, i) => (i === Number(pos) ? s[0] : t)), cambi: (b.cambi || 0) + 1, scelti: !!b.scelti };
  await db.scriviAlunno(a.id, { orale_bozza: bozza });
  return { alunno: a.id, bozza: vistaBozza(cat, bozza, chiUsati(stato, a)) };
}
/* ---- termini scelti dal docente ----
   elenco di tutti i termini del glossario per l'alunno: i suoi dello scritto non si possono scegliere,
   per gli altri si vede chi li ha già avuti all'interrogazione */
function ammesso(stato, a) {
  if (!(a.quiz && a.quiz.superata)) {
    const rq = riepilogoQuiz(a.quiz, cfgQuiz(stato.config, L.classeDi(a), null, a));
    L.errore(a.nome + ' non è ammesso all\'interrogazione: non ha completato il quiz (' + rq.indovinati + ' termini su ' + rq.soglia + ').');
  }
}
async function oraleCatalogo(db, { codice, alunno: id }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato), miei = propri(stato, a), chi = chiUsati(stato, a);
  ammesso(stato, a);
  const aree = Object.keys(cat).map(Number).sort((x, y) => x - y);
  const bac = bacino(stato, a);
  return { domande: domandeDi(a, stato.config), bacino: bac ? Object.keys(bac).length : null, aree: aree.map((ar) => ({ area: ar, termini: cat[ar].map((x, k) => ({ k, it: x[0], suo: !!miei[chiave(ar, k)], fuori: !!(bac && !bac[chiave(ar, k)]), usati: chi[chiave(ar, k)] || [] })) })) };
}
function terminiValidi(stato, a, cat, termini, max) {
  if (!Array.isArray(termini) || !termini.length) L.errore('Scegli almeno un termine.');
  if (termini.length > max) L.errore('Al massimo ' + max + ' termini.');
  const miei = propri(stato, a), visti = {}, bac = bacino(stato, a);
  return termini.map((t) => {
    const ar = Number(t && t.a), k = Number(t && t.k);
    if (!cat[ar] || !Number.isInteger(k) || !cat[ar][k]) L.errore('Termine non trovato.');
    const c = chiave(ar, k);
    if (miei[c]) L.errore('«' + cat[ar][k][0] + '» è un termine del suo scritto: scegline un altro.');
    if (bac && !bac[c]) L.errore('«' + cat[ar][k][0] + '» non era tra i termini del suo quiz: scegline un altro.');
    if (visti[c]) L.errore('«' + cat[ar][k][0] + '» è stato scelto due volte.');
    visti[c] = 1;
    return { a: ar, k };
  });
}
/* interrogazione con i termini scelti dal docente (sostituisce quella in corso, se c'è) */
async function oraleImposta(db, { codice, alunno: id, termini }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato);
  ammesso(stato, a);
  const scelti = terminiValidi(stato, a, cat, termini, 30);
  const bozza = { data: new Date().toISOString(), termini: scelti, cambi: 0, scelti: true };
  await db.scriviAlunno(a.id, { orale_bozza: bozza });
  return { alunno: a.id, bozza: vistaBozza(cat, bozza, chiUsati(stato, a)) };
}
/* un solo termine sostituito con quello scelto dal docente */
async function oraleScegliUno(db, { codice, alunno: id, pos, termine }) {
  const stato = await db.leggiTutto(); docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato), b = a.orale_bozza;
  if (!b || !b.termini || !b.termini[pos]) L.errore('Interrogazione non trovata: riaprila.');
  const nuovi = b.termini.map((t, i) => (i === Number(pos) ? termine : t));
  const validi = terminiValidi(stato, a, cat, nuovi, 30);
  const bozza = { data: b.data, termini: validi, cambi: (b.cambi || 0) + 1, scelti: !!b.scelti };
  await db.scriviAlunno(a.id, { orale_bozza: bozza });
  return { alunno: a.id, bozza: vistaBozza(cat, bozza, chiUsati(stato, a)) };
}
async function oraleSalva(db, { codice, alunno: id, esiti, nota, votoDocente }) {
  const stato = await db.leggiTutto(), chi = docenteVoti(stato, codice);
  const a = alunno(stato, id), cat = catalogo(stato), b = a.orale_bozza;
  if (!b || !b.termini) {
    // salvataggio ripetuto (la prima volta era arrivato, ma la risposta si era persa per la rete): già fatto, nessun errore
    if (a.orale && Array.isArray(esiti) && Array.isArray(a.orale.termini) && JSON.stringify(a.orale.termini.map((t) => t.e)) === JSON.stringify(esiti.map(Number))) return { orale: a.orale, giaSalvata: true };
    L.errore('Interrogazione non trovata: pesca di nuovo i termini.');
  }
  if (!Array.isArray(esiti) || esiti.length !== b.termini.length || esiti.some((e) => [0, 0.5, 1].indexOf(e) < 0)) L.errore('Segna l\'esito di tutte le risposte prima di salvare.');
  const escluso = L.valuta(stato, a, Date.now()).escluso, punti = esiti.reduce((x, y) => x + y, 0);
  // voto: quello calcolato dalle risposte, oppure quello che assegna il docente (resta salvato anche il calcolato)
  const calc = votoOrale(punti, escluso, stato.config, b.termini.length);
  let mano = null;
  if (votoDocente !== undefined && votoDocente !== null && votoDocente !== '') {
    mano = Number(String(votoDocente).replace(',', '.'));
    if (!isFinite(mano) || mano < 1 || mano > 10 || Math.abs(Math.round(mano * 4) - mano * 4) > 1e-9) L.errore('Voto orale: da 1 a 10, a quarti di voto (es. 6,25 · 6,5 · 6,75).');
  }
  const orale = { data: new Date().toISOString(), docente: chi.nome, escluso, punti, voto: mano != null ? mano : calc, votoCalcolato: calc, manuale: mano != null, cambi: b.cambi || 0, nota: String(nota || '').replace(/\s+/g, ' ').trim().slice(0, 300),
    domande: b.termini.length, bes: !!(a.bes && a.bes.etichetta !== false), scelti: !!b.scelti,
    termini: b.termini.map((t, i) => ({ a: t.a, k: t.k, it: cat[t.a][t.k][0], e: esiti[i] })) };
  const storico = (a.orale_storico || []).concat(a.orale ? [a.orale] : []).slice(-5);
  await db.scriviAlunno(a.id, { orale, orale_bozza: null, orale_storico: storico });
  return { alunno: a.id, orale: { punti, voto: orale.voto, votoCalcolato: calc, manuale: mano != null, escluso } };
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

/* calendario delle interrogazioni: giorno (AAAA-MM-GG) e ora di lezione (1-10); vuoto = da programmare */
async function pianoOrale(db, { codice, alunno: id, data, ora }) {
  const stato = await db.leggiTutto(); L.permesso(L.identifica(stato, codice), 'voti');
  const a = alunno(stato, id);
  if (!data) { await db.scriviAlunno(a.id, { orale_piano: null }); return { alunno: a.id, piano: null }; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data)) || isNaN(Date.parse(data))) L.errore('Data dell\'interrogazione non valida.');
  let h = null;
  if (ora !== undefined && ora !== null && ora !== '') { h = Number(ora); if (!Number.isInteger(h) || h < 1 || h > 10) L.errore('Ora di lezione: da 1 a 10.'); }
  // giorno in cui è stata programmata (resta quello della prima volta): da lì si conta il ripasso sulla pagina pubblica
  const piano = { data: String(data), ora: h, fissata: (a.orale_piano && a.orale_piano.fissata) || new Date().toISOString() };
  await db.scriviAlunno(a.id, { orale_piano: piano });
  return { alunno: a.id, piano };
}

/* «Dimezza opzioni» (studenti BES): della domanda in corso restano la definizione giusta e una sbagliata a caso.
   Il tempo della domanda non riparte. */
async function quizDimezza(db, { codice, tok, prova, bes }) {
  const { a, cat, cfg } = await contestoQuiz(db, codice, prova, bes);
  const q = a.quiz;
  controllaAccesso(q, cfg);
  if (!cfg.dimezza) L.errore('«Dimezza opzioni» non è attivo per te.');
  if (q && q.sess && q.sess.tok && tok !== q.sess.tok) L.errore('Sessione chiusa: il quiz è stato aperto con il tuo codice su un altro telefono o computer. Se sei tu, premi «Inizia» per continuare qui.');
  if (!q || !q.corrente || !cat[q.corrente.a] || !q.sessioni || !q.sessioni.length) L.errore('Sessione scaduta: ricomincia il quiz.');
  const cur = q.corrente;
  if (!cur.v) cur.v = Date.now();
  if (!cur.dim && cur.o.length > 2) {
    const altri = cur.o.filter((k) => k !== cur.k), tieni = altri[caso(altri.length)];
    // le due rimaste restano nell'ordine in cui erano
    cur.o = cur.o.filter((k) => k === cur.k || k === tieni);
    cur.g = LETTERE[cur.o.indexOf(cur.k)]; cur.dim = true;
    const s = q.sessioni[q.sessioni.length - 1]; s.d = (s.d || 0) + 1;
    await salvaQuiz(db, a, q);
  }
  return { domanda: vistaDomanda(cat, cur, (q.sessioni[q.sessioni.length - 1].r || 0) + 1, cfg) };
}

/* regole personali del quiz per un alunno (per chiunque, BES o no). Ogni salvataggio sostituisce tutte le regole precedenti.
   soglia, passo: vuoto = come la classe · secondi: '' = come la classe, 0 = senza tempo, 10-600 · dimezza: pulsante «Dimezza opzioni»
   bes: etichetta di studente BES (vale per l'interrogazione: metà dei termini). Compatibile con il vecchio formato bes: { attivo, secondi, dimezza }. */
const isBES = (b) => !!b && b.etichetta !== false;
async function quizPersonale(db, { codice, alunno: id, soglia, passo, bes, secondi, dimezza }) {
  const stato = await db.leggiTutto(); L.permesso(L.identifica(stato, codice), 'studenti');
  const a = alunno(stato, id), tot = tutte(catalogo(stato)).length, base = cfgQuiz(stato.config, L.classeDi(a), tot, null);
  const vuoto = (v) => v === undefined || v === null || String(v).trim() === '';
  // vecchio formato: le misure erano dentro «bes»
  let etichetta = bes;
  if (bes && typeof bes === 'object') { etichetta = !!bes.attivo; if (secondi === undefined) secondi = bes.attivo ? bes.secondi : ''; if (dimezza === undefined) dimezza = bes.attivo ? bes.dimezza !== false : false; }
  let s = null, p = null, sec = null;
  if (!vuoto(soglia)) { s = Number(soglia); if (!Number.isInteger(s) || s < 1 || s > tot) L.errore('Termini da indovinare per ' + a.nome + ': da 1 a ' + tot + '.'); if (s === base.soglia) s = null; }
  if (!vuoto(passo)) { p = Number(passo); if (!Number.isInteger(p) || p < 0 || p > 50) L.errore('Termini persi a ogni errore per ' + a.nome + ': da 0 a 50.'); if (p === base.passo) p = null; }
  if (!vuoto(secondi)) { sec = Number(secondi); if (!Number.isInteger(sec) || (sec !== 0 && (sec < 10 || sec > 600))) L.errore('Secondi per rispondere per ' + a.nome + ': 0 (senza tempo) oppure da 10 a 600.'); if (sec === REG.di(stato.config).quiz.secondi) sec = null; }
  const dim = !!dimezza, eti = !!etichetta;
  // tutto insieme: l'ultima modifica sostituisce le precedenti
  const mod = { quiz_soglia: s, quiz_passo: p, bes: (eti || sec != null || dim) ? { secondi: sec, dimezza: dim, etichetta: eti, da: new Date().toISOString() } : null };
  // se con la nuova soglia ha già indovinato abbastanza termini, è ammesso subito
  const q = a.quiz;
  if (q && !q.superata && s != null && Object.keys(q.ok || {}).length >= s) {
    mod.quiz = Object.assign({}, q, { superata: new Date().toISOString(), msSup: (q.sessioni || []).reduce((x, y) => x + (y.ms || 0), 0) });
  }
  await db.scriviAlunno(a.id, mod);
  return { alunno: a.id, soglia: s, passo: p, bes: mod.bes, etichetta: eti, superata: !!(mod.quiz && mod.quiz.superata) };
}

module.exports = { quizVista, oraleCatalogo, oraleImposta, oraleScegliUno, quizRegole, quizProroga, quizPersonale, quizDimezza, pianoOrale, oraleProva, QUIZ, ORALE, cfgQuiz, quizInizio, quizRisposta, tabelloneQuiz, riepilogoQuiz, votoOrale, oralePesca, oraleCambia, oraleSalva, oraleAnnulla };
