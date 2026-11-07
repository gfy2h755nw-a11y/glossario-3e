/* Glossario 3E – app (modalità "scegli la definizione tra 8") */
var API_URL = '/api';
var KEY_COD = 'glossario3e_codice';
var S = { codice: null, d: null, filtro: { area: 'tutte', stato: 'inviata', lingua: 'it' }, poster: null, sel: {} };

/* ---------- utilità ---------- */
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(msg, err) { var t = $('toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.style.display = 'block'; clearTimeout(toast._t); toast._t = setTimeout(function () { t.style.display = 'none'; }, 3500); }
function memo(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function api(azione, dati) {
  var corpo = Object.assign({ azione: azione, codice: S.codice }, dati || {});
  return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
    .catch(function () { throw new Error('Connessione assente: controlla internet e riprova.'); })
    .then(function (r) { return r.json().catch(function () { return { errore: 'Risposta non valida dal server (' + r.status + ').' }; }); })
    .then(function (j) { if (!j.ok) throw new Error(j.errore || 'Errore sconosciuto.'); return j.dati; });
}
function errMsg(e) { return e && e.message ? e.message : String(e); }
var STATO_TXT = { '': 'Da scegliere', inviata: 'Inviata', correggere: 'Da rivedere', approvata: 'Approvata' };
function chip(st) { return '<span class="chip s-' + (st || 'vuota') + '">' + STATO_TXT[st || ''] + '</span>'; }
function area(n) { return S.d.aree.filter(function (a) { return a.n == n; })[0]; }
function nomeAlunno(id) { var a = S.d.alunni.filter(function (x) { return x.id === id; })[0]; return a ? a.nome : id; }
/* lingue attive: in questa fase solo italiano (config.lingue = ['it']) */
function EN() { return !!(S.d && S.d.config && (S.d.config.lingue || ['it', 'en']).indexOf('en') >= 0); }
function LINGUE() { return EN() ? ['it', 'en'] : ['it']; }
function TPA() { return (S.d && S.d.config && S.d.config.terminiPerAlunno) || 10; }
var VERSIONE = '7/11/2026';
/* classi: 3E e 3F */
function CLASSI() { return (S.d && S.d.config && S.d.config.classi) || ['3E']; }
function alunnoDi(id) { return S.d.alunni.filter(function (x) { return x.id === id; })[0]; }
function classeAl(id) { var a = alunnoDi(id); return a && a.classe ? a.classe : '3E'; }
function etich(a) { return !a ? '' : (a.classe || '3E') === '3E' ? '3E · ' + a.gruppo : a.classe; }
function inClasse(id) { var c = S.filtro && S.filtro.classe; return !c || c === 'tutte' || classeAl(id) === c; }
function selClasse(id, cb) {
  if (CLASSI().length < 2) return '';
  return '<div><label for="' + id + '">Classe</label><select id="' + id + '" onchange="S.filtro.classe=this.value;' + cb + '"><option value="tutte">Tutte le classi</option>' +
    CLASSI().map(function (c) { return '<option value="' + c + '"' + (S.filtro.classe === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>';
}
function T(t, l, campo) { return t[campo + (l === 'it' ? 'It' : 'En')]; }
function aggiornaTermine(t) { S.d.termini = S.d.termini.map(function (x) { return x.id === t.id ? t : x; }); }
var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
var GG = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
function dataIt(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if (!m) return iso; var d = new Date(+m[1], +m[2] - 1, +m[3]); return GG[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()]; }
function oggiIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function giorniA(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if (!m) return null; var a = new Date(+m[1], +m[2] - 1, +m[3]), o = new Date(); o.setHours(0, 0, 0, 0); return Math.round((a - o) / 86400000); }

/* ---------- accesso ---------- */
function vistaLogin(msg) {
  $('app').innerHTML = '<div class="wrap"><form class="card login stack" id="flogin">' +
    '<div><div class="muted disp" style="font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:13px">Classi 3E e 3F · a.s. 2026/27</div>' +
    '<h1>Glossario odontotecnico</h1></div>' +
    '<p class="muted" style="margin:0">Laboratorio odontotecnico · prof. Danilo Cerrato</p>' +
    (msg ? '<div class="note err">' + esc(msg) + '</div>' : '') +
    '<div><label for="cod">Il tuo codice personale</label><input id="cod" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase;font-family:Archivo,system-ui,sans-serif;font-weight:700;letter-spacing:.2em;font-size:22px" required></div>' +
    '<button class="btn" type="submit" id="bentra">Entra</button>' +
    '<p class="muted" style="margin:0;font-size:14px">Il codice te lo consegna il prof. Non darlo a nessuno: chi lo conosce può rispondere al posto tuo.</p>' +
    '<p class="muted" style="margin:0;font-size:13px">Per i docenti l\'app registra quando entri, le risposte che dai e per quanto tempo resta aperta.</p></form></div>';
  $('flogin').onsubmit = function (e) { e.preventDefault(); entra($('cod').value); };
  $('cod').focus();
}
function entra(codice) {
  var b = $('bentra'); if (b) { b.disabled = true; b.textContent = 'Accesso…'; }
  S.codice = String(codice || '').trim().toUpperCase();
  api('login').then(function (d) {
    S.d = d; S.sel = {}; memo(KEY_COD, S.codice);
    if (d.utente.ruolo === 'docente') S.filtro = { area: 'tutte', stato: 'inviata', lingua: EN() ? d.utente.lingua || 'it' : 'it', classe: (S.filtro && S.filtro.classe) || 'tutte' };
    render();
  }).catch(function (e) { memo(KEY_COD, null); S.codice = null; vistaLogin(errMsg(e)); });
}
function esci() { memo(KEY_COD, null); S.codice = null; S.d = null; S.poster = null; vistaLogin(); }
function ricarica() { api('login').then(function (d) { S.d = d; render(); toast('Dati aggiornati'); }).catch(function (e) { toast(errMsg(e), true); }); }
function render() {
  clearInterval(S.timer);
  if (!S.d) return vistaLogin();
  if (S.d.escluso) return vistaEscluso();
  if (S.d.nonPartito) return vistaAttesa();
  if (S.d.utente.ruolo === 'alunno') vistaAlunno(); else vistaDocente();
}
function vistaEscluso() {
  $('app').innerHTML = testata(S.d.utente.nome) + '<main class="wrap"><section class="card stack escluso" role="alert">' +
    '<div class="disp" style="font-weight:900;font-size:26px;line-height:1.25">' + esc(S.d.messaggio) + '</div>' +
    '<p style="margin:0">Per chiarimenti parla con il prof. Cerrato.</p></section></main>';
}
/* prima della partenza decisa dal docente */
function vistaAttesa() {
  var p = S.d.partenza, u = S.d.utente;
  $('app').innerHTML = testata(u.nome + ' · Classe ' + (u.classe || '3E')) + '<main class="wrap stack"><section class="card stack">' +
    '<div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px">Glossario odontotecnico</div>' +
    '<h1 style="margin:0;font-size:28px;line-height:1.15">Il compito non è ancora partito</h1>' +
    (p ? '<p style="margin:0">Si parte <b>' + esc(oraIt(p)) + '</b>. Da quel momento qui trovi i tuoi <b>' + TPA() + ' termini</b>.</p>' + cdHtml(p)
      : '<p style="margin:0">Il prof. Cerrato non ha ancora fissato la partenza. Torna a controllare nei prossimi giorni.</p>') +
    '<p class="muted" style="margin:0">Scadenza per rispondere a tutti i termini: ' + esc(oraIt(S.d.config.scadenzaIt)) + '.</p></section></main>';
  avviaCountdown();
  if (p) { var ms = Date.parse(p) - Date.now(); if (ms > 0 && ms < 86400000) S.timerPartenza = setTimeout(function () { entra(S.codice); }, ms + 1500); }
}
/* ---------- scadenze e conto alla rovescia ---------- */
function fv(v) { return v == null ? '—' : String(v).replace('.', ','); }
function oraIt(iso) { var d = new Date(iso); return GG[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()] + ' alle ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function residuo(iso) {
  var ms = new Date(iso) - new Date();
  if (ms <= 0) return null;
  var g = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return { g: g, h: h, m: m, s: sec, urgente: ms < 86400000 * 2 };
}
function cdHtml(iso) {
  var r = residuo(iso);
  if (!r) return '<span class="cd-scaduta">Scadenza passata</span>';
  var c = function (n, l) { return '<span class="cd-u"><b>' + n + '</b><small>' + l + '</small></span>'; };
  return '<span class="cd' + (r.urgente ? ' urg' : '') + '">' + c(r.g, 'giorni') + c(('0' + r.h).slice(-2), 'ore') + c(('0' + r.m).slice(-2), 'min') + c(('0' + r.s).slice(-2), 'sec') + '</span>';
}
function avviaCountdown() {
  clearInterval(S.timer);
  S.timer = setInterval(function () {
    document.querySelectorAll('[data-cd]').forEach(function (el) { el.innerHTML = cdHtml(el.getAttribute('data-cd')); });
  }, 1000);
}
function bloccoScadenze(tutti) {
  var c = S.d.config;
  var miei = tutti.filter(function (t) { return !t.ereditato; }), ered = tutti.filter(function (t) { return t.ereditato; });
  var mancaIt = miei.filter(function (t) { return !t.statoIt || t.statoIt === ''; }).length;
  var mancaEn = miei.filter(function (t) { return !t.statoEn; }).length;
  function riga(lab, iso, manca, nota) {
    return '<div class="cd-box"><div class="cd-t">' + lab + '</div><div class="muted" style="font-size:14px">' + esc(oraIt(iso)) + '</div>' +
      '<div data-cd="' + esc(iso) + '">' + cdHtml(iso) + '</div>' +
      '<div style="font-size:14px">' + (manca ? '<b>' + manca + '</b> ' + (manca === 1 ? 'termine' : 'termini') + ' ancora senza risposta' : nota) + '</div></div>';
  }
  return '<section class="card stack"><h2 style="margin:0;font-size:22px">Scadenze</h2><div class="grid2">' +
    (miei.length ? riga(EN() ? 'Italiano' : 'I tuoi termini', c.scadenzaIt, mancaIt, '✓ Tutti i termini hanno una risposta') +
    (EN() ? riga('Inglese', c.scadenzaEn, mancaEn, '✓ Tutti i termini hanno una risposta') : '') : '') +
    (ered.length ? riga(EN() ? 'Termini ricevuti · italiano' : 'Termini ricevuti', ered[0].scadIt, ered.filter(function (t) { return !t.statoIt; }).length, '✓ Tutti hanno una risposta') +
      (EN() ? riga('Termini ricevuti · inglese', ered[0].scadEn, ered.filter(function (t) { return !t.statoEn; }).length, '✓ Tutti hanno una risposta') : '') : '') +
    '</div><p class="note warn" style="margin:0">' + (miei.length ? 'Chi alla scadenza ha ancora <b>termini propri</b> senza risposta viene <b>escluso dal compito</b> con voto 4. ' : '') +
    (ered.length ? 'Per i <b>termini ricevuti</b>, se non rispondi in tempo, il voto finale scende a 6 (se era più alto).' : '') + '</p></section>';
}
function bloccoVoto() {
  var v = S.d.voto; if (!v) return '';
  var mini = function (lab, val, err, inv) {
    return '<div class="vl"><div class="muted disp" style="font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px">' + lab + '</div>' +
      '<div class="vl-n">' + fv(val) + '<small>/' + fv(v.votoMax || 8) + '</small></div><div class="muted" style="font-size:13px">' + (inv ? (inv === 1 ? '1 risposta' : inv + ' risposte') + ' · ' + (err === 1 ? '1 errata' : err + ' errate') : 'nessuna risposta') + '</div></div>';
  };
  return '<section class="card stack"><div class="voto-box">' +
    '<div class="vf"><div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px">' + (v.manuale ? 'Voto finale assegnato dal docente' : 'Voto finale provvisorio') + '</div>' +
    '<div class="voto-n">' + fv(v.voto) + '<small>/' + fv(v.votoMax || 8) + '</small></div>' +
    (v.voto == null ? '<div class="muted" style="font-size:14px">' + (EN() ? 'Compare quando hai risposto in italiano e in inglese' : 'Compare dalla prima risposta inviata') + '</div>' : EN() && v.media != null && !v.manuale && !v.tetto ? '<div class="muted" style="font-size:14px">Media di italiano e inglese' + (v.media !== v.voto ? ': ' + fv(Math.round(v.media * 1000) / 1000) + ', arrotondata' : '') + '</div>' : '') + '</div>' +
    (EN() ? '<div class="vls">' + mini('Italiano', v.votoIt, v.errIt, v.invIt) + mini('Inglese', v.votoEn, v.errEn, v.invEn) + '</div>'
      : '<div class="vls"><div class="vl"><div class="muted disp" style="font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px">Le tue risposte</div><div class="vl-n">' + (v.invIt || 0) + '</div><div class="muted" style="font-size:13px">' + (v.errIt === 1 ? '1 errata' : (v.errIt || 0) + ' errate') + '</div></div></div>') + '</div>' +
    (v.tetto && !v.manuale ? '<div class="note warn"><b>Voto finale limitato a ' + v.tettoValore + '</b>: non hai risposto in tempo ai termini ricevuti' + (v.calcolato != null && v.calcolato > v.tettoValore ? ' (il calcolo darebbe ' + fv(v.calcolato) + ')' : '') + '.</div>' : '') +
    '<p class="muted" style="margin:0;font-size:14px">' + esc(v.ratio) + '</p></section>';
}

function testata(sotto) {
  return '<header class="top"><div class="wrap"><div class="brand">Glossario ' + esc(CLASSI().join(' · ')) + '<small>' + esc(sotto) + '</small></div>' +
    '<div class="row"><button class="btn ghost" onclick="ricarica()">Aggiorna</button><button class="btn ghost" onclick="esci()">Esci</button></div></div></header>';
}

/* ---------- tappe ---------- */
function bloccoTappe() {
  var oggi = oggiIso(), prossima = null;
  S.d.config.tappe.forEach(function (t) { if (!prossima && t.data >= oggi) prossima = t; });
  var g = prossima ? giorniA(prossima.data) : null;
  return '<details class="card"' + (S.d.utente.ruolo === 'alunno' ? ' open' : '') + '><summary>Le tappe</summary>' +
    (prossima ? '<div class="note info" style="margin-top:12px"><b>Prossima tappa: ' + dataIt(prossima.data) + '</b> (' + (g === 0 ? 'oggi' : g === 1 ? 'domani' : 'tra ' + g + ' giorni') + ') · ' + esc(prossima.testo) + '</div>' : '') +
    '<ol class="tappe" style="margin-top:10px">' + S.d.config.tappe.map(function (t, i) {
      return '<li class="' + (t.data < oggi ? 'past' : t === prossima ? 'next' : '') + '"><span class="d">' + (i + 1) + '. ' + dataIt(t.data) + '</span><span>' + esc(t.testo) + '</span></li>';
    }).join('') + '</ol></details>';
}

/* ---------- cartellone ---------- */
function bloccoPoster(n) {
  var opts = S.d.aree.map(function (a) { return '<option value="' + a.n + '"' + (a.n == n ? ' selected' : '') + '>Cartellone ' + a.n + ' · ' + esc(a.it) + '</option>'; }).join('');
  var aree = S.d.utente.ruolo === 'docente' ? S.d.aree : S.d.aree.filter(function (a) { return S.d.termini.some(function (t) { return t.area == a.n && t.alunno === S.d.utente.id; }) || a.n == S.d.utente.gruppo; });
  opts = aree.map(function (a) { return '<option value="' + a.n + '"' + (a.n == n ? ' selected' : '') + '>Cartellone ' + a.n + ' · ' + esc(a.it) + '</option>'; }).join('');
  var sel = aree.length > 1 ? '<div><label for="selposter" class="sr">Scegli il cartellone</label><select id="selposter" onchange="disegnaPoster(this.value)">' + opts + '</select></div>' : '';
  return '<section class="card stack"><h2 style="margin:0;font-size:22px">Anteprima del cartellone 70×100</h2>' + sel +
    '<p class="muted" style="margin:0;font-size:15px">Sul cartellone vanno solo le definizioni approvate' + (EN() ? ' dai docenti' : ' dal docente') + '.</p>' +
    '<div class="poster-box" id="pbox"><div class="poster-scale" id="pscale"></div></div></section>';
}
function disegnaPoster(n) {
  S.poster = n; var box = $('pbox'), sc = $('pscale'); if (!box) return;
  var ts = S.d.termini.filter(function (t) { return t.area == n; });
  sc.innerHTML = Poster.html(area(n), ts, S.d.alunni, { soloApprovate: true, soloIt: !EN() });
  var f = sc.firstChild, k = (box.clientWidth - 24) / f.offsetWidth;
  sc.style.transform = 'scale(' + k + ')'; box.style.height = (f.offsetHeight * k + 24) + 'px';
}
window.addEventListener('resize', function () { if (S.poster && $('pbox')) disegnaPoster(S.poster); });

/* ---------- alunno ---------- */
function vistaAlunno() {
  var u = S.d.utente, a = area(u.gruppo);
  var miei = S.d.termini.filter(function (t) { return t.alunno === u.id; });
  var pn = a ? u.gruppo : (miei[0] ? miei[0].area : 1);
  // 3F: termini di tutte le aree
  if (!a) a = { n: '', it: 'Termini di tutte e quattro le aree', en: '', colore: '#15212B', tutte: true };
  var n = function (l) { return miei.filter(function (t) { return T(t, l, 'stato') === 'approvata'; }).length; };
  var h = testata(u.nome + ' · ' + (a.tutte ? 'Classe ' + u.classe : 'Classe ' + (u.classe || '3E') + ' · Gruppo ' + u.gruppo)) + '<main class="wrap stack">';
  h += '<section class="card" style="border-top:8px solid ' + a.colore + '"><div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px">' + (a.tutte ? 'Classe ' + esc(u.classe) : 'Area ' + a.n) + '</div>' +
    '<h1 style="margin:2px 0 0;font-size:30px;line-height:1.1">' + esc(a.it) + '</h1>' + (EN() ? '<div class="term-en" style="color:' + a.colore + '">' + esc(a.en) + '</div>' : '') +
    '<p style="margin:12px 0 0">Ciao <b>' + esc(u.nome) + '</b>. Per ognuno dei tuoi <b>' + miei.length + ' termini</b> scegli la definizione giusta tra 8 alternative' + (EN() ? '. Prima in italiano: quando il prof. Cerrato la approva, si sblocca la scelta in inglese, rivista dalla prof.ssa Aliboni.' : ': il prof. Cerrato le controlla e le approva.') + '</p>' +
    '<div class="row" style="margin-top:12px"><span class="chip s-approvata">' + (EN() ? 'Italiano ' : 'Approvate ') + n('it') + '/' + miei.length + '</span>' + (EN() ? '<span class="chip s-approvata">Inglese ' + n('en') + '/' + miei.length + '</span>' : '') + '</div></section>';
  var ered = miei.filter(function (t) { return t.ereditato; });
  if (ered.length) {
    var da = ered.map(function (t) { return nomeAlunno(t.alunnoOrig); }).filter(function (x, i, arr) { return arr.indexOf(x) === i; });
    h += '<section class="card note-ered" role="status"><b>Hai ricevuto ' + ered.length + ' termini in più</b> da ' + esc(da.join(', ')) + ', escluso per mancato rispetto della scadenza. ' +
      'Il tuo <b>voto massimo sale a ' + fv(S.d.voto ? S.d.voto.votoMax : 9.5) + '</b> e il tuo nome andrà sul cartellone al suo posto. Per questi termini hai tempo fino a <b>' + esc(oraIt(ered[0].scadIt)) + '</b>' + (EN() ? ' per l\'italiano e <b>' + esc(oraIt(ered[0].scadEn)) + '</b> per l\'inglese' : '') + '. Se non rispondi in tempo a questi termini non vieni escluso, ma il tuo voto finale non potrà superare 6.</section>';
  }
  if (S.d.config.chiusa) h += '<div class="note warn"><b>L\'app è chiusa.</b> Le scelte non sono più modificabili.</div>';
  h += bloccoVoto() + bloccoScadenze(miei) + bloccoTappe();
  h += miei.map(cardAlunno).join('');
  h += bloccoPoster(pn) + '</main>';
  $('app').innerHTML = h; disegnaPoster(pn); avviaCountdown();
}
function cardAlunno(t) {
  var col = area(t.area).colore;
  function blocco(l) {
    var st = T(t, l, 'stato'), comm = T(t, l, 'comm'), ops = T(t, l, 'opz'), scelta = T(t, l, 'scelta');
    var h = '<div class="lang"><h3>' + (l === 'it' ? (EN() ? 'Definizione in italiano' : 'Definizione') : 'Definition in English') + chip(st) + '</h3>';
    if (!ops) return h + '<p class="muted" style="margin:0">Si sblocca quando la scelta in italiano è approvata.</p></div>';
    if (st === 'correggere') h += '<div class="note warn" style="margin-bottom:10px"><b>Da rivedere:</b> ' + esc(comm || 'Non è la definizione giusta: scegline un\'altra.') + '</div>';
    if (st === 'approvata' || S.d.config.chiusa) {
      var txt = T(t, l, 'def') || (scelta ? ops.filter(function (o) { return o.l === scelta; })[0].t : '');
      return h + '<div class="fixed-text"' + (l === 'en' ? ' lang="en" style="font-style:italic"' : '') + '>' + (txt ? esc(txt) : '—') + '</div>' +
        (st === 'approvata' && comm ? '<p class="muted" style="margin:8px 0 0;font-size:15px">Nota: ' + esc(comm) + '</p>' : '') + '</div>';
    }
    var nome = 'op_' + t.id + '_' + l, sel = S.sel[nome] || scelta;
    h += '<fieldset class="ops"><legend class="sr">Scegli la definizione di ' + esc(l === 'it' ? t.it : t.en) + '</legend>';
    ops.forEach(function (o) {
      var id = nome + '_' + o.l;
      h += '<label class="op' + (sel === o.l ? ' on' : '') + (o.no ? ' no' : '') + '" for="' + id + '">' +
        '<input type="radio" name="' + nome + '" id="' + id + '" value="' + o.l + '"' + (sel === o.l ? ' checked' : '') + (o.no ? ' disabled' : '') +
        ' onchange="S.sel[\'' + nome + '\']=\'' + o.l + '\';segna(this)">' +
        '<span class="lt">' + o.l + '</span><span' + (l === 'en' ? ' lang="en"' : '') + '>' + esc(o.t) + (o.no ? ' <em class="muted">(già scartata)</em>' : '') + '</span></label>';
    });
    h += '</fieldset>' + (st === 'inviata' ? '<p class="muted" style="margin:6px 0 0;font-size:15px">Scelta inviata: in attesa del docente. Puoi ancora cambiarla.</p>' : '') +
      '<div class="row" style="margin-top:8px"><button class="btn" onclick="conferma(\'' + t.id + '\',\'' + l + '\',this)">' + (st === 'inviata' ? 'Cambia scelta' : 'Conferma la scelta') + '</button></div>';
    return h + '</div>';
  }
  return '<article class="card">' + (t.ereditato ? '<div class="chip s-inviata" style="margin-bottom:8px">Ricevuto da ' + esc(nomeAlunno(t.alunnoOrig)) + ' · area ' + t.area + '</div>' : '') + '<div class="term-it">' + esc(t.it) + '</div>' + (EN() && t.en ? '<div class="term-en" lang="en" style="color:' + col + '">' + esc(t.en) + '</div>' : '') + blocco('it') + (EN() ? blocco('en') : '') + '</article>';
}
function segna(inp) { inp.closest('fieldset').querySelectorAll('label.op').forEach(function (lb) { lb.classList.toggle('on', lb.contains(inp)); }); }
function conferma(id, l, btn) {
  var nome = 'op_' + id + '_' + l, el = document.querySelector('input[name="' + nome + '"]:checked');
  if (!el) { toast('Seleziona una delle 8 definizioni.', true); return; }
  btn.disabled = true;
  api('scegli', { id: id, lingua: l, lettera: el.value }).then(function (t) {
    aggiornaTermine(t); delete S.sel[nome]; toast('Scelta inviata'); render();
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}

/* ---------- docente ---------- */
function vistaDocente() {
  var u = S.d.utente, f = S.filtro;
  if (!EN()) { f.lingua = 'it'; if (f.stato === 'pronte') f.stato = 'inviata'; }
  var h = testata(u.nome + ' · area docenti') + '<main class="wrap stack">';
  if (S.d.config.chiusa) h += '<div class="note warn"><b>App chiusa agli alunni.</b> I docenti possono ancora rivedere.</div>';
  h += '<section class="grid4">' + S.d.aree.map(function (a) {
    var ts = S.d.termini.filter(function (t) { return t.area == a.n && inClasse(t.alunno); });
    var c = function (l, st) { return ts.filter(function (t) { return T(t, l, 'stato') === st; }).length; };
    var riv = c('it', 'inviata') + (EN() ? c('en', 'inviata') : 0);
    var pronte = EN() ? ts.filter(function (t) { return t.statoIt === 'approvata' && t.statoEn === ''; }).length : 0;
    return '<div class="card" style="border-top:8px solid ' + a.colore + '"><div class="disp" style="font-weight:800;font-size:17px;line-height:1.2">' + a.n + '. ' + esc(a.it) + '</div>' +
      LINGUE().map(function (l) { var v = c(l, 'approvata'); return '<div style="margin-top:10px;font-size:15px">' + (l === 'it' ? (EN() ? 'Italiano' : 'Approvate') : 'Inglese') + ' <b>' + v + '/' + ts.length + '</b></div><div class="bar"><span style="width:' + (v / ts.length * 100) + '%;background:' + a.colore + '"></span></div>'; }).join('') +
      (pronte ? '<div style="margin-top:8px;font-size:14px" class="muted">' + pronte + ' pronte per l\'inglese, non ancora scelte</div>' : '') +
      '<div style="margin-top:10px">' + (riv ? '<span class="chip s-inviata">' + riv + ' da rivedere</span>' : '<span class="chip s-vuota">Niente da rivedere</span>') + '</div></div>';
  }).join('') + '</section>';

  var lista = S.d.termini.filter(function (t) {
    if (f.area !== 'tutte' && t.area != f.area) return false;
    if (!inClasse(t.alunno)) return false;
    if (f.stato === 'pronte') return t.statoIt === 'approvata' && t.statoEn !== 'approvata';
    return f.stato === 'tutti' ? true : T(t, f.lingua, 'stato') === f.stato;
  });
  var corrette = lista.filter(function (t) { return T(t, f.lingua, 'stato') === 'inviata' && T(t, f.lingua, 'ok') === true && (f.lingua === 'it' || t.statoIt === 'approvata'); });
  h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Revisione</h2><div class="grid4">' + selClasse('fc', 'vistaDocente()') +
    (EN() ? '<div><label for="fl">Lingua</label><select id="fl" onchange="S.filtro.lingua=this.value;vistaDocente()">' + [['it', 'Italiano'], ['en', 'Inglese']].map(function (o) { return '<option value="' + o[0] + '"' + (f.lingua === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' : '') +
    '<div><label for="fs">Stato</label><select id="fs" onchange="S.filtro.stato=this.value;vistaDocente()">' + [['inviata', 'Da rivedere (inviate)']].concat(EN() ? [['pronte', 'Italiano approvato, inglese da fare']] : []).concat([ ['correggere', 'Rimandate all\'alunno'], ['', 'Non ancora scelte'], ['approvata', 'Approvate'], ['tutti', 'Tutti']]).map(function (o) { return '<option value="' + o[0] + '"' + (f.stato === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
    '<div><label for="fa">Area</label><select id="fa" onchange="S.filtro.area=this.value;vistaDocente()"><option value="tutte">Tutte le aree</option>' + S.d.aree.map(function (a) { return '<option value="' + a.n + '"' + (f.area == a.n ? ' selected' : '') + '>' + a.n + '. ' + esc(a.it) + '</option>'; }).join('') + '</select></div></div>' +
    (corrette.length ? '<div class="row"><button class="btn ok" onclick="approvaCorrette(this)">Approva tutte le scelte corrette (' + corrette.length + ')</button><span class="muted" style="font-size:15px">Quelle sbagliate restano da rivedere una per una.</span></div>' : '') +
    '</section>';
  h += '<p class="muted" style="margin:0">' + lista.length + ' termini' + (EN() ? ' · ' + (f.lingua === 'it' ? 'italiano' : 'inglese') : '') + '</p>';
  h += lista.map(function (t) { return cardDocente(t, f.lingua); }).join('') || '<div class="card muted">Nessun termine con questo filtro.</div>';
  h += panoramica() + (S.d.admin ? bloccoAdmin() + bloccoAttivita() + bloccoBackup() : '') + bloccoPoster(S.poster || (f.area !== 'tutte' ? f.area : 1)) + bloccoTappe();
  h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Accesso degli alunni</h2><p style="margin:0">L\'app è <b>' + (S.d.config.chiusa ? 'chiusa' : 'aperta') + '</b>' + (S.d.config.chiusa ? ': gli alunni vedono le scelte ma non possono modificarle.' : ': gli alunni possono scegliere e inviare.') + '</p>' +
    '<div class="row"><button class="btn ' + (S.d.config.chiusa ? 'ok' : 'warn') + '" onclick="chiusura(' + (!S.d.config.chiusa) + ')">' + (S.d.config.chiusa ? 'Riapri l\'app agli alunni' : 'Chiudi l\'app agli alunni') + '</button></div></section>';
  h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Dati per la stampa</h2><p style="margin:0">A lavoro finito scarica i dati: servono per impaginare i 4 PDF definitivi (vanno solo le definizioni approvate).</p><div class="row"><button class="btn sec" onclick="esporta()">Scarica i dati (.json)</button></div></section>';
  if (S.d.codiciAlunni) {
    h += '<details class="card" id="codici"><summary>Codici personali degli alunni (riservato)</summary>' +
      '<p class="muted" style="margin:10px 0">Stampa e ritaglia le strisce da consegnare a mano. Link dell\'app: <b>' + esc(location.origin) + '</b></p>' +
      '<div class="row" style="margin-bottom:10px">' + CLASSI().map(function (c) { return '<button class="btn" onclick="stampaSchede(\'' + c + '\')">Schede con QR · ' + c + '</button>'; }).join('') +
      (CLASSI().length > 1 ? '<button class="btn sec" onclick="stampaSchede(\'tutte\')">Schede di tutte le classi</button>' : '') + '<button class="btn sec" onclick="stampaCodici()">Codici in strisce</button></div>' +
      '<p class="muted" style="margin:0 0 10px;font-size:14px">Le schede si aprono nella stampa: scegli “Salva come PDF” per avere il file. Una pagina A4 per alunno con QR, link, codice, partenza, scadenza e termini assegnati.</p>' +
      '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th>Classe</th><th>Codice</th></tr></thead><tbody>' +
      S.d.codiciAlunni.filter(function (a) { return inClasse(a.id); }).map(function (a) { return '<tr><td>' + esc(a.nome) + '</td><td>' + esc(etich(a)) + '</td><td style="font-family:monospace;font-size:18px;font-weight:700;letter-spacing:.15em">' + esc(a.codice) + '</td></tr>'; }).join('') +
      '</tbody></table></div></details>';
  }
  h += '</main>';
  $('app').innerHTML = h; disegnaPoster(S.poster || (f.area !== 'tutte' ? f.area : 1));
}
function cardDocente(t, l) {
  var a = area(t.area), st = T(t, l, 'stato'), scelta = T(t, l, 'scelta'), ok = T(t, l, 'ok'), comm = T(t, l, 'comm');
  var h = '<article class="card" style="border-top:6px solid ' + a.colore + '"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="term-it">' + esc(t.it) + '</div>' + (EN() && t.en ? '<div class="term-en" lang="en" style="color:' + a.colore + '">' + esc(t.en) + '</div>' : '') + '</div>' +
    '<div class="muted" style="text-align:right;font-size:15px"><b style="color:var(--ink)">' + esc(nomeAlunno(t.alunno)) + '</b>' + (t.ereditato ? '<br>ricevuto da ' + esc(nomeAlunno(t.alunnoOrig)) : '') + '<br>Area ' + t.area + (T(t, l, 'tent') ? ' · tentativi: ' + T(t, l, 'tent') : '') + (t.agg ? '<br>' + esc(t.agg) : '') + '</div></div>';
  if (l === 'en') {
    h += '<div class="lang"><h3>Italiano' + chip(t.statoIt) + '</h3>' + (t.statoIt === 'approvata'
      ? '<div class="fixed-text">' + esc(t.defIt) + '</div><p class="muted" style="margin:6px 0 0;font-size:14px">Approvata da ' + esc(t.daIt) + '</p>'
      : '<p class="muted" style="margin:0">Non ancora approvata in italiano.</p>') + '</div>';
  }
  h += '<div class="lang"><h3>' + (l === 'it' ? (EN() ? 'Italiano' : 'Scelta dell\'alunno') : 'English') + chip(st) + '</h3>';
  if (!scelta) {
    h += '<p class="muted" style="margin:0">' + (l === 'en' && t.statoIt !== 'approvata' ? 'Bloccata finché l\'italiano non è approvato.' : st === 'correggere' ? 'Rimandata all\'alunno' + (comm ? ': “' + esc(comm) + '”' : '') + '. In attesa di una nuova scelta.' : 'L\'alunno non ha ancora scelto.') + '</p>';
  } else {
    h += '<div class="fixed-text"' + (l === 'en' ? ' lang="en"' : '') + '>' + esc(scelta) + '</div>' +
      '<div class="esito ' + (ok ? 'si' : 'no') + '">' + (ok ? '✓ Corrisponde alla definizione corretta' : '✗ Non è la definizione corretta. Quella giusta: <span' + (l === 'en' ? ' lang="en"' : '') + '>“' + esc(T(t, l, 'giusta')) + '”</span>') + '</div>';
    if (st === 'inviata') {
      var cid = 'cm_' + t.id + '_' + l;
      h += '<label for="' + cid + '" style="display:block;margin-top:10px">Commento per l\'alunno (facoltativo)</label><input type="text" id="' + cid + '" maxlength="200" placeholder="' + (ok ? 'Es. Ottimo!' : 'Es. Rileggi bene: dove si trova?') + '">' +
        '<div class="row" style="margin-top:10px">' + (l === 'en' && t.statoIt !== 'approvata' ? '' : '<button class="btn ok" onclick="decidi(\'' + t.id + '\',\'' + l + '\',\'approvata\',this)">Approva' + (ok ? '' : ' comunque') + '</button>') +
        '<button class="btn warn" onclick="decidi(\'' + t.id + '\',\'' + l + '\',\'correggere\',this)">Rimanda all\'alunno</button></div>';
    } else if (st === 'approvata') {
      h += '<p class="muted" style="margin:8px 0 0;font-size:14px">Approvata da ' + esc(T(t, l, 'da')) + '</p><div class="row" style="margin-top:10px"><button class="btn sec" onclick="decidi(\'' + t.id + '\',\'' + l + '\',\'riapri\',this)">Annulla approvazione</button></div>';
    }
  }
  return h + '</div></article>';
}
function decidi(id, l, esito, btn) {
  var cm = $('cm_' + id + '_' + l); btn.disabled = true;
  api('revisiona', { id: id, lingua: l, esito: esito, commento: cm ? cm.value : '' }).then(function (t) {
    aggiornaTermine(t); toast(esito === 'approvata' ? 'Approvata' : esito === 'correggere' ? 'Rimandata all\'alunno' : 'Approvazione annullata'); vistaDocente();
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function approvaCorrette(btn) {
  btn.disabled = true;
  api('approvacorrette', { lingua: S.filtro.lingua, area: S.filtro.area }).then(function (r) {
    return api('login').then(function (d) { S.d = d; toast(r.approvate === 1 ? '1 scelta approvata' : r.approvate + ' scelte approvate'); vistaDocente(); });
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
/* ---------- panoramica condivisa (prof. Cerrato e prof.ssa Aliboni) ---------- */
function panoramica() {
  var P = S.d.panoramica || [], tot = { inviate: 0, corrette: 0, errate: 0, daApprovare: 0, approvate: 0 };
  var righe = P.filter(function (r) { return inClasse(r.id); }).map(function (r) {
    Object.keys(tot).forEach(function (k) { tot[k] += r[k]; });
    return '<tr' + (r.escluso ? ' class="riga-esclusa"' : '') + '><td>' + esc(r.nome) + (r.escluso ? ' <span class="chip s-correggere" title="' + esc(r.motivo) + '">Escluso</span>' + (r.riassegnatoA ? ' <span class="muted" style="font-size:13px">termini → ' + esc(nomeAlunno(r.riassegnatoA)) + '</span>' : '') : '') + (r.ereditati ? ' <span class="chip s-inviata">+' + (r.termini - TPA()) + ' ricevuti</span>' : '') + '</td><td class="n">' + esc(etich(r)) + '</td>' +
      '<td class="n">' + r.inviate + '</td><td class="n" style="color:var(--ok)">' + r.corrette + '</td><td class="n" style="color:var(--err)">' + r.errate + '</td>' +
      '<td class="n">' + (r.daApprovare ? '<span class="chip s-inviata">' + r.daApprovare + '</span>' : '0') + '</td><td class="n">' + r.approvate + '/' + (r.termini * LINGUE().length) + '</td></tr>';
  }).join('');
  return '<section class="card stack"><h2 style="margin:0;font-size:22px">Panoramica ' + (S.filtro.classe && S.filtro.classe !== 'tutte' ? 'della ' + esc(S.filtro.classe) : CLASSI().length > 1 ? 'delle classi' : 'della classe') + '</h2>' +
    '<div class="grid4 kpi">' + [['Risposte date', tot.inviate, ''], ['Corrette', tot.corrette, 'var(--ok)'], ['Errate', tot.errate, 'var(--err)'], ['Da approvare', tot.daApprovare, 'var(--info)']].map(function (k) {
      return '<div class="kpi-c"><div class="kpi-n" style="color:' + (k[2] || 'var(--ink)') + '">' + k[1] + '</div><div class="muted">' + k[0] + '</div></div>'; }).join('') + '</div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th><th style="text-align:right">Risposte date</th><th style="text-align:right">Corrette</th><th style="text-align:right">Errate</th><th style="text-align:right">Da approvare</th><th style="text-align:right">Approvate</th></tr></thead><tbody>' + righe + '</tbody></table></div>' +
    '<p class="muted" style="margin:0;font-size:14px">Risposte date = tutti gli invii, comprese le correzioni. Approvate: ' + (EN() ? 'su 10 (5 in italiano + 5 in inglese).' : 'sul numero di termini di ciascuno.') + '</p></section>';
}
/* ---------- solo prof. Cerrato: scadenze, voti, report ---------- */
function isoLocale(iso) { var d = new Date(iso); var p = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
function bloccoAdmin() {
  var A = S.d.admin, imp = A.impostazioni;
  var errFino4 = function (p) { return Math.ceil((imp.votoMax - imp.votoMin) / p - 1e-9); };
  var h = '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Partenza, scadenza e valutazione</h2><span class="chip s-vuota">Solo prof. Cerrato · app ' + VERSIONE + '</span></div>' +
    '<div class="grid2"><div><label for="pa">Partenza (uguale per ' + (CLASSI().length > 1 ? CLASSI().join(' e ') : 'la classe') + ')</label><input id="pa" type="datetime-local" value="' + (imp.partenza ? isoLocale(imp.partenza) : '') + '"></div>' +
    '<div class="muted" style="align-self:end;font-size:14px">' + (imp.partenza ? (Date.parse(imp.partenza) <= Date.now() ? '<b style="color:var(--ok)">Partito</b> ' + esc(oraIt(imp.partenza)) : 'Gli alunni vedono il conto alla rovescia fino a ' + esc(oraIt(imp.partenza))) : '<b>Partenza non fissata:</b> gli alunni entrano ma non vedono ancora i termini.') + '</div></div>' +
    '<div class="grid2"><div><label for="scIt">' + (EN() ? 'Scadenza italiano' : 'Scadenza per tutti i termini') + '</label><input id="scIt" type="datetime-local" value="' + isoLocale(imp.scadenzaIt) + '"></div>' +
    (EN() ? '<div><label for="scEn">Scadenza inglese</label><input id="scEn" type="datetime-local" value="' + isoLocale(imp.scadenzaEn) + '"></div></div>' : '<div><label for="gIt">Termini ricevuti da un escluso: giorni per rispondere</label><input id="gIt" type="text" inputmode="numeric" value="' + imp.giorniIt + '"></div></div>') +
    (EN() ? '<div class="grid2"><div><label for="gIt">Termini ricevuti da un escluso: giorni per l\'italiano</label><input id="gIt" type="text" inputmode="numeric" value="' + imp.giorniIt + '"></div>' +
    '<div><label for="gEn">Termini ricevuti da un escluso: giorni per l\'inglese</label><input id="gEn" type="text" inputmode="numeric" value="' + imp.giorniEn + '"></div></div>' : '') +
    '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Penalità per ogni risposta errata</legend>' +
    [['A', '−0,25 per errore: ' + errFino4(0.25) + ' errori per scendere da ' + fv(imp.votoMax) + ' a ' + imp.votoMin], ['B', '−0,50 per errore: ' + errFino4(0.5) + ' errori per scendere da ' + fv(imp.votoMax) + ' a ' + imp.votoMin]].map(function (o) {
      return '<label class="op' + (imp.proposta === o[0] ? ' on' : '') + '" for="pr' + o[0] + '"><input type="radio" name="prop" id="pr' + o[0] + '" value="' + o[0] + '"' + (imp.proposta === o[0] ? ' checked' : '') + ' onchange="segna(this)"><span class="lt">' + o[0] + '</span><span>Proposta ' + o[0] + ': ' + o[1] + '</span></label>';
    }).join('') + '</fieldset>' +
    '<div class="row"><button class="btn" onclick="salvaImpostazioni(this)">Salva partenza, scadenza e penalità</button></div>' +
    '<p class="muted" style="margin:0;font-size:14px">' + esc(A.ratio) + '</p></section>';
  var nomi = {}; (S.d.panoramica || []).forEach(function (r) { nomi[r.id] = r; });
  var row = function (v) {
    var r = nomi[v.id];
    return '<tr><td>' + esc(r.nome) + (v.ereditati ? ' <span class="chip s-inviata">max ' + fv(v.votoMax) + '</span>' : '') + (v.tetto ? ' <span class="chip s-correggere" title="' + esc(v.motivoTetto || '') + '">tetto 6</span>' : '') + '</td><td class="n">' + esc(etich(r)) + '</td>' +
      (EN() ? '<td class="n">' + fv(v.votoIt) + (v.votoIt != null ? '<br><span class="muted" style="font-weight:400;font-size:13px">' + v.errIt + ' err.</span>' : '') + '</td>' +
      '<td class="n">' + fv(v.votoEn) + (v.votoEn != null ? '<br><span class="muted" style="font-weight:400;font-size:13px">' + v.errEn + ' err.</span>' : '') + '</td>' +
      '<td class="n" style="font-weight:400">' + (v.media != null ? fv(Math.round(v.media * 1000) / 1000) : '—') + '</td>' : '<td class="n" style="font-weight:400">' + (v.errIt || 0) + '</td>') + '<td class="n">' + fv(v.calcolato) + '</td>' +
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap"><label for="vm_' + v.id + '" class="sr">Voto manuale ' + esc(r.nome) + '</label><input id="vm_' + v.id + '" type="text" inputmode="decimal" style="width:80px;padding:6px 8px" value="' + (v.manuale != null ? String(v.manuale).replace('.', ',') : '') + '" placeholder="—">' +
      '<button class="btn sec" style="min-height:38px;padding:0 10px" onclick="salvaVoto(\'' + v.id + '\',this)">Salva</button></div></td>' +
      '<td class="n"><b style="font-size:18px">' + fv(v.voto) + '</b></td></tr>';
  };
  var votiC = A.voti.filter(function (v) { return inClasse(v.id); });
  var attivi = votiC.filter(function (v) { return !v.escluso; }), esclusi = votiC.filter(function (v) { return v.escluso || v.riammesso; });
  h += '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Tabellone dei voti</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    (CLASSI().length > 1 ? '<div class="grid4">' + selClasse('fct', 'vistaDocente()') + '</div>' : '') +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th>' + (EN() ? '<th style="text-align:right">Voto IT</th><th style="text-align:right">Voto EN</th><th style="text-align:right">Media</th>' : '<th style="text-align:right">Errori</th>') + '<th style="text-align:right">' + (EN() ? 'Finale calcolato' : 'Voto calcolato') + '</th><th>Voto manuale</th><th style="text-align:right">Voto finale</th></tr></thead><tbody>' +
    attivi.map(row).join('') + '</tbody></table></div><p class="muted" style="margin:0;font-size:14px">Il voto manuale sostituisce quello calcolato e lo vede anche l\'alunno. Lascia vuoto e salva per tornare al calcolo.</p>';
  if (esclusi.length) {
    h += '<h3 style="margin:8px 0 0">Esclusi per mancato rispetto della scadenza</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th>Motivo</th><th style="text-align:right">Voto finale</th><th></th></tr></thead><tbody>' +
      esclusi.map(function (v) { var r = nomi[v.id]; return '<tr><td>' + esc(r.nome) + (v.riammesso ? ' <span class="chip s-approvata">Riammesso</span>' : '') + '</td><td>' + esc(v.motivo || r.motivo || '') + (r.riassegnatoA ? '<br><span class="muted" style="font-size:13px">Termini passati a ' + esc(nomeAlunno(r.riassegnatoA)) + '</span>' : '') + '</td><td class="n"><b>' + fv(v.voto) + '</b></td>' +
        '<td><button class="btn sec" style="min-height:38px;padding:0 10px" onclick="riammetti(\'' + v.id + '\',' + (!v.riammesso) + ',this)">' + (v.riammesso ? 'Annulla riammissione' : 'Riammetti') + '</button></td></tr>'; }).join('') + '</tbody></table></div>';
  }
  h += '<div class="row"><button class="btn" onclick="reportPdf()">Report completo (PDF)</button><button class="btn" onclick="presentazione(this)">Presentazione PowerPoint (.pptx)</button><span class="muted" style="font-size:14px">Per ' + (S.filtro.classe && S.filtro.classe !== 'tutte' ? 'la ' + esc(S.filtro.classe) : 'tutte le classi') + ' (scegli la classe qui sopra). Il PDF si apre nella stampa (“Salva come PDF”); la presentazione si scarica, con grafici modificabili.</span></div></section>';
  return h;
}
function presentazione(btn) {
  var t = btn.textContent; btn.disabled = true; btn.textContent = 'Preparo la presentazione…';
  api('presentazione', { classe: S.filtro.classe }).then(function (x) {
    var bin = atob(x.base64), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    var a = document.createElement('a'); a.href = url; a.download = x.nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    btn.disabled = false; btn.textContent = t; toast('Presentazione scaricata');
  }).catch(function (e) { btn.disabled = false; btn.textContent = t; toast(errMsg(e), true); });
}
function salvaImpostazioni(btn) {
  var it = $('scIt').value, en = $('scEn') ? $('scEn').value : null, pr = document.querySelector('input[name="prop"]:checked');
  if (!it || (EN() && !en)) { toast(EN() ? 'Inserisci entrambe le scadenze.' : 'Inserisci la scadenza.', true); return; }
  btn.disabled = true;
  var pa = $('pa') ? $('pa').value : '';
  api('impostazioni', { partenza: pa ? new Date(pa).toISOString() : null, scadenzaIt: new Date(it).toISOString(), scadenzaEn: en ? new Date(en).toISOString() : null, proposta: pr ? pr.value : null, giorniIt: $('gIt').value, giorniEn: $('gEn') ? $('gEn').value : null })
    .then(function () { return api('login'); }).then(function (d) { S.d = d; toast('Impostazioni salvate'); vistaDocente(); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function salvaVoto(id, btn) {
  btn.disabled = true;
  var v = $('vm_' + id).value.trim();
  api('voto', { alunno: id, voto: v === '' ? null : v }).then(function () { return api('login'); }).then(function (d) { S.d = d; toast(v === '' ? 'Torna al voto calcolato' : 'Voto salvato'); vistaDocente(); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function riammetti(id, val, btn) {
  btn.disabled = true;
  api('riammetti', { alunno: id, riammesso: val }).then(function () { return api('login'); }).then(function (d) { S.d = d; toast(val ? 'Alunno riammesso' : 'Riammissione annullata'); vistaDocente(); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function reportPdf() {
  var A = S.d.admin, voti = {}; A.voti.forEach(function (v) { voti[v.id] = v; });
  var oggi = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  var PAN = (S.d.panoramica || []).filter(function (r) { return inClasse(r.id); });
  var stud = PAN.map(function (r) {
    var v = voti[r.id], ts = S.d.termini.filter(function (t) { return t.alunno === r.id; });
    var righe = '';
    ts.forEach(function (t) {
      LINGUE().forEach(function (l) {
        var st = T(t, l, 'storia') || [], fin = T(t, l, 'scelta');
        righe += '<tr><td><b>' + esc(l === 'it' ? t.it : t.en) + '</b>' + (EN() ? '<br><span class="m">' + (l === 'it' ? 'Italiano' : 'Inglese') + '</span>' : '') + '</td>' +
          '<td class="c">' + (st.length ? st.map(function (x) { return x.ok ? '<span class="ok">✓</span>' : '<span class="no">✗</span>'; }).join(' ') : '<span class="m">—</span>') + '</td>' +
          '<td>' + (fin ? esc(fin) : (st.length ? '<span class="m">(rimandata, in attesa di nuova scelta)</span>' : '<span class="m">nessuna risposta</span>')) + '</td>' +
          '<td class="c">' + esc(STATO_TXT[T(t, l, 'stato') || '']) + '</td></tr>';
      });
    });
    return '<section class="st"><div class="h"><div><h2>' + esc(r.nome) + '</h2><div class="m">Classe ' + esc(r.classe || '3E') + (S.d.aree[r.gruppo - 1] ? ' · Gruppo ' + r.gruppo + ' · ' + esc(S.d.aree[r.gruppo - 1].it) : ' · termini di tutte le aree') + '</div></div>' +
      '<div class="v"><div class="vn">' + fv(v.voto) + '<small>/' + fv(v.votoMax || 8) + '</small></div><div class="m">' + (v.escluso ? 'Escluso: ' + esc(v.motivo) : v.manuale != null ? 'Voto manuale (calcolato: ' + fv(v.calcolato) + ')' : 'Voto finale calcolato') + '</div></div></div>' +
      (!EN() ? '<table class="vt"><tr><th>Risposte</th><th>Errate</th><th>Voto finale</th></tr><tr><td class="c">' + r.inviate + '</td><td class="c">' + r.errate + '</td><td class="c"><b>' + fv(v.voto) + '</b>' + (v.escluso ? ' (esclusione)' : v.manuale != null ? ' (manuale)' : '') + '</td></tr></table>' :
      '<table class="vt"><tr><th>Voto italiano</th><th>Voto inglese</th><th>Media</th><th>Voto finale</th></tr><tr>' +
      '<td class="c">' + fv(v.votoIt) + (v.votoIt != null ? ' <span class="m">(' + v.errIt + ' errate)</span>' : '') + '</td>' +
      '<td class="c">' + fv(v.votoEn) + (v.votoEn != null ? ' <span class="m">(' + v.errEn + ' errate)</span>' : '') + '</td>' +
      '<td class="c">' + (v.media != null ? fv(Math.round(v.media * 1000) / 1000) : '—') + '</td><td class="c"><b>' + fv(v.voto) + '</b>' + (v.escluso ? ' (esclusione)' : v.manuale != null ? ' (manuale)' : '') + '</td></tr></table>') +
      (S.d.admin.attivita ? (function (r) { r = r || {}; return '<p class="k">Accessi <b>' + (r.accessi || 0) + '</b> · giorni attivi <b>' + (r.giorni || 0) + '</b> · tempo con l\'app aperta <b>' + (r.ultimo ? durata(r.minuti) : '—') + '</b> · primo accesso <b>' + esc(quando(r.primo)) + '</b> · ultimo accesso <b>' + esc(quando(r.ultimo)) + '</b></p>'; })(S.d.admin.attivita[r.id]) : '') +
      (v.ereditati ? '<p class="k"><b>Ha ricevuto i termini di un compagno escluso: voto massimo ' + fv(v.votoMax) + '.</b>' + (v.tetto ? ' Non ha risposto in tempo ai termini ricevuti: voto finale limitato a 6 (' + esc(v.motivoTetto || '') + ').' : '') + '</p>' : '') + (r.riassegnatoA ? '<p class="k">Termini passati a ' + esc(nomeAlunno(r.riassegnatoA)) + '.</p>' : '') + '<p class="k">Risposte date <b>' + r.inviate + '</b> · corrette <b>' + r.corrette + '</b> · errate <b>' + r.errate + '</b> · da approvare <b>' + r.daApprovare + '</b> · approvate <b>' + r.approvate + '/' + (r.termini * LINGUE().length) + '</b></p>' +
      '<table><thead><tr><th style="width:24%">Termine</th><th style="width:12%">Tentativi</th><th>Risposta attuale</th><th style="width:13%">Stato</th></tr></thead><tbody>' + righe + '</tbody></table></section>';
  }).join('');
  var sintesi = PAN.map(function (r) { var v = voti[r.id]; return '<tr><td>' + esc(r.nome) + '</td><td class="c">' + esc(etich(r)) + '</td><td class="c">' + r.inviate + '</td><td class="c">' + r.corrette + '</td><td class="c">' + r.errate + '</td>' + (EN() ? '<td class="c">' + fv(v.votoIt) + '</td><td class="c">' + fv(v.votoEn) + '</td><td class="c">' + (v.media != null ? fv(Math.round(v.media * 1000) / 1000) : '—') + '</td>' : '') + '<td class="c"><b>' + fv(v.voto) + '</b>' + (v.escluso ? ' (escluso)' : v.manuale != null ? ' (manuale)' : '') + '</td>' + (function (x) { x = (A.attivita || {})[r.id] || {}; return '<td class="c">' + (x.accessi || 0) + '</td><td class="c">' + (x.ultimo ? durata(x.minuti) : '—') + '</td><td>' + esc(quando(x.ultimo)) + '</td>'; })() + '</tr>'; }).join('');
  var css = '@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#15212B;font-size:10pt;margin:0}h1{font-size:18pt;margin:0}h2{font-size:13pt;margin:0}.m{color:#5B6976;font-size:9pt}' +
    'table{width:100%;border-collapse:collapse;margin-top:6px}th,td{border:1px solid #C3CED7;padding:4px 6px;text-align:left;vertical-align:top;font-size:9pt}th{background:#15212B;color:#fff}.c{text-align:center}' +
    '.ok{color:#1B6E20;font-weight:700}.no{color:#B0304A;font-weight:700}.st{break-before:page}.h{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #15212B;padding-bottom:6px}' +
    '.vt{width:auto;margin-top:8px}.vt th{background:#EEF2F5;color:#15212B}.vt td,.vt th{padding:4px 14px;font-size:10pt}.vn{font-size:26pt;font-weight:800;text-align:right}.vn small{font-size:11pt;color:#5B6976}.v{text-align:right}.k{margin:8px 0 0}.box{background:#EEF2F5;padding:8px 10px;border-radius:6px;margin-top:8px}';
  var html = '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Report Glossario</title><style>' + css + '</style></head><body>' +
    '<h1>Glossario odontotecnico' + (EN() ? ' bilingue' : '') + ' · Report · ' + (S.filtro.classe && S.filtro.classe !== 'tutte' ? 'Classe ' + esc(S.filtro.classe) : CLASSI().length > 1 ? 'Classi ' + CLASSI().join(' e ') : 'Classe 3E') + '</h1><div class="m">Istituto Barsanti - sede Salvetti, Massa · a.s. 2026/27 · Prof. Danilo Cerrato' + (EN() ? ' · Prof.ssa Federica Aliboni' : '') + ' · generato il ' + esc(oggi) + '</div>' +
    '<div class="box"><b>Criterio di assegnazione del punteggio.</b> ' + (EN() ? 'Ogni alunno ha 5 termini e per ciascuno sceglie la definizione corretta tra 8 alternative, prima in italiano e poi in inglese (10 risposte in tutto); ogni scelta viene verificata dai docenti. ' : 'Ogni alunno ha ' + TPA() + ' termini e per ciascuno sceglie la definizione corretta tra 8 alternative, in italiano; ogni scelta viene verificata dal docente. ') + esc(A.ratio) + ' Voto massimo 8, oppure 10 per chi ha ricevuto i termini di un compagno escluso.</div>' +
    '<div class="box">' + (EN() ? 'Scadenza italiano: ' + esc(oraIt(A.impostazioni.scadenzaIt)) + ' · Scadenza inglese: ' + esc(oraIt(A.impostazioni.scadenzaEn)) : 'Scadenza: ' + esc(oraIt(A.impostazioni.scadenzaIt))) + '</div>' +
    '<h2 style="margin-top:12px">Sintesi</h2><table><thead><tr><th>Alunno</th><th class="c">Gr.</th><th class="c">Risposte</th><th class="c">Corrette</th><th class="c">Errate</th>' + (EN() ? '<th class="c">Voto IT</th><th class="c">Voto EN</th><th class="c">Media</th>' : '') + '<th class="c">Voto finale</th><th class="c">Accessi</th><th class="c">Tempo</th><th>Ultimo accesso</th></tr></thead><tbody>' + sintesi + '</tbody></table>' +
    stud + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},300)}</scr' + 'ipt></body></html>';
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per creare il PDF', true); return; }
  w.document.write(html); w.document.close();
}
function risultati() {
  var righe = S.d.alunni.map(function (a) {
    var ts = S.d.termini.filter(function (t) { return t.alunno === a.id; });
    var c = function (l) { var fatti = ts.filter(function (t) { return T(t, l, 'primoOk') != null; }); return fatti.length ? ts.filter(function (t) { return T(t, l, 'primoOk') === true; }).length + '/' + fatti.length : '—'; };
    var ap = ts.filter(function (t) { return t.statoIt === 'approvata' && (!EN() || t.statoEn === 'approvata'); }).length;
    return '<tr><td>' + esc(a.nome) + '</td><td class="n">' + a.gruppo + '</td><td class="n">' + c('it') + '</td>' + (EN() ? '<td class="n">' + c('en') + '</td>' : '') + '<td class="n">' + ap + '/' + ts.length + '</td></tr>';
  }).join('');
  return '<details class="card"><summary>Risultati per alunno</summary><p class="muted" style="margin:10px 0">“Al 1° tentativo”: scelte giuste già al primo invio, sul numero di termini in cui l\'alunno ha scelto. Utile per la valutazione.</p>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Gr.</th><th style="text-align:right">' + (EN() ? 'IT al 1° tentativo' : 'Al 1° tentativo') + '</th>' + (EN() ? '<th style="text-align:right">EN al 1° tentativo</th>' : '') + '<th style="text-align:right">Completati</th></tr></thead><tbody>' + righe + '</tbody></table></div></details>';
}
function chiusura(v) {
  api('chiusura', { chiusa: v }).then(function (r) { S.d.config.chiusa = r.chiusa; vistaDocente(); toast(r.chiusa ? 'App chiusa agli alunni' : 'App riaperta'); }).catch(function (e) { toast(errMsg(e), true); });
}
function esporta() {
  var dati = { generato: new Date().toISOString(), alunni: S.d.alunni, termini: S.d.termini };
  var url = URL.createObjectURL(new Blob([JSON.stringify(dati, null, 1)], { type: 'application/json' }));
  var a = document.createElement('a'); a.href = url; a.download = 'glossario-3e-' + oggiIso() + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  toast('Dati scaricati');
}
function stampaCodici() {
  var righe = S.d.codiciAlunni.map(function (a) {
    return '<div class="s"><div><b>' + esc(a.nome) + '</b> · ' + esc(etich(a)) + '<br><span>Glossario odontotecnico · ' + esc(location.origin) + '</span></div><div class="c">' + esc(a.codice) + '</div></div>';
  }).join('');
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per stampare', true); return; }
  w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Codici Glossario</title><style>body{font-family:Arial,sans-serif;margin:12mm}.s{display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #888;padding:5mm 2mm;font-size:12pt}.s span{font-size:9pt;color:#555}.c{font-family:monospace;font-size:20pt;font-weight:700;letter-spacing:3pt}</style></head><body>' + righe + '<scr' + 'ipt>window.onload=function(){window.print()}</scr' + 'ipt></body></html>');
  w.document.close();
}

/* ---------- solo prof. Cerrato: attività degli alunni ---------- */
function durata(min) { if (min == null) return '—'; if (min < 1) return '< 1 min'; var h = Math.floor(min / 60), m = min % 60; return h ? h + ' h' + (m ? ' ' + m + ' min' : '') : m + ' min'; }
function quando(iso) { if (!iso) return 'mai'; var d = new Date(iso), p = function (n) { return ('0' + n).slice(-2); }; return GG[d.getDay()] + ' ' + d.getDate() + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
function bloccoAttivita() {
  var A = S.d.admin.attivita; if (!A) return '';
  var righe = S.d.alunni.filter(function (a) { return inClasse(a.id); }).map(function (a) {
    var r = A[a.id] || {}, vecchio = !r.ultimo || r.giorniDaUltimo >= 3;
    var disp = Object.keys(r.dispositivi || {}).join(', ') || '—';
    var ses = (r.sessioni || []).slice(0, 8).map(function (x) { return quando(x.inizio) + ' · ' + durata(x.minuti) + (x.disp ? ' · ' + x.disp : ''); }).join('<br>');
    return '<tr><td>' + esc(a.nome) + '</td><td class="n">' + (r.accessi || 0) + '</td><td class="n">' + (r.giorni || 0) + '</td><td class="n">' + (r.ultimo ? durata(r.minuti) : '—') + '</td>' +
      '<td' + (vecchio ? ' style="color:var(--rosso,#B0304A);font-weight:700"' : '') + '>' + esc(quando(r.ultimo)) + (r.ultimo && r.giorniDaUltimo >= 1 ? ' <span class="muted" style="font-weight:400">(' + r.giorniDaUltimo + ' g fa)</span>' : '') + '</td>' +
      '<td>' + esc(disp) + '</td><td>' + (ses ? '<details><summary class="muted" style="font-size:13px">ultime sessioni</summary><div style="font-size:13px;margin-top:4px">' + ses + '</div></details>' : '—') + '</td></tr>';
  }).join('');
  return '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Attività degli alunni</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Accessi</th><th style="text-align:right">Giorni</th><th style="text-align:right">Tempo con l\'app aperta</th><th>Ultimo accesso</th><th>Dispositivi</th><th>Sessioni</th></tr></thead><tbody>' + righe + '</tbody></table></div>' +
    '<p class="muted" style="margin:0;font-size:14px">Il tempo conta i minuti in cui l\'app è aperta e in primo piano sul dispositivo dell\'alunno; una pausa di oltre 10 minuti chiude la sessione. In rosso chi non entra da 3 giorni o non è mai entrato.</p></section>';
}
/* ---------- solo prof. Cerrato: backup, report automatico su Dropbox, ripristino ---------- */
function bloccoBackup() {
  var D = S.d.admin.dropbox || {};
  var stato = !D.configurato ? '<b>Dropbox non ancora configurato.</b> Servono le variabili DROPBOX_APP_KEY e DROPBOX_APP_SECRET su Netlify (vedi la guida).' :
    !D.collegato ? '<b>Dropbox non collegato.</b> Premi “Collega Dropbox” e autorizza l\'app con il tuo account.' :
    '<b>Collegato</b>' + (D.account ? ' a ' + esc(D.account) : '') + '. Ogni giorno alle 23:59 arrivano nel tuo Dropbox, cartella <b>App › (nome della tua app)</b>, il backup completo e il report PDF.' +
    '<br>Ultimo invio: ' + (D.ultimoInvio ? esc(quando(D.ultimoInvio)) + ' — ' + (D.esito === 'ok' ? '<span style="color:#1B6E20;font-weight:700">riuscito</span>' : '<span style="color:#B0304A;font-weight:700">' + esc(D.esito) + '</span>') : 'nessuno');
  return '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Backup e report automatici</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    '<p style="margin:0">' + stato + '</p>' +
    '<div class="row">' +
    (D.configurato && !D.collegato ? '<button class="btn" onclick="dropboxCollega(this)">Collega Dropbox</button>' : '') +
    (D.collegato ? '<button class="btn" onclick="dropboxInvia(this)">Invia ora backup e report</button><button class="btn sec" onclick="dropboxScollega(this)">Scollega Dropbox</button>' : '') +
    '</div><hr style="border:0;border-top:1px solid #DDE4EA;width:100%;margin:4px 0">' +
    '<div class="row"><button class="btn sec" onclick="scaricaBackup(this)">Scarica backup completo (.json)</button>' +
    '<button class="btn warn" onclick="$(\'filebk\').click()">Ripristina da backup…</button><input type="file" id="filebk" accept=".json,application/json" style="display:none" onchange="ripristina(this)"></div>' +
    '<p class="muted" style="margin:0;font-size:14px">Il ripristino riporta risposte, voti, codici e registro accessi al momento del backup scelto. Prima di ripristinare l\'app scarica da sola una copia dello stato attuale.</p></section>';
}
function salvaFile(nome, testo) {
  var url = URL.createObjectURL(new Blob([testo], { type: 'application/json' }));
  var a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}
function timbroFile() { var d = new Date(), p = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()); }
function scaricaBackup(btn) {
  if (btn) btn.disabled = true;
  return api('backup').then(function (b) { salvaFile('glossario-3e_backup_' + timbroFile() + '.json', JSON.stringify(b, null, 1)); toast('Backup scaricato'); if (btn) btn.disabled = false; return b; })
    .catch(function (e) { if (btn) btn.disabled = false; toast(errMsg(e), true); throw e; });
}
function ricarica(msg) { return api('login').then(function (d) { S.d = d; vistaDocente(); if (msg) toast(msg); }); }
function ripristina(inp) {
  var f = inp.files && inp.files[0]; inp.value = '';
  if (!f) return;
  var r = new FileReader();
  r.onload = function () {
    var b; try { b = JSON.parse(r.result); } catch (e) { toast('Il file non è un JSON valido.', true); return; }
    if (!b || b.formato !== 'glossario3e-backup') { toast('Non è un backup completo del Glossario 3E.', true); return; }
    var conf = prompt('Ripristino del backup del ' + quando(b.creato) + '.\nTutti i dati attuali verranno sostituiti (prima ne scarico una copia).\n\nPer confermare scrivi RIPRISTINA');
    if (conf === null) return;
    if (String(conf).trim().toUpperCase() !== 'RIPRISTINA') { toast('Ripristino annullato.', true); return; }
    scaricaBackup().then(function () { return api('ripristina', { backup: b }); })
      .then(function (x) { return ricarica('Ripristinato il backup del ' + quando(x.creato)); })
      .catch(function (e) { toast(errMsg(e), true); });
  };
  r.readAsText(f);
}
function dropboxCollega(btn) {
  btn.disabled = true;
  api('dropboxcollega').then(function (x) { location.href = x.url; }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function dropboxInvia(btn) {
  btn.disabled = true; btn.textContent = 'Invio in corso…';
  api('dropboxinvia').then(function () { return ricarica('Backup e report caricati su Dropbox'); }).catch(function (e) { btn.disabled = false; btn.textContent = 'Invia ora backup e report'; toast(errMsg(e), true); });
}
function dropboxScollega(btn) {
  if (!confirm('Scollegare Dropbox? I file già caricati restano nel tuo Dropbox.')) return;
  btn.disabled = true;
  api('dropboxscollega').then(function () { return ricarica('Dropbox scollegato'); }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}

/* QR code in SVG (libreria qrcode-generator, MIT) */
function qrSvg(testo, mm) {
  var q = qrcode(0, 'M'); q.addData(testo); q.make();
  var n = q.getModuleCount(), m = 4, d = '';
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + mm + 'mm" height="' + mm + 'mm" viewBox="0 0 ' + (n + 2 * m) + ' ' + (n + 2 * m) + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#15212B"/></svg>';
}
/* una pagina A4 per alunno: link, QR con accesso diretto, codice personale */
function stampaSchede(classe) {
  var base = location.origin + '/';
  var imp = S.d.admin && S.d.admin.impostazioni;
  var logo = Poster.logo(22);
  var lista = S.d.codiciAlunni.filter(function (a) { return !classe || classe === 'tutte' || (a.classe || '3E') === classe; });
  var pagine = lista.map(function (a) {
    var ar = area(a.gruppo) || {};
    var link = base + '?c=' + encodeURIComponent(a.codice);
    return '<section class="pg">' +
      '<header>' + logo + '<div><div class="sc">Istituto Barsanti - sede Salvetti</div><div class="pr">Glossario odontotecnico' + (EN() ? ' bilingue' : '') + ' · Classe ' + esc(a.classe || '3E') + ' · a.s. 2026/27</div></div></header>' +
      '<div class="nome">' + esc(a.nome) + '</div>' +
      '<div class="gr" style="border-color:' + esc(ar.colore || '#15212B') + '">Classe ' + esc(a.classe || '3E') + (ar.it ? ' · Gruppo ' + esc(a.gruppo) + ' · ' + esc(ar.it) : ' · termini di tutte le aree') + '</div>' +
      '<div class="qr">' + qrSvg(link, 60) + '<p>Inquadra il QR con la fotocamera del telefono:<br><b>entri direttamente nel tuo glossario.</b></p></div>' +
      '<div class="acc"><div><div class="lb">Indirizzo dell\'app</div><div class="url">' + esc(base.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</div></div>' +
      '<div><div class="lb">Il tuo codice personale</div><div class="cod">' + esc(a.codice) + '</div></div></div>' +
      '<ol><li>Apri l\'app con il QR oppure scrivi l\'indirizzo e inserisci il codice.</li>' +
      '<li>Per ognuno dei tuoi ' + TPA() + ' termini scegli la definizione giusta tra 8' + (EN() ? ': prima in italiano, poi in inglese.' : '.') + '</li>' +
      '<li>Controlla spesso l\'app: trovi voto, scadenze ed eventuali termini ricevuti da un compagno.</li></ol>' +
      '<div class="ter"><div class="lb">I tuoi ' + (a.termini || []).length + ' termini</div><ol>' + (a.termini || []).map(function (t) { var z = area(t.area) || {}; return '<li><i style="background:' + esc(z.colore || '#15212B') + '"></i>' + esc(t.it) + '</li>'; }).join('') + '</ol></div>' +
      (imp ? '<div class="sca">' + (imp.partenza ? '<div><span>Partenza</span><b>' + esc(oraIt(imp.partenza)) + '</b></div>' : '') + '<div><span>' + (EN() ? 'Scadenza italiano' : 'Scadenza') + '</span><b>' + esc(oraIt(imp.scadenzaIt)) + '</b></div>' + (EN() ? '<div><span>Scadenza inglese</span><b>' + esc(oraIt(imp.scadenzaEn)) + '</b></div>' : '') + '</div>' : '') +
      '<div class="warn"><b>Il codice e il QR sono personali.</b> Non fotografarli e non darli a nessuno: chi li ha può rispondere al posto tuo. Chi a una scadenza ha anche un solo termine senza risposta viene escluso con voto 4.</div>' +
      '<footer>Prof. Danilo Cerrato · Laboratorio odontotecnico' + (EN() ? ' &nbsp;—&nbsp; Prof.ssa Federica Aliboni · Inglese tecnico' : '') + '</footer>' +
      '</section>';
  }).join('');
  var css = '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"Atkinson Hyperlegible",Arial,sans-serif;color:#15212B;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.pg{width:210mm;height:297mm;padding:16mm 18mm 14mm;display:flex;flex-direction:column;page-break-after:always;break-after:page;overflow:hidden}.pg:last-child{page-break-after:auto;break-after:auto}' +
    'header{display:flex;gap:5mm;align-items:center;border-bottom:1.2pt solid #15212B;padding-bottom:4mm}.sc{font-family:Archivo,Arial,sans-serif;font-weight:800;font-size:15pt}.pr{font-size:10.5pt;color:#5B6976;margin-top:1mm}' +
    '.nome{font-family:Archivo,Arial,sans-serif;font-weight:900;font-size:28pt;margin-top:7mm;line-height:1.1}.gr{display:inline-block;align-self:flex-start;border-left:3mm solid;padding:1mm 3mm;font-size:13pt;margin-top:2mm;background:#F2F5F7}' +
    '.qr{display:flex;flex-direction:column;align-items:center;margin-top:5mm}.qr svg{border:1pt solid #C3CED7;border-radius:3mm}.qr p{text-align:center;font-size:12pt;margin:3mm 0 0}' +
    '.acc{display:grid;grid-template-columns:1.3fr 1fr;gap:5mm;margin-top:5mm}.acc>div{border:1pt solid #C3CED7;border-radius:3mm;padding:3mm 4mm}.lb{font-size:9.5pt;color:#5B6976;text-transform:uppercase;letter-spacing:.06em}' +
    '.url{font-weight:700;font-size:14pt;margin-top:1.5mm;word-break:break-all}.cod{font-family:"Courier New",monospace;font-weight:700;font-size:24pt;letter-spacing:.18em;margin-top:1mm}' +
    'ol{font-size:11pt;line-height:1.4;margin:4mm 0 0;padding-left:6mm}li{margin:.6mm 0}' +
    '.ter{margin-top:4mm;border:1pt solid #C3CED7;border-radius:3mm;padding:2.5mm 4mm}.ter ol{columns:2;column-gap:8mm;margin:1.5mm 0 0;padding-left:6mm;font-size:11pt}.ter li{break-inside:avoid}.ter i{display:inline-block;width:2.6mm;height:2.6mm;border-radius:50%;margin-right:1.6mm;vertical-align:.2mm}' +
    '.sca{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:5mm}.sca div{background:#15212B;color:#fff;border-radius:3mm;padding:2.5mm 4mm}.sca span{display:block;font-size:9.5pt;opacity:.8}.sca b{font-size:12.5pt}' +
    '.warn{margin-top:auto;background:#FCEBD9;border-radius:3mm;padding:3mm 4mm;font-size:10.5pt;line-height:1.4}footer{margin-top:4mm;font-size:9.5pt;color:#5B6976;text-align:center}';
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per stampare', true); return; }
  w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Schede alunni Glossario ' + esc(classe && classe !== 'tutte' ? classe : CLASSI().join('-')) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + pagine +
    '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},400)}</scr' + 'ipt></body></html>');
  w.document.close();
}

/* ---------- registro attività: un segnale al minuto mentre l'app è aperta e in primo piano (solo alunni) ---------- */
function presenza() { if (S.codice && S.d && S.d.utente && S.d.utente.ruolo === 'alunno' && document.visibilityState === 'visible') api('presenza').catch(function () {}); }
setInterval(presenza, 60000);
document.addEventListener('visibilitychange', presenza);

/* ---------- avvio ---------- */
(function () {
  // accesso diretto dal QR della scheda: ?c=CODICE (il codice viene tolto subito dalla barra degli indirizzi)
  var qc = null; try { qc = new URLSearchParams(location.search).get('c'); } catch (e) {}
  if (qc) { memo(KEY_COD, String(qc).trim().toUpperCase()); try { history.replaceState(null, '', location.pathname); } catch (e) {} }
  var c = memo(KEY_COD);
  if (c) { $('app').innerHTML = '<div class="wrap"><div class="card login">Accesso in corso…</div></div>'; entra(c); } else vistaLogin();
})();
