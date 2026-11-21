/**
 * Report PDF automatico (generato sul server, senza browser): stato del lavoro, voti e attività di ogni alunno.
 */
const PDFDocument = require('pdfkit');
const OR = require('./orale');
const REG = require('./regole');
const DATI = require('./dati');
const logica = require('./logica');
const ATT = require('./attivita');

const SCURO = '#15212B', GRIGIO = '#5B6976', LINEA = '#C3CED7', CHIARO = '#EEF2F5', ROSSO = '#B0304A', VERDE = '#1B6E20', ARANCIO = '#B4570B';
const TZ = 'Europe/Rome';
const GG = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

function parti(ms) {
  const p = {};
  new Intl.DateTimeFormat('it-IT', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
    .formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
  return p;
}
function quando(iso, conGiorno) {
  if (!iso) return '-';
  const ms = Date.parse(iso); if (isNaN(ms)) return String(iso);
  const p = parti(ms), d = new Date(new Date(ms).toLocaleString('en-US', { timeZone: TZ }));
  return (conGiorno === false ? '' : GG[d.getDay()] + ' ') + p.day + '/' + p.month + ' ' + p.hour + ':' + p.minute;
}
function soloData(iso) { const p = parti(Date.parse(iso)); return p.day + '/' + p.month + '/' + p.year; }
function ora(iso) { const p = parti(Date.parse(iso)); return p.hour + ':' + p.minute; }
function durata(min) { if (min == null) return '-'; if (min < 1) return '< 1 min'; const h = Math.floor(min / 60), m = min % 60; return h ? h + ' h ' + (m ? m + ' min' : '') : m + ' min'; }
function fv(v) { return v == null ? '-' : String(Math.round(v * 1000) / 1000).replace('.', ','); }
const campo = (t, l, n) => t[n + '_' + l];

/* dati per alunno */
function righeAlunni(stato, attivita, now) {
  const imp = logica.impostazioni(stato.config);
  return stato.alunni.map((a) => {
    const v = logica.valuta(stato, a, now);
    const r = Object.assign(ATT.riepilogo(attivita[a.id], now), logica.studioDi(Object.assign({}, stato, { attivita }), a, now));
    const miei = stato.termini.filter((t) => t.alunno_id === a.id);
    const conta = (l, cond) => miei.filter((t) => cond(t, l)).length;
    const lingua = (l) => ({ risposte: conta(l, (t) => campo(t, l, 'tent') > 0), approvate: conta(l, (t) => campo(t, l, 'stato') === 'approvata'),
      daApprovare: conta(l, (t) => campo(t, l, 'stato') === 'inviata'), errori: v[l].errate });
    let stato_ = 'In corso', colore = SCURO;
    if (v.escluso) { stato_ = 'Escluso'; colore = ROSSO; }
    else if (v.riammesso) { stato_ = 'Riammesso'; colore = ARANCIO; }
    else if (v.tetto) { stato_ = 'Tetto 6'; colore = ARANCIO; }
    else if (miei.length && v.mancaIt === 0 && v.mancaEn === 0) { stato_ = 'Tutto risposto'; colore = VERDE; }
    if (!v.escluso && v.ereditati) stato_ += ' · erede';
    return { a, v, r, miei, it: lingua('it'), en: lingua('en'), stato: stato_, colore, imp };
  });
}

function avvisi(righe, now, imp) {
  const out = [], mai = [];
  const tra = (iso) => (Date.parse(iso) - now) / 3600000;
  righe.forEach((x) => {
    const n = x.a.nome;
    if (x.v.escluso) { out.push([ROSSO, n + ': escluso (' + x.v.motivo + ').']); return; }
    if (!x.r.ultimo) mai.push(n);
    else if (x.r.giorniDaUltimo >= 3 && (x.v.mancaIt || x.v.mancaEn)) out.push([ARANCIO, n + ': ultimo accesso ' + x.r.giorniDaUltimo + ' giorni fa, mancano ancora ' + (x.v.mancaIt + x.v.mancaEn) + ' risposte.']);
    [['it', 'italiano'], ['en', 'inglese']].filter(([l]) => imp.lingue.indexOf(l) >= 0).forEach(([l, nome]) => {
      x.miei.forEach((t) => {
        if (campo(t, l, 'tent') > 0) return;
        const sc = campo(t, l, 'scad') || (l === 'it' ? imp.scadenzaIt : imp.scadenzaEn), h = tra(sc);
        if (h > 0 && h <= 72) out.push([ARANCIO, n + ': "' + (l === 'it' ? t.termine_it : t.termine_en) + '" senza risposta in ' + nome + ', scadenza ' + quando(sc) + (t.ereditato ? ' (termine ricevuto)' : '') + '.']);
      });
    });
    if (x.v.tetto) out.push([ARANCIO, n + ': voto finale limitato a 6 (' + x.v.motivoTetto + ').']);
  });
  if (mai.length) out.unshift([ROSSO, 'Mai entrati nell\'app (' + mai.length + '): ' + mai.join(', ') + '.']);
  return out.filter((x, i) => out.findIndex((y) => y[1] === x[1]) === i);
}

/* ---------- disegno ---------- */
function tabella(doc, x, y, colonne, righe, opz) {
  opz = opz || {};
  const fs = opz.fs || 8, pad = 3, larg = colonne.reduce((s, c) => s + c.w, 0);
  const fondo = () => doc.page.height - doc.page.margins.bottom - 14;
  const intest = () => {
    doc.font('Helvetica-Bold').fontSize(fs);
    const h = Math.max(...colonne.map((c) => doc.heightOfString(c.t, { width: c.w - 2 * pad }))) + 2 * pad;
    doc.rect(x, y, larg, h).fill(SCURO);
    let cx = x; colonne.forEach((c) => { doc.fillColor('#fff').text(c.t, cx + pad, y + pad, { width: c.w - 2 * pad, align: c.a || 'left' }); cx += c.w; });
    y += h;
  };
  intest();
  righe.forEach((r, i) => {
    doc.font('Helvetica').fontSize(fs);
    const h = Math.max(...colonne.map((c, j) => { const cel = r[j]; doc.font(cel && cel.b ? 'Helvetica-Bold' : 'Helvetica'); return doc.heightOfString(String(cel && cel.t != null ? cel.t : cel == null ? '' : cel), { width: c.w - 2 * pad }); })) + 2 * pad;
    if (y + h > fondo()) { doc.addPage({ layout: opz.layout || 'portrait', margin: 36 }); y = doc.page.margins.top; intest(); }
    if (i % 2) doc.rect(x, y, larg, h).fill('#F7F9FA');
    let cx = x;
    colonne.forEach((c, j) => {
      const cel = r[j], testo = String(cel && cel.t != null ? cel.t : cel == null ? '' : cel);
      doc.font(cel && cel.b ? 'Helvetica-Bold' : 'Helvetica').fillColor(cel && cel.c ? cel.c : SCURO).text(testo, cx + pad, y + pad, { width: c.w - 2 * pad, align: c.a || 'left' });
      cx += c.w;
    });
    doc.moveTo(x, y + h).lineTo(x + larg, y + h).lineWidth(0.4).strokeColor(LINEA).stroke();
    y += h;
  });
  return y;
}

/* logo della scuola: lo stesso disegno vettoriale dell'app (Poster.logo), viewBox 100×100 */
const LOGO_TESTI = [
  ['BARSANTI', 15, 15.5, 66, 17, 0], ['SALVETTI', 15, 98, 65, 17, 0],
  ['FIORILLO', 83.5, 19, 64, 17, 90], ['EINAUDI', 16.5, 84, 63, 17, -90], ['B', 19, 81, 61, 88, 0]
];
function logoScuola(doc, x, y, lato) {
  doc.save();
  doc.translate(x, y).scale(lato / 100);
  doc.rect(0, 0, 100, 100).fill('#EA3628');
  doc.font('Helvetica-Bold').fillColor('#fff');
  LOGO_TESTI.forEach(([t, tx, ty, L, fs, rot]) => {
    doc.save();
    doc.translate(tx, ty);
    if (rot) doc.rotate(rot, { origin: [0, 0] });
    doc.fontSize(fs);
    doc.scale(L / doc.widthOfString(t), 1, { origin: [0, 0] });
    doc.text(t, 0, 0, { baseline: 'alphabetic', lineBreak: false });
    doc.restore();
  });
  doc.restore();
}
/* riquadri con le statistiche di classe del quiz (pagina «Quiz, interrogazione orale e voto finale») */
function quizClasse(doc, y, el, RR, cqz, tq) {
  const W = doc.page.width - 72, H = 220;
  if (y > doc.page.height - 36 - H - 20) { doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 }); y = 40; }
  doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Quiz: dati della classe', 36, y); y = doc.y + 5;
  const n = el.length || 1, pc = (k) => Math.round(k / n * 100) + '%';
  const conta = (st) => el.filter((e) => e.q.stato === st).length;
  const iniz = el.filter((e) => e.q.sessioni), ni = iniz.length;
  const giorniDi = (e) => { const g = {}; ((e.x.a.quiz && e.x.a.quiz.sessioni) || []).forEach((s) => { const p = parti(Date.parse(s.i)); g[p.year + p.month + p.day] = 1; }); return Object.keys(g).length; };
  const supM = el.filter((e) => e.q.msSup != null), mSup = supM.length ? supM.reduce((s, e) => s + e.q.msSup, 0) / supM.length : null;
  const msTot = iniz.reduce((s, e) => s + e.q.ms, 0), sesTot = iniz.reduce((s, e) => s + e.q.sessioni, 0);
  const risp = iniz.reduce((s, e) => s + e.q.risposte, 0), corr = iniz.reduce((s, e) => s + e.q.corrette, 0);
  const media = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const f1 = (v) => (v == null ? '-' : String(Math.round(v * 10) / 10).replace('.', ','));
  // coerenza quiz-orale
  const amm = el.filter((e) => e.q.superata), int = amm.filter((e) => e.x.v.orale && e.x.v.orale.voto != null);
  const mOr = media(int.map((e) => e.x.v.orale.voto));
  const medS = media(int.map((e) => e.q.sessioni));
  const pochi = int.filter((e) => e.q.sessioni <= medS), tanti = int.filter((e) => e.q.sessioni > medS);
  const bassi = int.filter((e) => e.x.v.orale.voto < 6);
  // regolarità
  const piuDisp = el.filter((e) => e.q.dispositivi > 1).length, conSub = el.filter((e) => e.q.subentri > 0), sub = conSub.reduce((s, e) => s + e.q.subentri, 0);
  const box = [
    ['Esito', [['Ammessi all\'orale', conta('superato') + '  (' + pc(conta('superato')) + ')', VERDE], ['Non ammessi (scaduto)', conta('scaduto') + '  (' + pc(conta('scaduto')) + ')', ARANCIO], ['In corso', conta('in corso') + '  (' + pc(conta('in corso')) + ')'], ['Non ancora iniziato', String(conta('non iniziato') + conta('chiuso'))], ['Soglia', cqz.soglia + ' termini su ' + cqz.totale]]],
    ['Impegno', [['Tempo totale nel quiz', ni ? tq(msTot) : '-'], ['Tempo medio per alunno', ni ? tq(msTot / ni) : '-'], ['Tempo medio per superarlo', mSup != null ? tq(mSup) + (supM.length ? '  (' + f1(media(supM.map((e) => e.q.giorniSup))) + ' gg)' : '') : '-'], ['Sessioni medie per alunno', f1(ni ? sesTot / ni : null)], ['Giorni di attività (media)', f1(media(iniz.map(giorniDi)))], ['Risposte corrette', risp ? Math.round(corr / risp * 100) + '% di ' + risp : '-']]],
    ['Coerenza quiz-orale', [['Ammessi già interrogati', int.length + ' su ' + amm.length], ['Voto orale medio', f1(mOr)], ['Con meno sessioni della media', pochi.length ? 'orale ' + f1(media(pochi.map((e) => e.x.v.orale.voto))) : '-'], ['Con più sessioni della media', tanti.length ? 'orale ' + f1(media(tanti.map((e) => e.x.v.orale.voto))) : '-'], ['Quiz superato, orale sotto 6', String(bassi.length), bassi.length ? ARANCIO : null]]],
    ['Regolarità', [['Alunni con più dispositivi', String(piuDisp)], ['Cambi di dispositivo a quiz aperto', String(sub), sub ? ARANCIO : null], ['Alunni coinvolti', String(conSub.length)], ['Sessione unica per codice', 'attiva'], ['Secondi per risposta', String(RR.quiz.secondi)]]]
  ];
  const gw = 8, bw = (W * 0.62 - gw) / 2, bh = 98;
  box.forEach(([tit, voci], i) => {
    const bx = 36 + (i % 2) * (bw + gw), by = y + Math.floor(i / 2) * (bh + gw);
    doc.roundedRect(bx, by, bw, bh, 4).lineWidth(0.6).strokeColor('#DDE4EA').stroke();
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(SCURO).text(tit.toUpperCase(), bx + 8, by + 6, { characterSpacing: 0.4 });
    voci.forEach(([et, va, col], k) => {
      const ry = by + 21 + k * 12.5;
      doc.font('Helvetica').fontSize(8).fillColor(GRIGIO).text(et, bx + 8, ry, { width: bw * 0.58, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(col || SCURO).text(va, bx + 8 + bw * 0.58, ry, { width: bw * 0.42 - 16, align: 'right', lineBreak: false });
    });
  });
  // andamento: ammessi cumulati giorno per giorno
  const cx = 36 + W * 0.62 + gw + 4, cw = W - (cx - 36), cy = y, ch = 2 * bh + gw;
  doc.roundedRect(cx, cy, cw, ch, 4).lineWidth(0.6).strokeColor('#DDE4EA').stroke();
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(SCURO).text('ANDAMENTO NEL TEMPO', cx + 8, cy + 6, { characterSpacing: 0.4 });
  doc.font('Helvetica').fontSize(7.5).fillColor(GRIGIO).text('Ammessi all\'orale, totale giorno per giorno', cx + 8, cy + 18);
  const tutte = [];
  el.forEach((e) => ((e.x.a.quiz && e.x.a.quiz.sessioni) || []).forEach((s) => tutte.push(Date.parse(s.i))));
  if (!tutte.length) { doc.font('Helvetica').fontSize(8).fillColor(GRIGIO).text('Nessun accesso al quiz.', cx + 8, cy + 40); return y + ch; }
  const G = 86400000, k0 = (ms) => { const p = parti(ms); return Date.UTC(+p.year, +p.month - 1, +p.day); };
  let d0 = k0(Math.min.apply(null, tutte));
  const fine = Math.max(k0(Math.max.apply(null, tutte)), ...el.filter((e) => e.q.superata).map((e) => k0(Date.parse(e.q.superata))), cqz.scadenza ? Math.min(k0(Date.parse(cqz.scadenza)), k0(Date.now())) : 0);
  let nd = Math.round((fine - d0) / G) + 1;
  if (nd > 30) { d0 = fine - 29 * G; nd = 30; }
  const giorni = [];
  for (let i = 0; i < nd; i++) { const g = d0 + i * G; giorni.push({ g, v: el.filter((e) => e.q.superata && k0(Date.parse(e.q.superata)) <= g).length }); }
  const px = cx + 22, pw = cw - 32, py = cy + 34, ph = ch - 58, mx = Math.max(1, el.length);
  doc.moveTo(px, py + ph).lineTo(px + pw, py + ph).lineWidth(0.5).strokeColor('#B9C4CE').stroke();
  [0, 0.5, 1].forEach((f) => { const v = Math.round(mx * f), yy = py + ph - ph * v / mx; doc.font('Helvetica').fontSize(6.5).fillColor(GRIGIO).text(String(v), cx + 4, yy - 3, { width: 15, align: 'right' }); if (f) doc.moveTo(px, yy).lineTo(px + pw, yy).lineWidth(0.3).strokeColor('#EEF2F5').stroke(); });
  const sl = pw / nd, bwid = Math.min(18, Math.max(2, sl * 0.7));
  giorni.forEach((d, i) => {
    const h = ph * d.v / mx;
    if (h > 0) doc.rect(px + i * sl + (sl - bwid) / 2, py + ph - h, bwid, h).fill(VERDE);
    if (i === 0 || i === nd - 1 || (nd > 6 && i === Math.floor(nd / 2))) {
      const dt = new Date(d.g); doc.font('Helvetica').fontSize(6.5).fillColor(GRIGIO).text(dt.getUTCDate() + '/' + (dt.getUTCMonth() + 1), px + i * sl - 10, py + ph + 3, { width: sl + 20, align: 'center', lineBreak: false });
    }
  });
  const ul = giorni[giorni.length - 1].v;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(SCURO).text(ul + ' ammessi su ' + el.length, cx + 8, cy + ch - 12, { width: cw - 16, align: 'right' });
  return y + ch;
}
/* tempo complessivo sul quiz fino al termine: superamento, scadenza, oppure finora se ancora in corso */
function fineQuiz(q, tq) {
  if (!q.sessioni) return '-';
  if (q.superata) return { t: tq(q.msFine), c: VERDE, b: true };
  if (q.stato === 'scaduto') return { t: tq(q.msFine), c: ARANCIO };
  return { t: tq(q.msFine) + ' (in corso)', c: GRIGIO };
}
/* elenco delle agevolazioni concesse a un alunno (report personale) */
function agevolazioni(a, q, o, R, quando) {
  const voci = [], B = a.bes || null;
  if (B) {
    voci.push('Studente con bisogni educativi speciali (BES).');
    voci.push(B.secondi === 0 ? 'Quiz senza limite di tempo per rispondere (classe: ' + R.quiz.secondi + ' secondi).' : B.secondi ? 'Quiz con ' + B.secondi + ' secondi per rispondere (classe: ' + R.quiz.secondi + ').' : 'Quiz con lo stesso tempo della classe (' + R.quiz.secondi + ' secondi).');
    if (B.dimezza !== false) {
      const usi = ((a.quiz && a.quiz.sessioni) || []).reduce((s, x) => s + (x.d || 0), 0);
      voci.push('Pulsante «Dimezza opzioni» nel quiz (da ' + R.quiz.opzioni + ' a 2 definizioni)' + (usi ? ': usato ' + usi + (usi === 1 ? ' volta.' : ' volte.') : ': mai usato.'));
    }
    voci.push('Interrogazione su ' + Math.max(1, Math.round(R.orale.domande / 2)) + ' termini invece di ' + R.orale.domande + ', con punteggio in proporzione (voto massimo invariato).');
  }
  if (q.sogliaPersonale != null) voci.push('Quiz: ' + q.sogliaPersonale + ' termini da indovinare invece di ' + (q.sogliaClasse || 'quelli della classe') + '.');
  if (q.passoPersonale != null) voci.push('Quiz: a ogni errore si perdono ' + q.passoPersonale + (q.passoPersonale === 1 ? ' termine' : ' termini') + ' invece di ' + R.quiz.passo + '.');
  if (q.proroga) voci.push('Proroga individuale del quiz fino a ' + quando(q.proroga) + '.');
  if (a.proroga) voci.push('Proroga individuale dello scritto fino a ' + quando(a.proroga) + '.');
  if (o && o.manuale) voci.push('Voto orale assegnato dal docente: ' + String(o.voto).replace('.', ',') + ' (calcolato dalle risposte: ' + String(o.votoCalcolato).replace('.', ',') + ').');
  return { bes: !!B, voci };
}
function testata(doc, titolo, sotto) {
  const w = doc.page.width - 72;
  logoScuola(doc, 36, 30, 26);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(SCURO).text(titolo, 70, 30, { width: w - 34 });
  doc.font('Helvetica').fontSize(8.5).fillColor(GRIGIO).text(sotto, 70, doc.y + 1, { width: w - 34 });
  const y = Math.max(doc.y, 56) + 6;
  doc.moveTo(36, y).lineTo(36 + w, y).lineWidth(1).strokeColor(SCURO).stroke();
  return y + 10;
}

function creaReport(stato, attivita, now) {
  now = now || Date.now();
  attivita = attivita || {};
  const imp = logica.impostazioni(stato.config);
  const righe = righeAlunni(stato, attivita, now);
  const EN = imp.lingue.indexOf('en') >= 0;
  const CL = logica.nomeClassi(stato), CLS = CL.indexOf(' e ') > 0 ? 'Classi ' + CL : 'Classe ' + CL;
  const pg = parti(now), generato = GG[new Date(new Date(now).toLocaleString('en-US', { timeZone: TZ })).getDay()] + ' ' + pg.day + '/' + pg.month + '/' + pg.year + ' alle ' + pg.hour + ':' + pg.minute;
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true,
    info: { Title: 'Report Glossario ' + CL, Author: stato.config.concessione ? stato.config.concessione.docente : 'Prof. Danilo Cerrato', Subject: require('./intestazione').titolo(stato.config) + (EN ? ' bilingue' : '') + ' - ' + CLS } });
  const pezzi = []; doc.on('data', (b) => pezzi.push(b));
  const fine = new Promise((ok) => doc.on('end', () => ok(Buffer.concat(pezzi))));
  // attività di un collega: il suo nome e la dicitura di concessione
  const conc = stato.config.concessione;
  const sotto = 'Istituto Barsanti - sede Salvetti · a.s. ' + imp.edizione.as + ' · ' + (conc ? conc.docente + ' · Per gentile concessione del Prof. Danilo Cerrato' : 'Prof. Danilo Cerrato') + (EN ? ' · Prof.ssa Federica Aliboni' : '') + ' · generato ' + generato;

  /* --- pagina 1: sintesi --- */
  let y = testata(doc, require('./intestazione').titolo(stato.config) + (EN ? ' bilingue' : '') + ' · Report · ' + CLS, sotto);
  const W = doc.page.width - 72;
  const totT = stato.termini.length;
  const appr = (l) => stato.termini.filter((t) => campo(t, l, 'stato') === 'approvata').length;
  const daAppr = (l) => stato.termini.filter((t) => campo(t, l, 'stato') === 'inviata').length;
  const box = !EN ? [
    ['Scadenza', quando(imp.scadenzaIt)],
    ['Termini', String(totT) + (() => { const n = [...new Set(stato.alunni.map((a) => stato.termini.filter((t) => (t.alunno_orig || t.alunno_id) === a.id).length).filter((x) => x > 0))]; return n.length === 1 ? ' (' + n[0] + ' a testa)' : ''; })()],
    ['Approvate', appr('it') + '/' + totT],
    ['Da approvare', String(daAppr('it'))],
    ['Esclusi', String(righe.filter((x) => x.v.escluso).length)],
    ['Penalità', 'Proposta ' + imp.proposta + ' (-' + String(imp.proposta === 'A' ? '0,25' : '0,50') + ' per errore)']
  ] : [
    ['Scadenza italiano', quando(imp.scadenzaIt)],
    ['Scadenza inglese', quando(imp.scadenzaEn)],
    ['Approvate IT / EN', appr('it') + '/' + totT + '  ·  ' + appr('en') + '/' + totT],
    ['Da approvare IT / EN', daAppr('it') + '  ·  ' + daAppr('en')],
    ['Esclusi', String(righe.filter((x) => x.v.escluso).length)],
    ['Penalità', 'Proposta ' + imp.proposta + ' (-' + String(imp.proposta === 'A' ? '0,25' : '0,50') + ' per errore)']
  ];
  const bw = W / box.length;
  box.forEach((b, i) => {
    doc.rect(36 + i * bw, y, bw - 6, 36).fill(CHIARO);
    doc.font('Helvetica').fontSize(7.5).fillColor(GRIGIO).text(b[0].toUpperCase(), 42 + i * bw, y + 6, { width: bw - 18 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(SCURO).text(b[1], 42 + i * bw, y + 18, { width: bw - 18 });
  });
  y += 46;
  const col = !EN ? [
    { t: 'Alunno', w: 140 }, { t: 'Gr.', w: 24, a: 'center' }, { t: 'Risposte', w: 52, a: 'center' }, { t: 'Approvate', w: 52, a: 'center' },
    { t: 'Errori', w: 42, a: 'center' }, { t: 'Voto finale', w: 50, a: 'center' },
    { t: 'Stato', w: 100 }, { t: 'Accessi', w: 44, a: 'center' }, { t: 'Giorni attivi', w: 44, a: 'center' }, { t: 'Tempo con l\'app aperta', w: 66, a: 'center' }, { t: 'Ultimo accesso', w: 92 }
  ] : [
    { t: 'Alunno', w: 128 }, { t: 'Gr.', w: 24, a: 'center' }, { t: 'IT risposte / approvate', w: 62, a: 'center' }, { t: 'EN risposte / approvate', w: 62, a: 'center' },
    { t: 'Errori IT / EN', w: 50, a: 'center' }, { t: 'Voto IT', w: 40, a: 'center' }, { t: 'Voto EN', w: 40, a: 'center' }, { t: 'Voto finale', w: 44, a: 'center' },
    { t: 'Stato', w: 90 }, { t: 'Accessi', w: 42, a: 'center' }, { t: 'Giorni attivi', w: 42, a: 'center' }, { t: 'Tempo con l\'app aperta', w: 62, a: 'center' }, { t: 'Ultimo accesso', w: 84 }
  ];
  const sc = W / col.reduce((s, c) => s + c.w, 0); col.forEach((c) => { c.w *= sc; });
  const ultimo = (x) => ({ t: x.r.ultimo ? quando(x.r.ultimo) + (x.r.giorniDaUltimo >= 1 ? ' (' + x.r.giorniDaUltimo + ' g fa)' : '') : 'mai', c: !x.r.ultimo || x.r.giorniDaUltimo >= 3 ? ARANCIO : SCURO });
  y = tabella(doc, 36, y, col, righe.map((x) => !EN ? [
    { t: x.a.nome, b: true }, logica.etichettaAl(x.a), x.it.risposte + '/' + x.miei.length, x.it.approvate + '/' + x.miei.length, x.it.errori,
    { t: fv(x.v.voto) + (x.v.manuale != null ? ' (man.)' : ''), b: true },
    { t: x.stato, c: x.colore, b: x.colore !== SCURO }, x.r.accessi, x.r.giorni, durata(x.r.ultimo ? x.r.minuti : null), ultimo(x)
  ] : [
    { t: x.a.nome, b: true }, logica.etichettaAl(x.a), x.it.risposte + '/' + x.miei.length + '  ·  ' + x.it.approvate, x.en.risposte + '/' + x.miei.length + '  ·  ' + x.en.approvate,
    x.it.errori + ' / ' + x.en.errori, fv(x.v.votoIt), fv(x.v.votoEn), { t: fv(x.v.voto) + (x.v.manuale != null ? ' (man.)' : ''), b: true },
    { t: x.stato, c: x.colore, b: x.colore !== SCURO }, x.r.accessi, x.r.giorni, durata(x.r.ultimo ? x.r.minuti : null),
    { t: x.r.ultimo ? quando(x.r.ultimo) + (x.r.giorniDaUltimo >= 1 ? ' (' + x.r.giorniDaUltimo + ' g fa)' : '') : 'mai', c: !x.r.ultimo || x.r.giorniDaUltimo >= 3 ? ARANCIO : SCURO }
  ]), { fs: 8, layout: 'landscape' });

  /* --- da tenere d'occhio --- */
  const av = avvisi(righe, now, imp);
  y += 12;
  if (y > doc.page.height - 120) { doc.addPage({ layout: 'landscape', margin: 36 }); y = 40; }
  doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Da tenere d\'occhio', 36, y); y = doc.y + 4;
  if (!av.length) { doc.font('Helvetica').fontSize(9).fillColor(VERDE).text('Nessuna situazione critica.', 36, y); }
  av.forEach(([c, t]) => {
    if (doc.y > doc.page.height - 60) { doc.addPage({ layout: 'landscape', margin: 36 }); }
    const yy = doc.y + 2; doc.circle(40, yy + 4, 2).fill(c);
    doc.font('Helvetica').fontSize(9).fillColor(SCURO).text(t, 48, yy, { width: W - 12 });
  });
  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(7.5).fillColor(GRIGIO).text('Tempo con l\'app aperta: somma dei minuti in cui l\'app era aperta e in primo piano sul dispositivo dell\'alunno (segnale ogni minuto; una pausa di oltre 10 minuti chiude la sessione). Indica la presenza nell\'app, non necessariamente il lavoro effettivo.', 36, doc.y, { width: W });

  /* --- una pagina per alunno --- */
  righe.forEach((x) => {
    doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
    const Wp = doc.page.width - 72;
    const area = require('./catalogo').areeDi(stato.config).find((a) => String(a.n) === String(x.a.gruppo)) || {};
    let yy = testata(doc, x.a.nome, 'Classe ' + logica.classeDi(x.a) + (area.it ? ' · Gruppo ' + x.a.gruppo + ' · ' + area.it : ' · termini di tutte le aree') + ' · ' + sotto);
    // voti
    const vb = !EN ? [['Risposte', x.it.risposte + '/' + x.miei.length, ''], ['Approvate', x.it.approvate + '/' + x.miei.length, x.it.daApprovare ? x.it.daApprovare + ' da approvare' : ''],
      ['Errori', String(x.it.errori), 'penalità ' + String(imp.penalita).replace('.', ',') + ' ciascuno'], ['Voto finale', x.v.voto != null ? fv(x.v.voto) + '/' + fv(x.v.votoMax) : '-', x.v.manuale != null ? 'manuale' : x.v.escluso ? 'esclusione' : x.v.tetto ? 'tetto 6' : 'calcolato']] : [['Voto italiano', fv(x.v.votoIt), x.it.errori + ' errori'], ['Voto inglese', fv(x.v.votoEn), x.en.errori + ' errori'],
      ['Media', x.v.media != null ? fv(x.v.media) : '-', ''], ['Voto finale', x.v.voto != null ? fv(x.v.voto) + '/' + fv(x.v.votoMax) : '-', x.v.manuale != null ? 'manuale' : x.v.escluso ? 'esclusione' : x.v.tetto ? 'tetto 6' : 'calcolato']];
    const w4 = Wp / 4;
    vb.forEach((b, i) => {
      doc.rect(36 + i * w4, yy, w4 - 6, 44).fill(i === 3 ? SCURO : CHIARO);
      const fc = i === 3 ? '#fff' : SCURO;
      doc.font('Helvetica').fontSize(7.5).fillColor(i === 3 ? '#C9D3DB' : GRIGIO).text(b[0].toUpperCase(), 42 + i * w4, yy + 5, { width: w4 - 18 });
      doc.font('Helvetica-Bold').fontSize(15).fillColor(fc).text(b[1], 42 + i * w4, yy + 16, { width: w4 - 18 });
      if (b[2]) doc.font('Helvetica').fontSize(7.5).fillColor(i === 3 ? '#C9D3DB' : GRIGIO).text(b[2], 42 + i * w4, yy + 34, { width: w4 - 18 });
    });
    yy += 52;
    const note = [];
    if (x.v.escluso) note.push('Escluso: ' + x.v.motivo + '.');
    if (x.v.riassegnatoA) { const e = stato.alunni.find((a) => a.id === x.v.riassegnatoA); note.push('I suoi termini sono passati a ' + (e ? e.nome : x.v.riassegnatoA) + '.'); }
    if (x.v.ereditati) note.push('Ha ricevuto i termini di un compagno escluso: voto massimo ' + fv(x.v.votoMax) + '.');
    if (x.v.tetto) note.push('Voto finale limitato a 6: ' + x.v.motivoTetto + '.');
    if (note.length) { doc.font('Helvetica-Bold').fontSize(9).fillColor(x.colore).text(note.join(' '), 36, yy, { width: Wp }); yy = doc.y + 6; }

    // attività
    doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Attività nell\'app', 36, yy); yy = doc.y + 4;
    const disp = Object.keys(x.r.dispositivi).map((k) => k + ' ' + x.r.dispositivi[k]).join(', ') || '-';
    const att = [['Primo accesso', x.r.primo ? quando(x.r.primo) : 'mai'], ['Ultimo accesso', x.r.ultimo ? quando(x.r.ultimo) : 'mai'], ['Accessi', String(x.r.accessi)],
      ['Giorni attivi', String(x.r.giorni)], ['Tempo con l\'app aperta', x.r.ultimo ? durata(x.r.minuti) + (x.r.minutiPubblica ? ' (ripasso ' + durata(x.r.minutiPubblica) + ')' : '') : '-'], ['Dispositivi', disp]];
    const w6 = Wp / 3;
    att.forEach((b, i) => {
      const cx = 36 + (i % 3) * w6, cy = yy + Math.floor(i / 3) * 30;
      doc.font('Helvetica').fontSize(7.5).fillColor(GRIGIO).text(b[0].toUpperCase(), cx, cy, { width: w6 - 8 });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(SCURO).text(b[1], cx, cy + 10, { width: w6 - 8 });
    });
    yy += 64;

    // riepilogo personale: tempi e voti con le date
    doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Riepilogo: tempi e voti', 36, yy); yy = doc.y + 4;
    {
      const q = OR.riepilogoQuiz(x.a.quiz, OR.cfgQuiz(stato.config, logica.classeDi(x.a), null, x.a)), o = x.v.orale, tqm = (ms) => { const m = Math.round((ms || 0) / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
      const risp = []; x.miei.forEach((t) => (campo(t, 'it', 'storia') || []).forEach((k) => { if (k.at) risp.push(k.at); }));
      const ord = (at) => { const m = /^(\d\d)\/(\d\d)\/(\d{4}) (\d\d):(\d\d)/.exec(at); return m ? m[3] + m[2] + m[1] + m[4] + m[5] : ''; };
      risp.sort((a, b) => ord(a).localeCompare(ord(b)));
      const cr = [{ t: 'Voce', w: 90 }, { t: 'Valore', w: 60, a: 'center' }, { t: 'Dettaglio', w: 190 }, { t: 'Date', w: 183 }];
      const sr = Wp / cr.reduce((s, c) => s + c.w, 0); cr.forEach((c) => { c.w *= sr; });
      yy = tabella(doc, 36, yy, cr, [
        [{ t: 'Tempo in app', b: true }, { t: durata(x.r.ultimo ? x.r.minuti : null), b: true }, x.r.accessi + ' accessi · ' + x.r.giorni + ' giorni attivi', x.r.ultimo ? 'primo accesso ' + quando(x.r.primo) + ' · ultimo ' + quando(x.r.ultimo) : 'nessun accesso'],
      ].concat(x.r.ultimo && x.r.minutiAlGiorno != null ? [[{ t: 'Tempo al giorno', b: true }, { t: durata(x.r.minutiAlGiorno), b: true }, 'tempo totale in app (pagina pubblica compresa) diviso ' + x.r.giorniAttivita + (x.r.giorniAttivita === 1 ? ' giorno' : ' giorni'), 'dall\'inizio dello scritto ' + (x.a.orale ? 'al giorno dell\'interrogazione' : 'a oggi')]] : [],
        x.r.ripassoPrep != null ? [[{ t: 'Ripasso per l\'interrogazione', b: true }, { t: durata(x.r.ripassoPrep), b: true }, 'sulla pagina pubblica · ' + durata(x.r.ripassoPrepAlGiorno) + ' al giorno su ' + x.r.giorniPrep + (x.r.giorniPrep === 1 ? ' giorno' : ' giorni'), 'dalla programmazione ' + (x.a.orale ? 'al giorno dell\'interrogazione' : 'a oggi')]] : [],
        x.r.minutiPubblica ? [[{ t: 'Ripasso pagina pubblica', b: true }, { t: durata(x.r.minutiPubblica), b: true }, x.r.sessioniPubblica + ' sessioni · già compreso nel tempo in app', x.r.ultimoPubblica ? 'ultimo ripasso ' + quando(x.r.ultimoPubblica) : '']] : [], [
        [{ t: 'Tempo sul quiz', b: true }, { t: q.sessioni ? tqm(q.ms) : '-', b: true }, q.sessioni + ' sessioni · ' + q.corrette + ' corrette e ' + q.errori + ' errori su ' + q.risposte + ' risposte · ' + q.persi + ' termini persi · ' + q.indovinati + ' / ' + q.soglia + ' indovinati (massimo ' + q.massimo + ')',
          (q.sessioni ? 'prima sessione ' + quando(q.prima) + ' · ultima ' + quando(q.ultima) : 'nessuna sessione') + (q.scadenza ? ' · scadenza ' + quando(q.scadenza) + (q.proroga ? ' (proroga individuale)' : '') : '')],
        [{ t: 'Ammissione all\'orale', b: true }, q.stato === 'superato' ? { t: 'ammesso', c: VERDE, b: true } : { t: q.stato === 'scaduto' ? 'non ammesso' : '-', c: q.stato === 'scaduto' ? ARANCIO : SCURO, b: true },
          q.stato === 'superato' ? 'quiz superato: ' + q.indovinati + ' termini indovinati' : q.stato === 'scaduto' ? 'quiz non completato entro la scadenza: niente interrogazione e niente voto' : q.stato === 'chiuso' ? 'quiz non ancora aperto' : 'quiz da completare: ' + q.indovinati + ' / ' + q.soglia,
          q.superata ? 'quiz superato il ' + quando(q.superata) : '-'],
        [{ t: 'Voto scritto', b: true }, x.v.escluso ? { t: 'escluso', c: ARANCIO, b: true } : { t: fv(x.v.voto), b: true }, x.v.escluso ? (x.v.motivo || 'escluso dal compito') : x.it.errori + ' risposte errate · ' + x.it.approvate + ' / ' + x.miei.length + ' approvate' + (x.v.manuale != null ? ' · voto del docente' : ''),
          risp.length ? 'prima risposta ' + risp[0] + ' · ultima ' + risp[risp.length - 1] : 'nessuna risposta'],
        [{ t: 'Voto orale', b: true }, { t: o ? fv(o.voto) : '-', b: true }, o ? fv(o.punti) + ' punti su ' + ((o.termini && o.termini.length) || REG.di(stato.config).orale.domande) + (o.termini && o.termini.length && o.termini.length !== REG.di(stato.config).orale.domande ? ' (BES)' : '') + (o.manuale ? ' · voto del docente (calcolato ' + fv(o.votoCalcolato) + ')' : '') + (o.escluso ? ' · massimo ' + fv(REG.di(stato.config).orale.maxEsclusi) : '') + (o.docente ? ' · ' + o.docente : '') : 'non ancora interrogato', o ? 'interrogazione del ' + quando(o.data) : '-'],
        [{ t: 'Voto finale', b: true }, { t: fv(x.v.finale), b: true }, x.v.finale == null ? (q.stato === 'scaduto' ? 'senza voto: quiz non completato' : 'manca l\'orale') : x.v.escluso ? 'solo orale (escluso dallo scritto)' : (function () { const ps = REG.di(stato.config).finale.pesoScritto; return (ps === 50 ? 'media tra scritto ' : 'media pesata (' + ps + ' % scritto) tra scritto ') + fv(x.v.voto) + ' e orale ' + fv(o.voto) + ' = ' + fv(Math.round((x.v.voto * ps + o.voto * (100 - ps)) / 100 * 1000) / 1000); })(), x.v.finale != null ? 'definito il ' + quando(o.data) : '-']
      ]), { fs: 8 }) + 12;
      if (yy > doc.page.height - 140) { doc.addPage({ layout: 'portrait', margin: 36 }); yy = 40; }
      // quiz nel dettaglio: indicatori e sessioni (le più recenti)
      const ses = (x.a.quiz && x.a.quiz.sessioni) || [];
      // agevolazioni e misure personalizzate (BES e regole personali): solo nel report, lo studente non vede etichette
      {
        const ag = agevolazioni(x.a, q, o, REG.di(stato.config), quando);
        if (ag.voci.length) {
          doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Agevolazioni e misure personalizzate', 36, yy); yy = doc.y + 4;
          if (ag.bes) {
            const tx = 'Prova sostenuta con l\'ausilio di strumenti compensativi e dispensativi.';
            doc.font('Helvetica-Bold').fontSize(9);
            const h = doc.heightOfString(tx, { width: Wp - 20 }) + 12;
            doc.roundedRect(36, yy, Wp, h, 4).fill('#EEF3FA');
            doc.fillColor(SCURO).text(tx, 46, yy + 6, { width: Wp - 20 }); yy += h + 4;
          }
          // un solo paragrafo compatto, così la pagina dell'alunno resta di una pagina
          doc.font('Helvetica').fontSize(8.5).fillColor(SCURO).text(ag.voci.map((v) => v.replace(/\.$/, '')).join('  ·  ') + '.', 36, yy, { width: Wp, lineGap: 1 });
          yy = doc.y + 8;
        }
      }
      // giudizio: quello scritto dal docente o quello generato dai dati
      {
        const g = x.a.giudizio || require('./giudizi').auto(x.v, q);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(SCURO).text('Giudizio: ', 36, yy, { continued: true }).font('Helvetica').text(g, { width: Wp });
        yy = doc.y + 8;
      }
      if (ses.length) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Quiz: andamento e sessioni', 36, yy); yy = doc.y + 4;
        const medio = q.risposte ? Math.round(q.ms / q.risposte / 100) / 10 : 0, scad = ses.reduce((a, b) => a + (b.s || 0), 0);
        const ind = [['Risposte corrette', q.risposte ? Math.round(q.corrette / q.risposte * 100) + ' %' : '-'], ['Tempo medio per risposta', medio ? String(medio).replace('.', ',') + ' s ' + (x.a.bes && x.a.bes.secondi === 0 ? '(senza limite)' : 'su ' + ((x.a.bes && x.a.bes.secondi) || REG.di(stato.config).quiz.secondi)) : '-'],
          ['Tempi scaduti', String(scad)], ['Massimo raggiunto', q.massimo + ' / ' + q.soglia], ['Dispositivi usati', String(q.dispositivi || (ses.length ? 1 : 0))], ['Cambi di dispositivo', String(q.subentri || 0)],
          ['Tempo fino al termine', tqm(q.msFine) + (q.superata ? '' : q.stato === 'scaduto' ? ' (scaduto)' : ' (in corso)')], ['Giorni per superarlo', q.superata ? q.giorniSup + (q.giorniSup === 1 ? ' giorno' : ' giorni') : '-']];
        const w6 = Wp / 4;
        ind.forEach((b, i) => {
          const cx = 36 + (i % 4) * w6, cy = yy + Math.floor(i / 4) * 28;
          doc.font('Helvetica').fontSize(7.5).fillColor(GRIGIO).text(b[0].toUpperCase(), cx, cy, { width: w6 - 8 });
          doc.font('Helvetica-Bold').fontSize(10).fillColor(i === 5 && q.subentri ? ARANCIO : i === 6 && q.superata ? VERDE : SCURO).text(b[1], cx, cy + 10, { width: w6 - 8 });
        });
        yy += 60;
        const ultime = ses.slice(-12), cs = [{ t: 'N.', w: 26, a: 'center' }, { t: 'Inizio', w: 100 }, { t: 'Durata', w: 56, a: 'center' }, { t: 'Risposte', w: 54, a: 'center' }, { t: 'Corrette', w: 54, a: 'center' }, { t: 'Errori', w: 46, a: 'center' }, { t: 'Tempi scaduti', w: 56, a: 'center' }, { t: 'Termini nuovi', w: 56, a: 'center' }, { t: 'Termini persi', w: 56, a: 'center' }];
        const sc = Wp / cs.reduce((a, c) => a + c.w, 0); cs.forEach((c) => { c.w *= sc; });
        yy = tabella(doc, 36, yy, cs, ultime.map((z, i) => [String(ses.length - ultime.length + i + 1), quando(z.i), tqm(z.ms), String(z.r || 0), String(z.c || 0), String(z.e || 0), String(z.s || 0), String(z.n || 0), String(z.p || 0)]), { fs: 7.5 });
        if (ses.length > ultime.length) { doc.font('Helvetica').fontSize(7.5).fillColor(GRIGIO).text('Sono riportate le ultime ' + ultime.length + ' sessioni su ' + ses.length + '.', 36, yy + 2); yy = doc.y; }
        yy += 12;
        if (yy > doc.page.height - 140) { doc.addPage({ layout: 'portrait', margin: 36 }); yy = 40; }
      }
    }

    // termini
    doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Termini e risposte', 36, yy); yy = doc.y + 4;
    const STT = { '': 'Da scegliere', inviata: 'Da approvare', correggere: 'Rimandata', approvata: 'Approvata' };
    const rt = [];
    x.miei.forEach((t) => {
      imp.lingue.forEach((l) => {
        const st = campo(t, l, 'storia') || [], stv = campo(t, l, 'stato') || '';
        rt.push([{ t: (l === 'it' ? t.termine_it : t.termine_en) + (t.ereditato && l === 'it' ? '  (ricevuto)' : ''), b: l === 'it' }, l.toUpperCase(),
          { t: STT[stv] || stv, c: stv === 'approvata' ? VERDE : stv === 'correggere' ? ARANCIO : !st.length ? GRIGIO : SCURO },
          st.length ? st.map((s) => (s.ok ? 'giusta' : 'errata')).join(', ') : '-',
          st.length ? st[0].at : '-', st.length ? st[st.length - 1].at : '-',
          campo(t, l, 'scad') ? quando(campo(t, l, 'scad')) : '']);
      });
    });
    if (!EN) rt.forEach((r) => r.splice(1, 1));
    const ct = !EN ? [{ t: 'Termine', w: 170 }, { t: 'Stato', w: 66 }, { t: 'Tentativi', w: 100 }, { t: 'Prima risposta', w: 72 }, { t: 'Ultima risposta', w: 72 }, { t: 'Scadenza propria', w: 43 }] : [{ t: 'Termine', w: 150 }, { t: 'Lingua', w: 34, a: 'center' }, { t: 'Stato', w: 62 }, { t: 'Tentativi', w: 96 }, { t: 'Prima risposta', w: 70 }, { t: 'Ultima risposta', w: 70 }, { t: 'Scadenza propria', w: 41 }];
    const s2 = Wp / ct.reduce((s, c) => s + c.w, 0); ct.forEach((c) => { c.w *= s2; });
    yy = rt.length ? tabella(doc, 36, yy, ct, rt, { fs: 7.5 }) : (doc.font('Helvetica').fontSize(9).fillColor(GRIGIO).text('Nessun termine assegnato.', 36, yy), doc.y);

    // sessioni
    yy += 12;
    if (yy > doc.page.height - 110) { doc.addPage({ layout: 'portrait', margin: 36 }); yy = 40; }
    doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Ultime sessioni', 36, yy); yy = doc.y + 4;
    const ses = x.r.sessioni.slice(0, 15);
    if (!ses.length) doc.font('Helvetica').fontSize(9).fillColor(GRIGIO).text('Nessun accesso registrato.', 36, yy);
    else {
      const cs = [{ t: 'Giorno', w: 130 }, { t: 'Dalle', w: 70, a: 'center' }, { t: 'Alle', w: 70, a: 'center' }, { t: 'Durata', w: 90, a: 'center' }, { t: 'Dispositivo', w: 163 }];
      const s3 = Wp / cs.reduce((s, c) => s + c.w, 0); cs.forEach((c) => { c.w *= s3; });
      tabella(doc, 36, yy, cs, ses.map((s) => [quando(s.inizio).split(' ').slice(0, 2).join(' ') + '/' + parti(Date.parse(s.inizio)).year, ora(s.inizio), ora(s.fine), durata(s.minuti), s.disp || '-']), { fs: 8 });
    }
  });

  /* --- quiz, interrogazione orale e voto finale --- */
  doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
  const qzDi = (x) => OR.riepilogoQuiz(x.a.quiz, OR.cfgQuiz(stato.config, logica.classeDi(x.a), null, x.a)), cqz = OR.cfgQuiz(stato.config, (imp.classi || [])[0]);
  const STQ = { superato: 'ammesso', scaduto: 'non ammesso', 'in corso': 'in corso', 'non iniziato': 'non iniziato', chiuso: 'quiz non aperto' };
  let yo = testata(doc, 'Quiz, interrogazione orale e voto finale', sotto);
  const RR = REG.di(stato.config), fz = (n) => String(n).replace('.', ',');
  doc.font('Helvetica').fontSize(9).fillColor(SCURO).text('Quiz (seconda parte della prova): un termine, ' + RR.quiz.opzioni + ' definizioni, ' + RR.quiz.secondi + ' secondi; a ogni errore la risposta giusta non viene mostrata e si torna indietro di ' + RR.quiz.passo + ' termini; con lo stesso codice il quiz è aperto su un solo dispositivo alla volta; superato con ' + cqz.soglia + ' termini indovinati su ' + cqz.totale + ', entro la scadenza fissata dal docente. Chi lo supera è ammesso all\'interrogazione; chi non lo completa non viene interrogato e resta senza voto (le sue definizioni restano sui cartelloni). ' +
    'Interrogazione orale: ' + RR.orale.domande + ' termini pescati tra tutti quelli del glossario (mai quelli dell\'alunno); corretta 1 punto, parziale 0,5, sbagliata 0; voto orale = ' + fz(RR.orale.base) + ' + ' + fz(RR.orale.passo) + ' per punto (massimo ' + fz(RR.orale.max) + '), per gli esclusi ' + fz(RR.orale.base) + ' + ' + fz(RR.orale.passoEsclusi) + ' per punto (massimo ' + fz(RR.orale.maxEsclusi) + '). ' +
    'Voto finale = ' + (RR.finale.pesoScritto === 50 ? 'media tra scritto e orale' : 'media pesata: scritto ' + RR.finale.pesoScritto + ' %, orale ' + (100 - RR.finale.pesoScritto) + ' %') + ' (per gli esclusi il solo orale): oltre il mezzo voto si arrotonda all\'intero superiore, sotto a quello inferiore.', 36, yo, { width: doc.page.width - 72 });
  yo = doc.y + 10;
  const tq = (ms) => { const m = Math.round((ms || 0) / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
  const colO = [{ t: 'Alunno', w: 130 }, { t: 'Gr.', w: 26, a: 'center' }, { t: 'Scritto', w: 44, a: 'center' }, { t: 'Sessioni quiz', w: 46, a: 'center' }, { t: 'Tempo nel quiz', w: 50, a: 'center' }, { t: 'Tempo fino al termine', w: 58, a: 'center' }, { t: 'Risposte quiz', w: 46, a: 'center' },
    { t: 'Corrette', w: 50, a: 'center' }, { t: 'Errori', w: 36, a: 'center' }, { t: 'Termini persi', w: 40, a: 'center' }, { t: 'Termini indovinati', w: 56, a: 'center' }, { t: 'Ammissione all\'orale', w: 76, a: 'center' }, { t: 'Orale: data', w: 62, a: 'center' }, { t: 'Punti orale', w: 44, a: 'center' }, { t: 'Voto orale', w: 44, a: 'center' }, { t: 'Voto finale', w: 46, a: 'center' }];
  const WO = doc.page.width - 72, scO = WO / colO.reduce((x, c) => x + c.w, 0); colO.forEach((c) => { c.w *= scO; });
  yo = tabella(doc, 36, yo, colO, righe.map((x) => {
    const q = qzDi(x), o = x.v.orale;
    return [{ t: x.a.nome, b: true }, logica.etichettaAl(x.a), x.v.escluso ? { t: 'escluso', c: ARANCIO } : fv(x.v.voto), q.sessioni, q.sessioni ? tq(q.ms) : '-', fineQuiz(q, tq), q.risposte, q.risposte ? q.corrette + ' (' + Math.round(q.corrette / q.risposte * 100) + '%)' : '-',
      q.errori, q.persi, q.indovinati + ' / ' + q.soglia, q.superata ? { t: 'ammesso ' + soloData(q.superata), c: VERDE, b: true } : { t: STQ[q.stato], c: q.stato === 'scaduto' ? ARANCIO : SCURO, b: q.stato === 'scaduto' }, o ? soloData(o.data) : '-', o ? fv(o.punti) + ' / ' + REG.di(stato.config).orale.domande : '-', { t: o ? fv(o.voto) : '-', b: true }, { t: fv(x.v.finale), b: true }];
  }), { fs: 8, layout: 'landscape' });
  // dati del quiz sull'intera classe: esito, impegno, andamento nel tempo, coerenza con l'orale, regolarità
  yo = quizClasse(doc, yo + 16, righe.map((x) => ({ x, q: qzDi(x) })), RR, cqz, tq);
  // dettaglio delle interrogazioni: i termini chiesti e l'esito di ogni risposta
  const interr = righe.filter((x) => x.v.orale);
  if (interr.length) {
    yo += 14; if (yo > doc.page.height - 110) { doc.addPage({ layout: 'landscape', margin: 36 }); yo = 40; }
    doc.font('Helvetica-Bold').fontSize(11).fillColor(SCURO).text('Interrogazioni: termini chiesti ed esito', 36, yo); yo = doc.y + 4;
    const colD = [{ t: 'Alunno', w: 120 }, { t: 'Data e docente', w: 110 }, { t: 'Termini chiesti (1 = corretta · ½ = parziale · 0 = sbagliata)', w: 430 }, { t: 'Punti', w: 40, a: 'center' }, { t: 'Voto', w: 36, a: 'center' }];
    const scD = WO / colD.reduce((x, c) => x + c.w, 0); colD.forEach((c) => { c.w *= scD; });
    tabella(doc, 36, yo, colD, interr.map((x) => { const o = x.v.orale; return [{ t: x.a.nome, b: true }, soloData(o.data) + (o.docente ? ' · ' + o.docente : ''),
      (o.termini || []).map((t) => t.it + ' ' + (t.e === 1 ? '1' : t.e === 0.5 ? '½' : '0')).join(' · ') + (o.cambi ? '  (termini cambiati: ' + o.cambi + ')' : '') + (o.nota ? '  Nota: ' + o.nota : ''), fv(o.punti), { t: fv(o.voto), b: true }]; }), { fs: 7.5, layout: 'landscape' });
  }

  /* --- criterio --- */
  doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
  let yc = testata(doc, 'Criterio di assegnazione del punteggio', sotto);
  doc.font('Helvetica').fontSize(10).fillColor(SCURO).text((EN ? 'Ogni alunno ha 5 termini e per ciascuno sceglie la definizione corretta tra 8 alternative, prima in italiano e poi in inglese (10 risposte in tutto); ogni scelta viene verificata dai docenti. ' : 'Ogni alunno ha ' + DATI.TERMINI_PER_ALUNNO + ' termini e per ciascuno sceglie la definizione corretta tra 8 alternative, in italiano; ogni scelta viene verificata dal docente. ') + logica.ratio(imp), 36, yc, { width: doc.page.width - 72, lineGap: 2 });

  // numeri di pagina
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const b = doc.page.margins.bottom; doc.page.margins.bottom = 0;
    doc.font('Helvetica').fontSize(7).fillColor(GRIGIO).text('Glossario ' + CL + ' · report di ' + generato + ' · pagina ' + (i + 1) + ' di ' + range.count, 36, doc.page.height - 24, { width: doc.page.width - 72, align: 'right' });
    doc.page.margins.bottom = b;
  }
  doc.end();
  return fine;
}

module.exports = { creaReport, righeAlunni };
