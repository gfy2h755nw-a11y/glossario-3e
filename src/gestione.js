/* Glossario – funzioni del docente: da sollecitare, proroghe e passaggio dei termini, edizioni e archivio, generatore di termini */

/* ---------- utilità ---------- */
function finestra(titolo, testo, scelte, largo) {
  var o = document.createElement('div');
  o.id = 'riamm';
  o.setAttribute('style', 'position:fixed;inset:0;background:rgba(21,33,43,.55);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px');
  o.innerHTML = '<div class="card stack" role="dialog" aria-modal="true" aria-labelledby="riammT" style="max-width:' + (largo ? 720 : 560) + 'px;width:100%;max-height:90vh;overflow:auto;background:#fff"><h2 id="riammT" style="margin:0;font-size:21px">' + esc(titolo) + '</h2>' + testo +
    '<div class="stack" style="gap:8px">' + scelte.map(function (c, i) { return '<button class="btn' + (c.warn ? ' warn' : '') + '" data-i="' + i + '" style="text-align:left;height:auto;padding:10px 14px;display:block">' + esc(c.t) + (c.s ? '<br><span style="font-weight:400;font-size:14px;opacity:.85">' + esc(c.s) + '</span>' : '') + '</button>'; }).join('') +
    '<button class="btn sec" data-i="x">Annulla</button></div></div>';
  document.body.appendChild(o);
  var chiudi = function () { o.remove(); document.removeEventListener('keydown', tasto); };
  var tasto = function (e) { if (e.key === 'Escape') chiudi(); };
  document.addEventListener('keydown', tasto);
  o.addEventListener('click', function (e) { if (e.target === o) chiudi(); });
  o.querySelectorAll('button[data-i]').forEach(function (b) { b.onclick = function () { var i = b.getAttribute('data-i'); chiudi(); if (i !== 'x') scelte[Number(i)].f(); }; });
  o.querySelector('button').focus();
}
function scaricaB64(nome, b64, tipo) {
  var bin = atob(b64), u8 = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  var url = URL.createObjectURL(new Blob([u8], { type: tipo }));
  var a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}
function fraTempo(ms) {
  if (ms <= 0) return 'scaduta';
  var g = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24;
  if (!g) return h ? h + (h === 1 ? ' ora' : ' ore') : 'meno di un\'ora';
  return g + (g === 1 ? ' giorno' : ' giorni') + (h ? ' e ' + h + (h === 1 ? ' ora' : ' ore') : '');
}
function localeTra(giorni, ora) { var d = new Date(Date.now() + giorni * 86400000); d.setHours(ora == null ? 23 : ora, ora == null ? 59 : 0, 0, 0); return isoLocale(d.toISOString()); }
function datePerClasse(c) { var A = S.d.admin; return (A && A.date && A.date[c]) || { partenza: S.d.config.partenza, scadenzaIt: S.d.config.scadenzaIt }; }
function RO() { return !!(S.d && S.d.solaLettura); }
function panDi(id) { return (S.d.panoramica || []).filter(function (r) { return r.id === id; })[0] || {}; }

/* ---------- da sollecitare ---------- */
function bloccoSollecito() {
  var now = Date.now();
  var righe = (S.d.panoramica || []).filter(function (r) { return inClasse(r.id) && !r.escluso && ((r.mancaIt || 0) > 0 || (r.rimandate || 0) > 0 || (r.mancaRicevuti || 0) > 0); }).map(function (r) {
    var mieiMancanti = Math.max(0, (r.mancaIt || 0) - (r.mancaRicevuti || 0));
    var sc = mieiMancanti || r.rimandate ? Date.parse(r.scadenza) : Infinity, scR = r.mancaRicevuti && r.scadenzaRicevuti ? Date.parse(r.scadenzaRicevuti) : Infinity;
    return { r: r, mai: mieiMancanti, rim: r.rimandate || 0, ric: r.mancaRicevuti || 0, prima: Math.min(sc, scR), sc: sc, scR: scR };
  }).sort(function (a, b) { return a.prima - b.prima || (b.mai + b.ric) - (a.mai + a.ric) || a.r.nome.localeCompare(b.r.nome, 'it'); });
  var cella = function (ms) {
    if (!isFinite(ms)) return '<span class="muted">—</span>';
    var resta = ms - now, col = resta <= 0 ? 'var(--err)' : resta < 2 * 86400000 ? '#9A4A00' : 'var(--ink)';
    return '<span style="white-space:nowrap">' + esc(oraIt(new Date(ms).toISOString())) + '</span><br><b style="color:' + col + '">' + (resta <= 0 ? 'scaduta' : 'mancano ' + esc(fraTempo(resta))) + '</b>';
  };
  var partenza = function (r) { var p = datePerClasse(r.classe || '3E').partenza; return p && Date.parse(p) > now ? '<br><span class="muted" style="font-size:13px">la classe parte ' + esc(oraIt(p)) + '</span>' : ''; };
  var corpo = righe.map(function (x) {
    var r = x.r;
    return '<tr><td>' + esc(r.nome) + (r.proroga ? ' <span class="chip s-inviata" title="Proroga individuale">proroga</span>' : '') + partenza(r) + '</td><td class="n">' + esc(etich(r)) + '</td>' +
      '<td class="n">' + (x.mai ? '<b>' + x.mai + '</b>' : '0') + '</td><td class="n">' + (x.rim ? '<b style="color:#9A4A00">' + x.rim + '</b>' : '0') + '</td><td>' + cella(x.sc) + '</td>' +
      '<td class="n">' + (x.ric ? '<b>' + x.ric + '</b><br>' + cella(x.scR) : '—') + '</td></tr>';
  }).join('');
  return '<section class="card stack" id="sollecito"><h2 style="margin:0;font-size:22px">Da sollecitare' + (righe.length ? ' (' + righe.length + ')' : '') + '</h2>' +
    (righe.length ? '<p class="muted" style="margin:0;font-size:15px">Studenti non esclusi con termini ancora senza risposta o rimandati da correggere, in ordine di scadenza. La scadenza è quella personale (della classe o della proroga).</p>' +
      '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th><th style="text-align:right">Senza risposta</th><th style="text-align:right">Da correggere</th><th>Scadenza</th><th style="text-align:right">Termini ricevuti senza risposta</th></tr></thead><tbody>' + corpo + '</tbody></table></div>' +
      '<p class="muted" style="margin:0;font-size:14px">«Senza risposta» porta all\'esclusione alla scadenza; «Da correggere» sono risposte rimandate: non escludono, ma vanno riviste.</p>'
      : '<p style="margin:0">Nessuno da sollecitare' + (S.filtro.classe && S.filtro.classe !== 'tutte' ? ' nella ' + esc(S.filtro.classe) : '') + ': tutti hanno risposto a tutti i loro termini.</p>') + '</section>';
}

/* ---------- proroghe e passaggio dei termini ---------- */
function bloccoGestione() {
  S.gs = S.gs || { classe: CLASSI()[0], id: '' };
  if (S.filtro && S.filtro.classe && S.filtro.classe !== 'tutte' && S.gs.classe !== S.filtro.classe) { S.gs.classe = S.filtro.classe; S.gs.id = ''; }
  if (CLASSI().indexOf(S.gs.classe) < 0) S.gs.classe = CLASSI()[0];
  var cl = CLASSI().map(function (c) { return '<option value="' + c + '"' + (S.gs.classe === c ? ' selected' : '') + '>' + c + '</option>'; }).join('');
  return '<section class="card stack admin" id="gestione"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Proroghe e passaggio dei termini</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    '<p class="muted" style="margin:0;font-size:15px">Per un singolo studente: sposti la sua scadenza (assenze lunghe, PDP/DSA, problemi tecnici), impedisci che i suoi termini passino in automatico a un compagno, oppure li passi tu a chi decidi.</p>' +
    '<div class="grid2"><div><label for="gsc">Classe</label><select id="gsc" onchange="S.gs.classe=this.value;S.gs.id=\'\';selGestione();disegnaGestione()">' + cl + '</select></div>' +
    '<div><label for="gss">Studente</label><select id="gss" onchange="S.gs.id=this.value;disegnaGestione()"></select></div></div><div id="gsbox" class="stack"></div></section>';
}
function selGestione() {
  var el = $('gss'); if (!el) return;
  var al = S.d.alunni.filter(function (a) { return (a.classe || '3E') === S.gs.classe; }).sort(function (a, b) { return a.nome.localeCompare(b.nome, 'it'); });
  if (!S.gs.id || !al.some(function (a) { return a.id === S.gs.id; })) S.gs.id = al[0] ? al[0].id : '';
  el.innerHTML = al.map(function (a) { var r = panDi(a.id); return '<option value="' + a.id + '"' + (a.id === S.gs.id ? ' selected' : '') + '>' + esc(a.nome) + (r.escluso ? ' (escluso)' : r.proroga ? ' (proroga)' : '') + '</option>'; }).join('');
}
function disegnaGestione() {
  var box = $('gsbox'); if (!box) return;
  var id = S.gs.id; if (!id) { box.innerHTML = '<p class="muted" style="margin:0">Nessuno studente in questa classe.</p>'; return; }
  var r = panDi(id), A = S.d.admin, imp = A.impostazioni, dc = datePerClasse(r.classe || '3E'), now = Date.now();
  var miei = S.d.termini.filter(function (t) { return t.alunno === id; }).sort(function (a, b) { return (a.ereditato ? 1 : 0) - (b.ereditato ? 1 : 0) || a.area - b.area || a.it.localeCompare(b.it, 'it'); });
  var passati = S.d.termini.filter(function (t) { return t.alunnoOrig === id && t.alunno !== id; });
  var manuale = imp.riassegnazione === 'manuale';
  var stato = '<div class="note' + (r.escluso ? ' err' : '') + '" style="margin:0">' +
    (r.escluso ? '<b>Escluso</b> (' + esc(r.motivo || 'scadenza') + '). ' : '') +
    'Scadenza personale: <b>' + esc(oraIt(r.scadenza)) + '</b>' + (r.proroga ? ' — <b>proroga</b> (la classe scade ' + esc(oraIt(dc.scadenzaIt)) + ')' : ' (quella della classe)') +
    (Date.parse(r.scadenza) > now ? ' · mancano ' + esc(fraTempo(Date.parse(r.scadenza) - now)) : ' · <b>passata</b>') + '.</div>';
  var defPr = r.proroga ? isoLocale(r.proroga) : isoLocale(new Date(Math.max(Date.parse(dc.scadenzaIt), now) + 3 * 86400000).toISOString());
  var proroga = '<div class="stack" style="gap:8px;border-top:1px solid var(--line);padding-top:12px"><b>Proroga individuale</b>' +
    '<div class="grid2"><div><label for="gsPr">Nuova scadenza per ' + esc(r.nome) + '</label><input id="gsPr" type="datetime-local" value="' + defPr + '"></div>' +
    '<div class="row" style="align-self:end"><button class="btn" onclick="concediProroga(this)">' + (r.proroga ? 'Aggiorna la proroga' : 'Concedi la proroga') + '</button>' +
    (r.proroga ? '<button class="btn sec" onclick="togliProroga(this)">Togli la proroga</button>' : '') + '</div></div>' +
    '<span class="muted" style="font-size:14px">Deve essere dopo la scadenza della classe. Vale per tutti i suoi termini; se era già escluso, torna nel compito' + (passati.length ? ' e puoi scegliere se riprendere i termini già passati ad altri' : '') + '.</span></div>';
  var blocco = '<div class="stack" style="gap:6px;border-top:1px solid var(--line);padding-top:12px"><b>Riassegnazione automatica</b>' +
    (manuale ? '<p class="muted" style="margin:0;font-size:15px">È impostata su «decido io» per tutti (pagina «Scadenze e valutazione»): i termini degli esclusi non passano mai in automatico.</p>'
      : '<label class="row" style="gap:10px;font-weight:400;cursor:pointer"><input type="checkbox" id="gsBl"' + (r.bloccoRiass ? ' checked' : '') + ' onchange="setBloccoRiass(this)" style="width:22px;height:22px"> Se viene escluso, <b>non</b> passare i suoi termini in automatico: decido io</label>') + '</div>';
  var tab = miei.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th style="width:36px"></th><th>Termine</th><th>Area</th><th>Stato</th><th style="text-align:right">Tentativi</th></tr></thead><tbody>' + miei.map(function (t) {
    var z = area(t.area) || {}, app = t.statoIt === 'approvata';
    return '<tr><td><input type="checkbox" class="gsT" value="' + t.id + '"' + (app ? ' disabled title="Già approvato: non si passa"' : '') + ' style="width:20px;height:20px" aria-label="Seleziona ' + esc(t.it) + '"></td>' +
      '<td><b>' + esc(t.it) + '</b>' + (t.ereditato ? '<br><span class="muted" style="font-size:13px">ricevuto da ' + esc(nomeAlunno(t.alunnoOrig)) + '</span>' : '') + '</td>' +
      '<td><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + esc(z.colore || '#15212B') + ';margin-right:6px"></i>' + t.area + '</td><td>' + chip(t.statoIt) + '</td><td class="n">' + (t.tentIt || 0) + '</td></tr>';
  }).join('') + '</tbody></table></div>' : '<p class="muted" style="margin:0">Nessun termine assegnato in questo momento.</p>';
  var dest = S.d.alunni.filter(function (a) { return a.id !== id && (S.gs.altre || (a.classe || '3E') === (r.classe || '3E')); }).sort(function (a, b) { return (a.classe === r.classe ? 0 : 1) - (b.classe === r.classe ? 0 : 1) || (a.classe || '').localeCompare(b.classe || '') || a.nome.localeCompare(b.nome, 'it'); });
  var gruppi = {}; dest.forEach(function (a) { (gruppi[a.classe || '3E'] = gruppi[a.classe || '3E'] || []).push(a); });
  var opz = Object.keys(gruppi).sort(function (x, y) { return (x === r.classe ? -1 : y === r.classe ? 1 : x.localeCompare(y)); }).map(function (c) {
    return '<optgroup label="' + esc(c) + (c === r.classe ? ' (stessa classe)' : '') + '">' + gruppi[c].map(function (a) { var p = panDi(a.id); return '<option value="' + a.id + '"' + (p.escluso ? ' disabled' : '') + '>' + esc(a.nome) + (p.escluso ? ' — escluso' : p.ereditati ? ' — ha già ' + p.ereditati + ' carico ricevuto' : '') + '</option>'; }).join('') + '</optgroup>';
  }).join('');
  var passa = '<div class="stack" style="gap:8px;border-top:1px solid var(--line);padding-top:12px"><b>Passa i suoi termini a un compagno</b>' + tab +
    (miei.length ? '<div class="row" style="gap:8px"><button class="btn sec" style="min-height:38px" onclick="selTermini(\'vuoti\')">Seleziona quelli senza risposta</button><button class="btn sec" style="min-height:38px" onclick="selTermini(\'tutti\')">Seleziona tutti</button><button class="btn sec" style="min-height:38px" onclick="selTermini(\'nessuno\')">Nessuno</button></div>' +
      '<div class="grid2"><div><label for="gsDst">Compagno che li riceve</label><select id="gsDst"><option value="">— scegli —</option>' + opz + '</select></div>' +
      (CLASSI().length > 1 ? '<label class="row" style="gap:8px;font-weight:400;font-size:15px;cursor:pointer;grid-column:1/-1"><input type="checkbox"' + (S.gs.altre ? ' checked' : '') + ' onchange="S.gs.altre=this.checked;disegnaGestione()" style="width:20px;height:20px"> Mostra anche gli alunni delle altre classi</label>' : '') +
      '<div><label for="gsSc">Scadenza per chi li riceve</label><input id="gsSc" type="datetime-local" value="' + localeTra(imp.giorniIt) + '"></div></div>' +
      '<div class="row"><button class="btn" onclick="passaTermini(this)">Passa i termini selezionati</button></div>' +
      '<span class="muted" style="font-size:14px">Chi li riceve ripartirà da zero su quei termini e potrà arrivare a ' + fv(imp.votoMaxErede) + '. Dopo un passaggio fatto da te, l\'app non sposterà più in automatico i termini rimasti a ' + esc(r.nome) + '.</span>' : '') + '</div>';
  var giaPassati = passati.length ? '<div class="stack" style="gap:6px;border-top:1px solid var(--line);padding-top:12px"><b>Termini di ' + esc(r.nome) + ' che ora ha un compagno (' + passati.length + ')</b><ul style="margin:0;padding-left:20px">' +
    passati.map(function (t) { return '<li><b>' + esc(t.it) + '</b> → ' + esc(nomeAlunno(t.alunno)) + ' · ' + chip(t.statoIt) + '</li>'; }).join('') + '</ul>' +
    '<span class="muted" style="font-size:14px">Per riprenderli: proroga qui sopra oppure «Riammetti» nel tabellone dei voti.</span></div>' : '';
  box.innerHTML = stato + proroga + blocco + passa + giaPassati;
}
function selTermini(modo) {
  document.querySelectorAll('.gsT').forEach(function (c) {
    if (c.disabled) return;
    var t = S.d.termini.filter(function (x) { return x.id === c.value; })[0];
    c.checked = modo === 'tutti' ? true : modo === 'nessuno' ? false : !(t && (t.tentIt > 0 || t.statoIt));
  });
}
function concediProroga(btn) {
  var v = $('gsPr').value, id = S.gs.id, r = panDi(id);
  if (!v) { toast('Scegli la data della proroga.', true); return; }
  var iso = new Date(v).toISOString();
  var esegui = function (modo) {
    btn.disabled = true;
    api('proroga', { alunno: id, data: iso, modo: modo || 'tutti' }).then(function (x) { return ricarica('Proroga per ' + r.nome + ' fino a ' + oraIt(iso) + (x.restituiti ? ': ' + x.restituiti + ' termini tornati a lui' : '')); })
      .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
  };
  api('anteprimariammissione', { alunno: id }).then(function (a) {
    if (!a.termini) return esegui('tutti');
    var chi = a.eredi.map(function (e) { return '<b>' + esc(e.nome) + '</b> (' + e.termini + ', ' + (e.risposti ? 'a ' + e.risposti + ' ha già risposto' : 'nessuna risposta') + ')'; }).join(', ');
    var testo = '<p style="margin:0">' + esc(a.nome) + ' torna nel compito fino a <b>' + esc(oraIt(iso)) + '</b>. ' + a.termini + ' suoi termini sono ora di ' + chi + '.</p>';
    if (!a.risposti) finestra('Proroga', testo + '<p style="margin:0">Tutti i termini tornano a ' + esc(a.nome) + '.</p>', [{ t: 'Concedi la proroga e restituisci i termini', f: function () { esegui('tutti'); } }]);
    else finestra('Proroga', testo + '<p class="note warn" style="margin:0">A ' + a.risposti + ' di questi termini il compagno ha già risposto.</p>',
      [{ t: 'Restituisci tutti i ' + a.termini + ' termini', s: 'le risposte già date dal compagno si cancellano', f: function () { esegui('tutti'); } },
       { t: 'Restituisci solo i ' + (a.termini - a.risposti) + ' senza risposta', s: 'gli altri restano al compagno', f: function () { esegui('non_risposti'); } }]);
  }).catch(function (e) { toast(errMsg(e), true); });
}
function togliProroga(btn) {
  var id = S.gs.id, r = panDi(id), dc = datePerClasse(r.classe || '3E');
  var scaduta = Date.parse(dc.scadenzaIt) < Date.now();
  finestra('Togli la proroga', '<p style="margin:0">' + esc(r.nome) + ' torna alla scadenza della classe: <b>' + esc(oraIt(dc.scadenzaIt)) + '</b>.</p>' +
    (scaduta && (r.mancaIt || 0) > 0 ? '<p class="note err" style="margin:0">Quella scadenza è già passata e ha ancora ' + r.mancaIt + ' termini senza risposta: sarà <b>escluso</b> al prossimo accesso di chiunque all\'app.</p>' : ''),
    [{ t: 'Togli la proroga', warn: scaduta, f: function () { btn.disabled = true; api('proroga', { alunno: id, data: null }).then(function () { return ricarica('Proroga tolta a ' + r.nome); }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); }); } }]);
}
function setBloccoRiass(chk) {
  var id = S.gs.id, v = chk.checked; chk.disabled = true;
  api('bloccoriassegnazione', { alunno: id, blocco: v }).then(function () { return ricarica(v ? 'I termini di ' + nomeAlunno(id) + ' non passeranno in automatico' : 'Riassegnazione automatica riattivata per ' + nomeAlunno(id)); })
    .catch(function (e) { chk.disabled = false; chk.checked = !v; toast(errMsg(e), true); });
}
function passaTermini(btn) {
  var id = S.gs.id, sel = [].slice.call(document.querySelectorAll('.gsT:checked')).map(function (c) { return c.value; });
  var dst = $('gsDst').value, sc = $('gsSc').value;
  if (!sel.length) { toast('Seleziona almeno un termine.', true); return; }
  if (!dst) { toast('Scegli il compagno che riceve i termini.', true); return; }
  if (!sc) { toast('Indica la scadenza per chi riceve i termini.', true); return; }
  var iso = new Date(sc).toISOString();
  var ts = S.d.termini.filter(function (t) { return sel.indexOf(t.id) >= 0; });
  var risp = ts.filter(function (t) { return t.tentIt > 0 || t.statoIt; }).length;
  var A = S.d.admin.impostazioni;
  finestra('Passaggio dei termini', '<p style="margin:0">Passi <b>' + ts.length + (ts.length === 1 ? ' termine' : ' termini') + '</b> di ' + esc(nomeAlunno(id)) + ' a <b>' + esc(nomeAlunno(dst)) + '</b>, con scadenza <b>' + esc(oraIt(iso)) + '</b>.</p>' +
    '<ul style="margin:0;padding-left:20px">' + ts.map(function (t) { return '<li>' + esc(t.it) + '</li>'; }).join('') + '</ul>' +
    '<p style="margin:0">' + esc(nomeAlunno(dst)) + ' potrà arrivare a ' + fv(A.votoMaxErede) + '; se non risponde in tempo non viene escluso, ma il voto finale scende a ' + A.tetto + '.</p>' +
    (risp ? '<p class="note warn" style="margin:0">' + risp + (risp === 1 ? ' termine ha' : ' termini hanno') + ' già una risposta di ' + esc(nomeAlunno(id)) + ': verrà cancellata e il compagno ripartirà da zero.</p>' : ''),
    [{ t: 'Passa i termini', f: function () {
      btn.disabled = true;
      api('trasferisci', { da: id, a: dst, termini: sel, scadenza: iso }).then(function (x) { return ricarica(x.passati + ' termini passati a ' + nomeAlunno(dst)); })
        .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
    } }]);
}

/* ---------- chiusura dell'edizione in corso (pulsante rosso in cima) ---------- */
function bloccoChiusuraEdizione() {
  var A = S.d.admin, ed = A.impostazioni.edizione, arch = A.archiviata === ed.id, chiusa = !!S.d.config.chiusa;
  if (!arch) return '<section class="card admin" id="chiusuraEd" style="border-color:var(--err);display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:240px"><div class="muted disp" style="font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:12px">Edizione in corso</div>' +
    '<b style="font-size:19px">' + esc(ed.nome) + '</b><div class="muted" style="font-size:14px">a.s. ' + esc(ed.as) + ' · classi ' + esc(elencoClassi()) + (chiusa ? ' · app già chiusa agli alunni' : ' · aperta agli alunni') + '</div></div>' +
    '<button class="btn" id="bChiudiEd2" style="background:var(--err);border-color:var(--err);min-height:54px;font-size:18px;padding:0 24px" onclick="chiudiEdizione(this)">Chiudi l\'edizione in corso</button></section>';
  return '<section class="card admin" id="chiusuraEd" style="border-color:var(--ok);display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:240px"><div class="muted disp" style="font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:12px">Edizione chiusa e archiviata</div>' +
    '<b style="font-size:19px">' + esc(ed.nome) + '</b><div class="muted" style="font-size:14px">a.s. ' + esc(ed.as) + ' · gli alunni ' + (chiusa ? 'non possono più entrare' : 'possono ancora entrare (app riaperta)') + '. Resta consultabile nell\'archivio.</div></div>' +
    '<button class="btn" style="min-height:54px;font-size:18px;padding:0 24px" onclick="apriWizard(\'edizione\')">Nuova edizione</button></section>';
}
function chiudiEdizione(btn) {
  var ed = S.d.admin.impostazioni.edizione, mancano = (S.d.panoramica || []).filter(function (r) { return !r.escluso && (r.mancaIt || 0) > 0; }).length;
  var daRivedere = (S.d.termini || []).filter(function (t) { return t.statoIt === 'inviata'; }).length;
  finestra('Chiudi l\'edizione in corso',
    '<p style="margin:0">Chiudi <b>' + esc(ed.nome) + '</b> (a.s. ' + esc(ed.as) + '):</p><ul style="margin:0;padding-left:20px"><li>gli alunni non potranno più entrare né rispondere;</li><li>l\'edizione va in archivio con risposte, voti, definizioni e registro, e resta consultabile;</li><li>tu continui a vedere tutto e puoi ancora approvare, scaricare report, Word e cartelloni (poi «Aggiorna la copia in archivio»).</li></ul>' +
    (mancano || daRivedere ? '<p class="note warn" style="margin:0">' + (mancano ? mancano + (mancano === 1 ? ' alunno ha' : ' alunni hanno') + ' ancora termini senza risposta. ' : '') + (daRivedere ? daRivedere + (daRivedere === 1 ? ' risposta aspetta' : ' risposte aspettano') + ' la tua revisione.' : '') + '</p>' : ''),
    [{ t: 'Chiudi l\'edizione e archiviala', warn: true, f: function () {
      btn.disabled = true;
      api('chiudiedizione', {}).then(function (x) { return ricarica('Edizione chiusa e archiviata' + (x.dropbox === 'ok' ? ' (copia anche su Dropbox)' : '')); })
        .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
    } }]);
}

/* ---------- edizioni e archivio ---------- */
function bloccoEdizioni() {
  var A = S.d.admin, ed = A.impostazioni.edizione, arch = A.archiviata === ed.id, chiusa = !!S.d.config.chiusa;
  var lista = (A.archivio || []).map(function (m) {
    return '<tr><td><b>' + esc(m.nome) + '</b><br><span class="muted" style="font-size:13px">archiviata ' + esc(quando(m.archiviata)) + '</span></td><td>' + esc(m.as) + '</td><td>' + esc((m.classi || []).join(', ')) + '</td>' +
      '<td class="n">' + (m.alunni || 0) + '</td><td class="n">' + (m.approvate || 0) + '/' + (m.termini || 0) + '</td><td class="n">' + fv(m.mediaVoto) + '</td>' +
      '<td><div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sec" style="min-height:36px;padding:0 10px" onclick="apriArchivio(\'' + esc(m.id) + '\',this)">Apri</button>' +
      '<a class="btn sec" style="min-height:36px;padding:0 10px;display:inline-flex;align-items:center" href="/glossario?ed=' + encodeURIComponent(m.id) + '" target="_blank" rel="noopener">Pagina pubblica</a>' +
      '<button class="btn sec" style="min-height:36px;padding:0 10px" onclick="scaricaArchivio(\'' + esc(m.id) + '\',\'word\',this)">Word</button>' +
      '<button class="btn sec" style="min-height:36px;padding:0 10px" onclick="scaricaArchivio(\'' + esc(m.id) + '\',\'json\',this)">Dati</button></div></td></tr>';
  }).join('');
  return '<section class="card stack admin" id="edizioni"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Edizioni e archivio</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    '<p style="margin:0">Edizione in corso: <b>' + esc(ed.nome) + '</b> · a.s. ' + esc(ed.as) + ' · classi ' + esc(CLASSI().join(', ')) + (arch ? ' <span class="chip s-approvata">in archivio</span>' : '') + '</p>' +
    (!arch ? '<div class="stack" style="gap:8px"><div class="row">' +
      '<button class="btn" onclick="apriWizard(\'edizione\')">Nuova edizione</button>' +
      '<button class="btn sec" onclick="apriWizard(\'classe\')">Aggiungi una classe a questa edizione</button>' +
      '<button class="btn sec" onclick="archiviaEdizione(false,this)"' + (chiusa ? '' : ' disabled') + '>Archivia questa edizione</button></div>' +
      '<p class="muted" style="margin:0;font-size:14px"><b>Nuova edizione</b>: stesse classi o classi nuove, termini nuovi che escludono quelli già fatti, periodi e scadenze nuovi; l\'edizione in corso viene chiusa agli alunni e archiviata in automatico. ' +
      '<b>Aggiungi una classe</b>: nuova classe con i suoi alunni, termini nuovi (mai usati prima) e date proprie; le sue definizioni vanno sugli stessi cartelloni. ' +
      '<b>Archivia</b>: a lavoro concluso fotografa l\'edizione (risposte, voti, definizioni, registro), che resta consultabile qui e nella pagina pubblica; poi potrai crearne una nuova.' +
      (chiusa ? '' : ' Per archiviare chiudi prima l\'app agli alunni (pagina «Scadenze e valutazione», riquadro «Accesso degli alunni»).') + '</p></div>'
      : '<div class="row"><button class="btn" onclick="apriWizard(\'edizione\')">Nuova edizione</button><button class="btn sec" onclick="archiviaEdizione(true,this)">Aggiorna la copia in archivio</button></div>' +
      '<p class="muted" style="margin:0;font-size:14px"><b>Nuova edizione</b>: stesse classi o classi nuove, termini nuovi che escludono quelli già fatti, periodi e scadenze nuovi. Gli alunni che riprendi tengono il loro codice.</p>') +
    (lista ? '<h3 style="margin:8px 0 0;font-size:18px">Archivio</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Edizione</th><th>a.s.</th><th>Classi</th><th style="text-align:right">Alunni</th><th style="text-align:right">Approvate</th><th style="text-align:right">Media</th><th></th></tr></thead><tbody>' + lista + '</tbody></table></div>'
      : '<p class="muted" style="margin:0;font-size:14px">Archivio vuoto: nessuna edizione conclusa finora.</p>') + '</section>';
}
function archiviaEdizione(sovrascrivi, btn) {
  var ed = S.d.admin.impostazioni.edizione;
  finestra(sovrascrivi ? 'Aggiorna la copia in archivio' : 'Archivia l\'edizione',
    '<p style="margin:0">' + (sovrascrivi ? 'La copia archiviata di <b>' + esc(ed.nome) + '</b> verrà sostituita con i dati di adesso.' : 'Archivio <b>' + esc(ed.nome) + '</b> (a.s. ' + esc(ed.as) + '): risposte, voti, definizioni approvate, codici e registro degli accessi.') + '</p>' +
    '<p style="margin:0">L\'edizione resta consultabile qui (in sola lettura) e nella pagina pubblica. Se Dropbox è collegato, ci va anche una copia (dati completi e Word) nella cartella <b>Archivio</b>. Gli alunni continuano a vedere l\'app chiusa finché non crei una nuova edizione.</p>',
    [{ t: sovrascrivi ? 'Aggiorna la copia' : 'Archivia', f: function () {
      btn.disabled = true;
      api('archivia', { sovrascrivi: !!sovrascrivi }).then(function (x) { return ricarica('Edizione archiviata' + (x.dropbox === 'ok' ? ' (copia anche su Dropbox)' : x.dropbox === 'non collegato' ? '' : ' — Dropbox: ' + x.dropbox)); })
        .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
    } }]);
}
function apriArchivio(id, btn) {
  if (btn) btn.disabled = true;
  api('archivioconsulta', { id: id }).then(function (d) { S.d = d; S.pag = 'cruscotto'; ricordaPag('cruscotto'); S.filtro = { area: 'tutte', stato: 'tutti', lingua: 'it', classe: 'tutte' }; S.poster = null; render(); window.scrollTo(0, 0); toast('Edizione archiviata, in sola lettura'); })
    .catch(function (e) { if (btn) btn.disabled = false; toast(errMsg(e), true); });
}
function esciArchivio() { api('login').then(function (d) { S.d = d; S.pag = 'edizioni'; ricordaPag('edizioni'); S.filtro = { area: 'tutte', stato: 'inviata', lingua: 'it', classe: 'tutte' }; render(); window.scrollTo(0, 0); }).catch(function (e) { toast(errMsg(e), true); }); }
function scaricaArchivio(id, tipo, btn) {
  var t = btn.textContent; btn.disabled = true; btn.textContent = '…';
  api('archiviofile', { id: id, tipo: tipo }).then(function (x) {
    if (x.base64) scaricaB64(x.nome, x.base64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); else salvaFile(x.nome, x.testo);
    btn.disabled = false; btn.textContent = t;
  }).catch(function (e) { btn.disabled = false; btn.textContent = t; toast(errMsg(e), true); });
}
function bannerArchivio() {
  var e = S.d.edizioneArchivio || {};
  return '<div class="note warn" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:220px"><b>Archivio · sola lettura.</b> Stai consultando <b>' + esc(e.nome || '') + '</b> (a.s. ' + esc(e.as || '') + '). Report, cartelloni, targa e Word si generano con i dati di questa edizione.</span>' +
    '<button class="btn" onclick="esciArchivio()">Torna all\'edizione in corso</button></div>';
}

/* ---------- procedura guidata: classe aggiunta o nuova edizione ---------- */
var AREE_N = ['1', '2', '3', '4'];
function pianoClient(c) {
  var n = c.alunni.length, tpa = Number(c.tpa) || 0, base = Math.floor(n / 4), extra = n % 4, gruppo = [], i = 0;
  for (var g = 0; g < 4; g++) for (var k = 0; k < base + (g < extra ? 1 : 0); k++, i++) gruppo[i] = g + 1;
  return c.alunni.map(function (al, j) {
    var aree = { 1: 0, 2: 0, 3: 0, 4: 0 };
    if (c.modo === 'gruppi') aree[gruppo[j]] = tpa;
    else { var b = Math.floor(tpa / 4), r = tpa % 4; AREE_N.forEach(function (a) { aree[a] = b; }); for (var q = 0; q < r; q++) aree[((j + q) % 4) + 1]++; }
    return aree;
  });
}
function fabbisognoClient(classi) {
  var tot = { 1: 0, 2: 0, 3: 0, 4: 0 };
  classi.forEach(function (c) { pianoClient(c).forEach(function (p) { AREE_N.forEach(function (a) { tot[a] += p[a]; }); }); });
  return tot;
}
function nomiDaTesto(t) { return String(t || '').split(/\n+/).map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean); }
function nuovaClasseWz() { return { nome: '', tpa: 10, max: 10, modo: 'misto', partenza: '', scadenza: localeTra(14), testo: '', riprendi: {} }; }
/* elenco alunni da file Excel (.xlsx/.xls) o CSV: colonne Cognome e Nome (o una colonna con il nominativo) */
var XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
function caricaXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise(function (ok, ko) { var sc = document.createElement('script'); sc.src = XLSX_URL; sc.onload = function () { ok(window.XLSX); }; sc.onerror = function () { ko(new Error('Non riesco a leggere i file Excel adesso (connessione?). Salva il file come CSV e riprova.')); }; document.head.appendChild(sc); });
}
function righeCsv(testo) {
  var righe = String(testo).replace(/^\uFEFF/, '').split(/\r?\n/).filter(function (r) { return r.trim(); });
  var sep = /\t/.test(righe[0] || '') ? '\t' : (righe[0] || '').split(';').length >= (righe[0] || '').split(',').length ? ';' : ',';
  return righe.map(function (r) { return r.split(sep).map(function (c) { return c.replace(/^\s*"|"\s*$/g, '').trim(); }); });
}
function nomiDaRighe(righe) {
  var pulisci = function (x) { return String(x == null ? '' : x).replace(/\s+/g, ' ').trim(); };
  var iC = -1, iN = -1, iU = -1, h = -1;
  for (var r = 0; r < Math.min(righe.length, 8) && h < 0; r++) {
    righe[r].forEach(function (c, k) { var v = pulisci(c).toLowerCase(); if (/^cognome/.test(v)) iC = k; else if (/^nome\b|^nome$/.test(v)) iN = k; else if (/alunn|student|nominativ|cognome e nome|nome e cognome/.test(v)) iU = k; });
    if (iC >= 0 || iU >= 0) h = r; else { iC = iN = iU = -1; }
  }
  var dati = h >= 0 ? righe.slice(h + 1) : righe, out = [];
  dati.forEach(function (row) {
    var n;
    if (h >= 0 && iC >= 0) n = pulisci(row[iC]) + (iN >= 0 ? ' ' + pulisci(row[iN]) : '');
    else if (h >= 0 && iU >= 0) n = pulisci(row[iU]);
    else { var celle = row.map(pulisci).filter(function (x) { return x && !/^\d+([.,]\d+)?$/.test(x); }); n = celle.slice(0, 2).join(' '); }
    n = pulisci(n);
    if (n && /[A-Za-zÀ-ÿ]/.test(n) && out.indexOf(n) < 0) out.push(n);
  });
  return out;
}
function caricaElenco(i, inp) {
  var f = inp.files && inp.files[0]; inp.value = ''; if (!f) return;
  leggiPasso1();
  var fine = function (nomi) {
    if (!nomi.length) { toast('Nel file non ho trovato nomi: servono le colonne Cognome e Nome.', true); return; }
    S.wz.classi[i].testo = nomi.join('\n'); disegnaWizard(); toast('Caricati ' + nomi.length + ' alunni da ' + f.name);
  };
  if (/\.(xlsx|xls|ods)$/i.test(f.name)) {
    caricaXlsx().then(function (X) { return f.arrayBuffer().then(function (buf) { var wb = X.read(buf, { type: 'array' }); return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' }); }); })
      .then(function (righe) { fine(nomiDaRighe(righe)); }).catch(function (e) { toast(errMsg(e), true); });
  } else {
    var r = new FileReader(); r.onload = function () { fine(nomiDaRighe(righeCsv(r.result))); }; r.readAsText(f);
  }
}
function apriWizard(tipo) {
  if (tipo === 'edizione' && location.hash !== '#nuova-edizione') { S.wzApri = true; location.hash = 'nuova-edizione'; return; }
  var ed = S.d.admin.impostazioni.edizione, as = ed.as;
  var prossimo = /^(\d{4})\/(\d{2})$/.exec(as) ? (Number(as.slice(0, 4)) + 1) + '/' + ('0' + ((Number(as.slice(5)) + 1) % 100)).slice(-2) : '';
  var I = S.d.admin.impostazioni;
  S.wz = { tipo: tipo, passo: 1, nome: '', as: prossimo, classi: [nuovaClasseWz()], termini: null, scartati: [], riassegnazione: I.riassegnazione, proposta: I.proposta, giorniIt: I.giorniIt,
    colleghi: (S.d.admin.colleghi || []).map(function (c) { return { nome: c.nome, codice: c.codice, permessi: Object.assign({}, c.permessi) }; }) };
  if (tipo === 'edizione') S.wz.nome = 'Glossario odontotecnico ' + prossimo;
  disegnaWizard();
}
function chiudiWizard() {
  var pagina = S.wz && S.wz.tipo === 'edizione';
  S.wz = null;
  if (pagina) { if (location.hash === '#nuova-edizione') history.replaceState(null, '', location.pathname + location.search); vistaDocente(); window.scrollTo(0, 0); return; }
  var o = $('wz'); if (o) o.remove();
}
// la pagina della nuova edizione si apre e si chiude anche con i tasti avanti/indietro del browser
window.addEventListener('hashchange', function () {
  if (!S.d || !S.d.admin || RO()) return;
  if (location.hash === '#nuova-edizione' && !(S.wz && S.wz.tipo === 'edizione')) { S.wzApri = false; apriWizard('edizione'); }
  else if (location.hash !== '#nuova-edizione' && S.wz && S.wz.tipo === 'edizione') { S.wz = null; vistaDocente(); }
});
function leggiPasso1() {
  var w = S.wz;
  if (w.tipo === 'edizione') {
    w.nome = $('wzNome').value; w.as = $('wzAs').value.trim();
    var rr = document.querySelector('input[name="wzRi"]:checked'); w.riassegnazione = rr ? rr.value : w.riassegnazione;
    var pp = document.querySelector('input[name="wzPr"]:checked'); w.proposta = pp ? pp.value : w.proposta;
    w.giorniIt = Number($('wzG').value);
    w.colleghi = leggiColleghi('wzc', w.colleghi);
  }
  w.classi.forEach(function (c, i) {
    c.nome = ($('wzC' + i).value || '').trim().toUpperCase().replace(/\s+/g, '');
    c.max = Number($('wzT' + i).value); c.tpa = c.max;
    c.modo = (document.querySelector('input[name="wzM' + i + '"]:checked') || {}).value || 'misto';
    c.partenza = $('wzP' + i).value; c.scadenza = $('wzS' + i).value; c.testo = $('wzA' + i).value;
    c.alunni = nomiDaTesto(c.testo).map(function (n) { return { nome: n, riprendi: c.riprendi[n.toLowerCase()] || null }; });
  });
}
function riprendiClasse(i, cl) {
  leggiPasso1();
  var c = S.wz.classi[i], al = (S.d.codiciAlunni || []).filter(function (a) { return (a.classe || '3E') === cl; }).sort(function (a, b) { return a.nome.localeCompare(b.nome, 'it'); });
  c.riprendi = {}; al.forEach(function (a) { c.riprendi[a.nome.toLowerCase()] = a.id; });
  c.testo = al.map(function (a) { return a.nome; }).join('\n');
  if (!c.nome) c.nome = cl;
  disegnaWizard();
}
function disegnaWizard() {
  var w = S.wz; if (!w) return;
  if (w.tipo === 'edizione') return paginaNuovaEdizione();
  var o = $('wz');
  if (!o) { o = document.createElement('div'); o.id = 'wz'; o.setAttribute('style', 'position:fixed;inset:0;background:rgba(21,33,43,.6);z-index:40;overflow:auto;padding:16px'); document.body.appendChild(o); }
  var titolo = w.tipo === 'edizione' ? 'Nuova edizione del glossario' : 'Aggiungi una classe a questa edizione';
  var passi = ['Classi e alunni', 'Termini', 'Conferma'];
  var h = '<div class="card stack" role="dialog" aria-modal="true" aria-labelledby="wzT" style="max-width:920px;margin:0 auto;background:#fff">' +
    '<div class="row" style="justify-content:space-between"><h2 id="wzT" style="margin:0;font-size:22px">' + titolo + '</h2><button class="btn sec" onclick="chiudiWizard()">Chiudi</button></div>' +
    '<div class="row" style="gap:6px">' + passi.map(function (p, i) { return '<span class="chip ' + (w.passo === i + 1 ? 's-approvata' : 's-vuota') + '">' + (i + 1) + '. ' + p + '</span>'; }).join('') + '</div>';
  if (w.passo === 1) h += passo1Html(); else if (w.passo === 2) h += passo2Html(); else h += passo3Html();
  o.innerHTML = h + '</div>';
}
function paginaNuovaEdizione() {
  var w = S.wz, passi = ['Edizione, regole, classi e alunni', 'Termini', 'Conferma'];
  var h = testata('Nuova edizione del glossario') + '<main class="wrap stack"><div id="wz" class="stack">' +
    '<section class="card stack"><div class="row" style="justify-content:space-between"><h1 class="disp" style="margin:0;font-size:28px">Nuova edizione del glossario</h1><button class="btn sec" onclick="chiudiWizard()">Torna all\'area docenti</button></div>' +
    '<p class="muted" style="margin:0">Qui decidi tutto: nome e anno, regole di valutazione, classi, alunni, termini a testa, partenza e scadenze. ' +
    (S.d.admin.archiviata === S.d.admin.impostazioni.edizione.id ? 'L\'edizione precedente è già in archivio.' : 'Quando confermi, l\'edizione in corso (' + esc(S.d.admin.impostazioni.edizione.nome) + ') viene chiusa agli alunni e archiviata.') + '</p>' +
    '<div class="row" style="gap:6px">' + passi.map(function (p, i) { return '<span class="chip ' + (w.passo === i + 1 ? 's-approvata' : 's-vuota') + '">' + (i + 1) + '. ' + p + '</span>'; }).join('') + '</div></section>' +
    '<section class="card stack">' + (w.passo === 1 ? passo1Html() : w.passo === 2 ? passo2Html() : passo3Html()) + '</section></div></main>';
  $('app').innerHTML = h;
}
function passo1Html() {
  var w = S.wz, h = '';
  if (w.tipo === 'edizione') {
    var I = S.d.admin.impostazioni, err4 = function (p) { return Math.ceil((I.votoMax - I.votoMin) / p); };
    h += '<h2 style="margin:0;font-size:21px">Edizione</h2><div class="grid2"><div><label for="wzNome">Nome dell\'edizione</label><input id="wzNome" type="text" value="' + esc(w.nome) + '"></div><div><label for="wzAs">Anno scolastico</label><input id="wzAs" type="text" placeholder="2027/28" value="' + esc(w.as) + '"></div></div>' +
      '<h2 style="margin:8px 0 0;font-size:21px">Regole</h2>' +
      '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Penalità per ogni risposta errata (voto da ' + fv(I.votoMax) + ', minimo ' + I.votoMin + ')</legend>' +
      [['A', '−0,25 per errore: ' + err4(0.25) + ' errori per scendere da ' + fv(I.votoMax) + ' a ' + I.votoMin], ['B', '−0,50 per errore: ' + err4(0.5) + ' errori per scendere da ' + fv(I.votoMax) + ' a ' + I.votoMin]].map(function (o) {
        return '<label class="op' + (w.proposta === o[0] ? ' on' : '') + '"><input type="radio" name="wzPr" value="' + o[0] + '"' + (w.proposta === o[0] ? ' checked' : '') + ' onchange="segna(this)"><span class="lt">' + o[0] + '</span><span>Proposta ' + o[0] + ': ' + o[1] + '</span></label>'; }).join('') + '</fieldset>' +
      '<div class="grid2"><div><label for="wzG">Termini ricevuti da un escluso: giorni per rispondere</label><input id="wzG" type="number" min="1" max="30" value="' + esc(w.giorniIt) + '"></div></div>' +
      '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Termini degli esclusi</legend>' +
      [['auto', 'Passano in automatico, a sorte, a un compagno della stessa classe'], ['manuale', 'Decido io a chi passarli']].map(function (x) { return '<label class="op' + (w.riassegnazione === x[0] ? ' on' : '') + '"><input type="radio" name="wzRi" value="' + x[0] + '"' + (w.riassegnazione === x[0] ? ' checked' : '') + ' onchange="segna(this)"><span>' + x[1] + '</span></label>'; }).join('') + '</fieldset>' +
      '<h2 style="margin:8px 0 0;font-size:21px">Colleghi docenti</h2><p class="muted" style="margin:0;font-size:14px">Facoltativo: aggiungi un collega e scegli cosa può fare nella nuova edizione. I colleghi già presenti tengono il loro codice.</p>' +
      '<div id="wzcBox">' + editorColleghi('wzc', w.colleghi) + '</div>' +
      '<h2 style="margin:8px 0 0;font-size:21px">Classi e alunni</h2>';
  }
  var correnti = CLASSI();
  w.classi.forEach(function (c, i) {
    h += '<fieldset style="border:2px solid var(--line);border-radius:12px;padding:12px 14px" class="stack"><legend style="font-weight:800;padding:0 6px">Classe ' + (w.classi.length > 1 ? i + 1 : '') + '</legend>' +
      '<div class="grid4"><div><label for="wzC' + i + '">Nome (es. 4E)</label><input id="wzC' + i + '" type="text" maxlength="6" value="' + esc(c.nome) + '"></div>' +
      '<div><label for="wzT' + i + '">Termini a testa (massimo)</label><input id="wzT' + i + '" type="number" min="4" max="30" value="' + esc(c.max || c.tpa) + '"></div>' +
      '<div><label for="wzP' + i + '">Partenza</label><input id="wzP' + i + '" type="datetime-local" value="' + esc(c.partenza) + '"></div>' +
      '<div><label for="wzS' + i + '">Scadenza</label><input id="wzS' + i + '" type="datetime-local" value="' + esc(c.scadenza) + '"></div></div>' +
      '<fieldset class="ops" style="gap:6px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Come distribuire i termini</legend>' +
      [['misto', 'Ognuno riceve termini di tutte e quattro le aree (come la 3F)'], ['gruppi', 'Alunni divisi in 4 gruppi, uno per area (come la 3E)']].map(function (x) { return '<label class="op' + (c.modo === x[0] ? ' on' : '') + '"><input type="radio" name="wzM' + i + '" value="' + x[0] + '"' + (c.modo === x[0] ? ' checked' : '') + ' onchange="segna(this)"><span>' + x[1] + '</span></label>'; }).join('') + '</fieldset>' +
      '<div class="row" style="gap:8px"><label class="btn sec" style="min-height:38px;cursor:pointer;display:inline-flex;align-items:center" for="wzF' + i + '">Carica l\'elenco da Excel o CSV</label><input id="wzF' + i + '" type="file" accept=".xlsx,.xls,.ods,.csv,.txt" style="display:none" onchange="caricaElenco(' + i + ',this)"><span class="muted" style="font-size:14px">colonne <b>Cognome</b> e <b>Nome</b> (o una colonna con il nominativo)</span></div>' +
      '<div><label for="wzA' + i + '">Alunni (uno per riga, «Cognome Nome»)</label><textarea id="wzA' + i + '" rows="8" style="width:100%;font:inherit;padding:10px;border:2px solid var(--line);border-radius:10px">' + esc(c.testo) + '</textarea></div>' +
      (w.tipo === 'edizione' ? '<div class="row" style="gap:6px"><span class="muted" style="font-size:14px">Riprendi gli alunni (stesso codice) della classe:</span>' + correnti.map(function (cl) { return '<button class="btn sec" style="min-height:36px;padding:0 10px" onclick="riprendiClasse(' + i + ',\'' + esc(cl) + '\')">' + esc(cl) + '</button>'; }).join('') + '</div>' +
        (Object.keys(c.riprendi).length ? '<span class="muted" style="font-size:14px">I nomi che restano uguali a quelli ripresi tengono il loro codice; quelli nuovi o modificati ricevono un codice nuovo.</span>' : '') +
        (w.classi.length > 1 ? '<div><button class="btn sec" style="min-height:36px" onclick="leggiPasso1();S.wz.classi.splice(' + i + ',1);disegnaWizard()">Togli questa classe</button></div>' : '') : '') +
      '<span class="muted" style="font-size:14px">Senza partenza gli alunni entrano ma vedono il conto alla rovescia solo quando la fissi (pagina «Scadenze e valutazione»).</span></fieldset>';
  });
  if (w.tipo === 'edizione') h += '<div><button class="btn sec" onclick="leggiPasso1();S.wz.classi.push(nuovaClasseWz());disegnaWizard()">+ Aggiungi un\'altra classe</button></div>';
  return h + '<div class="row" style="justify-content:flex-end"><button class="btn" onclick="wzAvanti1(this)">Avanti: proponi i termini</button></div>';
}
function wzAvanti1(btn) {
  leggiPasso1();
  var w = S.wz, errs = [];
  if (w.tipo === 'edizione') { if (!w.nome.trim()) errs.push('Dai un nome all\'edizione.'); if (!/^\d{4}\/\d{2}$/.test(w.as)) errs.push('Anno scolastico nel formato 2027/28.'); if (!(w.giorniIt >= 1 && w.giorniIt <= 30)) errs.push('Giorni per i termini ricevuti: da 1 a 30.'); }
  var nomi = {};
  w.classi.forEach(function (c) {
    if (!c.nome) errs.push('Manca il nome di una classe.');
    else if (nomi[c.nome]) errs.push('La classe ' + c.nome + ' compare due volte.'); nomi[c.nome] = 1;
    if (w.tipo === 'classe' && CLASSI().indexOf(c.nome) >= 0) errs.push('La classe ' + c.nome + ' c\'è già in questa edizione.');
    if (!(c.max >= 4 && c.max <= 30)) errs.push((c.nome || 'Classe') + ': termini a testa da 4 a 30.');
    if (!c.alunni.length) errs.push((c.nome || 'Classe') + ': inserisci gli alunni.');
    if (!c.scadenza) errs.push((c.nome || 'Classe') + ': manca la scadenza.');
    else if (Date.parse(new Date(c.scadenza)) <= Date.now()) errs.push((c.nome || 'Classe') + ': la scadenza deve essere nel futuro.');
    if (c.partenza && c.scadenza && new Date(c.partenza) >= new Date(c.scadenza)) errs.push((c.nome || 'Classe') + ': la partenza deve venire prima della scadenza.');
  });
  if (errs.length) { toast(errs[0], true); return; }
  w.fab = fabbisognoClient(w.classi);
  btn.disabled = true; btn.textContent = 'Cerco termini nuovi…';
  w.ridotto = null;
  api('generatermini', { richiesta: w.fab, seme: Math.floor(Math.random() * 1e9) }).then(function (x) {
    w.termini = {}; AREE_N.forEach(function (n) { w.termini[n] = x.aree[n].map(function (y) { return { t: y[0], d: y[1], o: 'banca' }; }); });
    w.disp = x.disponibili;
    // massimo a testa: se la banca non basta, ognuno ne riceve meno (lo stesso numero per tutti, almeno 4)
    if (Object.keys(x.mancano || {}).length) adattaMassimo();
    w.passo = 2; disegnaWizard();
  }).catch(function (e) { btn.disabled = false; btn.textContent = 'Avanti: proponi i termini'; toast(errMsg(e), true); });
}
function passo2Html() {
  var w = S.wz, ok = true;
  var h = (w.ridotto ? '<div class="note warn" style="margin:0">La banca non ha abbastanza termini nuovi per ' + w.ridotto.da + ' a testa: ognuno ne riceve <b>' + w.ridotto.a + '</b>. Se vuoi arrivare a ' + w.ridotto.da + ', <button class="btn sec" style="min-height:32px;padding:0 10px;font-size:14px" onclick="tornaAlMassimo()">torna a ' + w.ridotto.da + ' a testa</button> e aggiungi i termini mancanti scritti da te.</div>' : '') +
    '<p style="margin:0">Termini nuovi proposti per area, già controllati: nessuno è uguale o simile a quelli dell\'edizione in corso, del 2026/27 e delle edizioni in archivio. Puoi sostituirli uno per uno, toglierli o aggiungere termini tuoi.</p>';
  AREE_N.forEach(function (n) {
    var a = area(n) || { it: 'Area ' + n, colore: '#15212B' }, lista = w.termini[n], serve = w.fab[n];
    if (!serve) return;
    if (lista.length !== serve) ok = false;
    h += '<section class="stack" style="gap:6px;border-left:6px solid ' + esc(a.colore) + ';padding-left:12px"><div class="row" style="justify-content:space-between"><h3 style="margin:0;font-size:18px">' + n + '. ' + esc(a.it) + '</h3>' +
      '<b style="color:' + (lista.length === serve ? 'var(--ok)' : 'var(--err)') + '">' + lista.length + ' / ' + serve + '</b></div>' +
      '<ol style="margin:0;padding-left:22px" class="stack">' + lista.map(function (x, k) {
        return '<li style="margin:0"><b>' + esc(x.t) + '</b>' + (x.o === 'mio' ? ' <span class="chip s-inviata">tuo</span>' : '') + (x.avviso ? ' <span class="chip s-correggere" title="' + esc(x.avviso) + '">simile a un termine già usato</span>' : '') + '<br><span style="font-size:15px">' + esc(x.d) + '</span>' +
          '<div class="row" style="gap:6px;margin-top:4px">' + (x.o === 'banca' ? '<button class="btn sec" style="min-height:32px;padding:0 10px;font-size:14px" onclick="wzSostituisci(\'' + n + '\',' + k + ',this)">Sostituisci</button>' : '') +
          '<button class="btn sec" style="min-height:32px;padding:0 10px;font-size:14px" onclick="wzTogli(\'' + n + '\',' + k + ')">Togli</button></div></li>';
      }).join('') + '</ol>' +
      (lista.length < serve ? '<div class="note warn" style="margin:0">Mancano ' + (serve - lista.length) + ' termini. <button class="btn sec" style="min-height:32px;padding:0 10px;font-size:14px" onclick="wzAltri(\'' + n + '\',this)">Proponi altri dalla banca</button></div>' : '') +
      (lista.length > serve ? '<div class="note warn" style="margin:0">Ce ne sono ' + (lista.length - serve) + ' in più: togline qualcuno.</div>' : '') +
      '<details><summary style="cursor:pointer;font-weight:700">Aggiungi termini tuoi</summary><div class="stack" style="gap:6px;margin-top:6px"><label for="wzX' + n + '">Uno per riga: <i>termine | definizione corretta</i></label>' +
      '<textarea id="wzX' + n + '" rows="4" style="width:100%;font:inherit;padding:10px;border:2px solid var(--line);border-radius:10px" placeholder="Ponte su impianti | Protesi fissa che poggia su due o più impianti."></textarea>' +
      '<div><button class="btn sec" style="min-height:36px" onclick="wzMiei(\'' + n + '\',this)">Controlla e aggiungi</button></div></div></details></section>';
  });
  return h + '<div class="row" style="justify-content:space-between"><button class="btn sec" onclick="S.wz.passo=1;disegnaWizard()">Indietro</button><button class="btn" onclick="S.wz.passo=3;disegnaWizard()"' + (ok ? '' : ' disabled') + '>Avanti: riepilogo</button></div>' +
    (ok ? '' : '<p class="muted" style="margin:0;text-align:right;font-size:14px">Per andare avanti ogni area deve avere esattamente i termini che servono.</p>');
}
function wzcAggiungi() { leggiPasso1(); S.wz.colleghi.push({ nome: '', codice: null, permessi: { revisione: true } }); disegnaWizard(); }
function wzcTogli(i) { leggiPasso1(); S.wz.colleghi.splice(i, 1); disegnaWizard(); }
function adattaMassimo() {
  var w = S.wz, max = Math.max.apply(null, w.classi.map(function (c) { return c.max; }));
  var regge = function (t) { var cl = w.classi.map(function (c) { return Object.assign({}, c, { tpa: Math.min(c.max, t) }); }); var f = fabbisognoClient(cl); return AREE_N.every(function (n) { return f[n] <= w.disp[n]; }) ? cl : null; };
  for (var t = max - 1; t >= 4; t--) {
    var cl = regge(t);
    if (cl) {
      w.classi.forEach(function (c, i) { c.tpa = cl[i].tpa; });
      w.fab = fabbisognoClient(w.classi);
      AREE_N.forEach(function (n) { w.termini[n] = w.termini[n].slice(0, w.fab[n]); });
      w.ridotto = { da: max, a: t };
      return;
    }
  }
}
function tornaAlMassimo() {
  var w = S.wz; w.classi.forEach(function (c) { c.tpa = c.max; }); w.fab = fabbisognoClient(w.classi); w.ridotto = null; disegnaWizard();
}
function escludiWz() { var w = S.wz, e = w.scartati.slice(); AREE_N.forEach(function (n) { w.termini[n].forEach(function (x) { e.push(x.t); }); }); return e; }
function wzSostituisci(n, k, btn) {
  var w = S.wz, vecchio = w.termini[n][k];
  btn.disabled = true;
  var ric = {}; ric[n] = 1;
  api('generatermini', { richiesta: ric, escludi: escludiWz(), seme: Math.floor(Math.random() * 1e9) }).then(function (x) {
    if (!x.aree[n].length) { btn.disabled = false; toast('La banca non ha altri termini liberi per quest\'area: aggiungine uno tuo.', true); return; }
    w.scartati.push(vecchio.t); w.termini[n][k] = { t: x.aree[n][0][0], d: x.aree[n][0][1], o: 'banca' }; disegnaWizard();
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function wzTogli(n, k) { var x = S.wz.termini[n].splice(k, 1)[0]; if (x && x.o === 'banca') S.wz.scartati.push(x.t); disegnaWizard(); }
function wzAltri(n, btn) {
  var w = S.wz, ric = {}; ric[n] = w.fab[n] - w.termini[n].length;
  btn.disabled = true;
  api('generatermini', { richiesta: ric, escludi: escludiWz(), seme: Math.floor(Math.random() * 1e9) }).then(function (x) {
    x.aree[n].forEach(function (y) { w.termini[n].push({ t: y[0], d: y[1], o: 'banca' }); });
    if (x.mancano[n]) toast('La banca non ha abbastanza termini liberi in quest\'area: ne mancano ' + x.mancano[n] + ', aggiungili tu.', true);
    disegnaWizard();
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function wzMiei(n, btn) {
  var righe = String($('wzX' + n).value || '').split(/\n+/).map(function (r) { return r.trim(); }).filter(Boolean);
  if (!righe.length) { toast('Scrivi almeno un termine: «termine | definizione».', true); return; }
  var voci = righe.map(function (r) { var p = r.split('|'); return { area: n, termine: (p[0] || '').trim(), def: p.slice(1).join('|').trim() }; });
  // controllo anche contro i termini già in lista
  var w = S.wz, tutti = []; AREE_N.forEach(function (m) { w.termini[m].forEach(function (x) { tutti.push({ area: m, termine: x.t, def: x.d }); }); });
  btn.disabled = true;
  api('verificatermini', { termini: tutti.concat(voci) }).then(function (x) {
    btn.disabled = false;
    var esiti = x.esiti.slice(tutti.length), problemi = esiti.filter(function (e) { return e.problema; });
    if (problemi.length) { toast('«' + (problemi[0].termine || '(vuoto)') + '»: ' + problemi[0].problema, true); return; }
    var simili = esiti.filter(function (e) { return e.simile; });
    var aggiungi = function () { esiti.forEach(function (e) { w.termini[n].push({ t: e.termine, d: e.def, o: 'mio', avviso: e.simile ? 'Simile a «' + e.simile.termine + '» (' + e.simile.dove + ')' : '' }); }); disegnaWizard(); };
    var nelleStesse = simili.filter(function (e) { return e.simile.dove === 'questo elenco' || (w.tipo === 'classe' && e.simile.dove === 'edizione in corso'); });
    if (nelleStesse.length) { toast('«' + nelleStesse[0].termine + '» è troppo simile a «' + nelleStesse[0].simile.termine + '», che finirebbe sullo stesso cartellone: cambialo.', true); return; }
    if (!simili.length) return aggiungi();
    finestra('Termini simili a quelli già usati', '<ul style="margin:0;padding-left:20px">' + simili.map(function (e) { return '<li><b>' + esc(e.termine) + '</b> somiglia a <b>' + esc(e.simile.termine) + '</b> (' + esc(e.simile.dove) + ', ' + esc(e.simile.motivo) + ')</li>'; }).join('') + '</ul>' +
      '<p style="margin:0">Lo scopo è non ripetere termini già fatti. Vuoi aggiungerli lo stesso?</p>', [{ t: 'Aggiungili lo stesso', f: aggiungi }]);
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function passo3Html() {
  var w = S.wz, tot = 0; AREE_N.forEach(function (n) { tot += w.termini[n].length; });
  var righe = w.classi.map(function (c) {
    var ripresi = c.alunni.filter(function (a) { return a.riprendi; }).length;
    return '<tr><td><b>' + esc(c.nome) + '</b></td><td class="n">' + c.alunni.length + (ripresi ? '<br><span class="muted" style="font-size:13px">' + ripresi + ' ripresi</span>' : '') + '</td><td class="n">' + c.tpa + (c.max && c.max !== c.tpa ? '<br><span class="muted" style="font-size:13px">massimo ' + c.max + '</span>' : '') + '</td><td>' + (c.modo === 'gruppi' ? '4 gruppi, uno per area' : 'tutte le aree') + '</td>' +
      '<td>' + (c.partenza ? esc(oraIt(new Date(c.partenza).toISOString())) : '<span class="muted">da fissare</span>') + '</td><td>' + esc(oraIt(new Date(c.scadenza).toISOString())) + '</td></tr>';
  }).join('');
  var avvisi = [];
  if (w.tipo === 'edizione' && S.d.admin.archiviata !== S.d.admin.impostazioni.edizione.id) avvisi.push('L\'edizione in corso (' + S.d.admin.impostazioni.edizione.nome + ') verrà chiusa agli alunni e archiviata: resta consultabile nell\'archivio e nella pagina pubblica.');
  if (w.tipo === 'edizione') avvisi.push('L\'app passa alla nuova edizione: gli alunni dell\'edizione archiviata non ripresi non potranno più entrare (i loro dati restano nell\'archivio). Il tuo codice docente resta lo stesso.');
  else avvisi.push('Le definizioni della nuova classe vanno sugli stessi quattro cartelloni. Le domande già assegnate alle altre classi non cambiano.');
  avvisi.push('Dopo la creazione trovi i codici e le schede con QR nel pagina «Codici e schede QR».');
  return '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Classe</th><th style="text-align:right">Alunni</th><th style="text-align:right">Termini a testa</th><th>Distribuzione</th><th>Partenza</th><th>Scadenza</th></tr></thead><tbody>' + righe + '</tbody></table></div>' +
    '<p style="margin:0">Termini nuovi: <b>' + tot + '</b> (' + AREE_N.filter(function (n) { return w.fab[n]; }).map(function (n) { return 'area ' + n + ': ' + w.termini[n].length; }).join(', ') + ').' +
    (w.tipo === 'edizione' ? ' Edizione: <b>' + esc(w.nome) + '</b>, a.s. ' + esc(w.as) + '. Colleghi: ' + (w.colleghi.length ? w.colleghi.map(function (c) { return esc(c.nome) + ' (' + FACOLTA.filter(function (f) { return c.permessi[f[0]]; }).map(function (f) { return f[1].toLowerCase(); }).join(', ') + ')'; }).join('; ') : 'nessuno') + '. Penalità: proposta ' + w.proposta + ' (' + (w.proposta === 'A' ? '−0,25' : '−0,50') + ' per errore). Termini ricevuti: ' + w.giorniIt + ' giorni. Termini degli esclusi: ' + (w.riassegnazione === 'manuale' ? 'decidi tu.' : 'in automatico, a sorte.') : '') + '</p>' +
    avvisi.map(function (a) { return '<p class="note" style="margin:0">' + esc(a) + '</p>'; }).join('') +
    '<div class="row" style="justify-content:space-between"><button class="btn sec" onclick="S.wz.passo=2;disegnaWizard()">Indietro</button><button class="btn ok" onclick="wzCrea(this)">' + (w.tipo === 'edizione' ? 'Crea la nuova edizione' : 'Aggiungi la classe') + '</button></div>';
}
function wzCrea(btn) {
  var w = S.wz;
  var termini = {}; AREE_N.forEach(function (n) { termini[n] = w.termini[n].map(function (x) { return [x.t, x.d]; }); });
  var classi = w.classi.map(function (c) { return { nome: c.nome, tpa: c.tpa, modo: c.modo, partenza: c.partenza ? new Date(c.partenza).toISOString() : null, scadenza: new Date(c.scadenza).toISOString(), alunni: c.alunni }; });
  btn.disabled = true; btn.textContent = 'Creazione in corso…';
  var p = w.tipo === 'edizione' ? api('nuovaedizione', { nome: w.nome, as: w.as, classi: classi, termini: termini, riassegnazione: w.riassegnazione, proposta: w.proposta, giorniIt: w.giorniIt, colleghi: w.colleghi.filter(function (c) { return String(c.nome).trim(); }) }) : api('aggiungiclasse', { classe: classi[0], termini: termini });
  p.then(function (x) {
    chiudiWizard();
    S.filtro.classe = 'tutte';
    return ricarica(w.tipo === 'edizione' ? 'Nuova edizione creata: ' + x.alunni + ' alunni, ' + x.termini + ' termini' : 'Classe ' + x.classe + ' aggiunta: ' + x.alunni + ' alunni, ' + x.termini + ' termini');
  }).catch(function (e) { btn.disabled = false; btn.textContent = w.tipo === 'edizione' ? 'Crea la nuova edizione' : 'Aggiungi la classe'; toast(errMsg(e), true); });
}

/* ---------- cartelloni 70×100 per la stampa, generati dai dati dell'edizione ---------- */
function stampaCartelloni(quali, abbondanza, lingua) {
  var bil = lingua === 'iten';
  var aree = quali === 'tutti' ? S.d.aree : S.d.aree.filter(function (a) { return String(a.n) === String(quali); });
  var mm = definizioniMancanti(aree);
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per creare il PDF', true); return; }
  w.document.write('<p style="font:18px Arial,sans-serif;padding:24px">Preparo ' + (aree.length > 1 ? 'i cartelloni' : 'il cartellone') + '…</p>');
  var AB = abbondanza ? 3 : 0, W = 700 + 2 * AB, H = 1000 + 2 * AB, as = (S.d.config.edizione || {}).as;
  // si impaginano qui (stessi caratteri) per calcolare la dimensione del testo, poi si passano alla finestra di stampa
  var scatole = aree.map(function (a) {
    var b = document.createElement('div'); b.style.cssText = 'position:absolute;left:-30000px;top:0;width:700mm';
    b.innerHTML = Poster.alfa(a, S.d.termini.filter(function (t) { return t.area == a.n; }), S.d.alunni, { soloApprovate: true, qr: location.origin + '/glossario', as: as, en: bil });
    document.body.appendChild(b); return b;
  });
  caratteriPronti().then(function () {
    var pieni = [];
    var pagine = scatole.map(function (b, i) {
      Poster.adatta(b);
      var f = b.querySelector('.pa-foglio');
      if (f.getAttribute('data-pieno') === '1') pieni.push(aree[i].n);
      var sfondo = getComputedStyle(b.querySelector('.pa-testata')).backgroundImage;
      var html = '<div class="vp"><section class="pg">' + (AB ? '<div style="position:absolute;left:0;right:0;top:0;height:' + (AB + 172) + 'mm;background:' + sfondo + '"></div>' : '') +
        '<div style="position:absolute;left:' + AB + 'mm;top:' + AB + 'mm">' + f.outerHTML + '</div></section></div>';
      b.remove(); return html;
    });
    // la pagina di stampa si carica come documento nuovo (blob), così i caratteri si caricano e si misurano in modo affidabile
    var doc = ('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Cartelloni Glossario ' + esc(as || '') + (bil ? ' (italiano e inglese)' : ' (italiano)') + (AB ? ' – abbondanza 3 mm' : '') + '</title>' +
      '<style>' + cssFonti(location.origin) + '</style>' +
      '<style id="formato">@page{size:' + W + 'mm ' + H + 'mm;margin:0}</style><style>html,body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.pg{position:relative;width:' + W + 'mm;height:' + H + 'mm;overflow:hidden;background:#FBFAF7;break-after:page}.vp:last-of-type .pg{break-after:auto}.barra,.nota,.manca{display:none}' +
      // formato «A4 in scala» (Safari non accetta pagine 70×100): ogni cartellone intero su un A4, in vettoriale, da ingrandire in tipografia
      '@media print{body.a4 .vp{position:relative;width:210mm;height:296mm;overflow:hidden;contain:strict;background:#FBFAF7;break-after:page}body.a4 .vp:last-of-type{break-after:auto}body.a4 .pg{position:absolute;left:' + ((210 - W * 296 / H) / 2).toFixed(3) + 'mm;top:0;transform:scale(' + (296 / H).toFixed(5) + ');transform-origin:0 0;break-after:auto}}' +
      // a schermo: stessa identica impaginazione della stampa, solo rimpicciolita (scala, non zoom: il testo non viene reimpaginato)
      '@media screen{body{background:#C9D2DA;padding:22mm 10mm 10mm}body:not(.vista) .vp{visibility:hidden}.vp{width:' + (W * 0.3) + 'mm;height:' + (H * 0.3) + 'mm;margin:0 auto 10mm;box-shadow:0 2mm 8mm rgba(0,0,0,.25);overflow:hidden}.vp .pg{transform:scale(.3);transform-origin:0 0}' +
      '.barra{display:flex;position:fixed;left:0;right:0;top:0;z-index:9;background:#15212B;color:#fff;font:15px Arial,sans-serif;padding:10px 16px;gap:14px;align-items:center}.manca{display:block;max-width:210mm;margin:0 auto 6mm;background:#FBE6E4;color:#5A1410;border:2px solid #B3261E;border-radius:10px;font:15px/1.4 Arial,sans-serif;padding:10px 14px}.barra b{flex:1}.barra select{font:15px Arial,sans-serif;padding:7px;border-radius:8px;border:0}.nota{display:block;position:fixed;left:0;right:0;top:54px;z-index:9;background:#FFF3CD;color:#3B2F00;font:14px/1.4 Arial,sans-serif;padding:8px 16px}body:not(.a4) .nota{display:none}body.a4{padding-top:36mm}.barra button{font:700 15px Arial,sans-serif;border:0;border-radius:8px;padding:9px 16px;background:#fff;color:#15212B;cursor:pointer}}</style></head><body>' +
      (mm.manca ? '<div class="manca"><b>Attenzione: ' + (mm.manca === 1 ? 'manca 1 definizione approvata' : 'mancano ' + mm.manca + ' definizioni approvate') + ' su ' + mm.tot + '.</b> Questi termini escono con la sola scritta «Definizione a cura di…». ' +
        mm.per.filter(function (x) { return x.manca; }).map(function (x) { return 'Area ' + x.n + ': ' + x.manca; }).join(' · ') + '.</div>' : '') +
      '<div class="barra"><b>Cartelloni 70×100' + (bil ? ' · italiano e inglese' : ' · italiano') + ' · ' + aree.length + (aree.length > 1 ? ' pagine' : ' pagina') + '</b><span>app ' + esc(VERSIONE) + '</span><select id="fmt" aria-label="Formato del PDF" onchange="formato(this.value)"><option value="vero">PDF 70×100 reale (Chrome, Edge)</option><option value="a4">PDF A4 in scala (Safari)</option></select><button onclick="window.print()">Stampa / Salva come PDF</button></div>' +
      '<div class="nota"><b>Formato A4 in scala.</b> Safari non crea pagine 70×100: ogni cartellone esce intero su un foglio A4, in vettoriale. In tipografia si ingrandisce a 70×100 senza perdita di qualità. Nella finestra di stampa scegli il foglio A4 e togli «Stampa intestazioni e piè di pagina». Per il file già in 70×100 apri l\'app con Chrome o Edge.</div>' +
      '<scr' + 'ipt>function formato(v){document.body.classList.toggle("a4",v==="a4");document.getElementById("formato").textContent=v==="a4"?"@page{size:210mm 297mm;margin:0}":"@page{size:' + W + 'mm ' + H + 'mm;margin:0}";document.getElementById("fmt").value=v}' +
      'var ua=navigator.userAgent;if(/Safari/.test(ua)&&!/Chrome|Chromium|Edg|OPR|CriOS/.test(ua))formato("a4");</scr' + 'ipt>' + pagine.join('') +
      '<scr' + 'ipt>var adatta=' + Poster.adatta.toString() + ';</scr' + 'ipt>' +
      // nella finestra di stampa si riadatta con i caratteri caricati lì, poi si stampa
      scriptStampa('[].forEach.call(document.querySelectorAll(".pa-foglio"),function(f){adatta(f)});document.body.classList.add("vista");document.body.setAttribute("data-pronto","1");setTimeout(function(){window.print()},400)') + '</body></html>');
    var url = URL.createObjectURL(new Blob([doc], { type: 'text/html' }));
    w.location.href = url; setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
    if (pieni.length) toast('Cartellone ' + pieni.join(', ') + ': troppi termini per il formato 70×100, gli ultimi non entrano.', true);
  });
}

/* ---------- termini e definizioni in inglese per i cartelloni (pagina #inglese) ---------- */
function apriTraduzioni() {
  if (location.hash !== '#inglese') { location.hash = 'inglese'; return; }
  S.tr = { area: String(S.poster || 1), dati: null, cambiate: {} };
  $('app').innerHTML = testata('Termini e definizioni in inglese') + '<main class="wrap stack"><section class="card"><p style="margin:0">Carico i termini…</p></section></main>';
  api('traduzioni', {}).then(function (x) { if (!S.tr) return; S.tr.dati = x.aree; disegnaTraduzioni(); window.scrollTo(0, 0); })
    .catch(function (e) { toast(errMsg(e), true); chiudiTraduzioni(); });
}
function chiudiTraduzioni(ricaricare) {
  S.tr = null; S.pag = 'cartelloni'; ricordaPag('cartelloni');
  if (location.hash === '#inglese') history.replaceState(null, '', location.pathname + location.search);
  if (ricaricare) return ricarica();
  vistaDocente(); var p = $('pbox'); if (p) p.scrollIntoView({ block: 'center' });
}
window.addEventListener('hashchange', function () {
  if (!S.d || !S.d.utente || RO() || !PUO('documenti')) return;
  if (location.hash === '#inglese' && !S.tr) apriTraduzioni();
  else if (location.hash !== '#inglese' && S.tr) { S.tr = null; vistaDocente(); }
});
function disegnaTraduzioni() {
  var T = S.tr, A = T.dati.filter(function (a) { return String(a.n) === T.area; })[0] || T.dati[0];
  var conta = function (a) { var app = a.voci.filter(function (v) { return v.approvata; }); return { app: app.length, ok: app.filter(function (v) { return v.en && v.defEn; }).length, tot: a.voci.length, en: a.voci.filter(function (v) { return v.en; }).length }; };
  var schede = T.dati.map(function (a) { var c = conta(a), z = area(a.n) || {}; return '<button class="btn' + (String(a.n) === T.area ? '' : ' sec') + '" style="min-height:40px' + (String(a.n) === T.area ? ';background:' + esc(z.colore) + ';border-color:' + esc(z.colore) : '') + '" onclick="trArea(\'' + a.n + '\')">' + a.n + '. ' + esc(a.it) + ' <span style="font-weight:400;opacity:.85">' + c.ok + '/' + c.app + '</span></button>'; }).join('');
  var c = conta(A);
  var righe = A.voci.map(function (v, i) {
    var cam = T.cambiate[A.n + ':' + v.id] || {};
    var en = cam.en != null ? cam.en : v.en, de = cam.defEn != null ? cam.defEn : v.defEn;
    var stato = !en || (v.approvata && !de) ? '<span class="chip s-correggere">da completare</span>' : v.approvata ? '<span class="chip s-approvata">approvata</span>' : '<span class="chip s-vuota">non ancora approvata</span>';
    return '<div class="stack" style="gap:6px;border-top:1px solid var(--line);padding-top:12px">' +
      '<div class="row" style="justify-content:space-between"><b style="font-size:17px">' + esc(v.it) + '</b>' + stato + '</div>' +
      '<div class="grid2"><div><label for="trE' + i + '">Termine in inglese</label><input id="trE' + i + '" type="text" maxlength="100" value="' + esc(en) + '" oninput="trCambia(\'' + A.n + '\',\'' + v.id + '\',\'en\',this.value)"></div>' +
      '<div class="muted" style="font-size:14px;align-self:end">' + esc(v.alunno) + '</div></div>' +
      '<div style="font-size:15px"><span class="muted">' + (v.approvata ? 'Definizione approvata:' : 'Definizione corretta (da approvare):') + '</span> ' + esc(v.defIt) + '</div>' +
      '<div><label for="trD' + i + '">Definizione in inglese</label><textarea id="trD' + i + '" rows="2" maxlength="400" style="width:100%;font:inherit;padding:10px;border:2px solid var(--line);border-radius:10px" oninput="trCambia(\'' + A.n + '\',\'' + v.id + '\',\'defEn\',this.value)">' + esc(de) + '</textarea></div></div>';
  }).join('');
  var n = Object.keys(T.cambiate).length;
  $('app').innerHTML = testata('Termini e definizioni in inglese') + '<main class="wrap stack">' +
    '<section class="card stack"><div class="row" style="justify-content:space-between"><h1 class="disp" style="margin:0;font-size:26px">Termini e definizioni in inglese</h1><button class="btn sec" onclick="trEsci()">Torna ai cartelloni</button></div>' +
    '<p class="muted" style="margin:0">Per i cartelloni in italiano e inglese. Ogni termine e ogni definizione già data dagli studenti ha la sua versione in <b>inglese tecnico</b>, già pronta: controllala e, se vuoi, correggila. I termini scritti da te in una nuova edizione vanno tradotti qui. L\'app degli studenti non cambia.</p>' +
    '<div class="row" style="gap:6px">' + schede + '</div>' +
    '<p style="margin:0">Area ' + A.n + ': <b>' + c.ok + ' su ' + c.app + '</b> definizioni approvate con l\'inglese · ' + c.en + ' termini su ' + c.tot + ' con il nome in inglese.</p>' +
    '<div class="row"><button class="btn ok" id="trSalva" onclick="trSalva(this)"' + (n ? '' : ' disabled') + '>Salva le modifiche' + (n ? ' (' + n + ')' : '') + '</button></div></section>' +
    '<section class="card stack">' + righe + '</section></main>';
}
function trArea(n) { S.tr.area = String(n); disegnaTraduzioni(); window.scrollTo(0, 0); }
function trCambia(area, id, campo, val) {
  var k = area + ':' + id, c = S.tr.cambiate[k] = S.tr.cambiate[k] || {}; c[campo] = val;
  var b = $('trSalva'); if (b) { b.disabled = false; b.textContent = 'Salva le modifiche (' + Object.keys(S.tr.cambiate).length + ')'; }
}
function trVoci() {
  var out = [];
  Object.keys(S.tr.cambiate).forEach(function (k) {
    var p = k.split(':'), a = S.tr.dati.filter(function (x) { return String(x.n) === p[0]; })[0], v = a.voci.filter(function (x) { return x.id === p[1]; })[0], c = S.tr.cambiate[k];
    out.push({ area: a.n, k: v.k, idxDef: v.idxDef, en: c.en != null ? c.en : v.en, defEn: c.defEn != null ? c.defEn : v.defEn });
  });
  return out;
}
function trSalva(btn) {
  var voci = trVoci(); if (!voci.length) return;
  btn.disabled = true; btn.textContent = 'Salvo…';
  api('salvatraduzioni', { voci: voci }).then(function () {
    voci.forEach(function (v) { S.tr.dati.forEach(function (a) { if (a.n != v.area) return; a.voci.forEach(function (x) { if (x.k === v.k) x.en = v.en; if (x.idxDef === v.idxDef) x.defEn = v.defEn; }); }); });
    S.tr.cambiate = {}; S.tr.salvato = true; disegnaTraduzioni(); toast('Traduzioni salvate');
  }).catch(function (e) { btn.disabled = false; btn.textContent = 'Salva le modifiche'; toast(errMsg(e), true); });
}
function trEsci() {
  var esci = function () { var s = S.tr && S.tr.salvato; chiudiTraduzioni(s); };
  if (Object.keys(S.tr.cambiate).length) finestra('Modifiche non salvate', '<p style="margin:0">Hai modifiche non salvate alle traduzioni.</p>', [{ t: 'Esci senza salvare', warn: true, f: esci }]);
  else esci();
}

/* ---------- colleghi docenti e loro facoltà ---------- */
var FACOLTA = [['revisione', 'Rivedere le risposte', 'approvare, rimandare, commentare'], ['voti', 'Voti', 'inserire o cambiare il voto finale'], ['studenti', 'Studenti', 'proroghe, riammissioni, passaggio dei termini'], ['documenti', 'Documenti', 'report, Word, presentazione, cartelloni, inglese'], ['codici', 'Codici e schede QR', 'degli alunni']];
function editorColleghi(prefisso, elenco) {
  return '<div class="stack" style="gap:10px">' + elenco.map(function (c, i) {
    return '<div class="stack" style="gap:8px;border:2px solid var(--line);border-radius:12px;padding:12px">' +
      '<div class="grid2"><div><label for="' + prefisso + 'N' + i + '">Nome del collega</label><input id="' + prefisso + 'N' + i + '" type="text" maxlength="60" placeholder="prof.ssa Maria Rossi" value="' + esc(c.nome || '') + '"></div>' +
      '<div style="align-self:end">' + (c.codice ? 'Codice di accesso: <b class="disp" style="font-size:18px;letter-spacing:.08em">' + esc(c.codice) + '</b>' : '<span class="muted">Il codice di accesso si crea al salvataggio.</span>') + '</div></div>' +
      '<div class="row" style="gap:6px 16px">' + FACOLTA.map(function (f) { return '<label class="row" style="gap:6px;font-weight:400;cursor:pointer" title="' + esc(f[2]) + '"><input type="checkbox" data-c="' + i + '" data-f="' + f[0] + '" class="' + prefisso + 'F"' + (c.permessi && c.permessi[f[0]] ? ' checked' : '') + ' style="width:20px;height:20px"> <b>' + esc(f[1]) + '</b> <span class="muted" style="font-size:13px">(' + esc(f[2]) + ')</span></label>'; }).join('') + '</div>' +
      '<div><button class="btn sec" style="min-height:34px;padding:0 10px" onclick="' + prefisso + 'Togli(' + i + ')">Togli questo collega</button></div></div>';
  }).join('') + '<div><button class="btn sec" onclick="' + prefisso + 'Aggiungi()">+ Aggiungi un collega</button></div></div>';
}
function leggiColleghi(prefisso, elenco) {
  return elenco.map(function (c, i) {
    var p = {}; document.querySelectorAll('.' + prefisso + 'F[data-c="' + i + '"]').forEach(function (x) { p[x.getAttribute('data-f')] = x.checked; });
    return { nome: ($(prefisso + 'N' + i) || {}).value || '', codice: c.codice || null, permessi: p };
  });
}
function bloccoColleghi() {
  S.col = S.col || (S.d.admin.colleghi || []).map(function (c) { return { nome: c.nome, codice: c.codice, permessi: Object.assign({}, c.permessi) }; });
  return '<section class="card stack admin" id="colleghi"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Colleghi docenti</h2><span class="chip s-vuota">Solo prof. Cerrato</span></div>' +
    '<p class="muted" style="margin:0;font-size:15px">Aggiungi un collega e scegli cosa può fare: tutte le facoltà o solo alcune. Entra nell\'app con il suo codice, come te. Impostazioni, edizioni, chiusura e backup restano solo tuoi.</p>' +
    '<div id="colBox">' + editorColleghi('col', S.col) + '</div>' +
    '<div class="row"><button class="btn" onclick="salvaColleghi(this)">Salva i colleghi</button></div></section>';
}
function colAggiungi() { S.col = leggiColleghi('col', S.col); S.col.push({ nome: '', codice: null, permessi: { revisione: true } }); $('colBox').innerHTML = editorColleghi('col', S.col); }
function colTogli(i) { S.col = leggiColleghi('col', S.col); S.col.splice(i, 1); $('colBox').innerHTML = editorColleghi('col', S.col); }
function salvaColleghi(btn) {
  var el = leggiColleghi('col', S.col).filter(function (c) { return String(c.nome).trim(); });
  btn.disabled = true;
  api('colleghi', { colleghi: el }).then(function (x) { S.col = null; return ricarica(x.colleghi.length ? 'Colleghi salvati: comunica a ciascuno il suo codice' : 'Nessun collega: l\'app è solo tua'); })
    .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
