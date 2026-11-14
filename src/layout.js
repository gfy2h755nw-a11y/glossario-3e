/* ---------- area docenti: barra dei comandi a sinistra, una pagina alla volta al centro ---------- */
var ICO = {
  cruscotto: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  revisione: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 10h8"/>',
  sollecito: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  situazione: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gestione: '<path d="M7 4h10M7 20h10M8 4c0 5 8 5 8 8s-8 3-8 8M16 4c0 5-8 5-8 8"/>',
  voti: '<path d="M3 4h18v16H3zM3 10h18M9 4v16"/>',
  codici: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v7h-6"/>',
  cartelloni: '<rect x="5" y="2" width="14" height="20" rx="1.5"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  documenti: '<path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 13h7M9 17h7"/>',
  impostazioni: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-.9c.6.5 1.3.9 2 1.2L10 21h4l.5-2.5c.7-.3 1.4-.7 2-1.2l2.4.9 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
  edizioni: '<path d="M3 7h18v13H3zM3 7l2-4h14l2 4M10 12h4"/>',
  registro: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>'
};
function svgIco(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICO[k] || '') + '</svg>'; }

/* le pagine, nell'ordine della barra; vis = chi la vede */
function PAGINE() {
  var adm = ADM(), ro = RO(), A = S.d.admin;
  return [
    { id: 'cruscotto', gr: 'Lavoro', t: 'Cruscotto', vis: true },
    { id: 'revisione', gr: 'Lavoro', t: 'Risposte da rivedere', vis: true, bd: contaDaRivedere() },
    { id: 'sollecito', gr: 'Lavoro', t: 'Da sollecitare', vis: !ro, bd: contaSollecito(), rosso: true },
    { id: 'situazione', gr: 'Studenti', t: 'Situazione e avanzamento', vis: true },
    { id: 'gestione', gr: 'Studenti', t: 'Proroghe e passaggi', vis: !!A && PUO('studenti') && !ro },
    { id: 'voti', gr: 'Studenti', t: 'Voti e tabellone', vis: !!A && (PUO('voti') || PUO('studenti') || PUO('documenti')) },
    { id: 'codici', gr: 'Studenti', t: 'Codici e schede QR', vis: !!S.d.codiciAlunni && !ro },
    { id: 'cartelloni', gr: 'Materiali', t: 'Cartelloni 70×100', vis: true },
    { id: 'documenti', gr: 'Materiali', t: 'Report, Word e slide', vis: !!A && PUO('documenti') },
    { id: 'impostazioni', gr: 'Gestione', t: 'Scadenze e valutazione', vis: adm && !ro },
    { id: 'edizioni', gr: 'Gestione', t: 'Edizioni e archivio', vis: adm && !ro },
    { id: 'registro', gr: 'Gestione', t: adm && !ro ? 'Registro e backup' : 'Registro delle attività', vis: (adm && !ro) || !!(A && A.attivita) }
  ].filter(function (p) { return p.vis; });
}
function contaDaRivedere() {
  return S.d.termini.filter(function (t) { return inClasse(t.alunno) && (t.statoIt === 'inviata' || (EN() && t.statoEn === 'inviata')); }).length;
}
function righeDaSollecitare() {
  return (S.d.panoramica || []).filter(function (r) { return inClasse(r.id) && !r.escluso && ((r.mancaIt || 0) > 0 || (r.rimandate || 0) > 0 || (r.mancaRicevuti || 0) > 0); });
}
function contaSollecito() { return righeDaSollecitare().length; }

function ricordaPag(id) { try { if (id) sessionStorage.setItem('glo_pag', id); else sessionStorage.removeItem('glo_pag'); } catch (e) { /* niente memoria: si riparte dal cruscotto */ } }
function pagRicordata() { try { return sessionStorage.getItem('glo_pag'); } catch (e) { return null; } }
function vai(id) {
  S.pag = id; ricordaPag(id); document.body.classList.remove('menu-on');
  vistaDocente(); window.scrollTo(0, 0);
}
function filtroClasse(c) { S.filtro.classe = c; vistaDocente(); }

function barraLaterale(pag, pagine) {
  var u = S.d.utente, ed = (S.d.config && S.d.config.edizione) || {}, cl = CLASSI(), f = S.filtro.classe || 'tutte';
  var h = '<aside class="side" id="side" aria-label="Comandi"><div class="sbrand"><div class="slogo">B</div><div><b>Glossario</b><span>Area docenti · ' + esc(u.nome) + '</span></div>' +
    '<button class="smenu-x" onclick="document.body.classList.remove(\'menu-on\')" aria-label="Chiudi il menu">×</button></div>';
  if (RO()) {
    var e = S.d.edizioneArchivio || {};
    h += '<div class="sed arch"><div class="sed-l">ARCHIVIO · SOLA LETTURA</div><b>' + esc(e.nome || '') + '</b> · a.s. ' + esc(e.as || '') +
      '<button class="sbtn-arch" onclick="esciArchivio()">Torna all\'edizione in corso</button>';
  } else {
    var arch = S.d.admin && S.d.admin.archiviata && ed.id && S.d.admin.archiviata === ed.id;
    h += '<div class="sed"><div class="sed-l">' + (arch ? 'EDIZIONE CHIUSA E ARCHIVIATA' : 'EDIZIONE IN CORSO') + '</div><b>' + esc(ed.nome || ('Glossario ' + cl.join(' e '))) + '</b>' + (ed.as ? ' · a.s. ' + esc(ed.as) : '') +
      (S.d.config.chiusa ? '<div class="sed-c">App chiusa agli alunni</div>' : '');
  }
  if (cl.length > 1) h += '<div class="seg" role="group" aria-label="Filtra per classe">' + ['tutte'].concat(cl).map(function (c) {
    return '<button class="' + (f === c ? 'on' : '') + '" aria-pressed="' + (f === c) + '" data-classe="' + esc(c) + '" onclick="filtroClasse(\'' + esc(c) + '\')">' + (c === 'tutte' ? 'Tutte' : esc(c)) + '</button>';
  }).join('') + '</div>';
  h += '</div><nav class="snav">';
  var gr = '';
  pagine.forEach(function (p) {
    if (p.gr !== gr) { gr = p.gr; h += '<div class="sgr">' + gr + '</div>'; }
    h += '<button class="sit' + (p.id === pag ? ' on' : '') + '" data-pag="' + p.id + '"' + (p.id === pag ? ' aria-current="page"' : '') + ' onclick="vai(\'' + p.id + '\')">' + svgIco(p.id) + '<span>' + esc(p.t) + '</span>' +
      (p.bd ? '<span class="sbd' + (p.rosso ? ' r' : '') + '">' + p.bd + '</span>' : '') + '</button>';
  });
  h += '</nav><div class="sfondo">';
  if (ADM() && !RO()) {
    var ed2 = S.d.admin.impostazioni.edizione, archiviata = S.d.admin.archiviata === ed2.id;
    h += '<button class="snuova" id="bNuovaEd" onclick="apriWizard(\'edizione\')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Nuova edizione</span><small>nuovo progetto: classi, alunni, termini, date</small></button>';
    h += archiviata ? '<div class="schiusa">Edizione chiusa e archiviata</div>'
      : '<button class="srosso" id="bChiudiEd" onclick="chiudiEdizione(this)"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Chiudi l\'edizione in corso</button>';
  }
  h += '<div class="spiede"><span>app ' + esc(VERSIONE) + '</span><button onclick="esci()">Esci</button></div></div></aside>';
  return h;
}

function barraAlta(p) {
  var ed = (S.d.config && S.d.config.edizione) || {}, chips = '';
  if (!RO()) {
    var cl = S.filtro.classe && S.filtro.classe !== 'tutte' ? [S.filtro.classe] : CLASSI();
    chips = cl.map(function (c) { var d = datePerClasse(c); return d && d.scadenzaIt ? '<span class="tchip" title="Scadenza ' + esc(c) + '">' + esc(c) + ' · scade ' + esc(oraIt(d.scadenzaIt)) + '</span>' : ''; }).join('');
  }
  return '<header class="tbar"><button class="smenu" onclick="document.body.classList.add(\'menu-on\')" aria-label="Apri il menu" aria-controls="side">☰</button>' +
    '<div class="ttit"><h1>' + esc(p.t) + '</h1><div class="tsub">' + esc(RO() ? 'Archivio · ' + ((S.d.edizioneArchivio || {}).nome || '') : (ed.nome || '') + (ed.as ? ' · a.s. ' + ed.as : '')) + (S.filtro.classe && S.filtro.classe !== 'tutte' ? ' · solo ' + esc(S.filtro.classe) : '') + '</div></div>' +
    '<div class="tdx">' + chips + '<button class="btn sec tb" onclick="ricarica(\'Dati aggiornati\')">Aggiorna</button><a class="btn sec tb" href="/glossario" target="_blank" rel="noopener">Pagina pubblica</a></div></header>';
}

function vistaDocente() {
  var f = S.filtro;
  if (!EN()) { f.lingua = 'it'; if (f.stato === 'pronte') f.stato = 'inviata'; }
  var pagine = PAGINE(), pag = S.pag || pagRicordata() || 'cruscotto';
  if (!pagine.some(function (p) { return p.id === pag; })) pag = 'cruscotto';
  S.pag = pag;
  var p = pagine.filter(function (x) { return x.id === pag; })[0];
  var corpo = (PAGINA[pag] || PAGINA.cruscotto)();
  var avvisi = RO() ? bannerArchivio() : S.d.config.chiusa ? '<div class="note warn"><b>App chiusa agli alunni.</b> I docenti possono ancora rivedere.</div>' : '';
  $('app').innerHTML = '<div class="dapp">' + barraLaterale(pag, pagine) + '<div class="sveil" onclick="document.body.classList.remove(\'menu-on\')"></div><section class="dmain">' + barraAlta(p) +
    '<main class="dcont stack" id="pag-' + pag + '">' + avvisi + corpo + '</main></section></div>';
  if (pag === 'cartelloni') disegnaPoster(S.poster || (f.area !== 'tutte' ? f.area : 1));
  if (pag === 'situazione') { selSituazione(); disegnaSituazione(); }
  if (pag === 'gestione') { selGestione(); disegnaGestione(); }
  // pagine a parte aperte dall'indirizzo, anche dopo un ricaricamento
  if (location.hash === '#nuova-edizione' && ADM() && !RO() && !S.wz) apriWizard('edizione');
  if (location.hash === '#inglese' && PUO('documenti') && !RO() && !S.tr) apriTraduzioni();
}

function cardAree() {
  return '<section class="grid4">' + S.d.aree.map(function (a) {
    var ts = S.d.termini.filter(function (t) { return t.area == a.n && inClasse(t.alunno); });
    var c = function (l, st) { return ts.filter(function (t) { return T(t, l, 'stato') === st; }).length; };
    var riv = c('it', 'inviata') + (EN() ? c('en', 'inviata') : 0);
    var pronte = EN() ? ts.filter(function (t) { return t.statoIt === 'approvata' && t.statoEn === ''; }).length : 0;
    return '<div class="card" style="border-top:8px solid ' + a.colore + '"><div class="disp" style="font-weight:800;font-size:17px;line-height:1.2">' + a.n + '. ' + esc(a.it) + '</div>' +
      LINGUE().map(function (l) { var v = c(l, 'approvata'); return '<div style="margin-top:10px;font-size:15px">' + (l === 'it' ? (EN() ? 'Italiano' : 'Approvate') : 'Inglese') + ' <b>' + v + '/' + ts.length + '</b></div><div class="bar"><span style="width:' + (ts.length ? v / ts.length * 100 : 0) + '%;background:' + a.colore + '"></span></div>'; }).join('') +
      (pronte ? '<div style="margin-top:8px;font-size:14px" class="muted">' + pronte + ' pronte per l\'inglese, non ancora scelte</div>' : '') +
      '<div style="margin-top:10px">' + (riv ? '<button class="chip s-inviata chipbtn" onclick="S.filtro.area=\'' + a.n + '\';S.filtro.stato=\'inviata\';vai(\'revisione\')">' + riv + ' da rivedere</button>' : '<span class="chip s-vuota">Niente da rivedere</span>') + '</div></div>';
  }).join('') + '</section>';
}

var PAGINA = {
  cruscotto: function () {
    var ts = S.d.termini.filter(function (t) { return inClasse(t.alunno); }), n = ts.length || 1;
    var app = ts.filter(function (t) { return t.statoIt === 'approvata'; }).length, att = ts.filter(function (t) { return t.statoIt === 'inviata'; }).length;
    var sol = RO() ? null : righeDaSollecitare(), riv = contaDaRivedere();
    var al = (S.d.panoramica || []).filter(function (r) { return inClasse(r.id); }), escl = al.filter(function (r) { return r.escluso; }).length;
    var kpi = [
      ['Risposte date', (app + att) + '<small> / ' + ts.length + '</small>', Math.round((app + att) / n * 100) + '% dei termini', (app + att) / n, 'var(--a1)'],
      ['Da rivedere', riv, riv ? 'aspettano la tua revisione' : 'niente in attesa', null, 'var(--a1)', 'revisione'],
      ['Approvate', app + '<small> / ' + ts.length + '</small>', Math.round(app / n * 100) + '% definitive', app / n, 'var(--ok)'],
      sol ? ['Da sollecitare', sol.length, escl ? escl + (escl === 1 ? ' escluso' : ' esclusi') : 'nessun escluso', null, 'var(--err)', 'sollecito'] : ['Alunni', al.length, escl ? escl + ' esclusi' : 'nessun escluso', null, 'var(--ink)']
    ];
    var h = '<section class="kpis">' + kpi.map(function (k) {
      var tag = k[5] ? 'button' : 'div';
      return '<' + tag + ' class="card kcard"' + (k[5] ? ' onclick="vai(\'' + k[5] + '\')"' : '') + '><div class="kl">' + k[0] + '</div><div class="kv">' + k[1] + '</div><div class="muted ks">' + k[2] + '</div>' +
        (k[3] != null ? '<div class="bar" style="margin-top:8px"><span style="width:' + Math.round(k[3] * 100) + '%;background:' + k[4] + '"></span></div>' : '') + '</' + tag + '>';
    }).join('') + '</section>';
    h += bloccoAnello();
    var cols = '';
    if (sol) {
      var now = Date.now();
      var prime = sol.map(function (r) { return { r: r, sc: Date.parse(r.scadenza) || Infinity }; }).sort(function (a, b) { return a.sc - b.sc || a.r.nome.localeCompare(b.r.nome, 'it'); }).slice(0, 6);
      cols += '<section class="card stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h2 class="h2s">Da sollecitare</h2>' + (sol.length ? '<button class="btn sec tb" onclick="vai(\'sollecito\')">Vedi tutti (' + sol.length + ')</button>' : '') + '</div>' +
        (prime.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Senza risposta</th><th>Scadenza</th></tr></thead><tbody>' + prime.map(function (x) {
          var resta = x.sc - now;
          return '<tr><td>' + esc(x.r.nome) + ' <span class="muted" style="font-size:13px">' + esc(etich(x.r)) + '</span></td><td class="n">' + ((x.r.mancaIt || 0) + (x.r.rimandate ? ' <span style="color:#9A4A00;font-weight:400;font-size:13px">+' + x.r.rimandate + ' rim.</span>' : '')) + '</td>' +
            '<td style="font-size:14px">' + (isFinite(x.sc) ? '<b style="color:' + (resta <= 0 ? 'var(--err)' : resta < 2 * 86400000 ? '#9A4A00' : 'var(--ink)') + '">' + (resta <= 0 ? 'scaduta' : 'mancano ' + esc(fraTempo(resta))) + '</b>' : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted" style="margin:0">Tutti hanno risposto a tutti i loro termini.</p>') + '</section>';
    }
    var attesa = S.d.termini.filter(function (t) { return inClasse(t.alunno) && t.statoIt === 'inviata'; }).slice(0, 5);
    cols += '<section class="card stack" style="gap:6px"><div class="row" style="justify-content:space-between"><h2 class="h2s">Risposte da rivedere</h2>' + (riv ? '<button class="btn sec tb" onclick="S.filtro.stato=\'inviata\';vai(\'revisione\')">Apri la revisione (' + riv + ')</button>' : '') + '</div>' +
      (attesa.length ? attesa.map(function (t) {
        var a = area(t.area) || {}, ok = t.okIt === true;
        return '<div class="voce"><i style="background:' + esc(a.colore || '#15212B') + '"></i><div><b>' + esc(t.it) + '</b><small>' + esc(nomeAlunno(t.alunno)) + ' · ' + (ok ? '<span style="color:var(--ok)">✓ corretta</span>' : '<span style="color:var(--err)">✗ non corretta</span>') + '</small></div>' +
          (PUO('revisione') && !RO() ? (ok ? '<button class="btn ok tb" onclick="decidi(\'' + t.id + '\',\'it\',\'approvata\',this)">Approva</button>' : '<button class="btn sec tb" onclick="S.filtro.stato=\'inviata\';vai(\'revisione\')">Rivedi</button>') : '') + '</div>';
      }).join('') : '<p class="muted" style="margin:0">Niente da rivedere.</p>') + '</section>';
    h += '<div class="grid2 cols">' + cols + '</div>';
    h += cardAree();
    if (S.d.admin && PUO('documenti')) h += '<section class="card stack" style="gap:10px"><h2 class="h2s">Documenti rapidi</h2><div class="row">' +
      '<button class="btn sec" onclick="reportPdf()">Report completo (PDF)</button>' +
      (RO() ? '' : '<button class="btn sec" onclick="esportaWord(this)">Definizioni approvate (Word)</button>') +
      '<button class="btn sec" onclick="vai(\'cartelloni\')">Cartelloni 70×100</button>' +
      (RO() ? '' : '<button class="btn sec" onclick="presentazione(this)">Presentazione (.pptx)</button>') + '</div></section>';
    return h + bloccoTappe();
  },
  revisione: function () {
    var f = S.filtro;
    var lista = S.d.termini.filter(function (t) {
      if (f.area !== 'tutte' && t.area != f.area) return false;
      if (!inClasse(t.alunno)) return false;
      if (f.stato === 'pronte') return t.statoIt === 'approvata' && t.statoEn !== 'approvata';
      return f.stato === 'tutti' ? true : T(t, f.lingua, 'stato') === f.stato;
    });
    var corrette = lista.filter(function (t) { return T(t, f.lingua, 'stato') === 'inviata' && T(t, f.lingua, 'ok') === true && (f.lingua === 'it' || t.statoIt === 'approvata'); });
    var h = '<section class="card stack"><h2 style="margin:0;font-size:22px">Revisione</h2><div class="grid4">' + selClasse('fc', 'vistaDocente()') +
      (EN() ? '<div><label for="fl">Lingua</label><select id="fl" onchange="S.filtro.lingua=this.value;vistaDocente()">' + [['it', 'Italiano'], ['en', 'Inglese']].map(function (o) { return '<option value="' + o[0] + '"' + (f.lingua === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' : '') +
      '<div><label for="fs">Stato</label><select id="fs" onchange="S.filtro.stato=this.value;vistaDocente()">' + [['inviata', 'Da rivedere (inviate)']].concat(EN() ? [['pronte', 'Italiano approvato, inglese da fare']] : []).concat([['correggere', 'Rimandate all\'alunno'], ['', 'Non ancora scelte'], ['approvata', 'Approvate'], ['tutti', 'Tutti']]).map(function (o) { return '<option value="' + o[0] + '"' + (f.stato === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div><label for="fa">Area</label><select id="fa" onchange="S.filtro.area=this.value;vistaDocente()"><option value="tutte">Tutte le aree</option>' + S.d.aree.map(function (a) { return '<option value="' + a.n + '"' + (f.area == a.n ? ' selected' : '') + '>' + a.n + '. ' + esc(a.it) + '</option>'; }).join('') + '</select></div></div>' +
      (corrette.length && !RO() && PUO('revisione') ? '<div class="row"><button class="btn ok" onclick="approvaCorrette(this)">Approva tutte le scelte corrette (' + corrette.length + ')</button><span class="muted" style="font-size:15px">Quelle sbagliate restano da rivedere una per una.</span></div>' : '') +
      '</section>';
    h += '<p class="muted" style="margin:0">' + lista.length + ' termini' + (EN() ? ' · ' + (f.lingua === 'it' ? 'italiano' : 'inglese') : '') + '</p>';
    return h + (lista.map(function (t) { return cardDocente(t, f.lingua); }).join('') || '<div class="card muted">Nessun termine con questo filtro.</div>');
  },
  sollecito: function () { return bloccoSollecito(); },
  situazione: function () { return panoramica() + bloccoSituazione(); },
  gestione: function () { return bloccoGestione(); },
  voti: function () { return bloccoAdmin('voti'); },
  codici: function () {
    return '<section class="card" id="codici"><h2 style="margin:0 0 6px;font-size:22px">Codici personali degli alunni (riservato)</h2>' +
      '<p class="muted" style="margin:10px 0">Stampa e ritaglia le strisce da consegnare a mano. Link dell\'app: <b>' + esc(location.origin) + '</b></p>' +
      '<div class="row" style="margin-bottom:10px">' + CLASSI().map(function (c) { return '<button class="btn" onclick="stampaSchede(\'' + c + '\')">Schede con QR · ' + c + '</button>'; }).join('') +
      (CLASSI().length > 1 ? '<button class="btn sec" onclick="stampaSchede(\'tutte\')">Schede di tutte le classi</button>' : '') + '<button class="btn sec" onclick="stampaCodici()">Codici in strisce</button></div>' +
      '<p class="muted" style="margin:0 0 10px;font-size:14px">Le schede si aprono nella stampa: scegli “Salva come PDF” per avere il file. Una pagina A4 per alunno con QR, link, codice, partenza e scadenza (senza i termini).</p>' +
      '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th>Classe</th><th>Codice</th></tr></thead><tbody>' +
      S.d.codiciAlunni.filter(function (a) { return inClasse(a.id); }).map(function (a) { return '<tr><td>' + esc(a.nome) + '</td><td>' + esc(etich(a)) + '</td><td style="font-family:monospace;font-size:18px;font-weight:700;letter-spacing:.15em">' + esc(a.codice) + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>';
  },
  cartelloni: function () { return bloccoPoster(S.poster || (S.filtro.area !== 'tutte' ? S.filtro.area : 1)); },
  documenti: function () {
    var h = bloccoAdmin('doc');
    if (ADM() && !RO()) h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Presentazione per gli studenti</h2><div class="row">' + CLASSI().map(function (c) { return '<button class="btn sec" onclick="presentazione(this, \'presentazionestudenti\', { classe: \'' + c + '\' })">Presentazione ' + c + ' (.pptx)</button>'; }).join('') + '</div>' +
      '<span class="muted" style="font-size:14px">Slide per la classe, con partenza, scadenza, voto massimo e penalità presi da «Scadenze e valutazione».</span></section>';
    if (!RO()) h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Dati per la stampa</h2><p style="margin:0">A lavoro finito scarica i dati: servono per impaginare i 4 PDF definitivi (vanno solo le definizioni approvate).</p><div class="row"><button class="btn sec" onclick="esporta()">Scarica i dati (.json)</button></div></section>';
    return h;
  },
  impostazioni: function () {
    return bloccoAdmin('imp') + '<section class="card stack" id="accesso"><h2 style="margin:0;font-size:22px">Accesso degli alunni</h2><p style="margin:0">L\'app è <b>' + (S.d.config.chiusa ? 'chiusa' : 'aperta') + '</b>' + (S.d.config.chiusa ? ': gli alunni vedono le scelte ma non possono modificarle.' : ': gli alunni possono scegliere e inviare.') + '</p>' +
      '<div class="row"><button class="btn ' + (S.d.config.chiusa ? 'ok' : 'warn') + '" onclick="chiusura(' + (!S.d.config.chiusa) + ')">' + (S.d.config.chiusa ? 'Riapri l\'app agli alunni' : 'Chiudi l\'app agli alunni') + '</button></div></section>';
  },
  edizioni: function () { return bloccoChiusuraEdizione() + bloccoEdizioni() + bloccoColleghi(); },
  registro: function () { return (S.d.admin && S.d.admin.attivita ? bloccoAttivita() : '') + (ADM() && !RO() ? bloccoBackup() : ''); }
};
