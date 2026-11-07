/**
 * Report PDF automatico (generato sul server, senza browser): stato del lavoro, voti e attività di ogni alunno.
 */
const PDFDocument = require('pdfkit');
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
    const r = ATT.riepilogo(attivita[a.id], now);
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

function testata(doc, titolo, sotto) {
  const w = doc.page.width - 72;
  doc.rect(36, 30, 26, 26).fill('#EA3628');
  doc.font('Helvetica-Bold').fontSize(17).fillColor('#fff').text('B', 36, 35, { width: 26, align: 'center' });
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
    info: { Title: 'Report Glossario ' + CL, Author: 'Prof. Danilo Cerrato', Subject: 'Glossario odontotecnico' + (EN ? ' bilingue' : '') + ' - ' + CLS } });
  const pezzi = []; doc.on('data', (b) => pezzi.push(b));
  const fine = new Promise((ok) => doc.on('end', () => ok(Buffer.concat(pezzi))));
  const sotto = 'Istituto Barsanti - sede Salvetti · a.s. 2026/27 · Prof. Danilo Cerrato' + (EN ? ' · Prof.ssa Federica Aliboni' : '') + ' · generato ' + generato;

  /* --- pagina 1: sintesi --- */
  let y = testata(doc, 'Glossario odontotecnico' + (EN ? ' bilingue' : '') + ' · Report · ' + CLS, sotto);
  const W = doc.page.width - 72;
  const totT = stato.termini.length;
  const appr = (l) => stato.termini.filter((t) => campo(t, l, 'stato') === 'approvata').length;
  const daAppr = (l) => stato.termini.filter((t) => campo(t, l, 'stato') === 'inviata').length;
  const box = !EN ? [
    ['Scadenza', quando(imp.scadenzaIt)],
    ['Termini', String(totT) + ' (' + DATI.TERMINI_PER_ALUNNO + ' a testa)'],
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
    const area = DATI.AREE.find((a) => String(a.n) === String(x.a.gruppo)) || {};
    let yy = testata(doc, x.a.nome, 'Classe ' + logica.classeDi(x.a) + (area.it ? ' · Gruppo ' + x.a.gruppo + ' · ' + area.it : ' · termini di tutte le aree') + ' · ' + sotto);
    // voti
    const vb = !EN ? [['Risposte', x.it.risposte + '/' + x.miei.length, ''], ['Approvate', x.it.approvate + '/' + x.miei.length, x.it.daApprovare ? x.it.daApprovare + ' da approvare' : ''],
      ['Errori', String(x.it.errori), 'penalità ' + (imp.proposta === 'A' ? '0,25' : '0,50') + ' ciascuno'], ['Voto finale', x.v.voto != null ? fv(x.v.voto) + '/' + fv(x.v.votoMax) : '-', x.v.manuale != null ? 'manuale' : x.v.escluso ? 'esclusione' : x.v.tetto ? 'tetto 6' : 'calcolato']] : [['Voto italiano', fv(x.v.votoIt), x.it.errori + ' errori'], ['Voto inglese', fv(x.v.votoEn), x.en.errori + ' errori'],
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
      ['Giorni attivi', String(x.r.giorni)], ['Tempo con l\'app aperta', x.r.ultimo ? durata(x.r.minuti) : '-'], ['Dispositivi', disp]];
    const w6 = Wp / 3;
    att.forEach((b, i) => {
      const cx = 36 + (i % 3) * w6, cy = yy + Math.floor(i / 3) * 30;
      doc.font('Helvetica').fontSize(7.5).fillColor(GRIGIO).text(b[0].toUpperCase(), cx, cy, { width: w6 - 8 });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(SCURO).text(b[1], cx, cy + 10, { width: w6 - 8 });
    });
    yy += 64;

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
