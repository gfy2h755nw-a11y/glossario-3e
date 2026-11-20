/* ---------- area docenti: quiz (seconda parte della prova), ammissione e interrogazione orale ---------- */
function tempoMs(ms) { var s = Math.round((ms || 0) / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + ' h ' : '') + m + ' min ' + ('0' + (s % 60)).slice(-2) + ' s'; }
function quizDi(id) { return (S.d.quiz || []).filter(function (q) { return q.id === id; })[0] || { indovinati: 0, soglia: 260, sessioni: 0, risposte: 0, corrette: 0, errori: 0, persi: 0, massimo: 0, ms: 0, stato: 'chiuso', ultime: [] }; }
function votiDi(id) { return ((S.d.admin && S.d.admin.voti) || []).filter(function (v) { return v.id === id; })[0] || {}; }
function dataBreve(iso) { var d = new Date(iso); return d.getDate() + ' ' + MESI[d.getMonth()] + ', ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
// n = domande dell'interrogazione (gli studenti BES ne hanno la metà: ogni punto vale in proporzione)
function votoOraleDa(punti, escluso, n) { var o = RG().orale, k = n && n !== o.domande ? o.domande / n : 1; return Math.round((o.base + (escluso ? o.passoEsclusi : o.passo) * punti * k) * 1000) / 1000; }

/* stato del quiz di un alunno, come etichetta: da esso dipende l'ammissione all'interrogazione */
function chipQuiz(q) {
  if (q.stato === 'superato') return '<span class="chip s-approvata">Ammesso</span><br><span class="muted" style="font-size:13px">quiz superato il ' + esc(dataBreve(q.superata)) + '</span>';
  if (q.stato === 'scaduto') return '<span class="chip s-correggere">Non ammesso</span><br><span class="muted" style="font-size:13px">quiz non completato: ' + q.indovinati + ' / ' + q.soglia + '</span>';
  if (q.stato === 'chiuso') return '<span class="chip s-vuota">Quiz non aperto</span>' + (q.partenza && q.scadenza ? '<br><span class="muted" style="font-size:13px">si apre il ' + esc(dataBreve(q.partenza)) + '</span>' : '');
  return '<span class="chip s-inviata">' + (q.stato === 'in corso' ? 'In corso' : 'Non iniziato') + '</span><br><span class="muted" style="font-size:13px">' + q.indovinati + ' / ' + q.soglia + '</span>';
}
function scadenzeQuiz() {
  var q = (S.d.admin && S.d.admin.impostazioni && S.d.admin.impostazioni.quiz) || null; if (!q) return '';
  var cl = S.filtro.classe && S.filtro.classe !== 'tutte' ? [S.filtro.classe] : CLASSI();
  return cl.map(function (c) {
    var d = (q.scadenze || {})[c], p = (q.partenze || {})[c], now = Date.now();
    if (d && p && now < Date.parse(p)) return '<span class="chip s-vuota">' + esc(c) + ': quiz dal ' + esc(oraIt(p)) + ' al ' + esc(oraIt(d)) + '</span>';
    return '<span class="chip ' + (d ? (now > Date.parse(d) ? 's-correggere' : 's-inviata') : 's-vuota') + '">' + esc(c) + ': ' + (d ? (now > Date.parse(d) ? 'quiz scaduto il ' : 'quiz entro il ') + esc(oraIt(d)) : 'quiz non aperto') + '</span>'; }).join('');
}

/* --- tabellone del quiz --- */
function paginaQuiz() {
  var righe = (S.d.panoramica || []).filter(function (r) { return inClasse(r.id); });
  var sup = righe.filter(function (r) { return quizDi(r.id).superata; }).length, att = righe.filter(function (r) { return quizDi(r.id).sessioni > 0; }).length, fuori = righe.filter(function (r) { return quizDi(r.id).stato === 'scaduto'; }).length;
  var sg = righe.length ? quizDi(righe[0].id).soglia : 260;
  var h = '<section class="card stack" id="quizTab"><h2 style="margin:0;font-size:22px">Quiz: seconda parte della prova</h2>' +
    '<p class="muted" style="margin:0">Il quiz ha una pagina a sé (<b>' + esc(location.host) + '/quiz</b>), separata dal glossario: un termine, ' + nDef(RG().quiz.opzioni) + ', ' + RG().quiz.secondi + ' secondi. A ogni errore la risposta giusta non viene mostrata e l\'alunno <b>torna indietro di ' + RG().quiz.passo + ' termini</b>. ' +
    'I progressi restano tra una sessione e l\'altra. Il quiz è <b>superato con ' + sg + ' termini indovinati</b> entro la scadenza: chi lo supera è ammesso all\'interrogazione, chi non lo completa resta senza voto. ' +
    'Soglia e scadenze si impostano in «Scadenze e valutazione». Con lo stesso codice il quiz resta aperto <b>su un solo dispositivo alla volta</b>: se si apre altrove, la sessione precedente si chiude; accanto al nome vedi quanti dispositivi ha usato l\'alunno e quante volte una sessione ancora attiva è stata presa da un altro dispositivo.</p>' +
    '<div class="row">' + scadenzeQuiz() + '</div>' +
    bottoniAccessiQuiz() +
    // prova del docente: si apre la pagina del quiz in una nuova scheda, si entra con il proprio codice da docente
    '<div class="row" style="gap:8px;align-items:center"><a class="btn sec" id="qzProva" href="/quiz?prova=1" target="_blank" rel="noopener">Prova il quiz come uno studente</a>' +
      '<span class="muted" style="font-size:14px">si entra con il tuo codice da docente; di norma con il timer della classe, e puoi provare anche le misure BES (senza tempo, «Dimezza opzioni»). Niente finisce tra i dati della classe.</span></div>' +
    '<div class="row"><span class="chip s-approvata">' + sup + ' su ' + righe.length + ' hanno superato il quiz</span><span class="chip s-vuota">' + att + ' hanno fatto almeno una sessione</span>' + (fuori ? '<span class="chip s-correggere">' + fuori + ' non ammessi (scadenza passata)</span>' : '') + '</div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th><th style="text-align:right">Sessioni</th><th style="text-align:right">Tempo</th><th style="text-align:right" title="Tempo passato sul quiz fino al superamento (o fino alla scadenza)">Fino al termine</th><th style="text-align:right">Risposte</th><th style="text-align:right">Corrette</th><th style="text-align:right">Errori</th><th style="text-align:right">Termini persi</th><th>Termini indovinati</th><th>Ammissione all\'orale</th><th></th></tr></thead><tbody>';
  righe.forEach(function (r) {
    var q = quizDi(r.id), aperto = S.qzAperto === r.id, pc = Math.min(100, Math.round(q.indovinati / q.soglia * 100));
    var dsp = (q.subentri ? ' <span class="chip s-correggere" title="Il quiz è stato aperto su un altro dispositivo mentre la sessione precedente era ancora attiva">Sessione presa da un altro dispositivo · ' + q.subentri + (q.subentri === 1 ? ' volta' : ' volte') + '</span>' : '') +
      (q.dispositivi > 1 ? ' <span class="chip s-inviata">' + q.dispositivi + ' dispositivi</span>' : '');
    h += '<tr data-quiz="' + r.id + '"><td>' + linkScheda(r) + (r.escluso ? ' <span class="chip s-correggere">Escluso</span>' : '') + dsp + '</td><td class="n">' + esc(etich(r)) + '</td><td class="n">' + q.sessioni + '</td><td class="n" style="font-weight:400">' + (q.sessioni ? tempoMs(q.ms) : '—') + '</td>' + '<td class="n">' + fineQuizHtml(q) + '</td>' +
      '<td class="n" style="font-weight:400">' + q.risposte + '</td><td class="n">' + q.corrette + (q.risposte ? ' <span class="muted" style="font-weight:400;font-size:13px">' + Math.round(q.corrette / q.risposte * 100) + '%</span>' : '') + '</td>' +
      '<td class="n">' + (q.errori || 0) + '</td><td class="n" style="font-weight:400">' + (q.persi || 0) + '</td>' +
      '<td style="min-width:150px"><b>' + q.indovinati + '</b> / ' + q.soglia + (q.massimo > q.indovinati ? ' <span class="muted" style="font-size:13px">(massimo ' + q.massimo + ')</span>' : '') + '<div class="bar" style="margin-top:4px"><span style="width:' + pc + '%;background:' + (q.superata ? 'var(--ok)' : 'var(--a1)') + '"></span></div></td>' +
      '<td>' + chipQuiz(q) + (q.proroga ? '<br><span class="chip s-inviata" style="margin-top:4px">Proroga al ' + esc(oraIt(q.proroga)) + '</span>' : '') +
        (q.sogliaPersonale != null || q.passoPersonale != null ? '<br><span class="chip s-bozza" style="margin-top:4px" title="Regole personali del quiz">Personale: ' + q.soglia + ' termini · −' + q.passo + ' per errore</span>' : '') +
        (q.bes ? '<br><span class="chip s-bozza" style="margin-top:4px" title="Studente BES">BES · ' + (q.bes.secondi === 0 ? 'senza tempo' : (q.bes.secondi || RG().quiz.secondi) + ' s') + (q.bes.dimezza ? ' · dimezza opzioni' : '') + '</span>' : '') + '</td>' +
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap">' + (PUO('studenti') && !RO() ? '<button class="btn sec tb" data-pers="' + r.id + '" onclick="regolePersonaliQuiz(\'' + r.id + '\')">' + (q.bes ? 'BES e regole' : 'BES / regole personali') + '</button>' : '') + (PUO('studenti') && !RO() && !q.superata && q.scadenzaClasse ? '<button class="btn sec tb" onclick="prorogaQuiz(\'' + r.id + '\')">' + (q.proroga ? 'Modifica proroga' : 'Proroga') + '</button>' : '') +
        (q.sessioni ? '<button class="btn sec tb" aria-expanded="' + aperto + '" onclick="S.qzAperto=' + (aperto ? 'null' : '\'' + r.id + '\'') + ';vistaDocente()">' + (aperto ? 'Chiudi' : 'Sessioni') + '</button>' : '') + '</div></td></tr>';
    if (aperto) h += '<tr class="qz-det"><td colspan="12" style="background:#F6F8FA"><table class="tbl" style="margin:0"><thead><tr><th>Sessione</th><th>Inizio</th><th style="text-align:right">Tempo</th><th style="text-align:right">Risposte</th><th style="text-align:right">Corrette</th><th style="text-align:right">Errori</th><th style="text-align:right">di cui scadute</th><th style="text-align:right">Termini nuovi</th><th style="text-align:right">Termini persi</th></tr></thead><tbody>' +
      q.ultime.map(function (s, i) { return '<tr><td>' + (q.sessioni - q.ultime.length + i + 1) + '</td><td>' + esc(dataBreve(s.i)) + '</td><td class="n" style="font-weight:400">' + tempoMs(s.ms) + '</td><td class="n" style="font-weight:400">' + s.r + '</td><td class="n">' + s.c + '</td><td class="n">' + (s.e || 0) + '</td><td class="n" style="font-weight:400">' + s.s + '</td><td class="n">' + s.n + '</td><td class="n" style="font-weight:400">' + (s.p || 0) + '</td></tr>'; }).reverse().join('') +
      '</tbody></table>' + (q.sessioni > q.ultime.length ? '<p class="muted" style="margin:6px 0 0;font-size:13px">Sono mostrate le ultime ' + q.ultime.length + ' sessioni su ' + q.sessioni + '.</p>' : '') + '</td></tr>';
  });
  return h + '</tbody></table></div></section>' + bloccoSollecitiQuiz(righe);
}

/* --- interrogazione orale --- */
function paginaOrale() {
  if (S.or) return schedaOrale();
  var righe = (S.d.panoramica || []).filter(function (r) { return inClasse(r.id); });
  var fatte = righe.filter(function (r) { return votiDi(r.id).orale; }).length, puo = PUO('voti') && !RO();
  var amm = righe.filter(function (r) { return quizDi(r.id).superata; }).length, fuori = righe.filter(function (r) { return quizDi(r.id).stato === 'scaduto'; }).length;
  var h = '<section class="card stack" id="oraleTab"><h2 style="margin:0;font-size:22px">Interrogazioni</h2>' +
    '<p class="muted" style="margin:0"><b>È ammesso all\'interrogazione solo chi ha superato il quiz</b> entro la scadenza: gli altri non vengono interrogati e restano senza voto (le loro definizioni restano sui cartelloni). ' +
    'Per ogni alunno ammesso l\'app pesca <b>' + RG().orale.domande + ' termini</b> tra tutti quelli del glossario (mai i suoi, bilanciati sulle aree, di preferenza i meno usciti nella classe). ' +
    'Ogni risposta vale 1 punto se corretta, ½ se parziale, 0 se sbagliata. <b>' + regolaOrale() + '</b> (massimo ' + fv(RG().orale.max) + '); per gli esclusi dallo scritto ' + fv(RG().orale.base) + ' + ' + frz(RG().orale.passoEsclusi) + ' per punto (massimo ' + fv(RG().orale.maxEsclusi) + '). ' +
    'Il <b>voto finale</b> è la ' + mediaTxt() + ' (per gli esclusi vale solo l\'orale): oltre il mezzo voto si arrotonda all\'intero superiore, sotto a quello inferiore (7,75 → 8 · 7,5 → 7,5 · 7,4 → 7).</p>' +
    '<div class="row"><span class="chip s-approvata">' + amm + ' su ' + righe.length + ' ammessi (quiz superato)</span><span class="chip s-vuota">' + fatte + ' interrogati</span>' + (fuori ? '<span class="chip s-correggere">' + fuori + ' non ammessi: senza voto</span>' : '') + scadenzeQuiz() + '</div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th><th>Ammissione (quiz)</th><th style="text-align:right">Scritto</th><th style="text-align:right">Orale</th><th style="text-align:right">Finale</th><th>Quando</th><th></th></tr></thead><tbody>';
  righe.forEach(function (r) {
    var v = votiDi(r.id), q = quizDi(r.id), o = v.orale;
    h += '<tr data-orale="' + r.id + '"><td>' + linkScheda(r) + (q.bes ? ' <span class="chip s-bozza" title="Studente BES: interrogazione su ' + Math.max(1, Math.round(RG().orale.domande / 2)) + ' termini">BES</span>' : '') + (r.escluso ? ' <span class="chip s-correggere">Escluso · max ' + fv(RG().orale.maxEsclusi) + '</span>' : '') + '</td><td class="n">' + esc(etich(r)) + '</td>' +
      '<td>' + chipQuiz(q) + '</td>' +
      '<td class="n">' + (r.escluso ? '<span class="muted" style="font-weight:400">—</span>' : fv(v.voto)) + '</td>' +
      '<td class="n">' + (o ? fv(o.voto) + (o.manuale ? ' <span class="chip s-bozza" title="Voto assegnato da te; quello calcolato dalle risposte era ' + fv(o.votoCalcolato) + '">tuo</span>' : '') + '<br><span class="muted" style="font-weight:400;font-size:13px">' + fv(o.punti) + ' / ' + ((o.termini && o.termini.length) || RG().orale.domande) + ' · ' + esc(dataBreve(o.data)) + (o.manuale ? ' · calcolato ' + fv(o.votoCalcolato) : '') + '</span>' : '—') + '</td>' +
      '<td class="n">' + (v.finale != null ? '<b style="font-size:18px">' + fv(v.finale) + '</b>' : q.stato === 'scaduto' ? '<span class="muted" style="font-weight:400">senza voto</span>' : '<b style="font-size:18px">—</b>') + '</td>' +
      '<td>' + celPiano(r, q, o, puo) + '</td>' +
      '<td>' + (!puo ? '' : q.superata ? '<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn ' + (o ? 'sec' : '') + ' tb" onclick="apriOrale(\'' + r.id + '\',this)">' + (v.oraleInCorso ? 'Riprendi' : o ? 'Ripeti' : 'Interroga') + '</button>' +
        (o ? '<button class="btn sec tb" onclick="annullaOrale(\'' + r.id + '\',this)">Annulla voto</button>' : '') + '</div>' : '<span class="muted" style="font-size:14px">' + (q.stato === 'scaduto' ? 'non interrogabile' : 'in attesa del quiz') + '</span>') + '</td></tr>';
  });
  return (puo ? '<section class="card row" id="orSim" style="gap:10px;align-items:center"><b style="font-size:17px">Simulazione</b><button class="btn sec" id="orSimula" onclick="simulaOrale(false,this)">Simula un\'interrogazione</button>' +
    '<button class="btn sec" id="orSimulaBes" onclick="simulaOrale(true,this)">Simula con ' + Math.max(1, Math.round(RG().orale.domande / 2)) + ' termini (misure personalizzate)</button><span class="muted" style="font-size:14px">per provare o mostrare in classe come funziona: niente viene salvato</span></section>' : '') +
    elencoDelGiorno(righe, puo) + h + '</tbody></table></div></section>';
}
/* --- calendario delle interrogazioni --- */
function oggiIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function giornoIt(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); }
function celPiano(r, q, o, puo) {
  var p = q.piano;
  if (!q.superata || o) return p && !o ? '<span class="muted" style="font-size:13px">' + esc(giornoIt(p.data)) + '</span>' : '';
  if (!puo) return p ? esc(giornoIt(p.data)) + (p.ora ? ' · ' + p.ora + 'ª ora' : '') : '<span class="muted">da programmare</span>';
  return '<div class="row" style="gap:4px;flex-wrap:nowrap"><input type="date" aria-label="Giorno dell\'interrogazione di ' + esc(r.nome) + '" data-pgiorno="' + r.id + '" value="' + (p ? p.data : '') + '" onchange="salvaPiano(\'' + r.id + '\')" style="min-height:38px;max-width:150px">' +
    '<select aria-label="Ora di lezione" data-pora="' + r.id + '" onchange="salvaPiano(\'' + r.id + '\')" style="min-height:38px;max-width:86px"><option value="">ora</option>' +
    [1, 2, 3, 4, 5, 6, 7, 8].map(function (h) { return '<option value="' + h + '"' + (p && p.ora === h ? ' selected' : '') + '>' + h + 'ª</option>'; }).join('') + '</select></div>';
}
function salvaPiano(id) {
  var g = document.querySelector('[data-pgiorno="' + id + '"]'), o = document.querySelector('[data-pora="' + id + '"]');
  api('pianoorale', { alunno: id, data: g ? g.value : '', ora: o ? o.value : '' }).then(function (x) {
    var q = quizDi(id); q.piano = x.piano;
    toast(x.piano ? nomeAlunno(id) + ': ' + giornoIt(x.piano.data) + (x.piano.ora ? ', ' + x.piano.ora + 'ª ora' : '') : nomeAlunno(id) + ': da programmare');
    var b = $('orGiorno'); if (b) b.outerHTML = elencoDelGiorno((S.d.panoramica || []).filter(function (r) { return inClasse(r.id); }), PUO('voti') && !RO());
  }).catch(function (e) { toast(errMsg(e), true); });
}
function elencoDelGiorno(righe, puo) {
  var g = S.orG || oggiIso();
  var lista = righe.filter(function (r) { var p = quizDi(r.id).piano; return p && p.data === g; })
    .sort(function (a, b) { return ((quizDi(a.id).piano.ora || 99) - (quizDi(b.id).piano.ora || 99)) || a.nome.localeCompare(b.nome); });
  var daProg = righe.filter(function (r) { var q = quizDi(r.id); return q.superata && !votiDi(r.id).orale && !q.piano; }).length;
  return '<section class="card stack" id="orGiorno"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><h3 style="margin:0;font-size:19px">Interrogazioni del giorno</h3>' +
    '<span class="muted" style="font-size:14px">' + (daProg ? daProg + (daProg === 1 ? ' ammesso ancora da programmare' : ' ammessi ancora da programmare') + ' (colonna «Quando» qui sotto)' : 'tutti gli ammessi sono programmati o già interrogati') + '</span></div>' +
    '<div class="row" style="gap:8px"><input type="date" id="orGData" aria-label="Giorno" value="' + g + '" onchange="S.orG=this.value;vistaDocente()" style="min-height:42px"><button class="btn sec" id="orGStampa" onclick="stampaGiorno()"' + (lista.length ? '' : ' disabled') + '>Stampa l\'elenco</button></div></div>' +
    (lista.length ? '<ol style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:6px">' + lista.map(function (r) {
      var q = quizDi(r.id), o = votiDi(r.id).orale;
      return '<li><b>' + esc(r.nome) + '</b> <span class="muted">' + esc(etich(r)) + (q.piano.ora ? ' · ' + q.piano.ora + 'ª ora' : '') + '</span>' + (q.bes ? ' <span class="chip s-bozza">BES</span>' : '') +
        (o ? ' <span class="chip s-approvata">interrogato · ' + fv(o.voto) + '</span>' : puo ? ' <button class="btn tb" onclick="apriOrale(\'' + r.id + '\',this)">Interroga</button>' : '') + '</li>';
    }).join('') + '</ol>' : '<p class="muted" style="margin:0">Nessuna interrogazione programmata per ' + esc(giornoIt(g)) + '.</p>') + '</section>';
}
function stampaGiorno() {
  var g = S.orG || oggiIso(), righe = (S.d.panoramica || []).filter(function (r) { var p = quizDi(r.id).piano; return inClasse(r.id) && p && p.data === g; })
    .sort(function (a, b) { return ((quizDi(a.id).piano.ora || 99) - (quizDi(b.id).piano.ora || 99)) || a.nome.localeCompare(b.nome); });
  var w = window.open('', '_blank'); if (!w) { toast('Consenti le finestre popup per stampare', true); return; }
  w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Interrogazioni ' + esc(giornoIt(g)) + '</title><style>body{font-family:Arial,sans-serif;margin:18mm;color:#15212B}h1{font-size:20pt;margin:0 0 2mm}p{margin:0 0 6mm;color:#555}table{width:100%;border-collapse:collapse;font-size:12pt}th,td{border:1px solid #999;padding:3mm;text-align:left}th{background:#eee}td.v{width:28mm}</style></head><body>' +
    '<h1>Interrogazioni del glossario</h1><p>' + esc(giornoIt(g)) + ' · ' + righe.length + (righe.length === 1 ? ' alunno' : ' alunni') + '</p>' +
    '<table><thead><tr><th>Ora</th><th>Alunno</th><th>Classe</th><th>Voto orale</th><th>Note</th></tr></thead><tbody>' +
    righe.map(function (r) { var q = quizDi(r.id); return '<tr><td>' + (q.piano.ora ? q.piano.ora + 'ª' : '') + '</td><td>' + esc(r.nome) + '</td><td>' + esc(etich(r)) + '</td><td class="v"></td><td></td></tr>'; }).join('') +
    '</tbody></table><script>setTimeout(function(){window.print()},300)</scr' + 'ipt></body></html>');
  w.document.close();
}
/* --- interrogazione a schermo pieno (tablet in classe) --- */
function schermoPieno(on) {
  document.body.classList.toggle('or-pieno', !!on); S.orPieno = !!on;
  try { if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {}); else if (!on && document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* va bene anche senza */ }
  var y = window.scrollY; vistaDocente(); window.scrollTo(0, y);
}
function apriOrale(id, btn) {
  if (btn) btn.disabled = true;
  api('oralepesca', { alunno: id }).then(function (d) {
    S.or = { alunno: id, bozza: d.bozza, esiti: d.bozza.termini.map(function () { return null; }), nota: '' };
    vistaDocente(); window.scrollTo(0, 0);
  }).catch(function (e) { toast(errMsg(e), true); if (btn) btn.disabled = false; });
}
/* simulazione: stessa schermata dell'interrogazione, con termini pescati a caso e nessun salvataggio */
function simulaOrale(bes, btn) {
  if (btn) btn.disabled = true;
  api('oraleprova', { bes: bes }).then(function (d) {
    S.or = { alunno: '_prova', prova: true, bes: !!bes, bozza: d.bozza, esiti: d.bozza.termini.map(function () { return null; }), nota: '' };
    vistaDocente(); window.scrollTo(0, 0);
  }).catch(function (e) { toast(errMsg(e), true); if (btn) btn.disabled = false; });
}
function puntiOrale() { return S.or.esiti.reduce(function (x, y) { return x + (y || 0); }, 0); }
function schedaOrale() {
  var o = S.or, r = (S.d.panoramica || []).filter(function (x) { return x.id === o.alunno; })[0] || {}, q = quizDi(o.alunno), vs = votiDi(o.alunno);
  var fatti = o.esiti.filter(function (e) { return e !== null; }).length, punti = puntiOrale(), tutti = fatti === o.esiti.length;
  if (o.prova) r = { nome: 'Simulazione' };
  var h = '<section class="card stack" id="oraleScheda"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">' + (o.prova ? 'Simulazione dell\'interrogazione' + (o.bes ? ' · ' + o.esiti.length + ' termini' : '') : 'Interrogazione di ' + esc(r.nome || nomeAlunno(o.alunno))) + ' <span class="muted" style="font-weight:400;font-size:16px">' + (o.prova ? '' : esc(etich(r))) + '</span></h2>' +
    '<div class="row" style="gap:6px"><button class="btn sec tb" id="orPieno" onclick="schermoPieno(' + (S.orPieno ? 'false' : 'true') + ')">' + (S.orPieno ? 'Esci dallo schermo pieno' : 'Schermo pieno') + '</button><button class="btn sec tb" onclick="S.or=null;if(S.orPieno)schermoPieno(false);vistaDocente()">Torna all\'elenco</button></div></div>' +
    (o.prova ? '<div class="note" id="orInfo">Simulazione: termini pescati a caso tra tutti quelli del glossario. Segna le risposte e cambia i termini come in un\'interrogazione vera: <b>niente viene salvato</b> e nessuno studente è coinvolto.</div>' : '' +
    '<div class="or-info" id="orInfo"><div><span class="kl">Voto dello scritto</span><b>' + (r.escluso ? 'Escluso' : fv(vs.voto)) + '</b><small>' + (r.escluso ? 'non entra nel finale' : (vs.errIt || 0) + (vs.errIt === 1 ? ' errore' : ' errori') + (vs.manuale != null ? ' · voto manuale' : '')) + '</small></div>' +
    '<div><span class="kl">Tempo nel quiz</span><b>' + (q.sessioni ? tempoMs(q.ms) : '—') + '</b><small>' + (q.sessioni ? q.sessioni + (q.sessioni === 1 ? ' sessione' : ' sessioni') + (q.superata ? ' · ' + tempoMs(q.msFine) + ' per superarlo' : '') : 'nessuna sessione') + '</small></div>' +
    '<div><span class="kl">Risposte nel quiz</span><b>' + q.corrette + ' / ' + q.risposte + '</b><small>' + (q.risposte ? Math.round(q.corrette / q.risposte * 100) + '% corrette · ' + (q.errori || 0) + ' errori' : 'nessuna risposta') + '</small></div>' +
    '<div><span class="kl">Termini indovinati</span><b>' + q.indovinati + ' / ' + q.soglia + '</b><small>' + (q.superata ? 'quiz superato il ' + esc(dataBreve(q.superata)) : 'quiz non superato') + '</small></div></div>' +
    (r.escluso ? '<div class="note warn"><b>Alunno escluso dallo scritto:</b> all\'orale può arrivare al massimo a ' + fv(RG().orale.maxEsclusi) + ' (' + fv(RG().orale.base) + ' + ' + frz(RG().orale.passoEsclusi) + ' per punto).</div>' : '')) +
    '</section><div class="or-punti" id="orPunti" aria-live="polite"><div><span class="kl">Risposte segnate</span><b>' + fatti + ' / ' + o.esiti.length + '</b></div><div><span class="kl">Punti</span><b>' + fv(punti) + ' / ' + o.esiti.length + '</b>' + (o.esiti.length !== RG().orale.domande ? '<small>studente BES: ' + o.esiti.length + ' termini, ogni punto vale doppio</small>' : '') + '</div>' +
    '<div><span class="kl">Voto orale</span><b>' + (tutti ? fv(votoOraleDa(punti, r.escluso, o.esiti.length)) : '—') + '</b></div></div>';
  o.bozza.termini.forEach(function (t, i) {
    var a = area(t.area) || {}, e = o.esiti[i];
    h += '<section class="card or-voce" data-pos="' + i + '" style="border-left:8px solid ' + esc(a.colore || '#15212B') + '"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="muted" style="font-size:13px">' + (i + 1) + ' di ' + o.bozza.termini.length + ' · ' + esc(a.it || '') + '</div>' +
      '<div class="or-term">' + esc(t.it) + '</div></div><button class="btn sec tb" onclick="cambiaOrale(' + i + ',this)">Cambia termine</button></div>' +
      '<p class="or-def"><span class="muted" style="font-size:13px;display:block">Definizione corretta (la vedi solo tu)</span>' + esc(t.def) + '</p>' +
      '<div class="row or-esiti" role="group" aria-label="Esito della risposta ' + (i + 1) + '">' + [[1, 'Corretta', 'ok'], [0.5, 'Parziale', 'mz'], [0, 'Sbagliata', 'no']].map(function (x) {
        return '<button class="or-b ' + x[2] + (e === x[0] ? ' on' : '') + '" aria-pressed="' + (e === x[0]) + '" onclick="esitoOrale(' + i + ',' + x[0] + ')">' + x[1] + ' <small>' + fv(x[0]) + '</small></button>'; }).join('') + '</div></section>';
  });
  var calc = tutti ? votoOraleDa(punti, r.escluso, o.esiti.length) : null, mano = o.mano != null; // scelto «lo assegno io» (anche col campo ancora vuoto)
  h += '<section class="card stack" id="orVoto"><h3 style="margin:0;font-size:19px">Voto dell\'interrogazione</h3>' +
    '<div class="row" role="radiogroup" aria-label="Voto orale">' +
      '<label class="row" style="gap:8px;font-weight:700"><input type="radio" name="orTipo" id="orCalc" ' + (!mano ? 'checked' : '') + ' onchange="S.or.mano=null;vistaOralePos()" style="width:20px;height:20px"> Calcolato dalle risposte' + (tutti ? ': <span class="disp">' + fv(calc) + '</span>' : '') + '</label>' +
      '<label class="row" style="gap:8px;font-weight:700"><input type="radio" name="orTipo" id="orMano" ' + (mano ? 'checked' : '') + ' onchange="S.or.mano=S.or.mano||\'\';vistaOralePos();var e=$(\'orManoV\');if(e)e.focus()" style="width:20px;height:20px"> Lo assegno io</label>' +
      (o.mano != null ? '<input id="orManoV" type="text" inputmode="decimal" placeholder="es. 6,5" value="' + esc(o.mano) + '" oninput="S.or.mano=this.value;aggiornaSalvaOrale()" style="max-width:120px" aria-label="Voto orale assegnato dal docente">' : '') +
    '</div>' + (o.mano != null ? '<p class="muted" style="margin:0;font-size:14px">Da 1 a 10, a quarti di voto. Il voto calcolato' + (tutti ? ' (' + fv(calc) + ')' : '') + ' resta salvato accanto, per confronto.</p>' : '') + '</section>';
  h += '<section class="card stack"><label for="orNota">Nota (facoltativa, resta nel registro dell\'interrogazione)</label><input id="orNota" type="text" maxlength="300" value="' + esc(o.nota || '') + '" oninput="S.or.nota=this.value">' +
    '<div class="row"><button class="btn ok" id="orSalva" ' + (tutti ? '' : 'disabled') + ' onclick="salvaOrale(this)">' + testoSalvaOrale(calc, tutti) + '</button>' +
    '<button class="btn sec" onclick="scartaOrale(this)">Scarta questa interrogazione</button>' + (o.bozza.cambi ? '<span class="muted" style="font-size:14px">' + (o.bozza.cambi === 1 ? '1 termine cambiato' : o.bozza.cambi + ' termini cambiati') + '</span>' : '') + '</div>' +
    (tutti ? '' : '<p class="muted" style="margin:0;font-size:14px">Segna l\'esito di tutte le risposte per salvare.</p>') + '</section>';
  return h;
}
function vistaOralePos() { var y = window.scrollY; vistaDocente(); window.scrollTo(0, y); }
function testoSalvaOrale(calc, tutti) {
  var m = S.or && S.or.mano != null && String(S.or.mano).trim() !== '' ? S.or.mano : null;
  return (S.or && S.or.prova ? 'Concludi la simulazione' : 'Salva l\'interrogazione') + (tutti ? ' · voto ' + (m != null ? esc(String(m).replace('.', ',')) + ' (tuo)' : fv(calc)) : '');
}
function aggiornaSalvaOrale() {
  var b = $('orSalva'), r = (S.d.panoramica || []).filter(function (x) { return x.id === S.or.alunno; })[0] || {};
  var tutti = S.or.esiti.every(function (e) { return e !== null; });
  if (b) b.innerHTML = testoSalvaOrale(tutti ? votoOraleDa(puntiOrale(), r.escluso, S.or.esiti.length) : null, tutti);
}
function esitoOrale(i, v) {
  S.or.esiti[i] = S.or.esiti[i] === v ? null : v;
  var y = window.scrollY; vistaDocente(); window.scrollTo(0, y);
}
function cambiaOrale(i, btn) {
  btn.disabled = true;
  (S.or.prova ? api('oraleprova', { bes: S.or.bes, pos: i, termini: S.or.bozza.termini.map(function (t) { return { a: t.area, k: t.k }; }) }) : api('oralecambia', { alunno: S.or.alunno, pos: i })).then(function (d) {
    S.or.bozza = d.bozza; S.or.esiti[i] = null; var y = window.scrollY; vistaDocente(); window.scrollTo(0, y); toast('Termine cambiato');
  }).catch(function (e) { toast(errMsg(e), true); btn.disabled = false; });
}
function salvaOrale(btn) {
  if (S.or.prova) {
    var m = S.or.mano != null && String(S.or.mano).trim() !== '' ? String(S.or.mano).trim().replace('.', ',') : null, c = fv(votoOraleDa(puntiOrale(), false, S.or.esiti.length));
    finestra('Simulazione conclusa', '<p style="margin:0">Voto orale della simulazione: <b style="font-size:22px">' + esc(m || c) + '</b>' + (m ? ' (assegnato da te; calcolato ' + c + ')' : '') + '.</p><p class="muted" style="margin:0">Non è stato salvato nulla.</p>',
      [{ t: 'Nuova simulazione', f: function () { var b = S.or.bes; S.or = null; simulaOrale(b); } }, { t: 'Torna all\'elenco', f: function () { S.or = null; if (S.orPieno) schermoPieno(false); vistaDocente(); } }]);
    return;
  }
  btn.disabled = true;
  var mano = S.or.mano != null && String(S.or.mano).trim() !== '' ? String(S.or.mano).trim() : null;
  api('oralesalva', { alunno: S.or.alunno, esiti: S.or.esiti, nota: S.or.nota, votoDocente: mano }).then(function (d) {
    S.or = null; return ricarica('Interrogazione salvata: voto orale ' + fv(d.orale.voto) + (d.orale.manuale ? ' (assegnato da te; calcolato ' + fv(d.orale.votoCalcolato) + ')' : ''));
  }).catch(function (e) { toast(errMsg(e), true); btn.disabled = false; });
}
function scartaOrale(btn) {
  if (S.or.prova) { S.or = null; if (S.orPieno) schermoPieno(false); vistaDocente(); return; }
  btn.disabled = true;
  api('oraleannulla', { alunno: S.or.alunno, bozza: true }).then(function () { S.or = null; return ricarica('Interrogazione scartata'); }).catch(function (e) { toast(errMsg(e), true); btn.disabled = false; });
}
function annullaOrale(id) {
  finestra('Annullare il voto orale?', '<p>Il voto orale di <b>' + esc(nomeAlunno(id)) + '</b> viene tolto e il voto finale torna vuoto. L\'interrogazione resta nello storico dei dati.</p>',
    [{ t: 'Annulla il voto orale', warn: true, f: function () { api('oraleannulla', { alunno: id }).then(function () { return ricarica('Voto orale annullato'); }).catch(function (e) { toast(errMsg(e), true); }); } }]);
}

/* --- stampa degli accessi al quiz: una pagina A4 per alunno con QR, indirizzo e codice personale, da consegnare a mano --- */
function bottoniAccessiQuiz() {
  if (!S.d.codiciAlunni || RO()) return '';
  return '<div class="row" id="accessiQuiz">' + CLASSI().map(function (c) { return '<button class="btn" onclick="stampaAccessiQuiz(\'' + c + '\')">Accessi al quiz · ' + c + '</button>'; }).join('') +
    (CLASSI().length > 1 ? '<button class="btn sec" onclick="stampaAccessiQuiz(\'tutte\')">Accessi al quiz di tutte le classi</button>' : '') + '</div>' +
    '<p class="muted" style="margin:0;font-size:14px">Una pagina A4 per alunno con QR, indirizzo e codice personale per entrare nel quiz. Si apre la stampa: scegli «Salva come PDF» per avere il file.</p>';
}
function stampaAccessiQuiz(classe) {
  var base = location.origin + '/quiz', logo = Poster.logo(22), ed = (S.d.config && S.d.config.edizione) || {};
  var lista = S.d.codiciAlunni.filter(function (a) { return !classe || classe === 'tutte' || (a.classe || '3E') === classe; });
  if (!lista.length) { toast('Nessun alunno in questa classe', true); return; }
  var pagine = lista.map(function (a) {
    var link = base + '?c=' + encodeURIComponent(a.codice), qa = quizDi(a.id), sq = qa.scadenza || ((((S.d.admin || {}).impostazioni || {}).quiz || {}).scadenze || {})[a.classe || '3E'];
    return '<section class="pg">' +
      '<header>' + logo + '<div><div class="sc">Istituto Barsanti - sede Salvetti</div><div class="pr">Glossario odontotecnico · Classe ' + esc(a.classe || '3E') + (ed.as ? ' · a.s. ' + esc(ed.as) : '') + '</div></div></header>' +
      '<div class="tit">Quiz del glossario</div><div class="nome">' + esc(a.nome) + '</div>' +
      '<div class="gr">Classe ' + esc(a.classe || '3E') + ' · accesso personale al quiz · seconda parte della prova</div>' +
      '<div class="qr">' + qrSvg(link, 78) + '<p>Inquadra il QR con la fotocamera del telefono:<br><b>entri direttamente nel tuo quiz.</b></p></div>' +
      '<div class="acc"><div><div class="lb">Indirizzo del quiz</div><div class="url">' + esc(base.replace(/^https?:\/\//, '')) + '</div><div class="pic">poi scrivi il tuo codice personale</div></div>' +
      '<div><div class="lb">Il tuo codice personale</div><div class="cod">' + esc(a.codice) + '</div></div></div>' +
      '<ol><li>Compare un termine con <b>' + RG().quiz.opzioni + ' definizioni</b>: scegli quella giusta entro <b>' + RG().quiz.secondi + ' secondi</b>. Ogni risposta giusta è un termine indovinato.</li>' +
      '<li><b>Se sbagli</b>, la risposta giusta non viene mostrata e <b>torni indietro di ' + RG().quiz.passo + ' termini</b>: per andare avanti devi studiare le definizioni.</li>' +
      (qa.partenza || ((((S.d.admin || {}).impostazioni || {}).quiz || {}).partenze || {})[a.classe || '3E'] ? '<li>Il quiz si apre il <b>' + esc(oraIt(qa.partenza || S.d.admin.impostazioni.quiz.partenze[a.classe || '3E'])) + '</b>: prima di allora non si può entrare.</li>' : '') +
      '<li>I progressi restano salvati: puoi fermarti e riprendere quando vuoi' + (sq ? ', <b>entro ' + esc(oraIt(sq)) + '</b>.' : ', entro la scadenza che ti dirà il docente.') + '</li>' +
      '<li>Il quiz è superato quando hai indovinato <b>' + (qa.soglia || 260) + ' termini</b>.</li></ol>' +
      '<div class="ora"><b>A cosa serve.</b> Solo chi supera il quiz è <b>ammesso all\'interrogazione orale</b>: il docente pesca ' + RG().orale.domande + ' termini e tu dai la definizione. ' +
      'Chi non completa il quiz entro la scadenza non viene interrogato e resta senza voto. Voto orale fino a ' + fv(RG().orale.max) + '; il voto finale è la ' + mediaTxt() + '.</div>' +
      '<div class="warn"><b>Il codice e il QR sono personali.</b> Non fotografarli e non darli a nessuno: le sessioni fatte con il tuo codice risultano tue.</div>' +
      '<footer>Prof. Danilo Cerrato · Laboratorio odontotecnico</footer></section>';
  }).join('');
  var css = '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"Atkinson Hyperlegible",Arial,sans-serif;color:#15212B;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.pg{width:210mm;height:297mm;padding:16mm 18mm 14mm;display:flex;flex-direction:column;page-break-after:always;break-after:page;overflow:hidden}.pg:last-child{page-break-after:auto;break-after:auto}' +
    'header{display:flex;gap:5mm;align-items:center;border-bottom:1.2pt solid #15212B;padding-bottom:4mm}.sc{font-family:Archivo,Arial,sans-serif;font-weight:800;font-size:15pt}.pr{font-size:10.5pt;color:#5B6976;margin-top:1mm}' +
    '.tit{font-family:Archivo,Arial,sans-serif;font-weight:800;font-size:13pt;letter-spacing:.14em;text-transform:uppercase;color:#1F5FA8;margin-top:8mm}' +
    '.nome{font-family:Archivo,Arial,sans-serif;font-weight:900;font-size:30pt;margin-top:1mm;line-height:1.1}.gr{display:inline-block;align-self:flex-start;border-left:3mm solid #1F5FA8;padding:1mm 3mm;font-size:13pt;margin-top:2mm;background:#F2F5F7}' +
    '.qr{display:flex;flex-direction:column;align-items:center;margin-top:7mm}.qr svg{border:1pt solid #C3CED7;border-radius:3mm}.qr p{text-align:center;font-size:12pt;margin:3mm 0 0}' +
    '.acc{display:grid;grid-template-columns:1.3fr 1fr;gap:5mm;margin-top:6mm}.acc>div{border:1pt solid #C3CED7;border-radius:3mm;padding:3mm 4mm}.lb{font-size:9.5pt;color:#5B6976;text-transform:uppercase;letter-spacing:.06em}' +
    '.url{font-weight:700;font-size:13pt;margin-top:1.5mm;word-break:break-all}.pic{font-size:9.5pt;color:#5B6976;margin-top:1mm}.cod{font-family:"Courier New",monospace;font-weight:700;font-size:24pt;letter-spacing:.18em;margin-top:1mm}' +
    'ol{font-size:11pt;line-height:1.4;margin:4mm 0 0;padding-left:6mm}li{margin:.8mm 0}' +
    '.ora{margin-top:4mm;background:#15212B;color:#fff;border-radius:3mm;padding:3mm 4mm;font-size:10.5pt;line-height:1.4}' +
    '.warn{margin-top:auto;background:#FCEBD9;border-radius:3mm;padding:3mm 4mm;font-size:10.5pt;line-height:1.4}footer{margin-top:4mm;font-size:9.5pt;color:#5B6976;text-align:center}';
  var w = window.open('', '_blank');
  if (!w) { toast('Consenti le finestre popup per stampare', true); return; }
  w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Accessi al quiz ' + esc(classe && classe !== 'tutte' ? classe : CLASSI().join('-')) + '</title>' +
    '<style>' + cssFonti(location.origin) + css + '</style></head><body>' + pagine +
    scriptStampa('document.body.setAttribute("data-pronto","1");setTimeout(function(){window.print()},400)') + '</body></html>');
  w.document.close();
}

/* --- regole del quiz (pagina «Scadenze e valutazione»): termini da indovinare e scadenza per classe. Senza scadenza il quiz della classe resta chiuso. --- */
function bloccoQuizImp() {
  var q = (S.d.admin.impostazioni && S.d.admin.impostazioni.quiz) || { scadenze: {} }, tot = S.d.termini.length;
  return '<section class="card stack" id="quizImp"><h2 style="margin:0;font-size:22px">Quiz: seconda parte della prova</h2>' +
    '<p class="muted" style="margin:0">Per ogni classe fissi <b>apertura</b> e <b>scadenza</b>: il quiz si apre all\'ora di apertura (se la lasci vuota, si apre subito) e si chiude alla scadenza. Senza scadenza resta chiuso. ' +
    'Chi indovina tutti i termini richiesti entro la scadenza è ammesso all\'interrogazione; gli altri restano senza voto. A ogni errore l\'alunno torna indietro di ' + RG().quiz.passo + ' termini e la risposta giusta non viene mostrata.</p>' +
    '<div class="grid4"><div><label for="qzSoglia">Termini da indovinare (su ' + tot + ')</label><input id="qzSoglia" type="number" min="10" max="' + tot + '" step="1" value="' + (q.soglia || tot) + '"></div>' +
    '<div><label for="qzSec">Secondi per rispondere</label><input id="qzSec" type="number" inputmode="numeric" min="10" max="300" step="1" value="' + RG().quiz.secondi + '"><span class="muted" style="font-size:13px">meno tempo = più difficile copiare (con 20-25 secondi non si fa in tempo a chiedere a un\'IA)</span></div>' +
    '</div><div class="grid4">' +
    CLASSI().map(function (c) {
      var d = (q.scadenze || {})[c], p = (q.partenze || {})[c], now = Date.now();
      var st = !d ? 'quiz chiuso: manca la scadenza' : now > Date.parse(d) ? 'quiz chiuso: scadenza passata' : p && now < Date.parse(p) ? 'si apre il ' + oraIt(p) : 'quiz aperto';
      return '<div><label for="qzPa_' + c + '">Apertura del quiz · ' + esc(c) + '</label><input id="qzPa_' + c + '" type="datetime-local" value="' + (p ? isoLocale(p) : '') + '">' +
        '<span class="muted" style="font-size:13px">vuota = si apre subito</span></div>' +
        '<div><label for="qzSc_' + c + '">Scadenza del quiz · ' + esc(c) + '</label><input id="qzSc_' + c + '" type="datetime-local" value="' + (d ? isoLocale(d) : '') + '">' +
        '<span class="muted" style="font-size:13px">' + esc(st) + '</span></div>'; }).join('') + '</div>' +
    '<div class="row"><button class="btn" id="qzSalva" onclick="salvaQuizImp(this)">Salva le regole del quiz</button></div></section>';
}
function salvaQuizImp(btn) {
  var sc = {}, pa = {}; CLASSI().forEach(function (c) { var v = $('qzSc_' + c).value, w = $('qzPa_' + c).value; sc[c] = v ? new Date(v).toISOString() : ''; pa[c] = w ? new Date(w).toISOString() : ''; });
  btn.disabled = true;
  api('impostazioni', { quiz: { soglia: $('qzSoglia').value, secondi: $('qzSec').value, scadenze: sc, partenze: pa } }).then(function () { return ricarica('Regole del quiz salvate'); }).catch(function (e) { toast(errMsg(e), true); btn.disabled = false; });
}

/* regole personali del quiz (PDP, DSA…): meno termini da indovinare e/o meno termini persi a ogni errore */
function regolePersonaliQuiz(id) {
  var q = quizDi(id), imp = (S.d.admin && S.d.admin.impostazioni && S.d.admin.impostazioni.quiz) || {}, sc = imp.soglia || S.d.termini.length, pc = RG().quiz.passo;
  var B = q.bes || null;
  S.qpB = { attivo: !!B, secondi: B && B.secondi != null ? String(B.secondi) : '', dimezza: B ? B.dimezza !== false : true };
  S.qpB.tempo = B && B.secondi === 0 ? 'no' : B && B.secondi ? 'mio' : 'classe';
  var salva = function (soglia, passo) {
    var b = S.qpB.attivo ? { attivo: true, secondi: S.qpB.tempo === 'no' ? 0 : S.qpB.tempo === 'classe' ? '' : String(S.qpB.secondi).trim(), dimezza: S.qpB.dimezza } : { attivo: false };
    api('quizpersonale', { alunno: id, soglia: soglia, passo: passo, bes: b }).then(function (x) {
      return ricarica(soglia === '' && passo === '' && !x.bes ? 'Regole della classe per ' + nomeAlunno(id) : 'Regole personali salvate per ' + nomeAlunno(id) + (x.bes ? ' (BES)' : '') + (x.superata ? ': ha già indovinato abbastanza termini, è ammesso all\'orale' : ''));
    }).catch(function (e) { toast(errMsg(e), true); });
  };
  S.qpS = q.sogliaPersonale != null ? String(q.sogliaPersonale) : ''; S.qpP = q.passoPersonale != null ? String(q.passoPersonale) : '';
  var scelte = [{ t: 'Salva le regole personali', f: function () { salva(String(S.qpS).trim(), String(S.qpP).trim()); } }];
  if (q.sogliaPersonale != null || q.passoPersonale != null || B) scelte.push({ t: 'Torna alle regole della classe', warn: true, f: function () { S.qpB.attivo = false; salva('', ''); } });
  finestra('BES e regole personali · ' + nomeAlunno(id),
    '<p style="margin:0">Per un alunno con PDP o DSA puoi chiedere <b>meno termini</b> e togliere <b>meno termini a ogni errore</b>. Lascia vuoto un campo per usare la regola della classe. ' +
    nomeAlunno(id) + ' ha indovinato finora <b>' + q.indovinati + '</b> termini.</p>' +
    '<div class="grid2"><div><label for="qpSoglia">Termini da indovinare</label><input id="qpSoglia" type="text" inputmode="numeric" placeholder="classe: ' + sc + '" value="' + (q.sogliaPersonale != null ? q.sogliaPersonale : '') + '" oninput="S.qpS=this.value"></div>' +
    '<div><label for="qpPasso">Termini persi a ogni errore</label><input id="qpPasso" type="text" inputmode="numeric" placeholder="classe: ' + pc + '" value="' + (q.passoPersonale != null ? q.passoPersonale : '') + '" oninput="S.qpP=this.value"></div></div>' +
    '<p class="muted" style="margin:0;font-size:14px">Se con la nuova soglia ha già indovinato abbastanza termini, risulta subito ammesso all\'interrogazione.</p>' +
    '<fieldset class="stack" style="gap:10px;border:2px solid var(--line);border-radius:12px;padding:12px 14px;margin:0"><legend style="font-weight:700;padding:0 6px">Studente BES</legend>' +
      '<label class="row" style="gap:10px;font-weight:700"><input type="checkbox" id="qpBes" ' + (B ? 'checked' : '') + ' onchange="S.qpB.attivo=this.checked;$(\'qpBesOpz\').hidden=!this.checked" style="width:22px;height:22px"> Segna come studente BES</label>' +
      '<div id="qpBesOpz" class="stack" style="gap:10px"' + (B ? '' : ' hidden') + '>' +
        '<div><label for="qpTempo">Tempo per rispondere nel quiz</label><select id="qpTempo" onchange="S.qpB.tempo=this.value;$(\'qpSecBox\').hidden=this.value!==\'mio\'">' +
          [['classe', 'Come la classe (' + RG().quiz.secondi + ' secondi)'], ['mio', 'Secondi personali'], ['no', 'Senza limite di tempo']].map(function (o) { return '<option value="' + o[0] + '"' + (S.qpB.tempo === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
        '<div id="qpSecBox"' + (S.qpB.tempo === 'mio' ? '' : ' hidden') + '><label for="qpSec">Secondi per rispondere (10-600)</label><input id="qpSec" type="text" inputmode="numeric" value="' + esc(S.qpB.tempo === 'mio' ? S.qpB.secondi : '') + '" oninput="S.qpB.secondi=this.value"></div>' +
        '<label class="row" style="gap:10px"><input type="checkbox" id="qpDim" ' + (S.qpB.dimezza ? 'checked' : '') + ' onchange="S.qpB.dimezza=this.checked" style="width:22px;height:22px"> Pulsante «Dimezza opzioni» nel quiz (da 4 a 2 definizioni)</label>' +
        '<p class="muted" style="margin:0;font-size:14px">All\'interrogazione lo studente BES risponde su <b>' + Math.max(1, Math.round(RG().orale.domande / 2)) + ' termini</b> invece di ' + RG().orale.domande + ': ogni punto vale doppio, il voto massimo resta ' + fv(RG().orale.max) + '.</p>' +
      '</div></fieldset>', scelte);
}

/* proroga individuale del quiz: una data dopo la scadenza della classe; si può togliere */
function prorogaQuiz(id) {
  var q = quizDi(id), base = q.proroga || q.scadenzaClasse, def = new Date(Math.max(Date.parse(base), Date.now()) + 2 * 86400000);
  S.qzPr = isoLocale(def.toISOString());
  var scelte = [{ t: 'Concedi la proroga', f: function () {
    if (!S.qzPr) { toast('Scegli la data della proroga.', true); return; }
    api('quizproroga', { alunno: id, data: new Date(S.qzPr).toISOString() }).then(function (x) { return ricarica('Proroga del quiz per ' + nomeAlunno(id) + ' fino a ' + oraIt(x.proroga)); }).catch(function (e) { toast(errMsg(e), true); });
  } }];
  if (q.proroga) scelte.push({ t: 'Togli la proroga', warn: true, f: function () {
    api('quizproroga', { alunno: id, data: null }).then(function () { return ricarica('Proroga del quiz tolta a ' + nomeAlunno(id)); }).catch(function (e) { toast(errMsg(e), true); });
  } });
  finestra('Proroga del quiz · ' + nomeAlunno(id),
    '<p style="margin:0">Scadenza del quiz della classe: <b>' + esc(oraIt(q.scadenzaClasse)) + '</b>' + (q.proroga ? ' · proroga attuale: <b>' + esc(oraIt(q.proroga)) + '</b>' : '') + '. ' +
    nomeAlunno(id) + ' è a <b>' + q.indovinati + ' termini su ' + q.soglia + '</b>: con la proroga può continuare da lì.</p>' +
    '<div><label for="qzPrData">Nuova scadenza del quiz per questo alunno</label><input id="qzPrData" type="datetime-local" value="' + esc(S.qzPr) + '" oninput="S.qzPr=this.value"></div>', scelte);
}

/* tempo complessivo sul quiz fino al termine: al superamento, alla scadenza, oppure finora */
function fineQuizHtml(q) {
  if (!q.sessioni) return '—';
  var t = tempoMs(q.msFine != null ? q.msFine : q.ms);
  if (q.superata) return '<span title="Superato in ' + (q.giorniSup || 1) + (q.giorniSup === 1 ? ' giorno' : ' giorni') + ' dalla prima sessione">' + t + '</span>';
  if (q.stato === 'scaduto') return '<span class="no" style="font-weight:400">' + t + '</span>';
  return '<span class="muted" style="font-weight:400">' + t + ' · in corso</span>';
}

/* --- solleciti per il quiz: chi non è mai entrato e chi è indietro rispetto al tempo passato --- */
function bloccoSollecitiQuiz(righe) {
  if (RO()) return '';
  var now = Date.now(), mai = [], indietro = [], scad = null;
  righe.forEach(function (r) {
    var q = quizDi(r.id);
    if (q.superata || (q.stato !== 'in corso' && q.stato !== 'non iniziato') || !q.scadenza) return;
    var fine = Date.parse(q.scadenza), ini = q.partenza ? Date.parse(q.partenza) : (q.prima ? Date.parse(q.prima) : now);
    if (!scad || fine < scad) scad = fine;
    if (!q.sessioni) { mai.push(r); return; }
    var tempo = fine > ini ? Math.min(1, Math.max(0, (now - ini) / (fine - ini))) : 1, fatto = q.soglia ? q.indovinati / q.soglia : 0;
    if (fatto + 0.1 < tempo) indietro.push({ r: r, q: q });
  });
  if (!mai.length && !indietro.length) return '<section class="card stack" id="sollQuiz"><h3 style="margin:0;font-size:19px">Solleciti per il quiz</h3><p class="muted" style="margin:0">Nessuno da sollecitare: chi ha il quiz aperto è al passo con il tempo.</p></section>';
  var quando = scad ? oraIt(new Date(scad).toISOString()) : 'alla scadenza';
  var msgCl = 'Promemoria: il QUIZ GLOSSARIO si chiude ' + quando + ' ed è un termine tassativo. Solo chi lo supera entro la scadenza è ammesso all\'interrogazione. Chi non ha ancora iniziato lo faccia subito: si entra con il proprio codice personale.';
  var msgUno = function (r, q) {
    return (q ? 'Nel quiz del glossario sei a ' + q.indovinati + ' termini su ' + q.soglia + ': ' : 'Non hai ancora iniziato il quiz del glossario: ') + 'si chiude ' + quando + ' e non ci saranno proroghe. Prof. Cerrato';
  };
  var riga = function (r, q) {
    return '<tr><td>' + esc(r.nome) + '</td><td>' + (q ? q.indovinati + ' / ' + q.soglia + ' <span class="muted">(' + Math.round(q.indovinati / q.soglia * 100) + '%)</span>' : '<span class="chip s-correggere">mai entrato</span>') + '</td>' +
      '<td><button class="btn sec tb" onclick="copiaTesto(this.getAttribute(\'data-t\'),this)" data-t="' + esc(msgUno(r, q)) + '">Copia messaggio</button></td></tr>';
  };
  return '<section class="card stack" id="sollQuiz"><h3 style="margin:0;font-size:19px">Solleciti per il quiz · ' + (mai.length + indietro.length) + '</h3>' +
    '<p class="muted" style="margin:0">Chi non è mai entrato e chi è indietro rispetto al tempo già passato (ha indovinato una parte dei termini più piccola della parte di tempo trascorsa). I messaggi personali sono da mandare uno per uno; il promemoria per la classe non contiene nomi.</p>' +
    '<div class="row"><button class="btn" id="qzSollCl" onclick="copiaTesto(this.getAttribute(\'data-t\'),this)" data-t="' + esc(msgCl) + '">Copia il promemoria per la classe</button></div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th>Quiz</th><th></th></tr></thead><tbody>' +
    mai.map(function (r) { return riga(r, null); }).join('') + indietro.map(function (x) { return riga(x.r, x.q); }).join('') + '</tbody></table></div></section>';
}
function copiaTesto(t, btn) {
  var area = function () { finestra('Copia il testo', '<textarea style="width:100%;min-height:140px;font:inherit">' + esc(t) + '</textarea>', []); };
  var fatto = function () { if (btn) { var o = btn.textContent; btn.textContent = 'Copiato'; setTimeout(function () { btn.textContent = o; }, 1500); } toast('Testo copiato'); };
  try { navigator.clipboard.writeText(t).then(fatto, area); } catch (e) { area(); }
}
