/* ---------- salute dell'app: errori segnalati in automatico e riquadro nel cruscotto ---------- */
(function () {
  // errori del browser (app di docenti e studenti): pochi per sessione, mai due volte lo stesso
  var inviati = 0, visti = {};
  function invia(msg, det) {
    msg = String(msg || '').slice(0, 300); if (!msg || inviati >= 5 || visti[msg]) return; visti[msg] = 1; inviati++;
    var u = (window.S && S.d && S.d.utente) || null;
    try {
      fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ azione: 'erroreclient', origine: 'app', messaggio: msg, dettaglio: String(det || '').slice(0, 900),
        ruolo: u ? (u.ruolo === 'alunno' ? 'studente' : u.admin ? 'prof. Cerrato' : 'docente') : 'accesso', pagina: (window.S && S.pag) || '', disp: /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent) ? 'telefono' : 'PC' }) }).catch(function () {});
    } catch (e) { /* niente */ }
  }
  window.addEventListener('error', function (e) { invia(e.message, (e.filename || '') + ':' + (e.lineno || '') + ':' + (e.colno || '') + '\n' + ((e.error && e.error.stack) || '')); });
  // le risposte del server con un messaggio (es. «codice non riconosciuto») e la rete assente non sono errori dell'app
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; if (r && (r.rete || r.api)) return; invia((r && r.message) || String(r), r && r.stack); });
})();

var SAL = { dati: null };
function quandoBreve(iso) { var d = new Date(iso), oggi = new Date(); var stesso = d.toDateString() === oggi.toDateString(); return (stesso ? 'oggi' : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })) + ' alle ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); }
/* avviso in cima: errori nuovi dall'ultima volta che li hai visti */
function bannerSalute() {
  var s = S.d.salute; if (!s || !ADM() || !s.nuovi) return '';
  return '<div class="note err" id="bannerSalute" role="status"><div class="row" style="justify-content:space-between;gap:10px;align-items:center"><span><b>Salute dell\'app: ' + s.nuovi + (s.nuovi === 1 ? ' errore nuovo' : ' errori nuovi') + '.</b> Li trovi nel Quadro generale, pronti da copiare e mandarmi.</span>' +
    '<button class="btn sec" onclick="vai(\'cruscotto\');setTimeout(function(){var b=document.getElementById(\'salBox\');if(b)b.scrollIntoView({block:\'start\'});},120)">Vedi</button></div></div>';
}
/* riquadro nel cruscotto (solo il prof. Cerrato) */
function bloccoSalute() {
  var s = S.d.salute; if (!s || !ADM() || RO()) return '';
  if (!s.totale) return '<section class="card" id="salBox" style="padding:12px 16px;display:flex;gap:10px;align-items:center;border-left:5px solid var(--ok)"><b style="color:var(--ok)">✓ Salute dell\'app</b><span class="muted">nessun errore negli ultimi 30 giorni</span></section>';
  return '<section class="card stack" id="salBox" style="gap:10px;border-left:5px solid ' + (s.nuovi ? 'var(--err)' : '#E0A100') + '"><div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><h2 class="h2s" style="margin:0">Salute dell\'app</h2>' +
    '<span class="muted" id="salStato">' + (s.nuovi ? '<b style="color:var(--err)">' + s.nuovi + (s.nuovi === 1 ? ' errore nuovo' : ' errori nuovi') + '</b> · ' : '') + s.totale + (s.totale === 1 ? ' tipo di errore' : ' tipi di errore') + ' negli ultimi 30 giorni</span></div>' +
    '<div id="salIn"><button class="btn sec" onclick="caricaSalute()">Mostra gli errori</button></div></section>';
}
function caricaSalute() {
  var el = document.getElementById('salIn'); if (el) el.innerHTML = '<p class="muted" style="margin:0">Caricamento…</p>';
  api('salute').then(function (d) {
    SAL.dati = d; var el = document.getElementById('salIn'); if (!el) return;
    el.innerHTML = '<div class="stack" style="gap:8px">' + d.errori.map(function (x, i) {
      var nuovo = x.ultimo > d.letti && x.livello === 'errore';
      return '<div class="salr' + (nuovo ? ' nuovo' : '') + '"><div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><div style="min-width:0"><b>' + (nuovo ? '<span class="salnu">NUOVO</span> ' : '') + esc(x.messaggio) + '</b>' +
        '<div class="muted" style="font-size:13px">' + esc(x.dove) + (x.azione ? ' · ' + esc(x.azione) : '') + (x.livello === 'avviso' ? ' · avviso' : '') + ' · ' + x.n + (x.n === 1 ? ' volta' : ' volte') + ' · ultima ' + esc(quandoBreve(x.ultimo)) +
        (Object.keys(x.ruoli).length ? ' · ' + esc(Object.keys(x.ruoli).join(', ')) : '') + '</div></div></div></div>';
    }).join('') + '</div><div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn" onclick="copiaSalute(this)">Copia il rapporto per Claude</button><button class="btn sec" onclick="salutVisti(this)">Segna come visti</button></div>' +
      '<p class="muted" style="margin:6px 0 0;font-size:13px">Incolla il rapporto in chat: c\'è tutto quello che mi serve per correggere. Nessun codice personale né dato degli studenti.</p>';
  }).catch(function (e) { var el = document.getElementById('salIn'); if (el) el.innerHTML = '<p class="muted" style="margin:0">' + esc(errMsg(e)) + '</p>'; });
}
function rapportoSalute() {
  var d = SAL.dati; if (!d) return '';
  return 'Rapporto «Salute dell\'app» · versione ' + VERSIONE + ' · ' + new Date().toLocaleString('it-IT') + '\n\n' + d.errori.map(function (x, i) {
    return (i + 1) + '. [' + x.dove + (x.azione ? ' · ' + x.azione : '') + '] ' + x.messaggio + '\n   ' + x.n + ' volte in ' + x.giorni + (x.giorni === 1 ? ' giorno' : ' giorni') + ', dal ' + new Date(x.primo).toLocaleString('it-IT') + ' al ' + new Date(x.ultimo).toLocaleString('it-IT') +
      (Object.keys(x.ruoli).length ? '\n   chi: ' + Object.keys(x.ruoli).map(function (k) { return k + ' (' + x.ruoli[k] + ')'; }).join(', ') : '') +
      (Object.keys(x.pagine).length ? '\n   dove: ' + Object.keys(x.pagine).join(', ') : '') + (Object.keys(x.disp).length ? '\n   dispositivo: ' + Object.keys(x.disp).join(', ') : '') +
      (x.dettaglio ? '\n   dettaglio:\n      ' + x.dettaglio.split('\n').join('\n      ') : '');
  }).join('\n\n');
}
function copiaSalute(btn) {
  var t = rapportoSalute(), fatto = function () { btn.textContent = 'Copiato ✓'; setTimeout(function () { btn.textContent = 'Copia il rapporto per Claude'; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(fatto, function () { prompt('Copia il rapporto', t); });
  else prompt('Copia il rapporto', t);
}
function salutVisti(btn) {
  btn.disabled = true;
  api('saluteletti').then(function (r) { S.d.salute = r; vistaDocente(); toast('Errori segnati come visti'); }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
