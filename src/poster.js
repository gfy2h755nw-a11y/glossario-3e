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

  /* arcata dentale che attraversa i 4 cartelloni (notazione FDI): 1 e 2 arcata superiore, 3 e 4 inferiore */
  var QUAD = { 1: [18, 17, 16, 15, 14, 13, 12, 11], 2: [21, 22, 23, 24, 25, 26, 27, 28], 3: [48, 47, 46, 45, 44, 43, 42, 41], 4: [31, 32, 33, 34, 35, 36, 37, 38] };
  function dente(tipo, w, h) {
    // corona disegnata con il colletto in y=0 e il bordo occlusale in y=h
    var c = w * 0.36, o = w / 2, k = tipo === 'M' ? 3 : tipo === 'P' ? 2 : 0, d = 'M' + (-c) + ',0 L' + c + ',0 C' + (o * 0.95) + ',' + (h * 0.15) + ' ' + o + ',' + (h * 0.55) + ' ' + (o * 0.92) + ',' + (h * 0.88);
    if (tipo === 'C') d += ' L0,' + (h * 1.08) + ' L' + (-o * 0.92) + ',' + (h * 0.88);
    else if (!k) d += ' L' + (-o * 0.92) + ',' + (h * 0.95);
    else { var x0 = o * 0.92, step = 2 * x0 / k; for (var j = 0; j < k; j++) { var xa = x0 - j * step, xb = xa - step; d += ' Q' + ((xa + xb) / 2) + ',' + (h * 1.06) + ' ' + xb + ',' + (h * 0.93); } }
    return d + ' C' + (-o) + ',' + (h * 0.55) + ' ' + (-o * 0.95) + ',' + (h * 0.15) + ' ' + (-c) + ',0 Z';
  }
  function arcata(n, col) {
    n = Number(n); var W = 628, H = 38, A = 7, sup = n <= 2, q = QUAD[n];
    var tipo = function (f) { var u = f % 10; return u >= 6 ? 'M' : u >= 4 ? 'P' : u === 3 ? 'C' : 'I'; };
    var larg = { M: 1.25, P: 0.9, C: 0.88, I: 0.82 };
    var gx0 = (n === 2 || n === 4) ? W : 0; // posizione nel tratto di due cartelloni
    var y = function (x) { var X = gx0 + x, t = (X - W) / W; return 6 + A * (1 - t * t) + (sup ? 0 : 0); };
    var yy = function (x) { return sup ? y(x) : H - 2 - (y(x) - 6); };
    var U = 29, tot = q.reduce(function (s, f) { return s + larg[tipo(f)] * U; }, 0), gap = (W - 20 - tot) / 8, x = 10 + gap / 2, svg = '';
    var pts = []; for (var xi = 0; xi <= W; xi += 8) pts.push(xi + ',' + yy(xi).toFixed(2));
    svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="0.9" stroke-linecap="round"/>';
    q.forEach(function (f) {
      var t = tipo(f), w = larg[t] * U, cx = x + w / 2, cy = yy(cx);
      var dy = (yy(cx + 1) - yy(cx - 1)) / 2, ang = Math.atan(dy) * 180 / Math.PI, h = w * (t === 'M' ? 0.72 : t === 'P' ? 0.95 : t === 'C' ? 1.12 : 1.1);
      svg += '<g transform="translate(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ') rotate(' + ang.toFixed(2) + ')' + (sup ? '' : ' scale(1,-1)') + '"><path d="' + dente(t, w, h) + '" fill="#fff" stroke="' + col + '" stroke-width="0.8" stroke-linejoin="round"/></g>';
      svg += '<text x="' + cx.toFixed(2) + '" y="' + (sup ? cy - 2 : cy + 4.6).toFixed(2) + '" text-anchor="middle" font-size="3.6" fill="#8494A3" font-family="Arial,sans-serif">' + f + '</text>';
      x += w + gap;
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + 'mm" height="' + H + 'mm" style="display:block;overflow:visible">' + svg + '</svg>';
  }

  /* versione 2 dei denti (in prova): corone in veduta vestibolare, gengiva con papille */
  function dente2(tipo, w, h) {
    var X = function (k) { return (k * w).toFixed(2); }, Y = function (k) { return (k * h).toFixed(2); };
    if (tipo === 'I') return 'M' + X(-0.36) + ',0 C' + X(-0.46) + ',' + Y(0.3) + ' ' + X(-0.5) + ',' + Y(0.66) + ' ' + X(-0.47) + ',' + Y(0.9) + ' Q' + X(-0.45) + ',' + Y(1) + ' ' + X(-0.33) + ',' + Y(1) +
      ' L' + X(0.33) + ',' + Y(1) + ' Q' + X(0.45) + ',' + Y(1) + ' ' + X(0.47) + ',' + Y(0.9) + ' C' + X(0.5) + ',' + Y(0.66) + ' ' + X(0.46) + ',' + Y(0.3) + ' ' + X(0.36) + ',0 Z';
    if (tipo === 'L') return 'M' + X(-0.34) + ',0 C' + X(-0.45) + ',' + Y(0.3) + ' ' + X(-0.5) + ',' + Y(0.62) + ' ' + X(-0.44) + ',' + Y(0.86) + ' Q' + X(-0.38) + ',' + Y(1) + ' ' + X(-0.22) + ',' + Y(1) +
      ' L' + X(0.2) + ',' + Y(1) + ' Q' + X(0.42) + ',' + Y(1) + ' ' + X(0.46) + ',' + Y(0.8) + ' C' + X(0.5) + ',' + Y(0.6) + ' ' + X(0.45) + ',' + Y(0.3) + ' ' + X(0.34) + ',0 Z';
    if (tipo === 'C' || tipo === 'P') {
      var t = tipo === 'C' ? 0.05 : 0.1, sp = tipo === 'C' ? 0.78 : 0.82;
      return 'M' + X(-0.36) + ',0 C' + X(-0.47) + ',' + Y(0.3) + ' ' + X(-0.5) + ',' + Y(0.58) + ' ' + X(-0.43) + ',' + Y(sp) + ' L' + X(-t) + ',' + Y(0.99) + ' Q0,' + Y(1.03) + ' ' + X(t) + ',' + Y(0.99) +
        ' L' + X(0.44) + ',' + Y(sp - 0.06) + ' C' + X(0.5) + ',' + Y(0.55) + ' ' + X(0.47) + ',' + Y(0.3) + ' ' + X(0.36) + ',0 Z';
    }
    // molare: due cuspidi vestibolari e solco
    return 'M' + X(-0.4) + ',0 C' + X(-0.5) + ',' + Y(0.25) + ' ' + X(-0.53) + ',' + Y(0.6) + ' ' + X(-0.46) + ',' + Y(0.84) + ' Q' + X(-0.38) + ',' + Y(1.02) + ' ' + X(-0.22) + ',' + Y(1) +
      ' Q' + X(-0.06) + ',' + Y(1) + ' 0,' + Y(0.955) + ' Q' + X(0.06) + ',' + Y(1) + ' ' + X(0.22) + ',' + Y(1) + ' Q' + X(0.38) + ',' + Y(1.02) + ' ' + X(0.46) + ',' + Y(0.84) +
      ' C' + X(0.53) + ',' + Y(0.6) + ' ' + X(0.5) + ',' + Y(0.25) + ' ' + X(0.4) + ',0 Z';
  }
  function arcata2(n, col, chiaroCol) {
    n = Number(n); var W = 628, H = 48, A = 8, sup = n <= 2, q = QUAD[n], s = sup ? 1 : -1; // s: verso occlusale
    var tipo = function (f) { var u = f % 10; return u >= 6 ? 'M' : u >= 4 ? 'P' : u === 3 ? 'C' : u === 2 ? 'L' : 'I'; };
    var dim = { M: [1.22, 0.78], P: [0.86, 1.0], C: [0.9, 1.18], L: [0.74, 1.05], I: [0.9, 1.16] }; // larghezza, altezza/larghezza
    var gx0 = (n === 2 || n === 4) ? W : 0;
    var curva = function (x) { var t = (gx0 + x - W) / W; return A * (1 - t * t); };
    var yy = function (x) { return sup ? 10 + curva(x) : H - 10 - curva(x); }; // linea del colletto
    var U = 31, tot = q.reduce(function (a, f) { return a + dim[tipo(f)][0] * U; }, 0), gap = (W - 30 - tot) / 8, x = 15 + gap / 2;
    var denti = q.map(function (f) { var t = tipo(f), w = dim[t][0] * U, d = { f: f, t: t, w: w, x0: x, cx: x + w / 2, h: w * dim[t][1] }; x += w + gap; return d; });
    // bordo gengivale: papille tra un dente e l'altro
    // festoni: sul dente il margine sale a arco (colletto scoperto al centro), tra i denti la gengiva resta piena
    var P = 4.6, marg = function (xx) { for (var k = 0; k < denti.length; k++) { var d = denti[k], a = d.x0 - 1.2, b = d.x0 + d.w + 1.2; if (xx >= a && xx <= b) return P * (1 - Math.sin(Math.PI * (xx - a) / (b - a))); } return P; };
    var top = [], bot = [];
    for (var xi = 0; xi <= W; xi += 2) { top.push(xi + ',' + (yy(xi) - s * 7.5).toFixed(2)); bot.push(xi + ',' + (yy(xi) + s * marg(xi)).toFixed(2)); }
    var svg = denti.map(function (d) {
      var cy = yy(d.cx), ang = Math.atan((yy(d.cx + 1) - yy(d.cx - 1)) / 2) * 180 / Math.PI;
      return '<g transform="translate(' + d.cx.toFixed(2) + ',' + (cy - s * 1.2).toFixed(2) + ') rotate(' + ang.toFixed(2) + ')' + (sup ? '' : ' scale(1,-1)') + '">' +
        '<path d="' + dente2(d.t, d.w, d.h) + '" fill="#fff" stroke="' + col + '" stroke-width="0.75" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="M' + (-d.w * 0.22).toFixed(2) + ',' + (d.h * 0.3).toFixed(2) + ' Q' + (-d.w * 0.27).toFixed(2) + ',' + (d.h * 0.55).toFixed(2) + ' ' + (-d.w * 0.2).toFixed(2) + ',' + (d.h * 0.74).toFixed(2) + '" fill="none" stroke="' + col + '" stroke-width="0.45" stroke-opacity="0.35" stroke-linecap="round"/></g>';
    }).join('');
    svg += '<path d="M' + top.join(' L') + ' L' + bot.reverse().join(' L') + ' Z" fill="' + chiaroCol + '" stroke="' + col + '" stroke-width="0.6" stroke-linejoin="round"/>';
    svg += denti.map(function (d) { return '<text x="' + d.cx.toFixed(2) + '" y="' + (yy(d.cx) - s * 2.2 + (sup ? 0 : 1.2)).toFixed(2) + '" text-anchor="middle" font-size="3.3" fill="' + col + '" font-family="Arial,sans-serif" font-weight="700">' + d.f + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + 'mm" height="' + H + 'mm" style="display:block;overflow:visible">' + svg + '</svg>';
  }

  /* versione 3 (in prova): denti con volume — smalto sfumato, riflessi, ombre, gengiva rosa */
  function arcata3(n, col) {
    n = Number(n); var W = 628, H = 49, A = 7, sup = n <= 2, q = QUAD[n], s = sup ? 1 : -1, id = 'a3n' + n;
    var tipo = function (f) { var u = f % 10; return u >= 6 ? 'M' : u >= 4 ? 'P' : u === 3 ? 'C' : u === 2 ? 'L' : 'I'; };
    var dim = { M: [1.22, 0.78], P: [0.86, 1.0], C: [0.9, 1.18], L: [0.74, 1.05], I: [0.9, 1.16] };
    var gx0 = (n === 2 || n === 4) ? W : 0;
    var curva = function (x) { var t = (gx0 + x - W) / W; return A * (1 - t * t); };
    var yy = function (x) { return sup ? 11 + curva(x) : H - 11 - curva(x); };
    var U = 30, tot = q.reduce(function (a, f) { return a + dim[tipo(f)][0] * U; }, 0), gap = (W - 30 - tot) / 8, x = 15 + gap / 2;
    var denti = q.map(function (f) { var t = tipo(f), w = dim[t][0] * U, d = { f: f, t: t, w: w, x0: x, cx: x + w / 2, h: w * dim[t][1] }; x += w + gap; return d; });
    var P = 5, marg = function (xx) { for (var k = 0; k < denti.length; k++) { var d = denti[k], a = d.x0 - 1.4, b = d.x0 + d.w + 1.4; if (xx >= a && xx <= b) return P * (1 - Math.sin(Math.PI * (xx - a) / (b - a))); } return P; };
    var defs = '<defs>' +
      // smalto: luce dall'alto a sinistra, bordi più scuri
      '<radialGradient id="' + id + 'sm" cx="0.38" cy="' + (sup ? 0.42 : 0.58) + '" r="0.75"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="#F7F2E4"/><stop offset="0.8" stop-color="#E4D9BF"/><stop offset="1" stop-color="#C9BB98"/></radialGradient>' +
      // bordo incisale più traslucido
      '<linearGradient id="' + id + 'in" x1="0" y1="' + (sup ? 0 : 1) + '" x2="0" y2="' + (sup ? 1 : 0) + '"><stop offset="0.72" stop-color="#C9D6E0" stop-opacity="0"/><stop offset="1" stop-color="#B9CBD8" stop-opacity="0.55"/></linearGradient>' +
      // gengiva: rosa con volume
      '<linearGradient id="' + id + 'gg" x1="0" y1="' + (sup ? 0 : 1) + '" x2="0" y2="' + (sup ? 1 : 0) + '"><stop offset="0" stop-color="#B9606B"/><stop offset="0.55" stop-color="#E08C93"/><stop offset="1" stop-color="#F0B3B6"/></linearGradient>' +
      '<filter id="' + id + 'om" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.1"/><feOffset dx="0.9" dy="' + (sup ? 1.3 : -1.3) + '" result="o"/><feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>';
    var top = [], bot = [];
    for (var xi = 0; xi <= W; xi += 2) { top.push(xi + ',' + (yy(xi) - s * 9).toFixed(2)); bot.push(xi + ',' + (yy(xi) + s * marg(xi)).toFixed(2)); }
    var svg = defs + denti.map(function (d) {
      var cy = yy(d.cx), ang = Math.atan((yy(d.cx + 1) - yy(d.cx - 1)) / 2) * 180 / Math.PI, path = dente2(d.t, d.w, d.h);
      return '<g filter="url(#' + id + 'om)" transform="translate(' + d.cx.toFixed(2) + ',' + (cy - s * 1.5).toFixed(2) + ') rotate(' + ang.toFixed(2) + ')' + (sup ? '' : ' scale(1,-1)') + '">' +
        '<path d="' + path + '" fill="url(#' + id + 'sm)" stroke="#A8977A" stroke-width="0.35" stroke-linejoin="round"/>' +
        '<path d="' + path + '" fill="url(#' + id + 'in)" stroke="none"/>' +
        // riflesso dello smalto
        '<ellipse cx="' + (-d.w * 0.16).toFixed(2) + '" cy="' + (d.h * 0.42).toFixed(2) + '" rx="' + (d.w * 0.09).toFixed(2) + '" ry="' + (d.h * 0.2).toFixed(2) + '" fill="#FFFFFF" opacity="0.85"/>' +
        '<ellipse cx="' + (d.w * 0.2).toFixed(2) + '" cy="' + (d.h * 0.5).toFixed(2) + '" rx="' + (d.w * 0.05).toFixed(2) + '" ry="' + (d.h * 0.12).toFixed(2) + '" fill="#FFFFFF" opacity="0.4"/>' +
        // ombra al colletto
        '<path d="M' + (-d.w * 0.36).toFixed(2) + ',0.6 Q0,' + (d.h * 0.16).toFixed(2) + ' ' + (d.w * 0.36).toFixed(2) + ',0.6" fill="none" stroke="#B9A57E" stroke-width="1.2" stroke-opacity="0.45" stroke-linecap="round"/></g>';
    }).join('');
    svg += '<path d="M' + top.join(' L') + ' L' + bot.reverse().join(' L') + ' Z" fill="url(#' + id + 'gg)" stroke="#A9505C" stroke-width="0.35" stroke-linejoin="round"/>';
    // riflesso lungo la gengiva
    var luce = []; for (var xj = 4; xj <= W - 4; xj += 3) luce.push(xj + ',' + (yy(xj) - s * 6.2).toFixed(2));
    svg += '<polyline points="' + luce.join(' ') + '" fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="1.1" stroke-linecap="round"/>';
    svg += denti.map(function (d) { return '<text x="' + d.cx.toFixed(2) + '" y="' + (yy(d.cx) - s * 3.4 + (sup ? 0 : 1.2)).toFixed(2) + '" text-anchor="middle" font-size="3.4" fill="#FFFFFF" font-family="Arial,sans-serif" font-weight="700">' + d.f + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + 'mm" height="' + H + 'mm" style="display:block;overflow:visible">' + svg + '</svg>';
  }
  function qrPoster(testo, mm) {
    if (typeof qrcode !== 'function') return '';
    var q = qrcode(0, 'M'); q.addData(testo); q.make();
    var n = q.getModuleCount(), m = 1, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + mm + 'mm" height="' + mm + 'mm" viewBox="0 0 ' + (n + 2 * m) + ' ' + (n + 2 * m) + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#15212B"/></svg>';
  }
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
    var M = TRE ? { c: 10.5, cf: 4.8, g: 4.5, p: '1mm 3.5mm', t: 8.6, d: 5.8, dl: 1.16, dv: 4.8, mt: 1 } : { c: 13, cf: 5.6, g: 6, p: '1.5mm 5mm', t: 10, d: 6.8, dl: 1.22, dv: 5.6, mt: 1.5 };
    if (TRE && (opz.arcata || opz.firme)) { M.t = 8.2; M.d = 5.2; M.dl = 1.13; M.mt = 0.8; }
    function voceIt(t, i) {
      var ok = t.defIt && (!opz.soloApprovate || t.statoIt === 'approvata');
      return '<div style="flex:1;min-height:0;display:grid;grid-template-columns:' + M.c + 'mm minmax(0,1fr);column-gap:' + M.g + 'mm;align-items:center;padding:' + M.p + ';' +
        (opz.evidenzia && t.alunno === opz.evidenzia ? 'background:#FFE98A;box-shadow:inset 1.6mm 0 0 #15212B;' : i % 2 ? 'background:' + chiaro + ';' : '') + 'border-bottom:0.4mm solid ' + medio + '">' +
        '<div style="width:' + M.c + 'mm;height:' + M.c + 'mm;border-radius:50%;background:' + col + ';color:#fff;display:flex;align-items:center;justify-content:center;' + F + 'font-weight:800;font-size:' + M.cf + 'mm">' + (i + 1) + '</div>' +
        '<div style="min-width:0"><div style="' + F + 'font-weight:800;font-size:' + M.t + 'mm;line-height:1.05;color:#15212B">' + esc(t.it) + '</div>' +
        (ok ? '<div style="font-size:' + M.d + 'mm;line-height:' + M.dl + ';margin-top:' + M.mt + 'mm">' + esc(t.defIt) +
            (nomi[t.alunno] ? ' <span style="font-size:' + (M.dv * 0.92).toFixed(2) + 'mm;font-style:italic;color:#5B6976;white-space:nowrap">— ' + esc(nomi[t.alunno]) + '</span>' : '') + '</div>'
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
      /* firme a mano degli autori (spazio vuoto con righe) e arcata dentale continua */
      (IT && opz.firme ? '<div style="margin:5mm 36mm 0;border:0.7mm solid ' + col + ';background:' + chiaro + ';border-radius:3mm;position:relative;padding:5mm 5mm 3mm">' +
        '<div style="position:absolute;left:6mm;top:-3.6mm;background:' + col + ';color:#fff;padding:0.8mm 3mm;border-radius:1.5mm;font-size:4.2mm;' + F + 'font-weight:800;letter-spacing:0.4mm;text-transform:uppercase">Firme degli autori</div>' +
        '<div style="height:24mm"></div></div>' : '') +
      (IT && opz.arcata ? '<div style="margin:' + (Number(area.n) >= 3 ? 5 : 2.5) + 'mm 36mm 0;display:flex;justify-content:center">' + (opz.denti === 3 ? arcata3(area.n, col) : opz.denti === 2 ? arcata2(area.n, col, chiaro) : arcata(area.n, col)) + '</div>' : '') +
      /* motto: una parola per cartellone, da leggere sui quattro affiancati */
      (IT ? (function () {
        var MOTTO = ['Nomina', 'sunt', 'consequentia', 'rerum'], w = MOTTO[Number(area.n) - 1], ALTO = opz.arcata || opz.firme ? 30 : 46;
        if (!w) return '';
        var ultimo = Number(area.n) === 4;
        return '<div style="margin:' + (opz.arcata ? 0 : 5) + 'mm 36mm 0;height:' + ALTO + 'mm;display:flex;flex-direction:column;align-items:center;justify-content:center' + (opz.arcata ? '' : ';border-top:0.4mm solid ' + medio) + '">' +
          '<div style="font-family:\'Cormorant Garamond\',Georgia,serif;font-style:italic;font-weight:600;font-size:' + (opz.arcata || opz.firme ? 33 : 36) + 'mm;line-height:1;color:' + col + ';letter-spacing:0.5mm">' + esc(w) + (ultimo ? '.' : '…') + '</div>' +
          '</div>';
      })() : '') +
      /* piede */
      '<div style="margin:0 36mm;padding:6mm 0 20mm;border-top:0.9mm solid #15212B;display:flex;justify-content:space-between;gap:10mm;font-size:4.8mm;line-height:1.35;color:#2C3A47">' +
        '<span><b>Istituto Barsanti - sede Salvetti, Massa</b><br>Classe ' + classi.join(' e ') + ' · Area ' + area.n + ' di 4</span>' +
        '<span style="flex:1;text-align:center;align-self:center"><b>Metodologia:</b> compito di realtà in modalità digitale,<br>con valutazione formativa e feedback immediato.</span>' +
        (IT && opz.qr ? '<span style="display:flex;align-items:center;gap:3mm">' + qrPoster(opz.qr, 24) + '<span style="font-size:4.2mm;line-height:1.3"><b>Consulta il glossario</b><br>dal telefono</span></span>' : '') +
        '<span style="text-align:right">Laboratorio odontotecnico: <b>Prof. Danilo Cerrato</b>' + (IT ? '' : '<br>Inglese tecnico: <b>Prof.ssa Federica Aliboni</b>') + '</span>' +
      '</div>' +
      '</div>';
  }
  return { html: html, logo: logo };
})();
/* ===== POSTER-END ===== */
