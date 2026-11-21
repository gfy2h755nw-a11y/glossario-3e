/* ---------- procedura guidata «Nuova attività»: un passo per schermata ----------
 * 1 Attività · 2 Classe e alunni · 3 Aree · 4 Termini a testa · 5 Date · 6 Regole · 7 Termini · 8 Riepilogo
 * I passi 7 e 8 usano passo2Html e passo3Html (gestione.js); la creazione è wzCrea (azione «nuovaattivita»).
 * Ogni area ha una fonte: 'banca:N' (banca del laboratorio), 'pk:ID:N' (area N di un elenco pronto) o 'mia' (termini scritti dal docente). */
var PASSI_ATT = ['Attività', 'Classe e alunni', 'Aree', 'Termini a testa', 'Date', 'Regole', 'Termini', 'Riepilogo'];
var COLORI_WZ = ['#2E6DB4', '#B5532A', '#1F8A70', '#7A4FA0', '#C2185B', '#5D6D2E'];

/* tutte le aree pronte da cui attingere, raggruppate per provenienza */
function fontiAree() {
  var out = [], B = S.d.banca || {};
  (S.d.areeStd || []).forEach(function (a) { out.push({ f: 'banca:' + a.n, gruppo: 'Banca del laboratorio (3ª)', it: a.it, colore: a.colore, n: B[a.n] || 0 }); });
  (S.d.pacchetti || []).forEach(function (p) { p.aree.forEach(function (a, i) { var k = String(i + 1); out.push({ f: 'pk:' + p.id + ':' + k, gruppo: 'Elenco pronto: ' + p.nome, it: a.it, colore: a.colore, n: p.termini[k] || 0 }); }); });
  return out;
}
function fonteDi(f) { return fontiAree().filter(function (x) { return x.f === f; })[0] || null; }
function wzFonti() { var w = S.wz, o = {}; if (!w || !w.aree) return undefined; w.aree.forEach(function (a, i) { o[String(i + 1)] = a.fonte || 'mia'; }); return o; }
function wzAreaMia(n) { var w = S.wz; if (!w || w.tipo !== 'attivita' || !w.aree) return false; var a = w.aree[Number(n) - 1]; return !!a && (a.fonte || 'mia') === 'mia'; }

function nuovaClasseAtt() { return { nome: '', n: 0, righe: [], tpa: 10, max: 10, modo: 'misto', partenza: '', scadenza: localeTra(14), testo: '', riprendi: {}, alunni: [] }; }
function prepAttivita() {
  var w = S.wz;
  w.areeMie = true; w.pacchetto = null; w.aree = []; w.classi = [nuovaClasseAtt()]; w.regoleAperte = false;
  setTimeout(controllaBozzaWz, 0);
}

function paginaAttivita() {
  var w = S.wz, p = w.passo;
  var barra = '<ol class="wzpassi" aria-label="Passi della procedura">' + PASSI_ATT.map(function (t, i) {
    var st = i + 1 < p ? 'fatto' : i + 1 === p ? 'ora' : '';
    return '<li class="' + st + '"' + (i + 1 === p ? ' aria-current="step"' : '') + '>' + (i + 1 < p && i + 1 < 7 ? '<button type="button" onclick="wzSaltaA(' + (i + 1) + ')">' : '<span>') + '<b>' + (i + 1) + '</b> ' + t + (i + 1 < p && i + 1 < 7 ? '</button>' : '</span>') + '</li>';
  }).join('') + '</ol>';
  var corpo = p === 1 ? attPasso1() : p === 2 ? attPasso2() : p === 3 ? attPasso3() : p === 4 ? attPasso4() : p === 5 ? attPasso5() : p === 6 ? attPasso6() : p === 7 ? passo2Html() : passo3Html();
  var h = testata('Nuova attività') + '<main class="wrap stack"><div id="wz" class="stack">' +
    '<section class="card stack"><div class="row" style="justify-content:space-between"><h1 class="disp" style="margin:0;font-size:28px">Nuova attività</h1><div class="row" style="gap:8px"><span id="wzSalv" class="muted" style="font-size:14px">' + (w._salvata ? 'Bozza salvata alle ' + oraBreveWz(w._salvata) : '') + '</span>' + (w._salvata ? '<button class="btn sec" style="min-height:38px" onclick="ricominciaWz()">Ricomincia da capo</button>' : '') + '<button class="btn sec" onclick="chiudiWizard()">Esci (la bozza resta salvata)</button></div></div>' +
    '<p class="muted" style="margin:0">Un\'attività nuova che <b>corre in parallelo</b> a quelle in corso, senza toccarle: classi, alunni, aree, cartelloni, termini e regole propri.</p>' + barra + '</section>' +
    '<section class="card stack"><h2 style="margin:0;font-size:23px">' + p + '. ' + PASSI_ATT[p - 1] + '</h2>' + corpo + (p <= 6 ? navAtt() : '') + '</section></div></main>';
  $('app').innerHTML = h;
  salvaBozzaWz();
  var f = document.querySelector('#wz section:last-child input, #wz section:last-child select');
  if (f && p !== S.wz._ultimoFocus) { S.wz._ultimoFocus = p; try { f.focus({ preventScroll: true }); } catch (e) {} }
}
function navAtt() {
  var p = S.wz.passo;
  return '<div class="row" style="justify-content:space-between;margin-top:6px">' + (p > 1 ? '<button class="btn sec" onclick="wzIndietro()">Indietro</button>' : '<span></span>') +
    '<button class="btn" id="wzAvanti" onclick="wzAvantiAtt(this)">' + (p === 6 ? 'Avanti: proponi i termini' : 'Avanti: ' + PASSI_ATT[p].toLowerCase()) + '</button></div>';
}
function wzVai(d) { if (S.wz.tipo === 'attivita' && S.wz.passo <= 6) leggiAtt(); S.wz.passo += d; disegnaWizard(); window.scrollTo(0, 0); }
function wzIndietro() { wzVai(-1); }
function wzSaltaA(p) { if (S.wz.passo <= 6) leggiAtt(); S.wz.passo = p; disegnaWizard(); window.scrollTo(0, 0); }

/* ---------- 1. Attività ---------- */
function attPasso1() {
  var w = S.wz;
  return '<div class="grid2"><div><label for="wzNome">Nome dell\'attività</label><input id="wzNome" type="text" placeholder="es. Glossario di quarta 4E" value="' + esc(w.nome) + '"><small class="muted" style="font-size:13px">Compare nell\'area docenti, sui cartelloni e nei report.</small></div>' +
    '<div><label for="wzAs">Anno scolastico</label><input id="wzAs" type="text" placeholder="2026/27" value="' + esc(w.as) + '"></div></div>' +
    '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:16px;margin-bottom:6px">Di chi è l\'attività</legend>' +
    [['mia', 'È una mia attività'], ['collega', 'È per un collega: sull\'app, sui cartelloni, sulla pagina pubblica e nei report compare il suo nome con la dicitura <i>«Per gentile concessione del Prof. Danilo Cerrato»</i>']].map(function (x) {
      var on = (w.conc ? 'collega' : 'mia') === x[0];
      return '<label class="op' + (on ? ' on' : '') + '"><input type="radio" name="wzChi" value="' + x[0] + '"' + (on ? ' checked' : '') + ' onchange="leggiAtt();S.wz.conc=this.value===\'collega\'?(S.wz.conc||{docente:\'\',materia:\'\'}):null;disegnaWizard()"><span>' + x[1] + '</span></label>'; }).join('') + '</fieldset>' +
    (w.conc ? '<div class="grid2"><div><label for="wzCd">Docente (come deve comparire)</label><input id="wzCd" type="text" maxlength="60" placeholder="es. Prof.ssa Maria Bianchi" value="' + esc(w.conc.docente) + '"></div>' +
      '<div><label for="wzCm">Materia (facoltativa)</label><input id="wzCm" type="text" maxlength="60" placeholder="es. Scienze dei materiali dentali" value="' + esc(w.conc.materia) + '"></div></div>' : '');
}

/* ---------- 2. Classe e alunni ---------- */
function righeClasse(c) {
  while (c.righe.length < c.n) c.righe.push({ c: '', n: '' });
  return c.righe.slice(0, c.n);
}
function attPasso2() {
  var w = S.wz, h = '';
  w.classi.forEach(function (c, i) {
    var R = righeClasse(c), pieni = R.filter(function (r) { return (r.c + r.n).trim(); }).length;
    h += '<fieldset class="stack wzcl"><legend>Classe' + (w.classi.length > 1 ? ' ' + (i + 1) : '') + '</legend>' +
      '<div class="grid4"><div><label for="wzC' + i + '">Nome della classe</label><input id="wzC' + i + '" type="text" maxlength="6" placeholder="es. 4E" value="' + esc(c.nome) + '"></div>' +
      '<div><label for="wzN' + i + '">Numero di studenti</label><input id="wzN' + i + '" type="number" min="1" max="40" inputmode="numeric" placeholder="es. 22" value="' + (c.n || '') + '" onchange="wzNumero(' + i + ')"><small class="muted" style="font-size:13px">Compaiono altrettante righe da compilare.</small></div></div>' +
      '<div class="row" style="gap:8px"><label class="btn sec" style="min-height:38px;cursor:pointer;display:inline-flex;align-items:center" for="wzF' + i + '">Carica da Excel o CSV</label><input id="wzF' + i + '" type="file" accept=".xlsx,.xls,.ods,.csv,.txt" style="display:none" onchange="caricaElencoAtt(' + i + ',this)">' +
      '<button class="btn sec" style="min-height:38px" onclick="wzIncolla(' + i + ')">Incolla un elenco</button><span class="muted" style="font-size:14px">colonne <b>Cognome</b> e <b>Nome</b>; il numero di studenti si aggiorna da solo</span></div>' +
      '<div id="wzInc' + i + '" hidden class="stack" style="gap:6px"><label for="wzIt' + i + '">Un alunno per riga: <i>Cognome Nome</i>, oppure due colonne copiate da Excel</label><textarea id="wzIt' + i + '" rows="6" style="width:100%;font:inherit;padding:10px;border:2px solid var(--line);border-radius:10px"></textarea><div><button class="btn sec" style="min-height:36px" onclick="wzUsaIncolla(' + i + ')">Usa questo elenco</button></div></div>' +
      (c.n ? '<div style="overflow-x:auto"><table class="tbl wzal"><thead><tr><th style="width:44px">N.</th><th>Cognome</th><th>Nome</th></tr></thead><tbody>' + R.map(function (r, k) {
        return '<tr><td class="n">' + (k + 1) + '</td><td><input id="wzAc' + i + '_' + k + '" type="text" aria-label="Cognome dell\'alunno ' + (k + 1) + '" value="' + esc(r.c) + '"></td><td><input id="wzAn' + i + '_' + k + '" type="text" aria-label="Nome dell\'alunno ' + (k + 1) + '" value="' + esc(r.n) + '"></td></tr>';
      }).join('') + '</tbody></table></div><p class="muted" style="margin:0;font-size:14px">' + pieni + ' su ' + c.n + ' righe compilate.</p>' : '<p class="note info" style="margin:0">Scrivi il numero di studenti, oppure carica o incolla l\'elenco.</p>') +
      (w.classi.length > 1 ? '<div><button class="btn sec" style="min-height:36px" onclick="leggiAtt();S.wz.classi.splice(' + i + ',1);disegnaWizard()">Togli questa classe</button></div>' : '') + '</fieldset>';
  });
  return h + '<div><button class="btn sec" onclick="leggiAtt();S.wz.classi.push(nuovaClasseAtt());disegnaWizard()">+ Aggiungi un\'altra classe</button></div>';
}
function wzNumero(i) { leggiAtt(); var c = S.wz.classi[i]; c.n = Math.max(0, Math.min(40, Math.floor(Number($('wzN' + i).value) || 0))); disegnaWizard(); }
function wzIncolla(i) { var b = $('wzInc' + i); b.hidden = !b.hidden; if (!b.hidden) $('wzIt' + i).focus(); }
/* righe di una tabella (Excel/CSV/incollato) → [{c: cognome, n: nome}] */
function alunniDaRighe(righe) {
  var pul = function (x) { return String(x == null ? '' : x).replace(/\s+/g, ' ').trim(); };
  var iC = -1, iN = -1, iU = -1, h = -1;
  for (var r = 0; r < Math.min(righe.length, 8) && h < 0; r++) {
    righe[r].forEach(function (c, k) { var v = pul(c).toLowerCase(); if (/^cognome$/.test(v)) iC = k; else if (/^nome$/.test(v)) iN = k; else if (/alunn|student|nominativ|cognome e nome|nome e cognome/.test(v)) iU = k; });
    if (iC >= 0 || iU >= 0) h = r; else { iC = iN = iU = -1; }
  }
  var out = [], visti = {};
  (h >= 0 ? righe.slice(h + 1) : righe).forEach(function (row) {
    var co, no;
    if (h >= 0 && iC >= 0) { co = pul(row[iC]); no = iN >= 0 ? pul(row[iN]) : ''; }
    else {
      var celle = h >= 0 && iU >= 0 ? [pul(row[iU])] : row.map(pul).filter(function (x) { return x && !/^\d+([.,]\d+)?$/.test(x); });
      if (celle.length >= 2) { co = celle[0]; no = celle[1]; }
      else { var p = (celle[0] || '').split(' '); co = p[0] || ''; no = p.slice(1).join(' '); }
    }
    var k = (co + ' ' + no).toLowerCase().trim();
    if (k && /[a-zà-ÿ]/i.test(k) && !visti[k]) { visti[k] = 1; out.push({ c: co, n: no }); }
  });
  return out;
}
function metteAlunni(i, lista, da) {
  if (!lista.length) { toast('Non ho trovato nomi: servono le colonne Cognome e Nome.', true); return; }
  if (lista.length > 40) { toast('Massimo 40 alunni per classe: ne ho trovati ' + lista.length + '.', true); return; }
  var c = S.wz.classi[i]; c.righe = lista; c.n = lista.length; disegnaWizard(); toast('Inseriti ' + lista.length + ' alunni' + (da ? ' da ' + da : ''));
}
function wzUsaIncolla(i) {
  leggiAtt();
  var t = String($('wzIt' + i).value || ''), righe = t.split(/\r?\n/).filter(function (r) { return r.trim(); }).map(function (r) { return /\t/.test(r) ? r.split('\t') : /;/.test(r) ? r.split(';') : [r]; });
  metteAlunni(i, alunniDaRighe(righe));
}
function caricaElencoAtt(i, inp) {
  var f = inp.files && inp.files[0]; inp.value = ''; if (!f) return;
  leggiAtt();
  if (/\.(xlsx|xls|ods)$/i.test(f.name)) {
    caricaXlsx().then(function (X) { return f.arrayBuffer().then(function (buf) { var wb = X.read(buf, { type: 'array' }); return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' }); }); })
      .then(function (righe) { metteAlunni(i, alunniDaRighe(righe), f.name); }).catch(function (e) { toast(errMsg(e), true); });
  } else { var r = new FileReader(); r.onload = function () { metteAlunni(i, alunniDaRighe(righeCsv(r.result)), f.name); }; r.readAsText(f); }
}

/* ---------- 3. Aree ---------- */
function attPasso3() {
  var w = S.wz, F = fontiAree(), gruppi = [], scelte = {};
  w.aree.forEach(function (a) { if (a.fonte && a.fonte !== 'mia') scelte[a.fonte] = 1; });
  F.forEach(function (x) { if (gruppi.indexOf(x.gruppo) < 0) gruppi.push(x.gruppo); });
  var h = '<p style="margin:0">Spunta le aree da cui prendere i termini: <b>ogni area diventa un cartellone</b>. Da 1 a 6 aree in tutto; puoi mescolare aree di elenchi diversi e aggiungere aree tue, con termini che scrivi tu.</p>';
  gruppi.forEach(function (g) {
    h += '<fieldset class="ops wzfonti"><legend>' + esc(g) + '</legend>' + F.filter(function (x) { return x.gruppo === g; }).map(function (x) {
      var on = !!scelte[x.f];
      return '<label class="op' + (on ? ' on' : '') + '"><input type="checkbox" value="' + esc(x.f) + '"' + (on ? ' checked' : '') + ' onchange="wzSpunta(this)"><span class="wzq" style="background:' + esc(x.colore) + '"></span><span><b>' + esc(x.it) + '</b><br><span class="muted" style="font-size:14px">' + x.n + ' termini nell\'elenco</span></span></label>';
    }).join('') + '</fieldset>';
  });
  h += '<div><button class="btn sec" onclick="wzAggiungiMia()"' + (w.aree.length >= 6 ? ' disabled' : '') + '>+ Aggiungi un\'area mia (termini scritti da me)</button></div>';
  if (w.aree.length) {
    h += '<h3 style="margin:8px 0 0;font-size:19px">Le aree scelte (' + w.aree.length + ' di 6), nell\'ordine dei cartelloni</h3><div class="stack" style="gap:8px">' + w.aree.map(function (a, i) {
      var fo = a.fonte && a.fonte !== 'mia' ? fonteDi(a.fonte) : null;
      return '<div class="wzarea" style="border-left:6px solid ' + esc(a.colore) + '"><div class="row" style="gap:8px;align-items:flex-end">' +
        '<b style="width:28px;font-size:18px">' + (i + 1) + '.</b>' +
        '<div style="flex:2;min-width:180px"><label for="wzAr' + i + '">Nome dell\'area (titolo del cartellone)</label><input id="wzAr' + i + '" type="text" maxlength="60" placeholder="es. Protesi mobile" value="' + esc(a.it) + '"></div>' +
        '<div><label for="wzAk' + i + '">Colore</label><input id="wzAk' + i + '" type="color" value="' + esc(a.colore) + '" style="width:56px;height:44px;padding:2px"></div>' +
        '<div style="width:96px"><label for="wzAu' + i + '">Numero</label><input id="wzAu' + i + '" type="text" maxlength="3" value="' + esc(a.numero) + '"></div>' +
        '<div style="flex:2;min-width:200px"><label for="wzAo' + i + '">Motto (facoltativo)</label><input id="wzAo' + i + '" type="text" maxlength="60" value="' + esc(a.motto || '') + '"></div></div>' +
        '<div class="row" style="gap:6px;margin-top:6px"><span class="chip ' + (fo ? 's-approvata' : 's-inviata') + '">' + (fo ? 'termini da: ' + (/^banca/.test(a.fonte) ? 'banca del laboratorio' : 'elenco pronto') + ' · ' + esc(fo.it) : 'termini scritti da te') + '</span>' +
        (i > 0 ? '<button class="btn sec" style="min-height:32px;padding:0 10px;font-size:14px" onclick="wzSposta(' + i + ',-1)" aria-label="Sposta su l\'area ' + (i + 1) + '">↑ Su</button>' : '') +
        (i < w.aree.length - 1 ? '<button class="btn sec" style="min-height:32px;padding:0 10px;font-size:14px" onclick="wzSposta(' + i + ',1)" aria-label="Sposta giù l\'area ' + (i + 1) + '">↓ Giù</button>' : '') +
        '<button class="btn sec" style="min-height:32px;padding:0 10px;font-size:14px" onclick="wzTogliArea(' + i + ')">Togli</button></div></div>';
    }).join('') + '</div>';
  }
  return h;
}
function wzSpunta(inp) {
  leggiAtt();
  var w = S.wz, f = inp.value;
  if (inp.checked) {
    if (w.aree.length >= 6) { inp.checked = false; toast('Al massimo 6 aree (6 cartelloni).', true); return; }
    var x = fonteDi(f); w.aree.push({ it: x.it, colore: x.colore, numero: '', motto: '', fonte: f });
  } else w.aree = w.aree.filter(function (a) { return a.fonte !== f; });
  rinumera(); disegnaWizard();
}
function wzAggiungiMia() { leggiAtt(); var w = S.wz; if (w.aree.length >= 6) return; w.aree.push({ it: '', colore: COLORI_WZ[w.aree.length % 6], numero: '', motto: '', fonte: 'mia' }); rinumera(); disegnaWizard(); }
function wzTogliArea(i) { leggiAtt(); S.wz.aree.splice(i, 1); rinumera(); disegnaWizard(); }
function wzSposta(i, d) { leggiAtt(); var A = S.wz.aree, x = A[i]; A[i] = A[i + d]; A[i + d] = x; rinumera(); disegnaWizard(); }
/* numero in alto sul cartellone: 01, 02… finché il docente non lo cambia */
function rinumera() { S.wz.aree.forEach(function (a, i) { if (!a.numero || a.numAuto) { a.numero = String(i + 1).padStart(2, '0'); a.numAuto = true; } }); S.wz.termini = null; }

/* ---------- 4. Termini a testa ---------- */
function attPasso4() {
  var w = S.wz, NA = w.aree.length, NAW = ['zero', 'una', 'due', 'tre', 'quattro', 'cinque', 'sei'][NA] || NA, h = '';
  w.classi.forEach(function (c, i) {
    h += '<fieldset class="stack wzcl"><legend>Classe ' + esc(c.nome) + ' · ' + c.alunni.length + ' alunni</legend>' +
      '<div class="grid4"><div><label for="wzT' + i + '">Termini a testa</label><input id="wzT' + i + '" type="number" min="4" max="30" value="' + esc(c.max || c.tpa) + '" onchange="leggiAtt();disegnaWizard()"><small class="muted" style="font-size:13px">da 4 a 30</small></div></div>' +
      '<fieldset class="ops" style="gap:6px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Come distribuire i termini</legend>' +
      [['misto', NA > 1 ? 'Ognuno riceve termini di tutte e ' + NAW + ' le aree (come la 3F)' : 'Tutti i termini della stessa area'], ['gruppi', 'Alunni divisi in ' + NA + (NA === 1 ? ' gruppo' : ' gruppi') + ', uno per area (come la 3E)']].map(function (x) {
        return '<label class="op' + (c.modo === x[0] ? ' on' : '') + '"><input type="radio" name="wzM' + i + '" value="' + x[0] + '"' + (c.modo === x[0] ? ' checked' : '') + ' onchange="leggiAtt();disegnaWizard()"><span>' + x[1] + '</span></label>'; }).join('') + '</fieldset></fieldset>';
  });
  var fab = fabbisognoClient(w.classi), tot = 0, D = w.disp || {}, corto = [];
  var righe = w.aree.map(function (a, i) {
    var n = String(i + 1), serve = fab[n] || 0, mia = (a.fonte || 'mia') === 'mia', disp = mia ? null : D[n];
    tot += serve;
    var ok = mia || disp == null || disp >= serve;
    if (!ok) corto.push({ a: a.it || ('Area ' + n), manca: serve - disp });
    return '<tr><td><span class="wzq" style="background:' + esc(a.colore) + '"></span> ' + esc(a.it || ('Area ' + n)) + '</td><td class="n"><b>' + serve + '</b></td><td class="n">' + (mia ? '<span class="muted">li scrivi tu</span>' : disp == null ? '…' : disp) + '</td><td>' + (ok ? '<span style="color:var(--ok);font-weight:700">' + (mia ? 'da scrivere' : 'bastano') + '</span>' : '<span style="color:var(--err);font-weight:700">ne mancano ' + (serve - disp) + '</span>') + '</td></tr>';
  }).join('');
  h += '<h3 style="margin:8px 0 0;font-size:19px">Quanti termini servono</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Area</th><th style="text-align:right">Servono</th><th style="text-align:right">Disponibili (nuovi)</th><th></th></tr></thead><tbody>' + righe +
    '<tr><td><b>Totale</b></td><td class="n"><b>' + tot + '</b></td><td></td><td></td></tr></tbody></table></div>' +
    '<p class="muted" style="margin:0;font-size:14px">«Disponibili» conta solo i termini mai usati prima (né nel 2026/27 né nelle altre attività).</p>' +
    (corto.length ? '<div class="note warn" style="margin:0">' + corto.map(function (x) { return '<b>' + esc(x.a) + '</b>: ne mancano ' + x.manca; }).join(' · ') + '. Puoi ridurre i termini a testa, scegliere «uno per area», oppure andare avanti e scrivere tu i termini mancanti al passo 7.</div>' : '');
  if (!w.disp && !w._chiedoDisp) { w._chiedoDisp = true; chiediDisponibili(); }
  return h;
}
function chiediDisponibili() {
  var w = S.wz;
  api('generatermini', { richiesta: {}, fonti: wzFonti() }).then(function (x) { if (S.wz !== w) return; w.disp = x.disponibili; w._chiedoDisp = false; if (w.passo === 4) { leggiAtt(); disegnaWizard(); } })
    .catch(function (e) { w._chiedoDisp = false; toast(errMsg(e), true); });
}

/* ---------- 5. Date ---------- */
function attPasso5() {
  var w = S.wz;
  return w.classi.map(function (c, i) {
    return '<fieldset class="stack wzcl"><legend>Classe ' + esc(c.nome) + '</legend><div class="grid4">' +
      '<div><label for="wzP' + i + '">Partenza (gli alunni iniziano)</label><input id="wzP' + i + '" type="datetime-local" value="' + esc(c.partenza) + '"><small class="muted" style="font-size:13px">facoltativa: si può fissare anche dopo</small></div>' +
      '<div><label for="wzS' + i + '">Scadenza dello scritto</label><input id="wzS' + i + '" type="datetime-local" value="' + esc(c.scadenza) + '"></div></div></fieldset>';
  }).join('') + '<p class="muted" style="margin:0;font-size:14px">Le date del quiz e dell\'interrogazione si fissano dopo, nella pagina «Scadenze e valutazione», come per la 3E e la 3F.</p>';
}

/* ---------- 6. Regole ---------- */
function attPasso6() {
  var w = S.wz, R = w.regole;
  var inp = function (id, lab, v, nota) { return '<div><label for="' + id + '">' + lab + '</label><input id="' + id + '" type="text" inputmode="decimal" value="' + esc(String(v).replace('.', ',')) + '">' + (nota ? '<small class="muted" style="font-size:13px">' + nota + '</small>' : '') + '</div>'; };
  var oMax = Math.round((R.orale.base + R.orale.passo * R.orale.domande) * 1000) / 1000, oEx = Math.round((R.orale.base + R.orale.passoEsclusi * R.orale.domande) * 1000) / 1000;
  var h = '<p style="margin:0">Sono già impostate le regole usate per la 3E e la 3F. Cambia solo quello che vuoi.</p>' + riepilogoRegoleWz();
  if (!w.regoleAperte) return h + '<div><button class="btn sec" onclick="leggiAtt();S.wz.regoleAperte=true;disegnaWizard()">Cambia le regole</button></div>';
  return h + '<h3 style="margin:8px 0 0;font-size:19px">Scritto</h3><div class="grid4">' +
    inp('wzRvm', 'Voto di partenza (massimo)', R.scritto.votoMax) + inp('wzRpe', 'Punti tolti per ogni errore', R.scritto.penalita) +
    inp('wzRmi', 'Voto minimo', R.scritto.votoMin) + inp('wzRve', 'Voto per mancata consegna', R.scritto.votoEsclusione) + '</div>' +
    '<div class="grid2"><div><label for="wzG">Termini ricevuti da un escluso: giorni per rispondere</label><input id="wzG" type="number" min="1" max="30" value="' + esc(w.giorniIt) + '"></div></div>' +
    '<fieldset class="ops" style="gap:8px"><legend style="font-weight:700;font-size:15px;margin-bottom:6px">Termini degli esclusi</legend>' +
    [['auto', 'Passano in automatico, a sorte, a un compagno della stessa classe'], ['manuale', 'Decido io a chi passarli']].map(function (x) { return '<label class="op' + (w.riassegnazione === x[0] ? ' on' : '') + '"><input type="radio" name="wzRi" value="' + x[0] + '"' + (w.riassegnazione === x[0] ? ' checked' : '') + ' onchange="segna(this)"><span>' + x[1] + '</span></label>'; }).join('') + '</fieldset>' +
    '<h3 style="margin:8px 0 0;font-size:19px">Quiz</h3><div class="grid4">' +
    inp('wzRqs', 'Secondi per rispondere', R.quiz.secondi) + inp('wzRqo', 'Definizioni proposte', R.quiz.opzioni) + inp('wzRqp', 'Termini persi a ogni errore', R.quiz.passo) + '</div>' +
    '<h3 style="margin:8px 0 0;font-size:19px">Interrogazione</h3><div class="grid4">' +
    inp('wzRod', 'Termini chiesti', R.orale.domande) + inp('wzRob', 'Voto di partenza', R.orale.base) + inp('wzRop', 'Valore di un punto', R.orale.passo, 'corretta 1 punto, parziale ½') +
    inp('wzRoe', 'Valore di un punto per chi non ha consegnato lo scritto', R.orale.passoEsclusi) + '</div>' +
    '<p class="muted" style="margin:0;font-size:14px">Con queste regole: massimo <b>' + fv(oMax) + '</b>; chi non ha consegnato lo scritto arriva al massimo a <b>' + fv(oEx) + '</b>.' + (oMax > 10 ? ' <b style="color:var(--err)">Supera il 10: riduci i termini o il valore del punto.</b>' : '') + '</p>' +
    '<h3 style="margin:8px 0 0;font-size:19px">Voto finale</h3><div class="grid4">' + inp('wzRfp', 'Peso dello scritto (%)', R.finale.pesoScritto, 'il resto è l\'orale; 50 = media semplice') + '</div>';
}

/* ---------- lettura dei campi del passo aperto ---------- */
function leggiAtt() {
  var w = S.wz, v = function (id) { var e = $(id); return e ? e.value : null; };
  if ($('wzNome')) { w.nome = v('wzNome'); w.as = String(v('wzAs')).trim(); }
  if ($('wzCd') && w.conc) { w.conc.docente = v('wzCd'); w.conc.materia = v('wzCm'); }
  w.classi.forEach(function (c, i) {
    if ($('wzC' + i)) c.nome = String(v('wzC' + i) || '').trim().toUpperCase().replace(/\s+/g, '');
    if ($('wzN' + i)) { c.righe = righeClasse(c).map(function (r, k) { return { c: ($('wzAc' + i + '_' + k) || { value: r.c }).value, n: ($('wzAn' + i + '_' + k) || { value: r.n }).value }; }); }
    if ($('wzT' + i)) { c.max = Number(v('wzT' + i)); c.tpa = c.max; }
    var m = document.querySelector('input[name="wzM' + i + '"]:checked'); if (m) c.modo = m.value;
    if ($('wzS' + i)) { c.partenza = v('wzP' + i); c.scadenza = v('wzS' + i); }
    c.alunni = righeClasse(c).map(function (r) { return { nome: (String(r.c).trim() + ' ' + String(r.n).trim()).replace(/\s+/g, ' ').trim(), riprendi: null }; }).filter(function (a) { return a.nome; });
  });
  w.aree.forEach(function (a, i) {
    if (!$('wzAr' + i)) return;
    a.it = v('wzAr' + i); a.colore = v('wzAk' + i) || a.colore; a.motto = v('wzAo' + i);
    var nu = v('wzAu' + i); if (nu !== a.numero) { a.numero = nu; a.numAuto = false; }
  });
  if ($('wzRvm')) {
    var R = w.regole, num = function (id, def) { var e = $(id); if (!e) return def; var x = Number(String(e.value).replace(',', '.')); return isFinite(x) && e.value !== '' ? x : def; };
    R.scritto.votoMax = num('wzRvm', R.scritto.votoMax); R.scritto.penalita = num('wzRpe', R.scritto.penalita); R.scritto.votoEsclusione = num('wzRve', R.scritto.votoEsclusione); R.scritto.votoMin = num('wzRmi', R.scritto.votoMin);
    R.scritto.votoMaxErede = Math.max(R.scritto.votoMax, R.scritto.votoMaxErede);
    R.quiz.secondi = num('wzRqs', R.quiz.secondi); R.quiz.opzioni = num('wzRqo', R.quiz.opzioni); R.quiz.passo = num('wzRqp', R.quiz.passo);
    R.orale.domande = num('wzRod', R.orale.domande); R.orale.base = num('wzRob', R.orale.base); R.orale.passo = num('wzRop', R.orale.passo); R.orale.passoEsclusi = num('wzRoe', R.orale.passoEsclusi);
    R.finale.pesoScritto = num('wzRfp', R.finale.pesoScritto);
    w.giorniIt = Number(v('wzG')) || w.giorniIt;
    var rr = document.querySelector('input[name="wzRi"]:checked'); if (rr) w.riassegnazione = rr.value;
  }
}

/* ---------- controlli prima di andare avanti ---------- */
function erroriPasso(p) {
  var w = S.wz, e = [];
  if (p === 1) {
    if (!String(w.nome).trim()) e.push('Dai un nome all\'attività.');
    if (!/^\d{4}\/\d{2}$/.test(w.as)) e.push('Anno scolastico nel formato 2026/27.');
    if (w.conc && !String(w.conc.docente || '').trim()) e.push('Scrivi il nome del collega che userà l\'attività.');
  }
  if (p === 2) {
    var nomi = {};
    w.classi.forEach(function (c, i) {
      var cl = c.nome || ('classe ' + (i + 1));
      if (!c.nome) e.push('Scrivi il nome della classe (es. 4E).');
      else if (!/^[0-9][A-Z]{1,3}$|^[A-Z0-9]{1,6}$/.test(c.nome)) e.push('Nome della classe non valido: ' + c.nome + ' (es. 4E).');
      else if (nomi[c.nome]) e.push('La classe ' + c.nome + ' compare due volte.');
      nomi[c.nome] = 1;
      if (!c.n) e.push(cl + ': scrivi il numero di studenti.');
      var R = righeClasse(c), vuote = R.filter(function (r) { return !String(r.c).trim() && !String(r.n).trim(); }).length;
      if (c.n && vuote) e.push(cl + ': ' + (vuote === 1 ? 'una riga è vuota' : vuote + ' righe sono vuote') + '. Compilale o riduci il numero di studenti.');
      var soloUno = R.filter(function (r) { return !!String(r.c).trim() !== !!String(r.n).trim(); }).length;
      if (c.n && !vuote && soloUno) e.push(cl + ': ' + soloUno + (soloUno === 1 ? ' alunno ha' : ' alunni hanno') + ' solo il cognome o solo il nome.');
      var vis = {}; c.alunni.forEach(function (a) { var k = a.nome.toLowerCase(); if (vis[k]) e.push(cl + ': ' + a.nome + ' compare due volte.'); vis[k] = 1; });
    });
  }
  if (p === 3) {
    if (!w.aree.length) e.push('Scegli almeno un\'area.');
    w.aree.forEach(function (a, i) { if (!String(a.it).trim()) e.push('Dai un nome all\'area ' + (i + 1) + '.'); });
  }
  if (p === 4) w.classi.forEach(function (c) { if (!(c.max >= 4 && c.max <= 30) || Math.floor(c.max) !== c.max) e.push(c.nome + ': termini a testa da 4 a 30.'); });
  if (p === 5) w.classi.forEach(function (c) {
    if (!c.scadenza) e.push(c.nome + ': manca la scadenza.');
    else if (Date.parse(new Date(c.scadenza)) <= Date.now()) e.push(c.nome + ': la scadenza deve essere nel futuro.');
    if (c.partenza && c.scadenza && new Date(c.partenza) >= new Date(c.scadenza)) e.push(c.nome + ': la partenza deve venire prima della scadenza.');
  });
  if (p === 6) {
    var Ro = w.regole.orale; if (Ro.base + Ro.passo * Ro.domande > 10 + 1e-9) e.push('Interrogazione: con queste regole si supera il 10.');
    if (w.regole.scritto.votoMin > w.regole.scritto.votoMax) e.push('Il voto minimo dello scritto supera il massimo.');
  }
  return e;
}
function wzAvantiAtt(btn) {
  leggiAtt();
  var w = S.wz, p = w.passo, e = erroriPasso(p);
  if (e.length) { toast(e[0], true); return; }
  if (p === 3) w.disp = null;
  if (p < 6) { w.passo++; disegnaWizard(); window.scrollTo(0, 0); return; }
  // dal passo 6 ai termini: proposta dalle fonti scelte; le aree «mie» restano da scrivere
  w.fab = fabbisognoClient(w.classi);
  var vecchi = w.termini || {}, F = wzFonti(), daFonte = {}, chiedi = false;
  wzAreeN().forEach(function (n) { if (F[n] !== 'mia') { daFonte[n] = w.fab[n]; chiedi = true; } });
  w.ridotto = null; w.scartati = w.scartati || [];
  var vai = function () { w.passo = 7; disegnaWizard(); window.scrollTo(0, 0); };
  var firma = JSON.stringify([w.fab, F]);
  if (w.termini && w._firma === firma) return vai();
  w._firma = firma;
  if (!chiedi) { w.termini = {}; wzAreeN().forEach(function (n) { w.termini[n] = vecchi[n] || []; }); return vai(); }
  btn.disabled = true; btn.textContent = 'Cerco termini nuovi…';
  api('generatermini', { richiesta: daFonte, fonti: F, seme: Math.floor(Math.random() * 1e9) }).then(function (x) {
    w.termini = {}; w.disp = x.disponibili;
    wzAreeN().forEach(function (n) { w.termini[n] = F[n] === 'mia' ? (vecchi[n] || []) : (x.aree[n] || []).map(function (y) { return { t: y[0], d: y[1], o: 'banca' }; }); });
    vai();
  }).catch(function (e2) { w._firma = null; btn.disabled = false; btn.textContent = 'Avanti: proponi i termini'; toast(errMsg(e2), true); });
}

/* ---------- attività in preparazione (stand-by) → LIVE ---------- */
function bannerPreparazione() {
  return '<div class="note warn wzprep" id="bannerPrep"><div><b>Attività in preparazione (stand-by).</b> Gli alunni non possono ancora entrare e l\'attività non compare nella pagina pubblica. ' +
    'Controlla alunni, termini, cartelloni e date; stampa codici e schede. Quando sei pronto, mandala LIVE.</div>' + (ADM() ? '<button class="btn ok" onclick="mandaLive(this)">Manda LIVE</button>' : '') + '</div>';
}
function mandaLive(btn) {
  var cl = CLASSI(), date = (S.d.admin && S.d.admin.date) || {};
  var righe = cl.map(function (c) { var x = date[c] || {}; return '<li><b>' + esc(c) + '</b>: ' + (x.partenza ? 'partenza ' + esc(oraIt(x.partenza)) : 'partenza non fissata (gli alunni entrano e aspettano)') + ', scadenza ' + (x.scadenzaIt ? esc(oraIt(x.scadenzaIt)) : '—') + '</li>'; }).join('');
  finestra('Mandare LIVE l\'attività?', '<p style="margin:0">Da questo momento gli alunni possono entrare con il loro codice e l\'attività compare nella pagina pubblica.</p>' +
    (righe ? '<ul style="margin:0;padding-left:20px">' + righe + '</ul>' : '') + '<p class="muted" style="margin:0">Non si può tornare in preparazione.</p>',
    [{ t: 'Manda LIVE', f: function () {
      btn.disabled = true;
      api('mandalive', {}).then(function () { return ricarica('Attività LIVE: gli alunni possono entrare'); }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
    } }]);
}

/* ---------- bozza salvata sul server: si riprende anche da un altro dispositivo ---------- */
var _bozzaT = null;
function oraBreveWz(iso) { var d = new Date(iso); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function salvaBozzaWz() {
  var w = S.wz;
  if (!w || w.tipo !== 'attivita' || (w.passo === 1 && !String(w.nome || '').trim())) return;
  clearTimeout(_bozzaT);
  _bozzaT = setTimeout(function () {
    if (S.wz !== w) return;
    var c = {}; Object.keys(w).forEach(function (k) { if (k.charAt(0) !== '_' && k !== 'disp') c[k] = w[k]; });
    api('salvabozzawz', { dati: JSON.stringify(c) }).then(function (x) {
      if (S.wz !== w) return; w._salvata = x.salvata; var e = $('wzSalv'); if (e) e.textContent = 'Bozza salvata alle ' + oraBreveWz(x.salvata);
    }).catch(function () {});
  }, 800);
}
function controllaBozzaWz() {
  var w0 = S.wz;
  api('bozzawz', {}).then(function (x) {
    if (!x || !x.dati || S.wz !== w0 || w0.passo !== 1 || String(w0.nome || '').trim()) return;
    var b; try { b = JSON.parse(x.dati); } catch (e) { return; }
    var al = (b.classi || []).reduce(function (s, c) { return s + (c.n || 0); }, 0);
    finestra('Riprendere la nuova attività?', '<p style="margin:0">Hai una procedura lasciata a metà, salvata ' + esc(oraIt(x.salvata)) + ':</p><ul style="margin:0;padding-left:20px">' +
      '<li><b>' + esc(b.nome || 'senza nome') + '</b>' + (b.as ? ' · ' + esc(b.as) : '') + '</li><li>' + (b.classi || []).map(function (c) { return esc(c.nome || '?'); }).join(', ') + (al ? ' · ' + al + ' alunni' : '') + '</li>' +
      '<li>arrivata al passo ' + b.passo + ' di 8 (' + esc(PASSI_ATT[(b.passo || 1) - 1]) + ')</li></ul>',
      [{ t: 'Riprendi da dove ero', f: function () { b._salvata = x.salvata; b.tipo = 'attivita'; S.wz = b; disegnaWizard(); } },
       { t: 'Ricomincia da capo', warn: true, f: function () { api('salvabozzawz', { dati: null }).catch(function () {}); } }]);
  }).catch(function () {});
}
function ricominciaWz() {
  finestra('Ricominciare da capo?', '<p style="margin:0">La bozza salvata viene cancellata e la procedura riparte dal passo 1.</p>',
    [{ t: 'Ricomincia da capo', warn: true, f: function () { clearTimeout(_bozzaT); api('salvabozzawz', { dati: null }).then(function () { S.wz = null; apriWizard('attivita'); }).catch(function (e) { toast(errMsg(e), true); }); } }]);
}

/* ---------- attività di un collega: «Per gentile concessione del Prof. Danilo Cerrato» ---------- */
function bloccoConcessione() {
  if (!ADM() || RO() || !S.d.att || S.d.att === 'main') return '';
  var c = S.d.config.concessione || {};
  return '<section class="card stack" id="concBox"><h2 style="margin:0;font-size:22px">Attività per un collega</h2>' +
    '<p class="muted" style="margin:0;font-size:15px">Se scrivi il nome del collega, l\'app, i cartelloni, la pagina pubblica e i report mostrano lui come docente, con la dicitura <i>«Per gentile concessione del Prof. Danilo Cerrato»</i>. Lascia vuoto se l\'attività è tua.</p>' +
    '<div class="grid2"><div><label for="coD">Docente</label><input id="coD" type="text" maxlength="60" placeholder="es. Prof.ssa Maria Bianchi" value="' + esc(c.docente || '') + '"></div>' +
    '<div><label for="coM">Materia (facoltativa)</label><input id="coM" type="text" maxlength="60" value="' + esc(c.materia || '') + '"></div></div>' +
    '<div><button class="btn" onclick="salvaConcessione(this)">Salva</button></div></section>';
}
function salvaConcessione(btn) {
  btn.disabled = true;
  api('concessione', { concessione: { docente: $('coD').value, materia: $('coM').value } }).then(function () { return ricarica('Salvato'); }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
