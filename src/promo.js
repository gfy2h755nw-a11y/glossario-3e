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
        '<p class="muted" style="margin:0;font-size:14px">Dati reali di tutte le attività in corso, aggiornati al ' + esc(dataOra(N.aggiornato)) + '. Si aggiornano da soli ogni minuto, come nell\'app.</p>'
        : '<p class="muted" style="margin:0">I numeri si calcolano alla prima apertura della pagina, oppure con «Aggiorna ora».</p>') + '</div>' +
    '<div class="stack" style="gap:8px"><h3 style="margin:0;font-size:18px">Chi ha aperto la pagina</h3>' +
      (V.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Collega</th><th>Prima visita</th><th>Ultima visita</th><th class="c">Volte</th><th class="c">Tempo sulla pagina</th><th class="c">In media</th><th></th></tr></thead><tbody>' +
        V.map(function (v) { return '<tr><td><b>' + esc(v.nome + ' ' + v.cognome) + '</b></td><td>' + esc(dataOra(v.prima)) + '</td><td>' + esc(dataOra(v.ultima)) + '</td><td class="c">' + (v.volte || 1) + '</td><td class="c"><b>' + tempoPromo(v.secondi) + '</b></td><td class="c">' + (v.secondi ? tempoPromo(Math.round(v.secondi / (v.volte || 1))) : '—') + '</td><td class="c"><button class="btn sec tb prTogli" data-n="' + esc(v.nome) + '" data-c="' + esc(v.cognome) + '" onclick="togliPromo(this)">Togli</button></td></tr>'; }).join('') +
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

/* durata leggibile: 45 s · 12 min · 1 h 05 min */
function tempoPromo(s) { s = Math.round(s || 0); if (!s) return '—'; if (s < 60) return s + ' s'; var m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + ('0' + (m % 60)).slice(-2) + ' min'; }
/* togli un collega dall'elenco: primo tocco chiede conferma */
function togliPromo(btn) {
  if (btn.getAttribute('data-ok') !== '1') { btn.setAttribute('data-ok', '1'); btn.textContent = 'Conferma'; btn.classList.add('warn'); setTimeout(function () { if (btn.isConnected && btn.getAttribute('data-ok') === '1') { btn.setAttribute('data-ok', ''); btn.textContent = 'Togli'; btn.classList.remove('warn'); } }, 5000); return; }
  btn.disabled = true;
  api('promotogli', { nome: btn.getAttribute('data-n'), cognome: btn.getAttribute('data-c') }).then(function (x) { S.pr.visite = x.visite; disegnaPromo(); toast('Collega tolto dall\'elenco'); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e)); });
}

/* ---------- Glossario riservato (24/11/2026): pagina segreta /r/CODICE per i docenti di sostegno ----------
 * Pubblica / annulla, link con il codice dentro, chi è entrato (nome, data, ora, tempo di ogni ingresso). */
function paginaRiservata() {
  return '<section class="card stack" id="risBox"><h2 style="margin:0;font-size:22px">Glossario riservato</h2><p class="muted" style="margin:0">Carico…</p></section>';
}
function avviaRiservata() {
  if (S.ris) disegnaRiservata();
  api('riservatastato', {}).then(function (x) { S.ris = x; disegnaRiservata(); })
    .catch(function (e) { var b = $('risBox'); if (b) b.innerHTML = '<p class="note warn" style="margin:0">' + esc(errMsg(e)) + '</p>'; });
}
function linkRiservata() { return location.origin + '/r/' + S.ris.codice; }
function messaggioRiservata() {
  return 'Ciao! Ecco il glossario odontotecnico con tutti i termini e le definizioni approvate, sempre aggiornato e con la ricerca.\n' +
    linkRiservata() + '\nIl codice è già nel link: aprilo e scrivi nome e cognome. Il link è riservato: per favore non inoltrarlo.\nProf. Danilo Cerrato';
}
function dataOraRis(iso) { var d = new Date(iso); return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Rome' }) + ' · ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }); }
function disegnaRiservata() {
  var b = $('risBox'); if (!b || !S.ris) return;
  var R = S.ris, V = R.visite || [], on = R.attiva, link = linkRiservata(), tot = (R.glossari || []).reduce(function (n, g) { return n + g.termini; }, 0);
  b.innerHTML = '<div class="row" style="justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0;font-size:22px">Glossario riservato</h2>' +
      '<span class="chip ' + (on ? 's-approvata' : 's-vuota') + '">' + (on ? '● Pubblicato' : 'Non pubblicato') + '</span></div>' +
    '<p class="muted" style="margin:0;max-width:75ch">Per i docenti di sostegno: tutti i termini con le definizioni che approvi, di tutte le tue attività, con la ricerca. Niente nomi degli studenti e nessun\'altra funzione. Si aggiorna da solo (entro un minuto da ogni approvazione). Non è collegato alla pagina pubblica e non compare nei motori di ricerca. Chi apre il link scrive nome e cognome e compare qui sotto.</p>' +
    '<div class="ris-st ' + (on ? 'on' : 'off') + '"><span>' + (on ? '<b>Pubblicato</b> · chi ha il link lo vede' : '<b>Non pubblicato</b> · chi apre il link vede «pagina non disponibile»') + '</span>' +
      (on ? '<button class="btn sec" style="border-color:#B0304A;color:#B0304A" onclick="impostaRiservata(false, this)">Annulla la pubblicazione</button>' : '<button class="btn" onclick="impostaRiservata(true, this)">Pubblica</button>') + '</div>' +
    '<div class="stack" style="gap:8px"><label style="font-weight:700">Link da condividere · il codice <span style="font-family:monospace;letter-spacing:.12em">' + esc(R.codice) + '</span> è già dentro</label>' +
      '<div style="font-family:monospace;font-size:15px;padding:12px 14px;border:2px solid var(--line);border-radius:10px;word-break:break-all;user-select:all" id="risLink">' + esc(link) + '</div>' +
      '<div class="row" style="flex-wrap:wrap"><button class="btn" onclick="copiaTesto(messaggioRiservata(), this)">Copia il messaggio con il link</button>' +
      '<a class="btn sec" href="https://wa.me/?text=' + encodeURIComponent(messaggioRiservata()) + '" target="_blank" rel="noopener">Invia su WhatsApp</a>' +
      '<button class="btn sec" onclick="copiaTesto(linkRiservata(), this)">Copia solo il link</button>' +
      (on ? '<a class="btn sec" href="' + esc(link) + '" target="_blank" rel="noopener">Apri la pagina</a>' : '') +
      '<button class="btn sec" onclick="nuovoCodiceRiservata(this)">Cambia codice</button></div>' +
      '<p class="muted" id="risAvviso" style="margin:0;font-size:14px">Cambiando codice il link attuale smette subito di funzionare; i colleghi già entrati restano nell\'elenco.</p></div>' +
    '<p class="muted" style="margin:0;font-size:14px">Contenuto: <b>' + tot + '</b> termini approvati · ' + (R.glossari || []).map(function (g) { return esc((g.classi || []).join(' e ') || g.nome) + ' ' + g.termini; }).join(' · ') + '</p>' +
    '<div class="stack" style="gap:8px"><h3 style="margin:0;font-size:18px">Chi è entrato</h3>' +
      (V.length ? '<div style="overflow-x:auto"><table class="tbl" id="risTab"><thead><tr><th>Collega</th><th>Ultimo ingresso</th><th class="c">Ingressi</th><th class="c">Tempo totale</th><th>Ingressi (data, ora e tempo)</th><th></th></tr></thead><tbody>' +
        V.map(function (v, i) {
          var A = (v.accessi || []).slice().reverse();
          return '<tr><td><b>' + esc(v.nome + ' ' + v.cognome) + '</b><div class="muted" style="font-size:12px">dal ' + esc(dataOraRis(v.prima).split(' · ')[0]) + '</div></td><td>' + esc(dataOraRis(v.ultima)) + '</td><td class="c">' + (v.volte || 1) + '</td><td class="c"><b>' + tempoPromo(v.secondi) + '</b></td>' +
            '<td><details><summary style="cursor:pointer;color:var(--acc-d,#0E7C7B);font-weight:700">Vedi ' + A.length + '</summary><ul class="risacc">' + A.map(function (a) { return '<li>' + esc(dataOraRis(a.il)) + ' · <b>' + tempoPromo(a.sec) + '</b></li>'; }).join('') + '</ul></details></td>' +
            '<td><button class="btn sec" style="padding:6px 10px;min-height:0" data-i="' + i + '" onclick="togliRiservata(this)">Togli</button></td></tr>';
        }).join('') + '</tbody></table></div><p class="muted" style="margin:0;font-size:13px">Il tempo conta solo con la pagina aperta in primo piano. «Togli» cancella il collega dall\'elenco (non gli toglie l\'accesso: per quello cambia codice).</p>'
        : '<p class="muted" style="margin:0">Nessun collega è ancora entrato.</p>') + '</div>';
}
function impostaRiservata(on, btn) {
  btn.disabled = true;
  api('riservataimposta', { attiva: on }).then(function (x) { S.ris = x; disegnaRiservata(); toast(on ? 'Glossario riservato pubblicato' : 'Pubblicazione annullata: il link ora mostra «non disponibile»'); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function nuovoCodiceRiservata(btn) {
  if (!btn.dataset.ok) { btn.dataset.ok = '1'; btn.textContent = 'Sì, cambia il codice'; btn.className = 'btn'; btn.style.background = '#B3261E';
    $('risAvviso').innerHTML = '<b>Sicuro?</b> Il link che hai già mandato non funzionerà più. Clicca di nuovo per confermare.'; return; }
  btn.disabled = true;
  api('riservatacodice', {}).then(function (x) { S.ris = x; disegnaRiservata(); toast('Nuovo codice: manda il nuovo link ai colleghi'); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function togliRiservata(btn) {
  var v = S.ris.visite[Number(btn.getAttribute('data-i'))]; if (!v) return;
  if (btn.getAttribute('data-ok') !== '1') { btn.setAttribute('data-ok', '1'); btn.textContent = 'Conferma'; return; }
  btn.disabled = true;
  api('riservatatogli', { nome: v.nome, cognome: v.cognome }).then(function (x) { S.ris = x; disegnaRiservata(); toast('Tolto dall\'elenco'); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
