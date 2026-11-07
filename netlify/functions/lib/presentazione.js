/**
 * Presentazione PowerPoint di riepilogo dell'intera attività (solo prof. Cerrato).
 * Generata sul server con pptxgenjs: grafici nativi, modificabili in PowerPoint.
 */
const PptxGenJS = require('pptxgenjs');
const DATI = require('./dati');
const logica = require('./logica');
const { righeAlunni } = require('./report');

const TZ = 'Europe/Rome';
const THEME = {
  name: 'Glossario 3E',
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  colors: { dk1: '15212B', lt1: 'FFFFFF', dk2: '2B3A47', lt2: 'EEF2F5', accent1: 'EA3628', accent2: '1F5FA8', accent3: '6B4FA0',
    accent4: 'B4511A', accent5: '2E7D32', accent6: 'D9A21B', hlink: '1F5FA8', folHlink: '6B4FA0' }
};
const K = { navy: '15212B', ink: '2B3A47', grey: '5B6976', line: 'DDE4EA', light: 'EEF2F5', red: 'EA3628', ok: '2E7D32', warn: 'D9A21B', bad: 'B0304A', empty: 'C3CED7' };
const AREA_COL = DATI.AREE.map((a) => a.colore.replace('#', ''));
const AREA_BREVE = ['Anatomia', 'Occlusione', 'Materiali', 'Laboratorio'];
let CLS = 'Classe 3E';
const FOOT = (en) => 'Glossario odontotecnico' + (en ? ' bilingue' : '') + ' · ' + CLS + ' · Istituto Barsanti - sede Salvetti';

/* ---------- utilità ---------- */
const parti = (ms) => { const p = {}; new Intl.DateTimeFormat('it-IT', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; }); return p; };
const giorno = (ms) => { const p = parti(ms); return p.year + '-' + p.month + '-' + p.day; };
const oraRoma = (ms) => Number(parti(ms).hour) % 24;
const dataLunga = (ms) => new Intl.DateTimeFormat('it-IT', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
const breve = (iso) => { const p = parti(Date.parse(iso)); return p.day + '/' + p.month; };
const num = (v, d) => v == null || isNaN(v) ? '-' : (Math.round(v * Math.pow(10, d == null ? 2 : d)) / Math.pow(10, d == null ? 2 : d)).toString().replace('.', ',');
const ore = (min) => min < 60 ? Math.round(min) + ' min' : num(min / 60, 1) + ' h';
const media = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
const mediana = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const campo = (t, l, n) => t[n + '_' + l];

/* ---------- dati ---------- */
function calcola(stato, attivita, now) {
  const righe = righeAlunni(stato, attivita, now);
  const imp = logica.impostazioni(stato.config);
  const aree = DATI.AREE.map((a) => String(a.n));
  const STATI = [['approvata', 'Approvata'], ['inviata', 'Da approvare'], ['correggere', 'Da rivedere'], ['', 'Senza risposta']];
  const avanz = {};
  const EN = imp.lingue.indexOf('en') >= 0;
  imp.lingue.forEach((l) => {
    avanz[l] = STATI.map(([s, nome]) => ({ name: nome, labels: AREA_BREVE, values: aree.map((n) => stato.termini.filter((t) => String(t.area) === n && (campo(t, l, 'stato') || '') === s).length) }));
  });
  const finali = righe.filter((x) => x.v.voto != null).map((x) => x.v.voto);
  const fasce = [['4', (v) => v < 4.25], ['4,25–5,75', (v) => v >= 4.25 && v < 6], ['6–6,75', (v) => v >= 6 && v < 7], ['7–7,75', (v) => v >= 7 && v < 8], ['8–8,75', (v) => v >= 8 && v < 9], ['9–10', (v) => v >= 9]];
  const istogramma = { labels: fasce.map((f) => f[0]), values: fasce.map((f) => finali.filter(f[1]).length) };
  // per area: voto medio IT/EN e % corrette al primo tentativo
  const perArea = aree.map((n) => {
    // voto di chi ha lavorato su termini di quest'area, pesato sul numero di termini
    const ts = stato.termini.filter((t) => String(t.area) === n);
    const r = []; righe.forEach((x) => x.miei.forEach((t) => { if (String(t.area) === n) r.push(x); }));
    const primo = (l) => { const f = ts.filter((t) => campo(t, l, 'primo_ok') != null); return f.length ? Math.round(100 * f.filter((t) => campo(t, l, 'primo_ok') === true).length / f.length) : 0; };
    return { votoIt: media(r.map((x) => x.v.votoIt).filter((v) => v != null)), votoEn: media(r.map((x) => x.v.votoEn).filter((v) => v != null)), primoIt: primo('it'), primoEn: primo('en') };
  });
  const difficili = stato.termini.map((t) => ({ t, err: (campo(t, 'it', 'errori') || 0) + (EN ? campo(t, 'en', 'errori') || 0 : 0) }))
    .filter((x) => x.err > 0).sort((a, b) => b.err - a.err || a.t.id.localeCompare(b.t.id)).slice(0, 8);
  // attività: giorno per giorno, fasce orarie, dispositivi
  const giorni = {}, fasciaOre = [0, 0, 0, 0, 0], disp = {};
  const FASCE_ORA = ['Notte 0–8', 'Mattina 8–13', 'Pomeriggio 13–18', 'Sera 18–21', 'Tarda sera 21–24'];
  const fasciaDi = (h) => h < 8 ? 0 : h < 13 ? 1 : h < 18 ? 2 : h < 21 ? 3 : 4;
  Object.keys(attivita).forEach((id) => (attivita[id].sessioni || []).forEach((s) => {
    const i = Date.parse(s.inizio), f = Date.parse(s.fine), g = giorno(i), min = Math.max(0, f - i) / 60000;
    giorni[g] = giorni[g] || { sessioni: 0, minuti: 0, alunni: new Set() };
    giorni[g].sessioni++; giorni[g].minuti += min; giorni[g].alunni.add(id);
    fasciaOre[fasciaDi(oraRoma(i))]++;
    const d = s.disp || 'non rilevato'; disp[d] = (disp[d] || 0) + 1;
  }));
  const chiavi = Object.keys(giorni).sort();
  let serie = [];
  if (chiavi.length) {
    // tutti i giorni dal primo all'ultimo (anche quelli senza accessi), al massimo gli ultimi 28
    const fine = Date.parse(chiavi[chiavi.length - 1] + 'T12:00:00Z');
    for (let x = Date.parse(chiavi[0] + 'T12:00:00Z'); x <= fine; x += 86400000) serie.push(new Date(x).toISOString().slice(0, 10));
    serie = serie.slice(-28);
  }
  const perGiorno = serie.map((g) => ({ g, etichetta: g.slice(8, 10) + '/' + g.slice(5, 7), minuti: giorni[g] ? Math.round(giorni[g].minuti) : 0, alunni: giorni[g] ? giorni[g].alunni.size : 0 }));
  const tot = (f) => righe.reduce((s, x) => s + f(x), 0);
  const nT = stato.termini.length;
  return {
    EN, righe, imp, avanz, istogramma, finali, perArea, difficili, perGiorno, fasciaOre, FASCE_ORA, disp,
    k: {
      mediaFinale: media(finali), mediana: mediana(finali), min: finali.length ? Math.min(...finali) : null, max: finali.length ? Math.max(...finali) : null,
      sufficienti: finali.filter((v) => v >= 6).length, valutati: finali.length,
      risposte: tot((x) => x.it.risposte + (EN ? x.en.risposte : 0)), possibili: nT * (EN ? 2 : 1),
      approvate: stato.termini.filter((t) => t.stato_it === 'approvata').length + (EN ? stato.termini.filter((t) => t.stato_en === 'approvata').length : 0),
      minuti: tot((x) => x.r.minuti), esclusi: righe.filter((x) => x.v.escluso).length, mai: righe.filter((x) => !x.r.ultimo).length,
      completiIt: righe.filter((x) => !x.v.escluso && x.miei.length && x.v.mancaIt === 0).length,
      completiEn: righe.filter((x) => !x.v.escluso && x.miei.length && x.v.mancaEn === 0).length,
      alunni: righe.length
    }
  };
}

/* ---------- grafici: stesso stile ovunque ---------- */
function stile(titolo, extra) {
  return Object.assign({
    showTitle: !!titolo, title: titolo || undefined, titleFontFace: '+mn-lt', titleFontSize: 13, titleColor: K.navy,
    catAxisLabelColor: K.grey, valAxisLabelColor: K.grey, catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt', catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
    valGridLine: { color: K.line, size: 0.75 }, catGridLine: { style: 'none' },
    dataLabelColor: K.ink, dataLabelFontFace: '+mn-lt', dataLabelFontSize: 10,
    legendFontFace: '+mn-lt', legendFontSize: 10, legendColor: K.ink
  }, extra || {});
}

/* ---------- presentazione ---------- */
async function creaPresentazione(stato, attivita, now) {
  now = now || Date.now();
  attivita = attivita || {};
  const CL = logica.nomeClassi(stato); CLS = CL.indexOf(' e ') > 0 ? 'Classi ' + CL : 'Classe ' + CL;
  const D = calcola(stato, attivita, now);
  const EN = D.EN, TPA = DATI.TERMINI_PER_ALUNNO, PERAREA = stato.termini.length / DATI.AREE.length;
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = 'Glossario ' + CL + ' - Report dell\'attività';
  pres.author = 'Prof. Danilo Cerrato';
  pres.company = 'Istituto Barsanti - sede Salvetti';

  const logo = (x, y, s) => [
    { rect: { x, y, w: s, h: s, fill: { color: K.red } } },
    { text: { text: 'B', options: { x, y, w: s, h: s, fontFace: 'Arial', bold: true, fontSize: Math.round(s * 46), color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 } } }
  ];
  pres.defineSlideMaster({
    title: 'Copertina', background: { color: K.navy },
    objects: logo(0.6, 0.6, 0.75).concat([
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.75, w: 8.8, h: 1.5, fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: 'FFFFFF', valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.4, w: 8.8, h: 1.6, fontFace: THEME.bodyFontFace, fontSize: 16, color: 'C9D3DB', valign: 'top', align: 'left', margin: 0 }, text: '' } }
    ])
  });
  pres.defineSlideMaster({
    title: 'Contenuto', background: { color: 'FFFFFF' },
    objects: logo(9.05, 0.32, 0.45).concat([
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.25, w: 8.3, h: 0.6, fontFace: THEME.headFontFace, fontSize: 26, bold: true, color: K.navy, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
      { text: { text: FOOT(EN), options: { x: 0.5, y: 5.25, w: 7.5, h: 0.25, fontFace: THEME.bodyFontFace, fontSize: 10, color: K.grey, margin: 0 } } }
    ]),
    slideNumber: { x: 9.0, y: 5.25, w: 0.5, h: 0.25, fontFace: THEME.bodyFontFace, fontSize: 10, color: K.grey, align: 'right' }
  });

  const sezione = (t) => pres.addSection({ title: t });
  const nuova = (sez, titolo) => { const s = pres.addSlide({ masterName: 'Contenuto', sectionTitle: sez }); s.addText(titolo, { placeholder: 'title' }); return s; };
  const card = (s, x, y, w, h, nome, fill) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill || K.light }, line: { color: fill || K.light }, objectName: nome });
  const stat = (s, x, y, w, valore, etichetta, nome, colore) => {
    card(s, x, y, w, 1.45, nome);
    s.addText(valore, { x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.75, fontFace: THEME.headFontFace, fontSize: 32, bold: true, color: colore || K.navy, margin: 0, isTextBox: true, objectName: nome + ' valore', fit: 'shrink' });
    s.addText(etichetta, { x: x + 0.15, y: y + 0.9, w: w - 0.3, h: 0.45, fontSize: 11, color: K.grey, margin: 0, valign: 'top', isTextBox: true, objectName: nome + ' etichetta' });
  };
  const k = D.k;

  /* 1. copertina */
  sezione('Apertura');
  let s = pres.addSlide({ masterName: 'Copertina', sectionTitle: 'Apertura' });
  s.addText(EN ? 'Glossario odontotecnico bilingue' : 'Glossario odontotecnico', { placeholder: 'title' });
  s.addText([
    { text: 'Report dell\'attività · ' + CLS + ' · a.s. 2026/27', options: { bold: true, color: 'FFFFFF', breakLine: true } },
    { text: EN ? 'Prof. Danilo Cerrato (Laboratorio odontotecnico) · Prof.ssa Federica Aliboni (Inglese tecnico)' : 'Prof. Danilo Cerrato · Laboratorio odontotecnico', options: { breakLine: true } },
    { text: 'Istituto Barsanti - sede Salvetti · aggiornato a ' + dataLunga(now), options: { fontSize: 13 } }
  ], { placeholder: 'body' });
  s.addNotes('Report generato automaticamente dall\'app del glossario: i numeri sono quelli del momento in cui è stato creato.');

  /* 2. in sintesi */
  sezione('Sintesi');
  s = nuova('Sintesi', (CLS.indexOf('Classi') === 0 ? 'Le classi' : 'La classe') + ' in cinque numeri');
  const w5 = (9 - 4 * 0.2) / 5;
  [[num(k.mediaFinale), 'voto finale medio (' + k.valutati + ' valutati)', K.navy],
    [Math.round(100 * k.risposte / k.possibili) + '%', 'risposte date (' + k.risposte + ' su ' + k.possibili + ')', K.navy],
    [Math.round(100 * k.approvate / k.possibili) + '%', 'definizioni approvate (' + k.approvate + ' su ' + k.possibili + ')', K.ok],
    [ore(k.minuti), 'tempo totale nell\'app', K.navy],
    [String(k.esclusi), k.esclusi === 1 ? 'alunno escluso' : 'alunni esclusi', k.esclusi ? K.bad : K.ok]
  ].forEach((x, i) => stat(s, 0.5 + i * (w5 + 0.2), 1.15, w5, x[0], x[1], 'Numero ' + (i + 1), x[2]));
  const frasi = [
    EN ? k.completiIt + ' alunni su ' + k.alunni + ' hanno risposto a tutti i termini in italiano, ' + k.completiEn + ' anche in inglese.' : k.completiIt + ' alunni su ' + k.alunni + ' hanno risposto a tutti i loro termini.',
    k.valutati ? k.sufficienti + ' su ' + k.valutati + ' hanno un voto finale di almeno 6.' : (EN ? 'Nessun alunno ha ancora un voto finale: servono risposte sia in italiano sia in inglese.' : 'Nessun alunno ha ancora un voto: compare dalla prima risposta.'),
    k.mai ? k.mai + (k.mai === 1 ? ' alunno non è mai entrato' : ' alunni non sono mai entrati') + ' nell\'app.' : 'Tutti gli alunni sono entrati almeno una volta nell\'app.'
  ];
  card(s, 0.5, 2.9, 9, 2.1, 'Riquadro sintesi', 'FFFFFF');
  s.addText(frasi.map((f, i) => ({ text: f, options: { bullet: true, breakLine: i < frasi.length - 1 } })), { x: 0.6, y: 3.0, w: 8.8, h: 1.9, fontSize: 16, color: K.ink, paraSpaceAfter: 10, valign: 'top', isTextBox: true, objectName: 'Frasi chiave' });
  s.addNotes(frasi.join(' '));

  /* 3. avanzamento per area */
  sezione('Avanzamento e voti');
  s = nuova('Avanzamento e voti', 'Avanzamento per area');
  const COL_ST = [K.ok, K.warn, K.bad, K.empty];
  (EN ? [['it', 'Italiano', 0.5, 4.4], ['en', 'Inglese', 5.1, 4.4]] : [['it', '', 0.5, 9]]).forEach(([l, nome, x, w]) => {
    s.addChart(pres.charts.BAR, D.avanz[l], stile((nome ? nome + ': stato' : 'Stato') + ' dei ' + PERAREA + ' termini di ogni area', {
      x, y: 1.0, w, h: 4.1, barDir: 'bar', barGrouping: 'stacked', chartColors: COL_ST, showLegend: true, legendPos: 'b',
      showValue: true, dataLabelPosition: 'ctr', dataLabelColor: 'FFFFFF', dataLabelFormatCode: '0;;;', valAxisMaxVal: PERAREA, valAxisMajorUnit: 5, catAxisOrientation: 'maxMin', objectName: 'Avanzamento ' + (nome || 'aree')
    }));
  });
  s.addNotes('Ogni barra è un\'area con i suoi ' + PERAREA + ' termini: verde approvati, giallo in attesa di approvazione, rosso rimandati all\'alunno, grigio senza risposta.');

  /* 4. distribuzione dei voti */
  s = nuova('Avanzamento e voti', 'Distribuzione dei voti finali');
  s.addChart(pres.charts.BAR, [{ name: 'Alunni', labels: D.istogramma.labels, values: D.istogramma.values }], stile('Numero di alunni per fascia di voto', {
    x: 0.5, y: 1.0, w: 5.9, h: 4.1, barDir: 'col', chartColors: [K.navy], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0;;;', showLegend: false, valAxisMajorUnit: 1, valAxisLabelFormatCode: '0', barGapWidthPct: 40, objectName: 'Istogramma voti'
  }));
  [[num(k.mediaFinale), 'media'], [num(k.mediana), 'mediana'], [num(k.min) + ' – ' + num(k.max), 'voto più basso e più alto'], [k.sufficienti + '/' + k.valutati, 'con almeno 6']].forEach((x, i) => {
    const y = 1.0 + i * 1.05;
    card(s, 6.7, y, 2.8, 0.9, 'Statistica ' + (i + 1));
    s.addText(x[0], { x: 6.85, y: y + 0.08, w: 2.5, h: 0.5, fontFace: THEME.headFontFace, fontSize: 24, bold: true, color: K.navy, margin: 0, isTextBox: true, objectName: 'Statistica valore ' + (i + 1) });
    s.addText(x[1], { x: 6.85, y: y + 0.56, w: 2.5, h: 0.28, fontSize: 11, color: K.grey, margin: 0, isTextBox: true, objectName: 'Statistica etichetta ' + (i + 1) });
  });

  /* 5. voto per alunno */
  s = nuova('Avanzamento e voti', 'Voto finale di ogni alunno');
  const ord = D.righe.slice().sort((a, b) => (b.v.voto == null ? -1 : b.v.voto) - (a.v.voto == null ? -1 : a.v.voto) || a.a.nome.localeCompare(b.a.nome));
  const nomeBreve = (n) => { const p = n.split(' '); return n.length > 22 ? p[0] + ' ' + p[p.length - 1] : n; };
  const colVoto = (x) => x.v.escluso ? K.bad : x.v.voto == null ? K.empty : x.v.voto < 6 ? K.warn : K.navy;
  s.addChart(pres.charts.BAR, [{ name: 'Voto finale', labels: ord.map((x) => nomeBreve(x.a.nome)), values: ord.map((x) => x.v.voto || 0) }], stile('', {
    x: 0.5, y: 0.95, w: 6.6, h: 4.2, barDir: 'bar', catAxisOrientation: 'maxMin', chartColors: ord.map(colVoto), showLegend: false,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0#;;;', valAxisMinVal: 0, valAxisMaxVal: 10, valAxisMajorUnit: 2, barGapWidthPct: 30, objectName: 'Voti per alunno'
  }));
  card(s, 7.35, 0.95, 2.15, 4.2, 'Legenda voti');
  const leg = [[K.navy, '6 o più'], [K.warn, 'sotto 6'], [K.bad, 'escluso (4)'], [K.empty, 'voto non ancora disponibile']];
  leg.forEach((l, i) => {
    s.addShape(pres.shapes.OVAL, { x: 7.55, y: 1.25 + i * 0.6, w: 0.22, h: 0.22, fill: { color: l[0] }, line: { color: l[0] }, objectName: 'Legenda punto ' + (i + 1) });
    s.addText(l[1], { x: 7.9, y: 1.14 + i * 0.6, w: 1.5, h: 0.45, fontSize: 12, color: K.ink, valign: 'middle', margin: 0, isTextBox: true, objectName: 'Legenda testo ' + (i + 1) });
  });
  s.addText(EN ? 'Voto IT e voto EN di ciascuno: nel tabellone in fondo.' : 'Risposte, errori e accessi di ciascuno: nel tabellone in fondo.', { x: 7.5, y: 3.8, w: 1.9, h: 1.2, fontSize: 11, color: K.grey, valign: 'top', margin: 0, isTextBox: true, objectName: 'Rimando tabellone' });
  s.addNotes((EN ? 'Barre a 0 = voto non ancora disponibile (mancano risposte in una delle due lingue). ' : 'Barre a 0 = voto non ancora disponibile (nessuna risposta inviata). ') +
    ord.map((x) => x.a.nome + ': ' + num(x.v.voto)).join('; ') + '.');

  /* 6. risultati per area (con l'inglese: italiano e inglese a confronto) */
  if (EN) {
    s = nuova('Avanzamento e voti', 'Italiano e inglese a confronto');
    s.addChart(pres.charts.BAR, [
      { name: 'Italiano', labels: AREA_BREVE, values: D.perArea.map((a) => a.votoIt ? Math.round(a.votoIt * 100) / 100 : 0) },
      { name: 'Inglese', labels: AREA_BREVE, values: D.perArea.map((a) => a.votoEn ? Math.round(a.votoEn * 100) / 100 : 0) }
    ], stile('Voto medio per area', { x: 0.5, y: 1.0, w: 4.4, h: 4.1, barDir: 'col', chartColors: [K.navy, K.red], showLegend: true, legendPos: 'b', showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0#', valAxisMinVal: 0, valAxisMaxVal: 10, valAxisMajorUnit: 2, objectName: 'Voto medio per area' }));
    s.addChart(pres.charts.BAR, [
      { name: 'Italiano', labels: AREA_BREVE, values: D.perArea.map((a) => a.primoIt) },
      { name: 'Inglese', labels: AREA_BREVE, values: D.perArea.map((a) => a.primoEn) }
    ], stile('Scelte giuste al primo tentativo (%)', { x: 5.1, y: 1.0, w: 4.4, h: 4.1, barDir: 'col', chartColors: [K.navy, K.red], showLegend: true, legendPos: 'b', showValue: true, dataLabelPosition: 'outEnd', valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25, objectName: 'Primo tentativo per area' }));
    s.addNotes('A sinistra il voto medio di italiano e inglese degli alunni di ogni area; a destra la percentuale di termini indovinati al primo invio, sul totale dei termini con almeno una risposta.');
  } else {
    s = nuova('Avanzamento e voti', 'Risultati per area');
    s.addChart(pres.charts.BAR, [{ name: 'Voto medio', labels: AREA_BREVE, values: D.perArea.map((a) => a.votoIt ? Math.round(a.votoIt * 100) / 100 : 0) }],
      stile('Voto medio di chi ha lavorato sull\'area', { x: 0.5, y: 1.0, w: 4.4, h: 4.1, barDir: 'col', chartColors: AREA_COL, showLegend: false, showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0#;;;', valAxisMinVal: 0, valAxisMaxVal: 10, valAxisMajorUnit: 2, objectName: 'Voto medio per area' }));
    s.addChart(pres.charts.BAR, [{ name: 'Al primo tentativo', labels: AREA_BREVE, values: D.perArea.map((a) => a.primoIt) }],
      stile('Scelte giuste al primo tentativo (%)', { x: 5.1, y: 1.0, w: 4.4, h: 4.1, barDir: 'col', chartColors: AREA_COL, showLegend: false, showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0;;;', valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25, objectName: 'Primo tentativo per area' }));
    s.addNotes('A sinistra il voto medio degli alunni di ogni area; a destra la percentuale di termini indovinati al primo invio, sul totale dei termini con almeno una risposta.');
  }

  /* 7. termini difficili */
  s = nuova('Avanzamento e voti', 'I termini più difficili');
  if (D.difficili.length) {
    const lab = D.difficili.map((x) => EN && x.t.termine_en ? x.t.termine_it + ' / ' + x.t.termine_en : x.t.termine_it);
    s.addChart(pres.charts.BAR, [
      { name: 'Errori in italiano', labels: lab, values: D.difficili.map((x) => campo(x.t, 'it', 'errori') || 0) }
    ].concat(EN ? [{ name: 'Errori in inglese', labels: lab, values: D.difficili.map((x) => campo(x.t, 'en', 'errori') || 0) }] : []), stile('Scelte sbagliate per termine', { x: 0.5, y: 1.0, w: 6.2, h: 4.1, barDir: 'bar', barGrouping: 'stacked', catAxisOrientation: 'maxMin', chartColors: [K.navy, K.red], showLegend: EN, legendPos: 'b', showValue: true, dataLabelPosition: 'ctr', dataLabelColor: 'FFFFFF', dataLabelFormatCode: '0;;;', valAxisMajorUnit: 1, valAxisLabelFormatCode: '0', objectName: 'Termini difficili' }));
    card(s, 6.95, 1.0, 2.55, 4.1, 'Commento termini');
    const top = D.difficili[0];
    s.addText([
      { text: 'Da riprendere in classe', options: { bold: true, fontSize: 14, color: K.navy, breakLine: true } },
      { text: '"' + top.t.termine_it + '" ha raccolto ' + top.err + (top.err === 1 ? ' errore' : ' errori') + '.', options: { fontSize: 13, color: K.ink, breakLine: true } },
      { text: 'Area più colpita: ' + AREA_BREVE[Number(top.t.area) - 1] + '.', options: { fontSize: 13, color: K.ink } }
    ], { x: 7.1, y: 1.15, w: 2.25, h: 3.8, valign: 'top', paraSpaceAfter: 8, isTextBox: true, objectName: 'Testo termini' });
  } else {
    card(s, 0.5, 1.2, 9, 1.4, 'Nessun errore');
    s.addText('Nessuna scelta sbagliata registrata finora: il grafico dei termini più difficili comparirà con i primi errori.', { x: 0.7, y: 1.3, w: 8.6, h: 1.2, fontSize: 16, color: K.ink, valign: 'middle', isTextBox: true, objectName: 'Testo nessun errore' });
  }

  /* 8. partecipazione */
  sezione('Partecipazione');
  s = nuova('Partecipazione', 'Partecipazione giorno per giorno');
  if (D.perGiorno.length) {
    const lab = D.perGiorno.map((g) => g.etichetta);
    s.addChart(pres.charts.BAR, [{ name: 'Minuti', labels: lab, values: D.perGiorno.map((g) => g.minuti) }], stile('Minuti di app aperta (tutta la classe)', {
      x: 0.5, y: 1.0, w: 9, h: 2.05, barDir: 'col', chartColors: [K.navy], showLegend: false, showValue: D.perGiorno.length <= 14, dataLabelPosition: 'outEnd', valAxisLabelFormatCode: '0', barGapWidthPct: 30, objectName: 'Minuti per giorno'
    }));
    s.addChart(pres.charts.LINE, [{ name: 'Alunni', labels: lab, values: D.perGiorno.map((g) => g.alunni) }], stile('Alunni entrati nell\'app', {
      x: 0.5, y: 3.1, w: 9, h: 2.05, chartColors: [K.red], showLegend: false, lineSize: 2, lineDataSymbol: 'circle', lineDataSymbolSize: 6, showValue: D.perGiorno.length <= 14, dataLabelPosition: 't', valAxisMinVal: 0, valAxisMaxVal: k.alunni, valAxisMajorUnit: 4, objectName: 'Alunni per giorno'
    }));
  } else {
    card(s, 0.5, 1.2, 9, 1.4, 'Nessun accesso');
    s.addText('Nessun accesso registrato finora: i grafici si riempiono man mano che gli alunni usano l\'app.', { x: 0.7, y: 1.3, w: 8.6, h: 1.2, fontSize: 16, color: K.ink, valign: 'middle', isTextBox: true, objectName: 'Testo nessun accesso' });
  }

  /* 9. tempo e voto */
  s = nuova('Partecipazione', 'Tempo nell\'app e risultati');
  const conVoto = D.righe.filter((x) => x.v.voto != null && x.r.ultimo && !x.v.escluso);
  if (conVoto.length >= 2) {
    s.addChart(pres.charts.SCATTER, [{ name: 'Minuti', values: conVoto.map((x) => x.r.minuti) }, { name: 'Voto finale', values: conVoto.map((x) => x.v.voto) }], stile('Minuti nell\'app (asse orizzontale) e voto finale', {
      x: 0.5, y: 1.0, w: 5.6, h: 4.1, chartColors: [K.navy], showLegend: false, lineSize: 0, lineDataSymbol: 'circle', lineDataSymbolSize: 9, valAxisMinVal: 4, valAxisMaxVal: 10, valAxisMajorUnit: 1, objectName: 'Tempo e voto'
    }));
  } else {
    card(s, 0.5, 1.0, 5.6, 4.1, 'Grafico tempo voto vuoto');
    s.addText('Il confronto tra tempo nell\'app e voto compare quando almeno due alunni non esclusi hanno un voto finale.', { x: 0.7, y: 1.2, w: 5.2, h: 3.7, fontSize: 15, color: K.ink, valign: 'middle', isTextBox: true, objectName: 'Testo tempo voto' });
  }
  const perTempo = D.righe.slice().sort((a, b) => b.r.minuti - a.r.minuti);
  card(s, 6.4, 1.0, 3.1, 4.1, 'Classifica tempo');
  const piu = perTempo.filter((x) => x.r.minuti > 0).slice(0, 3), meno = D.righe.filter((x) => !x.r.ultimo).concat(perTempo.filter((x) => x.r.ultimo).slice(-3).reverse()).slice(0, 4);
  const righeTesto = [{ text: 'Più presenti', options: { bold: true, color: K.navy, fontSize: 14, breakLine: true } }]
    .concat(piu.length ? piu.map((x) => ({ text: nomeBreve(x.a.nome) + ': ' + ore(x.r.minuti), options: { fontSize: 13, color: K.ink, breakLine: true } })) : [{ text: 'nessun dato', options: { fontSize: 13, color: K.grey, breakLine: true } }])
    .concat([{ text: 'Meno presenti', options: { bold: true, color: K.bad, fontSize: 14, breakLine: true } }])
    .concat(meno.map((x, i) => ({ text: nomeBreve(x.a.nome) + ': ' + (x.r.ultimo ? ore(x.r.minuti) : 'mai entrato'), options: { fontSize: 13, color: K.ink, breakLine: i < meno.length - 1 } })));
  s.addText(righeTesto, { x: 6.55, y: 1.15, w: 2.8, h: 3.8, valign: 'top', paraSpaceAfter: 4, isTextBox: true, objectName: 'Testo classifica tempo' });
  s.addNotes('Ogni punto è un alunno (esclusi non compresi). Il tempo è quello con l\'app aperta e in primo piano: misura la presenza, non lo studio fatto altrove (libro, appunti).');

  /* 10. quando e come */
  s = nuova('Partecipazione', 'Quando e con cosa lavorano');
  s.addChart(pres.charts.BAR, [{ name: 'Sessioni', labels: D.FASCE_ORA, values: D.fasciaOre }], stile('Sessioni per fascia oraria', {
    x: 0.5, y: 1.0, w: 5.4, h: 4.1, barDir: 'col', chartColors: [K.navy], showLegend: false, showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0;;;', valAxisLabelFormatCode: '0', barGapWidthPct: 40, objectName: 'Fasce orarie'
  }));
  const dk = Object.keys(D.disp);
  if (dk.length) {
    s.addChart(pres.charts.DOUGHNUT, [{ name: 'Dispositivi', labels: dk, values: dk.map((x) => D.disp[x]) }], stile('Dispositivi usati', {
      x: 6.1, y: 1.0, w: 3.4, h: 4.1, chartColors: [K.navy, K.red, '8FA3B5', K.warn], showLegend: true, legendPos: 'b', showPercent: true, showValue: false, holeSize: 55, dataLabelColor: 'FFFFFF', objectName: 'Dispositivi'
    }));
  } else {
    card(s, 6.1, 1.0, 3.4, 4.1, 'Dispositivi vuoto');
    s.addText('Nessun dispositivo registrato.', { x: 6.3, y: 1.2, w: 3.0, h: 3.7, fontSize: 14, color: K.grey, valign: 'middle', isTextBox: true, objectName: 'Testo dispositivi' });
  }

  /* 11. scadenze, esclusioni, riassegnazioni */
  sezione('Regole e voti');
  s = nuova('Regole e voti', 'Scadenze, esclusioni e riassegnazioni');
  const sc = EN ? [['Scadenza italiano', D.imp.scadenzaIt], ['Scadenza inglese', D.imp.scadenzaEn]] : [['Scadenza per tutti i termini', D.imp.scadenzaIt], ['Chi riceve i termini di un escluso', null]];
  sc.forEach((x, i) => {
    card(s, 0.5 + i * 4.6, 1.0, 4.4, 0.85, 'Scadenza ' + (i + 1));
    s.addText([{ text: x[0], options: { fontSize: 11, color: K.grey, breakLine: true } }, { text: x[1] ? dataLunga(Date.parse(x[1])) + (now > Date.parse(x[1]) ? ' (passata)' : '') : D.imp.giorniIt + ' giorni per rispondere, voto massimo ' + num(D.imp.votoMaxErede), options: { fontSize: 15, bold: true, color: K.navy } }],
      { x: 0.65 + i * 4.6, y: 1.05, w: 4.1, h: 0.75, valign: 'middle', margin: 0, isTextBox: true, objectName: 'Testo scadenza ' + (i + 1) });
  });
  const esclusi = D.righe.filter((x) => x.v.escluso || x.v.riammesso);
  if (esclusi.length) {
    const nome = (id) => { const a = stato.alunni.find((y) => y.id === id); return a ? a.nome : '-'; };
    const H = { bold: true, color: 'FFFFFF', fill: { color: K.navy }, fontSize: 11 };
    const rows = [[{ text: 'Escluso', options: H }, { text: 'Motivo', options: H }, { text: 'Termini passati a', options: H }, { text: 'Esito di chi li ha ricevuti', options: H }]].concat(esclusi.slice(0, 4).map((x) => {
      const er = D.righe.find((y) => y.a.id === x.v.riassegnatoA);
      return [x.a.nome + (x.v.riammesso ? ' (riammesso)' : ''), (x.v.motivo || '-').replace(' alla scadenza', ''), x.v.riassegnatoA ? nome(x.v.riassegnatoA) : 'non ancora riassegnati',
        er ? 'voto ' + num(er.v.voto) + ' su ' + num(er.v.votoMax) + (er.v.tetto ? ', limitato a 6' : '') : '-'].map((t) => ({ text: String(t), options: { fontSize: 11, color: K.ink } }));
    }));
    s.addTable(rows, { x: 0.5, y: 2.1, w: 9, colW: [2.2, 2.9, 2.0, 1.9], border: { type: 'solid', pt: 0.5, color: K.line }, fill: { color: 'FFFFFF' }, margin: 0.05, objectName: 'Tabella esclusioni' });
  } else {
    card(s, 0.5, 2.1, 9, 1.2, 'Nessuna esclusione', 'E8F3E9');
    s.addText('Nessuna esclusione: finora tutti hanno rispettato le scadenze.', { x: 0.7, y: 2.2, w: 8.6, h: 1.0, fontSize: 16, bold: true, color: K.ok, valign: 'middle', isTextBox: true, objectName: 'Testo nessuna esclusione' });
  }
  if (esclusi.length > 4) s.addText('E altri ' + (esclusi.length - 4) + ': ' + esclusi.slice(4).map((x) => x.a.nome).join(', ') + '.', { x: 0.5, y: 4.35, w: 9, h: 0.4, fontSize: 11, color: K.grey, isTextBox: true, objectName: 'Altri esclusi', margin: 0 });
  const tetti = D.righe.filter((x) => x.v.tetto);
  if (tetti.length) s.addText('Voto limitato a 6 per ritardo sui termini ricevuti: ' + tetti.map((x) => x.a.nome).join(', ') + '.', { x: 0.5, y: 4.8, w: 9, h: 0.35, fontSize: 12, color: K.bad, isTextBox: true, objectName: 'Testo tetto', margin: 0 });

  /* 12. tabellone */
  const H2 = { bold: true, color: 'FFFFFF', fill: { color: K.navy }, fontSize: 10, valign: 'middle' };
  const cel = (t, o) => ({ text: String(t), options: Object.assign({ fontSize: 10, color: K.ink, valign: 'middle' }, o || {}) });
  // un tabellone per classe (al massimo 18 righe per slide)
  const blocchi = [];
  const classiT = []; D.righe.forEach((x) => { const c = logica.classeDi(x.a); if (classiT.indexOf(c) < 0) classiT.push(c); });
  classiT.sort().forEach((c) => { const r = D.righe.filter((x) => logica.classeDi(x.a) === c); for (let i = 0; i < r.length; i += 18) blocchi.push({ c, r: r.slice(i, i + 18), parte: r.length > 18 ? Math.floor(i / 18) + 1 : 0 }); });
  if (!blocchi.length) blocchi.push({ c: '', r: [], parte: 0 });
  blocchi.forEach((B) => {
  s = nuova('Regole e voti', 'Tabellone dei voti' + (classiT.length > 1 ? ' · ' + B.c : '') + (B.parte ? ' (' + B.parte + ')' : ''));
  const tab = [(EN ? ['Alunno', 'Classe', 'Voto IT', 'Voto EN', 'Finale', 'Risposte', 'Accessi', 'Tempo', 'Stato'] : ['Alunno', 'Classe', 'Risposte', 'Approvate', 'Errori', 'Voto', 'Accessi', 'Tempo', 'Stato']).map((t, i) => ({ text: t, options: Object.assign({}, H2, { align: i ? 'center' : 'left' }) }))]
    .concat(B.r.map((x, i) => {
      const f = i % 2 ? { fill: { color: 'F7F9FA' } } : {};
      const c = (v, o) => cel(v, Object.assign({ align: 'center' }, o || {}, f));
      if (!EN) return [cel(x.a.nome, f), c(logica.etichettaAl(x.a)), c(x.it.risposte + '/' + x.miei.length), c(x.it.approvate + '/' + x.miei.length), c(x.it.errori),
        c(num(x.v.voto) + (x.v.manuale != null ? '*' : ''), { bold: true }), c(x.r.accessi), c(x.r.ultimo ? ore(x.r.minuti) : '-'),
        cel(x.stato, Object.assign({ color: x.colore.replace('#', ''), bold: x.colore !== '#15212B' }, f))];
      return [cel(x.a.nome, f), cel(logica.etichettaAl(x.a), Object.assign({ align: 'center' }, f)), cel(num(x.v.votoIt), Object.assign({ align: 'center' }, f)), cel(num(x.v.votoEn), Object.assign({ align: 'center' }, f)),
        cel(num(x.v.voto) + (x.v.manuale != null ? '*' : ''), Object.assign({ align: 'center', bold: true }, f)), cel((x.it.risposte + x.en.risposte) + '/' + (x.miei.length * 2), Object.assign({ align: 'center' }, f)),
        cel(x.r.accessi, Object.assign({ align: 'center' }, f)), cel(x.r.ultimo ? ore(x.r.minuti) : '-', Object.assign({ align: 'center' }, f)),
        cel(x.stato, Object.assign({ color: x.colore.replace('#', ''), bold: x.colore !== '#15212B' }, f))];
    }));
  s.addTable(tab, { x: 0.5, y: 0.95, w: 9, colW: [2.35, 0.65, 0.75, 0.75, 0.7, 0.8, 0.7, 0.75, 1.55], rowH: 0.235, border: { type: 'solid', pt: 0.5, color: K.line }, margin: [0, 0.06, 0, 0.06], objectName: 'Tabellone' });
  s.addNotes('* = voto manuale inserito dal docente. Risposte = termini con almeno una risposta' + (EN ? ', italiano più inglese.' : '.'));
  });

  /* 13. criterio */
  s = nuova('Regole e voti', 'Come si calcola il voto');
  const VM = num(D.imp.votoMax), VE = num(D.imp.votoMaxErede);
  const regole = EN ? [[VM, 'Si parte da ' + VM + ' in italiano e in inglese; ' + (D.imp.proposta === 'A' ? '−0,25' : '−0,50') + ' per ogni scelta sbagliata, minimo 4'],
    ['½', 'Voto finale = media tra italiano e inglese, arrotondata al quarto di voto'],
    ['4', 'Chi a una scadenza ha termini senza risposta è escluso con voto 4'],
    [VE, 'Chi riceve i termini di un escluso può arrivare a ' + VE + '; se è in ritardo il voto finale non supera 6']] : [
    [VM, 'Si parte da ' + VM + '; ' + (D.imp.proposta === 'A' ? '−0,25' : '−0,50') + ' per ogni scelta sbagliata, senza scendere sotto 4'],
    ['IT', TPA + ' termini a testa, solo in italiano: per ognuno la definizione giusta tra 8'],
    ['4', 'Chi a una scadenza ha termini senza risposta è escluso con voto 4'],
    [VE, 'I termini di un escluso passano a un compagno della stessa classe, che può arrivare a ' + VE + '; se è in ritardo il voto finale non supera 6']];
  regole.forEach((r, i) => {
    const x = 0.5 + (i % 2) * 4.6, y = 1.15 + Math.floor(i / 2) * 1.95;
    card(s, x, y, 4.4, 1.55, 'Regola ' + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.42, w: 0.75, h: 0.75, fill: { color: i === 2 ? K.bad : i === 3 ? K.red : K.navy }, line: { color: 'FFFFFF' }, objectName: 'Cerchio regola ' + (i + 1) });
    s.addText(r[0], { x: x + 0.2, y: y + 0.42, w: 0.75, h: 0.75, fontFace: THEME.headFontFace, fontSize: r[0].length > 2 ? 17 : 22, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'Numero regola ' + (i + 1) });
    s.addText(r[1], { x: x + 1.15, y: y + 0.15, w: 3.1, h: 1.3, fontSize: 15, color: K.ink, valign: 'middle', margin: 0, isTextBox: true, objectName: 'Testo regola ' + (i + 1) });
  });
  s.addNotes('Criterio completo, come nel report: ' + logica.ratio(D.imp));

  const buf = await pres.write({ outputType: 'nodebuffer' });
  return applicaTema(buf);
}

/* scrive i colori del tema nel file (pptxgenjs lascia la tavolozza di Office) */
async function applicaTema(buf) {
  const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));
  const zip = await JSZip.loadAsync(buf, { createFolders: false });
  const part = 'ppt/theme/theme1.xml';
  const SLOTS = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
  const scheme = '<a:clrScheme name="' + THEME.name + '">' + SLOTS.map((k) => '<a:' + k + '><a:srgbClr val="' + THEME.colors[k] + '"/></a:' + k + '>').join('') + '</a:clrScheme>';
  const xml = (await zip.file(part).async('string')).replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme)
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, h) => h + THEME.name + '"');
  zip.file(part, xml);
  // niente voci-cartella nello zip (danno problemi con OneDrive/SharePoint)
  Object.keys(zip.files).forEach((k) => { if (zip.files[k].dir) delete zip.files[k]; });
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { creaPresentazione, calcola };
