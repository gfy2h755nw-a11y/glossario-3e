/* Glossario 3E – app (modalità "scegli la definizione tra 8") */
var API_URL = '/api';
var KEY_COD = 'glossario3e_codice';
var S = { codice: null, d: null, filtro: { area: 'tutte', stato: 'inviata', lingua: 'it' }, poster: null, sel: {} };

/* ---------- utilità ---------- */
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(msg, err) { var t = $('toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.style.display = 'block'; clearTimeout(toast._t); toast._t = setTimeout(function () { t.style.display = 'none'; }, 3500); }
function memo(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
// in un'edizione archiviata si può solo leggere
var AZ_LETTURA = ['login', 'archivioconsulta', 'archiviofile', 'pubblico', 'backup', 'presenza'];
function api(azione, dati) {
  if (S.d && S.d.solaLettura && AZ_LETTURA.indexOf(azione) < 0) return Promise.reject(new Error('Stai consultando un\'edizione archiviata: è in sola lettura. Usa «Torna all\'edizione in corso» per lavorare.'));
  var corpo = Object.assign({ azione: azione, codice: S.codice }, S.att && S.att !== 'main' ? { att: S.att } : {}, dati || {});
  return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
    .catch(function () { var e = new Error('Connessione assente: controlla internet e riprova.'); e.rete = true; throw e; })
    .then(function (r) { return r.json().catch(function () { return { errore: 'Risposta non valida dal server (' + r.status + ').' }; }); })
    .then(function (j) { if (!j.ok) { var e = new Error(j.errore || 'Errore sconosciuto.'); e.api = true; throw e; } return j.dati; });
}
/* indirizzo della pagina pubblica dell'attività aperta (con ?att= per le attività parallele) */
function urlPubblico(da) { return location.origin + '/glossario?att=' + encodeURIComponent((S.d && S.d.att) || 'main') + (da ? '&da=' + da : ''); }
/* QR dei cartelloni (tuoi e dei colleghi): portano alla home dei glossari */
function urlCartellone() { return location.origin + '/glossario?da=qr'; }
/* regole dell'attività aperta (scritto, quiz, interrogazione, voto finale): per la 3E e la 3F quelle di sempre */
function RG() { var r = (S.d && S.d.regole) || {}; return { quiz: r.quiz || { secondi: 60, opzioni: 4, passo: 5 }, orale: r.orale || { domande: 10, base: 3, passo: 0.5, passoEsclusi: 0.25, max: 8, maxEsclusi: 5.5 }, finale: r.finale || { pesoScritto: 50 }, scritto: r.scritto || {} }; }
function frz(x) { return x === 0.5 ? '½' : x === 0.25 ? '¼' : fv(x); }
function nDef(n) { return n === 4 ? 'quattro definizioni' : n + ' definizioni'; }
function regolaOrale() { var o = RG().orale; return 'Voto orale = ' + fv(o.base) + ' + ' + frz(o.passo) + ' per punto'; }
function mediaTxt() { var p = RG().finale.pesoScritto; return p === 50 ? 'media tra scritto e orale' : 'media pesata tra scritto (' + p + ' %) e orale (' + (100 - p) + ' %)'; }
function errMsg(e) { return e && e.message ? e.message : String(e); }
var STATO_TXT = { '': 'Da scegliere', inviata: 'Inviata', correggere: 'Da rivedere', approvata: 'Approvata' };
function chip(st) { return '<span class="chip s-' + (st || 'vuota') + '">' + STATO_TXT[st || ''] + '</span>'; }
function area(n) { return S.d.aree.filter(function (a) { return a.n == n; })[0]; }
function nomeAlunno(id) { var a = S.d.alunni.filter(function (x) { return x.id === id; })[0]; return a ? a.nome : id; }
/* lingue attive: in questa fase solo italiano (config.lingue = ['it']) */
function EN() { return !!(S.d && S.d.config && (S.d.config.lingue || ['it', 'en']).indexOf('en') >= 0); }
function LINGUE() { return EN() ? ['it', 'en'] : ['it']; }
function TPA() { return (S.d && S.d.config && S.d.config.terminiPerAlunno) || 10; }
/* caratteri ospitati dall'app (cartella /fonts): stessi caratteri a schermo, nelle finestre di stampa e nei PDF */
var FONTI = [['Archivo', 400, 'normal', 'archivo-latin-400-normal'], ['Archivo', 600, 'normal', 'archivo-latin-600-normal'], ['Archivo', 600, 'italic', 'archivo-latin-600-italic'], ['Archivo', 700, 'normal', 'archivo-latin-700-normal'],
  ['Archivo', 800, 'normal', 'archivo-latin-800-normal'], ['Archivo', 900, 'normal', 'archivo-latin-900-normal'], ['Cormorant Garamond', 500, 'italic', 'cormorant-garamond-latin-500-italic'], ['Cormorant Garamond', 600, 'italic', 'cormorant-garamond-latin-600-italic'],
  ['Atkinson Hyperlegible', 400, 'normal', 'atkinson-hyperlegible-latin-400-normal'], ['Atkinson Hyperlegible', 700, 'normal', 'atkinson-hyperlegible-latin-700-normal'], ['Atkinson Hyperlegible', 400, 'italic', 'atkinson-hyperlegible-latin-400-italic'], ['Atkinson Hyperlegible', 700, 'italic', 'atkinson-hyperlegible-latin-700-italic']];
function cssFonti(base) { return FONTI.map(function (f) { return "@font-face{font-family:'" + f[0] + "';font-style:" + f[2] + ';font-weight:' + f[1] + ';font-display:block;src:url(' + (base || '') + '/fonts/' + f[3] + ".woff2) format('woff2')}"; }).join(''); }
/* promessa: tutti i caratteri caricati davvero (document.fonts.ready da solo non aspetta quelli non ancora richiesti) */
/* script per le finestre di stampa: aspetta i caratteri veri, poi esegue «dopo» */
function scriptStampa(dopo) {
  return '<scr' + 'ipt>(function(){var F=' + JSON.stringify(FONTI) + ';var p=document.fonts&&document.fonts.load?Promise.all(F.map(function(f){return document.fonts.load(f[2]+" "+f[1]+" 20px \'"+f[0]+"\'").catch(function(){return 0})})):Promise.resolve();' +
    'Promise.race([p,new Promise(function(r){setTimeout(r,6000)})]).then(function(){' + dopo + '})})()</scr' + 'ipt>';
}
function caratteriPronti(doc) {
  doc = doc || document; if (!doc.fonts || !doc.fonts.load) return Promise.resolve();
  return Promise.race([Promise.all(FONTI.map(function (f) { return doc.fonts.load(f[2] + ' ' + f[1] + " 20px '" + f[0] + "'").catch(function () { return 0; }); })), new Promise(function (r) { setTimeout(r, 6000); })]);
}
var VERSIONE = '23/11/2026 · 4';
/* classi: 3E e 3F */
// prof. Cerrato e facoltà dei colleghi
function ADM() { return !!(S.d && S.d.utente && S.d.utente.admin); }
/* gestione dell'attività aperta: il prof. Cerrato o il collega titolare (che vede solo la sua) */
function GEST() { return !!(S.d && S.d.utente && S.d.utente.gestore); }
function LOC() { return ADM() || GEST(); }
function PUO(p) { return ADM() || !!(S.d && S.d.utente && S.d.utente.permessi && S.d.utente.permessi[p]); }
function elencoClassi(arr) { arr = arr || CLASSI(); return arr.length > 1 ? arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1] : arr.join(''); }
function CLASSI() { return (S.d && S.d.config && S.d.config.classi) || ['3E']; }
function alunnoDi(id) { return S.d.alunni.filter(function (x) { return x.id === id; })[0]; }
function classeAl(id) { var a = alunnoDi(id); return a && a.classe ? a.classe : '3E'; }
function etich(a) { return !a ? '' : /^[1-4]$/.test(String(a.gruppo)) ? (a.classe || '3E') + ' · ' + a.gruppo : (a.classe || '3E'); }
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
    '<div><div class="muted disp" style="font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:13px">Istituto Barsanti - sede Salvetti</div>' +
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
/* attività su cui lavora il docente (3E-3F o un'attività parallela): ricordata per codice su questo dispositivo */
function chiaveAtt() { return 'glossario_att_' + (S.codice || ''); }
function entra(codice, riprova) {
  var b = $('bentra'); if (b) { b.disabled = true; b.textContent = 'Accesso…'; }
  S.codice = String(codice || '').trim().toUpperCase();
  S.att = memo(chiaveAtt()) || null;
  api('login').then(function (d) {
    if (d.utente.ruolo !== 'docente') { S.att = null; memo(chiaveAtt(), null); }
    if (d.utente.gestore) { S.att = d.att; memo(chiaveAtt(), d.att); } // collega titolare: sempre e solo la sua attività
    if (d.utente.ruolo === 'docente' && codaOrale().length) setTimeout(avviaInvioCoda, 500); // interrogazioni salvate senza rete
    S.d = d; S.sel = {}; memo(KEY_COD, S.codice);
    if (d.utente.ruolo === 'docente') S.filtro = { area: 'tutte', stato: 'inviata', lingua: EN() ? d.utente.lingua || 'it' : 'it', classe: (S.filtro && S.filtro.classe) || 'tutte' };
    render();
    // apertura con Dante e il motto: una volta al giorno per dispositivo (src/intro.js)
    if (!window.__noIntro && introDaMostrare()) mostraIntro();
  }).catch(function (e) {
    // l'attività ricordata non c'è più: si torna a quella principale
    if (S.att && !riprova && /non c'è più/.test(errMsg(e))) { memo(chiaveAtt(), null); S.att = null; return entra(codice, true); }
    memo(KEY_COD, null); S.codice = null; vistaLogin(errMsg(e));
  });
}
function cambiaAttivita(id) {
  var prec = S.att;
  S.att = id && id !== 'main' ? id : null;
  api('login').then(function (d) {
    memo(chiaveAtt(), S.att); S.d = d; S.sel = {}; S.or = null; S.poster = null; S.datePerClasse = null;
    S.filtro = { area: 'tutte', stato: 'inviata', lingua: 'it', classe: 'tutte' };
    vistaDocente(); window.scrollTo(0, 0); toast('Attività: ' + nomeAttivita());
  }).catch(function (e) { S.att = prec; toast(errMsg(e), true); vistaDocente(); });
}
function nomeAttivita() { var x = (S.d.spazi || []).filter(function (y) { return y.id === (S.d.att || 'main'); })[0]; return x ? x.nome : ''; }
function esci() { memo(KEY_COD, null); S.codice = null; S.att = null; S.d = null; S.poster = null; S.pag = null; ricordaPag(null); document.body.classList.remove('menu-on'); vistaLogin(); }
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
    '<div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px">' + esc(Poster.titolo()) + '</div>' +
    '<h1 style="margin:0;font-size:28px;line-height:1.15">Il compito non è ancora partito</h1>' +
    (S.d.inPreparazione ? '<p style="margin:0">L\'attività è in preparazione: il prof. Cerrato la aprirà a breve. Torna a controllare nei prossimi giorni.</p>' : p ? '<p style="margin:0">Si parte <b>' + esc(oraIt(p)) + '</b>. Da quel momento qui trovi i tuoi <b>' + TPA() + ' termini</b>.</p>' + cdHtml(p)
      : '<p style="margin:0">Il prof. Cerrato non ha ancora fissato la partenza. Torna a controllare nei prossimi giorni.</p>') +
    (S.d.inPreparazione ? '' : '<p class="muted" style="margin:0">Scadenza per rispondere a tutti i termini: ' + esc(oraIt(S.d.config.scadenzaIt)) + '.</p>') + '</section></main>';
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
  return '<section class="card stack"><h2 style="margin:0;font-size:22px">Scadenze</h2>' + (c.proroga ? '<p class="note info" style="margin:0">Il prof. Cerrato ti ha concesso una <b>proroga</b>: la tua scadenza è quella qui sotto.</p>' : '') + '<div class="grid2">' +
    (miei.length ? riga(EN() ? 'Italiano' : 'I tuoi termini', c.scadenzaIt, mancaIt, '✓ Tutti i termini hanno una risposta') +
    (EN() ? riga('Inglese', c.scadenzaEn, mancaEn, '✓ Tutti i termini hanno una risposta') : '') : '') +
    (ered.length ? riga(EN() ? 'Termini ricevuti · italiano' : 'Termini ricevuti', ered[0].scadIt, ered.filter(function (t) { return !t.statoIt; }).length, '✓ Tutti hanno una risposta') +
      (EN() ? riga('Termini ricevuti · inglese', ered[0].scadEn, ered.filter(function (t) { return !t.statoEn; }).length, '✓ Tutti hanno una risposta') : '') : '') +
    '</div><p class="note warn" style="margin:0">' + (miei.length ? 'Chi alla scadenza ha ancora <b>termini propri</b> senza risposta viene <b>escluso dal compito</b> e prende 4 nello scritto per mancata consegna. ' : '') +
    (ered.length ? 'Per i <b>termini ricevuti</b>, se non rispondi in tempo, il voto dello scritto scende a 6 (se era più alto).' : '') + '</p></section>';
}
function bloccoVoto() {
  var v = S.d.voto; if (!v) return '';
  var mini = function (lab, val, err, inv) {
    return '<div class="vl"><div class="muted disp" style="font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px">' + lab + '</div>' +
      '<div class="vl-n">' + fv(val) + '<small>/' + fv(v.votoMax || 8) + '</small></div><div class="muted" style="font-size:13px">' + (inv ? (inv === 1 ? '1 risposta' : inv + ' risposte') + ' · ' + (err === 1 ? '1 errata' : err + ' errate') : 'nessuna risposta') + '</div></div>';
  };
  return '<section class="card stack"><div class="voto-box">' +
    '<div class="vf"><div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px">' + (v.manuale ? 'Voto dello scritto assegnato dal docente' : 'Voto dello scritto (provvisorio)') + '</div>' +
    '<div class="voto-n">' + fv(v.voto) + '<small>/' + fv(v.votoMax || 8) + '</small></div>' +
    (v.voto == null ? '<div class="muted" style="font-size:14px">' + (EN() ? 'Compare quando hai risposto in italiano e in inglese' : 'Compare dalla prima risposta inviata') + '</div>' : EN() && v.media != null && !v.manuale && !v.tetto ? '<div class="muted" style="font-size:14px">Media di italiano e inglese' + (v.media !== v.voto ? ': ' + fv(Math.round(v.media * 1000) / 1000) + ', arrotondata' : '') + '</div>' : '') + '</div>' +
    (EN() ? '<div class="vls">' + mini('Italiano', v.votoIt, v.errIt, v.invIt) + mini('Inglese', v.votoEn, v.errEn, v.invEn) + '</div>'
      : '<div class="vls"><div class="vl"><div class="muted disp" style="font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px">Le tue risposte</div><div class="vl-n">' + (v.invIt || 0) + '</div><div class="muted" style="font-size:13px">' + (v.errIt === 1 ? '1 errata' : (v.errIt || 0) + ' errate') + '</div></div></div>') + '</div>' +
    (v.tetto && !v.manuale ? '<div class="note warn"><b>Voto dello scritto limitato a ' + v.tettoValore + '</b>: non hai risposto in tempo ai termini ricevuti' + (v.calcolato != null && v.calcolato > v.tettoValore ? ' (il calcolo darebbe ' + fv(v.calcolato) + ')' : '') + '.</div>' : '') +
    (v.orale ? '<div class="note" id="notaOrale"><b>Interrogazione orale: ' + fv(v.orale.voto) + '</b> (' + fv(v.orale.punti) + ' punti su ' + RG().orale.domande + ')' + (v.finale != null ? ' · <b>Voto finale (' + mediaTxt() + '): ' + fv(v.finale) + '</b>' : '') + '</div>' : '') +
    '<p class="muted" style="margin:0;font-size:14px">' + esc(v.ratio) + '</p>' +
    notaQuizAlunno(v.quiz) + '</section>';
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
    '<p class="muted" style="margin:0;font-size:15px">Sul cartellone vanno solo le definizioni approvate' + (EN() ? ' dai docenti' : ' dal docente') + '.' +
    (S.d.utente.ruolo === 'alunno' ? ' <b style="background:#FFE98A;color:var(--ink);padding:0 4px;border-radius:3px">In giallo i tuoi termini.</b>' + (CLASSI().length > 1 ? ' Ogni cartellone è di ' + esc(elencoClassi()) + ' insieme, con i termini in ordine alfabetico.' : '') : '') + '</p>' +
    '<div class="poster-box" id="pbox"><div class="poster-scale" id="pscale"></div></div>' +
    (S.d.utente.ruolo === 'docente' && PUO('documenti') ? bloccoStampaPoster() : '') +
    '</section>';
}
/* lingua dei cartelloni, traduzioni e stampa (docenti con la facoltà «documenti») */
/* termini che sul cartellone uscirebbero senza testo: quelli senza definizione approvata, per area */
function definizioniMancanti(aree) {
  var per = (aree || S.d.aree).map(function (a) {
    var ts = S.d.termini.filter(function (t) { return t.area == a.n; });
    return { n: a.n, it: a.it, tot: ts.length, manca: ts.filter(function (t) { return t.statoIt !== 'approvata' || !t.defIt; }).length };
  });
  return { per: per, manca: per.reduce(function (x, y) { return x + y.manca; }, 0), tot: per.reduce(function (x, y) { return x + y.tot; }, 0) };
}
function avvisoMancanti(aree) {
  var m = definizioniMancanti(aree);
  if (!m.manca) return '<div class="note ok" id="avvMancanti"><b>Tutte le ' + m.tot + ' definizioni sono approvate:</b> i cartelloni sono completi.</div>';
  return '<div class="note warn" id="avvMancanti"><b>' + (m.manca === 1 ? 'Manca 1 definizione approvata' : 'Mancano ' + m.manca + ' definizioni approvate') + ' su ' + m.tot + '.</b> ' +
    'Sul cartellone questi termini escono con la sola scritta «Definizione a cura di…». ' + m.per.filter(function (x) { return x.manca; }).map(function (x) { return 'Area ' + x.n + ': ' + x.manca; }).join(' · ') + '.</div>';
}
/* app dell'alunno: a che punto è con il quiz (compare solo quando il docente lo ha aperto) */
/* giorno e ora dell'interrogazione, per esteso: «giovedì 26 novembre, 2ª ora» */
function giornoOrale(p) { var x = p.data.split('-'), g = new Date(+x[0], +x[1] - 1, +x[2]).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); return g + (p.ora ? ', ' + p.ora + 'ª ora' : ''); }
function notaQuizAlunno(q) {
  if (q && q.stato === 'chiuso' && q.partenza && q.scadenza) return '<div class="note" id="notaQuiz"><b>Seconda parte della prova: il quiz.</b> Si apre il <b>' + esc(oraIt(q.partenza)) + '</b> e si chiude il ' + esc(oraIt(q.scadenza)) + '. Dovrai indovinare ' + q.soglia + ' termini per essere ammesso all\'interrogazione.</div>';
  if (!q || q.stato === 'chiuso') return '';
  var link = '<a href="/quiz" target="_blank" rel="noopener">Apri il quiz</a>';
  if (q.stato === 'superato') return q.piano ? '<div class="note ok" id="notaQuiz"><b>La tua interrogazione è fissata per ' + esc(giornoOrale(q.piano)) + '.</b> Hai superato il quiz e sei ammesso all\'interrogazione orale, la verifica finale. ' +
      'Preparati ripassando i termini e le definizioni del glossario sulla pagina pubblica: <a href="' + esc(urlPubblico('msg')) + '" target="_blank" rel="noopener" onclick="window.open(urlPubblico(\'msg\'));return false"><b>apri la pagina pubblica del glossario</b></a> (puoi anche usare «Mettiti alla prova»).</div>'
    : '<div class="note ok" id="notaQuiz"><b>Quiz superato:</b> sei ammesso all\'interrogazione orale. Il docente fisserà la data: la troverai qui.</div>';
  if (q.stato === 'scaduto') return '<div class="note warn" id="notaQuiz"><b>Quiz non completato entro la scadenza</b> (' + q.indovinati + ' termini su ' + q.soglia + '): non sei ammesso all\'interrogazione.</div>';
  return '<div class="note" id="notaQuiz"><b>Seconda parte della prova: il quiz.</b> Devi indovinare ' + q.soglia + ' termini entro ' + esc(oraIt(q.scadenza)) + ' per essere ammesso all\'interrogazione. Sei a <b>' + q.indovinati + ' su ' + q.soglia + '</b>. ' + link + '</div>';
}
function bloccoStampaPoster() {
  var L = S.posterLingua || 'it';
  var mancano = S.d.termini.filter(function (t) { return t.statoIt === 'approvata' && (!t.posterEn || !t.posterEn.t || !t.posterEn.d); }).length;
  return '<div class="stack" style="gap:10px;border-top:1px solid var(--line);padding-top:12px">' +
    '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Lingua dei cartelloni</legend>' +
    [['it', 'Italiano'], ['iten', 'Italiano e inglese: sotto ogni termine e definizione approvata, la versione in inglese tecnico']].map(function (o) {
      return '<label class="op' + (L === o[0] ? ' on' : '') + '"><input type="radio" name="plin" value="' + o[0] + '"' + (L === o[0] ? ' checked' : '') + ' onchange="S.posterLingua=this.value;segna(this);disegnaPoster(S.poster)"><span>' + o[1] + '</span></label>';
    }).join('') + '</fieldset>' +
    (RO() ? '' : '<div class="row"><button class="btn sec" onclick="apriTraduzioni()">Aggiungi termini e definizioni in inglese</button>' +
      '<span class="muted" style="font-size:14px">' + (mancano ? '<b style="color:#9A4A00">' + mancano + (mancano === 1 ? ' termine approvato è' : ' termini approvati sono') + ' ancora senza inglese</b>: sul cartellone bilingue resterebbero solo in italiano.' : 'Tutti i termini approvati hanno la versione inglese: puoi controllarla e correggerla.') + '</span></div>') +
    '<b>Stampa cartelloni in PDF (70×100)</b>' + avvisoMancanti() +
    '<div class="row"><button class="btn" onclick="stampaCartelloni(\'tutti\', $(\'pabb\').checked, \'it\')">' + (S.d.aree.length === 1 ? 'Il cartellone' : 'I ' + S.d.aree.length + ' cartelloni') + ' in italiano</button>' +
    '<button class="btn" onclick="stampaCartelloni(\'tutti\', $(\'pabb\').checked, \'iten\')">' + (S.d.aree.length === 1 ? 'Il cartellone' : 'I ' + S.d.aree.length + ' cartelloni') + ' in italiano e inglese</button>' +
    '<button class="btn sec" onclick="stampaCartelloni(S.poster, $(\'pabb\').checked, S.posterLingua || \'it\')">Solo questo cartellone</button></div>' +
    '<label class="row" style="gap:8px;font-weight:400;cursor:pointer"><input type="checkbox" id="pabb" style="width:20px;height:20px"> Con abbondanza di 3 mm per la tipografia (706×1006 mm)</label>' +
    '<span class="muted" style="font-size:14px">Il testo si adatta da solo a quanti termini, definizioni e lingue ci sono. Generati con i dati di ' + (RO() ? 'questa edizione archiviata' : 'questa edizione') + '. Si aprono nella stampa: scegli «Salva come PDF» e, nelle opzioni, attiva «Grafica di sfondo».</span></div>';
}
function disegnaPoster(n) {
  S.poster = n; var box = $('pbox'), sc = $('pscale'); if (!box) return;
  var ts = S.d.termini.filter(function (t) { return t.area == n; });
  // versione alfabetica (definitiva dal 12/11/2026)
  sc.innerHTML = Poster.alfa(area(n), ts, S.d.alunni, { nAree: S.d.aree.length, areeMie: !!S.d.areeMie, soloApprovate: true, evidenzia: S.d.utente.ruolo === 'alunno' ? S.d.utente.id : null, qr: S.d.utente.ruolo === 'alunno' ? null : urlCartellone(), as: (S.d.config.edizione || {}).as, en: S.d.utente.ruolo === 'docente' && S.posterLingua === 'iten' });
  var scala = function () { var f = sc.firstChild, k = (box.clientWidth - 24) / f.offsetWidth; sc.style.transform = 'scale(' + k + ')'; box.style.height = (f.offsetHeight * k + 24) + 'px'; };
  Poster.adatta(sc); scala();
  // si riadatta quando i caratteri veri sono caricati: misurare con quelli di riserva fa uscire le voci dalle colonne
  caratteriPronti().then(function () { if ($('pscale') === sc) { Poster.adatta(sc); scala(); } });
}
window.addEventListener('resize', function () { if (S.poster && $('pbox')) disegnaPoster(S.poster); });

/* ---------- alunno ---------- */
/* attività offerta a un collega: dati per cartelloni, report e piè di pagina */
Poster.conc = function () { return S.d && S.d.config && S.d.config.concessione || null; };
function rigaConcessione() { var c = Poster.conc(); return c ? '<p class="conc">Per gentile concessione del Prof. Danilo Cerrato</p>' : ''; }
function docenteAtt() { var c = Poster.conc(); return c ? c.docente + (c.materia ? ' · ' + c.materia : '') : 'Prof. Danilo Cerrato · Laboratorio odontotecnico'; }
function nomeProprio(n) { var p = String(n || '').trim().split(/\s+/); return p.length > 1 ? p[p.length - 1] : p[0] || ''; }
function schermataAmmesso(h, qv) {
  var v = S.d.voto, nome = esc(nomeProprio(S.d.utente.nome)), card;
  var tit = function (col, t) { return '<div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px;color:' + col + '">' + t + '</div>'; };
  var big = function (t) { return '<div style="font:900 34px/1.05 Archivo,system-ui,sans-serif;color:#15212B">' + t + '</div>'; };
  var par = function (t) { return '<p style="margin:0;font-size:17px;line-height:1.5">' + t + '</p>'; };
  if (v.orale) {
    card = '<section class="card stack" id="schermataAmmesso" data-tappa="svolta" style="border-top:8px solid #15212B;gap:14px">' + tit('#15212B', 'Interrogazione svolta') + big('Grazie, ' + nome + '!') +
      par('Hai concluso il percorso del glossario.') + par('Il voto lo trovi sul <b>registro Argo</b>.') + '</section>';
  } else if (qv.piano) {
    var g = giornoOrale({ data: qv.piano.data }), gg = g.charAt(0).toUpperCase() + g.slice(1), sp = gg.indexOf(' ');
    card = '<section class="card stack" id="schermataAmmesso" data-tappa="data" style="border-top:8px solid #B4511A;gap:14px">' + tit('#B4511A', 'La tua interrogazione') +
      '<div>' + big(esc(gg.slice(0, sp)) + '<br>' + esc(gg.slice(sp + 1))) + (qv.piano.ora ? '<div style="font:700 20px/1.3 Archivo,system-ui,sans-serif;color:#B4511A;margin-top:6px">' + qv.piano.ora + 'ª ora</div>' : '') + '</div>' +
      par('Ciao <b>' + nome + '</b>, hai superato il quiz! Ora preparati all\'interrogazione, la verifica finale.') +
      par('Esercitati sulla <b>pagina pubblica del glossario</b>: ripassa termini e definizioni e mettiti alla prova con i quiz.') +
      '<a class="btn" id="esercitati" href="' + esc(urlPubblico('msg')) + '" target="_blank" rel="noopener" onclick="window.open(urlPubblico(\'msg\'));return false" style="justify-content:center;min-height:56px;font-size:19px;text-decoration:none">Esercitati ora →</a>' +
      '<p class="muted" style="margin:0;font-size:14px">In bocca al lupo!</p></section>';
  } else {
    card = '<section class="card stack" id="schermataAmmesso" data-tappa="superato" style="border-top:8px solid #2E7D32;gap:14px">' + tit('#2E7D32', 'Quiz superato') + big('Complimenti,<br>' + nome + '!') +
      par('Hai superato il quiz: ora ti aspetta l\'interrogazione, la verifica finale.') +
      par('Il docente a breve fisserà la data dell\'interrogazione: la troverai qui, appena entri nell\'app.') + '</section>';
  }
  $('app').innerHTML = h + card + rigaConcessione() + '</main>';
}
function vistaAlunno() {
  var u = S.d.utente, a = area(u.gruppo);
  var miei = S.d.termini.filter(function (t) { return t.alunno === u.id; });
  var pn = a ? u.gruppo : (miei[0] ? miei[0].area : 1);
  // 3F: termini di tutte le aree
  if (!a) a = { n: '', it: 'Termini di tutte ' + (S.d.aree.length > 1 ? 'e ' + (['', '', 'due', 'tre', 'quattro', 'cinque', 'sei'][S.d.aree.length] || S.d.aree.length) + ' ' : '') + 'le aree', en: '', colore: '#15212B', tutte: true };
  var n = function (l) { return miei.filter(function (t) { return T(t, l, 'stato') === 'approvata'; }).length; };
  var h = testata(u.nome + ' · ' + (a.tutte ? 'Classe ' + u.classe : 'Classe ' + (u.classe || '3E') + ' · Gruppo ' + u.gruppo)) + '<main class="wrap stack">';
  // quiz superato: da qui lo studente vede solo la sua tappa (complimenti → data dell'interrogazione → esito), mai più i dati precedenti
  var qv = S.d.voto && S.d.voto.quiz;
  if (qv && qv.stato === 'superato') return schermataAmmesso(h, qv);
  h += '<section class="card" style="border-top:8px solid ' + a.colore + '"><div class="muted disp" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:13px">' + (a.tutte ? 'Classe ' + esc(u.classe) : 'Area ' + a.n) + '</div>' +
    '<h1 style="margin:2px 0 0;font-size:30px;line-height:1.1">' + esc(a.it) + '</h1>' + (EN() ? '<div class="term-en" style="color:' + a.colore + '">' + esc(a.en) + '</div>' : '') +
    '<p style="margin:12px 0 0">Ciao <b>' + esc(u.nome) + '</b>. Per ognuno dei tuoi <b>' + miei.length + ' termini</b> scegli la definizione giusta tra 8 alternative' + (EN() ? '. Prima in italiano: quando il prof. Cerrato la approva, si sblocca la scelta in inglese, rivista dalla prof.ssa Aliboni.' : ': il prof. Cerrato le controlla e le approva.') + '</p>' +
    '<div class="row" style="margin-top:12px"><span class="chip s-approvata">' + (EN() ? 'Italiano ' : 'Approvate ') + n('it') + '/' + miei.length + '</span>' + (EN() ? '<span class="chip s-approvata">Inglese ' + n('en') + '/' + miei.length + '</span>' : '') + '</div></section>';
  var ered = miei.filter(function (t) { return t.ereditato; });
  if (ered.length) {
    var da = ered.map(function (t) { return nomeAlunno(t.alunnoOrig); }).filter(function (x, i, arr) { return arr.indexOf(x) === i; });
    h += '<section class="card note-ered" role="status"><b>Hai ricevuto ' + ered.length + ' termini in più</b> da ' + esc(da.join(', ')) + '. ' +
      'Il tuo <b>voto massimo sale a ' + fv(S.d.voto ? S.d.voto.votoMax : 9.5) + '</b> e il tuo nome andrà sul cartellone al suo posto. Per questi termini hai tempo fino a <b>' + esc(oraIt(ered[0].scadIt)) + '</b>' + (EN() ? ' per l\'italiano e <b>' + esc(oraIt(ered[0].scadEn)) + '</b> per l\'inglese' : '') + '. Se non rispondi in tempo a questi termini non vieni escluso, ma il tuo voto dello scritto non potrà superare 6.</section>';
  }
  if (S.d.config.chiusa) h += '<div class="note warn"><b>L\'app è chiusa.</b> Le scelte non sono più modificabili.</div>';
  h += bloccoVoto() + bloccoScadenze(miei) + bloccoTappe();
  h += miei.map(cardAlunno).join('');
  h += bloccoPoster(pn) + rigaConcessione() + '</main>';
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
function cardDocente(t, l) {
  var a = area(t.area), st = T(t, l, 'stato'), scelta = T(t, l, 'scelta'), ok = T(t, l, 'ok'), comm = T(t, l, 'comm');
  var h = '<article class="card" data-tid="' + esc(t.id) + '" style="border-top:6px solid ' + a.colore + '"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="term-it">' + esc(t.it) + '</div>' + (EN() && t.en ? '<div class="term-en" lang="en" style="color:' + a.colore + '">' + esc(t.en) + '</div>' : '') + '</div>' +
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
    if (RO() || !PUO('revisione')) {
      h += st === 'approvata' ? '<p class="muted" style="margin:8px 0 0;font-size:14px">Approvata da ' + esc(T(t, l, 'da')) + '</p>' : '';
    } else if (st === 'inviata') {
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
/* anello in cima: quante risposte sono state date sul totale dei termini */
function bloccoAnello() {
  var ts = S.d.termini.filter(function (t) { return inClasse(t.alunno); }), n = ts.length || 1;
  var app = ts.filter(function (t) { return t.statoIt === 'approvata'; }).length,
    att = ts.filter(function (t) { return t.statoIt === 'inviata'; }).length,
    rim = ts.filter(function (t) { return t.statoIt === 'correggere'; }).length,
    mai = ts.length - app - att - rim, date = app + att;
  var seg = [['Approvate', app, '#2E7D32'], ['Date, in attesa di approvazione', att, '#1F5FA8'], ['Rimandate', rim, '#C77700'], ['Mai date', mai, '#C3CED7']];
  var R = 70, C = 2 * Math.PI * R, off = 0, gap = 2;
  var archi = seg.map(function (sg) {
    var l = C * sg[1] / n; if (!sg[1]) return '';
    var d = '<circle cx="90" cy="90" r="' + R + '" fill="none" stroke="' + sg[2] + '" stroke-width="26" stroke-dasharray="' + Math.max(l - gap, 1) + ' ' + C + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 90 90)"><title>' + sg[0] + ': ' + sg[1] + '</title></circle>';
    off += l; return d;
  }).join('');
  var cl = S.filtro && S.filtro.classe && S.filtro.classe !== 'tutte' ? 'della ' + S.filtro.classe : CLASSI().length > 1 ? 'di ' + elencoClassi() : '';
  return '<section class="card" style="display:flex;gap:28px;align-items:center;flex-wrap:wrap">' +
    '<svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Risposte date: ' + date + ' su ' + ts.length + '"><circle cx="90" cy="90" r="' + R + '" fill="none" stroke="#EEF2F5" stroke-width="26"/>' + archi +
    '<text x="90" y="86" text-anchor="middle" font-size="30" font-weight="800" fill="#15212B" style="font-family:inherit">' + date + '</text>' +
    '<text x="90" y="108" text-anchor="middle" font-size="13" fill="#5B6976" style="font-family:inherit">su ' + ts.length + ' · ' + Math.round(date / n * 100) + '%</text></svg>' +
    '<div class="stack" style="gap:8px;flex:1;min-width:240px"><h2 style="margin:0;font-size:22px">Risposte date: ' + date + ' su ' + ts.length + '</h2>' +
    '<p class="muted" style="margin:0;font-size:15px">Termini ' + cl + ' con una risposta valida (approvata o in attesa della tua approvazione). Le rimandate contano tra quelle da dare.</p>' +
    seg.map(function (sg) { return '<div class="row" style="gap:10px;font-size:15px"><i style="width:14px;height:14px;border-radius:3px;background:' + sg[2] + ';display:inline-block"></i><span style="flex:1">' + sg[0] + '</span><b>' + sg[1] + '</b></div>'; }).join('') +
    '</div></section>';
}
/* situazione di un singolo studente: approvate e rimanenti, con l'elenco dei termini */
function bloccoSituazione() {
  S.sit = S.sit || { classe: CLASSI()[0], id: '' };
  if (S.filtro && S.filtro.classe && S.filtro.classe !== 'tutte' && S.sit.classe !== S.filtro.classe) { S.sit.classe = S.filtro.classe; S.sit.id = ''; }
  var cl = CLASSI().map(function (c) { return '<option value="' + c + '"' + (S.sit.classe === c ? ' selected' : '') + '>' + c + '</option>'; }).join('');
  return '<section class="card stack"><h2 style="margin:0;font-size:22px">Situazione dello studente</h2>' +
    '<div class="grid2"><div><label for="sitc">Classe</label><select id="sitc" onchange="S.sit.classe=this.value;S.sit.id=\'\';selSituazione();disegnaSituazione()">' + cl + '</select></div>' +
    '<div><label for="sits">Studente</label><select id="sits" onchange="S.sit.id=this.value;disegnaSituazione()"></select></div></div>' +
    '<div id="sitbox"></div></section>';
}
function selSituazione() {
  var al = S.d.alunni.filter(function (a) { return (a.classe || '3E') === S.sit.classe; }).sort(function (a, b) { return a.nome.localeCompare(b.nome, 'it'); });
  if (!S.sit.id || !al.some(function (a) { return a.id === S.sit.id; })) S.sit.id = al[0] ? al[0].id : '';
  var el = $('sits'); if (!el) return;
  el.innerHTML = al.map(function (a) { return '<option value="' + a.id + '"' + (a.id === S.sit.id ? ' selected' : '') + '>' + esc(a.nome) + '</option>'; }).join('');
}
function disegnaSituazione() {
  var box = $('sitbox'); if (!box) return;
  var id = S.sit.id, ts = S.d.termini.filter(function (t) { return t.alunno === id; });
  var pan = (S.d.panoramica || []).filter(function (r) { return r.id === id; })[0] || {};
  if (!ts.length) { box.innerHTML = '<p class="muted" style="margin:0">' + (pan.escluso ? 'Studente escluso: i suoi termini sono passati a ' + esc(nomeAlunno(pan.riassegnatoA)) + '.' : 'Nessun termine assegnato.') + '</p>'; return; }
  var app = ts.filter(function (t) { return t.statoIt === 'approvata'; }),
    att = ts.filter(function (t) { return t.statoIt === 'inviata'; }),
    rim = ts.filter(function (t) { return t.statoIt === 'correggere'; }),
    mai = ts.filter(function (t) { return !t.statoIt; });
  var barre = [['Approvate', app.length, '#2E7D32'], ['Da dare', rim.length + mai.length, '#C77700']];
  if (att.length) barre.splice(1, 0, ['Inviate, in attesa della tua approvazione', att.length, '#1F5FA8']);
  var max = ts.length;
  var graf = '<div class="stack" style="gap:10px">' + barre.map(function (b) {
    return '<div><div class="row" style="justify-content:space-between;font-size:15px"><span>' + b[0] + (b[0] === 'Da dare' ? ' <span class="muted">(rimandate ' + rim.length + ' + mai date ' + mai.length + ')</span>' : '') + '</span><b>' + b[1] + ' su ' + max + '</b></div>' +
      '<div style="height:26px;background:#EEF2F5;border-radius:6px;margin-top:4px;overflow:hidden"><div style="height:100%;width:' + (b[1] / max * 100) + '%;min-width:' + (b[1] ? 6 : 0) + 'px;background:' + b[2] + ';border-radius:6px"></div></div></div>';
  }).join('') + '</div>';
  var voce = function (t, nota) { var z = area(t.area) || {}; return '<li style="margin:4px 0"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + esc(z.colore || '#15212B') + ';margin-right:8px"></i><b>' + esc(t.it) + '</b>' + (nota ? ' <span class="muted" style="font-size:14px">· ' + nota + '</span>' : '') + (t.ereditato ? ' <span class="muted" style="font-size:14px">· ricevuto da ' + esc(nomeAlunno(t.alunnoOrig)) + '</span>' : '') + '</li>'; };
  var date = app.map(function (t) { return voce(t, 'approvata'); }).concat(att.map(function (t) { return voce(t, 'in attesa di approvazione'); }));
  var dare = rim.map(function (t) { return voce(t, 'rimandata'); }).concat(mai.map(function (t) { return voce(t, 'mai data'); }));
  box.innerHTML = graf + '<div class="grid2" style="margin-top:6px">' +
    '<div><h3 style="margin:0 0 6px;font-size:17px;color:#2E7D32">Ha dato (' + date.length + ')</h3>' + (date.length ? '<ul style="list-style:none;padding:0;margin:0">' + date.join('') + '</ul>' : '<p class="muted" style="margin:0">Nessuna risposta ancora.</p>') + '</div>' +
    '<div><h3 style="margin:0 0 6px;font-size:17px;color:#9A4A00">Deve ancora dare (' + dare.length + ')</h3>' + (dare.length ? '<ul style="list-style:none;padding:0;margin:0">' + dare.join('') + '</ul>' : '<p class="muted" style="margin:0">Niente: ha risposto a tutti i termini.</p>') + '</div></div>';
}
function panoramica() {
  var P = S.d.panoramica || [], tot = { inviate: 0, corrette: 0, errate: 0, daApprovare: 0, approvate: 0 };
  var righe = P.filter(function (r) { return inClasse(r.id); }).map(function (r) {
    Object.keys(tot).forEach(function (k) { tot[k] += r[k]; });
    return '<tr' + (r.escluso ? ' class="riga-esclusa"' : '') + '><td>' + linkScheda(r) + (r.escluso ? ' <span class="chip s-correggere" title="' + esc(r.motivo) + '">Escluso</span>' + ((r.riassegnatiA || []).length ? ' <span class="muted" style="font-size:13px">termini → ' + esc(r.riassegnatiA.map(nomeAlunno).join(', ')) + '</span>' : '') : '') + (r.ereditati ? ' <span class="chip s-inviata">+' + r.ereditati + ' ricevuti</span>' : '') + (r.proroga ? ' <span class="chip s-vuota" title="Proroga fino a ' + esc(oraIt(r.proroga)) + '">proroga</span>' : '') + '</td><td class="n">' + esc(etich(r)) + '</td>' +
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
function bloccoAdmin(quale) {
  var A = S.d.admin, imp = A.impostazioni;
  var errFino4 = function (p) { return Math.ceil((imp.votoMax - imp.votoMin) / p - 1e-9); };
  var multi = CLASSI().length > 1 && (S.datePerClasse != null ? S.datePerClasse : Object.keys(imp.calendario || {}).length > 0);
  var statoPart = function (p) { return p ? (Date.parse(p) <= Date.now() ? '<b style="color:var(--ok)">Partito</b> ' + esc(oraIt(p)) : 'Conto alla rovescia fino a ' + esc(oraIt(p))) : '<b>Partenza non fissata:</b> gli alunni entrano ma non vedono ancora i termini.'; };
  var date = multi ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Classe</th><th>Partenza</th><th>Scadenza per tutti i termini</th><th></th></tr></thead><tbody>' + CLASSI().map(function (c) {
      var d = datePerClasse(c);
      return '<tr><td><b>' + esc(c) + '</b></td><td><label for="pa_' + c + '" class="sr">Partenza ' + esc(c) + '</label><input id="pa_' + c + '" type="datetime-local" value="' + (d.partenza ? isoLocale(d.partenza) : '') + '"></td>' +
        '<td><label for="sc_' + c + '" class="sr">Scadenza ' + esc(c) + '</label><input id="sc_' + c + '" type="datetime-local" value="' + isoLocale(d.scadenzaIt) + '"></td><td class="muted" style="font-size:13px">' + statoPart(d.partenza) + '</td></tr>';
    }).join('') + '</tbody></table></div>'
    : '<div class="grid2"><div><label for="pa">Partenza (uguale per ' + (CLASSI().length > 1 ? elencoClassi() : 'la classe') + ')</label><input id="pa" type="datetime-local" value="' + (imp.partenza ? isoLocale(imp.partenza) : '') + '"></div>' +
    '<div class="muted" style="align-self:end;font-size:14px">' + statoPart(imp.partenza) + '</div></div>';
  var h = RO() || !LOC() ? '' : '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Partenza, scadenza e valutazione</h2><span class="chip s-vuota">Solo prof. Cerrato · app ' + VERSIONE + '</span></div>' +
    (CLASSI().length > 1 ? '<label class="row" style="gap:10px;font-weight:400;cursor:pointer"><input type="checkbox" id="dpc"' + (multi ? ' checked' : '') + ' onchange="S.datePerClasse=this.checked;vistaDocente();var x=$(\'dpc\');if(x)x.scrollIntoView({block:\'center\'})" style="width:22px;height:22px"> Partenza e scadenza diverse per ogni classe</label>' : '') +
    date +
    '<div class="grid2">' + (multi ? '' : '<div><label for="scIt">' + (EN() ? 'Scadenza italiano' : 'Scadenza per tutti i termini') + '</label><input id="scIt" type="datetime-local" value="' + isoLocale(imp.scadenzaIt) + '"></div>') +
    (EN() ? '<div><label for="scEn">Scadenza inglese</label><input id="scEn" type="datetime-local" value="' + isoLocale(imp.scadenzaEn) + '"></div></div>' : '<div><label for="gIt">Termini ricevuti da un escluso: giorni per rispondere</label><input id="gIt" type="text" inputmode="numeric" value="' + imp.giorniIt + '"></div></div>') +
    (EN() ? '<div class="grid2"><div><label for="gIt">Termini ricevuti da un escluso: giorni per l\'italiano</label><input id="gIt" type="text" inputmode="numeric" value="' + imp.giorniIt + '"></div>' +
    '<div><label for="gEn">Termini ricevuti da un escluso: giorni per l\'inglese</label><input id="gEn" type="text" inputmode="numeric" value="' + imp.giorniEn + '"></div></div>' : '') +
    // attività con regole proprie: la penalità è fissata alla creazione (scritto, quiz, interrogazione, voto finale)
    (RG().scritto.penalita != null ? '<div class="note" style="margin:0"><b>Regole di questa attività</b>: scritto da ' + fv(imp.votoMax) + ', −' + fv(RG().scritto.penalita) + ' per errore, minimo ' + fv(imp.votoMin) + ', mancata consegna ' + fv(RG().scritto.votoEsclusione) + '. Quiz: ' + RG().quiz.secondi + ' secondi, ' + RG().quiz.opzioni + ' definizioni, −' + RG().quiz.passo + ' termini a ogni errore. ' + regolaOrale() + ' su ' + RG().orale.domande + ' termini (massimo ' + fv(RG().orale.max) + '). Voto finale: ' + mediaTxt() + '. Sono fissate alla creazione dell\'attività; i secondi del quiz si cambiano nel riquadro del quiz.</div>' : '' +
    '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Penalità per ogni risposta errata</legend>' +
    [['A', '−0,25 per errore: ' + errFino4(0.25) + ' errori per scendere da ' + fv(imp.votoMax) + ' a ' + imp.votoMin], ['B', '−0,50 per errore: ' + errFino4(0.5) + ' errori per scendere da ' + fv(imp.votoMax) + ' a ' + imp.votoMin]].map(function (o) {
      return '<label class="op' + (imp.proposta === o[0] ? ' on' : '') + '" for="pr' + o[0] + '"><input type="radio" name="prop" id="pr' + o[0] + '" value="' + o[0] + '"' + (imp.proposta === o[0] ? ' checked' : '') + ' onchange="segna(this)"><span class="lt">' + o[0] + '</span><span>Proposta ' + o[0] + ': ' + o[1] + '</span></label>';
    }).join('') + '</fieldset>') +
    '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Termini degli alunni esclusi</legend>' +
    [['auto', 'Passano in automatico, a sorte, a un compagno della stessa classe (uno solo a testa)'], ['manuale', 'Decido io: restano fermi finché non li passo a chi scelgo (pagina «Proroghe e passaggi»)']].map(function (o) {
      return '<label class="op' + (imp.riassegnazione === o[0] ? ' on' : '') + '" for="ri' + o[0] + '"><input type="radio" name="riass" id="ri' + o[0] + '" value="' + o[0] + '"' + (imp.riassegnazione === o[0] ? ' checked' : '') + ' onchange="segna(this)"><span>' + o[1] + '</span></label>';
    }).join('') + '</fieldset>' +
    '<div class="row"><button class="btn" onclick="salvaImpostazioni(this)">Salva partenza, scadenza e penalità</button></div>' +
    '<div class="stack" style="gap:8px;border-top:1px solid var(--line);padding-top:14px"><b>Presentazione per gli studenti</b>' +
    '<div class="row">' + CLASSI().map(function (c) { return '<button class="btn sec" onclick="presentazione(this, \'presentazionestudenti\', { classe: \'' + c + '\' })">Presentazione ' + c + ' (.pptx)</button>'; }).join('') + '</div>' +
    '<span class="muted" style="font-size:14px">Slide per la classe, con partenza, scadenza, voto massimo e penalità presi da qui. Salva prima le modifiche, poi scaricala.</span></div>' +
    '<p class="muted" style="margin:0;font-size:14px">' + esc(A.ratio) + '</p></section>';
  if (quale === 'imp') return h;
  h = '';
  var nomi = {}; (S.d.panoramica || []).forEach(function (r) { nomi[r.id] = r; });
  var row = function (v) {
    var r = nomi[v.id];
    return '<tr><td>' + esc(r.nome) + (v.ereditati ? ' <span class="chip s-inviata">max ' + fv(v.votoMax) + '</span>' : '') + (v.tetto ? ' <span class="chip s-correggere" title="' + esc(v.motivoTetto || '') + '">tetto 6</span>' : '') + '</td><td class="n">' + esc(etich(r)) + '</td>' +
      (EN() ? '<td class="n">' + fv(v.votoIt) + (v.votoIt != null ? '<br><span class="muted" style="font-weight:400;font-size:13px">' + v.errIt + ' err.</span>' : '') + '</td>' +
      '<td class="n">' + fv(v.votoEn) + (v.votoEn != null ? '<br><span class="muted" style="font-weight:400;font-size:13px">' + v.errEn + ' err.</span>' : '') + '</td>' +
      '<td class="n" style="font-weight:400">' + (v.media != null ? fv(Math.round(v.media * 1000) / 1000) : '—') + '</td>' : '<td class="n" style="font-weight:400">' + (v.errIt || 0) + '</td>') + '<td class="n">' + fv(v.calcolato) + '</td>' +
      (!PUO('voti') || RO() ? '<td class="n">' + (v.manuale != null ? fv(v.manuale) : '—') + '</td>' : '<td><div class="row" style="gap:6px;flex-wrap:nowrap"><label for="vm_' + v.id + '" class="sr">Voto manuale ' + esc(r.nome) + '</label><input id="vm_' + v.id + '" type="text" inputmode="decimal" style="width:80px;padding:6px 8px" value="' + (v.manuale != null ? String(v.manuale).replace('.', ',') : '') + '" placeholder="—">' +
      '<button class="btn sec" style="min-height:38px;padding:0 10px" onclick="salvaVoto(\'' + v.id + '\',this)">Salva</button></div></td>') +
      '<td class="n"><b style="font-size:18px">' + fv(v.voto) + '</b></td><td class="n">' + (v.orale ? fv(v.orale.voto) : '—') + '</td><td class="n"><b style="font-size:18px">' + fv(v.finale) + '</b></td></tr>';
  };
  var votiC = A.voti.filter(function (v) { return inClasse(v.id); });
  var attivi = votiC.filter(function (v) { return !v.escluso; }), esclusi = votiC.filter(function (v) { return v.escluso || v.riammesso; });
  h += '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Tabellone dei voti</h2>' + (ADM() ? '<span class="chip s-vuota">Solo prof. Cerrato</span>' : '') + '</div>' +
    (CLASSI().length > 1 ? '<div class="grid4">' + selClasse('fct', 'vistaDocente()') + '</div>' : '') +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th>' + (EN() ? '<th style="text-align:right">Voto IT</th><th style="text-align:right">Voto EN</th><th style="text-align:right">Media</th>' : '<th style="text-align:right">Errori</th>') + '<th style="text-align:right">' + (EN() ? 'Finale calcolato' : 'Voto calcolato') + '</th><th>Voto manuale</th><th style="text-align:right">Scritto</th><th style="text-align:right">Orale</th><th style="text-align:right">Finale</th></tr></thead><tbody>' +
    attivi.map(row).join('') + '</tbody></table></div><p class="muted" style="margin:0;font-size:14px">Il voto manuale sostituisce quello calcolato e lo vede anche l\'alunno. Lascia vuoto e salva per tornare al calcolo. Il <b>finale</b> è la ' + mediaTxt() + ' (pagina «Interrogazioni orali»): oltre il mezzo voto sale all\'intero, sotto scende.</p>';
  if (esclusi.length) {
    h += '<h3 style="margin:8px 0 0">Esclusi per mancato rispetto della scadenza</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th>Motivo</th><th style="text-align:right">Scritto</th><th style="text-align:right">Orale</th><th style="text-align:right">Finale</th><th></th></tr></thead><tbody>' +
      esclusi.map(function (v) { var r = nomi[v.id]; return '<tr><td>' + esc(r.nome) + (v.riammesso ? ' <span class="chip s-approvata">Riammesso</span>' : '') + '</td><td>' + esc(v.motivo || r.motivo || '') + ((r.riassegnatiA || []).length ? '<br><span class="muted" style="font-size:13px">Termini passati a ' + esc(r.riassegnatiA.map(nomeAlunno).join(', ')) + '</span>' : (r.bloccoRiass || A.impostazioni.riassegnazione === 'manuale' ? '<br><span class="muted" style="font-size:13px">Termini fermi: decidi tu (pagina «Proroghe e passaggi»)</span>' : '')) + '</td><td class="n"><b>' + fv(v.voto) + '</b></td><td class="n">' + (v.orale ? fv(v.orale.voto) : '—') + '</td><td class="n"><b>' + fv(v.finale) + '</b>' + (v.escluso && v.finale != null ? '<br><span class="muted" style="font-weight:400;font-size:13px">solo orale</span>' : '') + '</td>' +
        '<td>' + (RO() || !PUO('studenti') ? '' : '<button class="btn sec" style="min-height:38px;padding:0 10px" onclick="riammetti(\'' + v.id + '\',' + (!v.riammesso) + ',this)">' + (v.riammesso ? 'Annulla riammissione' : 'Riammetti') + '</button>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  h += '</section>';
  if (quale === 'voti') return h;
  h = '';
  if (PUO('documenti')) h += '<section class="card stack admin"><h2 style="margin:0;font-size:22px">Report, Word e slide</h2><div class="row"><button class="btn" onclick="reportPdf()">Report completo (PDF)</button>' + (RO() ? '<button class="btn" onclick="scaricaArchivio(\'' + esc(S.d.edizioneArchivio.id) + '\',\'word\',this)">Definizioni approvate (Word)</button>' : '<button class="btn" onclick="esportaWord(this)">Definizioni approvate (Word)</button>') + '<button class="btn sec" onclick="stampaTarga()">Targa introduttiva 50×70 (PDF)</button>' + (RO() ? '' : '<button class="btn" onclick="presentazione(this)">Presentazione PowerPoint (.pptx)</button>') + '<span class="muted" style="font-size:14px">Per ' + (S.filtro.classe && S.filtro.classe !== 'tutte' ? 'la ' + esc(S.filtro.classe) : 'tutte le classi') + ' (scegli la classe nella barra a sinistra). Il PDF si apre nella stampa (“Salva come PDF”); la presentazione si scarica, con grafici modificabili.</span></div></section>';
  return h;
}
function presentazione(btn, azione, dati) {
  var t = btn.textContent; btn.disabled = true; btn.textContent = 'Preparo la presentazione…';
  api(azione || 'presentazione', dati || { classe: S.filtro.classe }).then(function (x) {
    var bin = atob(x.base64), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    var a = document.createElement('a'); a.href = url; a.download = x.nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    btn.disabled = false; btn.textContent = t; toast('Presentazione scaricata');
  }).catch(function (e) { btn.disabled = false; btn.textContent = t; toast(errMsg(e), true); });
}
/* targa introduttiva 50x70 con i numeri veri del lavoro, in forma di racconto */
function numeroParole(n) {
  var u = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'];
  var d = ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'];
  if (n < 20) return u[n];
  if (n < 100) { var dd = d[Math.floor(n / 10)], r = n % 10; if (r === 1 || r === 8) dd = dd.slice(0, -1); return dd + (r ? (r === 3 ? 'tré' : u[r]) : ''); }
  return String(n);
}
function durataLunga(min) {
  min = Math.round(min || 0); var h = Math.floor(min / 60), m = min % 60;
  if (h >= 10) return Math.round(min / 60) + ' ore';
  return (h ? (h === 1 ? 'un’ora' : h + ' ore') : '') + (h && m ? ' e ' : '') + (m || !h ? m + (m === 1 ? ' minuto' : ' minuti') : '');
}
function durataBreve(min) { min = Math.round(min || 0); var h = Math.floor(min / 60), m = min % 60; return h >= 10 ? Math.round(min / 60) + ' h' : (h ? h + ' h ' : '') + (m || !h ? m + ' min' : ''); }
function statisticheTarga() {
  var A = S.d.admin, imp = A.impostazioni, att = A.attivita || {}, voti = {}; A.voti.forEach(function (v) { voti[v.id] = v; });
  var P = S.d.panoramica || [], T = S.d.termini || [];
  var minuti = P.reduce(function (a, r) { return a + ((att[r.id] || {}).minuti || 0); }, 0);
  var conTempo = P.filter(function (r) { return (att[r.id] || {}).minuti > 0; }).length || P.length || 1;
  var dal = imp.partenza ? Date.parse(imp.partenza) : null, al = Math.min(Date.now(), Date.parse(imp.scadenzaIt));
  var giorni = dal ? Math.max(1, Math.round((al - dal) / 86400000)) : null;
  var gm = function (ms) { return new Date(ms).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'Europe/Rome' }); };
  var mese = function (ms) { return new Date(ms).toLocaleDateString('it-IT', { month: 'long', timeZone: 'Europe/Rome' }); }, gg = function (ms) { return new Date(ms).toLocaleDateString('it-IT', { day: 'numeric', timeZone: 'Europe/Rome' }); };
  var periodo = !dal ? 'in questo anno scolastico' : Date.now() < Date.parse(imp.scadenzaIt) ? 'dal ' + gm(dal) + ' a oggi' : mese(dal) === mese(al) ? 'dal ' + gg(dal) + ' al ' + gg(al) + ' ' + mese(al) : 'dal ' + gm(dal) + ' al ' + gm(al);
  var f = T.filter(function (t) { return window.T(t, 'it', 'primoOk') != null; }), ok = f.filter(function (t) { return window.T(t, 'it', 'primoOk') === true; }).length;
  var vv = A.voti.filter(function (v) { return !v.escluso && v.voto != null; }).map(function (v) { return v.voto; });
  var voto = vv.length ? fv(Math.round(vv.reduce(function (a, b) { return a + b; }, 0) / vv.length * 100) / 100) : '';
  return {
    giorniParola: giorni ? numeroParole(giorni) : 'molti', periodo: periodo, autoriParola: numeroParole(P.length), classi: elencoClassi(),
    oreTesto: durataLunga(minuti), mediaTesto: durataLunga(minuti / conTempo), oreBreve: durataBreve(minuti), mediaBreve: durataBreve(minuti / conTempo),
    risposte: P.reduce(function (a, r) { return a + (r.inviate || 0); }, 0), primo: f.length ? Math.round(ok / f.length * 100) : null,
    approvate: T.filter(function (t) { return t.statoIt === 'approvata'; }).length, totale: T.length, voto: voto, as: (S.d.config.edizione || {}).as || '2026/27'
  };
}
function stampaTarga() {
  Poster.targa.autori = (S.d.alunni || []).length; Poster.targa.classi = CLASSI().length;
  var html = Poster.targa(S.d.aree.map(function (a) { return { n: a.n, it: a.it, colore: a.colore, numero: S.d.areeMie ? a.numero : undefined, tot: (S.d.termini || []).filter(function (t) { return t.area == a.n; }).length }; }), statisticheTarga(), location.origin + '/glossario' + (S.d.att && S.d.att !== 'main' ? '?att=' + encodeURIComponent(S.d.att) : ''));
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per creare il PDF', true); return; }
  w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Targa introduttiva Glossario</title>' +
    '<style>' + cssFonti(location.origin) + '</style>' +
    '<style>@page{size:500mm 700mm;margin:0}html,body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}@media screen{body{background:#C9D2DA;padding:10mm}body>div{box-shadow:0 2mm 8mm rgba(0,0,0,.25);margin:0 auto}}</style></head><body>' + html +
    scriptStampa('setTimeout(function(){window.print()},400)') + '</body></html>');
  w.document.close();
}
function esportaWord(btn) {
  var t = btn.textContent; btn.disabled = true; btn.textContent = 'Preparo il Word…';
  api('word').then(function (x) {
    var bin = atob(x.base64), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    var a = document.createElement('a'); a.href = url; a.download = x.nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    btn.disabled = false; btn.textContent = t;
    toast(x.dropbox === 'ok' ? 'Word scaricato e salvato su Dropbox (' + x.percorso + ')' : x.dropbox === 'non collegato' ? 'Word scaricato. Dropbox non è collegato: collegalo per il salvataggio automatico.' : 'Word scaricato, ma Dropbox ha dato errore: ' + x.dropbox, x.dropbox !== 'ok' && x.dropbox !== 'non collegato');
  }).catch(function (e) { btn.disabled = false; btn.textContent = t; toast(errMsg(e), true); });
}
function salvaImpostazioni(btn) {
  var en = $('scEn') ? $('scEn').value : null, pr = document.querySelector('input[name="prop"]:checked'), ri = document.querySelector('input[name="riass"]:checked');
  var dati = { scadenzaEn: en ? new Date(en).toISOString() : null, proposta: pr ? pr.value : null, giorniIt: $('gIt').value, giorniEn: $('gEn') ? $('gEn').value : null, riassegnazione: ri ? ri.value : null };
  if ($('pa_' + CLASSI()[0])) {
    // date diverse per classe: si salvano tutte, esplicitamente
    var cal = {}, manca = null;
    CLASSI().forEach(function (c) { var p = $('pa_' + c).value, sc = $('sc_' + c).value; if (!sc) manca = c; cal[c] = { partenza: p ? new Date(p).toISOString() : null, scadenzaIt: sc ? new Date(sc).toISOString() : null }; });
    if (manca) { toast('Inserisci la scadenza della ' + manca + '.', true); return; }
    dati.calendario = cal;
  } else {
    var it = $('scIt').value;
    if (!it || (EN() && !en)) { toast(EN() ? 'Inserisci entrambe le scadenze.' : 'Inserisci la scadenza.', true); return; }
    var pa = $('pa') ? $('pa').value : '';
    dati.partenza = pa ? new Date(pa).toISOString() : null; dati.scadenzaIt = new Date(it).toISOString(); dati.calendario = {};
  }
  btn.disabled = true;
  api('impostazioni', dati).then(function () { return api('login'); }).then(function (d) { S.d = d; S.datePerClasse = null; toast('Impostazioni salvate'); vistaDocente(); })
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
  var esegui = function (modo) {
    btn.disabled = true;
    return api('riammetti', { alunno: id, riammesso: val, modo: modo || 'tutti' }).then(function (r) { return api('login').then(function (d) { S.d = d; return r; }); })
      .then(function (r) { toast(val ? 'Alunno riammesso' + (r && r.restituiti ? ': ' + r.restituiti + ' termini restituiti' : '') : 'Riammissione annullata'); vistaDocente(); })
      .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
  };
  if (!val) {
    btn.disabled = false;
    sceltaRiammissione('<p style="margin:0">Annullando la riammissione l\'alunno torna escluso con voto ' + fv(S.d.admin.impostazioni.votoEsclusione || 4) + '. ' + (S.d.admin.impostazioni.riassegnazione === 'manuale' ? 'I suoi termini restano dove sono finché non decidi tu.' : 'Al primo accesso successivo i suoi termini passano di nuovo, a sorte, a un compagno della stessa classe.') + '</p>',
      [{ t: 'Annulla la riammissione', f: function () { esegui(); } }]);
    return;
  }
  api('anteprimariammissione', { alunno: id }).then(function (a) {
    btn.disabled = false;
    if (!a.termini) return esegui('tutti');
    var chi = a.eredi.map(function (e) { return '<b>' + esc(e.nome) + '</b> (' + e.termini + ' termini, ' + (e.risposti ? 'a ' + e.risposti + ' ha già risposto' : 'nessuna risposta ancora') + ')'; }).join(', ');
    var testa = '<p style="margin:0 0 8px">Riammetti <b>' + esc(a.nome) + '</b>. I suoi ' + a.termini + ' termini sono passati a ' + chi + '.</p>';
    if (!a.risposti) {
      sceltaRiammissione(testa + '<p style="margin:0">Tutti i termini tornano a ' + esc(a.nome) + '. Chi li aveva ricevuti torna al voto massimo normale.</p>',
        [{ t: 'Riammetti e restituisci i termini', f: function () { esegui('tutti'); } }]);
    } else {
      sceltaRiammissione(testa + '<p class="note warn" style="margin:0">Attenzione: a ' + a.risposti + (a.risposti === 1 ? ' termine' : ' termini') + ' il compagno ha già risposto. Scegli cosa fare.</p>',
        [{ t: 'Restituisci tutti i ' + a.termini + ' termini', s: 'le risposte già date dal compagno si cancellano', f: function () { esegui('tutti'); } },
         { t: 'Restituisci solo i ' + (a.termini - a.risposti) + ' senza risposta', s: 'gli altri ' + a.risposti + ' restano al compagno (voto massimo ' + fv(S.d.admin.impostazioni.votoMaxErede) + ')', f: function () { esegui('non_risposti'); } }]);
    }
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function sceltaRiammissione(testo, scelte) { finestra('Riammissione', testo, scelte); }
function reportPdf() {
  var A = S.d.admin, voti = {}; A.voti.forEach(function (v) { voti[v.id] = v; });
  var oggi = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  var imp = A.impostazioni, att = A.attivita || {};
  var PAN = (S.d.panoramica || []).filter(function (r) { return inClasse(r.id); });
  var classi = CLASSI().filter(function (c) { return PAN.some(function (r) { return (r.classe || '3E') === c; }); });
  var titoloCl = classi.length > 1 ? 'Classi ' + classi.join(' e ') : 'Classe ' + (classi[0] || '3E');
  var COL = { '3E': '#1F5FA8', '3F': '#B4511A' }, ALTRI = ['#1F5FA8', '#B4511A', '#2E7D32', '#6B4FA0', '#0E7C7B', '#9A4A00'];
  var colCl = function (c) { return COL[c] || ALTRI[Math.max(0, CLASSI().indexOf(c)) % ALTRI.length]; };
  var ST = [['approvata', 'Approvate', '#2E7D32'], ['inviata', 'Da approvare', '#7A9CC6'], ['correggere', 'Da rivedere', '#C77700'], ['', 'Senza risposta', '#C3CED7']];
  var termDi = function (id) { return S.d.termini.filter(function (t) { return t.alunno === id; }); };
  var TT = S.d.termini.filter(function (t) { return inClasse(t.alunno); });
  var perc = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
  var media = function (xs) { xs = xs.filter(function (x) { return x != null; }); return xs.length ? Math.round(xs.reduce(function (a, b) { return a + b; }, 0) / xs.length * 100) / 100 : null; };
  var primo = function (ts) { var f = ts.filter(function (t) { return T(t, 'it', 'primoOk') != null; }); return { ok: f.filter(function (t) { return T(t, 'it', 'primoOk') === true; }).length, n: f.length }; };
  var conta = function (ts, st) { return ts.filter(function (t) { return (T(t, 'it', 'stato') || '') === st; }).length; };
  var logo = function (mm) { return Poster.logo(mm); };
  // da chi ha ricevuto i termini (alunni esclusi)
  var donatori = function (id) { var o = []; termDi(id).forEach(function (t) { if (t.ereditato && t.alunnoOrig && o.indexOf(t.alunnoOrig) < 0) o.push(t.alunnoOrig); }); return o; };
  var cognome = function (id) { return nomeAlunno(id).split(' ')[0]; };
  var PEN = imp.penalita != null ? imp.penalita : (imp.proposta === 'A' ? 0.25 : 0.5), punti = function (n) { return n ? '−' + (n * PEN).toFixed(2).replace('.', ',') : '0'; };

  /* --- grafici SVG (statici, per la stampa) --- */
  var F = 'font-family:Arial,sans-serif';
  function txt(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.fs || 9) + '" fill="' + (o.c || '#15212B') + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + (o.b ? ' font-weight="700"' : '') + ' style="' + F + '">' + esc(String(s)) + '</text>'; }
  function legenda(voci) { return '<div class="lg">' + voci.map(function (v) { return '<span><i style="background:' + v[1] + '"></i>' + esc(v[0]) + '</span>'; }).join('') + '</div>'; }
  // istogramma dei voti per classe (colonne affiancate)
  function graficoVoti() {
    var fasce = [['4', 4, 4.4], ['4,5–5,5', 4.5, 5.9], ['6–6,5', 6, 6.9], ['7–7,5', 7, 7.9], ['8–9,5', 8, 10]];
    var dati = classi.map(function (c) { return fasce.map(function (f) { return PAN.filter(function (r) { var v = voti[r.id]; return (r.classe || '3E') === c && v && v.voto != null && v.voto >= f[1] && v.voto <= f[2]; }).length; }); });
    var max = Math.max(1, Math.max.apply(null, dati.map(function (d) { return Math.max.apply(null, d); })));
    var W = 330, H = 150, x0 = 26, y0 = 14, h = H - 38, gw = (W - x0 - 6) / fasce.length, bw = Math.min(22, (gw - 12) / classi.length);
    var s = '';
    for (var k = 0; k <= 4; k++) { var v = Math.round(max * k / 4), y = y0 + h - h * (v / max); s += '<line x1="' + x0 + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#E3E9EE" stroke-width="0.6"/>' + txt(x0 - 5, y + 3, v, { a: 'end', fs: 7.5, c: '#5B6976' }); }
    fasce.forEach(function (f, i) {
      var gx = x0 + i * gw + (gw - bw * classi.length - 2 * (classi.length - 1)) / 2;
      classi.forEach(function (c, j) {
        var n = dati[j][i], bh = h * n / max, x = gx + j * (bw + 2);
        if (n) s += '<path d="M' + x + ',' + (y0 + h) + 'V' + (y0 + h - bh + 3) + 'q0,-3 3,-3h' + (bw - 6) + 'q3,0 3,3V' + (y0 + h) + 'Z" fill="' + colCl(c) + '"/>' + txt(x + bw / 2, y0 + h - bh - 3, n, { a: 'middle', fs: 8, b: true });
      });
      s += txt(x0 + i * gw + gw / 2, H - 12, f[0], { a: 'middle', fs: 8.5 });
    });
    s += '<line x1="' + x0 + '" x2="' + W + '" y1="' + (y0 + h) + '" y2="' + (y0 + h) + '" stroke="#5B6976" stroke-width="0.8"/>' + txt(W / 2 + 10, H - 1, 'fascia di voto · numero di alunni', { a: 'middle', fs: 7.5, c: '#5B6976' });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + s + '</svg>' + (classi.length > 1 ? legenda(classi.map(function (c) { return [c, colCl(c)]; })) : '');
  }
  // avanzamento dei termini (barra 100% per classe)
  function graficoStati() {
    var righe = classi.map(function (c) { return { c: c, ts: TT.filter(function (t) { return classeAl(t.alunno) === c; }) }; });
    var W = 330, rh = 26, x0 = 30, bw = W - x0 - 4, H = righe.length * (rh + 10) + 6, s = '';
    righe.forEach(function (r, i) {
      var y = 4 + i * (rh + 10), x = x0, n = r.ts.length || 1;
      s += txt(0, y + rh / 2 + 4, r.c, { fs: 10, b: true });
      ST.forEach(function (st) {
        var k = conta(r.ts, st[0]), w = bw * k / n; if (!k) return;
        s += '<rect x="' + x + '" y="' + y + '" width="' + Math.max(0, w - 2) + '" height="' + rh + '" rx="3" fill="' + st[2] + '"/>';
        if (w > 26) s += txt(x + (w - 2) / 2, y + rh / 2 + 3.5, perc(k, n) + '%', { a: 'middle', fs: 8.5, b: true, c: st[0] === '' ? '#15212B' : '#fff' });
        x += w;
      });
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + s + '</svg>' + legenda(ST.map(function (s) { return [s[1], s[2]]; }));
  }
  // esattezza al primo tentativo per area (barre orizzontali, una per classe)
  function graficoAree() {
    var W = 680, x0 = 190, bw = W - x0 - 40, rh = 10, s = '', y = 2;
    S.d.aree.forEach(function (a) {
      s += txt(0, y + rh * classi.length / 2 + 4, a.n + '. ' + a.it, { fs: 9.5 });
      classi.forEach(function (c) {
        var p = primo(TT.filter(function (t) { return t.area == a.n && classeAl(t.alunno) === c; })), v = perc(p.ok, p.n), w = bw * v / 100;
        s += '<rect x="' + x0 + '" y="' + y + '" width="' + bw + '" height="' + rh + '" rx="2" fill="#EEF2F5"/>' + (w > 0 ? '<rect x="' + x0 + '" y="' + y + '" width="' + Math.max(w, 4) + '" height="' + rh + '" rx="2" fill="' + colCl(c) + '"/>' : '') +
          txt(x0 + bw + 6, y + rh - 1.5, p.n ? v + '%' : '—', { fs: 9, b: true });
        y += rh + 2;
      });
      y += 9;
    });
    return '<svg viewBox="0 0 ' + W + ' ' + y + '" width="100%">' + s + '</svg>' + (classi.length > 1 ? legenda(classi.map(function (c) { return [c, colCl(c)]; })) : '');
  }
  function barraVoto(v, c) {
    if (v == null) return '<span class="m">—</span>';
    var w = Math.max(2, (v - 0) / 10 * 100);
    return '<div class="bv"><i style="width:' + w + '%;background:' + colCl(c) + '"></i></div>';
  }

  /* --- pagina 1: sintesi --- */
  var tutteV = PAN.map(function (r) { return voti[r.id] && voti[r.id].voto; });
  var p1 = primo(TT), esclusi = PAN.filter(function (r) { return voti[r.id] && voti[r.id].escluso; }).length;
  var tempo = function (rr) { return Math.round(rr.reduce(function (a, r) { return a + ((att[r.id] || {}).minuti || 0); }, 0)); };
  var kpi = [[PAN.length, 'alunni'], [TT.length, 'termini'], [PAN.reduce(function (a, r) { return a + r.inviate; }, 0), 'risposte inviate'],
    [p1.n ? perc(p1.ok, p1.n) + '%' : '—', 'esatte al 1° tentativo'], [conta(TT, 'approvata') + '/' + TT.length, 'definizioni approvate'], [media(tutteV) != null ? fv(media(tutteV)) : '—', 'voto medio'], [durata(tempo(PAN)), 'tempo totale in app']];
  var perClasse = classi.length > 1 ? '<table class="mini"><thead><tr><th>Classe</th><th class="c">Alunni</th><th class="c">Voto medio</th><th class="c">Esatte al 1°</th><th class="c">Approvate</th><th class="c">Esclusi</th><th class="c">Tempo totale</th><th class="c">Media per alunno</th></tr></thead><tbody>' + classi.map(function (c) {
    var rr = PAN.filter(function (r) { return (r.classe || '3E') === c; }), ts = TT.filter(function (t) { return classeAl(t.alunno) === c; }), p = primo(ts);
    return '<tr><td><i class="dot" style="background:' + colCl(c) + '"></i><b>' + c + '</b></td><td class="c">' + rr.length + '</td><td class="c"><b>' + (media(rr.map(function (r) { return voti[r.id] && voti[r.id].voto; })) != null ? fv(media(rr.map(function (r) { return voti[r.id] && voti[r.id].voto; }))) : '—') + '</b></td><td class="c">' + (p.n ? perc(p.ok, p.n) + '%' : '—') + '</td><td class="c">' + conta(ts, 'approvata') + '/' + ts.length + '</td><td class="c">' + rr.filter(function (r) { return voti[r.id] && voti[r.id].escluso; }).length + '</td><td class="c"><b>' + durata(tempo(rr)) + '</b></td><td class="c">' + (rr.length ? durata(Math.round(tempo(rr) / rr.length)) : '—') + '</td></tr>';
  }).join('') + '</tbody></table>' : '';

  function testata(sotto) {
    return '<header><div class="lg0">' + logo(17) + '<div><b>Istituto Barsanti - sede Salvetti</b><span>Massa' + (Poster.materia() ? ' · ' + esc(Poster.materia()) : '') + ' · a.s. ' + esc((S.d.config.edizione || {}).as || '2026/27') + '</span></div></div>' +
      '<div class="dx"><b>' + esc(Poster.titolo()) + '</b><span>' + esc(sotto) + '</span></div></header>';
  }
  var npag = 0, totPag = 2 + PAN.length;
  function piede() { npag++; return '<footer><span>Report del glossario · ' + esc(titoloCl) + ' · generato il ' + esc(oggi) + ' · ' + esc(Poster.conc() ? Poster.conc().docente + ' · Per gentile concessione del Prof. Danilo Cerrato' : 'Prof. Danilo Cerrato') + '</span><span>' + npag + ' / ' + totPag + '</span></footer>'; }

  var pag1 = '<section class="pg">' + testata(titoloCl) +
    '<h1>Report del lavoro · ' + esc(titoloCl) + '</h1><p class="sub">' + (imp.partenza ? 'Partenza ' + esc(oraIt(imp.partenza)) + ' · ' : '') + 'Scadenza ' + esc(oraIt(imp.scadenzaIt)) + ' · situazione al ' + esc(oggi) + '</p>' +
    '<div class="kpi k7">' + kpi.map(function (k) { return '<div><b>' + k[0] + '</b><span>' + k[1] + '</span></div>'; }).join('') + '</div>' +
    perClasse +
    '<div class="g2"><div class="gr"><h3>Distribuzione dei voti</h3>' + graficoVoti() + '</div><div class="gr"><h3>Avanzamento dei termini</h3>' + graficoStati() + '</div></div>' +
    '<div class="gr"><h3>Risposte esatte al primo tentativo, per area</h3>' + graficoAree() + '</div>' +
    '<div class="box"><b>Criterio di valutazione.</b> Ogni alunno ha ' + TPA() + ' termini e per ciascuno sceglie la definizione corretta tra 8 alternative; ogni scelta è verificata dal docente. ' + esc(A.ratio) + (esclusi ? ' Alunni esclusi per mancato rispetto della scadenza: ' + esclusi + '.' : '') + '</div>' +
    piede() + '</section>';

  /* --- pagina 2: tabellone --- */
  var righeTab = classi.map(function (c) {
    var rr = PAN.filter(function (r) { return (r.classe || '3E') === c; });
    return '<tr class="sez"><td colspan="10"><i class="dot" style="background:' + colCl(c) + '"></i>Classe ' + c + ' · ' + rr.length + ' alunni · tempo totale in app ' + durata(tempo(rr)) + '</td></tr>' + rr.map(function (r) {
      var v = voti[r.id] || {}, p = primo(termDi(r.id)), x = att[r.id] || {};
      return '<tr><td>' + esc(r.nome) + (v.ereditati ? ' <span class="tag">erede di ' + esc(donatori(r.id).map(cognome).join(', ') || '—') + '</span>' : '') + (v.escluso ? ' <span class="tag no">escluso</span>' : '') + '</td><td class="c">' + esc(etich(r)) + '</td><td class="c">' + r.inviate + '</td><td class="c">' + (p.n ? p.ok + '/' + p.n : '—') + '</td><td class="c">' + r.errate + '</td><td class="c">' + r.approvate + '/' + r.termini + '</td><td class="c">' + (x.accessi || 0) + '</td><td class="c"><b>' + (x.ultimo ? durata(x.minuti) : '—') + '</b>' + '</td>' +
        '<td class="vb">' + barraVoto(v.voto, c) + '</td><td class="c"><b>' + fv(v.voto) + '</b>' + (v.manuale != null ? '<span class="m"> man.</span>' : '') + '</td></tr>';
    }).join('');
  }).join('');
  var pag2 = '<section class="pg">' + testata(titoloCl) + '<h1>Tabellone degli alunni</h1><p class="sub">Esatte al 1°: scelte giuste al primo invio sui termini in cui l\'alunno ha risposto. Tempo in app: tempo totale con l\'app aperta, sommando tutti gli accessi.</p>' +
    '<table class="tab comp"><thead><tr><th>Alunno</th><th class="c">Classe</th><th class="c">Risposte</th><th class="c">Esatte al 1°</th><th class="c">Errate</th><th class="c">Approvate</th><th class="c">Accessi</th><th class="c">Tempo in app</th><th style="width:15%">Voto (scala 0–10)</th><th class="c">Voto</th></tr></thead><tbody>' + righeTab + '</tbody></table>' +
    piede() + '</section>';

  /* --- quiz, interrogazione orale e voto finale --- */
  var tq = function (ms) { var m = Math.round((ms || 0) / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
  var gg = function (iso) { return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }); };
  var sogliaQ = PAN.length ? quizDi(PAN[0].id).soglia : 260, scadQ = CLASSI().map(function (c) { var d = (((S.d.admin || {}).impostazioni || {}).quiz || { scadenze: {} }).scadenze[c]; return d ? c + ': ' + gg(d) : ''; }).filter(Boolean).join(' · ');
  var interrogati = PAN.filter(function (r) { return (voti[r.id] || {}).orale; });
  var pag3 = '<section class="pg">' + testata(titoloCl) + '<h1>Quiz, interrogazione orale e voto finale</h1>' +
    '<div class="box"><b>Come funziona.</b> <b>Quiz</b> (seconda parte della prova): nella pagina del quiz (' + esc(location.host) + '/quiz), separata dal glossario, con il codice personale o il QR della scheda; un termine, ' + nDef(RG().quiz.opzioni) + ', ' + RG().quiz.secondi + ' secondi. A ogni errore la risposta giusta non viene mostrata e l\'alunno torna indietro di ' + RG().quiz.passo + ' termini; i progressi restano tra una sessione e l\'altra. Il quiz è superato con ' + sogliaQ + ' termini indovinati entro la scadenza fissata dal docente' + (scadQ ? ' (' + scadQ + ')' : '') + '. ' +
    '<b>Ammissione</b>: solo chi supera il quiz è ammesso all\'interrogazione; chi non lo completa non viene interrogato e resta senza voto (le sue definizioni restano sui cartelloni). ' +
    '<b>Interrogazione orale</b>: l\'app pesca ' + RG().orale.domande + ' termini tra tutti quelli del glossario (mai quelli dell\'alunno, bilanciati sulle aree); risposta corretta 1 punto, parziale ½, sbagliata 0. ' + regolaOrale() + ' (massimo ' + fv(RG().orale.max) + '); per gli alunni esclusi dallo scritto ' + fv(RG().orale.base) + ' + ' + frz(RG().orale.passoEsclusi) + ' per punto (massimo ' + fv(RG().orale.maxEsclusi) + '). ' +
    '<b>Voto finale</b> = ' + mediaTxt() + ' (per gli esclusi vale il solo orale): oltre il mezzo voto si arrotonda all\'intero superiore, sotto a quello inferiore (7,75 → 8 · 7,5 → 7,5 · 7,4 → 7).</div>' +
    '<table class="tab ora"><thead><tr><th style="width:19%">Alunno</th><th class="c" style="width:6%">Classe</th><th class="c">Scritto</th><th class="c">Sessioni quiz</th><th class="c">Tempo nel quiz</th><th class="c">Fino al termine</th><th class="c">Risposte</th><th class="c">Corrette</th><th class="c">Errori</th><th class="c">Termini persi</th><th class="c">Indovinati</th><th class="c" style="width:12%">Ammissione all\'orale</th><th class="c">Punti orale</th><th class="c">Orale</th><th class="c">Finale</th></tr></thead><tbody>' +
    PAN.map(function (r) {
      var v = voti[r.id] || {}, q = quizDi(r.id), o = v.orale;
      return '<tr><td><b>' + esc(r.nome) + '</b></td><td class="c">' + esc(etich(r)) + '</td><td class="c">' + (v.escluso ? '<span class="no">escluso</span>' : fv(v.voto)) + '</td><td class="c">' + q.sessioni + '</td><td class="c">' + (q.sessioni ? tq(q.ms) : '—') + '</td><td class="c">' + (!q.sessioni ? '—' : q.superata ? '<b>' + tq(q.msFine) + '</b>' : q.stato === 'scaduto' ? tq(q.msFine) : '<span class="m">' + tq(q.msFine) + ' · in corso</span>') + '</td><td class="c">' + q.risposte + '</td>' +
        '<td class="c">' + (q.risposte ? q.corrette + ' (' + perc(q.corrette, q.risposte) + '%)' : '—') + '</td><td class="c">' + (q.errori || 0) + '</td><td class="c">' + (q.persi || 0) + '</td><td class="c">' + q.indovinati + ' / ' + q.soglia + '</td><td class="c">' + (q.superata ? '<span class="ok">ammesso</span><br><span class="m">' + esc(gg(q.superata)) + '</span>' : q.stato === 'scaduto' ? '<span class="no" style="white-space:nowrap">non ammesso</span>' : '<span class="m" style="white-space:nowrap">' + (q.stato === 'chiuso' ? 'quiz non aperto' : q.stato) + '</span>') + '</td>' +
        '<td class="c">' + (o ? fv(o.punti) + ' / 10' : '—') + '</td><td class="c"><b>' + (o ? fv(o.voto) : '—') + '</b></td><td class="c">' + (v.finale != null ? '<b>' + fv(v.finale) + '</b>' : q.stato === 'scaduto' ? '<span class="m">senza voto</span>' : '<b>—</b>') + '</td></tr>';
    }).join('') + '</tbody></table>' +
    (interrogati.length ? '<h1 style="margin-top:6mm">Interrogazioni: termini chiesti ed esito</h1><p class="sub">Per ogni termine: ✓ corretta (1 punto), ½ parziale, ✗ sbagliata (0).</p>' +
      '<table class="tab ora"><thead><tr><th style="width:17%">Alunno</th><th style="width:17%">Data e docente</th><th>Termini chiesti</th><th class="c" style="width:9%">Punti</th><th class="c" style="width:8%">Voto orale</th></tr></thead><tbody>' +
      interrogati.map(function (r) {
        var o = voti[r.id].orale;
        return '<tr><td><b>' + esc(r.nome) + '</b>' + (o.escluso ? '<br><span class="m">escluso: massimo ' + fv(RG().orale.maxEsclusi) + '</span>' : '') + '</td><td>' + esc(gg(o.data)) + (o.docente ? '<br><span class="m">' + esc(o.docente) + '</span>' : '') + '</td>' +
          '<td>' + (o.termini || []).map(function (t) { return esc(t.it) + ' ' + (t.e === 1 ? '<span class="ok">✓</span>' : t.e === 0.5 ? '<b>½</b>' : '<span class="no">✗</span>'); }).join(' · ') +
          (o.cambi ? '<br><span class="m">Termini cambiati durante l\'interrogazione: ' + o.cambi + '</span>' : '') + (o.nota ? '<br><span class="m">Nota: ' + esc(o.nota) + '</span>' : '') + '</td>' +
          '<td class="c">' + fv(o.punti) + ' / 10</td><td class="c"><b>' + fv(o.voto) + '</b></td></tr>';
      }).join('') + '</tbody></table>' : '<p class="sub" style="margin-top:4mm">Nessuna interrogazione orale ancora registrata.</p>') +
    piede() + '</section>';

  /* --- riepilogo personale: tempi e voti con le date --- */
  var dataAt = function (at) { var m = /^(\d\d)\/(\d\d)\/(\d{4}) (\d\d):(\d\d)/.exec(at || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime() : null; };
  var ggmm = function (v) { if (v == null) return '—'; var d = new Date(v), p2 = function (n) { return ('0' + n).slice(-2); }; return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  /* agevolazioni e misure personalizzate (BES e regole personali): solo qui, lo studente non vede etichette */
  function agevolazioniAlunno(r, v) {
    var q = quizDi(r.id), o = v.orale, B = q.bes, R = RG(), voci = [];
    if (B) {
      voci.push('Studente con bisogni educativi speciali (BES).');
      voci.push(B.secondi === 0 ? 'Quiz senza limite di tempo per rispondere (classe: ' + R.quiz.secondi + ' secondi).' : B.secondi ? 'Quiz con ' + B.secondi + ' secondi per rispondere (classe: ' + R.quiz.secondi + ').' : 'Quiz con lo stesso tempo della classe (' + R.quiz.secondi + ' secondi).');
      if (B.dimezza) { var usi = (q.ultime || []).reduce(function (a, s) { return a + (s.d || 0); }, 0); voci.push('Pulsante «Dimezza opzioni» nel quiz (da ' + R.quiz.opzioni + ' a 2 definizioni)' + (usi ? ': usato ' + usi + (usi === 1 ? ' volta.' : ' volte.') : ': mai usato.')); }
      voci.push('Interrogazione su ' + Math.max(1, Math.round(R.orale.domande / 2)) + ' termini invece di ' + R.orale.domande + ', con punteggio in proporzione (voto massimo invariato).');
    }
    if (q.sogliaPersonale != null) voci.push('Quiz: ' + q.sogliaPersonale + ' termini da indovinare invece di ' + (q.sogliaClasse || 'quelli della classe') + '.');
    if (q.passoPersonale != null) voci.push('Quiz: a ogni errore si perdono ' + q.passoPersonale + (q.passoPersonale === 1 ? ' termine' : ' termini') + ' invece di ' + R.quiz.passo + '.');
    if (q.proroga) voci.push('Proroga individuale del quiz fino a ' + oraIt(q.proroga) + '.');
    if (r.proroga) voci.push('Proroga individuale dello scritto fino a ' + oraIt(r.proroga) + '.');
    if (o && o.manuale) voci.push('Voto orale assegnato dal docente: ' + fv(o.voto) + ' (calcolato dalle risposte: ' + fv(o.votoCalcolato) + ').');
    if (!voci.length) return '';
    return '<div class="gr"><h3>Agevolazioni e misure personalizzate</h3>' + (B ? '<div class="box"><b>Prova sostenuta con l\'ausilio di strumenti compensativi e dispensativi.</b></div>' : '') +
      '<ul style="margin:2mm 0 0;padding-left:5mm">' + voci.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
  }
  function riepilogoAlunno(r, v, x, ts) {
    var q = quizDi(r.id), o = v.orale, rs = [];
    ts.forEach(function (t) { (T(t, 'it', 'storia') || []).forEach(function (k) { var d = dataAt(k.at); if (d) rs.push(d); }); });
    var prima = rs.length ? Math.min.apply(null, rs) : null, ultima = rs.length ? Math.max.apply(null, rs) : null;
    var riga = function (voce, valore, det, date) { return '<tr><td><b>' + voce + '</b></td><td class="c"><b style="font-size:11pt">' + valore + '</b></td><td>' + det + '</td><td>' + date + '</td></tr>'; };
    return '<table class="tab riep"><thead><tr><th style="width:19%">Riepilogo</th><th class="c" style="width:13%">Valore</th><th style="width:34%">Dettaglio</th><th>Date</th></tr></thead><tbody>' +
      riga('Tempo in app', x.ultimo ? durata(x.minuti) : '—', (x.accessi || 0) + ' accessi · ' + (x.giorni || 0) + ' giorni attivi' + (x.ultimo && x.minutiAlGiorno != null ? '<br><b>' + durata(x.minutiAlGiorno) + ' al giorno</b> su ' + x.giorniAttivita + (x.giorniAttivita === 1 ? ' giorno' : ' giorni') + ' (dall\'inizio dello scritto ' + (o ? 'all\'interrogazione' : 'a oggi') + ')' : ''), x.ultimo ? 'primo accesso ' + ggmm(x.primo) + '<br>ultimo accesso ' + ggmm(x.ultimo) : '<span class="m">nessun accesso</span>') +
      (x.minutiPubblica ? riga('Ripasso sulla pagina pubblica', durata(x.minutiPubblica), (x.sessioniPubblica || 0) + (x.sessioniPubblica === 1 ? ' sessione' : ' sessioni') + ' · già compreso nel tempo in app' + (x.ripassoPrep != null ? '<br><b>per l\'interrogazione: ' + durata(x.ripassoPrep) + '</b> (' + durata(x.ripassoPrepAlGiorno) + ' al giorno su ' + x.giorniPrep + (x.giorniPrep === 1 ? ' giorno' : ' giorni') + ', dalla programmazione ' + (o ? 'all\'interrogazione' : 'a oggi') + ')' : ''), x.ultimoPubblica ? 'ultimo ripasso ' + ggmm(x.ultimoPubblica) : '') : '') +
      riga('Tempo sul quiz', q.sessioni ? tq(q.ms) : '—', q.sessioni + (q.sessioni === 1 ? ' sessione' : ' sessioni') + ' · ' + q.corrette + ' corrette e ' + (q.errori || 0) + ' errori su ' + q.risposte + ' risposte · ' + (q.persi || 0) + ' termini persi · ' + q.indovinati + ' / ' + q.soglia + ' indovinati' + (q.massimo > q.indovinati ? ' (massimo ' + q.massimo + ')' : ''),
        (q.sessioni ? 'prima sessione ' + ggmm(q.prima) + '<br>ultima sessione ' + ggmm(q.ultima) : '<span class="m">nessuna sessione</span>') + (q.scadenza ? '<br>scadenza ' + ggmm(q.scadenza) + (q.proroga ? ' (proroga individuale)' : '') : '')) +
      riga('Tempo fino al termine', q.sessioni ? tq(q.msFine) : '—', q.stato === 'superato' ? 'tempo passato sul quiz fino al superamento (il ripasso successivo non conta)' : q.stato === 'scaduto' ? 'tutto il tempo passato sul quiz fino alla scadenza' : q.sessioni ? 'quiz ancora in corso: tempo finora' : '<span class="m">nessuna sessione</span>',
        q.superata ? 'superato il ' + ggmm(q.superata) + '<br>' + q.giorniSup + (q.giorniSup === 1 ? ' giorno' : ' giorni') + ' dalla prima sessione' : '—') +
      riga('Ammissione all\'orale', q.stato === 'superato' ? '<span class="ok">ammesso</span>' : q.stato === 'scaduto' ? '<span class="no">non ammesso</span>' : '—',
        q.stato === 'superato' ? 'quiz superato: ' + q.indovinati + ' termini indovinati' : q.stato === 'scaduto' ? 'quiz non completato entro la scadenza: niente interrogazione e niente voto' : q.stato === 'chiuso' ? '<span class="m">quiz non ancora aperto</span>' : 'quiz da completare: ' + q.indovinati + ' / ' + q.soglia,
        q.superata ? 'quiz superato il ' + ggmm(q.superata) : '—') +
      riga('Voto scritto', v.escluso ? '<span class="no">escluso</span>' : fv(v.voto), v.escluso ? esc(v.motivo || 'escluso dal compito') : r.errate + (r.errate === 1 ? ' risposta errata' : ' risposte errate') + ' · ' + r.approvate + ' / ' + r.termini + ' approvate' + (v.manuale != null ? ' · voto del docente' : ''),
        prima ? 'prima risposta ' + ggmm(prima) + '<br>ultima risposta ' + ggmm(ultima) : '<span class="m">nessuna risposta</span>') +
      riga('Voto orale', o ? fv(o.voto) : '—', o ? fv(o.punti) + ' punti su ' + RG().orale.domande + (o.escluso ? ' · massimo ' + fv(RG().orale.maxEsclusi) : '') + (o.docente ? ' · ' + esc(o.docente) : '') : '<span class="m">non ancora interrogato</span>', o ? 'interrogazione del ' + ggmm(o.data) : '—') +
      riga('Voto finale', v.finale != null ? fv(v.finale) : '—', v.finale == null ? (q.stato === 'scaduto' ? '<span class="no">senza voto: quiz non completato</span>' : '<span class="m">manca l\'orale</span>') : v.escluso ? 'solo orale (escluso dallo scritto)' : (RG().finale.pesoScritto === 50 ? 'media tra scritto ' + fv(v.voto) + ' e orale ' + fv(o.voto) + ' = ' + fv((v.voto + o.voto) / 2) : mediaTxt() + ': ' + fv(Math.round((v.voto * RG().finale.pesoScritto + o.voto * (100 - RG().finale.pesoScritto)) / 100 * 1000) / 1000)), v.finale != null ? 'definito il ' + ggmm(o.data) : '—') +
      '</tbody></table>';
  }

  /* --- una pagina per alunno --- */
  var stud = PAN.map(function (r) {
    var v = voti[r.id] || {}, ts = termDi(r.id), x = att[r.id] || {}, c = r.classe || '3E', p = primo(ts), lungo = ts.length > 12;
    var stati = '<div class="sb">' + ST.map(function (st) { var k = conta(ts, st[0]); return k ? '<i style="flex:' + k + ';background:' + st[2] + '" title="' + st[1] + '"></i>' : ''; }).join('') + '</div>' +
      legenda(ST.map(function (st) { return [st[1] + ' ' + conta(ts, st[0]), st[2]]; }));
    ts = ts.filter(function (t) { return !t.ereditato; }).concat(ts.filter(function (t) { return t.ereditato; }));
    var righe = ts.map(function (t, i) {
      var st = T(t, 'it', 'storia') || [], fin = T(t, 'it', 'scelta'), z = area(t.area) || {};
      var sep = t.ereditato && (i === 0 || !ts[i - 1].ereditato || ts[i - 1].alunnoOrig !== t.alunnoOrig) ? '<tr class="sez"><td colspan="6">Termini ricevuti da ' + esc(nomeAlunno(t.alunnoOrig)) + ' (escluso)</td></tr>' : '';
      return sep + '<tr><td class="c m">' + (i + 1) + '</td><td><i class="dot" style="background:' + esc(z.colore || '#15212B') + '"></i><b>' + esc(t.it) + '</b></td><td class="c">' + (st.length ? st.map(function (q) { return q.ok ? '<span class="ok">✓</span>' : '<span class="no">✗</span>'; }).join(' ') : '<span class="m">—</span>') + '</td>' +
        '<td class="c">' + (function () { var e = st.filter(function (q) { return !q.ok; }).length; return !st.length ? '<span class="m">—</span>' : e ? '<span class="no">' + punti(e) + '</span>' : '<span class="ok">0</span>'; })() + '</td>' +
        '<td>' + (fin ? esc(fin) : (st.length ? '<span class="m">rimandata, in attesa di nuova scelta</span>' : '<span class="m">nessuna risposta</span>')) + '</td><td class="c"><span class="st s' + (T(t, 'it', 'stato') || 'v') + '">' + esc(STATO_TXT[T(t, 'it', 'stato') || '']) + '</span></td></tr>';
    }).join('');
    return '<section class="pg al' + (lungo ? ' lungo' : '') + '"><div class="in">' + testata(titoloCl) +
      '<div class="ah"><div><h1>' + esc(r.nome) + '</h1><p class="sub"><i class="dot" style="background:' + colCl(c) + '"></i>Classe ' + esc(c) + (S.d.aree[r.gruppo - 1] ? ' · Gruppo ' + r.gruppo + ' · ' + esc(S.d.aree[r.gruppo - 1].it) : ' · termini di tutte le aree') + '</p></div>' +
      '<div class="voto" style="border-color:' + colCl(c) + '"><b>' + fv(v.voto) + '</b><span>su ' + fv(v.votoMax || imp.votoMax) + '</span><em>' + (v.escluso ? 'escluso' : v.manuale != null ? 'voto del docente' : 'voto calcolato') + '</em></div></div>' +
      '<div class="kpi k6">' + [[r.inviate, 'risposte inviate'], [p.n ? perc(p.ok, p.n) + '%' : '—', 'esatte al 1° tentativo'], [r.errate, 'risposte errate'], [r.approvate + '/' + r.termini, 'approvate'], [x.ultimo ? durata(x.minuti) : '—', 'tempo totale in app'], [x.accessi || 0, 'accessi']].map(function (k) { return '<div><b>' + k[0] + '</b><span>' + k[1] + '</span></div>'; }).join('') + '</div>' +
      riepilogoAlunno(r, v, x, ts) + agevolazioniAlunno(r, v) +
      '<div class="gr"><h3>Stato dei ' + ts.length + ' termini</h3>' + stati + '</div>' +
      (v.escluso ? '<div class="box no">Escluso dal compito: ' + esc(v.motivo || '') + (r.riassegnatoA ? ' I termini sono passati a ' + esc(nomeAlunno(r.riassegnatoA)) + '.' : '') + '</div>' : '') +
      (v.ereditati ? '<div class="box">' + donatori(r.id).map(function (d) { var n = ts.filter(function (t) { return t.alunnoOrig === d && t.ereditato; }), sc = n[0] && n[0].scadIt; return 'Ha ricevuto <b>' + n.length + ' termini da ' + esc(nomeAlunno(d)) + '</b> (classe ' + esc(classeAl(d)) + '), escluso per la scadenza' + (sc ? '; scadenza per questi termini: ' + esc(oraIt(sc)) : '') + '.'; }).join('<br>') +
        ' Voto massimo ' + fv(v.votoMax) + '.' + (v.tetto ? ' Non ha risposto in tempo ai termini ricevuti: voto finale limitato a 6.' : '') + '</div>' : '') +
      (v.manuale != null ? '<div class="box">Voto inserito dal docente; voto calcolato dall\'app: ' + fv(v.calcolato) + '.</div>' : '') +
      '<table class="tab' + (lungo ? ' fitto' : '') + '"><thead><tr><th class="c" style="width:5%">N.</th><th style="width:24%">Termine</th><th class="c" style="width:10%">Tentativi</th><th class="c" style="width:8%">Punti</th><th>Definizione scelta</th><th class="c" style="width:13%">Stato</th></tr></thead><tbody>' + righe + '</tbody></table>' +
      '<p style="margin:2mm 0 0;font-size:8.5pt">Punti persi: <b>' + punti(r.errate) + '</b> (' + r.errate + ' risposte errate × ' + fv(PEN) + ') · si parte da ' + fv(v.votoMax || imp.votoMax) + ', voto minimo ' + fv(imp.votoMin) + '.</p>' +
      '<p class="m" style="margin-top:1mm">Tempo totale in app ' + (x.ultimo ? durata(x.minuti) : '—') + (x.minutiPubblica ? ' (di cui ' + durata(x.minutiPubblica) + ' di ripasso sulla pagina pubblica)' : '') + ' · primo accesso ' + esc(quando(x.primo)) + ' · ultimo accesso ' + esc(quando(x.ultimo)) + ' · giorni attivi ' + (x.giorni || 0) + '</p></div>' +
      piede() + '</section>';
  }).join('');

  var css = '@page{size:A4;margin:0}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#15212B;font-size:9pt;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.pg{width:210mm;min-height:297mm;padding:11mm 12mm 16mm;position:relative;break-after:page;page-break-after:always}.pg:last-of-type{break-after:auto}' +
    '.pg.al{height:297mm;min-height:0;overflow:hidden}.pg.al .in{transform-origin:0 0}' +
    '.tab.ora th{font-size:7pt;padding:1.2mm 1.2mm;line-height:1.15}.tab.ora td{padding:1mm 1.2mm;font-size:7.6pt;vertical-align:middle;white-space:normal;line-height:1.25;overflow-wrap:anywhere}.tab.ora{table-layout:fixed}' +
    'header{display:flex;justify-content:space-between;align-items:center;border-bottom:1.2pt solid #15212B;padding-bottom:3mm;margin-bottom:5mm}.lg0{display:flex;align-items:center;gap:3mm}.lg0 b,.dx b{display:block;font-size:10.5pt}.lg0 span,.dx span{display:block;font-size:8pt;color:#5B6976}.dx{text-align:right}' +
    'footer{position:absolute;left:12mm;right:12mm;bottom:7mm;display:flex;justify-content:space-between;font-size:7.5pt;color:#5B6976;border-top:0.6pt solid #C3CED7;padding-top:1.5mm}' +
    'h1{font-size:17pt;margin:0;line-height:1.15}h3{font-size:9.5pt;margin:0 0 2mm;text-transform:uppercase;letter-spacing:.06em;color:#2C3A47}.sub{margin:1mm 0 4mm;color:#5B6976;font-size:9pt}.m{color:#5B6976}' +
    '.riep{margin-bottom:4mm}.riep td{padding:1.4mm 2mm;vertical-align:middle;font-size:8.5pt;line-height:1.3}' +
    '.kpi{display:grid;grid-template-columns:repeat(6,1fr);gap:2.5mm;margin-bottom:4mm}.kpi.k5{grid-template-columns:repeat(5,1fr)}.kpi.k6{grid-template-columns:repeat(6,1fr)}.kpi.k7{grid-template-columns:repeat(7,1fr);gap:2mm}.kpi.k7 b{font-size:13.5pt}.kpi div{background:#EEF2F5;border-radius:2mm;padding:2.5mm 3mm}.kpi b{display:block;font-size:15pt;line-height:1.1}.kpi span{font-size:7.5pt;color:#5B6976}' +
    '.g2{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.gr{border:0.6pt solid #D3DCE3;border-radius:2mm;padding:3mm 3.5mm;margin-bottom:4mm;break-inside:avoid}' +
    '.lg{display:flex;flex-wrap:wrap;gap:2mm 4mm;margin-top:1.5mm;font-size:7.5pt;color:#2C3A47}.lg i{display:inline-block;width:2.6mm;height:2.6mm;border-radius:.6mm;margin-right:1.2mm;vertical-align:-.3mm}' +
    '.dot{display:inline-block;width:2.4mm;height:2.4mm;border-radius:50%;margin-right:1.5mm;vertical-align:.1mm}' +
    'table{width:100%;border-collapse:collapse}.tab th,.mini th{background:#15212B;color:#fff;font-size:8pt;padding:1.6mm 2mm;text-align:left}.tab td,.mini td{border-bottom:0.5pt solid #D3DCE3;padding:1.4mm 2mm;font-size:8.5pt;vertical-align:top}.tab.comp td{padding:1mm 2mm;font-size:8.2pt;vertical-align:middle;white-space:nowrap}.tab.comp td:first-child{white-space:normal}.c{text-align:center!important}' +
    '.mini{margin-bottom:4mm}.tab tr.sez td{background:#EEF2F5;font-weight:700;font-size:8.5pt}.tab.fitto td{font-size:7.2pt;padding:.7mm 1.6mm;line-height:1.25}.lungo header{margin-bottom:3mm}.lungo .ah{margin-bottom:2.5mm}.lungo .kpi{margin-bottom:2.5mm}.lungo .kpi div{padding:1.6mm 2.5mm}.lungo .kpi b{font-size:13pt}.lungo .gr{margin-bottom:2.5mm;padding:2mm 3mm}.lungo .box{margin-bottom:2mm;padding:1.8mm 3mm}' +
    '.vb{vertical-align:middle!important}.bv{height:3mm;background:#EEF2F5;border-radius:1mm;overflow:hidden}.bv i{display:block;height:100%;border-radius:1mm}' +
    '.tag{font-size:6.8pt;background:#E2ECF7;color:#1F5FA8;border-radius:1mm;padding:.2mm 1.2mm;font-weight:700}.tag.no{background:#F8E1E6;color:#B0304A}' +
    '.ok{color:#1B6E20;font-weight:700}.no{color:#B0304A;font-weight:700}' +
    '.ah{display:flex;justify-content:space-between;align-items:flex-start;gap:6mm;margin-bottom:4mm}.voto{border:1.4pt solid;border-radius:2.5mm;padding:2mm 4mm;text-align:center;min-width:30mm}.voto b{display:block;font-size:24pt;line-height:1}.voto span{display:block;font-size:8pt;color:#5B6976}.voto em{display:block;font-size:7.5pt;font-style:normal;color:#2C3A47;margin-top:.5mm}' +
    '.sb{display:flex;gap:2px;height:5mm}.sb i{border-radius:1mm}.st{font-size:7.5pt;font-weight:700;border-radius:1mm;padding:.3mm 1.5mm;white-space:nowrap}.sapprovata{background:#E3F1E4;color:#1B6E20}.sinviata{background:#E2ECF7;color:#1F5FA8}.scorreggere{background:#FCEBD9;color:#9A4A00}.sv{color:#5B6976}' +
    '.box{background:#EEF2F5;padding:2.5mm 3.5mm;border-radius:2mm;margin-bottom:3mm;font-size:8.5pt;line-height:1.35}.box.no{background:#F8E1E6;color:#7A1F31;font-weight:400}' +
    '@media screen{body{background:#C9D2DA}.pg{background:#fff;margin:6mm auto;box-shadow:0 1mm 4mm rgba(0,0,0,.2)}}';
  var html = '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Report Glossario ' + esc(titoloCl) + '</title><style>' + css + '</style></head><body>' + pag1 + pag2 + pag3 + stud +
    // ogni scheda alunno occupa esattamente un foglio A4: il contenuto viene ingrandito o rimpicciolito (in proporzione, larghezza compresa) fino a riempire la pagina
    '<scr' + 'ipt>function adattaSchede(){[].forEach.call(document.querySelectorAll(".pg.al"),function(s){var q=s.querySelector(".in");if(!q)return;var cs=getComputedStyle(s),av=s.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),z=1;' +
    'q.style.transform="none";for(var i=0;i<8;i++){q.style.width=(100/z)+"%";var h=q.offsetHeight,n=Math.max(.5,Math.min(1.35,av/h*z>0?av/h:1));if(Math.abs(n-z)<.004){z=Math.min(z,n);break}z=n}' +
    'q.style.width=(100/z)+"%";while(q.offsetHeight*z>av&&z>.5){z-=.005;q.style.width=(100/z)+"%"}q.style.transform="scale("+z+")";s.setAttribute("data-z",z.toFixed(3))});document.body.setAttribute("data-pronto","1")}' +
    'window.onload=function(){adattaSchede();setTimeout(function(){window.print()},400)}</scr' + 'ipt></body></html>';
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
    return '<div class="s"><div><b>' + esc(a.nome) + '</b> · ' + esc(etich(a)) + '<br><span>' + esc(Poster.titolo()) + ' · ' + esc(location.origin) + '</span></div><div class="c">' + esc(a.codice) + '</div></div>';
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
    '<b>Collegato</b>' + (D.account ? ' a ' + esc(D.account) : '') + '. Ogni giorno alle 23:59 arrivano nel tuo Dropbox, cartella <b>App › (nome della tua app)</b>, il backup completo (cartella <b>Backup</b>: risposte, tentativi, tempi, voti, codici, registro accessi e archivio delle edizioni), il report PDF e il Word <b>Glossario_definizioni_approvate.docx</b> (sempre lo stesso file, sovrascritto).' +
      ((S.d.spazi || []).length > 1 ? ' Lo stesso vale per ogni attività in parallelo, ognuna nella sua cartella <b>Attivita › (nome dell\'attività)</b>.' : '') +
    '<br>Ultimo invio: ' + (D.ultimoInvio ? esc(quando(D.ultimoInvio)) + ' — ' + (D.esito === 'ok' ? '<span style="color:#1B6E20;font-weight:700">riuscito</span>' : '<span style="color:#B0304A;font-weight:700">' + esc(D.esito) + '</span>') : 'nessuno');
  return '<section class="card stack admin"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Backup e report automatici</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    '<p style="margin:0">' + stato + '</p>' +
    '<div class="row">' +
    (D.configurato && !D.collegato ? '<button class="btn" onclick="dropboxCollega(this)">Collega Dropbox</button>' : '') +
    (D.collegato ? '<button class="btn" onclick="dropboxInvia(this)">Invia ora backup e report</button><button class="btn sec" onclick="dropboxScollega(this)">Scollega Dropbox</button>' : '') +
    '</div><hr style="border:0;border-top:1px solid #DDE4EA;width:100%;margin:4px 0">' +
    '<div class="row"><button class="btn sec" onclick="scaricaBackup(this)">Scarica backup completo (.json)</button>' +
    '<button class="btn warn" onclick="$(\'filebk\').click()">Ripristina da backup…</button><input type="file" id="filebk" accept=".json,application/json" style="display:none" onchange="ripristina(this)"></div>' +
    '<p class="muted" style="margin:0;font-size:14px">Il ripristino riporta risposte, tentativi, voti, codici e registro accessi al momento del backup scelto. Prima di ripristinare l\'app scarica sul tuo dispositivo una copia dello stato attuale e, se Dropbox è collegato, ne salva un\'altra nella cartella Backup. Le edizioni in archivio non vengono mai cancellate da un ripristino.</p></section>';
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
    // l'archivio non si cancella mai: se il file è troppo grande per un invio, si ripristina senza
    if (b.archivio && JSON.stringify(b).length > 5000000) { delete b.archivio; delete b.archivio_parti; }
    scaricaBackup().then(function () { return api('ripristina', { backup: b }); })
      .then(function (x) { return ricarica('Ripristinato il backup del ' + quando(x.creato) + (x.copiaDropbox && x.copiaDropbox.charAt(0) === '/' ? ' (copia dello stato precedente su Dropbox)' : '')); })
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
/* fogli accessi: una pagina A4 per alunno con le date (scritto e quiz), QR + indirizzo + codice dello scritto
   e QR + indirizzo del quiz (stesso codice). Un unico PDF per la classe (o per tutte). */
function stampaSchede(classe) {
  var host = location.origin.replace(/^https?:\/\//, ''), logo = Poster.logo(22), ed = (S.d.config && S.d.config.edizione) || {};
  var A = S.d.admin || {}, impQ = ((A.impostazioni || {}).quiz) || {};
  var lista = S.d.codiciAlunni.filter(function (a) { return !classe || classe === 'tutte' || (a.classe || '3E') === classe; });
  if (!lista.length) { toast('Nessun alunno in questa classe', true); return; }
  var box = function (tit, iso, col) {
    var d = iso ? new Date(iso) : null;
    return '<div style="border-top:2mm solid ' + col + '"><span>' + tit + '</span><b>' + (d ? GG[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()].slice(0, 3) : 'da definire') + '</b><small>' + (d ? 'ore ' + d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2) : '&nbsp;') + '</small></div>';
  };
  var blocco = function (n, col, chiaro, scuro, tit, qr, url, cod, nota, riga) {
    return '<div class="bl" style="border-color:' + col + '"><div class="bt" style="background:' + col + '">' + n + ' · ' + tit + '</div><div class="bc">' + qr +
      '<div class="bi"><div class="lb">Indirizzo</div><div class="url">' + esc(url) + '</div>' + (cod ? '<div class="lb" style="margin-top:2mm">Codice personale</div><div class="cod">' + esc(cod) + '</div>' : '') +
      (nota ? '<div class="nt" style="background:' + chiaro + ';color:' + scuro + '">' + nota + '</div>' : '') + '<p>' + riga + '</p></div></div></div>';
  };
  var pagine = lista.map(function (a) {
    var cl = a.classe || '3E', dt = (A.date || {})[cl] || { partenza: (A.impostazioni || {}).partenza, scadenzaIt: (A.impostazioni || {}).scadenzaIt }, qa = quizDi(a.id);
    var qIni = qa.partenza || (impQ.partenze || {})[cl], qFin = qa.scadenza || (impQ.scadenze || {})[cl];
    var linkS = location.origin + '/?c=' + encodeURIComponent(a.codice), linkQ = location.origin + '/quiz?c=' + encodeURIComponent(a.codice), linkP = location.origin + '/glossario?da=scheda';
    return '<section class="pg"><header>' + logo + '<div><div class="sc">Istituto Barsanti - sede Salvetti</div><div class="pr">' + esc(Poster.titolo()) + (EN() ? ' bilingue' : '') + ' · Classe ' + esc(cl) + (ed.as ? ' · a.s. ' + esc(ed.as) : '') + '</div></div></header>' +
      '<div class="tit">I tuoi accessi al glossario</div><div class="nome">' + esc(a.nome) + '</div>' +
      '<div class="gr">Classe ' + esc(cl) + ' · scritto e quiz, da casa, dal telefono o dal PC</div>' +
      '<div class="cal">' + box('Inizio scritto', dt.partenza, '#1F5FA8') + box('Fine scritto', dt.scadenzaIt, '#1F5FA8') + box('Inizio quiz', qIni, '#6B4EA2') + box('Fine quiz', qFin, '#6B4EA2') + '</div>' +
      blocco('1', '#1F5FA8', '', '', 'Lo scritto', qrSvg(linkS, 33), host, a.codice, '',
        'Inquadra il QR: entri direttamente. Per ognuno dei tuoi termini scegli la definizione corretta' + (EN() ? ', prima in italiano e poi in inglese' : '') + '; il docente approva o ti chiede di correggere.') +
      blocco('2', '#6B4EA2', '#EFEAF7', '#4B3480', 'Il quiz', qrSvg(linkQ, 33), host + '/quiz', a.codice, '<b>Stesso codice dello scritto</b>',
        'Si apre a fine scritto. Indovina i termini di tutto il glossario: superato il quiz sei ammesso all\'interrogazione, la verifica finale.') +
      blocco('3', '#2E7D32', '#E6F2E6', '#1E5E22', 'Il ripasso', qrSvg(linkP, 33), host + '/glossario', '', '<b>Senza codice</b>',
        'Dopo che i quiz saranno terminati per ognuno, potrai esercitarti alla pagina <b>' + esc(host) + '/glossario</b> in vista dell\'interrogazione.') +
      '<div class="warn"><b>Codice e QR sono personali.</b> Non fotografarli e non darli a nessuno: quello che si fa con il tuo codice risulta tuo.</div>' +
      '<footer>' + esc(docenteAtt()) + (Poster.conc() ? ' · ' + Poster.concessione : '') + (EN() ? ' &nbsp;—&nbsp; Prof.ssa Federica Aliboni · Inglese tecnico' : '') + '</footer></section>';
  }).join('');
  var css = '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"Atkinson Hyperlegible",Arial,sans-serif;color:#15212B;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.pg{width:210mm;height:297mm;padding:14mm 16mm 12mm;display:flex;flex-direction:column;page-break-after:always;break-after:page;overflow:hidden}.pg:last-child{page-break-after:auto;break-after:auto}' +
    'header{display:flex;gap:5mm;align-items:center;border-bottom:1.2pt solid #15212B;padding-bottom:3.5mm}.sc{font-family:Archivo,Arial,sans-serif;font-weight:800;font-size:14pt}.pr{font-size:10pt;color:#5B6976;margin-top:1mm}' +
    '.tit{font-family:Archivo,Arial,sans-serif;font-weight:800;font-size:11.5pt;letter-spacing:.14em;text-transform:uppercase;margin-top:4mm}' +
    '.nome{font-family:Archivo,Arial,sans-serif;font-weight:900;font-size:27pt;line-height:1.1;margin-top:1mm}.gr{align-self:flex-start;border-left:3mm solid #15212B;padding:1mm 3mm;font-size:11.5pt;margin-top:2mm;background:#F2F5F7}' +
    '.cal{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:4mm}.cal>div{background:#F2F5F7;border-radius:0 0 2mm 2mm;padding:2.5mm 3mm;display:flex;flex-direction:column}.cal span{font-size:8.5pt;text-transform:uppercase;letter-spacing:.06em;color:#5B6976}.cal b{font-family:Archivo,Arial,sans-serif;font-size:13pt;margin-top:.5mm}.cal small{font-size:9.5pt;color:#5B6976}' +
    '.bl{border:1.4pt solid;border-radius:3mm;margin-top:4mm;overflow:hidden}.bt{color:#fff;font-family:Archivo,Arial,sans-serif;font-weight:800;font-size:13pt;letter-spacing:.06em;text-transform:uppercase;padding:2mm 4mm}' +
    '.bc{display:flex;gap:5mm;padding:3mm 4mm;align-items:center}.bl:last-of-type{margin-bottom:4mm}.bc svg{flex:none;border:1pt solid #C3CED7;border-radius:2mm}.bi{min-width:0}.lb{font-size:8.5pt;color:#5B6976;text-transform:uppercase;letter-spacing:.06em}' +
    '.url{font-weight:700;font-size:13pt;margin-top:.5mm;word-break:break-all}.cod{font-family:"Courier New",monospace;font-weight:700;font-size:19pt;letter-spacing:.18em}.nt{display:inline-block;font-size:10pt;padding:1mm 2.5mm;border-radius:2mm;margin-top:1mm}.bi p{font-size:10.5pt;margin:2mm 0 0;line-height:1.35}' +
        '.warn{margin-top:auto;margin-bottom:0;border:1pt solid #E5B9B4;background:#FBEDEB;border-radius:2mm;padding:2.5mm 3.5mm;font-size:10pt}footer{margin-top:3mm;font-size:9pt;color:#5B6976;text-align:right}';
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per stampare', true); return; }
  w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Accessi Glossario ' + esc(classe && classe !== 'tutte' ? classe : CLASSI().join('-')) + '</title>' +
    '<style>' + cssFonti(location.origin) + css + '</style></head><body>' + pagine +
    scriptStampa('document.body.setAttribute("data-pronto","1");setTimeout(function(){window.print()},400)') + '</body></html>');
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
