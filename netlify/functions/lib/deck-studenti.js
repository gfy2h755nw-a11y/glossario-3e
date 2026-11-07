/* Presentazione per gli studenti (una per classe), generata dall'app con partenza, scadenza e regole prese dalle impostazioni.
   Icone e immagini sono in deck-assets.js (generato da deck2/assets.js). */
const pptxgen = require('pptxgenjs');
const DATI = require('./dati');
const { alunnoIniziale } = require('./logica');
const A = require('./deck-assets');
const AREE = DATI.AREE.map((a) => Object.assign({}, a, { termini: DATI.TERMINI[a.n] }));
const fa = new Proxy({}, { get: (t, k) => k });
async function icon(nome, color) { return A.icone[nome + ':' + color] || A.icone[nome + ':FFFFFF']; }
const img = (f) => A.img[f];
const dim = (f) => A.dim[f];
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
async function creaDeckStudenti(classe, imp, now) {
  const CL = classe === '3F' ? '3F' : '3E', F = CL === '3F';
  now = now || Date.now();
  const V = { votoMax: imp.votoMax, votoMaxErede: imp.votoMaxErede, votoMin: imp.votoMin };
  const VM = fn(V.votoMax), VE = fn(V.votoMaxErede), PEN = imp.proposta === 'A' ? 0.25 : 0.5;
  const PART = imp.partenza, SCAD = imp.scadenzaIt;
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };
  pres.title = 'Glossario odontotecnico – istruzioni per la classe ' + CL;
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
  const num = (s, n, x, y, col) => { s.addShape(pres.shapes.OVAL, { x, y, w: 0.55, h: 0.55, fill: { color: col || C.text1 }, line: { color: col || C.text1 }, objectName: 'Numero ' + n }); T(s, String(n), { x, y, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: C.background1, align: 'center', valign: 'middle' }); };

  /* 1 · Copertina */
  pres.addSection({ title: 'Il progetto' });
  let s = pres.addSlide({ masterName: 'Scura', sectionTitle: 'Il progetto' });
  s.addText('Glossario odontotecnico', { placeholder: 'title' });
  s.addText('Istruzioni per l\'uso · classe ' + CL, { placeholder: 'body' });
  T(s, 'ISTITUTO BARSANTI - SEDE SALVETTI · CLASSE ' + CL + ' · A.S. 2026/27', { x: 0.7, y: 1.1, w: 7.8, h: 0.4, fontSize: 12, bold: true, color: '9FB3C6', charSpacing: 1.5 });
  T(s, [{ text: 'Laboratorio odontotecnico · Prof. Danilo Cerrato' }],
    { x: 0.7, y: 5.75, w: 7.6, h: 0.8, fontSize: 15, color: 'C9D6E2', paraSpaceAfter: 4 });
  [1, 2, 3, 4].forEach((n, i) => s.addImage({ data: img('poster' + n + '.jpg'), x: 8.7 + (i % 2) * 2.15, y: 0.6 + Math.floor(i / 2) * 3.15, w: 2.0, h: 2.857, altText: 'Cartellone ' + n }));
  s.addNotes('Presentazione del progetto alla classe. Oggi spieghiamo cosa dovete fare, come si usa l\'app, le scadenze e come viene calcolato il voto.');

  /* 2 · Il compito */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText('Il compito in breve', { placeholder: 'title' });
  T(s, [
    { text: 'La 3E e la 3F costruiscono insieme un glossario tecnico di odontotecnica.', options: { bold: true, color: C.text1, breakLine: true } },
    { text: F ? 'Ognuno di voi ha 10 termini, presi da tutte e quattro le aree.' : 'Ognuno di voi ha 10 termini della sua area.', options: { bullet: true, breakLine: true } },
    { text: 'Per ogni termine sceglie la definizione giusta tra 8 alternative.', options: { bullet: true, breakLine: true } },
    { text: 'Il prof. Cerrato controlla ogni scelta e la approva.', options: { bullet: true, breakLine: true } },
    { text: 'Le definizioni approvate finiscono su 4 cartelloni 70×100 stampati e appesi in laboratorio, con i nomi di tutte e due le classi.', options: { bullet: true } }
  ], { x: 0.6, y: 1.6, w: 5.8, h: 4.8, fontSize: 18, paraSpaceAfter: 10 });
  [['10', 'termini a testa'], ['8', 'alternative per ogni scelta'], [String(NT), 'termini per area'], ['4', 'cartelloni 70×100']].forEach((st, i) => {
    const x = 6.9 + (i % 2) * 2.95, y = 1.6 + Math.floor(i / 2) * 2.45;
    card(s, x, y, 2.75, 2.25, null, 'Dato ' + (i + 1));
    T(s, st[0], { x: x + 0.3, y: y + 0.25, w: 2.2, h: 1.1, fontSize: 64, bold: true, color: AC[i], valign: 'middle' });
    T(s, st[1], { x: x + 0.3, y: y + 1.4, w: 2.2, h: 0.7, fontSize: 16, color: C.text1 });
  });

  /* 2b · Novità */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText('Due classi, un solo glossario', { placeholder: 'title' });
  const nov = [[fa.FaUsers, '3E: 16 alunni, 160 termini', 'Quattro gruppi, uno per area: i termini da 1 a 40 di ogni cartellone.', HEX.a[0]],
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
  s.addNotes('Il glossario è unico: 65 termini per area, 40 della 3E e 25 della 3F. Stesse regole, stessa partenza e stessa scadenza per le due classi.');

  /* 3 · Perché */
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

  if (F) {
  /* 4F · Aree e distribuzione */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText('Quattro aree, dieci termini a testa', { placeholder: 'title' });
  const dist = NOMI_F.map((nome, k) => { const id = 'F' + String(k + 1).padStart(2, '0'); const c = {}; AREE.forEach((a) => { c[a.n] = 0; for (let t = 40; t < NT; t++) if (alunnoIniziale(a.n, t) === id) c[a.n]++; }); return { nome, c }; });
  AREE.forEach((a, i) => {
    const x = 0.6 + i * 3.1, w = 2.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.45, w, h: 1.15, fill: { color: AC[i] }, line: { color: AC[i] }, rectRadius: 0.12, objectName: 'Testata area ' + a.n });
    T(s, '0' + a.n, { x: x + 0.2, y: 1.52, w: 0.9, h: 0.6, fontSize: 28, bold: true, color: C.background1 });
    T(s, a.it, { x: x + 1.0, y: 1.52, w: w - 1.15, h: 0.6, fontSize: 13, bold: true, color: C.background1, valign: 'middle' });
    T(s, 'termini 41–65 · 25 alla 3F', { x: x + 0.2, y: 2.13, w: w - 0.35, h: 0.35, fontSize: 12, color: C.background1 });
  });
  const hdF = ['Alunno'].concat(AREE.map((a) => 'Area ' + a.n), ['Totale']).map((t, k) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: k && k < 5 ? HEX.a[k - 1] : HEX.ink }, align: k ? 'center' : 'left' } }));
  s.addTable([hdF].concat(dist.map((d, r) => [{ text: d.nome, options: { bold: true, color: HEX.ink } }].concat(AREE.map((a) => ({ text: String(d.c[a.n]), options: { align: 'center', color: HEX.ink } })), [{ text: '10', options: { align: 'center', bold: true, color: HEX.ink } }])
    .map((c) => Object.assign(c, { options: Object.assign({ fill: { color: r % 2 ? 'FFFFFF' : HEX.bg } }, c.options) })))),
    { x: 0.6, y: 2.85, w: 12.1, colW: [4.1, 1.6, 1.6, 1.6, 1.6, 1.6], rowH: 0.34, fontSize: 13, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.02, 0.1, 0.02, 0.1] });
  s.addNotes('Ogni alunno della 3F ha 2 o 3 termini per area, 10 in tutto. I nomi dei termini sono nelle prossime quattro slide.');

  /* 5F-8F · Termini della 3F */
  pres.addSection({ title: 'I termini' });
  AREE.forEach((a, i) => {
    s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'I termini' });
    s.addText('Area ' + a.n + ' · ' + a.it, { placeholder: 'title' });
    T(s, 'I 25 termini della 3F (41–65) e a chi sono assegnati · i termini 1–40 sono della 3E', { x: 0.6, y: 1.15, w: 12, h: 0.35, fontSize: 15, italic: true, color: AC[i] });
    [[40, 53], [53, NT]].forEach(([da, a2], col) => {
      const rows = [['N.', 'Termine', 'Alunno'].map((t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: HEX.a[i] } } }))];
      for (let k = da; k < a2; k++) {
        const fill = { color: k % 2 ? 'FFFFFF' : HEX.bg };
        rows.push([{ text: String(k + 1), options: { fill, color: HEX.muted, align: 'center' } }, { text: a.termini[k][0], options: { fill, bold: true, color: HEX.ink } }, { text: cognome(nomeDi(alunnoIniziale(a.n, k))), options: { fill, color: HEX.ink } }]);
      }
      s.addTable(rows, { x: 0.6 + col * 6.2, y: 1.65, w: 5.9, colW: [0.6, 3.6, 1.7], rowH: 0.355, fontSize: 12, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.02, 0.06, 0.02, 0.06] });
    });
  });
  } else {
  /* 4 · Aree e gruppi */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Il progetto' });
  s.addText('Quattro aree, quattro gruppi', { placeholder: 'title' });
  AREE.forEach((a, i) => {
    const x = 0.6 + i * 3.1, y = 1.55, w = 2.85;
    card(s, x, y, w, 5.15, null, 'Area ' + a.n);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 2.2, fill: { color: AC[i] }, line: { color: AC[i] }, rectRadius: 0.12, objectName: 'Testata area ' + a.n });
    T(s, '0' + a.n, { x: x + 0.25, y: y + 0.15, w: 1.5, h: 0.8, fontSize: 44, bold: true, color: C.background1 });
    T(s, a.it, { x: x + 0.25, y: y + 0.95, w: w - 0.45, h: 0.75, fontSize: 17, bold: true, color: C.background1, valign: 'bottom' });
    T(s, 'Gruppo ' + a.n + ' · termini 1–40', { x: x + 0.25, y: y + 2.4, w: w - 0.45, h: 0.35, fontSize: 13, bold: true, color: AC[i] });
    T(s, bullets(NOMI.slice(i * 4, i * 4 + 4)), { x: x + 0.25, y: y + 2.85, w: w - 0.45, h: 1.7, fontSize: 14, color: C.text1, paraSpaceAfter: 3 });
    T(s, '10 termini a testa: 1–5 e 21–25, 6–10 e 26–30, … in quest\'ordine', { x: x + 0.25, y: y + 4.55, w: w - 0.45, h: 0.45, fontSize: 11, italic: true, color: HEX.muted });
  });

  /* 5-8 · Termini */
  pres.addSection({ title: 'I termini' });
  AREE.forEach((a, i) => {
    s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'I termini' });
    s.addText('Area ' + a.n + ' · ' + a.it, { placeholder: 'title' });
    const g = NOMI.slice(i * 4, i * 4 + 4);
    T(s, 'I 40 termini della 3E · lo sfondo indica a chi è assegnato ogni blocco di 5 (i termini 41–65 sono della 3F)', { x: 0.6, y: 1.15, w: 12, h: 0.35, fontSize: 15, italic: true, color: AC[i] });
    const tinte = ['FFFFFF', HEX.bg, 'FFFFFF', HEX.bg];
    [0, 1, 2, 3].forEach((col) => {
      const rows = [[{ text: 'N.', options: { bold: true, color: 'FFFFFF', fill: { color: HEX.a[i] } } }, { text: 'Termine', options: { bold: true, color: 'FFFFFF', fill: { color: HEX.a[i] } } }]];
      a.termini.slice(col * 10, col * 10 + 10).forEach((t, k) => {
        const n = col * 10 + k + 1, chi = Math.floor(((n - 1) % 20) / 5), fill = { color: tinte[chi] };
        rows.push([{ text: String(n), options: { fill, color: HEX.muted, align: 'center' } }, { text: t[0], options: { fill, bold: true, color: HEX.ink } }]);
      });
      s.addTable(rows, { x: 0.6 + col * 3.05, y: 1.65, w: 2.9, colW: [0.5, 2.4], rowH: 0.4, fontSize: 12, fontFace: 'Arial', valign: 'middle', border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [0.02, 0.06, 0.02, 0.06] });
    });
    T(s, [{ text: g[0] + ': 1–5, 21–25 · ' + g[1] + ': 6–10, 26–30', options: { breakLine: true } }, { text: g[2] + ': 11–15, 31–35 · ' + g[3] + ': 16–20, 36–40' }],
      { x: 0.6, y: 6.15, w: 12.1, h: 0.7, fontSize: 13, bold: true, color: C.text1 });
  });

  }

  /* 9 · Il percorso */
  pres.addSection({ title: 'Come funziona' });
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Come funziona' });
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
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Come funziona' });
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
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Come funziona' });
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
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Come funziona' });
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
  pres.addSection({ title: 'Scadenze e voto' });
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Scadenze e voto' });
  s.addText('Partenza e scadenza', { placeholder: 'title' });
  // riquadro dell'app prima della partenza, disegnato con la data vera
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.88, y: 1.58, w: 5.19, h: 4.84, fill: { color: C.background2 }, line: { color: HEX.line, width: 1 }, rectRadius: 0.15, objectName: 'Cornice attesa' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.0, y: 1.7, w: 4.95, h: 4.6, fill: { color: 'FFFFFF' }, line: { color: HEX.line, width: 0.75 }, rectRadius: 0.12, objectName: 'Schermata attesa' });
  T(s, 'GLOSSARIO ODONTOTECNICO', { x: 1.3, y: 1.95, w: 4.4, h: 0.3, fontSize: 11, bold: true, color: HEX.muted, charSpacing: 2 });
  T(s, 'Il compito non è ancora partito', { x: 1.3, y: 2.3, w: 4.4, h: 0.9, fontSize: 22, bold: true, color: C.text1 });
  T(s, PART ? [{ text: 'Si parte ' }, { text: conOra(PART).replace(', ore', ' alle'), options: { bold: true } }, { text: '. Da quel momento qui trovi i tuoi ' }, { text: '10 termini', options: { bold: true } }, { text: '.' }]
    : 'Il prof. non ha ancora fissato la partenza.', { x: 1.3, y: 3.25, w: 4.4, h: 0.8, fontSize: 14 });
  ['giorni', 'ore', 'min', 'sec'].forEach((u, k) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.3 + k * 1.05, y: 4.15, w: 0.9, h: 0.85, fill: { color: HEX.bg }, line: { color: HEX.bg }, rectRadius: 0.08, objectName: 'Conto ' + u });
    T(s, ['2', '04', '15', '11'][k], { x: 1.3 + k * 1.05, y: 4.2, w: 0.9, h: 0.45, fontSize: 20, bold: true, color: C.text1, align: 'center', valign: 'middle' });
    T(s, u, { x: 1.3 + k * 1.05, y: 4.65, w: 0.9, h: 0.3, fontSize: 10, color: HEX.muted, align: 'center' });
  });
  T(s, 'Scadenza per rispondere a tutti i termini: ' + conOra(SCAD).replace(', ore', ' alle') + '.', { x: 1.3, y: 5.25, w: 4.4, h: 0.8, fontSize: 13, color: HEX.muted });
  [[HEX.a[2], 'Partenza', PART ? conOra(PART) : 'la fissa il prof. nell\'app', 'uguale per 3E e 3F: prima vedi solo il conto alla rovescia, poi compaiono i tuoi 10 termini'],
    [HEX.a[0], 'Scadenza', conOra(SCAD), 'entro questa ora devi aver risposto a tutti e 10 i tuoi termini']].forEach((d, i) => {
    const y = 1.55 + i * 1.75;
    card(s, 6.7, y, 6.0, 1.55, null, 'Scadenza ' + d[1]);
    T(s, d[1].toUpperCase(), { x: 7.0, y: y + 0.15, w: 5.5, h: 0.3, fontSize: 13, bold: true, color: d[0], charSpacing: 2 });
    T(s, d[2], { x: 7.0, y: y + 0.45, w: 5.5, h: 0.45, fontSize: 22, bold: true, color: C.text1 });
    T(s, d[3], { x: 7.0, y: y + 0.95, w: 5.5, h: 0.5, fontSize: 14 });
  });
  T(s, [{ text: 'Conta aver risposto, non essere già approvati. ', options: { bold: true, color: C.text1 } }, { text: 'Il conto alla rovescia nell\'app è sempre aggiornato: le date ufficiali sono quelle che vedi lì.' }],
    { x: 6.7, y: 5.15, w: 6.0, h: 1.2, fontSize: 15 });

  /* 15 · Esclusione */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Scadenze e voto' });
  s.addText('Chi non rispetta la scadenza', { placeholder: 'title' });
  card(s, 0.6, 1.5, 6.2, 5.1, HEX.errbg, 'Regola esclusione');
  s.addImage({ data: await icon(fa.FaExclamationTriangle, HEX.red), x: 0.95, y: 1.8, w: 0.6, h: 0.6, altText: 'Attenzione' });
  T(s, 'Esclusione automatica', { x: 1.75, y: 1.8, w: 4.9, h: 0.6, fontSize: 24, bold: true, color: C.accent6, valign: 'middle' });
  T(s, bullets([
    'Se alla scadenza hai anche un solo termine senza risposta, sei escluso subito.',
    'Sei tolto dal tabellone dei voti e il tuo voto finale è 4.',
    'Non puoi più rispondere: a ogni accesso vedi solo il messaggio qui a destra.',
    'Non c\'entra se le risposte sono già state approvate o no: conta solo avere risposto.'
  ]), { x: 0.95, y: 2.6, w: 5.6, h: 3.9, fontSize: 16, color: C.text1, paraSpaceAfter: 8 });
  const de = dim('escluso.jpg'), ew = 5.4;
  phone(s, 'escluso.jpg', 7.25, 2.2, ew * de.h / de.w, 'Messaggio di esclusione mostrato all\'alunno');
  T(s, 'Quello che vedresti entrando nell\'app', { x: 7.15, y: 1.55, w: 5.6, h: 0.4, fontSize: 14, italic: true, color: HEX.muted });

  /* 15b · Riassegnazione */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Scadenze e voto' });
  s.addText('Se un compagno viene escluso', { placeholder: 'title' });
  const ria = [[fa.FaRandom, 'I suoi termini passano a un altro', 'L\'app li assegna da sola, a sorte, a un compagno non escluso della stessa classe.'],
    [fa.FaUserPlus, 'Uno solo a testa', 'Nessuno riceve i termini di più di un compagno.'],
    [fa.FaHourglassHalf, 'Nuove scadenze per quei termini', imp.giorniIt + ' giorni da quando li ricevi. In ritardo: niente esclusione, ma voto finale massimo 6.'],
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
    { text: F ? 'Taddei (3F) non risponde in tempo: è esclusa con 4.' : 'Tonlorenzi (3E, area 4) non risponde in tempo: è escluso con 4.', options: { breakLine: true } },
    { text: F ? 'L\'app sorteggia Balleri, sempre della 3F: ora ha 20 termini.' : 'L\'app sorteggia Bertelà, sempre della 3E: ora ha 20 termini, 10 di anatomia e 10 di laboratorio.', options: { breakLine: true } },
    { text: (F ? 'Balleri può arrivare a ' + VE + ' e il suo nome va sui cartelloni al posto di Taddei.' : 'Bertelà può arrivare a ' + VE + ' e il suo nome va sul cartellone 4 al posto di Tonlorenzi.'), options: { breakLine: true } },
    { text: 'Se però ' + (F ? 'Balleri' : 'Bertelà') + ' non risponde in tempo ai termini ricevuti, non è escluso: il voto finale scende a 6 (se era 6 o più; se era sotto 6 resta quello).' }],
    { x: 8.85, y: 1.7, w: 3.65, h: 4.6, fontSize: 15, color: '0F3560', paraSpaceAfter: 10 });

  /* 16 · Voto: regole */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Scadenze e voto' });
  s.addText('Come si calcola il voto', { placeholder: 'title' });
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
  T(s, 'Si lavora a casa: voto massimo ' + VM + ', oppure ' + VE + ' per chi riceve i termini di un compagno escluso. Chi è escluso per la scadenza prende 4.', { x: 0.6, y: 6.5, w: 12.1, h: 0.35, fontSize: 13, italic: true, color: HEX.muted });

  /* 17 · Voto: dove lo vedo */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Scadenze e voto' });
  s.addText('Il tuo voto, sempre sotto controllo', { placeholder: 'title' });
  const dv = dim('voto_c.jpg'), vw = 5.4;
  phone(s, 'voto_c.jpg', 0.85, 1.7, vw * dv.h / dv.w, 'Riquadro del voto con voto finale e risposte date');
  [['Voto finale provvisorio', 'In alto, in grande. Compare dalla prima risposta che invii.'],
    ['Le tue risposte', 'Quante risposte hai dato e quante erano sbagliate.'],
    ['Si aggiorna a ogni risposta', 'È provvisorio fino alla fine del lavoro: ogni errore lo abbassa subito.'],
    ['Voto assegnato dal docente', 'Se il prof. corregge il voto a mano, la scritta cambia e vedi il voto definitivo.']].forEach((a, i) => {
    const y = 1.55 + i * 1.25;
    num(s, i + 1, 6.8, y); T(s, a[0], { x: 7.6, y: y - 0.02, w: 5.1, h: 0.4, fontSize: 19, bold: true, color: C.text1 }); T(s, a[1], { x: 7.6, y: y + 0.4, w: 5.1, h: 0.75, fontSize: 15 });
  });

  /* 18 · Tappe */
  pres.addSection({ title: 'Calendario e risultato' });
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Calendario e risultato' });
  s.addText('Le tappe fino all\'11 dicembre', { placeholder: 'title' });
  const tappe = DATI.TAPPE.filter((t) => t.lingua !== 'en').map((t) => t.chiave === 'partenza' ? [PART ? breve(PART) : 'Partenza', PART ? 'Partenza: si apre l\'app per 3E e 3F' : 'Partenza: la fissa il prof. nell\'app', false]
    : t.chiave === 'it' ? [breve(SCAD), 'SCADENZA: tutti e 10 i termini', true] : [breve(t.data + 'T12:00:00Z'), t.testo, false]);
  const passo = 10.74 / (tappe.length - 1);
  s.addShape(pres.shapes.LINE, { x: 1.3, y: 3.35, w: 10.74, h: 0, line: { color: HEX.line, width: 4 }, objectName: 'Linea del tempo' });
  tappe.forEach((t, i) => {
    const cx = 1.3 + i * passo, last = i === tappe.length - 1, sc = t[2];
    const col = last ? HEX.red : sc ? HEX.a[0] : HEX.ink, r = last || sc ? 0.32 : 0.22;
    s.addShape(pres.shapes.OVAL, { x: cx - r, y: 3.35 - r, w: 2 * r, h: 2 * r, fill: { color: col }, line: { color: 'FFFFFF', width: 3 }, objectName: 'Tappa ' + (i + 1) });
    T(s, 'TAPPA ' + (i + 1), { x: cx - 0.85, y: 1.85, w: 1.7, h: 0.3, fontSize: 11, bold: true, color: HEX.muted, align: 'center', charSpacing: 2 });
    T(s, t[0], { x: cx - 0.85, y: 2.2, w: 1.7, h: 0.6, fontSize: last || sc ? 20 : 18, bold: true, color: col, align: 'center', valign: 'middle' });
    T(s, t[1], { x: cx - 0.85, y: 3.85, w: 1.7, h: 1.5, fontSize: 13, color: C.text1, align: 'center', bold: sc });
  });
  card(s, 0.6, 5.55, 12.1, 1.0, null, 'Nota tappe');
  T(s, [{ text: 'Si lavora da casa, ', options: { bold: true, color: C.text1 } }, { text: 'nei tempi che ognuno organizza. Non aspettate l\'ultima sera: 10 termini richiedono tempo, e una risposta rimandata va corretta.' }],
    { x: 0.9, y: 5.55, w: 11.5, h: 1.0, fontSize: 16, valign: 'middle' });

  /* 19 · Risultato */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Calendario e risultato' });
  s.addText('Il risultato: quattro cartelloni 70×100', { placeholder: 'title' });
  T(s, 'Stampati e appesi in laboratorio, con il logo della scuola e i nomi di 3E e 3F: ' + NT + ' termini per cartellone.', { x: 0.6, y: 1.2, w: 12.1, h: 0.5, fontSize: 16 });
  [1, 2, 3, 4].forEach((n, i) => s.addImage({ data: img('poster' + n + '.jpg'), x: 0.75 + i * 3.0, y: 1.85, w: 2.8, h: 4.0, objectName: 'Cartellone ' + n, altText: 'Cartellone ' + n + ': ' + AREE[i].it }));
  AREE.forEach((a, i) => T(s, a.n + '. ' + a.it, { x: 0.75 + i * 3.0, y: 5.95, w: 2.8, h: 0.6, fontSize: 13, bold: true, color: AC[i], align: 'center' }));

  /* 20 · Regole d'oro */
  s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: 'Calendario e risultato' });
  s.addText('Sei regole d\'oro', { placeholder: 'title' });
  const reg = [[fa.FaBookOpen, 'Studia prima di scegliere', 'Libro e appunti alla mano: non si va a caso.'],
    [fa.FaSearch, 'Leggi tutte e 8 le alternative', 'Sono tutte plausibili: la differenza è nei dettagli.'],
    [fa.FaCheckDouble, 'Conferma solo se sei sicuro', 'Ogni invio sbagliato è un errore che resta.'],
    [fa.FaClock, 'Rispetta le scadenze', 'Un solo termine senza risposta = esclusione e 4.'],
    [fa.FaKey, 'Il codice è solo tuo', 'Non darlo a nessuno, non usare quello degli altri.'],
    [fa.FaComments, 'Chiedi se hai dubbi', 'Al prof. Cerrato, in laboratorio o per mail, prima della scadenza.']];
  for (let i = 0; i < reg.length; i++) {
    const x = 0.6 + (i % 2) * 6.2, y = 1.5 + Math.floor(i / 2) * 1.75, colr = i === 3 ? HEX.red : HEX.a[i % 4];
    card(s, x, y, 5.9, 1.55, null, 'Regola ' + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.95, h: 0.95, fill: { color: colr }, line: { color: colr }, objectName: 'Icona regola ' + (i + 1) });
    s.addImage({ data: await icon(reg[i][0], 'FFFFFF'), x: x + 0.53, y: y + 0.53, w: 0.49, h: 0.49, altText: reg[i][1] });
    T(s, reg[i][1], { x: x + 1.5, y: y + 0.3, w: 4.2, h: 0.45, fontSize: 19, bold: true, color: C.text1 });
    T(s, reg[i][2], { x: x + 1.5, y: y + 0.8, w: 4.2, h: 0.6, fontSize: 15 });
  }

  /* 21 · Chiusura */
  s = pres.addSlide({ masterName: 'Scura', sectionTitle: 'Calendario e risultato' });
  s.addText('Scadenza: ' + giorno(SCAD), { placeholder: 'title' });
  s.addText('10 termini a testa · buon lavoro!', { placeholder: 'body' });
  T(s, 'ISTITUTO BARSANTI - SEDE SALVETTI · CLASSE ' + CL + ' · A.S. 2026/27', { x: 0.7, y: 1.1, w: 7.8, h: 0.4, fontSize: 12, bold: true, color: '9FB3C6', charSpacing: 1.5 });
  T(s, 'Domande?', { x: 0.7, y: 5.7, w: 7, h: 0.6, fontSize: 24, bold: true, color: C.background1 });
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
