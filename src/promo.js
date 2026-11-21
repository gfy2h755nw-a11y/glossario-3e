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
