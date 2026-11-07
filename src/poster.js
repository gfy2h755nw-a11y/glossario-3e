/* ===== POSTER-START: modello del cartellone 70×100 cm ===== */
var Poster = (function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function tinta(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    var m = function (c) { return Math.round(255 - (255 - c) * a); };
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  /* logo della scuola ridisegnato in vettoriale (nitido a qualsiasi formato di stampa) */
  function logo(mm) {
    var T = 'font-family:Archivo,Arial,sans-serif;font-weight:700;fill:#fff';
    return '<svg width="' + mm + 'mm" height="' + mm + 'mm" viewBox="0 0 100 100" role="img" aria-label="Logo Istituto Barsanti">' +
      '<rect width="100" height="100" fill="#EA3628"/>' +
      '<text x="15" y="15.5" textLength="66" lengthAdjust="spacingAndGlyphs" style="' + T + ';font-size:17px">BARSANTI</text>' +
      '<text x="15" y="98" textLength="65" lengthAdjust="spacingAndGlyphs" style="' + T + ';font-size:17px">SALVETTI</text>' +
      '<text transform="translate(83.5 19) rotate(90)" x="0" y="0" textLength="64" lengthAdjust="spacingAndGlyphs" style="' + T + ';font-size:17px">FIORILLO</text>' +
      '<text transform="translate(16.5 84) rotate(-90)" x="0" y="0" textLength="63" lengthAdjust="spacingAndGlyphs" style="' + T + ';font-size:17px">EINAUDI</text>' +
      '<text x="19" y="81" textLength="61" lengthAdjust="spacingAndGlyphs" style="font-family:Archivo,Arial,sans-serif;font-weight:900;fill:#fff;font-size:88px">B</text>' +
      '</svg>';
  }
  var ICONE = {
    1: '<path d="M14 6c-5 0-8 4-8 10 0 5 2 8 3 13 1 6 2 13 6 13 3 0 3-7 5-11 1-2 3-2 4 0 2 4 2 11 5 11 4 0 5-7 6-13 1-5 3-8 3-13 0-6-3-10-8-10-4 0-6 2-10 2s-6-2-10-2z"/>',
    2: '<path d="M6 18c6-8 30-8 36 0M6 30c6 8 30 8 36 0M12 18v4M18 16v6M24 15v7M30 16v6M36 18v4M12 30v-4M18 32v-6M24 33v-7M30 32v-6M36 30v-4"/>',
    3: '<path d="M18 4h12M20 4v14L8 40c-1 2 0 4 2 4h28c2 0 3-2 2-4L28 18V4M13 30h22"/>',
    4: '<path d="M24 44c-8 0-13-5-13-12 0-8 7-11 8-20 5 3 7 8 7 12 2-2 3-4 3-7 5 4 8 9 8 15 0 7-5 12-13 12z"/>'
  };

  /* area: {n,it,en,colore} · termini: [{it,en,defIt,defEn,alunno}] · alunni: [{id,nome,gruppo}] */
  function html(area, termini, alunni, opz) {
    opz = opz || {};
    var col = area.colore, chiaro = tinta(col, 0.07), medio = tinta(col, 0.18);
    var nomi = {};
    var clDi = {};
    (alunni || []).forEach(function (a) { nomi[a.id] = a.nome; clDi[a.id] = a.classe || '3E'; });
    // autori: chi ha davvero i termini di quest'area (dopo eventuali riassegnazioni), divisi per classe
    var visti = {}, perCl = {}, ordineCl = [];
    termini.forEach(function (t) {
      if (!t.alunno || visti[t.alunno]) return; visti[t.alunno] = 1;
      var c = clDi[t.alunno] || '3E'; if (!perCl[c]) { perCl[c] = []; ordineCl.push(c); }
      perCl[c].push(esc(nomi[t.alunno] || t.alunno));
    });
    var classi = (opz.classi || ordineCl.slice().sort()).filter(function (c) { return perCl[c]; });
    if (!classi.length) classi = ['3E'];
    var gruppo = classi.length > 1 ? classi.map(function (c) { return '<b style="font-weight:800">' + c + ':</b> ' + perCl[c].join(' · '); }) : (perCl[classi[0]] || []);
    var sepAut = classi.length > 1 ? ' &nbsp;&nbsp;|&nbsp;&nbsp; ' : ' · ';
    var F = "font-family:'Archivo',Arial,sans-serif;";

    var IT = !!opz.soloIt;
    // solo italiano: due colonne fino a 44 termini, tre colonne oltre (65 per area con 3E + 3F)
    var nCol = termini.length > 44 ? 3 : 2, TRE = nCol === 3;
    var meta = Math.ceil(termini.length / nCol);
    var M = TRE ? { c: 10.5, cf: 4.8, g: 4.5, p: '1mm 3.5mm', t: 8.8, d: 6, dl: 1.18, dv: 4.8, mt: 1 } : { c: 13, cf: 5.6, g: 6, p: '1.5mm 5mm', t: 10, d: 6.8, dl: 1.22, dv: 5.6, mt: 1.5 };
    function voceIt(t, i) {
      var ok = t.defIt && (!opz.soloApprovate || t.statoIt === 'approvata');
      return '<div style="flex:1;min-height:0;display:grid;grid-template-columns:' + M.c + 'mm minmax(0,1fr);column-gap:' + M.g + 'mm;align-items:center;padding:' + M.p + ';' +
        (i % 2 ? 'background:' + chiaro + ';' : '') + 'border-bottom:0.4mm solid ' + medio + '">' +
        '<div style="width:' + M.c + 'mm;height:' + M.c + 'mm;border-radius:50%;background:' + col + ';color:#fff;display:flex;align-items:center;justify-content:center;' + F + 'font-weight:800;font-size:' + M.cf + 'mm">' + (i + 1) + '</div>' +
        '<div style="min-width:0"><div style="' + F + 'font-weight:800;font-size:' + M.t + 'mm;line-height:1.05;color:#15212B">' + esc(t.it) + '</div>' +
        (ok ? '<div style="font-size:' + M.d + 'mm;line-height:' + M.dl + ';margin-top:' + M.mt + 'mm">' + esc(t.defIt) + '</div>'
          : '<div style="font-size:' + M.dv + 'mm;line-height:1.25;color:#8494A3;font-style:italic;margin-top:' + M.mt + 'mm">Definizione a cura di ' + esc(nomi[t.alunno] || '…') + '</div>') +
        '</div></div>';
    }
    var liste = [];
    for (var k = 0; k < nCol; k++) liste.push(termini.slice(k * meta, (k + 1) * meta));
    var colonne = IT ? liste.map(function (lista, c) {
      return '<div style="display:flex;flex-direction:column;min-height:0;min-width:0">' + lista.map(function (t, i) { return voceIt(t, c * meta + i); }).join('') + '</div>';
    }).join('') : '';
    var righe = IT ? '' : termini.map(function (t, i) {
      function def(testo, lingua) {
        if (testo && (!opz.soloApprovate || (lingua === 'it' ? t.statoIt : t.statoEn) === 'approvata')) {
          return '<div style="font-size:6.5mm;line-height:1.25;' + (lingua === 'en' ? 'font-style:italic;' : '') + '">' + esc(testo) + '</div>';
        }
        return '<div style="font-size:4.6mm;line-height:1.3;color:#8494A3;font-style:italic;border-bottom:0.5mm dashed #B8C3CC;padding-bottom:3mm">' +
          (lingua === 'it' ? 'Definizione a cura di ' : 'Definition by ') + esc(nomi[t.alunno] || '…') + '</div>';
      }
      return '<div style="flex:1;min-height:0;display:grid;grid-template-columns:13mm 160mm minmax(0,1fr) minmax(0,1fr);column-gap:9mm;align-items:center;padding:0 5mm;' +
        (i % 2 ? 'background:' + chiaro + ';' : '') + 'border-bottom:0.45mm solid ' + medio + '">' +
        '<div style="width:12mm;height:12mm;border-radius:50%;background:' + col + ';color:#fff;display:flex;align-items:center;justify-content:center;' + F + 'font-weight:800;font-size:5.4mm">' + (i + 1) + '</div>' +
        '<div><div style="' + F + 'font-weight:800;font-size:9.8mm;line-height:1.04;color:#15212B">' + esc(t.it) + '</div>' +
        '<div style="' + F + 'font-weight:600;font-style:italic;font-size:7.2mm;line-height:1.12;color:' + col + ';margin-top:1.8mm">' + esc(t.en) + '</div></div>' +
        '<div>' + def(t.defIt, 'it') + '</div>' +
        '<div>' + def(t.defEn, 'en') + '</div>' +
        '</div>';
    }).join('');

    var lab = 'font-size:4.6mm;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;';
    return '' +
      '<div class="poster-foglio" style="width:700mm;height:1000mm;box-sizing:border-box;background:#fff;color:#15212B;font-family:\'Atkinson Hyperlegible\',Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden">' +
      /* testata */
      '<div style="background:' + col + ';color:#fff;padding:22mm 36mm 14mm;display:flex;flex-direction:column;gap:8mm">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10mm">' +
          '<div style="display:flex;align-items:center;gap:7mm"><div style="background:#fff;padding:1.6mm;border-radius:1.5mm;line-height:0">' + logo(30) + '</div>' +
            '<div style="' + F + 'font-weight:800;font-size:11mm;line-height:1.05">Istituto Barsanti - sede Salvetti</div></div>' +
          '<div style="text-align:right;' + F + lab + 'line-height:1.7"><div>' + (IT ? 'Glossario odontotecnico' : 'Glossario odontotecnico bilingue · Bilingual dental glossary') + '</div><div>Classe ' + classi.join(' e ') + ' · a.s. 2026/27</div></div></div>' +
        '<div style="display:flex;align-items:center;gap:14mm">' +
          '<div style="' + F + 'font-weight:900;font-size:96mm;line-height:0.8;letter-spacing:-0.04em">0' + area.n + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="' + F + 'font-weight:900;font-size:24mm;line-height:0.98;letter-spacing:-0.02em">' + esc(area.it) + '</div>' +
            (IT ? '' : '<div style="' + F + 'font-weight:600;font-style:italic;font-size:12mm;line-height:1.1;margin-top:4mm;opacity:0.92">' + esc(area.en) + '</div>') +
          '</div>' +
          '<svg width="58mm" height="58mm" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONE[area.n] + '</svg>' +
        '</div>' +
        '<div style="border-top:0.6mm solid rgba(255,255,255,0.55);padding-top:5mm;display:flex;flex-direction:column;gap:2.5mm;font-size:6mm;line-height:1.3">' +
          '<div><b>' + (IT ? 'A cura di:' : 'A cura di · Edited by:') + '</b> ' + (gruppo.join(sepAut) || '—') + '</div>' +
          (IT ? '<div><b>Docente:</b> Prof. Danilo Cerrato <span style="opacity:.85">(Laboratorio odontotecnico)</span></div></div>'
            : '<div><b>Docenti · Teachers:</b> Prof. Danilo Cerrato <span style="opacity:.85">(Laboratorio odontotecnico)</span> · Prof.ssa Federica Aliboni <span style="opacity:.85">(Inglese tecnico)</span></div></div>') +
      '</div>' +
      /* intestazione tabella */
      (IT ? '<div style="padding:8mm ' + (TRE ? 24 : 30) + 'mm 0;display:flex;flex-direction:column;flex:1;min-height:0">' +
        '<div style="' + F + lab + 'color:#3E4C59;padding:0 4mm 3mm;border-bottom:0.9mm solid #15212B">Termine e definizione</div>' +
        '<div style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(' + nCol + ',minmax(0,1fr));column-gap:' + (TRE ? 6 : 10) + 'mm">' + colonne + '</div>' +
      '</div>' :
      '<div style="padding:9mm 36mm 0;display:flex;flex-direction:column;flex:1;min-height:0">' +
        '<div style="display:grid;grid-template-columns:13mm 160mm minmax(0,1fr) minmax(0,1fr);column-gap:9mm;padding:0 5mm 3mm;border-bottom:0.9mm solid #15212B;' + F + lab + 'color:#3E4C59">' +
          '<span></span><span>Termine · Term</span><span>Definizione · Italiano</span><span>Definition · English</span></div>' +
        '<div style="flex:1;min-height:0;display:flex;flex-direction:column">' + righe + '</div>' +
      '</div>') +
      /* piede */
      '<div style="margin:0 36mm;padding:6mm 0 20mm;border-top:0.9mm solid #15212B;display:flex;justify-content:space-between;gap:10mm;font-size:4.8mm;line-height:1.35;color:#2C3A47">' +
        '<span><b>Istituto Barsanti - sede Salvetti, Massa</b><br>Classe ' + classi.join(' e ') + ' · Area ' + area.n + ' di 4</span>' +
        '<span style="text-align:right">Laboratorio odontotecnico: <b>Prof. Danilo Cerrato</b>' + (IT ? '' : '<br>Inglese tecnico: <b>Prof.ssa Federica Aliboni</b>') + '</span>' +
      '</div>' +
      '</div>';
  }
  return { html: html, logo: logo };
})();
/* ===== POSTER-END ===== */
