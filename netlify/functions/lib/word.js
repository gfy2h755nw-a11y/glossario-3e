/**
 * Documento Word (.docx): per ogni studente i termini assegnati e le definizioni approvate dal docente.
 * Generato dall'area admin e ogni sera, salvato su Dropbox sempre con lo stesso nome (sovrascritto).
 */
const D = require('docx');
const DATI = require('./dati');
const logica = require('./logica');

const NOME_DROPBOX = '/Glossario_definizioni_approvate.docx';
const INK = '15212B', MUTO = '5B6976', LINEA = 'C3CED7', FONDO = 'EEF2F5';
const COL_CL = { '3E': '1F5FA8', '3F': 'B4511A' };
const STATO = { approvata: 'Approvata', inviata: 'Da approvare', correggere: 'Da rivedere', '': 'Nessuna risposta' };

function dataIt(now) {
  return new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(now));
}
const t = (text, o) => new D.TextRun(Object.assign({ text: String(text), font: 'Arial' }, o || {}));
const bordi = () => { const b = { style: D.BorderStyle.SINGLE, size: 4, color: LINEA }; return { top: b, bottom: b, left: b, right: b }; };
function cella(figli, o) {
  o = o || {};
  return new D.TableCell({ width: { size: o.w, type: D.WidthType.DXA }, borders: bordi(), shading: o.fill ? { fill: o.fill, type: D.ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 }, verticalAlign: o.v || D.VerticalAlign.TOP,
    children: (Array.isArray(figli) ? figli : [figli]).map((r) => new D.Paragraph({ alignment: o.al, children: Array.isArray(r) ? r : [r] })) });
}

async function creaWord(stato, now) {
  now = now || Date.now();
  const imp = logica.impostazioni(stato.config);
  const classi = imp.classi.filter((c) => stato.alunni.some((a) => logica.classeDi(a) === c));
  const aree = {}; DATI.AREE.forEach((a) => { aree[a.n] = a; });
  const ord = (t) => Number(t.area) * 1000 + Number(String(t.id).slice(2));
  const tutti = stato.termini;
  const approvate = tutti.filter((x) => x.stato_it === 'approvata').length;
  const W = [700, 2500, 5300, 1138]; // larghezze colonne (totale 9638 = A4 con margini 2 cm)

  const corpo = [
    new D.Paragraph({ heading: D.HeadingLevel.TITLE, children: [t('Glossario odontotecnico · definizioni approvate', { bold: true, size: 36, color: INK })] }),
    new D.Paragraph({ spacing: { after: 80 }, children: [t('Istituto Barsanti - sede Salvetti, Massa · Laboratorio odontotecnico · a.s. 2026/27', { size: 20, color: MUTO })] }),
    new D.Paragraph({ spacing: { after: 240 }, children: [t('Classi ' + classi.join(' e ') + ' · aggiornato al ' + dataIt(now) + ' · definizioni approvate: ' + approvate + ' su ' + tutti.length, { size: 20, color: MUTO })] })
  ];

  classi.forEach((c, ic) => {
    const alunni = stato.alunni.filter((a) => logica.classeDi(a) === c).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
    corpo.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, pageBreakBefore: ic > 0, spacing: { before: 200, after: 120 },
      children: [t('Classe ' + c, { bold: true, size: 30, color: COL_CL[c] || INK })] }));
    alunni.forEach((a) => {
      const miei = tutti.filter((x) => x.alunno_id === a.id).sort((x, y) => (x.ereditato ? 1 : 0) - (y.ereditato ? 1 : 0) || ord(x) - ord(y));
      const ok = miei.filter((x) => x.stato_it === 'approvata').length;
      const v = logica.valuta(stato, a, now);
      const area = aree[a.gruppo];
      const sotto = [area ? 'Gruppo ' + a.gruppo + ' · ' + area.it : 'Termini di tutte le aree', miei.length + ' termini', 'approvate ' + ok + '/' + miei.length];
      if (v.escluso) sotto.push('escluso');
      corpo.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 280, after: 40 }, children: [t(a.nome, { bold: true, size: 26, color: INK })] }));
      corpo.push(new D.Paragraph({ keepNext: true, spacing: { after: 100 }, children: [t(sotto.join(' · '), { size: 18, color: MUTO })] }));
      if (v.escluso && v.riassegnatoA) {
        const er = stato.alunni.find((x) => x.id === v.riassegnatoA);
        corpo.push(new D.Paragraph({ spacing: { after: 160 }, children: [t('Escluso per la scadenza: i suoi termini sono passati a ' + (er ? er.nome : v.riassegnatoA) + '.', { size: 19, italics: true, color: 'B0304A' })] }));
      }
      if (!miei.length) return;
      const righe = [new D.TableRow({ tableHeader: true, children: ['N.', 'Termine', 'Definizione approvata', 'Stato'].map((h, i) => cella(t(h, { bold: true, size: 17, color: 'FFFFFF' }), { w: W[i], fill: INK, al: i === 0 || i === 3 ? D.AlignmentType.CENTER : undefined })) })];
      let orig = null;
      miei.forEach((x, i) => {
        if (x.ereditato && x.alunno_orig !== orig) {
          orig = x.alunno_orig;
          const da = stato.alunni.find((y) => y.id === orig);
          righe.push(new D.TableRow({ children: [new D.TableCell({ columnSpan: 4, width: { size: 9638, type: D.WidthType.DXA }, borders: bordi(), shading: { fill: FONDO, type: D.ShadingType.CLEAR, color: 'auto' },
            margins: { top: 60, bottom: 60, left: 110, right: 110 }, children: [new D.Paragraph({ children: [t('Termini ricevuti da ' + (da ? da.nome : orig) + ' (escluso)', { bold: true, size: 18 })] })] })] }));
        }
        const st = x.stato_it || '', ap = st === 'approvata' && x.scelta_it != null;
        const n = Number(String(x.id).slice(2));
        righe.push(new D.TableRow({ cantSplit: true, children: [
          cella(t(n, { size: 18, color: MUTO }), { w: W[0], al: D.AlignmentType.CENTER }),
          cella([[t(x.termine_it, { bold: true, size: 19 })], [t('Area ' + x.area + ' · ' + (aree[x.area] ? aree[x.area].it : ''), { size: 15, color: MUTO })]], { w: W[1] }),
          cella(ap ? t(logica.testoDef(x.area, x.scelta_it, 'it'), { size: 19 }) : t('— non ancora approvata', { size: 18, italics: true, color: MUTO }), { w: W[2] }),
          cella(t(STATO[st] || st, { size: 16, bold: ap, color: ap ? '1B6E20' : MUTO }), { w: W[3], al: D.AlignmentType.CENTER, v: D.VerticalAlign.CENTER })
        ] }));
      });
      corpo.push(new D.Table({ width: { size: 9638, type: D.WidthType.DXA }, columnWidths: W, rows: righe }));
    });
  });

  const doc = new D.Document({
    creator: 'Prof. Danilo Cerrato', title: 'Glossario odontotecnico - definizioni approvate', description: 'Termini assegnati e definizioni approvate per studente',
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [t('Glossario odontotecnico · Prof. Danilo Cerrato · pagina ', { size: 16, color: MUTO }), new D.TextRun({ children: [D.PageNumber.CURRENT], size: 16, color: MUTO, font: 'Arial' })] })] }) },
      children: corpo
    }]
  });
  return D.Packer.toBuffer(doc);
}

module.exports = { creaWord, NOME_DROPBOX };
