/* ---------- Banca termini: i termini da cui attingono le nuove attività ----------
 * Elenco per area (banca del laboratorio ed elenchi pronti), con ricerca, aggiunta (anche molti insieme),
 * correzione, rimozione e ripristino. Il server controlla i doppioni su tutte le aree e sul glossario 2026/27. */
function paginaBanca() {
  return '<section class="card stack" id="bancaBox"><h2 style="margin:0;font-size:22px">Banca termini</h2><p class="muted" style="margin:0">Carico i termini…</p></section>';
}
function avviaBanca() {
  if (S.bk && S.bk.dati) disegnaBanca();
  api('banca', {}).then(function (x) {
    S.bk = S.bk || { f: x.fonti[0].f, q: '', pag: 0 };
    S.bk.dati = x;
    if (!x.fonti.some(function (y) { return y.f === S.bk.f; })) S.bk.f = x.fonti[0].f;
    disegnaBanca();
  }).catch(function (e) { var b = $('bancaBox'); if (b) b.innerHTML = '<p class="note warn" style="margin:0">' + esc(errMsg(e)) + '</p>'; });
}
function fonteBk() { return S.bk.dati.fonti.filter(function (y) { return y.f === S.bk.f; })[0]; }
function disegnaBanca() {
  var b = $('bancaBox'); if (!b || !S.bk || !S.bk.dati) return;
  var X = S.bk.dati, F = fonteBk(), q = S.bk.q.toLowerCase().trim(), gruppi = [];
  X.fonti.forEach(function (y) { if (gruppi.indexOf(y.gruppo) < 0) gruppi.push(y.gruppo); });
  var sel = '<select id="bkF" onchange="S.bk.f=this.value;S.bk.pag=0;S.bk.mod=null;disegnaBanca()" style="min-height:44px;font:inherit;padding:0 10px;border:2px solid var(--line);border-radius:10px;max-width:100%">' +
    gruppi.map(function (g) { return '<optgroup label="' + esc(g) + '">' + X.fonti.filter(function (y) { return y.gruppo === g; }).map(function (y) { return '<option value="' + esc(y.f) + '"' + (y.f === S.bk.f ? ' selected' : '') + '>' + esc(y.it) + ' (' + y.termini.length + ')</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>';
  var T = F.termini.filter(function (x) { return !q || x[0].toLowerCase().indexOf(q) >= 0 || x[1].toLowerCase().indexOf(q) >= 0; });
  var nUs = F.termini.filter(function (x) { return x[4]; }).length, nAgg = F.termini.filter(function (x) { return x[2] === 'aggiunto'; }).length;
  var PER = 60, pagine = Math.max(1, Math.ceil(T.length / PER)); if (S.bk.pag >= pagine) S.bk.pag = 0;
  var vis = T.slice(S.bk.pag * PER, S.bk.pag * PER + PER);
  var stato = function (x) {
    return (x[2] === 'aggiunto' ? '<span class="chip s-approvata">aggiunto da te</span> ' : x[2] === 'corretto' ? '<span class="chip s-inviata">corretto da te</span> ' : '') + (x[4] ? '<span class="chip s-correggere">già usato</span>' : '');
  };
  var righe = vis.map(function (x) {
    var k = x[3], ed = S.bk.mod === k;
    if (ed) return '<tr class="bked"><td colspan="3"><div class="stack" style="gap:6px"><label for="bkEt">Termine</label><input id="bkEt" type="text" maxlength="60" value="' + esc(x[0]) + '">' +
      '<label for="bkEd">Definizione</label><textarea id="bkEd" rows="3" maxlength="220" style="width:100%;font:inherit;padding:8px 10px;border:2px solid var(--line);border-radius:10px">' + esc(x[1]) + '</textarea>' +
      '<div class="row" style="gap:6px"><button class="btn ok" style="min-height:38px" onclick="salvaBk(\'cor\',\'' + esc(k) + '\',this)">Salva la correzione</button><button class="btn sec" style="min-height:38px" onclick="S.bk.mod=null;disegnaBanca()">Annulla</button></div></div></td></tr>';
    return '<tr><td><b>' + esc(x[0]) + '</b><div style="margin-top:3px">' + stato(x) + '</div></td><td>' + esc(x[1]) + '</td><td style="white-space:nowrap"><button class="btn sec" style="min-height:34px;padding:0 10px;font-size:14px" onclick="S.bk.mod=\'' + esc(k) + '\';disegnaBanca()">Correggi</button> ' +
      '<button class="btn sec" style="min-height:34px;padding:0 10px;font-size:14px" onclick="toglieBk(\'' + esc(k) + '\',this)" aria-label="Togli ' + esc(x[0]) + '">Togli</button></td></tr>';
  }).join('');
  var tolti = (X.tolti[S.bk.f] || []);
  b.innerHTML = '<p class="muted" style="margin:0;font-size:15px">Da qui le nuove attività prendono i termini. Le modifiche valgono per le attività che crei da ora in poi; quelle già create non cambiano.</p>' +
    '<div class="grid2"><div><label for="bkF">Area</label>' + sel + '</div><div><label for="bkQ">Cerca nel termine o nella definizione</label><input id="bkQ" type="text" placeholder="es. spatola" value="' + esc(S.bk.q) + '" oninput="S.bk.q=this.value;S.bk.pag=0;disegnaBanca();var e=$(\'bkQ\');e.focus();e.setSelectionRange(e.value.length,e.value.length)"></div></div>' +
    '<p style="margin:0"><span class="wzq" style="background:' + esc(F.colore) + '"></span> <b>' + esc(F.it) + '</b> · ' + F.termini.length + ' termini · già usati in un\'attività: ' + nUs + ' · aggiunti da te: ' + nAgg + '</p>' +
    '<details class="bkagg"' + (S.bk.aperto ? ' open' : '') + ' ontoggle="S.bk.aperto=this.open"><summary><b>+ Aggiungi termini a quest\'area</b></summary><div class="stack" style="gap:8px;margin-top:10px">' +
    '<div class="grid2"><div><label for="bkNt">Termine</label><input id="bkNt" type="text" maxlength="60"></div><div><label for="bkNd">Definizione</label><input id="bkNd" type="text" maxlength="220"></div></div>' +
    '<div><button class="btn" onclick="salvaBk(\'agg\',null,this)">Aggiungi</button></div>' +
    '<label for="bkMolti">Oppure incolla più termini, uno per riga: <i>termine | definizione</i> (vanno bene anche due colonne copiate da Excel)</label><textarea id="bkMolti" rows="5" style="width:100%;font:inherit;padding:10px;border:2px solid var(--line);border-radius:10px"></textarea>' +
    '<div><button class="btn sec" onclick="aggiungiMoltiBk(this)">Aggiungi tutti</button></div><div id="bkEsito"></div>' +
    '<p class="muted" style="margin:0;font-size:14px">Il termine viene rifiutato se esiste già, anche con parole diverse, in una qualsiasi area o nel glossario 2026/27.</p></div></details>' +
    (T.length ? '<div style="overflow-x:auto"><table class="tbl bktab"><thead><tr><th style="width:24%">Termine</th><th>Definizione</th><th style="width:150px"></th></tr></thead><tbody>' + righe + '</tbody></table></div>' : '<p class="muted" style="margin:0">Nessun termine' + (q ? ' trovato con «' + esc(S.bk.q) + '»' : '') + '.</p>') +
    (pagine > 1 ? '<div class="row" style="gap:6px;justify-content:center">' + Array.from({ length: pagine }, function (z, i) { return '<button class="btn ' + (i === S.bk.pag ? '' : 'sec') + '" style="min-height:34px;padding:0 12px" onclick="S.bk.pag=' + i + ';disegnaBanca()">' + (i + 1) + '</button>'; }).join('') + '</div>' : '') +
    (tolti.length ? '<details><summary>Termini tolti da quest\'area (' + tolti.length + ')</summary><div class="stack" style="gap:6px;margin-top:8px">' + tolti.map(function (x) { return '<div class="row" style="justify-content:space-between;gap:8px;border-bottom:1px solid var(--line);padding-bottom:6px"><span><b>' + esc(x[0]) + '</b> — ' + esc(x[1]) + '</span><button class="btn sec" style="min-height:34px;padding:0 10px;font-size:14px" onclick="salvaBk(\'ripristina\',\'' + esc(x[2]) + '\',this)">Rimetti</button></div>'; }).join('') + '</div></details>' : '');
  if (S.bk.mod && $('bkEt')) $('bkEt').focus();
}
function ricaricaBk(msg) {
  return api('banca', {}).then(function (x) { S.bk.dati = x; S.bk.mod = null; disegnaBanca(); if (msg) toast(msg); });
}
function salvaBk(op, k, btn) {
  var p = { op: op, fonte: S.bk.f };
  if (k) p.k = k;
  if (op === 'agg') { p.t = $('bkNt').value; p.d = $('bkNd').value; if (!p.t.trim() || !p.d.trim()) { toast('Scrivi termine e definizione.', true); return; } }
  if (op === 'cor') { p.t = $('bkEt').value; p.d = $('bkEd').value; }
  btn.disabled = true;
  api('bancasalva', p).then(function () { return ricaricaBk(op === 'agg' ? 'Termine aggiunto' : op === 'cor' ? 'Correzione salvata' : 'Termine rimesso nell\'area'); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function toglieBk(k, btn) {
  var x = fonteBk().termini.filter(function (y) { return y[3] === k; })[0]; if (!x) return;
  finestra('Togliere il termine?', '<p style="margin:0"><b>' + esc(x[0]) + '</b> non verrà più proposto nelle nuove attività. ' + (x[2] === 'aggiunto' ? 'È un termine aggiunto da te: viene cancellato.' : 'Lo trovi in fondo alla pagina, tra i termini tolti, e puoi rimetterlo quando vuoi.') + '</p>' +
    '<p class="muted" style="margin:0">Le attività già create non cambiano.</p>',
    [{ t: 'Togli', warn: true, f: function () { btn.disabled = true; api('bancasalva', { op: 'via', fonte: S.bk.f, k: k }).then(function () { return ricaricaBk('Termine tolto'); }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); }); } }]);
}
function aggiungiMoltiBk(btn) {
  var righe = String($('bkMolti').value || '').split(/\r?\n/).map(function (r) { return r.trim(); }).filter(Boolean).map(function (r) {
    var p = /\t/.test(r) ? r.split('\t') : /\|/.test(r) ? r.split('|') : /;/.test(r) ? r.split(';') : [r, ''];
    return [String(p[0] || '').trim(), p.slice(1).join(' ').trim()];
  });
  if (!righe.length) { toast('Incolla almeno un termine.', true); return; }
  btn.disabled = true; btn.textContent = 'Controllo i doppioni…';
  api('bancasalva', { op: 'aggmolti', fonte: S.bk.f, righe: righe }).then(function (x) {
    return ricaricaBk().then(function () {
      var e = $('bkEsito'); S.bk.aperto = true;
      if ($('bkMolti') && x.saltati.length) $('bkMolti').value = x.saltati.map(function (s) { var r = righe.filter(function (y) { return y[0].replace(/\s+/g, ' ').trim() === s.t; })[0]; return r ? r[0] + ' | ' + r[1] : s.t; }).join('\n');
      if (e) e.innerHTML = '<div class="note ' + (x.saltati.length ? 'warn' : 'ok') + '" style="margin:0"><b>' + x.aggiunti + ' aggiunti.</b>' + (x.saltati.length ? ' ' + x.saltati.length + ' non aggiunti (sono rimasti nel riquadro, da correggere):<ul style="margin:6px 0 0;padding-left:20px">' +
        x.saltati.map(function (s) { return '<li><b>' + esc(s.t) + '</b>: ' + (s.simile ? 'simile a «' + esc(s.simile) + '» in ' + esc(s.dove) : esc(s.motivo)) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
      toast(x.aggiunti + ' termini aggiunti');
    });
  }).catch(function (e) { toast(errMsg(e), true); }).then(function () { if (btn) { btn.disabled = false; btn.textContent = 'Aggiungi tutti'; } });
}
