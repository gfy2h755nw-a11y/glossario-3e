/* Presentazione per gli studenti (una per classe), generata dall'app con partenza, scadenza e regole prese dalle impostazioni.
   Icone e immagini sono in deck-assets.js (generato da deck2/assets.js). */
const pptxgen = require('pptxgenjs');
const OR = require('./orale');
const DATI = require('./dati');
const L = require('./logica');
const { alunnoIniziale } = L;
const A = require('./deck-assets');
const AREE = DATI.AREE.map((a) => Object.assign({}, a, { termini: DATI.TERMINI[a.n] }));
const fa = new Proxy({}, { get: (t, k) => k });
async function icon(nome, color) { return A.icone[nome + ':' + color] || A.icone[nome + ':FFFFFF']; }
const AQ = require('./deck-assets-quiz'); // schermate vere della pagina del quiz
const img = (f) => A.img[f] || AQ.img[f];
const dim = (f) => A.dim[f] || AQ.dim[f];
const NOMI = DATI.NOMI_ALUNNI, NOMI_F = DATI.NOMI_3F;
const fn = (n) => String(n).replace('.', ',');
const NT = DATI.TERMINI[1].length; // termini per area (65)
const nomeDi = (id) => id[0] === 'F' ? NOMI_F[Number(id.slice(1)) - 1] : NOMI[Number(id.slice(1)) - 1];
const cognome = (nome) => nome.split(' ')[0];
const TZ = 'Europe/Rome';
const GG = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MM = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
function parti(iso) {
  const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).forEach((x) => { p[x.type] = x.value; });
  const g = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  return { g, d: Number(p.day), m: Number(p.month) - 1, y: Number(p.year), ora: p.hour + ':' + p.minute };
}
const giorno = (iso) => { const p = parti(iso); return GG[p.g] + ' ' + p.d + ' ' + MM[p.m]; };
const conOra = (iso) => giorno(iso) + ', ore ' + parti(iso).ora;
const breve = (iso) => { const p = parti(iso); return GG[p.g].slice(0, 3) + ' ' + p.d + ' ' + MM[p.m].slice(0, 3); };
const HEX = { ink: '15212B', ink2: '2C3A47', muted: '5B6976', bg: 'EEF2F5', line: 'D3DCE3', a: ['1F5FA8', '6B4FA0', 'B4511A', '2E7D32'], teal: '0E7C7B', red: 'B0304A', ok: '2E7D32', okbg: 'E3F1E4', warn: '9A4A00', warnbg: 'FCEBD9', info: '1F5FA8', infobg: 'E2ECF7', errbg: 'F8E1E6', yel: 'FFF6D6', yelt: '7A5B00' };
const THEME = {
  name: 'Glossario 3E-3F', headFontFace: 'Arial', bodyFontFace: 'Arial',
  colors: { dk1: HEX.ink, lt1: 'FFFFFF', dk2: HEX.ink2, lt2: HEX.bg, accent1: HEX.a[0], accent2: HEX.a[1], accent3: HEX.a[2], accent4: HEX.a[3], accent5: HEX.teal, accent6: HEX.red, hlink: HEX.a[0], folHlink: HEX.a[1] }
};
/* dati della classe per le edizioni nuove (o le classi aggiunte): nomi, termini e distribuzione reali */
function contesto(classe, imp, stato) {
  const ed = L.edizioneDi(stato.config);
  const al = stato.alunni.filter((a) => L.classeDi(a) === classe).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  const ids = new Set(al.map((a) => a.id));
  const ts = stato.termini.filter((t) => ids.has(t.alunno_orig || t.alunno_id));
  const perAl = {}; al.forEach((a) => { perAl[a.id] = { 1: 0, 2: 0, 3: 0, 4: 0 }; });
  ts.forEach((t) => { const k = t.alunno_orig || t.alunno_id; if (perAl[k]) perAl[k][t.area] = (perAl[k][t.area] || 0) + 1; });
  const tpa = L.termPerAlunno(imp, classe);
  const gruppi = al.length && al.every((a) => /^[1-4]$/.test(String(a.gruppo)));
  const classi = imp.classi.map((c) => ({ nome: c, alunni: stato.alunni.filter((a) => L.classeDi(a) === c).length, termini: stato.termini.filter((t) => { const a = stato.alunni.find((x) => x.id === (t.alunno_orig || t.alunno_id)); return a && L.classeDi(a) === c; }).length }));
  const nt = Math.max.apply(null, DATI.AREE.map((a) => stato.termini.filter((t) => String(t.area) === String(a.n)).length).concat([0]));
  return { ed, al, ts, perAl, tpa, gruppi, classi, nt, auto: imp.riassegnazione !== 'manuale' };
}
async function creaDeckStudenti(classe, imp, now, stato) {
  // la presentazione originale di 3E e 3F (edizione 2026/27) resta quella; per le altre classi si usano i dati reali
  const orig = !stato || (L.edizioneDi(stato.config).id === '2026-27-1' && (classe === '3E' || classe === '3F'));
  const X = orig ? null : contesto(classe, imp, stato);
  const CL = orig ? (classe === '3F' ? '3F' : '3E') : classe, F = orig ? CL === '3F' : !X.gruppi;
  const TPA = orig ? 10 : X.tpa, AS = orig ? '2026/27' : X.ed.as;
  const CLASSI_TXT = orig ? '3E e 3F' : (X.classi.length > 1 ? X.classi.slice(0, -1).map((c) => c.nome).join(', ') + ' e ' + X.classi[X.classi.length - 1].nome : X.classi[0].nome);
  const cogn = (a) => a.nome.split(' ')[0];
  const lista = (arr) => arr.length > 1 ? arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1] : arr.join('');
  now = now || Date.now();
  const V = { votoMax: imp.votoMax, votoMaxErede: imp.votoMaxErede, votoMin: imp.votoMin };
  const VM = fn(V.votoMax), VE = fn(V.votoMaxErede), PEN = imp.proposta === 'A' ? 0.25 : 0.5;
  const PART = imp.partenza, SCAD = imp.scadenzaIt;
  // quiz (seconda parte della prova): soglia e scadenza della classe, come impostate nell'app
  const CQ = OR.cfgQuiz(stato ? stato.config : {}, classe), SOG = CQ.soglia, TOT = CQ.totale, QS = CQ.scadenza;
  const SOG_TXT = SOG === TOT ? 'tutti i ' + TOT + ' termini' : SOG + ' termini su ' + TOT;
  const PASSO = OR.QUIZ.passo, SEC = OR.QUIZ.secondi, NOPZ = OR.QUIZ.opzioni;
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };
  pres.title = 'Glossario odontotecnico – il percorso completo per la classe ' + CL;
  pres.author = 'Prof. Danilo Cerrato';
  const C = pres.SchemeColor;
  const AC = [C.accent1, C.accent2, C.accent3, C.accent4];

  pres.defineSlideMaster({
    title: 'Scura', background: { color: C.text1 },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.7, y: 2.0, w: 7.6, h: 2.2, fontSize: 46, bold: true, color: C.background1, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'body', type: 'body', x: 0.7, y: 4.35, w: 7.6, h: 1.0, fontSize: 24, italic: true, color: 'C9D6E2', valign: 'top', align: 'left', margin: 0 }, text: '' } }]
  });
  pres.defineSlideMaster({
    title: 'Contenuto', background: { color: C.background1 },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.4, w: 12.1, h: 0.8, fontSize: 34, bold: true, color: C.text1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
      { text: { text: 'Glossario odontotecnico · Classe ' + CL + ' · Istituto Barsanti - sede Salvetti', options: { x: 0.6, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: HEX.muted, margin: 0 } } }
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HEX.muted, align: 'right' }
  });
  const T = (s, t, o) => s.addText(t, Object.assign({ isTextBox: true, margin: 0, fontSize: 16, color: C.text2, valign: 'top' }, o));
  const card = (s, x, y, w, h, fill, name) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill || C.background2 }, line: { color: fill || C.background2 }, rectRadius: 0.12, objectName: name });
  const bullets = (arr) => arr.map((t, k) => (typeof t === 'string' ? { text: t, options: { bullet: true, breakLine: k < arr.length - 1 } } : Object.assign({}, t, { options: Object.assign({ bullet: true, breakLine: k < arr.length - 1 }, t.options) })));
  // screenshot del telefono, dentro una cornice
  const phone = (s, f, x, y, h, alt) => {
    const d = dim(f), w = h * d.w / d.h;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.12, y: y - 0.12, w: w + 0.24, h: h + 0.24, fill: { color: C.background2 }, line: { color: HEX.line, width: 1 }, rectRadius: 0.15, objectName: 'Cornice ' + alt });
    s.addImage({ data: img(f), x, y, w, h, altText: alt });
    return w;
  };
  // elenco di passi numerati: titolo in grassetto e spiegazione sotto
  const passiN = (s, arr, x, y0, w, dy, rosso) => arr.forEach((a, i) => {
    const y = y0 + i * dy, r = rosso && rosso.indexOf(i) >= 0;
    num(s, i + 1, x, y, r ? HEX.red : null);
    T(s, a[0], { x: x + 0.8, y: y - 0.02, w, h: 0.4, fontSize: 19, bold: true, color: r ? C.accent6 : C.text1 });
    T(s, a[1], { x: x + 0.8, y: y + 0.4, w, h: dy - 0.45, fontSize: 15 });
  });
  const num = (s, n, x, y, col) => { s.addShape(pres.shapes.OVAL, { x, y, w: 0.55, h: 0.55, fill: { color: col || C.text1 }, line: { color: col || C.text1 }, objectName: 'Numero ' + n }); T(s, String(n), { x, y, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: C.background1, align: 'center', valign: 'middle' }); };

  /* 1 · Copertina */
  pres.addSection({ title: 'Il progetto' });
  let s = pres.addSlide({ masterName: 'Scura', sectionTitle: 'Il progetto' });
  s.addText('Glossario odontotecnico', { placeholder: 'title' });
  s.addText('Il percorso completo · classe ' + CL, { placeholder: 'body' });
  T(s, 'ISTITUTO BARSANTI - SEDE SALVETTI · CLASSE ' + CL + ' · A.S. ' + AS, { x: 0.7, y: 1.1, w: 7.8, h: 0.4, fontSize: 12, bold: true, color: '9FB3C6', charSpacing: 1.5 });
  T(s, [{ text: 'Laboratorio odontotecnico · Prof. Danilo Cerrato' }],
    { x: 0.7, y: 5.75, w: 7.6, h: 0.8, fontSize: 15, color: 'C9D6E2', paraSpaceAfter: 4 });
  [1, 2, 3, 4].forEach((n, i) => s.addImage({ data: img('poster' + n + '.jpg'), x: 8.7 + (i % 2) * 2.15, y: 0.6 + Math.floor(i / 2) * 3.15, w: 2.0, h: 2.857, altText: 'Cartellone ' + n }));
  s.addNotes('Il percorso completo del glossario: lo scritto, il quiz, l\'interrogazione, il voto finale e i cartelloni. Per ogni tappa: cosa fare, come si usa l\'app dal telefono, le scadenze e le regole.');

  /* 2 · Perché */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText('Perché lo facciamo', { placeholder: 'title' });
  const why = [[fa.FaCommentDots, 'Parlare da odontotecnici', 'Il lessico preciso fa parte del mestiere: con il dentista, in laboratorio, all\'esame.', 0],
    [fa.FaPrint, 'Un lavoro che resta', 'I cartelloni restano appesi in laboratorio: un riferimento per voi e per le classi che verranno.', 1],
    [fa.FaUsers, 'Lavorare con una scadenza vera', 'Come in un laboratorio: ognuno ha il suo compito, il risultato è di tutti e va consegnato in tempo.', 3]];
  for (let i = 0; i < why.length; i++) {
    const y = 1.65 + i * 1.7;
    s.addShape(pres.shapes.OVAL, { x: 0.8, y, w: 1.1, h: 1.1, fill: { color: AC[why[i][3]] }, line: { color: AC[why[i][3]] }, objectName: 'Cerchio ' + (i + 1) });
    s.addImage({ data: await icon(why[i][0], 'FFFFFF'), x: 1.08, y: y + 0.28, w: 0.54, h: 0.54, altText: why[i][1] });
    T(s, why[i][1], { x: 2.3, y: y + 0.02, w: 10, h: 0.45, fontSize: 22, bold: true, color: C.text1 });
    T(s, why[i][2], { x: 2.3, y: y + 0.52, w: 10, h: 0.6, fontSize: 17 });
  }


  /* 3 · Il percorso in quattro tappe */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText('Il percorso in quattro tappe', { placeholder: 'title' });
  const tappe4 = [[fa.FaHandPointer, '1 · Lo scritto', 'Ognuno risponde ai suoi ' + TPA + ' termini scegliendo la definizione giusta. Dà il voto dello scritto, che fa media con l\'orale.', HEX.a[0]],
    [fa.FaCheckDouble, '2 · Il quiz', 'Dal telefono, su ' + (SOG === TOT ? 'tutti i ' + TOT + ' termini' : SOG + ' termini') + ' della classe. Non dà voto: serve per essere ammessi.', HEX.a[1]],
    [fa.FaComments, '3 · L\'interrogazione', 'Solo per chi ha superato il quiz: 10 termini, a voce, in laboratorio. Dà il voto orale.', HEX.a[2]],
    [fa.FaStar, '4 · Voto finale', 'Media tra scritto e orale. Poi le definizioni approvate vanno sui cartelloni.', HEX.a[3]]];
  for (let i = 0; i < tappe4.length; i++) {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.5, 2.85, 3.6, null, 'Tappa ' + (i + 1));
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 2.85, h: 0.12, fill: { color: tappe4[i][3] }, line: { color: tappe4[i][3] }, objectName: 'Fascia tappa ' + (i + 1) });
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 1.85, w: 0.9, h: 0.9, fill: { color: tappe4[i][3] }, line: { color: tappe4[i][3] }, objectName: 'Icona tappa ' + (i + 1) });
    s.addImage({ data: await icon(tappe4[i][0], 'FFFFFF'), x: x + 0.53, y: 2.08, w: 0.44, h: 0.44, altText: tappe4[i][1] });
    T(s, tappe4[i][1], { x: x + 0.3, y: 2.95, w: 2.45, h: 0.5, fontSize: 18, bold: true, color: C.text1 });
    T(s, tappe4[i][2], { x: x + 0.3, y: 3.5, w: 2.35, h: 1.5, fontSize: 14 });
    if (i < 3) s.addShape(pres.shapes.LINE, { x: x + 2.88, y: 3.3, w: 0.2, h: 0, line: { color: HEX.line, width: 2.5, endArrowType: 'triangle' }, objectName: 'Freccia tappa ' + (i + 1) });
  }
  card(s, 0.6, 5.4, 12.1, 1.25, HEX.errbg, 'Regola chiave');
  T(s, [{ text: 'La regola più importante: ', options: { bold: true, color: C.accent6 } },
    { text: 'il quiz è la porta dell\'interrogazione. Chi non lo supera entro la scadenza non viene interrogato e resta senza voto.' }],
    { x: 0.9, y: 5.4, w: 11.5, h: 1.25, fontSize: 18, valign: 'middle', color: C.text1 });
  s.addNotes('Quattro tappe in ordine. Lo scritto dà il primo voto, il quiz non dà voto ma decide chi può fare l\'interrogazione, l\'interrogazione dà il secondo voto, il voto finale è la media dei due.');

  /* 4 · Il calendario */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText('Il calendario', { placeholder: 'title' });
  const cal = [[PART ? breve(PART) : '—', 'Si apre lo scritto', PART ? conOra(PART) : 'la partenza la fissa il prof. nell\'app', HEX.ink],
    [breve(SCAD), 'Scadenza dello scritto', conOra(SCAD) + ': risposta a tutti e ' + TPA + ' i termini', HEX.a[0]],
    [QS ? breve(QS) : 'Da fissare', 'Scadenza del quiz', QS ? conOra(QS) + ': quiz superato, altrimenti niente interrogazione' : 'la data la comunica il prof. dopo lo scritto, e la trovi anche nella pagina del quiz', HEX.red],
    ['Dopo', 'Interrogazioni', 'in laboratorio, solo per chi ha superato il quiz', HEX.a[2]],
    ['Infine', 'Voto finale e cartelloni', 'media tra scritto e orale; le definizioni approvate vanno in stampa', HEX.a[3]]];
  const passoC = 10.74 / (cal.length - 1);
  s.addShape(pres.shapes.LINE, { x: 1.3, y: 3.15, w: 10.74, h: 0, line: { color: HEX.line, width: 4 }, objectName: 'Linea del tempo' });
  cal.forEach((t, i) => {
    const cx = 1.3 + i * passoC, forte = i === 1 || i === 2, r = forte ? 0.32 : 0.22;
    s.addShape(pres.shapes.OVAL, { x: cx - r, y: 3.15 - r, w: 2 * r, h: 2 * r, fill: { color: t[3] }, line: { color: 'FFFFFF', width: 3 }, objectName: 'Data ' + (i + 1) });
    T(s, t[0], { x: cx - 1.1, y: 2.05, w: 2.2, h: 0.6, fontSize: forte ? 20 : 17, bold: true, color: t[3], align: 'center', valign: 'middle' });
    T(s, t[1], { x: cx - 1.1, y: 3.65, w: 2.2, h: 0.75, fontSize: 15, bold: true, color: C.text1, align: 'center' });
    T(s, t[2], { x: cx - 1.1, y: 4.4, w: 2.2, h: 1.3, fontSize: 12, align: 'center' });
  });
  card(s, 0.6, 5.85, 12.1, 0.8, null, 'Nota calendario');
  T(s, [{ text: 'Le date ufficiali sono quelle nell\'app: ', options: { bold: true, color: C.text1 } }, { text: 'il conto alla rovescia dello scritto e la scadenza scritta nella pagina del quiz sono sempre aggiornati.' }],
    { x: 0.9, y: 5.85, w: 11.5, h: 0.8, fontSize: 15, valign: 'middle' });

  /* TAPPA 1 · LO SCRITTO */
  pres.addSection({ title: 'Tappa 1 · Lo scritto' });
  /* 5 · Il compito */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Tappa 1 · Lo scritto in breve', { placeholder: 'title' })
  T(s, [
    { text: orig ? 'La 3E e la 3F costruiscono insieme un glossario tecnico di odontotecnica.' : (X.classi.length > 1 ? 'Le classi ' + CLASSI_TXT + ' costruiscono insieme un glossario tecnico di odontotecnica.' : 'La ' + CL + ' costruisce un glossario tecnico di odontotecnica.'), options: { bold: true, color: C.text1, breakLine: true } },
    { text: F ? 'Ognuno di voi ha ' + TPA + ' termini, presi da tutte e quattro le aree.' : 'Ognuno di voi ha ' + TPA + ' termini della sua area.', options: { bullet: true, breakLine: true } },
    { text: 'Per ogni termine sceglie la definizione giusta tra 8 alternative.', options: { bullet: true, breakLine: true } },
    { text: 'Il prof. Cerrato controlla ogni scelta e la approva.', options: { bullet: true, breakLine: true } },
    { text: 'Le definizioni approvate finiscono su 4 cartelloni 70×100 stampati e appesi in laboratorio' + (orig ? ', con i nomi di tutte e due le classi.' : ', con i vostri nomi.'), options: { bullet: true } }
  ], { x: 0.6, y: 1.6, w: 5.8, h: 4.8, fontSize: 18, paraSpaceAfter: 10 });
  [[String(TPA), 'termini a testa'], ['8', 'alternative per ogni scelta'], [String(orig ? NT : X.nt), 'termini per area'], ['4', 'cartelloni 70×100']].forEach((st, i) => {
    const x = 6.9 + (i % 2) * 2.95, y = 1.6 + Math.floor(i / 2) * 2.45;
    card(s, x, y, 2.75, 2.25, null, 'Dato ' + (i + 1));
    T(s, st[0], { x: x + 0.3, y: y + 0.25, w: 2.2, h: 1.1, fontSize: 64, bold: true, color: AC[i], valign: 'middle' });
    T(s, st[1], { x: x + 0.3, y: y + 1.4, w: 2.2, h: 0.7, fontSize: 16, color: C.text1 });
  });


  if (!orig) {
  /* 2b · Novità */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText(orig ? 'Due classi, un solo glossario' : (X.classi.length > 1 ? 'Le classi di questa edizione' : 'La classe ' + CL), { placeholder: 'title' });
  const nov = !orig ? [[fa.FaUsers, CL + ': ' + X.al.length + ' alunni, ' + X.ts.length + ' termini', F ? 'Ognuno ha termini di tutte e quattro le aree.' : 'Quattro gruppi, uno per area.', HEX.a[0]],
    [fa.FaUserFriends, X.classi.length > 1 ? 'Insieme a ' + lista(X.classi.filter((c) => c.nome !== CL).map((c) => c.nome)) : X.ed.nome, X.classi.length > 1 ? 'Le definizioni di tutte le classi finiscono sugli stessi cartelloni.' : 'Edizione ' + X.ed.as + ' del glossario del laboratorio.', HEX.a[1]],
    [fa.FaFlagCheckered, 'La partenza', (PART ? 'Si parte ' + conOra(PART) + ': fino a quel momento nell\'app vedi il conto alla rovescia.' : 'La partenza la fissa il prof. nell\'app: fino a quel momento vedi il conto alla rovescia.'), HEX.a[2]],
    [fa.FaCalendarAlt, 'La scadenza', conOra(SCAD) + ', per tutti e ' + TPA + ' i tuoi termini.', HEX.a[3]]] : [[fa.FaUsers, '3E: 16 alunni, 160 termini', 'Quattro gruppi, uno per area: i termini da 1 a 40 di ogni cartellone.', HEX.a[0]],
    [fa.FaUserFriends, '3F: 10 alunni, 100 termini', 'Ognuno ha termini di tutte e quattro le aree: i termini da 41 a 65 di ogni cartellone.', HEX.a[1]],
    [fa.FaFlagCheckered, 'Si parte insieme', (PART ? 'Si parte ' + conOra(PART) + ': fino a quel momento nell\'app vedi il conto alla rovescia.' : 'La partenza la fissa il prof. nell\'app: fino a quel momento vedi il conto alla rovescia.'), HEX.a[2]],
    [fa.FaCalendarAlt, 'Una sola scadenza', 'Uguale per le due classi: ' + conOra(SCAD) + ', per tutti e 10 i termini.', HEX.a[3]]];
  for (let i = 0; i < nov.length; i++) {
    const x = 0.6 + (i % 2) * 6.2, y = 1.55 + Math.floor(i / 2) * 2.55;
    card(s, x, y, 5.9, 2.3, null, 'Novità ' + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: y + 0.35, w: 1.0, h: 1.0, fill: { color: nov[i][3] }, line: { color: nov[i][3] }, objectName: 'Icona novità ' + (i + 1) });
    s.addImage({ data: await icon(nov[i][0], 'FFFFFF'), x: x + 0.6, y: y + 0.6, w: 0.5, h: 0.5, altText: nov[i][1] });
    T(s, nov[i][1], { x: x + 1.65, y: y + 0.35, w: 4.0, h: 0.5, fontSize: 22, bold: true, color: C.text1 });
    T(s, nov[i][2], { x: x + 1.65, y: y + 0.95, w: 4.0, h: 1.2, fontSize: 16 });
  }
  s.addNotes(orig ? 'Il glossario è unico: 65 termini per area, 40 della 3E e 25 della 3F. Stesse regole, stessa partenza e stessa scadenza per le due classi.' : 'Classe ' + CL + ': ' + X.al.length + ' alunni, ' + TPA + ' termini a testa.');

  /* 4 · Aree e distribuzione (dati reali della classe) */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText(F ? 'Quattro aree, ' + TPA + ' termini a testa' : 'Quattro aree, quattro gruppi', { placeholder: 'title' });
  AREE.forEach((a, i) => {
    const x = 0.6 + i * 3.1, w = 2.85, n = X.ts.filter((t) => String(t.area) === String(a.n)).length;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.45, w, h: 1.15, fill: { color: AC[i] }, line: { color: AC[i] }, rectRadius: 0.12, objectName: 'Testata area ' + a.n });
    T(s, '0' + a.n, { x: x + 0.2, y: 1.52, w: 0.9, h: 0.6, fontSize: 28, bold: true, color: C.background1 });
    T(s, a.it, { x: x + 1.0, y: 1.52, w: w - 1.15, h: 0.6, fontSize: 13, bold: true, color: C.background1, valign: 'middle' });
    T(s, n + ' termini della ' + CL, { x: x + 0.2, y: 2.13, w: w - 0.35, h: 0.35, fontSize: 12, color: C.background1 });
  });
  const righe = X.al.slice(0, 22);
  const hdG = ['Alunno'].concat(AREE.map((a) => 'Area ' + a.n), ['Totale']).map((t, k) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: k && k < 5 ? HEX.a[k - 1] : HEX.ink }, align: k ? 'center' : 'left' } }));
  const altezza = Math.min(0.34, 3.9 / (righe.length + 1));
  s.addTable([hdG].concat(righe.map((a, r) => [{ text: a.nome, options: { bold: true, color: HEX.ink } }].concat(AREE.map((ar) => ({ text: String(X.perAl[a.id][ar.n] || 0), options: { align: 'center', color: HEX.ink } })), [{ text: String(AREE.reduce((z, ar) => z + (X.perAl[a.id][ar.n] || 0), 0)), options: { align: 'center', bold: true, color: HEX.ink } }])
    .map((c) => Object.assign(c, { options: Object.assign({ fill: { color: r % 2 ? 'FFFFFF' : HEX.bg } }, c.options) })))),
    { x: 0.6, y: 2.85, w: 12.1, colW: [4.1, 1.6, 1.6, 1.6, 1.6, 1.6], rowH: altezza, fontSize: righe.length > 14 ? 10 : 13, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.02, 0.1, 0.02, 0.1] });
  if (X.al.length > righe.length) T(s, 'Elenco completo nelle slide dei termini.', { x: 0.6, y: 6.75, w: 12, h: 0.25, fontSize: 11, italic: true, color: HEX.muted });
  s.addNotes('Distribuzione dei termini della ' + CL + ' tra le quattro aree. I nomi dei termini sono nelle prossime slide.');

  /* 5-8 · Termini della classe, area per area */
  pres.addSection({ title: 'I termini' });
  AREE.forEach((a, i) => {
    const lista = X.ts.filter((t) => String(t.area) === String(a.n)).sort((x, y) => Number(String(x.id).slice(2)) - Number(String(y.id).slice(2)));
    if (!lista.length) return;
    const nomeDiId = (id) => { const al = stato.alunni.find((x) => x.id === id); return al ? cogn(al) : ''; };
    for (let p = 0; p < lista.length; p += 26) {
      const pag = lista.slice(p, p + 26);
      s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'I termini' });
      s.addText('Area ' + a.n + ' · ' + a.it + (lista.length > 26 ? ' (' + (p / 26 + 1) + ')' : ''), { placeholder: 'title' });
      T(s, 'I termini della ' + CL + ' in quest\'area e a chi sono assegnati', { x: 0.6, y: 1.15, w: 12, h: 0.35, fontSize: 15, italic: true, color: AC[i] });
      [pag.slice(0, 13), pag.slice(13)].forEach((col, ci) => {
        if (!col.length) return;
        const rows = [['Termine', 'Alunno'].map((t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: HEX.a[i] } } }))];
        col.forEach((t, k) => { const fill = { color: k % 2 ? 'FFFFFF' : HEX.bg }; rows.push([{ text: t.termine_it, options: { fill, bold: true, color: HEX.ink } }, { text: nomeDiId(t.alunno_orig || t.alunno_id), options: { fill, color: HEX.ink } }]); });
        s.addTable(rows, { x: 0.6 + ci * 6.2, y: 1.65, w: 5.9, colW: [4.0, 1.9], rowH: 0.355, fontSize: 12, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.02, 0.06, 0.02, 0.06] });
      });
    }
  });
  }

  /* 9 · Il percorso */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Il percorso di ogni termine', { placeholder: 'title' });
  const passi = [[fa.FaHandPointer, 'Scegli', 'la definizione giusta tra 8 alternative', HEX.a[0]],
    [fa.FaUserCheck, 'Prof. Cerrato', 'approva, oppure te la rimanda con un commento', HEX.a[0]],
    [fa.FaRedo, 'Correggi', 'se è stata rimandata, scegline un\'altra', HEX.a[2]],
    [fa.FaPrint, 'Cartellone', 'le definizioni approvate vanno in stampa', HEX.a[3]]];
  for (let i = 0; i < passi.length; i++) {
    const x = 0.8 + i * 3.1;
    s.addShape(pres.shapes.OVAL, { x: x + 0.75, y: 1.8, w: 1.2, h: 1.2, fill: { color: passi[i][3] }, line: { color: passi[i][3] }, objectName: 'Passo ' + (i + 1) });
    s.addImage({ data: await icon(passi[i][0], 'FFFFFF'), x: x + 1.05, y: 2.1, w: 0.6, h: 0.6, altText: passi[i][1] });
    if (i < passi.length - 1) s.addShape(pres.shapes.LINE, { x: x + 2.1, y: 2.4, w: 1.5, h: 0, line: { color: HEX.line, width: 2.5, endArrowType: 'triangle' }, objectName: 'Freccia ' + (i + 1) });
    T(s, (i + 1) + '. ' + passi[i][1], { x: x, y: 3.2, w: 2.7, h: 0.45, fontSize: 18, bold: true, color: C.text1, align: 'center' });
    T(s, passi[i][2], { x: x + 0.1, y: 3.7, w: 2.5, h: 1.0, fontSize: 14, align: 'center' });
  }
  card(s, 0.6, 5.0, 12.1, 1.6, null, 'Nota percorso');
  T(s, [{ text: 'Rispondete presto. ', options: { bold: true, color: C.text1 } },
    { text: 'Se il prof. vi rimanda una risposta, avrete il tempo di correggerla prima della scadenza.' }], { x: 0.9, y: 5.0, w: 11.5, h: 1.6, fontSize: 17, valign: 'middle' });

  /* 10 · Entrare */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Entrare nell\'app', { placeholder: 'title' });
  phone(s, 'login_c.jpg', 1.0, 1.5, 5.2, 'Schermata di accesso dell\'app');
  [['Inquadra il QR o apri il link', 'Sono sulla scheda personale che ti consegna il prof. Funziona da telefono e da computer, anche da casa.'],
    ['Con il QR entri subito', 'Altrimenti scrivi il codice personale di 6 caratteri che trovi sulla scheda. Maiuscole o minuscole non contano.'],
    ['Tienilo segreto', 'Chi conosce il tuo codice può rispondere al posto tuo, e gli errori li paghi tu. Se lo perdi, chiedilo al prof.'],
    ['Resti collegato', 'Al ritorno l\'app ti riconosce. Dal computer di scuola o di altri, premi sempre “Esci”.']].forEach((a, i) => {
    const y = 1.55 + i * 1.25;
    num(s, i + 1, 5.2, y); T(s, a[0], { x: 6.0, y: y - 0.02, w: 6.7, h: 0.4, fontSize: 19, bold: true, color: C.text1 }); T(s, a[1], { x: 6.0, y: y + 0.4, w: 6.7, h: 0.75, fontSize: 15 });
  });

  /* 11 · Scegliere */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Scegliere la definizione', { placeholder: 'title' });
  phone(s, 'card_c.jpg', 1.0, 1.5, 5.2, 'Un termine con le 8 definizioni tra cui scegliere');
  [['Leggi tutte e 8 le alternative', 'Sono tutte definizioni vere di termini della tua area: una sola è quella del tuo termine.'],
    ['Tocca quella giusta', 'Si colora di blu. Puoi cambiare idea finché non confermi.'],
    ['Premi “Conferma la scelta”', 'La scelta arriva al docente e lo stato diventa “Inviata”.'],
    ['Pensaci prima di confermare', 'Ogni invio sbagliato è un errore e abbassa il voto, anche se poi lo cambi. Usa il libro e gli appunti.']].forEach((a, i) => {
    const y = 1.55 + i * 1.25;
    num(s, i + 1, 5.2, y, i === 3 ? HEX.red : null); T(s, a[0], { x: 6.0, y: y - 0.02, w: 6.7, h: 0.4, fontSize: 19, bold: true, color: i === 3 ? C.accent6 : C.text1 }); T(s, a[1], { x: 6.0, y: y + 0.4, w: 6.7, h: 0.75, fontSize: 15 });
  });

  /* 12 · Stati e correzioni */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Se il docente ti rimanda la risposta', { placeholder: 'title' });
  phone(s, 'card_rimandata_c.jpg', 1.0, 1.5, 5.2, 'Termine rimandato dal docente, con l\'opzione sbagliata barrata');
  T(s, 'Ogni definizione ha uno stato', { x: 5.2, y: 1.5, w: 7.5, h: 0.4, fontSize: 19, bold: true, color: C.text1 });
  [['Da scegliere', HEX.bg, HEX.muted, 'non hai ancora risposto'], ['Inviata', HEX.infobg, HEX.info, 'in attesa del docente: puoi ancora cambiarla'],
    ['Da rivedere', HEX.warnbg, HEX.warn, 'era sbagliata: leggi il commento e scegline un\'altra'], ['Approvata', HEX.okbg, HEX.ok, 'giusta e definitiva: va sul cartellone']].forEach((st, i) => {
    const y = 2.05 + i * 0.62;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y, w: 1.85, h: 0.45, fill: { color: st[1] }, line: { color: st[1] }, rectRadius: 0.2, objectName: 'Stato ' + st[0] });
    T(s, st[0], { x: 5.2, y, w: 1.85, h: 0.45, fontSize: 14, bold: true, color: st[2], align: 'center', valign: 'middle' });
    T(s, st[3], { x: 7.25, y, w: 5.4, h: 0.45, fontSize: 15, valign: 'middle' });
  });
  card(s, 5.2, 4.7, 7.5, 1.9, HEX.warnbg, 'Nota correzioni');
  T(s, [{ text: 'Quando una risposta torna “Da rivedere”', options: { bold: true, color: C.text1, breakLine: true } },
    { text: 'l\'opzione sbagliata resta barrata e non si può più scegliere. Leggi il commento, scegli di nuovo e conferma. Correggere è sempre possibile, ma l\'errore resta contato nel voto.' }],
    { x: 5.45, y: 4.85, w: 7.0, h: 1.65, fontSize: 15, paraSpaceAfter: 4 });

  /* 14 · Scadenze */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Partenza e scadenza', { placeholder: 'title' });
  // riquadro dell'app prima della partenza, disegnato con la data vera
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.88, y: 1.58, w: 5.19, h: 4.84, fill: { color: C.background2 }, line: { color: HEX.line, width: 1 }, rectRadius: 0.15, objectName: 'Cornice attesa' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.0, y: 1.7, w: 4.95, h: 4.6, fill: { color: 'FFFFFF' }, line: { color: HEX.line, width: 0.75 }, rectRadius: 0.12, objectName: 'Schermata attesa' });
  T(s, 'GLOSSARIO ODONTOTECNICO', { x: 1.3, y: 1.95, w: 4.4, h: 0.3, fontSize: 11, bold: true, color: HEX.muted, charSpacing: 2 });
  T(s, 'Il compito non è ancora partito', { x: 1.3, y: 2.3, w: 4.4, h: 0.9, fontSize: 22, bold: true, color: C.text1 });
  T(s, PART ? [{ text: 'Si parte ' }, { text: conOra(PART).replace(', ore', ' alle'), options: { bold: true } }, { text: '. Da quel momento qui trovi i tuoi ' }, { text: TPA + ' termini', options: { bold: true } }, { text: '.' }]
    : 'Il prof. non ha ancora fissato la partenza.', { x: 1.3, y: 3.25, w: 4.4, h: 0.8, fontSize: 14 });
  ['giorni', 'ore', 'min', 'sec'].forEach((u, k) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.3 + k * 1.05, y: 4.15, w: 0.9, h: 0.85, fill: { color: HEX.bg }, line: { color: HEX.bg }, rectRadius: 0.08, objectName: 'Conto ' + u });
    T(s, ['2', '04', '15', '11'][k], { x: 1.3 + k * 1.05, y: 4.2, w: 0.9, h: 0.45, fontSize: 20, bold: true, color: C.text1, align: 'center', valign: 'middle' });
    T(s, u, { x: 1.3 + k * 1.05, y: 4.65, w: 0.9, h: 0.3, fontSize: 10, color: HEX.muted, align: 'center' });
  });
  T(s, 'Scadenza per rispondere a tutti i termini: ' + conOra(SCAD).replace(', ore', ' alle') + '.', { x: 1.3, y: 5.25, w: 4.4, h: 0.8, fontSize: 13, color: HEX.muted });
  [[HEX.a[2], 'Partenza', PART ? conOra(PART) : 'la fissa il prof. nell\'app', (orig ? 'uguale per 3E e 3F' : 'della ' + CL) + ': prima vedi solo il conto alla rovescia, poi compaiono i tuoi ' + TPA + ' termini'],
    [HEX.a[0], 'Scadenza', conOra(SCAD), 'entro questa ora devi aver risposto a tutti e ' + TPA + ' i tuoi termini']].forEach((d, i) => {
    const y = 1.55 + i * 1.75;
    card(s, 6.7, y, 6.0, 1.55, null, 'Scadenza ' + d[1]);
    T(s, d[1].toUpperCase(), { x: 7.0, y: y + 0.15, w: 5.5, h: 0.3, fontSize: 13, bold: true, color: d[0], charSpacing: 2 });
    T(s, d[2], { x: 7.0, y: y + 0.45, w: 5.5, h: 0.45, fontSize: 22, bold: true, color: C.text1 });
    T(s, d[3], { x: 7.0, y: y + 0.95, w: 5.5, h: 0.5, fontSize: 14 });
  });
  T(s, [{ text: 'Conta aver risposto, non essere già approvati. ', options: { bold: true, color: C.text1 } }, { text: 'Il conto alla rovescia nell\'app è sempre aggiornato: le date ufficiali sono quelle che vedi lì.' }],
    { x: 6.7, y: 5.15, w: 6.0, h: 1.2, fontSize: 15 });

  /* 15 · Esclusione */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Chi non consegna lo scritto in tempo', { placeholder: 'title' });
  card(s, 0.6, 1.5, 6.2, 5.1, HEX.errbg, 'Regola esclusione');
  s.addImage({ data: await icon(fa.FaExclamationTriangle, HEX.red), x: 0.95, y: 1.8, w: 0.6, h: 0.6, altText: 'Attenzione' });
  T(s, 'Esclusione automatica', { x: 1.75, y: 1.8, w: 4.9, h: 0.6, fontSize: 24, bold: true, color: C.accent6, valign: 'middle' });
  T(s, bullets([
    'Se alla scadenza hai anche un solo termine senza risposta, sei escluso subito.',
    'Prendi 4 nello scritto per mancata consegna e non puoi più rispondere: a ogni accesso vedi solo il messaggio qui a destra.',
    'Puoi ancora fare il quiz e l\'interrogazione, ma il voto finale arriva al massimo a 5,5.',
    'Non c\'entra se le risposte sono già state approvate o no: conta solo avere risposto.'
  ]), { x: 0.95, y: 2.6, w: 5.6, h: 3.9, fontSize: 16, color: C.text1, paraSpaceAfter: 8 });
  // messaggio di esclusione disegnato con il testo vero dell'app
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.15, y: 2.1, w: 5.6, h: 4.0, fill: { color: C.background2 }, line: { color: HEX.line, width: 1 }, rectRadius: 0.15, objectName: 'Cornice esclusione' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.35, y: 2.3, w: 5.2, h: 3.6, fill: { color: HEX.errbg }, line: { color: HEX.red, width: 2.5 }, rectRadius: 0.12, objectName: 'Messaggio esclusione' });
  T(s, L.messaggioEsclusione(), { x: 7.6, y: 2.5, w: 4.7, h: 2.6, fontSize: 17, bold: true, color: C.accent6, valign: 'middle' });
  T(s, 'Per chiarimenti parla con il prof. Cerrato.', { x: 7.6, y: 5.2, w: 4.7, h: 0.5, fontSize: 14, color: C.accent6 });
  T(s, 'Quello che vedresti entrando nell\'app', { x: 7.15, y: 1.55, w: 5.6, h: 0.4, fontSize: 14, italic: true, color: HEX.muted });

  /* 15b · Riassegnazione */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Se un compagno viene escluso', { placeholder: 'title' });
  const AUTO = imp.riassegnazione !== 'manuale';
  const ria = [[fa.FaRandom, 'I suoi termini passano a un altro', AUTO ? 'L\'app li assegna da sola, a sorte, a un compagno non escluso della stessa classe.' : 'Decide il prof. Cerrato a chi passarli, tra i compagni non esclusi.'],
    [fa.FaUserPlus, AUTO ? 'Uno solo a testa' : 'Scelta del docente', AUTO ? 'Nessuno riceve i termini di più di un compagno.' : 'Il prof. può dividerli tra più compagni o lasciarli fermi.'],
    [fa.FaHourglassHalf, 'Nuove scadenze per quei termini', (AUTO ? imp.giorniIt + ' giorni da quando li ricevi' : 'La scadenza la fissa il prof. quando te li passa') + '. In ritardo: niente esclusione, ma voto dello scritto massimo 6.'],
    [fa.FaStar, 'Voto massimo ' + VE, 'Chi riceve i termini di un altro può arrivare a ' + VE + ' invece che a ' + VM + ', con le stesse penalità.'],
    [fa.FaIdBadge, 'Il tuo nome sul cartellone', 'Sui termini ricevuti compare chi li ha davvero completati, al posto dell\'escluso.']];
  for (let i = 0; i < ria.length; i++) {
    const y = 1.5 + i * 1.02, colr = i === 3 ? HEX.a[3] : HEX.a[i % 2];
    s.addShape(pres.shapes.OVAL, { x: 0.8, y, w: 0.8, h: 0.8, fill: { color: colr }, line: { color: colr }, objectName: 'Icona ria ' + (i + 1) });
    s.addImage({ data: await icon(ria[i][0], 'FFFFFF'), x: 1.0, y: y + 0.2, w: 0.4, h: 0.4, altText: ria[i][1] });
    T(s, ria[i][1], { x: 1.9, y: y - 0.02, w: 6.3, h: 0.4, fontSize: 18, bold: true, color: C.text1 });
    T(s, ria[i][2], { x: 1.9, y: y + 0.38, w: 6.3, h: 0.55, fontSize: 14 });
  }
  card(s, 8.6, 1.5, 4.1, 4.95, HEX.infobg, 'Esempio riassegnazione');
  T(s, [{ text: 'Esempio', options: { bold: true, color: C.text1, breakLine: true } },
    ...(orig ? [
    { text: F ? 'Taddei (3F) non risponde in tempo: è esclusa e prende 4 nello scritto.' : 'Tonlorenzi (3E, area 4) non risponde in tempo: è escluso e prende 4 nello scritto.', options: { breakLine: true } },
    { text: F ? 'L\'app sorteggia Balleri, sempre della 3F: ora ha 20 termini.' : 'L\'app sorteggia Bertelà, sempre della 3E: ora ha 20 termini, 10 di anatomia e 10 di laboratorio.', options: { breakLine: true } },
    { text: (F ? 'Balleri può arrivare a ' + VE + ' e il suo nome va sui cartelloni al posto di Taddei.' : 'Bertelà può arrivare a ' + VE + ' e il suo nome va sul cartellone 4 al posto di Tonlorenzi.'), options: { breakLine: true } },
    { text: 'Se però ' + (F ? 'Balleri' : 'Bertelà') + ' non risponde in tempo ai termini ricevuti, non è escluso: il voto dello scritto scende a 6 (se era 6 o più; se era sotto 6 resta quello).' }] : (() => {
      const e1 = X.al.length > 1 ? cogn(X.al[X.al.length - 1]) : 'Un alunno', e2 = X.al.length > 1 ? cogn(X.al[0]) : 'un compagno';
      return [
        { text: e1 + ' non risponde in tempo: è escluso e prende 4 nello scritto.', options: { breakLine: true } },
        { text: (AUTO ? 'L\'app sorteggia ' + e2 + ', della stessa classe' : 'Il prof. passa i suoi termini a ' + e2) + ': ora ha ' + (TPA * 2) + ' termini.', options: { breakLine: true } },
        { text: e2 + ' può arrivare a ' + VE + ' e il suo nome va sui cartelloni al posto di ' + e1 + '.', options: { breakLine: true } },
        { text: 'Se però ' + e2 + ' non risponde in tempo ai termini ricevuti, non è escluso: il voto dello scritto scende a 6 (se era 6 o più; se era sotto 6 resta quello).' }];
    })())],
    { x: 8.85, y: 1.7, w: 3.65, h: 4.6, fontSize: 15, color: '0F3560', paraSpaceAfter: 10 });

  /* 16 · Voto: regole */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Come si calcola il voto dello scritto', { placeholder: 'title' });
  [[HEX.a[0], 'Si parte da ' + VM, 'Ogni risposta sbagliata: −' + PEN.toFixed(2).replace('.', ',') + '. Non si scende sotto 4. Anche una risposta poi corretta conta come errore.'],
    [HEX.a[3], 'Fino a ' + VE, 'Chi riceve i termini di un compagno escluso parte da ' + VE + ', con le stesse penalità.'],
    [HEX.ink, 'Voto del docente', 'Il prof. Cerrato può sempre correggere il voto a mano: in quel caso vale il suo.']].forEach((v, i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.5, 3.85, 2.5, null, v[1]);
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 3.85, h: 0.12, fill: { color: v[0] }, line: { color: v[0] }, objectName: 'Fascia ' + v[1] });
    T(s, v[1], { x: x + 0.3, y: 1.8, w: 3.3, h: 0.45, fontSize: 21, bold: true, color: C.text1 });
    T(s, v[2], { x: x + 0.3, y: 2.35, w: 3.3, h: 1.5, fontSize: 15 });
  });
  const es = [0, 1, 3, 7].map((n) => [n ? (n === 7 ? '7 o più risposte sbagliate' : n + (n === 1 ? ' risposta sbagliata' : ' risposte sbagliate')) : 'Nessun errore', n ? '−' + (n * PEN).toFixed(2).replace('.', ',') : '0', fn(Math.max(V.votoMin, V.votoMax - n * PEN))]);
  const hd = ['Esempio', 'Penalità', 'Voto'].map((t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: HEX.ink } } }));
  s.addTable([hd].concat(es.map((r, i) => r.map((c, j) => ({ text: c, options: { align: j ? 'center' : 'left', bold: j === 2, fill: { color: i % 2 ? 'FFFFFF' : HEX.bg }, color: HEX.ink } })))),
    { x: 0.6, y: 4.3, w: 12.1, colW: [6.1, 3.0, 3.0], rowH: 0.42, fontSize: 15, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.03, 0.12, 0.03, 0.12] });
  T(s, 'Si lavora a casa: voto massimo ' + VM + ', oppure ' + VE + ' per chi riceve i termini di un compagno escluso. Chi non consegna lo scritto prende 4 per mancata consegna. Il voto dello scritto serve per la media con l\'orale.', { x: 0.6, y: 6.5, w: 12.1, h: 0.35, fontSize: 13, italic: true, color: HEX.muted });

  /* 17 · Voto: dove lo vedo */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Tappa 1 · Lo scritto' });
  s.addText('Il voto dello scritto, sempre sotto controllo', { placeholder: 'title' });
  // riquadro del voto dell'app, disegnato con le scritte attuali
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.73, y: 1.58, w: 5.64, h: 4.9, fill: { color: C.background2 }, line: { color: HEX.line, width: 1 }, rectRadius: 0.15, objectName: 'Cornice voto' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 1.7, w: 5.4, h: 4.66, fill: { color: 'FFFFFF' }, line: { color: HEX.line, width: 0.75 }, rectRadius: 0.12, objectName: 'Riquadro voto' });
  T(s, 'VOTO DELLO SCRITTO (PROVVISORIO)', { x: 1.15, y: 1.95, w: 4.9, h: 0.3, fontSize: 12, bold: true, color: HEX.muted, charSpacing: 1.5 });
  T(s, [{ text: fn(V.votoMax - 2 * PEN), options: { fontSize: 54, bold: true, color: C.text1 } }, { text: '/' + VM, options: { fontSize: 20, color: HEX.muted } }], { x: 1.15, y: 2.3, w: 4.9, h: 1.1, valign: 'middle' });
  card(s, 1.15, 3.6, 4.8, 1.3, HEX.bg, 'Le tue risposte');
  T(s, 'LE TUE RISPOSTE', { x: 1.4, y: 3.72, w: 4.3, h: 0.3, fontSize: 11, bold: true, color: HEX.muted, charSpacing: 1.5 });
  T(s, '6', { x: 1.4, y: 4.0, w: 4.3, h: 0.5, fontSize: 26, bold: true, color: C.text1 });
  T(s, '2 errate', { x: 1.4, y: 4.5, w: 4.3, h: 0.3, fontSize: 12, color: HEX.muted });
  T(s, 'Il voto dello scritto fa media con quello dell\'interrogazione e dà il voto finale.', { x: 1.15, y: 5.1, w: 4.8, h: 0.9, fontSize: 13, color: HEX.muted });
  [['Voto dello scritto (provvisorio)', 'In alto, in grande. Compare dalla prima risposta che invii. Fa media con l\'orale.'],
    ['Le tue risposte', 'Quante risposte hai dato e quante erano sbagliate.'],
    ['Si aggiorna a ogni risposta', 'È provvisorio fino alla fine del lavoro: ogni errore lo abbassa subito.'],
    ['Voto assegnato dal docente', 'Se il prof. corregge il voto a mano, la scritta cambia e vedi il voto definitivo.']].forEach((a, i) => {
    const y = 1.55 + i * 1.25;
    num(s, i + 1, 6.8, y); T(s, a[0], { x: 7.6, y: y - 0.02, w: 5.1, h: 0.4, fontSize: 19, bold: true, color: C.text1 }); T(s, a[1], { x: 7.6, y: y + 0.4, w: 5.1, h: 0.75, fontSize: 15 });
  });

  /* TAPPA 2 · IL QUIZ */
  pres.addSection({ title: 'Tappa 2 · Il quiz' });
  const SEZQ = 'Tappa 2 · Il quiz';
  const scadQ = QS ? conOra(QS) : null;

  /* Q1 · Che cos'è */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZQ });
  s.addText('Dopo lo scritto: il quiz', { placeholder: 'title' });
  passiN(s, [['Che cos\'è', 'Un allenamento obbligatorio su tutti i ' + TOT + ' termini: non solo i tuoi, ma quelli di tutti, delle quattro aree.'],
    ['Non dà voto, ma è la porta', 'Serve per essere ammessi all\'interrogazione. Senza quiz superato non c\'è interrogazione e non c\'è voto.'],
    ['Quando è superato', 'Quando hai indovinato ' + SOG_TXT + '.'],
    ['Entro quando', scadQ ? 'Entro ' + scadQ + '. Dopo, il quiz si chiude.' : 'Entro la scadenza che fissa il prof.: la vedi scritta nella pagina del quiz. Dopo, il quiz si chiude.']], 0.6, 1.55, 7.0, 1.28, [1]);
  card(s, 8.7, 1.5, 4.0, 5.1, null, 'Numeri del quiz');
  [[String(SOG), SOG === TOT ? 'termini da indovinare: tutti' : 'termini da indovinare su ' + TOT], [String(NOPZ), 'definizioni per ogni termine'], [String(SEC), 'secondi per rispondere'], ['−' + PASSO, 'termini a ogni errore']].forEach((v, i) => {
    T(s, v[0], { x: 9.0, y: 1.65 + i * 1.22, w: 3.5, h: 0.65, fontSize: 38, bold: true, color: i === 3 ? C.accent6 : C.text1 });
    T(s, v[1], { x: 9.0, y: 2.28 + i * 1.22, w: 3.5, h: 0.45, fontSize: 14 });
  });
  s.addNotes('Il quiz arriva dopo lo scritto. Non dà voto, ma decide chi può fare l\'interrogazione. Si supera indovinando ' + SOG_TXT + '.');

  /* Q2 · Come entrare */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZQ });
  s.addText('Come entrare nel quiz', { placeholder: 'title' });
  phone(s, 'q_scheda.jpg', 0.8, 1.6, 4.3, 'Scheda personale di accesso al quiz con QR e codice');
  phone(s, 'q_ingresso.jpg', 4.25, 1.5, 5.2, 'Pagina del quiz: codice personale e pulsante Inizia');
  passiN(s, [['Prendi la tua scheda', 'Il prof. ti consegna un foglio con QR, indirizzo e codice personale.'],
    ['Inquadra il QR', 'Con la fotocamera del telefono: si apre la pagina del quiz con il codice già scritto.'],
    ['Oppure a mano', 'Apri l\'indirizzo che c\'è sulla scheda e scrivi il codice. È lo stesso codice dello scritto.'],
    ['Premi “Inizia”', 'Sotto il pulsante ci sono le regole: leggile la prima volta.']], 7.9, 1.55, 4.6, 1.28);
  s.addNotes('Il quiz ha una pagina sua: si entra con il QR della scheda o con il codice personale.');

  /* Q3 · Rispondere */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZQ });
  s.addText('Come si risponde', { placeholder: 'title' });
  phone(s, 'q_domanda.jpg', 1.0, 1.5, 5.2, 'Una domanda del quiz con il cronometro e 4 definizioni');
  passiN(s, [['Leggi il termine', 'In alto vedi a che punto sei: termini indovinati su ' + TOT + '.'],
    ['Tocca la definizione giusta', 'Sono ' + NOPZ + ': ne tocchi una e la risposta parte subito. Non c\'è un pulsante di conferma.'],
    ['Hai ' + SEC + ' secondi', 'Il cronometro resta sempre visibile. Se il tempo finisce, conta come risposta sbagliata.'],
    ['Per fermarti premi “Termina”', 'In alto a destra. Non chiudere la pagina a metà domanda: il tempo continua a scorrere.']], 5.2, 1.55, 7.3, 1.28, [2]);

  /* Q4 · Se sbagli */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZQ });
  s.addText('Se sbagli: torni indietro di ' + PASSO + ' termini', { placeholder: 'title' });
  phone(s, 'q_errore.jpg', 1.0, 1.5, 5.2, 'Messaggio dopo una risposta sbagliata');
  T(s, bullets([
    { text: 'Con una risposta sbagliata, o con il tempo scaduto, torni indietro di ' + PASSO + ' termini: gli ultimi ' + PASSO + ' che avevi indovinato vanno rifatti.' },
    { text: 'La risposta giusta non viene mostrata: devi cercarla e studiarla sul libro e sugli appunti.' },
    { text: 'Non si va mai sotto zero.' }]), { x: 5.2, y: 1.5, w: 7.5, h: 2.3, fontSize: 16, color: C.text1, paraSpaceAfter: 6 });
  const hdE = ['Eri a', 'Sbagli', 'Torni a'].map((t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: HEX.ink }, align: 'center' } }));
  const esE = [[20, 15], [120, 115], [4, 0], [0, 0]].map((r, i) => [String(r[0]), '✗', String(r[1])].map((c, j) => ({ text: c, options: { align: 'center', bold: j === 2, color: j === 1 ? HEX.red : HEX.ink, fill: { color: i % 2 ? 'FFFFFF' : HEX.bg } } })));
  s.addTable([hdE].concat(esE), { x: 5.2, y: 3.95, w: 7.5, colW: [2.5, 2.5, 2.5], rowH: 0.42, fontSize: 16, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.03, 0.12, 0.03, 0.12] });
  T(s, 'Il segreto: studia prima, non tirare a indovinare. Ogni errore ti costa ' + PASSO + ' termini.', { x: 5.2, y: 6.2, w: 7.5, h: 0.45, fontSize: 15, italic: true, color: HEX.muted });

  /* Q5 · I progressi restano */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZQ });
  s.addText('Puoi farlo in più volte', { placeholder: 'title' });
  phone(s, 'q_salvato.jpg', 1.0, 1.5, 5.2, 'Riepilogo del quiz con i progressi salvati');
  passiN(s, [['I progressi si salvano da soli', 'Ogni termine indovinato resta: quando torni, riparti da lì.'],
    ['Fermati quando vuoi', 'Premi “Termina” e chiudi. Poi rientri con il QR o con il codice e premi “Riprendi il quiz”.'],
    ['Da qualsiasi telefono', 'Basta il tuo codice personale: il punto a cui sei arrivato è lo stesso ovunque.'],
    ['Meglio poco ma spesso', 'Sono ' + SOG + ' termini: dividili in più sessioni nei giorni prima della scadenza.']], 5.2, 1.55, 7.3, 1.28);

  /* Q6 · Superato, scadenza, proroga */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZQ });
  s.addText('Quiz superato, oppure no', { placeholder: 'title' });
  phone(s, 'q_superato.jpg', 1.0, 1.5, 5.2, 'Messaggio di quiz superato');
  [[HEX.ok, HEX.okbg, 'Superato', 'Hai indovinato ' + SOG_TXT + ': sei ammesso all\'interrogazione. La pagina te lo dice e il quiz si chiude.'],
    [HEX.red, HEX.errbg, 'Non superato alla scadenza', (scadQ ? 'Il ' + scadQ.replace(/^\S+ /, '') : 'Alla scadenza') + ' il quiz si chiude. Chi non l\'ha superato non viene interrogato e resta senza voto. Le sue definizioni restano comunque sui cartelloni.'],
    [HEX.info, HEX.infobg, 'Proroga', 'Solo per motivi seri, e solo il prof. può concederla: vale per te e la nuova data compare nella pagina del quiz.']].forEach((v, i) => {
    const y = 1.5 + i * 1.72;
    card(s, 5.2, y, 7.5, 1.55, v[1], v[2]);
    T(s, v[2], { x: 5.5, y: y + 0.15, w: 7.0, h: 0.4, fontSize: 19, bold: true, color: v[0] });
    T(s, v[3], { x: 5.5, y: y + 0.58, w: 7.0, h: 0.9, fontSize: 15, color: C.text1 });
  });

  /* TAPPA 3 · L'INTERROGAZIONE */
  pres.addSection({ title: 'Tappa 3 · L\'interrogazione' });
  const SEZO = 'Tappa 3 · L\'interrogazione';
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZO });
  s.addText('Solo dopo il quiz: l\'interrogazione orale', { placeholder: 'title' });
  passiN(s, [['Chi viene interrogato', 'Solo chi ha superato il quiz. Il prof. chiama gli ammessi in laboratorio.'],
    ['' + OR.ORALE.domande + ' termini a sorte', 'L\'app li pesca tra tutti i ' + TOT + ' termini, mai tra i tuoi termini dello scritto.'],
    ['Rispondi a voce', 'Per ogni termine spieghi la definizione con parole tue, ma con il lessico giusto.'],
    ['Ogni risposta vale', 'Corretta 1 punto, parziale ½ punto, sbagliata 0.']], 0.6, 1.55, 7.0, 1.28);
  card(s, 8.7, 1.5, 4.0, 5.1, null, 'Punti orale');
  [['1', 'risposta corretta', HEX.ok], ['½', 'risposta parziale', HEX.warn], ['0', 'risposta sbagliata', HEX.red]].forEach((v, i) => {
    T(s, v[0], { x: 9.0, y: 1.75 + i * 1.6, w: 1.2, h: 0.9, fontSize: 48, bold: true, color: v[2], valign: 'middle' });
    T(s, v[1], { x: 10.25, y: 1.75 + i * 1.6, w: 2.3, h: 0.9, fontSize: 16, color: C.text1, valign: 'middle' });
  });
  T(s, 'Il quiz è il modo migliore per prepararsi: sono gli stessi termini.', { x: 0.6, y: 6.55, w: 8, h: 0.35, fontSize: 13, italic: true, color: HEX.muted });

  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZO });
  s.addText('Il voto dell\'interrogazione', { placeholder: 'title' });
  const hdOr = ['Punti', 'Voto orale', 'Scritto non consegnato'].map((t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: HEX.ink }, align: 'center' } }));
  const rOr = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((p, i) => [String(p), fn(OR.votoOrale(p, false)), fn(OR.votoOrale(p, true))].map((c, j) => ({ text: c, options: { align: 'center', bold: j === 1, color: HEX.ink, fill: { color: i % 2 ? 'FFFFFF' : HEX.bg } } })));
  s.addTable([hdOr].concat(rOr), { x: 0.6, y: 1.45, w: 6.6, colW: [1.6, 2.2, 2.8], rowH: 0.42, fontSize: 15, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.02, 0.1, 0.02, 0.1] });
  [[HEX.a[0], 'Voto orale = 3 + ½ per punto', 'Si parte da 3. Con 6 punti hai 6, con 10 punti hai 8, il massimo. I mezzi punti contano: 7,5 punti danno 6,75.'],
    [HEX.red, 'Chi non ha consegnato lo scritto', 'Se supera il quiz può essere interrogato, ma ogni punto vale ¼: arriva al massimo a 5,5.']].forEach((v, i) => {
    const y = 1.45 + i * 2.6;
    card(s, 7.6, y, 5.1, 2.35, null, v[1]);
    s.addShape(pres.shapes.RECTANGLE, { x: 7.6, y, w: 0.12, h: 2.35, fill: { color: v[0] }, line: { color: v[0] }, objectName: 'Fascia ' + v[1] });
    T(s, v[1], { x: 7.95, y: y + 0.2, w: 4.6, h: 0.5, fontSize: 19, bold: true, color: C.text1 });
    T(s, v[2], { x: 7.95, y: y + 0.75, w: 4.6, h: 1.5, fontSize: 15 });
  });

  /* TAPPA 4 · VOTO FINALE E CARTELLONI */
  pres.addSection({ title: 'Tappa 4 · Voto finale e cartelloni' });
  const SEZV = 'Tappa 4 · Voto finale e cartelloni';
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZV });
  s.addText('Il voto finale', { placeholder: 'title' });
  [[HEX.a[0], 'Hai fatto tutto', 'Voto finale = media tra il voto dello scritto e quello dell\'interrogazione.'],
    [HEX.a[2], 'Scritto non consegnato', 'Lo scritto vale 4. Con quiz superato e interrogazione, il voto finale è quello dell\'orale, al massimo 5,5.'],
    [HEX.red, 'Quiz non superato', 'Niente interrogazione e niente voto finale.']].forEach((v, i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.45, 3.85, 2.2, i === 2 ? HEX.errbg : null, v[1]);
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: 3.85, h: 0.12, fill: { color: v[0] }, line: { color: v[0] }, objectName: 'Fascia ' + v[1] });
    T(s, v[1], { x: x + 0.3, y: 1.75, w: 3.3, h: 0.45, fontSize: 20, bold: true, color: i === 2 ? C.accent6 : C.text1 });
    T(s, v[2], { x: x + 0.3, y: 2.3, w: 3.3, h: 1.25, fontSize: 15 });
  });
  const esO = [['7,5', '8', '7,75', '8'], ['7,5', '7,5', '7,5', '7,5'], ['7,5', '7,25', '7,375', '7'], ['6', '6,5', '6,25', '6']];
  const hdO = ['Scritto', 'Orale', 'Media', 'Voto finale'].map((t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: HEX.ink }, align: 'center' } }));
  s.addTable([hdO].concat(esO.map((r, i) => r.map((c, j) => ({ text: c, options: { align: 'center', bold: j === 3, fill: { color: i % 2 ? 'FFFFFF' : HEX.bg }, color: HEX.ink } })))),
    { x: 0.6, y: 3.95, w: 12.1, colW: [3.025, 3.025, 3.025, 3.025], rowH: 0.42, fontSize: 15, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.03, 0.12, 0.03, 0.12] });
  T(s, [{ text: 'Arrotondamento: ', options: { bold: true, color: C.text1 } }, { text: 'oltre il mezzo voto si sale all\'intero (7,75 → 8), sotto il mezzo si scende (7,375 → 7), il mezzo voto resta (7,5).' }],
    { x: 0.6, y: 6.2, w: 12.1, h: 0.5, fontSize: 15 });

  /* Cartelloni */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: SEZV });
  s.addText('Il risultato: quattro cartelloni 70×100', { placeholder: 'title' });
  T(s, 'Stampati e appesi in laboratorio, con il logo della scuola e i nomi di ' + CLASSI_TXT + '. Le definizioni approvate restano sui cartelloni con il tuo nome, anche se non superi il quiz.', { x: 0.6, y: 1.15, w: 12.1, h: 0.65, fontSize: 16 });
  [1, 2, 3, 4].forEach((n, i) => s.addImage({ data: img('poster' + n + '.jpg'), x: 0.75 + i * 3.0, y: 1.95, w: 2.8, h: 4.0, objectName: 'Cartellone ' + n, altText: 'Cartellone ' + n + ': ' + AREE[i].it }));
  AREE.forEach((a, i) => T(s, a.n + '. ' + a.it, { x: 0.75 + i * 3.0, y: 6.05, w: 2.8, h: 0.6, fontSize: 13, bold: true, color: AC[i], align: 'center' }));

  /* IN PRATICA */
  pres.addSection({ title: 'In pratica' });
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'In pratica' });
  s.addText('Dal telefono, senza sorprese', { placeholder: 'title' });
  const tel = [[fa.FaStar, 'Salva la pagina del quiz', 'Aggiungila alla schermata Home del telefono: la ritrovi con un tocco.'],
    [fa.FaClock, 'Connessione e batteria', 'Prima di una sessione di quiz: rete stabile e batteria carica. Il tempo scorre anche se la pagina si blocca.'],
    [fa.FaBookOpen, 'Studia prima del quiz', 'Libro, appunti e lezioni di laboratorio: è lì che si studia per il quiz e per l\'interrogazione.'],
    [fa.FaKey, 'Un solo codice', 'Lo stesso codice personale vale per lo scritto e per il quiz. Non darlo a nessuno.']];
  for (let i = 0; i < tel.length; i++) {
    const x = 0.6 + (i % 2) * 6.2, y = 1.5 + Math.floor(i / 2) * 2.55;
    card(s, x, y, 5.9, 2.3, null, 'Telefono ' + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: y + 0.35, w: 1.0, h: 1.0, fill: { color: HEX.a[i] }, line: { color: HEX.a[i] }, objectName: 'Icona telefono ' + (i + 1) });
    s.addImage({ data: await icon(tel[i][0], 'FFFFFF'), x: x + 0.6, y: y + 0.6, w: 0.5, h: 0.5, altText: tel[i][1] });
    T(s, tel[i][1], { x: x + 1.65, y: y + 0.35, w: 4.0, h: 0.5, fontSize: 21, bold: true, color: C.text1 });
    T(s, tel[i][2], { x: x + 1.65, y: y + 0.9, w: 4.0, h: 1.3, fontSize: 15 });
  }

  /* Regole d'oro */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'In pratica' });
  s.addText('Sei regole d\'oro', { placeholder: 'title' });
  const reg = [[fa.FaBookOpen, 'Scritto: studia prima di scegliere', 'Leggi tutte e 8 le alternative. Ogni invio sbagliato resta un errore.'],
    [fa.FaClock, 'Scritto: rispetta la scadenza', 'Un solo termine senza risposta = mancata consegna, voto 4.'],
    [fa.FaSearch, 'Quiz: studia tutti i termini', 'Non solo i tuoi: le domande sono su tutti i ' + TOT + '.'],
    [fa.FaHourglassHalf, 'Quiz: non aspettare l\'ultimo giorno', SOG + ' termini, un errore = −' + PASSO + '. Servono più sessioni.'],
    [fa.FaComments, 'Orale: parla da odontotecnico', 'Definizioni precise, con il lessico giusto.'],
    [fa.FaKey, 'Il codice è solo tuo', 'Se lo perdi o hai dubbi, chiedi al prof. Cerrato prima delle scadenze.']];
  for (let i = 0; i < reg.length; i++) {
    const x = 0.6 + (i % 2) * 6.2, y = 1.5 + Math.floor(i / 2) * 1.75, colr = i === 1 || i === 3 ? HEX.red : HEX.a[i % 4];
    card(s, x, y, 5.9, 1.55, null, 'Regola ' + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.95, h: 0.95, fill: { color: colr }, line: { color: colr }, objectName: 'Icona regola ' + (i + 1) });
    s.addImage({ data: await icon(reg[i][0], 'FFFFFF'), x: x + 0.53, y: y + 0.53, w: 0.49, h: 0.49, altText: reg[i][1] });
    T(s, reg[i][1], { x: x + 1.5, y: y + 0.22, w: 4.25, h: 0.5, fontSize: 18, bold: true, color: C.text1 });
    T(s, reg[i][2], { x: x + 1.5, y: y + 0.75, w: 4.25, h: 0.7, fontSize: 14 });
  }

  /* Domande frequenti */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'In pratica' });
  s.addText('Domande frequenti', { placeholder: 'title' });
  const faq = [['Se sbaglio nel quiz perdo tutto?', 'No: torni indietro di ' + PASSO + ' termini. Se ne avevi meno di ' + PASSO + ', torni a zero.'],
    ['Il quiz dà un voto?', 'No. Serve solo per essere ammessi all\'interrogazione.'],
    ['Posso fare il quiz in più giorni?', 'Sì: i progressi restano e riparti dal punto in cui eri.'],
    ['Se il telefono si blocca durante una domanda?', 'Rientra: se il tempo è scaduto conta come errore, poi si riparte.'],
    ['Non ho consegnato lo scritto: è finita?', 'No: lo scritto vale 4, ma con quiz e interrogazione puoi ancora arrivare a 5,5.'],
    ['Ho perso la scheda o il codice?', 'Chiedi al prof.: te ne stampa un\'altra.']];
  faq.forEach((f, i) => {
    const x = 0.6 + (i % 2) * 6.2, y = 1.45 + Math.floor(i / 2) * 1.75;
    card(s, x, y, 5.9, 1.55, null, 'Domanda ' + (i + 1));
    T(s, f[0], { x: x + 0.3, y: y + 0.18, w: 5.3, h: 0.5, fontSize: 17, bold: true, color: C.text1 });
    T(s, f[1], { x: x + 0.3, y: y + 0.72, w: 5.3, h: 0.75, fontSize: 15 });
  });

  /* Chiusura */
  const prossima = (QS && Date.parse(QS) > now && Date.parse(SCAD) <= now) ? ['Quiz entro ' + giorno(QS), SOG_TXT + ' · buon lavoro!'] : ['Scadenza: ' + giorno(SCAD), TPA + ' termini a testa · buon lavoro!'];
  s = pres.addSlide({ masterName: 'Scura', sectionTitle: 'In pratica' });
  s.addText(prossima[0], { placeholder: 'title' });
  s.addText(prossima[1], { placeholder: 'body' });
  T(s, 'ISTITUTO BARSANTI - SEDE SALVETTI · CLASSE ' + CL + ' · A.S. ' + AS, { x: 0.7, y: 1.1, w: 7.8, h: 0.4, fontSize: 12, bold: true, color: '9FB3C6', charSpacing: 1.5 });
  T(s, 'Scritto → Quiz → Interrogazione → Voto finale', { x: 0.7, y: 5.3, w: 7.6, h: 0.45, fontSize: 17, color: 'C9D6E2' });
  T(s, 'Domande?', { x: 0.7, y: 5.85, w: 7, h: 0.6, fontSize: 24, bold: true, color: C.background1 });
  s.addImage({ data: img('poster1.jpg'), x: 8.7, y: 0.75, w: 4.2, h: 6.0, altText: 'Cartellone 1' });


  return applicaTema(await pres.write({ outputType: 'nodebuffer' }));
}

/* colori del tema nel file e niente voci-cartella nello zip */
async function applicaTema(buf) {
  const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));
  const zip = await JSZip.loadAsync(buf);
  const part = 'ppt/theme/theme1.xml';
  const SLOTS = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
  const scheme = '<a:clrScheme name="' + THEME.name + '">' + SLOTS.map((k) => '<a:' + k + '><a:srgbClr val="' + THEME.colors[k] + '"/></a:' + k + '>').join('') + '</a:clrScheme>';
  const xml = (await zip.file(part).async('string')).replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme)
    .replace(/<a:majorFont>\s*<a:latin typeface="[^"]*"/, '<a:majorFont><a:latin typeface="Arial"').replace(/<a:minorFont>\s*<a:latin typeface="[^"]*"/, '<a:minorFont><a:latin typeface="Arial"')
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, h) => h + THEME.name + '"');
  zip.file(part, xml);
  Object.keys(zip.files).forEach((k) => { if (zip.files[k].dir) delete zip.files[k]; });
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { creaDeckStudenti };
