/* ---------- area docenti: barra dei comandi a sinistra, una pagina alla volta al centro ---------- */
var ICO = {
  // icone dell'area docenti (restyling 21/11/2026): tratto 2, angoli arrotondati, griglia 24
  cruscotto: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  revisione: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 14.5 2 2 4-4.5"/>',
  sollecito: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
  situazione: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  gestione: '<path d="M7 4h10M7 20h10M8 4c0 5 8 5 8 8s-8 3-8 8M16 4c0 5-8 5-8 8"/>',
  voti: '<circle cx="12" cy="9" r="6"/><path d="m8.5 13.8-1.5 7.2 5-2.5 5 2.5-1.5-7.2"/><path d="m9.8 9 1.5 1.5 3-3"/>',
  codici: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v7h-6"/>',
  cartelloni: '<rect x="4" y="3" width="16" height="13" rx="1.5"/><path d="M12 16v5M8 21h8"/><path d="M8 7.5h8M8 11h5"/>',
  revcart: '<rect x="3" y="2" width="12" height="17" rx="1.5"/><path d="M6 7h6M6 11h4"/><path d="M14.5 20.5l1-3.5 5.5-5.5 2.5 2.5-5.5 5.5z"/>',
  documenti: '<path d="M8 3h8l4 4v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M16 3v4h4"/><path d="M3 7v12a3 3 0 0 0 3 3h9"/><path d="M10 12h6M10 15.5h4"/>',
  impostazioni: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  promo: '<path d="M3 10.5v3a1 1 0 0 0 1 1h2l5 4V5.5l-5 4H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  banca: '<path d="M4 19.5V5a2 2 0 0 1 2-2h4v18H6a2 2 0 0 1-2-1.5z"/><path d="M10 3h4v18h-4"/><path d="m15.2 4.2 3.8-1 3 17-3.8 1z"/>',
  edizioni: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/>',
  quiz: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M12 2.5V6"/>',
  orale: '<rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4M8.5 21.5h7"/>',
  registro: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>'
};
function svgIco(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICO[k] || '') + '</svg>'; }

/* sezioni della barra (riorganizzazione 2026-11): ogni sezione raccoglie una o più pagine di sempre,
   che restano tutte raggiungibili come schede in cima alla pagina. gr = gruppo nella barra. */
var SEZIONI = [
  { id: 'oggi', t: 'Oggi', gr: '', ico: 'cruscotto', pag: ['cruscotto', 'sollecito'] },
  { id: 'scritto', t: 'Scritto', gr: 'La prova', ico: 'revisione', fase: 1, pag: ['revisione'] },
  { id: 'quizs', t: 'Quiz', gr: 'La prova', ico: 'quiz', fase: 2, pag: ['quiz'] },
  { id: 'orales', t: 'Orale', gr: 'La prova', ico: 'orale', fase: 3, pag: ['orale'] },
  { id: 'votis', t: 'Voti', gr: 'La prova', ico: 'voti', fase: 4, pag: ['voti'] },
  { id: 'studenti', t: 'Studenti', gr: 'Classe', ico: 'situazione', pag: ['situazione', 'gestione', 'codici'] },
  { id: 'cart', t: 'Cartelloni', gr: 'Classe', ico: 'cartelloni', pag: ['cartelloni', 'revcart'] },
  { id: 'doc', t: 'Documenti', gr: 'Classe', ico: 'documenti', pag: ['documenti'] },
  { id: 'imp', t: 'Impostazioni', gr: 'Gestione', ico: 'impostazioni', pag: ['impostazioni'] },
  { id: 'bancas', t: 'Banca termini', gr: 'Gestione', ico: 'banca', pag: ['banca'] },
  { id: 'promos', t: 'Promo App', gr: 'Gestione', ico: 'promo', pag: ['promo'] },
  { id: 'arch', t: 'Archivio e backup', gr: 'Gestione', ico: 'edizioni', pag: ['edizioni', 'registro'] }
];
/* etichette brevi delle pagine dentro la loro sezione (le schede in cima) */
var SCHEDA = { cruscotto: 'Quadro generale', sollecito: 'Da sollecitare', situazione: 'Situazione e avanzamento', gestione: 'Proroghe e passaggi', codici: 'Codici e schede QR',
  cartelloni: 'Anteprima e stampa', revcart: 'Revisione', banca: 'Banca termini', promo: 'Colleghi e numeri', edizioni: 'Edizioni e attività', registro: 'Registro e backup' };
function sezioneDi(id) { return SEZIONI.filter(function (z) { return z.pag.indexOf(id) >= 0; })[0] || SEZIONI[0]; }
/* sezioni visibili a chi è entrato, ognuna con le sue pagine visibili */
function sezioniVisibili(pagine) {
  var per = {}; pagine.forEach(function (p) { per[p.id] = p; });
  return SEZIONI.map(function (z) { return { z: z, pp: z.pag.filter(function (id) { return per[id]; }).map(function (id) { return per[id]; }) }; }).filter(function (x) { return x.pp.length; });
}

/* le pagine, nell'ordine della barra; vis = chi la vede */
function PAGINE() {
  var adm = ADM(), ro = RO(), A = S.d.admin;
  return [
    { id: 'cruscotto', gr: 'Lavoro', t: 'Cruscotto', vis: true },
    { id: 'revisione', gr: 'Lavoro', t: 'Risposte da rivedere', vis: true, bd: contaDaRivedere() },
    { id: 'sollecito', gr: 'Lavoro', t: 'Da sollecitare', vis: !ro, bd: contaSollecito(), rosso: true },
    { id: 'situazione', gr: 'Studenti', t: 'Situazione e avanzamento', vis: true },
    { id: 'gestione', gr: 'Studenti', t: 'Proroghe e passaggi', vis: !!A && PUO('studenti') && !ro },
    { id: 'quiz', gr: 'Studenti', t: 'Quiz (seconda prova)', vis: !!S.d.quiz },
    { id: 'orale', gr: 'Studenti', t: 'Interrogazioni', vis: !!A && (PUO('voti') || adm) },
    { id: 'voti', gr: 'Studenti', t: 'Voti e tabellone', vis: !!A && (PUO('voti') || PUO('studenti') || PUO('documenti')) },
    { id: 'codici', gr: 'Studenti', t: 'Codici e schede QR', vis: !!S.d.codiciAlunni && !ro },
    { id: 'cartelloni', gr: 'Materiali', t: 'Cartelloni 70×100', vis: true },
    { id: 'revcart', gr: 'Materiali', t: 'Revisione cartelloni', vis: !!A && PUO('documenti') && !ro, bd: S.rc && Object.keys(S.rc.cambiate).length ? Object.keys(S.rc.cambiate).length : 0 },
    { id: 'documenti', gr: 'Materiali', t: 'Report, Word e slide', vis: !!A && PUO('documenti') },
    { id: 'impostazioni', gr: 'Gestione', t: 'Scadenze e valutazione', vis: LOC() && !ro },
    { id: 'banca', gr: 'Gestione', t: 'Banca termini', vis: adm && !ro },
    { id: 'promo', gr: 'Gestione', t: 'Promo App', vis: adm && !ro },
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
  if (S.rc && id !== 'revcart' && Object.keys(S.rc.cambiate).length) {
    finestra('Modifiche non salvate', '<p style="margin:0">Nella revisione dei cartelloni ci sono correzioni non ancora salvate.</p>', [{ t: 'Esci senza salvare', warn: true, f: function () { S.rc = null; vai(id); } }]);
    return;
  }
  if (id !== 'revcart') S.rc = null;
  S.or = null; S.pag = id; ricordaPag(id); document.body.classList.remove('menu-on');
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
      (S.d.config.bozza ? '<div class="sed-c sed-b">IN PREPARAZIONE · non ancora LIVE</div>' : S.d.config.chiusa ? '<div class="sed-c">App chiusa agli alunni</div>' : '');
  }
  // attività parallele: si sceglie su quale lavorare (ognuna con classi, cartelloni, quiz e regole propri)
  var sp = S.d.spazi || [];
  if (!RO() && sp.length > 1) h += '<label class="satt"><span>Attività</span><select id="selAtt" onchange="cambiaAttivita(this.value)">' + sp.map(function (x) {
    return '<option value="' + esc(x.id) + '"' + (x.id === (S.d.att || 'main') ? ' selected' : '') + '>' + esc(x.nome) + ' · ' + esc((x.classi || []).join(', ')) + (x.bozza ? ' · in preparazione' : '') + '</option>';
  }).join('') + '</select></label>';
  if (!RO() && ADM()) h += '<button class="snuovaatt" onclick="apriWizard(\'attivita\')">+ Nuova attività</button>';
  if (cl.length > 1) h += '<div class="seg" role="group" aria-label="Filtra per classe">' + ['tutte'].concat(cl).map(function (c) {
    return '<button class="' + (f === c ? 'on' : '') + '" aria-pressed="' + (f === c) + '" data-classe="' + esc(c) + '" onclick="filtroClasse(\'' + esc(c) + '\')">' + (c === 'tutte' ? 'Tutte' : esc(c)) + '</button>';
  }).join('') + '</div>';
  h += '</div><nav class="snav">';
  var gr = null, sezAtt = sezioneDi(pag).id;
  sezioniVisibili(pagine).forEach(function (x) {
    var z = x.z, on = z.id === sezAtt, uno = x.pp.length === 1, bd = 0, rosso = false;
    x.pp.forEach(function (p) { bd += p.bd || 0; if (p.bd && p.rosso) rosso = true; });
    if (z.gr !== gr) { gr = z.gr; if (gr) h += '<div class="sgr">' + gr + '</div>'; }
    var pags = x.pp.map(function (p) { return p.id; }).join(' ');
    // sezione con una sola pagina: la voce è la pagina; con più pagine: la voce apre la prima e mostra le altre sotto
    h += '<button class="sit' + (on ? ' on' : '') + (z.fase ? ' fase f' + z.fase : '') + '" data-sez="' + z.id + '" data-pags="' + pags + '"' + (uno ? ' data-pag="' + x.pp[0].id + '"' : '') + (on ? ' aria-current="page"' : '') +
      ' onclick="vai(\'' + (on && !uno ? pag : x.pp[0].id) + '\')">' + svgIco(z.ico) + '<span>' + esc(z.id === 'arch' && !ADM() ? 'Registro attività' : z.t) + '</span>' + (bd && !(on && !uno) ? '<span class="sbd' + (rosso ? ' r' : '') + '">' + bd + '</span>' : '') + '</button>';
    if (!uno) h += '<div class="ssubs' + (on ? ' aperta' : '') + '">' + x.pp.map(function (p) {
      return '<button class="ssub' + (p.id === pag ? ' on' : '') + '" data-pag="' + p.id + '"' + (p.id === pag ? ' aria-current="page"' : '') + ' onclick="vai(\'' + p.id + '\')"><span>' + esc(SCHEDA[p.id] || p.t) + '</span>' +
        (p.bd ? '<span class="sbd' + (p.rosso ? ' r' : '') + '">' + p.bd + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  });
  h += '</nav><div class="sfondo">';
  if (ADM() && !RO()) {
    var ed2 = S.d.admin.impostazioni.edizione, archiviata = S.d.admin.archiviata === ed2.id;
    h += '<button class="snuova" id="bNuovaEd" onclick="apriWizard(\'edizione\')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Nuova edizione</span><small>nuovo progetto: classi, alunni, termini, date</small></button>';
    h += archiviata ? '<div class="schiusa">Edizione chiusa e archiviata</div>'
      : '<button class="srosso" id="bChiudiEd" onclick="chiudiEdizione(this)"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Chiudi l\'edizione in corso</button>';
  }
  h += (S.d.config.concessione ? '<div class="sconc">Per gentile concessione del Prof. Danilo Cerrato</div>' : '') + '<div class="spiede"><span>app ' + esc(VERSIONE) + '</span><button onclick="esci()">Esci</button></div></div></aside>';
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
  var avvisi = bannerCoda() + (RO() ? bannerArchivio() : S.d.config.bozza ? bannerPreparazione() : S.d.config.chiusa ? '<div class="note warn"><b>App chiusa agli alunni.</b> I docenti possono ancora rivedere.</div>' : '');
  $('app').innerHTML = '<div class="dapp">' + barraLaterale(pag, pagine) + '<div class="sveil" onclick="document.body.classList.remove(\'menu-on\')"></div><section class="dmain">' + barraAlta(p) +
    '<main class="dcont stack" id="pag-' + pag + '">' + schedeSezione(pag, pagine) + avvisi + corpo + '</main></section></div>';
  if (pag === 'cartelloni') disegnaPoster(S.poster || (f.area !== 'tutte' ? f.area : 1));
  if (pag === 'situazione') { selSituazione(); disegnaSituazione(); }
  if (pag === 'gestione') { selGestione(); disegnaGestione(); }
  if (pag === 'revcart') avviaRevCart();
  if (pag === 'banca') avviaBanca();
  if (pag === 'promo') avviaPromo();
  // pagine a parte aperte dall'indirizzo, anche dopo un ricaricamento
  if (location.hash === '#nuova-edizione' && ADM() && !RO() && !S.wz) apriWizard('edizione');
  if (location.hash === '#inglese' && PUO('documenti') && !RO() && !S.tr) apriTraduzioni();
}

/* in cima alla pagina: le fasi della prova (Scritto, Quiz, Orale, Voti) oppure le schede della sezione */
function schedeSezione(pag, pagine) {
  var vis = sezioniVisibili(pagine), z = sezioneDi(pag), tab = function (id, t, on, cl, bd) {
    return '<button class="ptab' + (on ? ' on' : '') + (cl ? ' ' + cl : '') + '" data-tab="' + id + '"' + (on ? ' aria-current="page"' : '') + ' onclick="vai(\'' + id + '\')">' + t + (bd ? ' <span class="pbd">' + bd + '</span>' : '') + '</button>';
  };
  if (z.fase) {
    var fasi = vis.filter(function (x) { return x.z.fase; });
    if (fasi.length < 2) return '';
    return '<nav class="ptabs fasi" aria-label="Fasi della prova">' + fasi.map(function (x) { var p = x.pp[0]; return tab(p.id, x.z.fase + ' · ' + esc(x.z.t), x.z.id === z.id, 'f' + x.z.fase, p.bd); }).join('') + '</nav>';
  }
  var mia = vis.filter(function (x) { return x.z.id === z.id; })[0];
  if (!mia || mia.pp.length < 2) return '';
  return '<nav class="ptabs" aria-label="' + esc(z.t) + '">' + mia.pp.map(function (p) { return tab(p.id, esc(SCHEDA[p.id] || p.t), p.id === pag, '', p.bd); }).join('') + '</nav>';
}

/* «Oggi»: le fasi di ogni classe e le cose da fare, in cima al quadro generale */
function bloccoOggi() {
  if (RO()) return '';
  var imp = S.d.admin && S.d.admin.impostazioni, q = (imp && imp.quiz) || null, now = Date.now();
  var cl = S.filtro.classe && S.filtro.classe !== 'tutte' ? [S.filtro.classe] : CLASSI();
  var fasi = cl.map(function (c) {
    var d = datePerClasse(c) || {}, sc = d.scadenzaIt ? Date.parse(d.scadenzaIt) : null, pa = d.partenza ? Date.parse(d.partenza) : null;
    var qs = q && (q.scadenze || {})[c], qp = q && (q.partenze || {})[c];
    var sStato = !pa || now < pa ? 'parte ' + (pa ? oraIt(d.partenza) : 'da fissare') : sc && now > sc ? 'chiuso il ' + oraIt(d.scadenzaIt) : 'scade ' + (sc ? oraIt(d.scadenzaIt) : '—');
    var sOn = pa && now >= pa && (!sc || now <= sc);
    var qStato = !q ? '' : !qs ? 'date da fissare' : now > Date.parse(qs) ? 'chiuso il ' + oraIt(qs) : qp && now < Date.parse(qp) ? 'dal ' + oraIt(qp) : 'aperto, fino al ' + oraIt(qs);
    var qOn = q && qs && now <= Date.parse(qs) && !(qp && now < Date.parse(qp));
    var f = function (n, t, st, on, fatto) { return '<div class="ofase f' + n + (on ? ' on' : '') + (fatto ? ' fatto' : '') + '"><span class="obar"></span><b>' + t + (on ? ' · in corso' : '') + '</b><span>' + esc(st) + '</span></div>'; };
    return '<div class="card ocl"><div class="row" style="justify-content:space-between"><b class="disp" style="font-size:18px">Classe ' + esc(c) + '</b></div><div class="ofasi">' +
      f(1, 'Scritto', sStato, sOn, sc && now > sc) + (q ? f(2, 'Quiz', qStato, qOn, qs && now > Date.parse(qs)) + f(3, 'Orale', 'dopo il quiz superato', false, false) + f(4, 'Voti', 'scritto e orale', false, false) : '') + '</div></div>';
  }).join('');
  var ts = S.d.termini.filter(function (t) { return inClasse(t.alunno); });
  var riv = contaDaRivedere(), sol = righeDaSollecitare().length, rig = ts.filter(function (t) { return t.statoIt === 'correggere'; }).length;
  var senzaQuiz = q && LOC() ? cl.filter(function (c) { return !(q.scadenze || {})[c]; }) : [];
  var cose = [];
  if (riv) cose.push([riv, 'Risposte da rivedere', 'aspettano la tua approvazione', 'Rivedi', "S.filtro.stato='inviata';vai('revisione')", 'i']);
  if (sol) cose.push([sol, 'Da sollecitare', 'alunni con termini ancora senza risposta: messaggio pronto da copiare', 'Apri', "vai('sollecito')", 'w']);
  if (rig) cose.push([rig, rig === 1 ? 'Risposta rimandata da correggere' : 'Risposte rimandate da correggere', 'gli alunni le possono correggere fino alla chiusura dell\'app', 'Vedi', "S.filtro.stato='correggere';vai('revisione')", 'w']);
  if (senzaQuiz.length) cose.push(['!', 'Date del quiz da fissare', 'classe ' + senzaQuiz.join(' e ') + ': apertura e scadenza', 'Imposta', "vai('impostazioni')", 'q']);
  var lista = cose.length ? cose.map(function (k) {
    return '<div class="ocosa"><span class="on-' + k[5] + '">' + k[0] + '</span><div><b>' + esc(k[1]) + '</b><small>' + esc(k[2]) + '</small></div><button class="btn" onclick="' + k[4] + '">' + k[3] + '</button></div>';
  }).join('') : '<div class="ocosa vuota"><span class="on-o">✓</span><div><b>Niente da fare adesso</b><small>nessuna risposta in attesa e nessuno da sollecitare</small></div></div>';
  return '<section class="ogrid">' + fasi + '</section><section class="stack" style="gap:8px" id="dafare"><h2 style="margin:0;font-size:20px">Da fare</h2>' + lista + '</section>';
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
    var oggi = bloccoOggi();
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
    var h = oggi + '<section class="kpis">' + kpi.map(function (k) {
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
  voti: function () { return bloccoAdmin('voti') + bloccoArgo(); },
  quiz: function () { return paginaQuiz(); },
  orale: function () { return paginaOrale(); },
  codici: function () {
    return '<section class="card" id="codici"><h2 style="margin:0 0 6px;font-size:22px">Codici personali degli alunni (riservato)</h2>' +
      '<p class="muted" style="margin:10px 0">Stampa e ritaglia le strisce da consegnare a mano. Link dell\'app: <b>' + esc(location.origin) + '</b></p>' +
      '<div class="stack" style="gap:8px;margin-bottom:12px">' + bottoniAccessiQuiz() + '<div><button class="btn sec" onclick="stampaCodici()">Codici in strisce</button></div></div>' +
      '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th>Classe</th><th>Codice</th></tr></thead><tbody>' +
      S.d.codiciAlunni.filter(function (a) { return inClasse(a.id); }).map(function (a) { return '<tr><td>' + esc(a.nome) + '</td><td>' + esc(etich(a)) + '</td><td style="font-family:monospace;font-size:18px;font-weight:700;letter-spacing:.15em">' + esc(a.codice) + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>';
  },
  revcart: function () { return paginaRevCart(); },
  banca: function () { return paginaBanca(); },
  promo: function () { return paginaPromo(); },
  cartelloni: function () { return (LOC() && !RO() ? (S.d.areeMie ? bloccoAreeMie() : bloccoNumeri()) : '') + bloccoPoster(S.poster || (S.filtro.area !== 'tutte' ? S.filtro.area : 1)); },
  documenti: function () {
    var h = bloccoAdmin('doc');
    if (LOC() && !RO()) h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Presentazione per gli studenti</h2><div class="row">' + CLASSI().map(function (c) { return '<button class="btn sec" onclick="presentazione(this, \'presentazionestudenti\', { classe: \'' + c + '\' })">Presentazione ' + c + ' (.pptx)</button>'; }).join('') + '</div>' +
      '<span class="muted" style="font-size:14px">Slide per la classe, con partenza, scadenza, voto massimo e penalità presi da «Scadenze e valutazione».</span></section>';
    if (!RO()) h += '<section class="card stack"><h2 style="margin:0;font-size:22px">Dati per la stampa</h2><p style="margin:0">A lavoro finito scarica i dati: servono per impaginare i 4 PDF definitivi (vanno solo le definizioni approvate).</p><div class="row"><button class="btn sec" onclick="esporta()">Scarica i dati (.json)</button></div></section>';
    return h;
  },
  impostazioni: function () {
    return bloccoConcessione() + bloccoAdmin('imp') + bloccoQuizImp() + '<section class="card stack" id="accesso"><h2 style="margin:0;font-size:22px">Accesso degli alunni</h2><p style="margin:0">L\'app è <b>' + (S.d.config.chiusa ? 'chiusa' : 'aperta') + '</b>' + (S.d.config.chiusa ? ': gli alunni vedono le scelte ma non possono modificarle.' : ': gli alunni possono scegliere e inviare.') + '</p>' +
      '<div class="row"><button class="btn ' + (S.d.config.chiusa ? 'ok' : 'warn') + '" onclick="chiusura(' + (!S.d.config.chiusa) + ')">' + (S.d.config.chiusa ? 'Riapri l\'app agli alunni' : 'Chiudi l\'app agli alunni') + '</button></div></section>';
  },
  edizioni: function () { return bloccoChiusuraEdizione() + bloccoEdizioni() + bloccoColleghi(); },
  registro: function () { return (S.d.admin && S.d.admin.attivita ? bloccoAttivita() : '') + (ADM() && !RO() ? bloccoBackup() : ''); }
};
