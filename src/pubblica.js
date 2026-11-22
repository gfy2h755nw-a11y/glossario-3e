/* ---------- pagina pubblica: pubblicazione decisa dal docente e statistiche delle visite ---------- */

/* quiz finito: tutte le classi hanno una scadenza del quiz ed è passata */
function quizFinito() {
  var q = (S.d.admin && S.d.admin.impostazioni && S.d.admin.impostazioni.quiz) || null; if (!q) return false;
  var cl = CLASSI(), now = Date.now();
  return cl.length > 0 && cl.every(function (c) { var d = (q.scadenze || {})[c]; return d && now > Date.parse(d); });
}
function daPubblicare() { var p = S.d.pubblicazione; return p ? (!p.pubblicato ? p.approvate : p.novita.totale) : 0; }
function quandoIt(iso) { var d = new Date(iso); return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + ', ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); }
function testoNovita(p) {
  if (!p.pubblicato) return p.approvate ? p.approvate + (p.approvate === 1 ? ' definizione approvata' : ' definizioni approvate') + ' da pubblicare' : 'nessuna definizione approvata per ora';
  var n = p.novita, pz = [];
  if (n.nuove) pz.push(n.nuove + (n.nuove === 1 ? ' nuova' : ' nuove'));
  if (n.cambiate) pz.push(n.cambiate + (n.cambiate === 1 ? ' modificata' : ' modificate'));
  if (n.tolte) pz.push(n.tolte + (n.tolte === 1 ? ' tolta' : ' tolte'));
  return pz.length ? 'Da pubblicare: ' + pz.join(', ') : 'Nessuna novità: la pagina pubblica è aggiornata';
}
/* riquadro nel cruscotto */
function bloccoPubblica() {
  var p = S.d.pubblicazione; if (!p || !LOC() || RO()) return '';
  var n = daPubblicare();
  return '<section class="card stack" id="pubBox" style="gap:10px;border-left:5px solid ' + (n ? '#E0A100' : 'var(--ok)') + '"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px">' +
    '<div><h2 class="h2s" style="margin:0">Pagina pubblica</h2><p class="muted" style="margin:4px 0 0">' + (p.pubblicato ? 'Ultima pubblicazione: <b>' + esc(quandoIt(p.il)) + '</b> · ' + p.n + (p.n === 1 ? ' definizione' : ' definizioni') : '<b>Non ancora pubblicato</b>: la pagina pubblica mostra «online a breve»') + '</p>' +
    '<p style="margin:4px 0 0;font-weight:700;color:' + (n ? '#9A4A00' : 'var(--ok)') + '" id="pubNov">' + esc(testoNovita(p)) + '</p></div>' +
    '<div class="row" style="gap:8px"><a class="btn sec" href="' + esc(urlPubblico()) + '" target="_blank" rel="noopener">Apri la pagina</a>' +
    '<button class="btn" id="pubVai" onclick="pubblicaOra(this)"' + (n ? '' : ' disabled') + '>Pubblica sulla pagina pubblica</button></div></div>' +
    '<p class="muted" style="margin:0;font-size:13.5px">Termini, definizioni e autori vanno online solo quando premi il pulsante. Quello che approvi dopo resta invisibile fino alla pubblicazione successiva.</p></section>';
}
/* banner lampeggiante: quiz finito e qualcosa da pubblicare */
function bannerPubblica() {
  var p = S.d.pubblicazione; if (!p || !LOC() || RO() || !quizFinito() || !daPubblicare()) return '';
  return '<div class="note warn lampeggia" id="bannerPubblica" role="status"><div class="row" style="justify-content:space-between;gap:10px;align-items:center"><span><b>Quiz concluso: ricordati di pubblicare il glossario.</b> ' + esc(testoNovita(p)) + '.</span>' +
    '<button class="btn" onclick="pubblicaOra(this)">Pubblica ora</button></div></div>';
}
function pubblicaOra(btn) {
  if (btn.getAttribute('data-ok') !== '1') { btn.setAttribute('data-ok', '1'); btn.setAttribute('data-t', btn.textContent); btn.textContent = 'Conferma: pubblica adesso'; setTimeout(function () { if (btn.isConnected && btn.getAttribute('data-ok') === '1') { btn.setAttribute('data-ok', ''); btn.textContent = btn.getAttribute('data-t'); } }, 6000); return; }
  btn.disabled = true; btn.textContent = 'Pubblicazione…';
  api('pubblicaglossario').then(function (r) { S.d.pubblicazione = r; vistaDocente(); toast('Glossario pubblicato: ' + r.n + (r.n === 1 ? ' definizione online' : ' definizioni online')); })
    .catch(function (e) { toast(errMsg(e), true); btn.disabled = false; btn.setAttribute('data-ok', ''); btn.textContent = btn.getAttribute('data-t') || 'Pubblica sulla pagina pubblica'; });
}

/* ---------- statistiche della pagina pubblica ---------- */
var STP = { periodo: 30, cache: {} };
function caricaStat(periodo, forza) {
  var c = STP.cache[periodo];
  if (c && !forza && Date.now() - c.t < 5 * 60000) return Promise.resolve(c.d);
  return api('statistiche', { periodo: periodo }).then(function (d) { STP.cache[periodo] = { t: Date.now(), d: d }; return d; });
}
var MESI3 = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
function etGiorno(g) { var p = g.split('-'); return Number(p[2]) + ' ' + MESI3[Number(p[1]) - 1]; }
function festivo(g) { var d = new Date(g + 'T12:00:00Z').getUTCDay(); return d === 0 || d === 6; }
function nIt(n) { return Number(n || 0).toLocaleString('it-IT'); }
function durataSec(s) { if (!s) return '—'; if (s < 60) return s + ' s'; var m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; }
function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '—'; }
/* grafico a barre delle visite al giorno (con la linea dei dispositivi diversi) */
function graficoGiorni(gg, w, h, compatto) {
  if (!gg.length) return '';
  var max = Math.max(1, Math.max.apply(null, gg.map(function (g) { return g.v; }))), sx = compatto ? 2 : 34, sy = 10, bw = (w - sx - 6) / gg.length, H = h - sy - (compatto ? 4 : 24);
  var y = function (v) { return sy + H - v / max * H; };
  var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Visite al giorno" style="display:block">';
  if (!compatto) [0, 0.5, 1].forEach(function (f) { var v = Math.round(max * f); s += '<line x1="' + sx + '" x2="' + (w - 4) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#E3E8EC"/><text x="' + (sx - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="#6B7A86">' + v + '</text>'; });
  var passo = Math.max(1, Math.ceil(gg.length / 7));
  gg.forEach(function (g, i) {
    var x = sx + i * bw + Math.min(1.5, bw * 0.15), bwi = Math.max(1, bw - Math.min(3, bw * 0.3));
    s += '<rect x="' + x.toFixed(1) + '" y="' + y(g.v).toFixed(1) + '" width="' + bwi.toFixed(1) + '" height="' + Math.max(0, sy + H - y(g.v)).toFixed(1) + '" rx="2" fill="' + (festivo(g.g) ? '#A9C3E3' : '#1F5FA8') + '"><title>' + etGiorno(g.g) + ': ' + g.v + ' visite · ' + g.u + ' dispositivi</title></rect>';
    if (!compatto && (i % passo === 0 || i === gg.length - 1)) s += '<text x="' + (x + bwi / 2).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle" font-size="11" fill="#6B7A86">' + etGiorno(g.g) + '</text>';
  });
  if (!compatto && gg.length > 1) s += '<polyline fill="none" stroke="#E0A100" stroke-width="2.2" points="' + gg.map(function (g, i) { return (sx + i * bw + bw / 2).toFixed(1) + ',' + y(g.u).toFixed(1); }).join(' ') + '"/>';
  return s + '</svg>';
}
function barreSt(righe, col) {
  var max = Math.max(1, Math.max.apply(null, righe.map(function (r) { return r[1]; })));
  return '<div class="stb">' + righe.map(function (r) { return '<div class="stbr"><span>' + esc(r[0]) + '</span><div class="bar"><span style="width:' + Math.round(r[1] / max * 100) + '%;background:' + (r[3] || col) + '"></span></div><b>' + r[2] + '</b></div>'; }).join('') + '</div>';
}
function legendaSt(v) { return '<div class="stleg">' + v.map(function (x) { return '<span><i style="background:' + x[1] + (x[2] ? ';height:3px;vertical-align:3px' : '') + '"></i>' + esc(x[0]) + '</span>'; }).join('') + '</div>'; }
/* riquadro nel cruscotto: si riempie quando arrivano i numeri */
function bloccoStatCruscotto() {
  if (!ADM() || RO()) return '';
  return '<section class="card stack" id="statBox" style="gap:12px"><div class="row" style="justify-content:space-between"><h2 class="h2s">Pagina pubblica · ultimi 30 giorni</h2><button class="btn sec tb" onclick="vai(\'statpub\')">Statistiche pagina pubblica →</button></div><div id="statBoxIn"><p class="muted" style="margin:0">Caricamento…</p></div></section>';
}
function avviaStatCruscotto() {
  if (!document.getElementById('statBoxIn')) return;
  caricaStat(30).then(function (d) {
    var el = document.getElementById('statBoxIn'); if (!el) return;
    if (!d.visite) { el.innerHTML = '<p class="muted" style="margin:0">Nessuna visita registrata negli ultimi 30 giorni. Il conteggio parte da quando è attiva questa funzione.</p>'; return; }
    el.innerHTML = '<div class="stnum"><div><b>' + nIt(d.oggiVisite) + '</b><small>visite oggi</small></div><div><b>' + nIt(d.visite) + '</b><small>visite in 30 giorni</small></div><div><b>' + nIt(d.unici) + '</b><small>dispositivi diversi</small></div><div><b>' + pct(d.da_.qr || 0, d.visite) + '</b><small>arrivati dal QR dei cartelloni</small></div></div>' +
      graficoGiorni(d.giorni, 900, 70, true) + legendaSt([['giorni di scuola', '#1F5FA8'], ['sabato e domenica', '#A9C3E3']]);
  }).catch(function (e) { var el = document.getElementById('statBoxIn'); if (el) el.innerHTML = '<p class="muted" style="margin:0">' + esc(errMsg(e)) + '</p>'; });
}
/* pagina «Statistiche pagina pubblica» */
function paginaStatPub() {
  return '<section class="card stack" style="gap:14px"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:10px"><div><h2 style="margin:0;font-size:22px">Statistiche pagina pubblica</h2><p class="muted" style="margin:4px 0 0" id="stAgg">Home dei glossari e glossari pubblici</p></div>' +
    '<div class="stchip" role="group" aria-label="Periodo">' + [[7, '7 giorni'], [30, '30 giorni'], ['anno', 'Anno scolastico']].map(function (x) { return '<button data-p="' + x[0] + '" aria-pressed="' + (String(STP.periodo) === String(x[0])) + '" onclick="STP.periodo=this.getAttribute(\'data-p\');STP.periodo=STP.periodo===\'anno\'?\'anno\':Number(STP.periodo);vistaDocente()">' + x[1] + '</button>'; }).join('') + '</div></div>' +
    '<div id="stKpi"><p class="muted" style="margin:0">Caricamento…</p></div></section><div id="stCorpo" class="stack"></div>';
}
function avviaStatPub() {
  caricaStat(STP.periodo, true).then(function (d) {
    if (!document.getElementById('stKpi')) return;
    var agg = new Date(d.aggiornato);
    document.getElementById('stAgg').textContent = 'Home dei glossari e glossari pubblici · aggiornato alle ' + agg.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('stKpi').innerHTML = '<section class="kpis" style="margin:0">' + [['Visite', nIt(d.visite), 'oggi ' + nIt(d.oggiVisite)], ['Dispositivi diversi', nIt(d.unici), 'telefoni e PC distinti'], ['Tempo medio', durataSec(d.tempoMedio), 'per visita'], ['Dal QR dei cartelloni', pct(d.da_.qr || 0, d.visite), 'delle visite']].map(function (k) {
      return '<div class="card kcard"><div class="kl">' + k[0] + '</div><div class="kv">' + k[1] + '</div><div class="muted ks">' + k[2] + '</div></div>'; }).join('') + '</section>';
    var h = '';
    h += '<section class="card stack" style="gap:8px"><h2 class="h2s">Visite al giorno</h2>' + graficoGiorni(d.giorni, 900, 230, false) + legendaSt([['visite, giorni di scuola', '#1F5FA8'], ['visite, sabato e domenica', '#A9C3E3'], ['dispositivi diversi', '#E0A100', 1]]) + '</section>';
    var tel = (d.disp.tel || 0), pc = (d.disp.pc || 0), dd = d.da_;
    h += '<div class="grid2 cols"><section class="card stack" style="gap:10px"><h2 class="h2s">Pagine aperte</h2>' + (d.pagine.length ? barreSt(d.pagine.map(function (p) { return [p.nome, p.n, nIt(p.n), p.id === 'home' ? '#8A97A2' : null]; }), '#1F5FA8') : '<p class="muted" style="margin:0">Nessuna visita.</p>') + '</section>' +
      '<section class="card stack" style="gap:10px"><h2 class="h2s">Da dove arrivano</h2>' + barreSt([['QR dei cartelloni', dd.qr || 0, pct(dd.qr || 0, d.visite)], ['Messaggio dell\'interrogazione', dd.msg || 0, pct(dd.msg || 0, d.visite), '#6B4FA0'], ['Foglio accessi degli studenti', dd.scheda || 0, pct(dd.scheda || 0, d.visite), '#2E7D32'], ['Link o indirizzo scritto', dd.altro || 0, pct(dd.altro || 0, d.visite), '#8A97A2']], '#B4511A') +
      '<h2 class="h2s" style="margin-top:6px">Con cosa</h2>' + barreSt([['Telefono', tel, pct(tel, tel + pc)], ['PC o tablet', pc, pct(pc, tel + pc), '#8A97A2']], '#0E7C7B') +
      '<p class="muted" style="margin:0;font-size:13.5px">Dall\'app installata sul telefono: ' + nIt(d.app) + (d.app === 1 ? ' visita' : ' visite') + (d.installazioni ? ' · ' + nIt(d.installazioni) + ' installazioni' : '') + '</p></section></div>';
    h += '<section class="card stack" style="gap:10px"><h2 class="h2s">Cosa fanno</h2><div class="statt3"><div><b>' + nIt(d.consulta) + '</b><small>aperture del glossario completo</small></div><div><b>' + nIt(d.prove) + '</b><small>prove «Mettiti alla prova»' + (d.mediaProva != null ? ' · media ' + String(d.mediaProva).replace('.', ',') + '/7,5' : '') + '</small></div><div><b>' + nIt(d.squadre) + '</b><small>partite «Gioca a squadre»</small></div></div></section>';
    var tutti = d.conLuogo, luoghi = d.luoghi.map(function (l) { return [l[0], l[1], pct(l[1], tutti)]; });
    if (d.altriLuoghi) luoghi.push(['Altre località', d.altriLuoghi, pct(d.altriLuoghi, tutti), '#8A97A2']);
    h += '<section class="card stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h2 class="h2s">Da dove si collegano</h2>' + (d.italia + d.estero ? '<span class="muted" style="font-size:13px">Italia ' + pct(d.italia, d.italia + d.estero) + ' · estero ' + pct(d.estero, d.italia + d.estero) + '</span>' : '') + '</div>' +
      (luoghi.length ? barreSt(luoghi, '#0E7C7B') : '<p class="muted" style="margin:0">Nessuna località ancora.</p>') +
      '<p class="muted" style="margin:0;font-size:13px">Località approssimativa, ricavata dalla connessione e non dal GPS: con i dati del telefono a volte compare la città dell\'operatore (spesso Firenze, Milano o Roma) invece di quella reale.</p></section>';
    var mo = Math.max(1, Math.max.apply(null, d.ore)), ore = '<svg viewBox="0 0 520 120" width="100%" style="display:block">' + d.ore.map(function (v, i) { var bh = v / mo * 86, x = 8 + i * 21; return '<rect x="' + x + '" y="' + (96 - bh) + '" width="16" height="' + bh + '" rx="2" fill="' + (i >= 8 && i < 14 ? '#2E7D32' : '#6B4FA0') + '"><title>ore ' + i + ': ' + v + '</title></rect>' + (i % 3 === 0 ? '<text x="' + (x + 8) + '" y="114" text-anchor="middle" font-size="11" fill="#6B7A86">' + i + '</text>' : ''); }).join('') + '</svg>';
    h += '<div class="grid2 cols"><section class="card stack" style="gap:8px"><h2 class="h2s">A che ora</h2>' + ore + legendaSt([['orario scolastico (8–14)', '#2E7D32'], ['pomeriggio, sera e notte', '#6B4FA0']]) + '</section>' +
      '<section class="card stack" style="gap:6px"><h2 class="h2s">Parole più cercate</h2>' + (d.ricerche.length ? '<table class="tbl"><tbody>' + d.ricerche.map(function (r, i) { return '<tr><td>' + (i + 1) + '. ' + esc(r[0]) + '</td><td class="n">' + nIt(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted" style="margin:0">Nessuna ricerca ancora.</p>') + '</section></div>';
    h += '<p class="muted" style="margin:0;font-size:13px">Conteggi anonimi: nessun nome e nessun dato personale. Il tempo di ripasso degli studenti che si riconoscono con il codice resta, come prima, nei loro report.</p>';
    document.getElementById('stCorpo').innerHTML = h;
  }).catch(function (e) { var el = document.getElementById('stKpi'); if (el) el.innerHTML = '<p class="muted" style="margin:0">' + esc(errMsg(e)) + '</p>'; });
}
