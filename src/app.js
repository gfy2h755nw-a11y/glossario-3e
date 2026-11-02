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
    '<div><div class="muted disp" style="font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:13px">Classe 3E · a.s. 2026/27</div>' +
    '<h1>Glossario odontotecnico</h1><div class="term-en" style="color:var(--a1);margin-top:4px">Bilingual dental glossary</div></div>' +
    '<p class="muted" style="margin:0">Laboratorio odontotecnico · Inglese tecnico</p>' +
    (msg ? '<div class="note err">' + esc(msg) + '</div>' : '') +
    '<div><label for="cod">Il tuo codice personale</label><input id="cod" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase;font-family:Archivo,system-ui,sans-serif;font-weight:700;letter-spacing:.2em;font-size:22px" required></div>' +
    '<button class="btn" type="submit" id="bentra">Entra</button>' +
    '<p class="muted" style="margin:0;font-size:14px">Il codice te lo consegna il prof. Non darlo a nessuno: chi lo conosce può rispondere al posto tuo.</p></form></div>';
  $('flogin').onsubmit = function (e) { e.preventDefault(); entra($('cod').value); };
  $('cod').focus();
}
function entra(codice) {
  var b = $('bentra'); if (b) { b.disabled = true; b.textContent = 'Accesso…'; }
  S.codice = String(codice || '').trim().toUpperCase();
  api('login').then(function (d) {
    S.d = d; S.sel = {}; memo(KEY_COD, S.codice);
    if (d.utente.ruolo === 'docente') S.filtro = { area: 'tutte', stato: 'inviata', lingua: d.utente.lingua || 'it' };
    render();
  }).catch(function (e) { memo(KEY_COD, null); S.codice = null; vistaLogin(errMsg(e)); });
}
function esci() { memo(KEY_COD, null); S.codice = null; S.d = null; S.poster = null; vistaLogin(); }
function ricarica() { api('login').then(function (d) { S.d = d; render(); toast('Dati aggiornati'); }).catch(function (e) { toast(errMsg(e), true); }); }
function render() {
  clearInterval(S.timer);
  if (!S.d) return vistaLogin();
  if (S.d.escluso) return vistaEscluso();
  if (S.d.utente.ruolo === 'alunno') vistaAlunno(); else vistaDocente();
}
function vistaEscluso() {
  $('app').innerHTML = testata(S.d.utente.nome) + '<main class="wrap"><section class="card stack escluso" role="alert">' +
    '<div class="disp" style="font-weight:900;font-size:26px;line-height:1.25">' + esc(S.d.messaggio) + '</div>' +
    '<p style="margin:0">Per chiarimenti parla con il prof. Cerrato.</p></section></main>';
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
function bloccoScadenze(miei) {
  var c = S.d.config;
  var mancaIt = miei.filter(function (t) { return !t.statoIt || t.statoIt === ''; }).length;
  var mancaEn = miei.filter(function (t) { return !t.statoEn; }).length;
  function riga(lab, iso, manca, nota) {
    return '<div class="cd-box"><div class="cd-t">' + lab + '</div><div class="muted" style="font-size:14px">' + esc(oraIt(iso)) + '</div>' +
      '<div data-cd="' + esc(iso) + '">' + cdHtml(iso) + '</div>' +
      '<div style="font-size:14px">' + (manca ? '<b>' + manca + '</b> ' + (manca === 1 ? 'termine' : 'termini') + ' ancora senza risposta' : nota) + '</div></div>';
  }
  return '<section class="card stack"><h2 style="margin:0;font-size:22px">Scadenze</h2><div class="grid2">' +
    riga('Italiano', c.scadenzaIt, mancaIt, '✓ Tutti i termini hanno una risposta') +
    riga('Inglese', c.scadenzaEn, mancaEn, '✓ Tutti i termini hanno una risposta') +
    '</div><p class="note warn" style="margin:0">Chi alla scadenza ha ancora termini senza risposta viene <b>escluso dal compito</b> con voto 4.</p></section>';
}
function bloccoVoto() {
  var v = S.d.voto; if (!v) return '';
  return '<section class="card voto-box"><div><div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px">' + (v.manuale ? 'Voto assegnato dal docente' : 'Voto provvisorio') + '</div>' +
    '<div class="voto-n">' + fv(v.voto) + '<small>/8</small></div>' + (v.voto == null ? '<div class="muted" style="font-size:14px">Comparirà alla prima risposta</div>' : '') + '</div>' +
    '<div style="flex:1;min-width:200px"><div class="row" style="gap:8px"><span class="chip s-approvata">Corrette ' + v.corrette + '</span><span class="chip s-correggere">Errate ' + v.errate + '</span><span class="chip s-vuota">Risposte date ' + v.inviate + '</span></div>' +
    '<p class="muted" style="margin:10px 0 0;font-size:14px">' + esc(v.ratio) + '</p></div></section>';
}
function testata(sotto) {
  return '<header class="top"><div class="wrap"><div class="brand">Glossario 3E<small>' + esc(sotto) + '</small></div>' +
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
  var sel = S.d.utente.ruolo === 'docente' ? '<div><label for="selposter" class="sr">Scegli il cartellone</label><select id="selposter" onchange="disegnaPoster(this.value)">' + opts + '</select></div>' : '';
  return '<section class="card stack"><h2 style="margin:0;font-size:22px">Anteprima del cartellone 70×100</h2>' + sel +
    '<p class="muted" style="margin:0;font-size:15px">Sul cartellone vanno solo le definizioni approvate dai docenti.</p>' +
    '<div class="poster-box" id="pbox"><div class="poster-scale" id="pscale"></div></div></section>';
}
function disegnaPoster(n) {
  S.poster = n; var box = $('pbox'), sc = $('pscale'); if (!box) return;
  var ts = S.d.termini.filter(function (t) { return t.area == n; });
  sc.innerHTML = Poster.html(area(n), ts, S.d.alunni, { soloApprovate: true });
  var f = sc.firstChild, k = (box.clientWidth - 24) / f.offsetWidth;
  sc.style.transform = 'scale(' + k + ')'; box.style.height = (f.offsetHeight * k + 24) + 'px';
}
window.addEventListener('resize', function () { if (S.poster && $('pbox')) disegnaPoster(S.poster); });

/* ---------- alunno ---------- */
function vistaAlunno() {
  var u = S.d.utente, a = area(u.gruppo);
  var miei = S.d.termini.filter(function (t) { return t.alunno === u.id; });
  var n = function (l) { return miei.filter(function (t) { return T(t, l, 'stato') === 'approvata'; }).length; };
  var h = testata(u.nome + ' · Gruppo ' + u.gruppo) + '<main class="wrap stack">';
  h += '<section class="card" style="border-top:8px solid ' + a.colore + '"><div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px">Area ' + a.n + '</div>' +
    '<h1 style="margin:2px 0 0;font-size:30px;line-height:1.1">' + esc(a.it) + '</h1><div class="term-en" style="color:' + a.colore + '">' + esc(a.en) + '</div>' +
    '<p style="margin:12px 0 0">Ciao <b>' + esc(u.nome) + '</b>. Per ognuno dei tuoi <b>5 termini</b> scegli la definizione giusta tra 8 alternative. Prima in italiano: quando il prof. Cerrato la approva, si sblocca la scelta in inglese, rivista dalla prof.ssa Aliboni.</p>' +
    '<div class="row" style="margin-top:12px"><span class="chip s-approvata">Italiano ' + n('it') + '/5</span><span class="chip s-approvata">Inglese ' + n('en') + '/5</span></div></section>';
  if (S.d.config.chiusa) h += '<div class="note warn"><b>L\'app è chiusa.</b> Le scelte non sono più modificabili.</div>';
  h += bloccoVoto() + bloccoScadenze(miei) + bloccoTappe();
  h += miei.map(cardAlunno).join('');
  h += bloccoPoster(u.gruppo) + '</main>';
  $('app').innerHTML = h; disegnaPoster(u.gruppo); avviaCountdown();
}
function cardAlunno(t) {
  var col = area(t.area).colore;
  function blocco(l) {
    var st = T(t, l, 'stato'), comm = T(t, l, 'comm'), ops = T(t, l, 'opz'), scelta = T(t, l, 'scelta');
    var h = '<div class="lang"><h3>' + (l === 'it' ? 'Definizione in italiano' : 'Definition in English') + chip(st) + '</h3>';
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
  return '<article class="card"><div class="term-it">' + esc(t.it) + '</div><div class="term-en" lang="en" style="color:' + col + '">' + esc(t.en) + '</div>' + blocco('it') + blocco('en') + '</article>';
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
  var h = testata(u.nome + ' · area docenti') + '<main class="wrap stack">';
  if (S.d.config.chiusa) h += '<div class="note warn"><b>App chiusa agli alunni.</b> I docenti possono ancora rivedere.</div>';
  h += '<section class="grid4">' + S.d.aree.map(function (a) {
    var ts = S.d.termini.filter(function (t) { return t.area == a.n; });
    var c = function (l, st) { return ts.filter(function (t) { return T(t, l, 'stato') === st; }).length; };
    var riv = c('it', 'inviata') + c('en', 'inviata');
    var pronte = ts.filter(function (t) { return t.statoIt === 'approvata' && t.statoEn === ''; }).length;
    return '<div class="card" style="border-top:8px solid ' + a.colore + '"><div class="disp" style="font-weight:800;font-size:17px;line-height:1.2">' + a.n + '. ' + esc(a.it) + '</div>' +
      ['it', 'en'].map(function (l) { var v = c(l, 'approvata'); return '<div style="margin-top:10px;font-size:15px">' + (l === 'it' ? 'Italiano' : 'Inglese') + ' <b>' + v + '/' + ts.length + '</b></div><div class="bar"><span style="width:' + (v / ts.length * 100) + '%;background:' + a.colore + '"></span></div>'; }).join('') +
      (pronte ? '<div style="margin-top:8px;font-size:14px" class="muted">' + pronte + ' pronte per l\'inglese, non ancora scelte</div>' : '') +
      '<div style="margin-top:10px">' + (riv ? '<span class="chip s-inviata">' + riv + ' da rivedere</span>' : '<span class="chip s-vuota">Niente da rivedere</span>') + '</div></div>';
  }).join('') + '</section>';

  var lista = S.d.termini.filter(function (t) {
    if (f.area !== 'tutte' && t.area != f.area) return false;
    if (f.stato === 'pronte') return t.statoIt === 'approvata' && t.statoEn !== 'approvata';
    return f.stato === 'tutti' ? true : T(t, f.lingua, 'stato') === f.stato;
  });
  var corrette = lista.filter(function (t) { return T(t, f.lingua, 'stato') === 'inviata' && T(t, f.lingua, 'ok') === true && (f.lingua === 'it' || t.statoIt === 'approvata'); });
  h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Revisione</h2><div class="grid4">' +
    '<div><label for="fl">Lingua</label><select id="fl" onchange="S.filtro.lingua=this.value;vistaDocente()">' + [['it', 'Italiano'], ['en', 'Inglese']].map(function (o) { return '<option value="' + o[0] + '"' + (f.lingua === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
    '<div><label for="fs">Stato</label><select id="fs" onchange="S.filtro.stato=this.value;vistaDocente()">' + [['inviata', 'Da rivedere (inviate)'], ['pronte', 'Italiano approvato, inglese da fare'], ['correggere', 'Rimandate all\'alunno'], ['', 'Non ancora scelte'], ['approvata', 'Approvate'], ['tutti', 'Tutti']].map(function (o) { return '<option value="' + o[0] + '"' + (f.stato === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
    '<div><label for="fa">Area</label><select id="fa" onchange="S.filtro.area=this.value;vistaDocente()"><option value="tutte">Tutte le aree</option>' + S.d.aree.map(function (a) { return '<option value="' + a.n + '"' + (f.area == a.n ? ' selected' : '') + '>' + a.n + '. ' + esc(a.it) + '</option>'; }).join('') + '</select></div></div>' +
    (corrette.length ? '<div class="row"><button class="btn ok" onclick="approvaCorrette(this)">Approva tutte le scelte corrette (' + corrette.length + ')</button><span class="muted" style="font-size:15px">Quelle sbagliate restano da rivedere una per una.</span></div>' : '') +
    '</section>';
  h += '<p class="muted" style="margin:0">' + lista.length + ' termini · ' + (f.lingua === 'it' ? 'italiano' : 'inglese') + '</p>';
  h += lista.map(function (t) { return cardDocente(t, f.lingua); }).join('') || '<div class="card muted">Nessun termine con questo filtro.</div>';
  h += panoramica() + (S.d.admin ? bloccoAdmin() : '') + bloccoPoster(S.poster || (f.area !== 'tutte' ? f.area : 1)) + bloccoTappe();
  h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Accesso degli alunni</h2><p style="margin:0">L\'app è <b>' + (S.d.config.chiusa ? 'chiusa' : 'aperta') + '</b>' + (S.d.config.chiusa ? ': gli alunni vedono le scelte ma non possono modificarle.' : ': gli alunni possono scegliere e inviare.') + '</p>' +
    '<div class="row"><button class="btn ' + (S.d.config.chiusa ? 'ok' : 'warn') + '" onclick="chiusura(' + (!S.d.config.chiusa) + ')">' + (S.d.config.chiusa ? 'Riapri l\'app agli alunni' : 'Chiudi l\'app agli alunni') + '</button></div></section>';
  h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Dati per la stampa</h2><p style="margin:0">A lavoro finito scarica i dati: servono per impaginare i 4 PDF definitivi (vanno solo le definizioni approvate).</p><div class="row"><button class="btn sec" onclick="esporta()">Scarica i dati (.json)</button></div></section>';
  if (S.d.codiciAlunni) {
    h += '<details class="card" id="codici"><summary>Codici personali degli alunni (riservato)</summary>' +
      '<p class="muted" style="margin:10px 0">Stampa e ritaglia le strisce da consegnare a mano. Link dell\'app: <b>' + esc(location.origin) + '</b></p>' +
      '<div class="row" style="margin-bottom:10px"><button class="btn sec" onclick="stampaCodici()">Stampa i codici</button></div>' +
      '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th>Gruppo</th><th>Codice</th></tr></thead><tbody>' +
      S.d.codiciAlunni.map(function (a) { return '<tr><td>' + esc(a.nome) + '</td><td>' + esc(a.gruppo) + '</td><td style="font-family:monospace;font-size:18px;font-weight:700;letter-spacing:.15em">' + esc(a.codice) + '</td></tr>'; }).join('') +
      '</tbody></table></div></details>';
  }
  h += '</main>';
  $('app').innerHTML = h; disegnaPoster(S.poster || (f.area !== 'tutte' ? f.area : 1));
}
function cardDocente(t, l) {
  var a = area(t.area), st = T(t, l, 'stato'), scelta = T(t, l, 'scelta'), ok = T(t, l, 'ok'), comm = T(t, l, 'comm');
  var h = '<article class="card" style="border-top:6px solid ' + a.colore + '"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="term-it">' + esc(t.it) + '</div><div class="term-en" lang="en" style="color:' + a.colore + '">' + esc(t.en) + '</div></div>' +
    '<div class="muted" style="text-align:right;font-size:15px"><b style="color:var(--ink)">' + esc(nomeAlunno(t.alunno)) + '</b><br>Area ' + t.area + (T(t, l, 'tent') ? ' · tentativi: ' + T(t, l, 'tent') : '') + (t.agg ? '<br>' + esc(t.agg) : '') + '</div></div>';
  if (l === 'en') {
    h += '<div class="lang"><h3>Italiano' + chip(t.statoIt) + '</h3>' + (t.statoIt === 'approvata'
      ? '<div class="fixed-text">' + esc(t.defIt) + '</div><p class="muted" style="margin:6px 0 0;font-size:14px">Approvata da ' + esc(t.daIt) + '</p>'
      : '<p class="muted" style="margin:0">Non ancora approvata in italiano.</p>') + '</div>';
  }
  h += '<div class="lang"><h3>' + (l === 'it' ? 'Italiano' : 'English') + chip(st) + '</h3>';
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
  var righe = P.map(function (r) {
    Object.keys(tot).forEach(function (k) { tot[k] += r[k]; });
    return '<tr' + (r.escluso ? ' class="riga-esclusa"' : '') + '><td>' + esc(r.nome) + (r.escluso ? ' <span class="chip s-correggere" title="' + esc(r.motivo) + '">Escluso</span>' : '') + '</td><td class="n">' + r.gruppo + '</td>' +
      '<td class="n">' + r.inviate + '</td><td class="n" style="color:var(--ok)">' + r.corrette + '</td><td class="n" style="color:var(--err)">' + r.errate + '</td>' +
      '<td class="n">' + (r.daApprovare ? '<span class="chip s-inviata">' + r.daApprovare + '</span>' : '0') + '</td><td class="n">' + r.approvate + '/10</td></tr>';
  }).join('');
  return '<section class="card stack"><h2 style="margin:0;font-size:22px">Panoramica della classe</h2>' +
    '<div class="grid4 kpi">' + [['Risposte date', tot.inviate, ''], ['Corrette', tot.corrette, 'var(--ok)'], ['Errate', tot.errate, 'var(--err)'], ['Da approvare', tot.daApprovare, 'var(--info)']].map(function (k) {
      return '<div class="kpi-c"><div class="kpi-n" style="color:' + (k[2] || 'var(--ink)') + '">' + k[1] + '</div><div class="muted">' + k[0] + '</div></div>'; }).join('') + '</div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Gr.</th><th style="text-align:right">Risposte date</th><th style="text-align:right">Corrette</th><th style="text-align:right">Errate</th><th style="text-align:right">Da approvare</th><th style="text-align:right">Approvate</th></tr></thead><tbody>' + righe + '</tbody></table></div>' +
    '<p class="muted" style="margin:0;font-size:14px">Risposte date = tutti gli invii, comprese le correzioni. Approvate: su 10 (5 in italiano + 5 in inglese).</p></section>';
}
/* ---------- solo prof. Cerrato: scadenze, voti, report ---------- */
function isoLocale(iso) { var d = new Date(iso); var p = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
function bloccoAdmin() {
  var A = S.d.admin, imp = A.impostazioni;
  var h = '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Scadenze e valutazione</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    '<div class="grid2"><div><label for="scIt">Scadenza italiano</label><input id="scIt" type="datetime-local" value="' + isoLocale(imp.scadenzaIt) + '"></div>' +
    '<div><label for="scEn">Scadenza inglese</label><input id="scEn" type="datetime-local" value="' + isoLocale(imp.scadenzaEn) + '"></div></div>' +
    '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Penalità per ogni risposta errata</legend>' +
    [['A', '−0,25 per errore: 16 errori per scendere da 8 a 4'], ['B', '−0,50 per errore: 8 errori per scendere da 8 a 4']].map(function (o) {
      return '<label class="op' + (imp.proposta === o[0] ? ' on' : '') + '" for="pr' + o[0] + '"><input type="radio" name="prop" id="pr' + o[0] + '" value="' + o[0] + '"' + (imp.proposta === o[0] ? ' checked' : '') + ' onchange="segna(this)"><span class="lt">' + o[0] + '</span><span>Proposta ' + o[0] + ': ' + o[1] + '</span></label>';
    }).join('') + '</fieldset>' +
    '<div class="row"><button class="btn" onclick="salvaImpostazioni(this)">Salva scadenze e penalità</button></div>' +
    '<p class="muted" style="margin:0;font-size:14px">' + esc(A.ratio) + '</p></section>';
  var nomi = {}; (S.d.panoramica || []).forEach(function (r) { nomi[r.id] = r; });
  var row = function (v) {
    var r = nomi[v.id];
    return '<tr><td>' + esc(r.nome) + '</td><td class="n">' + r.gruppo + '</td><td class="n">' + r.errate + '</td><td class="n">' + fv(v.calcolato) + '</td>' +
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap"><label for="vm_' + v.id + '" class="sr">Voto manuale ' + esc(r.nome) + '</label><input id="vm_' + v.id + '" type="text" inputmode="decimal" style="width:80px;padding:6px 8px" value="' + (v.manuale != null ? String(v.manuale).replace('.', ',') : '') + '" placeholder="—">' +
      '<button class="btn sec" style="min-height:38px;padding:0 10px" onclick="salvaVoto(\'' + v.id + '\',this)">Salva</button></div></td>' +
      '<td class="n"><b style="font-size:18px">' + fv(v.voto) + '</b></td></tr>';
  };
  var attivi = A.voti.filter(function (v) { return !v.escluso; }), esclusi = A.voti.filter(function (v) { return v.escluso || v.riammesso; });
  h += '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Tabellone dei voti</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Gr.</th><th style="text-align:right">Errate</th><th style="text-align:right">Calcolato</th><th>Voto manuale</th><th style="text-align:right">Voto</th></tr></thead><tbody>' +
    attivi.map(row).join('') + '</tbody></table></div><p class="muted" style="margin:0;font-size:14px">Il voto manuale sostituisce quello calcolato e lo vede anche l\'alunno. Lascia vuoto e salva per tornare al calcolo.</p>';
  if (esclusi.length) {
    h += '<h3 style="margin:8px 0 0">Esclusi per mancato rispetto della scadenza</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th>Motivo</th><th style="text-align:right">Voto</th><th></th></tr></thead><tbody>' +
      esclusi.map(function (v) { var r = nomi[v.id]; return '<tr><td>' + esc(r.nome) + (v.riammesso ? ' <span class="chip s-approvata">Riammesso</span>' : '') + '</td><td>' + esc(v.motivo || r.motivo || '') + '</td><td class="n"><b>' + fv(v.voto) + '</b></td>' +
        '<td><button class="btn sec" style="min-height:38px;padding:0 10px" onclick="riammetti(\'' + v.id + '\',' + (!v.riammesso) + ',this)">' + (v.riammesso ? 'Annulla riammissione' : 'Riammetti') + '</button></td></tr>'; }).join('') + '</tbody></table></div>';
  }
  h += '<div class="row"><button class="btn" onclick="reportPdf()">Report completo (PDF)</button><span class="muted" style="font-size:14px">Si apre la stampa: scegli “Salva come PDF”.</span></div></section>';
  return h;
}
function salvaImpostazioni(btn) {
  var it = $('scIt').value, en = $('scEn').value, pr = document.querySelector('input[name="prop"]:checked');
  if (!it || !en) { toast('Inserisci entrambe le scadenze.', true); return; }
  btn.disabled = true;
  api('impostazioni', { scadenzaIt: new Date(it).toISOString(), scadenzaEn: new Date(en).toISOString(), proposta: pr ? pr.value : null })
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
  var stud = (S.d.panoramica || []).map(function (r) {
    var v = voti[r.id], ts = S.d.termini.filter(function (t) { return t.alunno === r.id; });
    var righe = '';
    ts.forEach(function (t) {
      ['it', 'en'].forEach(function (l) {
        var st = T(t, l, 'storia') || [], fin = T(t, l, 'scelta');
        righe += '<tr><td><b>' + esc(l === 'it' ? t.it : t.en) + '</b><br><span class="m">' + (l === 'it' ? 'Italiano' : 'Inglese') + '</span></td>' +
          '<td class="c">' + (st.length ? st.map(function (x) { return x.ok ? '<span class="ok">✓</span>' : '<span class="no">✗</span>'; }).join(' ') : '<span class="m">—</span>') + '</td>' +
          '<td>' + (fin ? esc(fin) : (st.length ? '<span class="m">(rimandata, in attesa di nuova scelta)</span>' : '<span class="m">nessuna risposta</span>')) + '</td>' +
          '<td class="c">' + esc(STATO_TXT[T(t, l, 'stato') || '']) + '</td></tr>';
      });
    });
    return '<section class="st"><div class="h"><div><h2>' + esc(r.nome) + '</h2><div class="m">Gruppo ' + r.gruppo + ' · ' + esc(S.d.aree[r.gruppo - 1].it) + '</div></div>' +
      '<div class="v"><div class="vn">' + fv(v.voto) + '<small>/8</small></div><div class="m">' + (v.escluso ? 'Escluso: ' + esc(v.motivo) : v.manuale != null ? 'Voto manuale (calcolato: ' + fv(v.calcolato) + ')' : 'Voto calcolato') + '</div></div></div>' +
      '<p class="k">Risposte date <b>' + r.inviate + '</b> · corrette <b>' + r.corrette + '</b> · errate <b>' + r.errate + '</b> · da approvare <b>' + r.daApprovare + '</b> · approvate <b>' + r.approvate + '/10</b></p>' +
      '<table><thead><tr><th style="width:24%">Termine</th><th style="width:12%">Tentativi</th><th>Risposta attuale</th><th style="width:13%">Stato</th></tr></thead><tbody>' + righe + '</tbody></table></section>';
  }).join('');
  var sintesi = (S.d.panoramica || []).map(function (r) { var v = voti[r.id]; return '<tr><td>' + esc(r.nome) + '</td><td class="c">' + r.gruppo + '</td><td class="c">' + r.inviate + '</td><td class="c">' + r.corrette + '</td><td class="c">' + r.errate + '</td><td class="c"><b>' + fv(v.voto) + '</b>' + (v.escluso ? ' (escluso)' : v.manuale != null ? ' (manuale)' : '') + '</td></tr>'; }).join('');
  var css = '@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#15212B;font-size:10pt;margin:0}h1{font-size:18pt;margin:0}h2{font-size:13pt;margin:0}.m{color:#5B6976;font-size:9pt}' +
    'table{width:100%;border-collapse:collapse;margin-top:6px}th,td{border:1px solid #C3CED7;padding:4px 6px;text-align:left;vertical-align:top;font-size:9pt}th{background:#15212B;color:#fff}.c{text-align:center}' +
    '.ok{color:#1B6E20;font-weight:700}.no{color:#B0304A;font-weight:700}.st{break-before:page}.h{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #15212B;padding-bottom:6px}' +
    '.vn{font-size:26pt;font-weight:800;text-align:right}.vn small{font-size:11pt;color:#5B6976}.v{text-align:right}.k{margin:8px 0 0}.box{background:#EEF2F5;padding:8px 10px;border-radius:6px;margin-top:8px}';
  var html = '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Report Glossario 3E</title><style>' + css + '</style></head><body>' +
    '<h1>Glossario odontotecnico bilingue · Report della classe 3E</h1><div class="m">IIS “L. Barsanti” – Plesso Salvetti, Massa · a.s. 2026/27 · generato il ' + esc(oggi) + '</div>' +
    '<div class="box"><b>Criterio di assegnazione del punteggio.</b> ' + esc(A.ratio) + ' Ogni alunno ha 5 termini e per ciascuno sceglie la definizione corretta tra 8 alternative, in italiano e in inglese (10 risposte in tutto).</div>' +
    '<div class="box">Scadenza italiano: ' + esc(oraIt(A.impostazioni.scadenzaIt)) + ' · Scadenza inglese: ' + esc(oraIt(A.impostazioni.scadenzaEn)) + '</div>' +
    '<h2 style="margin-top:12px">Sintesi</h2><table><thead><tr><th>Alunno</th><th class="c">Gr.</th><th class="c">Risposte date</th><th class="c">Corrette</th><th class="c">Errate</th><th class="c">Voto</th></tr></thead><tbody>' + sintesi + '</tbody></table>' +
    stud + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},300)}</scr' + 'ipt></body></html>';
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per creare il PDF', true); return; }
  w.document.write(html); w.document.close();
}
function risultati() {
  var righe = S.d.alunni.map(function (a) {
    var ts = S.d.termini.filter(function (t) { return t.alunno === a.id; });
    var c = function (l) { var fatti = ts.filter(function (t) { return T(t, l, 'primoOk') != null; }); return fatti.length ? ts.filter(function (t) { return T(t, l, 'primoOk') === true; }).length + '/' + fatti.length : '—'; };
    var ap = ts.filter(function (t) { return t.statoIt === 'approvata' && t.statoEn === 'approvata'; }).length;
    return '<tr><td>' + esc(a.nome) + '</td><td class="n">' + a.gruppo + '</td><td class="n">' + c('it') + '</td><td class="n">' + c('en') + '</td><td class="n">' + ap + '/' + ts.length + '</td></tr>';
  }).join('');
  return '<details class="card"><summary>Risultati per alunno</summary><p class="muted" style="margin:10px 0">“Al 1° tentativo”: scelte giuste già al primo invio, sul numero di termini in cui l\'alunno ha scelto. Utile per la valutazione.</p>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Gr.</th><th style="text-align:right">IT al 1° tentativo</th><th style="text-align:right">EN al 1° tentativo</th><th style="text-align:right">Completati</th></tr></thead><tbody>' + righe + '</tbody></table></div></details>';
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
    return '<div class="s"><div><b>' + esc(a.nome) + '</b> · Gruppo ' + esc(a.gruppo) + '<br><span>Glossario 3E · ' + esc(location.origin) + '</span></div><div class="c">' + esc(a.codice) + '</div></div>';
  }).join('');
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per stampare', true); return; }
  w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Codici Glossario 3E</title><style>body{font-family:Arial,sans-serif;margin:12mm}.s{display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #888;padding:5mm 2mm;font-size:12pt}.s span{font-size:9pt;color:#555}.c{font-family:monospace;font-size:20pt;font-weight:700;letter-spacing:3pt}</style></head><body>' + righe + '<scr' + 'ipt>window.onload=function(){window.print()}</scr' + 'ipt></body></html>');
  w.document.close();
}

/* ---------- avvio ---------- */
(function () {
  var c = memo(KEY_COD);
  if (c) { $('app').innerHTML = '<div class="wrap"><div class="card login">Accesso in corso…</div></div>'; entra(c); } else vistaLogin();
})();
