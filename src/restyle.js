/* ---------- area docenti: saluto, ricerca rapida, barra in basso sul telefono (restyling 22/11/2026) ---------- */
function saluto() {
  var h = new Date().getHours(), u = (S.d && S.d.utente) || {};
  var nome = String(u.nome || '').replace(/^prof\.?(ssa)?\s+/i, ''), cog = nome.split(' ').slice(-1)[0];
  var tit = /^prof\.?ssa/i.test(u.nome || '') ? 'prof.ssa ' : 'prof. ';
  return (h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera') + (cog ? ', ' + tit + cog : '');
}

/* barra in basso sul telefono: le cinque destinazioni più usate a portata di pollice */
function barraBasso(pag, pagine) {
  var id = function (x) { return pagine.some(function (p) { return p.id === x; }); };
  var z = sezioneDi(pag).id, bd = function (n) { return n ? '<span class="bbd">' + n + '</span>' : ''; };
  var oggi = RO() ? 0 : (contaDaRivedere() ? 1 : 0) + (righeDaSollecitare().length ? 1 : 0);
  var prova = ['revisione', 'quiz', 'orale', 'voti'].filter(id)[0], classe = ['situazione', 'gestione', 'codici'].filter(id)[0];
  var pub = id('statpub') ? 'statpub' : id('documenti') ? 'documenti' : null;
  var v = [
    ['cruscotto', 'Oggi', 'cruscotto', z === 'oggi', oggi],
    prova ? [prova, 'Prova', 'revisione', ['scritto', 'quizs', 'orales', 'votis'].indexOf(z) >= 0, RO() ? 0 : contaDaRivedere()] : null,
    classe ? [classe, 'Classe', 'situazione', z === 'studenti', RO() ? 0 : righeDaSollecitare().length] : null,
    pub ? [pub, pub === 'statpub' ? 'Pubblica' : 'Documenti', pub === 'statpub' ? 'statistiche' : 'documenti', z === 'stats' || z === 'doc', 0] : null
  ].filter(Boolean);
  return '<nav class="dbasso" aria-label="Sezioni principali">' + v.map(function (x) {
    return '<button class="' + (x[3] ? 'on' : '') + '" onclick="vai(\'' + x[0] + '\')"' + (x[3] ? ' aria-current="page"' : '') + '>' + svgIco(x[2]) + '<span>' + x[1] + '</span>' + bd(x[4]) + '</button>';
  }).join('') + '<button onclick="document.body.classList.add(\'menu-on\')" aria-controls="side"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg><span>Altro</span></button></nav>';
}

/* ricerca rapida (Ctrl K): studenti e termini dell'attività aperta */
var RIC = { el: [], i: 0 };
function normR(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function cercaRapida(q) {
  var box = $('tris'); if (!box) return;
  q = normR(q).trim();
  if (q.length < 2) { box.hidden = true; box.innerHTML = ''; RIC.el = []; return; }
  var al = (S.d.alunni || []).filter(function (a) { return normR(a.nome).indexOf(q) >= 0; }).slice(0, 5).map(function (a) { return { t: 'a', id: a.id, nome: a.nome, sub: 'Studente · ' + (a.classe || '') }; });
  var te = (S.d.termini || []).filter(function (t) { return normR(t.it + ' ' + (t.en || '')).indexOf(q) >= 0; }).slice(0, 6).map(function (t) { var a = area(t.area); return { t: 't', id: t.id, nome: t.it, sub: 'Termine · area ' + t.area + ' · ' + nomeAlunno(t.alunno) + ' · ' + statoBreve(t.statoIt), col: a && a.colore }; });
  RIC.el = al.concat(te); RIC.i = 0;
  box.innerHTML = RIC.el.length ? RIC.el.map(function (x, i) {
    return '<button class="tri' + (i === 0 ? ' on' : '') + '" data-i="' + i + '" onmousedown="event.preventDefault();apriRisultato(' + i + ')"><span class="trk" style="' + (x.col ? 'background:' + x.col : '') + '">' + (x.t === 'a' ? '👤' : '') + '</span><span><b>' + esc(x.nome) + '</b><small>' + esc(x.sub) + '</small></span></button>';
  }).join('') : '<div class="trv">Nessuno studente o termine per «' + esc(q) + '»</div>';
  box.hidden = false;
}
function statoBreve(s) { return { approvata: 'approvata', inviata: 'da rivedere', correggere: 'rimandata', '': 'senza risposta' }[s || ''] || s; }
function tastoCerca(e) {
  var box = $('tris'); if (!box || box.hidden) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); RIC.i = (RIC.i + (e.key === 'ArrowDown' ? 1 : -1) + RIC.el.length) % Math.max(1, RIC.el.length); box.querySelectorAll('.tri').forEach(function (b, k) { b.classList.toggle('on', k === RIC.i); }); }
  else if (e.key === 'Enter') { e.preventDefault(); if (RIC.el.length) apriRisultato(RIC.i); }
  else if (e.key === 'Escape') { box.hidden = true; e.target.value = ''; e.target.blur(); }
}
function apriRisultato(i) {
  var x = RIC.el[i]; if (!x) return;
  if (x.t === 'a') { var a = S.d.alunni.filter(function (y) { return y.id === x.id; })[0]; S.sit = { classe: (a && a.classe) || CLASSI()[0], id: x.id }; vai('situazione'); return; }
  var t = S.d.termini.filter(function (y) { return y.id === x.id; })[0]; if (!t) return;
  S.filtro.area = String(t.area); S.filtro.stato = 'tutti'; S.filtro.lingua = 'it'; if (S.filtro.classe && S.filtro.classe !== 'tutte' && !inClasse(t.alunno)) S.filtro.classe = 'tutte';
  vai('revisione');
  setTimeout(function () { var c = document.querySelector('[data-tid="' + x.id + '"]'); if (c) { c.scrollIntoView({ block: 'center' }); c.classList.add('trovato'); } }, 60);
}
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { var q = $('tq'); if (q) { e.preventDefault(); q.focus(); q.select(); } }
});
document.addEventListener('click', function (e) { var b = $('tris'); if (b && !b.hidden && !e.target.closest('#tcerca')) b.hidden = true; });

/* ---------- Regole dell'attività: sempre aggiornate dalle impostazioni, da leggere o stampare ---------- */
function paginaRegole() {
  var R = S.d.regolamento; if (!R) return '<section class="card"><p class="muted" style="margin:0">Regole non disponibili.</p></section>';
  var agg = new Date(R.aggiornato).toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  return '<section class="card stack" style="gap:8px"><div class="row" style="justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start"><div><h2 style="margin:0;font:600 26px/1.15 var(--serif)">' + esc(R.attivita) + '</h2>' +
    '<p class="muted" style="margin:4px 0 0">a.s. ' + esc(R.as) + ' · regole aggiornate alle impostazioni attuali (' + esc(agg) + ')</p></div>' +
    '<button class="btn sec" onclick="stampaRegole()">Stampa o salva PDF</button></div>' +
    '<nav class="regidx" aria-label="Indice">' + R.sezioni.map(function (s, i) { return '<a href="#reg' + i + '" onclick="event.preventDefault();document.getElementById(\'reg' + i + '\').scrollIntoView({block:\'start\'})" style="--c:' + s.colore + '"><b>' + (i + 1) + '</b>' + esc(s.titolo) + '</a>'; }).join('') + '</nav></section>' +
    R.sezioni.map(function (s, i) {
      return '<section class="card regsez" id="reg' + i + '" style="--c:' + s.colore + '"><h2><span>' + (i + 1) + '</span>' + esc(s.titolo) + '</h2><ul>' + s.punti.map(function (p) { return '<li' + (/^• /.test(p) ? ' class="sub"' : '') + '>' + p.replace(/^• /, '') + '</li>'; }).join('') + '</ul></section>';
    }).join('');
}
function stampaRegole() {
  var R = S.d.regolamento; if (!R) return;
  var w = window.open('', '_blank'); if (!w) { toast('Consenti le finestre per stampare.', true); return; }
  var h = '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Regole · ' + esc(R.attivita) + '</title><style>' + cssFonti(location.origin) + "@font-face{font-family:'Source Serif 4';font-weight:600;src:url(" + location.origin + "/fonts/source-serif-4-latin-600-normal.woff2) format('woff2')}" +
    '@page{size:A4;margin:16mm 16mm 18mm}body{font-family:"Atkinson Hyperlegible",Arial,sans-serif;color:#17212B;font-size:10.5pt;line-height:1.45;margin:0}' +
    'h1{font:600 22pt/1.1 "Source Serif 4",Georgia,serif;margin:0}.sub{color:#5D6874;margin:3mm 0 6mm}' +
    'section{break-inside:avoid;border-left:2.2mm solid var(--c);padding:1mm 0 1mm 5mm;margin:0 0 6mm}h2{font:600 14pt "Source Serif 4",Georgia,serif;margin:0 0 2mm}' +
    'ul{margin:0;padding-left:5mm}li{margin:1.2mm 0}li.sub{list-style:circle;margin-left:5mm}footer{color:#8E969E;font-size:8.5pt;margin-top:8mm;border-top:.3mm solid #ddd;padding-top:2mm}</style></head><body>' +
    '<h1>Regole dell\'attività</h1><div class="sub">' + esc(R.attivita) + ' · a.s. ' + esc(R.as) + ' · aggiornate al ' + esc(new Date(R.aggiornato).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })) + '</div>' +
    R.sezioni.map(function (s, i) { return '<section style="--c:' + s.colore + '"><h2>' + (i + 1) + '. ' + esc(s.titolo) + '</h2><ul>' + s.punti.map(function (p) { return '<li' + (/^• /.test(p) ? ' class="sub"' : '') + '>' + p.replace(/^• /, '') + '</li>'; }).join('') + '</ul></section>'; }).join('') +
    '<footer>IIS «L. Barsanti» · sede Salvetti · Massa · documento generato dall\'app del glossario, con le impostazioni in vigore</footer></body></html>';
  w.document.write(h); w.document.close(); setTimeout(function () { try { w.focus(); w.print(); } catch (e) { /* niente */ } }, 400);
}
