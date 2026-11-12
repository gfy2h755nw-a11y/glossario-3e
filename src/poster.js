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

  /* icone ridisegnate (in prova): badge bianco con disegno bicolore nel colore dell'area */
  function icona2(n, c) {
    var t = 'fill="' + c + '" fill-opacity="0.2"', st = 'stroke="' + c + '" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"';
    var I = {
      // molare in sezione: smalto, dentina, camera pulpare e canali
      1: '<path d="M14 22C14 12 18 9 23 10C26 10.5 28 13 32 13C36 13 38 10.5 41 10C46 9 50 12 50 22C50 28 47 31 46 36L44 52C43.6 55 40 55 39.5 52L37 40C36.5 37 27.5 37 27 40L24.5 52C24 55 20.4 55 20 52L18 36C17 31 14 28 14 22Z" fill="#fff" ' + st + '/>' +
        '<path d="M14 22C14 12 18 9 23 10C26 10.5 28 13 32 13C36 13 38 10.5 41 10C46 9 50 12 50 22C50 25.5 49.2 28 48.2 30.5Q32 34.5 15.8 30.5C14.8 28 14 25.5 14 22Z" ' + t + '/>' +
        '<path d="M15.8 30.5Q32 34.5 48.2 30.5" fill="none" ' + st + ' stroke-width="1.1"/>' +
        '<path d="M26 24C26 20 38 20 38 24L38 29C38 31 39.5 33 40.5 37L42 50L40.6 50L38.6 39C37.5 36 34.5 34 32 34C29.5 34 26.5 36 25.4 39L23.4 50L22 50L23.5 37C24.5 33 26 31 26 29Z" fill="' + c + '"/>',
      // due molari antagonisti che ingranano (superiore capovolto, sfalsato di mezza cuspide) + piano occlusale
      2: '<g transform="translate(36.6 31.2) scale(0.6 -0.6) translate(-32 -10)"><path d="M14 22C14 12 18 9 23 10C26 10.5 28 13 32 13C36 13 38 10.5 41 10C46 9 50 12 50 22C50 28 47 31 46 36L44 52C43.6 55 40 55 39.5 52L37 40C36.5 37 27.5 37 27 40L24.5 52C24 55 20.4 55 20 52L18 36C17 31 14 28 14 22Z" fill="#fff" ' + st + ' stroke-width="2.6"/><path d="M14 22C14 12 18 9 23 10C26 10.5 28 13 32 13C36 13 38 10.5 41 10C46 9 50 12 50 22C50 25.5 49.2 28 48.2 30.5Q32 34.5 15.8 30.5C14.8 28 14 25.5 14 22Z" ' + t + '/></g>' +
        '<g transform="translate(32 32.8) scale(0.6) translate(-32 -10)"><path d="M14 22C14 12 18 9 23 10C26 10.5 28 13 32 13C36 13 38 10.5 41 10C46 9 50 12 50 22C50 28 47 31 46 36L44 52C43.6 55 40 55 39.5 52L37 40C36.5 37 27.5 37 27 40L24.5 52C24 55 20.4 55 20 52L18 36C17 31 14 28 14 22Z" fill="#fff" ' + st + ' stroke-width="2.6"/><path d="M14 22C14 12 18 9 23 10C26 10.5 28 13 32 13C36 13 38 10.5 41 10C46 9 50 12 50 22C50 25.5 49.2 28 48.2 30.5Q32 34.5 15.8 30.5C14.8 28 14 25.5 14 22Z" ' + t + '/></g>' +
        '<path d="M5 32H59" fill="none" stroke="' + c + '" stroke-width="1.1" stroke-dasharray="2 2.2" stroke-linecap="round" stroke-opacity="0.8"/>',
      // polvere e liquido: vasetto di polimero e flacone di monomero
      3: '<path d="M8 36h22v14a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#fff" ' + st + '/><path d="M8 36h22v14a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" ' + t + '/>' +
        '<path d="M10 36c2-5 6-7 9-7s7 2 9 7" fill="' + c + '" fill-opacity="0.45" ' + st + ' stroke-width="1.2"/><rect x="6" y="33" width="26" height="4" rx="1.5" fill="#fff" ' + st + '/>' +
        '<path d="M38 26h14v24a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" fill="#fff" ' + st + '/><path d="M38 38h14v12a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" fill="' + c + '" fill-opacity="0.3"/>' +
        '<path d="M41 26v-5h8v5M43 21v-6h4v6" fill="#fff" ' + st + '/><path d="M45 15v-4" ' + st + ' fill="none"/><path d="M45 6.5c-1.4 2-2 3-2 4a2 2 0 0 0 4 0c0-1-.6-2-2-4z" fill="' + c + '"/>',
      // micromotore da laboratorio con fresa
      4: '<g transform="rotate(-38 32 32)"><path d="M4 32C2 32 1 35 3 37C6 40 10 37 12 36" fill="none" ' + st + '/>' +
        '<rect x="11" y="26" width="30" height="12" rx="6" fill="#fff" ' + st + '/><rect x="11" y="26" width="30" height="12" rx="6" ' + t + '/>' +
        '<path d="M17 26V38M21 26V38M25 26V38" fill="none" stroke="' + c + '" stroke-width="1.1" stroke-linecap="round"/>' +
        '<path d="M41 27.5L50 30.2V33.8L41 36.5Z" fill="#fff" ' + st + '/>' +
        '<path d="M50 32H58.5" fill="none" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round"/><circle cx="59.2" cy="32" r="2.1" fill="' + c + '"/></g>' +
        '<path d="M46 50l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z" fill="' + c + '" fill-opacity="0.7"/>'
    };
    return '<svg width="64mm" height="64mm" viewBox="0 0 80 80" aria-hidden="true" style="flex:none">' +
      '<circle cx="40" cy="41.2" r="37" fill="#000" fill-opacity="0.16"/><circle cx="40" cy="40" r="37" fill="#fff"/>' +
      '<circle cx="40" cy="40" r="33" fill="none" stroke="' + c + '" stroke-opacity="0.25" stroke-width="0.8"/>' +
      '<g transform="translate(8 8)">' + I[n] + '</g></svg>';
  }

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

  /* decorazioni alternative (in prova), continue sui quattro cartelloni */
  // A · ortopantomografia stilizzata: 16 denti per arcata distribuiti sui 4 cartelloni
  function decoOPT(n) {
    n = Number(n); var W = 628, H = 50, id = 'opt' + n;
    var ord = { 1: [[18, 17, 16, 15], [48, 47, 46, 45]], 2: [[14, 13, 12, 11], [44, 43, 42, 41]], 3: [[21, 22, 23, 24], [31, 32, 33, 34]], 4: [[25, 26, 27, 28], [35, 36, 37, 38]] }[n];
    var tipo = function (f) { var u = f % 10; return u >= 6 ? 'M' : u >= 4 ? 'P' : u === 3 ? 'C' : u === 2 ? 'L' : 'I'; };
    var larg = { M: 1.3, P: 0.95, C: 0.95, L: 0.8, I: 0.95 };
    var G = 4 * W, piano = function (gx) { var t = (gx - G / 2) / (G / 2); return 25 + 3.5 * t * t; };
    var x0 = (n - 1) * W, r0 = n === 1 ? 10 : 0, r1 = n === 4 ? 10 : 0;
    var defs = '<defs><linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1820"/><stop offset="0.5" stop-color="#22323F"/><stop offset="1" stop-color="#0E1820"/></linearGradient>' +
      '<linearGradient id="' + id + 'de" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D3DA"/><stop offset="0.5" stop-color="#F4F7F9"/><stop offset="1" stop-color="#C9D3DA"/></linearGradient>' +
      '<radialGradient id="' + id + 'vg" cx="0.5" cy="0.5" r="0.7"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient></defs>';
    var svg = defs + '<path d="M' + r0 + ',0H' + (W - r1) + (r1 ? 'Q' + W + ',0 ' + W + ',' + r1 : '') + 'V' + (H - r1) + (r1 ? 'Q' + W + ',' + H + ' ' + (W - r1) + ',' + H : '') + 'H' + r0 + (r0 ? 'Q0,' + H + ' 0,' + (H - r0) : '') + 'V' + r0 + (r0 ? 'Q0,0 ' + r0 + ',0' : '') + 'Z" fill="url(#' + id + 'bg)"/>';
    // osso mascellare e mandibolare: velature
    var curvaSu = [], curvaGiu = [];
    for (var xi = 0; xi <= W; xi += 4) { var gx = x0 + xi; curvaSu.push(xi + ',' + (piano(gx) - 22).toFixed(2)); curvaGiu.push(xi + ',' + (piano(gx) + 22).toFixed(2)); }
    svg += '<path d="M0,0 L' + curvaSu.join(' L') + ' L' + W + ',0Z" fill="#fff" fill-opacity="0.05"/>';
    svg += '<path d="M0,' + H + ' L' + curvaGiu.join(' L') + ' L' + W + ',' + H + 'Z" fill="#fff" fill-opacity="0.05"/>';
    [0, 1].forEach(function (riga) {
      var q = ord[riga], sup = riga === 0, U = 30, tot = q.reduce(function (a, f) { return a + larg[tipo(f)] * U; }, 0), gap = (W - tot) / 4, x = gap / 2;
      q.forEach(function (f) {
        var t = tipo(f), w = larg[t] * U, cx = x + w / 2, py = piano(x0 + cx), hc = w * (t === 'M' ? 0.62 : 0.8), hr = t === 'M' ? 13 : t === 'C' ? 17 : 15;
        // dente intero: corona verso il piano occlusale, radici verso l'osso
        var k = sup ? -1 : 1, yc = py + k * 1.2;
        var d = 'M' + (cx - w * 0.42) + ',' + yc + ' C' + (cx - w * 0.5) + ',' + (yc + k * hc * 0.5) + ' ' + (cx - w * 0.44) + ',' + (yc + k * hc) + ' ' + (cx - w * 0.33) + ',' + (yc + k * hc) +
          (t === 'M' ? ' L' + (cx - w * 0.3) + ',' + (yc + k * (hc + hr)) + ' Q' + (cx - w * 0.2) + ',' + (yc + k * (hc + hr + 1.5)) + ' ' + (cx - w * 0.1) + ',' + (yc + k * (hc + hr * 0.92)) + ' L' + (cx - w * 0.02) + ',' + (yc + k * (hc + 2)) +
            ' L' + (cx + w * 0.02) + ',' + (yc + k * (hc + 2)) + ' L' + (cx + w * 0.1) + ',' + (yc + k * (hc + hr * 0.92)) + ' Q' + (cx + w * 0.2) + ',' + (yc + k * (hc + hr + 1.5)) + ' ' + (cx + w * 0.3) + ',' + (yc + k * (hc + hr))
           : ' Q' + (cx - w * 0.2) + ',' + (yc + k * (hc + hr * 0.6)) + ' ' + cx + ',' + (yc + k * (hc + hr)) + ' Q' + (cx + w * 0.2) + ',' + (yc + k * (hc + hr * 0.6)) + ' ' + (cx + w * 0.33) + ',' + (yc + k * hc)) +
          (t === 'M' ? ' L' + (cx + w * 0.33) + ',' + (yc + k * hc) : '') + ' C' + (cx + w * 0.44) + ',' + (yc + k * hc) + ' ' + (cx + w * 0.5) + ',' + (yc + k * hc * 0.5) + ' ' + (cx + w * 0.42) + ',' + yc + ' Z';
        svg += '<path d="' + d + '" fill="url(#' + id + 'de)" fill-opacity="0.92" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="0.3"/>';
        // smalto più radiopaco
        svg += '<path d="M' + (cx - w * 0.42) + ',' + yc + ' C' + (cx - w * 0.5) + ',' + (yc + k * hc * 0.4) + ' ' + (cx - w * 0.46) + ',' + (yc + k * hc * 0.62) + ' ' + (cx - w * 0.36) + ',' + (yc + k * hc * 0.62) + ' L' + (cx + w * 0.36) + ',' + (yc + k * hc * 0.62) + ' C' + (cx + w * 0.46) + ',' + (yc + k * hc * 0.62) + ' ' + (cx + w * 0.5) + ',' + (yc + k * hc * 0.4) + ' ' + (cx + w * 0.42) + ',' + yc + 'Z" fill="#fff" fill-opacity="0.85"/>';
        // camera pulpare
        svg += '<path d="M' + (cx - w * 0.14) + ',' + (yc + k * hc * 0.68) + ' Q' + cx + ',' + (yc + k * hc * 0.55) + ' ' + (cx + w * 0.14) + ',' + (yc + k * hc * 0.68) + ' L' + cx + ',' + (yc + k * (hc + hr * 0.8)) + ' Z" fill="#22323F" fill-opacity="0.55"/>';
        x += w + gap;
      });
    });
    svg += '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'vg)" />';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + 'mm" height="' + H + 'mm" style="display:block">' + svg + '</svg>';
  }
  // C · nastro di colore: un'onda che attraversa i 4 cartelloni sfumando dal blu al verde (colori delle aree)
  function decoNastro(n) {
    n = Number(n); var W = 700, H = 48, G = 4 * W, x0 = (n - 1) * W, id = 'ns' + n;
    var COL = ['#1F5FA8', '#6A4FA0', '#B4511A', '#2E7D32'];
    var stop = COL.map(function (c, k) { return '<stop offset="' + (k / 3).toFixed(3) + '" stop-color="' + c + '"/>'; }).join('');
    var defs = '<defs><linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="' + (-x0 + W * 0.5) + '" y1="0" x2="' + (G - x0 - W * 0.5) + '" y2="0">' + stop + '</linearGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></linearGradient></defs>';
    var svg = defs;
    // tre nastri sovrapposti, con fase e spessore diversi
    [[0, 11, 0.95, 1], [1.7, 6, 0.6, 0.8], [3.4, 3.5, 0.4, 1.25]].forEach(function (r) {
      var su = [], giu = [];
      for (var xi = 0; xi <= W; xi += 3) {
        var gx = x0 + xi, f = 2 * Math.PI * gx / G * 3 * r[3] + r[0];
        var c = 24 + 10 * Math.sin(f), sp = r[1] * (0.55 + 0.45 * Math.cos(f * 0.5 + 1));
        su.push(xi + ',' + (c - sp).toFixed(2)); giu.push(xi + ',' + (c + sp).toFixed(2));
      }
      var d = 'M' + su.join(' L') + ' L' + giu.reverse().join(' L') + 'Z';
      svg += '<path d="' + d + '" fill="url(#' + id + 'g)" fill-opacity="' + r[2] + '"/><path d="' + d + '" fill="url(#' + id + 'l)" fill-opacity="' + r[2] + '"/>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + 'mm" height="' + H + 'mm" style="display:block">' + svg + '</svg>';
  }
  // B · nastro di parole: i termini dell'area scorrono su onde continue da un cartellone all'altro
  function decoParole(n, termini, col) {
    n = Number(n); var W = 700, H = 50, G = 4 * W, x0 = (n - 1) * W;
    var parole = termini.map(function (t) { return t.it; });
    var righe = [{ y: 12, a: 5, f: 1, fs: 6.2, op: 1, peso: 700, serif: false, off: 0 }, { y: 26, a: 5, f: 1, fs: 9, op: 0.9, peso: 600, serif: true, off: 21 }, { y: 40, a: 5, f: 1, fs: 5.6, op: 0.6, peso: 700, serif: false, off: 43 }];
    var svg = '<defs>';
    righe.forEach(function (r, k) {
      var pts = []; for (var xi = -20; xi <= W + 20; xi += 4) { var gx = x0 + xi; pts.push(xi + ',' + (r.y + r.a * Math.sin(2 * Math.PI * r.f * gx / G * 3)).toFixed(2)); }
      svg += '<path id="np' + n + k + '" d="M' + pts.join(' L') + '"/>';
    });
    svg += '</defs>';
    righe.forEach(function (r, k) {
      var testo = []; for (var j = 0; j < 30; j++) testo.push(parole[(r.off + j) % parole.length]);
      svg += '<text font-size="' + r.fs + '" fill="' + col + '" fill-opacity="' + r.op + '" font-weight="' + r.peso + '" style="font-family:' + (r.serif ? '\'Cormorant Garamond\',Georgia,serif;font-style:italic' : 'Archivo,Arial,sans-serif;letter-spacing:0.3px;text-transform:uppercase') + '"><textPath href="#np' + n + k + '" startOffset="-' + (k * 37 + n * 13) + '">' + testo.map(esc).join('  ·  ') + '</textPath></text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + 'mm" height="' + H + 'mm" style="display:block;overflow:hidden">' + svg + '</svg>';
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
          (opz.icone === 2 ? icona2(Number(area.n), col) : '<svg width="58mm" height="58mm" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONE[area.n] + '</svg>') +
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
      (IT && opz.arcata ? '<div style="margin:' + (opz.deco === 'nastro' || opz.deco === 'parole' ? '4mm 0 0' : (Number(area.n) >= 3 ? 5 : 2.5) + 'mm 36mm 0') + ';display:flex;justify-content:center">' + (opz.deco === 'opt' ? decoOPT(area.n) : opz.deco === 'nastro' ? decoNastro(area.n) : opz.deco === 'parole' ? decoParole(area.n, termini, col) : opz.denti === 3 ? arcata3(area.n, col) : opz.denti === 2 ? arcata2(area.n, col, chiaro) : arcata(area.n, col)) + '</div>' : '') +
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


  /* versione alfabetica (approvata 12/11/2026): termini A–Z dentro l'area, lettere guida, indice A–Z,
     testata sfumata con numero gigante, motto latino grande sopra il nastro continuo. Dopo l'inserimento chiamare Poster.adatta(foglio). */
  function scuro(hex, f) {
    var h = hex.replace('#', ''), v = [0, 2, 4].map(function (i) { return Math.round(parseInt(h.substr(i, 2), 16) * f); });
    return 'rgb(' + v.join(',') + ')';
  }
  function iniziale(s) { return String(s || '').normalize('NFD').charAt(0).toUpperCase(); }
  function ordinaAlfa(termini) {
    return termini.slice().sort(function (x, y) { return String(x.it).localeCompare(String(y.it), 'it', { sensitivity: 'base' }); });
  }
  function nastroAlfa(n) {
    n = Number(n); var W = 700, H = 56, G = 4 * W, x0 = (n - 1) * W, id = 'na' + n;
    var COL = ['#1F5FA8', '#6B4FA0', '#B4511A', '#2E7D32'];
    var svg = '<defs><linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="' + (-x0 + W * 0.5) + '" y1="0" x2="' + (G - x0 - W * 0.5) + '" y2="0">' +
      COL.map(function (c, k) { return '<stop offset="' + (k / 3).toFixed(3) + '" stop-color="' + c + '"/>'; }).join('') + '</linearGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient></defs>';
    [[0, 11, 0.95, 1], [1.7, 6, 0.6, 0.8], [3.4, 3.5, 0.4, 1.25]].forEach(function (r) {
      var su = [], giu = [];
      for (var x = 0; x <= W; x += 3) { var gx = x0 + x, f = 2 * Math.PI * gx / G * 3 * r[3] + r[0], c = 30 + 12 * Math.sin(f), sp = r[1] * (0.55 + 0.45 * Math.cos(f * 0.5 + 1)); su.push(x + ',' + (c - sp).toFixed(2)); giu.push(x + ',' + (c + sp).toFixed(2)); }
      var d = 'M' + su.join(' L') + ' L' + giu.reverse().join(' L') + 'Z';
      svg += '<path d="' + d + '" fill="url(#' + id + 'g)" fill-opacity="' + r[2] + '"/><path d="' + d + '" fill="url(#' + id + 'l)" fill-opacity="' + r[2] + '"/>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="700mm" height="56mm" style="position:absolute;left:0;top:0">' + svg + '</svg>';
  }
  function alfa(area, termini, alunni, opz) {
    opz = opz || {};
    var col = area.colore, n = Number(area.n), nomi = {}, clDi = {};
    (alunni || []).forEach(function (a) { nomi[a.id] = a.nome; clDi[a.id] = a.classe || '3E'; });
    var perCl = {}, visti = {};
    termini.forEach(function (t) { if (!t.alunno || visti[t.alunno]) return; visti[t.alunno] = 1; var c = clDi[t.alunno] || '3E'; (perCl[c] = perCl[c] || []).push(esc(nomi[t.alunno] || t.alunno)); });
    var classi = Object.keys(perCl).sort(); if (!classi.length) classi = ['3E'];
    var A = "font-family:Archivo,Arial,sans-serif;", S = "font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;";
    var voci = ordinaAlfa(termini), lettere = {}, corpo = '', ult = '';
    voci.forEach(function (t) {
      var l = iniziale(t.it); lettere[l] = 1;
      if (l !== ult) { corpo += '<div class="pa-let"><b>' + esc(l) + '</b><i></i></div>'; ult = l; }
      var ok = t.defIt && (!opz.soloApprovate || t.statoIt === 'approvata'), mio = opz.evidenzia && t.alunno === opz.evidenzia;
      corpo += '<div class="pa-v"' + (mio ? ' style="background:#FFE98A;box-shadow:inset 1.4mm 0 0 #15212B;padding-left:2.6mm;padding-right:1.5mm"' : '') + '><h3>' + esc(t.it) + '</h3>' +
        (ok ? '<p>' + esc(t.defIt) + (nomi[t.alunno] ? ' <em>— ' + esc(nomi[t.alunno]) + '</em>' : '') + '</p>'
          : '<p class="pa-vuota">Definizione a cura di ' + esc(nomi[t.alunno] || '…') + '</p>') + '</div>';
    });
    var AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(function (l) { return '<span style="flex:1;text-align:center;' + A + 'font-weight:800;font-size:9mm;line-height:1;color:' + (lettere[l] ? col : '#C9D1D8') + '">' + l + '</span>'; }).join('');
    var MOTTO = ['Nomina…', 'sunt…', 'consequentia…', 'rerum.'];
    var css = '<style>' +
      '.pa-foglio{--k:1}' +
      '.pa-corpo{column-count:3;column-gap:12mm;column-fill:auto;column-rule:0.35mm solid ' + tinta(col, 0.25) + '}' +
      '.pa-let{break-inside:avoid;break-after:avoid;display:flex;align-items:baseline;gap:4mm;margin:calc(3mm*var(--k)) 0 calc(1mm*var(--k))}' +
      '.pa-let b{' + S + 'font-weight:600;font-size:calc(19mm*var(--k));line-height:0.9;color:' + col + '}' +
      '.pa-let i{flex:1;height:0.4mm;background:' + tinta(col, 0.35) + '}' +
      '.pa-v{break-inside:avoid;padding:calc(1.6mm*var(--k)) 0 calc(2.4mm*var(--k))}' +
      '.pa-v h3{margin:0;' + A + 'font-weight:800;font-size:calc(7.6mm*var(--k));line-height:1.08;color:#15212B}' +
      '.pa-v p{margin:calc(0.9mm*var(--k)) 0 0;font-size:calc(5.5mm*var(--k));line-height:1.24}' +
      '.pa-v em{font-size:calc(4.3mm*var(--k));color:#6B7884;white-space:nowrap}' +
      '.pa-v p.pa-vuota{color:#8494A3;font-style:italic;font-size:calc(4.6mm*var(--k))}' +
      '</style>';
    var lab = A + 'font-weight:800;letter-spacing:0.6mm;text-transform:uppercase;font-size:4.8mm';
    return '<div class="poster-foglio pa-foglio" style="width:700mm;height:1000mm;position:relative;overflow:hidden;background:#FBFAF7;color:#15212B;font-family:\'Atkinson Hyperlegible\',Arial,sans-serif;box-sizing:border-box">' + css +
      '<div class="pa-testata" style="position:relative;height:172mm;box-sizing:border-box;background:linear-gradient(135deg,' + col + ' 0%,' + scuro(col, 0.72) + ' 100%);color:#fff;padding:15mm 34mm 0;overflow:hidden">' +
        '<div style="position:absolute;right:-12mm;bottom:-74mm;' + A + 'font-weight:900;font-size:340mm;line-height:1;color:#fff;opacity:.12;letter-spacing:-18mm">0' + n + '</div>' +
        '<div style="position:relative;display:flex;justify-content:space-between;align-items:center">' +
          '<div style="display:flex;align-items:center;gap:5mm">' + logo(20) + '<div style="' + A + 'font-weight:800;font-size:8.4mm;line-height:1.1">Istituto Barsanti - sede Salvetti<div style="font-family:\'Atkinson Hyperlegible\',Arial,sans-serif;font-weight:400;font-size:5.2mm;opacity:.85;margin-top:1mm">Massa · Laboratorio odontotecnico</div></div></div>' +
          '<div style="text-align:right;' + A + 'font-weight:700;font-size:5.4mm;letter-spacing:0.9mm;text-transform:uppercase;line-height:1.6">Glossario odontotecnico<br>Classi ' + classi.join(' e ') + ' · a.s. 2026/27</div></div>' +
        '<div style="position:relative;display:flex;align-items:center;gap:14mm;margin-top:12mm">' + icona2(n, col).replace('width="64mm" height="64mm"', 'width="74mm" height="74mm"') +
          '<div><div style="' + A + 'font-weight:700;font-size:7mm;letter-spacing:1.6mm;text-transform:uppercase;opacity:.85">Area 0' + n + ' di 04 · ' + termini.length + ' termini dalla A alla Z</div>' +
          '<div style="' + A + 'font-weight:900;font-size:' + (area.it.length > 30 ? 32 : 40) + 'mm;line-height:0.98;letter-spacing:-0.8mm;margin-top:3mm">' + esc(area.it) + '</div></div></div>' +
        '<div style="position:relative;margin-top:10mm;border-top:0.4mm solid rgba(255,255,255,.45);padding-top:5mm;font-size:5.2mm;line-height:1.45">' +
          '<b style="' + lab + '">A cura di</b> &nbsp;' + classi.map(function (c) { return '<b>' + c + ':</b> ' + (perCl[c] || []).join(' · '); }).join(' &nbsp;|&nbsp; ') +
          '<br><b style="' + lab + '">Docente</b> &nbsp;Prof. Danilo Cerrato (Laboratorio odontotecnico)</div></div>' +
      '<div style="position:absolute;left:34mm;right:34mm;top:179mm;display:flex;gap:1mm;padding:2.5mm 0;border-bottom:0.5mm solid #15212B">' + AZ + '</div>' +
      '<div class="pa-corpo" style="position:absolute;left:34mm;right:34mm;top:200mm;height:642mm">' + corpo + '</div>' +
      (opz.firme === false ? '' : '<div style="position:absolute;left:34mm;right:34mm;bottom:128mm;height:22mm;border:0.7mm solid ' + col + ';border-radius:3mm;background:' + tinta(col, 0.07) + '">' +
        '<div style="position:absolute;left:6mm;top:-3.8mm;background:' + col + ';color:#fff;padding:0.8mm 3mm;border-radius:1.5mm;' + A + 'font-size:4.2mm;font-weight:800;letter-spacing:0.4mm;text-transform:uppercase">Firme degli autori</div></div>') +
      '<div style="position:absolute;left:0;right:0;bottom:64mm;height:56mm">' + nastroAlfa(n) +
        '<div style="position:absolute;left:0;right:0;top:4mm;text-align:center;' + S + 'font-weight:600;font-size:46mm;line-height:1;color:#15212B;-webkit-text-stroke:2.4mm #FBFAF7;paint-order:stroke fill">' + (MOTTO[n - 1] || '') + '</div></div>' +
      '<div style="position:absolute;left:34mm;right:34mm;bottom:14mm;height:46mm;box-sizing:border-box;border-top:0.6mm solid #15212B;padding-top:5mm;display:flex;align-items:center;gap:9mm;font-size:5mm;line-height:1.35;color:#2C3A47">' +
        (opz.qr ? '<div style="border:0.8mm solid #15212B;border-radius:3mm;padding:2mm;background:#fff;line-height:0">' + qrPoster(opz.qr, 34) + '</div>' +
          '<div><b style="' + A + 'font-size:6.4mm;color:#15212B">Consulta il glossario dal telefono</b><br>' + esc(String(opz.qr).replace(/^https?:\/\//, '')) + '</div>' : '') +
        '<div style="flex:1;text-align:center"><b>Metodologia:</b> compito di realtà in modalità digitale,<br>con valutazione formativa e feedback immediato.</div>' +
        '<div style="text-align:right">Istituto Barsanti - sede Salvetti<br>Classi ' + classi.join(' e ') + ' · Area ' + n + ' di 4</div></div>' +
      '</div>';
  }
  /* riduce i caratteri finché tutte le voci stanno nelle tre colonne; restituisce la scala usata */
  function adatta(foglio) {
    var f = foglio && foglio.classList && foglio.classList.contains('pa-foglio') ? foglio : (foglio && foglio.querySelector('.pa-foglio'));
    if (!f) return 1;
    var body = f.querySelector('.pa-corpo'), k = 1.15;
    function esce() { var r = body.getBoundingClientRect(), tol = r.width * 0.002; for (var i = 0; i < body.children.length; i++) if (body.children[i].getBoundingClientRect().right > r.right + tol) return true; return false; }
    f.style.setProperty('--k', k); while (esce() && k > 0.5) { k -= 0.01; f.style.setProperty('--k', k.toFixed(3)); }
    return k;
  }

  /* targa introduttiva 50x70: aree [{n,it,colore}], s = statistiche del lavoro (o null per la versione senza numeri) */
  function targa(aree, s, url) {
    var F = "font-family:Archivo,Arial,sans-serif;", S = "font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;", T = "font-family:'Atkinson Hyperlegible',Arial,sans-serif;";
    var COL = aree.map(function (a) { return a.colore; }), W = 500, H = 40;
    var nastro = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + 'mm" height="' + H + 'mm" style="display:block"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">' + COL.map(function (c, k) { return '<stop offset="' + (k / 3) + '" stop-color="' + c + '"/>'; }).join('') + '</linearGradient>' +
      '<linearGradient id="tl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></linearGradient></defs>';
    [[0, 9, 0.95, 1], [1.7, 5, 0.6, 0.8], [3.4, 3, 0.4, 1.25]].forEach(function (r) {
      var su = [], giu = [];
      for (var x = 0; x <= W; x += 2) { var f = 2 * Math.PI * x / W * 1.6 * r[3] + r[0], c = 20 + 8 * Math.sin(f), sp = r[1] * (0.55 + 0.45 * Math.cos(f * 0.5 + 1)); su.push(x + ',' + (c - sp).toFixed(2)); giu.push(x + ',' + (c + sp).toFixed(2)); }
      var d = 'M' + su.join(' L') + ' L' + giu.reverse().join(' L') + 'Z';
      nastro += '<path d="' + d + '" fill="url(#tg)" fill-opacity="' + r[2] + '"/><path d="' + d + '" fill="url(#tl)" fill-opacity="' + r[2] + '"/>';
    });
    nastro += '</svg>';
    var ic = function (a) { return icona2(Number(a.n), a.colore).replace('width="64mm" height="64mm"', 'width="44mm" height="44mm"'); };
    var area = function (a) { return '<div style="display:flex;align-items:center;gap:6mm;background:#F4F6F8;border-radius:5mm;padding:8mm 7mm;border-left:3mm solid ' + a.colore + '">' +
      '<div style="background:' + a.colore + ';border-radius:50%;padding:2mm;flex:none">' + ic(a) + '</div>' +
      '<div><div style="' + F + 'font-weight:900;font-size:15mm;line-height:1;color:' + a.colore + '">0' + a.n + '</div>' +
      '<div style="' + F + 'font-weight:800;font-size:8.6mm;line-height:1.1;color:#15212B;margin-top:1.5mm">' + esc(a.it) + '</div>' +
      '<div style="' + T + 'font-size:5.6mm;color:#5B6976;margin-top:1.5mm">65 termini · cartellone ' + a.n + ' di 4</div></div></div>'; };
    var racconto, cifre;
    if (s) {
      racconto = 'Per <b>' + s.giorniParola + ' giorni</b>, ' + s.periodo + ', <b>' + s.autoriParola + ' studenti</b> delle classi ' + s.classi + ' hanno dato voce al linguaggio del loro mestiere. ' +
        'Insieme hanno dedicato al glossario <b>' + s.oreTesto + '</b> di lavoro: ' + s.mediaTesto + ' ciascuno, in media. ' +
        'Hanno inviato <b>' + s.risposte + ' risposte</b>, cercando ogni volta, fra otto definizioni, la sola esatta' + (s.primo != null ? ': ' + s.primo + ' volte su cento l’hanno riconosciuta al primo colpo' : '') + '. ' +
        'Delle ' + s.totale + ' definizioni, <b>' + s.approvate + '</b> hanno superato il vaglio del docente' + (s.voto ? '; il voto medio delle due classi è <b>' + s.voto + '</b>' : '') + '.';
      cifre = [[s.oreBreve, 'di lavoro'], [s.mediaBreve, 'a studente'], [String(s.risposte), 'risposte'], [s.voto || '—', 'voto medio']];
    } else {
      racconto = 'Ogni termine di questo glossario è stato affidato a uno studente, che tra otto definizioni ha individuato quella corretta; il docente l’ha verificata e approvata. Ne sono nati quattro cartelloni, uno per area, firmati dai loro autori.';
      cifre = [['260', 'termini'], ['26', 'autori'], ['4', 'aree'], ['2', 'classi']];
    }
    return '<div style="width:500mm;height:700mm;display:flex;flex-direction:column;color:#15212B;background:#fff;' + T + '">' +
      '<div style="background:#15212B;color:#fff;padding:13mm 30mm 11mm;display:flex;align-items:center;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;gap:6mm">' + logo(24) + '<div style="' + F + 'font-weight:800;font-size:9.5mm;line-height:1.1">Istituto Barsanti - sede Salvetti<div style="' + T + 'font-weight:400;font-size:5.6mm;opacity:.85;margin-top:1.5mm">Massa · Laboratorio odontotecnico</div></div></div>' +
        '<div style="text-align:right;' + F + 'font-weight:700;font-size:6mm;letter-spacing:0.8mm;text-transform:uppercase;line-height:1.6">a.s. 2026/27<br>Classi 3E e 3F</div></div>' +
      '<div style="padding:18mm 30mm 0">' +
        '<div style="' + F + 'font-weight:900;font-size:58mm;line-height:0.9;letter-spacing:-1.4mm">Glossario</div>' +
        '<div style="' + S + 'font-weight:600;font-size:52mm;line-height:1;margin-top:1mm;color:#2C3A47">odontotecnico</div></div>' +
      '<div style="margin-top:6mm">' + nastro + '</div>' +
      '<div style="padding:8mm 30mm 0;' + S + 'font-weight:500;font-size:13mm;line-height:1.32;color:#15212B;font-variant-numeric:lining-nums;font-feature-settings:\'lnum\' 1">' + racconto + '</div>' +
      '<div style="padding:9mm 30mm 0;display:grid;grid-template-columns:repeat(4,1fr);gap:5mm">' + cifre.map(function (c) {
        return '<div style="border-top:1.2mm solid #15212B;padding-top:3.5mm"><div style="' + F + 'font-weight:900;font-size:19mm;line-height:1">' + esc(c[0]) + '</div><div style="' + F + 'font-weight:600;font-size:6.2mm;color:#5B6976;margin-top:1.5mm;text-transform:uppercase;letter-spacing:0.5mm">' + esc(c[1]) + '</div></div>'; }).join('') + '</div>' +
      '<div style="padding:12mm 30mm 0;display:grid;grid-template-columns:1fr 1fr;gap:7mm">' + aree.map(area).join('') + '</div>' +
      '<div style="flex:1"></div>' +
      '<div style="padding:0 30mm;display:flex;align-items:center;gap:11mm">' +
        '<div style="background:#fff;border:1.2mm solid #15212B;border-radius:5mm;padding:3.5mm;flex:none">' + qrPoster(url, 66) + '</div>' +
        '<div><div style="' + F + 'font-weight:900;font-size:12mm;line-height:1.05">Consulta il glossario<br>dal telefono</div>' +
        '<div style="font-size:6.6mm;color:#5B6976;margin-top:3mm">Inquadra il codice: trovi tutti i termini, cercabili per argomento.</div>' +
        '<div style="' + F + 'font-weight:700;font-size:6.2mm;margin-top:2.5mm">' + esc(url.replace(/^https?:\/\//, '')) + '</div></div></div>' +
      '<div style="padding:10mm 30mm 0;text-align:center;' + S + 'font-weight:600;font-size:25mm;color:#2C3A47">Nomina sunt consequentia rerum.</div>' +
      '<div style="margin:7mm 30mm 0;border-top:0.6mm solid #15212B;padding:5mm 0 14mm;display:flex;justify-content:space-between;font-size:5.6mm;color:#2C3A47">' +
        '<span><b>Metodologia:</b> compito di realtà in modalità digitale,<br>con valutazione formativa e feedback immediato.</span>' +
        '<span style="text-align:right">A cura del <b>Prof. Danilo Cerrato</b><br>Laboratorio odontotecnico</span></div></div>';
  }
  return { html: html, alfa: alfa, adatta: adatta, ordinaAlfa: ordinaAlfa, iniziale: iniziale, logo: logo, icona: icona2, qr: qrPoster, targa: targa };
})();
/* ===== POSTER-END ===== */
