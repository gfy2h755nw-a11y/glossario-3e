/* ---------- Promo App: la pagina di presentazione per i colleghi (/scopri?c=CODICE) ----------
 * Link da condividere, numeri reali mostrati sulla pagina (con data di aggiornamento) e colleghi che l'hanno aperta. */
function paginaPromo() {
  return '<section class="card stack" id="promoBox"><h2 style="margin:0;font-size:22px">Promo App</h2><p class="muted" style="margin:0">Carico…</p></section>';
}
function avviaPromo() {
  if (S.pr) disegnaPromo();
  api('promostato', {}).then(function (x) { S.pr = x; disegnaPromo(); })
    .catch(function (e) { var b = $('promoBox'); if (b) b.innerHTML = '<p class="note warn" style="margin:0">' + esc(errMsg(e)) + '</p>'; });
}
function linkPromo() { return location.origin + '/scopri?c=' + S.pr.codice; }
/* messaggio pronto per WhatsApp: link e codice insieme */
function messaggioPromo() {
  return 'Ciao! Ti presento il Glossario odontotecnico, l\'app che uso con le mie classi per termini, quiz e interrogazioni.\n' +
    'Qui vedi come funziona: ' + linkPromo() + '\n' +
    'Codice di accesso: ' + S.pr.codice + ' (è già nel link: basta aprirlo e scrivere nome e cognome).\n' +
    'Prof. Danilo Cerrato';
}
function durataPromo(min) { min = Math.round(min || 0); return min < 60 ? min + ' min' : Math.round(min / 60).toLocaleString('it-IT') + ' h'; }
function disegnaPromo() {
  var b = $('promoBox'); if (!b || !S.pr) return;
  var P = S.pr, V = P.visite || [], N = P.numeri, link = linkPromo();
  var dataOra = function (iso) { var d = new Date(iso); return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Rome' }) + ', ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }); };
  var kpi = N ? [[N.classi, 'classi'], [N.alunni, 'alunni'], [N.termini, 'termini assegnati'], [N.perc + '%', 'definizioni approvate'], [durataPromo(N.minuti), 'tempo totale in app']] : null;
  b.innerHTML = '<div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0;font-size:22px">Promo App</h2>' +
      '<span class="chip s-approvata">' + V.length + (V.length === 1 ? ' collega' : ' colleghi') + '</span></div>' +
    '<p class="muted" style="margin:0">La pagina che spiega l\'app ai colleghi. Chi apre il link scrive nome e cognome e compare qui sotto. Le attività preparate per un collega riportano «Per gentile concessione del Prof. Danilo Cerrato».</p>' +
    '<div class="stack" style="gap:8px"><label style="font-weight:700">Link da condividere · codice <span style="font-family:monospace;letter-spacing:.12em">' + esc(P.codice) + '</span></label>' +
      '<div style="font-family:monospace;font-size:15px;padding:12px 14px;border:2px solid var(--line);border-radius:10px;word-break:break-all;user-select:all" id="prLink">' + esc(link) + '</div>' +
      '<div class="row"><button class="btn" id="prWa" onclick="copiaTesto(messaggioPromo(), this)">Copia link e codice</button>' +
      '<a class="btn sec" href="https://wa.me/?text=' + encodeURIComponent(messaggioPromo()) + '" target="_blank" rel="noopener">Invia su WhatsApp</a>' +
      '<button class="btn sec" onclick="copiaTesto(linkPromo(), this)">Copia solo il link</button>' +
      '<a class="btn sec" href="' + esc(link) + '" target="_blank" rel="noopener">Apri la pagina</a>' +
      '<button class="btn sec" id="prNuovo" onclick="nuovoCodicePromo(this)">Cambia codice</button></div>' +
      '<p class="muted" id="prAvviso" style="margin:0;font-size:14px">Cambiando codice il link attuale smette di funzionare; i colleghi già registrati restano nell\'elenco.</p></div>' +
    '<div class="stack" style="gap:8px"><div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0;font-size:18px">Numeri sulla pagina</h3>' +
      '<button class="btn sec" onclick="aggiornaNumeriPromo(this)">Aggiorna ora</button></div>' +
      (kpi ? '<div class="prk">' + kpi.map(function (k) { return '<div><b>' + esc(String(k[0])) + '</b><span>' + k[1] + '</span></div>'; }).join('') + '</div>' +
        '<p class="muted" style="margin:0;font-size:14px">Dati reali di tutte le attività in corso, aggiornati al ' + esc(dataOra(N.aggiornato)) + '. Si aggiornano da soli al massimo una volta l\'ora, quando qualcuno apre la pagina.</p>'
        : '<p class="muted" style="margin:0">I numeri si calcolano alla prima apertura della pagina, oppure con «Aggiorna ora».</p>') + '</div>' +
    bloccoDemo(P) +
    '<div class="stack" style="gap:8px"><h3 style="margin:0;font-size:18px">Chi ha aperto la pagina</h3>' +
      (V.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Collega</th><th>Prima visita</th><th>Ultima visita</th><th class="c">Volte</th></tr></thead><tbody>' +
        V.map(function (v) { return '<tr><td><b>' + esc(v.nome + ' ' + v.cognome) + '</b></td><td>' + esc(dataOra(v.prima)) + '</td><td>' + esc(dataOra(v.ultima)) + '</td><td class="c">' + (v.volte || 1) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<p class="muted" style="margin:0">Nessun collega ha ancora aperto la pagina.</p>') + '</div>';
}
function aggiornaNumeriPromo(btn) {
  btn.disabled = true; btn.textContent = 'Calcolo…';
  api('promoaggiorna', {}).then(function (x) { S.pr.numeri = x.numeri; disegnaPromo(); toast('Numeri aggiornati'); })
    .catch(function (e) { btn.disabled = false; btn.textContent = 'Aggiorna ora'; toast(errMsg(e)); });
}
/* conferma dentro la pagina: al secondo clic il codice cambia */
function nuovoCodicePromo(btn) {
  if (!btn.dataset.ok) { btn.dataset.ok = '1'; btn.textContent = 'Sì, cambia il codice'; btn.className = 'btn'; btn.style.background = '#B3261E';
    $('prAvviso').innerHTML = '<b>Sicuro?</b> Il link che hai già mandato non funzionerà più. Clicca di nuovo per confermare.'; return; }
  btn.disabled = true;
  api('promocodice', {}).then(function (x) { S.pr = x; disegnaPromo(); toast('Nuovo codice creato'); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e)); });
}

/* ---------- demo per i colleghi ---------- */
function dataDemo(iso) { return new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' }); }
/* in cima a ogni pagina della demo: cosa è, quando si cancella, codici di prova, pagina pubblica, ricomincia */
function bannerDemo() {
  var D = S.d.config.demo;
  return '<section class="card stack" id="bannerDemo" style="border:2px dashed #B4511A;background:#FFF8F1;gap:10px">' +
    '<div class="row" style="justify-content:space-between;align-items:center"><b style="font:900 18px Archivo,system-ui,sans-serif;color:#B4511A">DEMO · dati inventati</b>' +
    '<span class="muted" style="font-size:14px">si cancella da sola ' + esc(dataDemo(D.scade)) + '</span></div>' +
    '<p style="margin:0;font-size:15px">Benvenuto, ' + esc(D.nome) + '! Qui puoi provare tutto: approvare e rimandare risposte, fissare scadenze, programmare e fare interrogazioni, scaricare cartelloni, report e presentazione. <b>Niente di quello che fai tocca dati veri.</b> La classe 3A ha lo scritto concluso e il quiz in corso; la 3B ha lo scritto in corso.</p>' +
    '<div class="row" style="gap:8px"><button class="btn sec tb" onclick="codiciProva()">Prova come studente</button>' +
    '<a class="btn sec tb" href="' + esc(urlPubblico()) + '" target="_blank" rel="noopener" onclick="window.open(urlPubblico());return false">Pagina pubblica di prova</a>' +
    '<button class="btn sec tb" id="demoRic" onclick="ricominciaDemo(this)">Ricomincia la demo</button></div></section>';
}
function codiciProva() {
  var P = (S.d.config.demo && S.d.config.demo.prova) || [];
  finestra('Prova come studente', '<p style="margin:0">Apri l\'app in una <b>finestra in incognito</b> o su un altro dispositivo (' + esc(location.origin) + ') ed entra con uno di questi codici:</p>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Codice</th><th>Studente</th><th>Cosa vedi</th></tr></thead><tbody>' +
    P.map(function (x) { return '<tr><td style="font-family:monospace;font-size:18px;font-weight:700;letter-spacing:.12em">' + esc(x.codice) + '</td><td>' + esc(x.nome) + '</td><td>' + esc(x.cosa) + '</td></tr>'; }).join('') +
    '</tbody></table></div><p class="muted" style="margin:0;font-size:14px">Se entri come studente in questa stessa finestra, esci dalla demo: per rientrare usa di nuovo il tuo link.</p>', [], 'chiudi');
}
function ricominciaDemo(btn) {
  if (!btn.dataset.ok) { btn.dataset.ok = '1'; btn.textContent = 'Sì, rimetti i dati di partenza'; btn.className = 'btn tb'; btn.style.background = '#B3261E'; return; }
  btn.disabled = true;
  api('demoricomincia', {}).then(function () { return ricarica('Demo ricominciata con i dati di partenza'); }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
/* Promo App: richieste di demo e demo attive */
function bloccoDemo(P) {
  var R = (P.richieste || []).filter(function (r) { return r.stato === 'nuova'; }), Dm = P.demo || [];
  var dataOra = function (iso) { var d = new Date(iso); return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'Europe/Rome' }) + ', ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }); };
  var h = '<div class="stack" style="gap:8px" id="demoBox"><h3 style="margin:0;font-size:18px">Demo per i colleghi</h3>' +
    '<p class="muted" style="margin:0;font-size:14px">Ogni collega riceve un\'attività di prova tutta sua, con dati inventati, la programmazione di tutte le fasi e una pagina pubblica di prova. Il suo codice entra solo lì; dopo 14 giorni la demo si cancella da sola.</p>';
  if (R.length) h += '<div class="note" id="demoRichieste"><b>Richieste di demo (' + R.length + ')</b><ul style="margin:6px 0 0;padding-left:20px">' + R.map(function (r) {
    var n = r.nome + ' ' + r.cognome;
    return '<li>' + esc(n) + ' <span class="muted" style="font-size:13px">' + esc(dataOra(r.quando)) + '</span> <button class="btn tb" onclick="creaDemo(this, \'' + esc(n).replace(/'/g, '\\\'') + '\')">Crea la demo</button></li>'; }).join('') + '</ul></div>';
  h += '<div class="row" style="gap:8px"><input id="demoNome" type="text" maxlength="60" placeholder="Nome e cognome del collega" style="flex:1;min-width:220px"><button class="btn" id="demoCrea" onclick="creaDemo(this, $(\'demoNome\').value)">Crea una demo</button></div>';
  if (Dm.length) h += '<div style="overflow-x:auto"><table class="tbl" id="demoTab"><thead><tr><th>Collega</th><th>Creata</th><th>Si cancella</th><th class="c">Accessi</th><th>Ultimo accesso</th><th></th></tr></thead><tbody>' + Dm.map(function (x) {
    return '<tr data-demo="' + esc(x.id) + '"><td><b>' + esc(x.nome) + '</b></td><td>' + esc(dataOra(x.creata)) + '</td><td>' + esc(dataDemo(x.scade)) + '</td><td class="c">' + (x.accessi || 0) + '</td><td>' + (x.ultimo ? esc(dataOra(x.ultimo)) : '<span class="muted">mai</span>') + '</td>' +
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn tb" onclick="copiaTesto(messaggioDemo(\'' + esc(x.id) + '\'), this)">Copia link e codice</button><button class="btn sec tb" data-del="' + esc(x.id) + '" onclick="cancellaDemo(this, \'' + esc(x.id) + '\')">Cancella</button></div></td></tr>'; }).join('') + '</tbody></table></div>';
  return h + '</div>';
}
function messaggioDemo(id) {
  var x = (S.pr.demo || []).filter(function (y) { return y.id === id; })[0]; if (!x) return '';
  return 'Ciao! Ecco la tua demo del Glossario: entra da qui ' + location.origin + '/?c=' + x.codice + '\n' +
    'Il tuo codice: ' + x.codice + '. È un\'attività di prova tutta tua, con dati inventati: puoi provare tutto senza toccare nulla di vero.\n' +
    'Si cancella da sola ' + dataDemo(x.scade) + '.\nProf. Danilo Cerrato';
}
function creaDemo(btn, nome) {
  nome = String(nome || '').trim(); if (nome.length < 3) { toast('Scrivi nome e cognome del collega', true); return; }
  btn.disabled = true; var t = btn.textContent; btn.textContent = 'Preparo la demo…';
  api('promocreademo', { nome: nome }).then(function (x) {
    return api('promostato', {}).then(function (P) { S.pr = P; disegnaPromo(); toast('Demo pronta per ' + x.nome + ': codice ' + x.codice); });
  }).catch(function (e) { btn.disabled = false; btn.textContent = t; toast(errMsg(e), true); });
}
function cancellaDemo(btn, id) {
  if (!btn.dataset.ok) { btn.dataset.ok = '1'; btn.textContent = 'Sì, cancella'; btn.className = 'btn tb'; btn.style.background = '#B3261E'; return; }
  btn.disabled = true;
  api('promocancellademo', { id: id }).then(function () { return api('promostato', {}).then(function (P) { S.pr = P; disegnaPromo(); toast('Demo cancellata'); }); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
