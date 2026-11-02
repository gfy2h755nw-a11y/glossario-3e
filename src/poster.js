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
    (alunni || []).forEach(function (a) { nomi[a.id] = a.nome; });
    var gruppo = (alunni || []).filter(function (a) { return String(a.gruppo) === String(area.n); })
      .map(function (a) { return esc(a.nome); });
    var F = "font-family:'Archivo',Arial,sans-serif;";

    var righe = termini.map(function (t, i) {
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
          '<div style="text-align:right;' + F + lab + 'line-height:1.7"><div>Glossario odontotecnico bilingue · Bilingual dental glossary</div><div>Classe 3E · a.s. 2026/27</div></div></div>' +
        '<div style="display:flex;align-items:center;gap:14mm">' +
          '<div style="' + F + 'font-weight:900;font-size:96mm;line-height:0.8;letter-spacing:-0.04em">0' + area.n + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="' + F + 'font-weight:900;font-size:24mm;line-height:0.98;letter-spacing:-0.02em">' + esc(area.it) + '</div>' +
            '<div style="' + F + 'font-weight:600;font-style:italic;font-size:12mm;line-height:1.1;margin-top:4mm;opacity:0.92">' + esc(area.en) + '</div>' +
          '</div>' +
          '<svg width="58mm" height="58mm" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONE[area.n] + '</svg>' +
        '</div>' +
        '<div style="border-top:0.6mm solid rgba(255,255,255,0.55);padding-top:5mm;display:flex;flex-direction:column;gap:2.5mm;font-size:6mm;line-height:1.3">' +
          '<div><b>A cura di · Edited by:</b> ' + (gruppo.join(' · ') || '—') + '</div>' +
          '<div><b>Docenti · Teachers:</b> Prof. Danilo Cerrato <span style="opacity:.85">(Laboratorio odontotecnico)</span> · Prof.ssa Federica Aliboni <span style="opacity:.85">(Inglese tecnico)</span></div></div>' +
      '</div>' +
      /* intestazione tabella */
      '<div style="padding:9mm 36mm 0;display:flex;flex-direction:column;flex:1;min-height:0">' +
        '<div style="display:grid;grid-template-columns:13mm 160mm minmax(0,1fr) minmax(0,1fr);column-gap:9mm;padding:0 5mm 3mm;border-bottom:0.9mm solid #15212B;' + F + lab + 'color:#3E4C59">' +
          '<span></span><span>Termine · Term</span><span>Definizione · Italiano</span><span>Definition · English</span></div>' +
        '<div style="flex:1;min-height:0;display:flex;flex-direction:column">' + righe + '</div>' +
      '</div>' +
      /* piede */
      '<div style="margin:0 36mm;padding:6mm 0 20mm;border-top:0.9mm solid #15212B;display:flex;justify-content:space-between;gap:10mm;font-size:4.8mm;line-height:1.35;color:#2C3A47">' +
        '<span><b>Istituto Barsanti - sede Salvetti, Massa</b><br>Classe 3E · Area ' + area.n + ' di 4</span>' +
        '<span style="text-align:right">Laboratorio odontotecnico: <b>Prof. Danilo Cerrato</b><br>Inglese tecnico: <b>Prof.ssa Federica Aliboni</b></span>' +
      '</div>' +
      '</div>';
  }
  return { html: html };
})();
/* ===== POSTER-END ===== */
