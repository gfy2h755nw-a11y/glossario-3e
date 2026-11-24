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
        regolePersonaliChip(q) + '</td>' +
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap">' + (PUO('studenti') && !RO() ? '<button class="btn sec tb" data-pers="' + r.id + '" onclick="regolePersonaliQuiz(\'' + r.id + '\')">' + (haRegole(q) ? 'Modifica regole' : 'Regole personali') + '</button>' : '') + (PUO('studenti') && !RO() && !q.superata && q.scadenzaClasse ? '<button class="btn sec tb" onclick="prorogaQuiz(\'' + r.id + '\')">' + (q.proroga ? 'Modifica proroga' : 'Proroga') + '</button>' : '') +
        (q.sessioni ? '<button class="btn sec tb" aria-expanded="' + aperto + '" onclick="S.qzAperto=' + (aperto ? 'null' : '\'' + r.id + '\'') + ';vistaDocente()">' + (aperto ? 'Chiudi' : 'Sessioni') + '</button>' : '') + '</div></td></tr>';
    if (aperto) h += '<tr class="qz-det"><td colspan="12" style="background:#F6F8FA"><table class="tbl" style="margin:0"><thead><tr><th>Sessione</th><th>Inizio</th><th style="text-align:right">Tempo</th><th style="text-align:right">Risposte</th><th style="text-align:right">Corrette</th><th style="text-align:right">Errori</th><th style="text-align:right">di cui scadute</th><th style="text-align:right">Termini nuovi</th><th style="text-align:right">Termini persi</th></tr></thead><tbody>' +
      q.ultime.map(function (s, i) { return '<tr><td>' + (q.sessioni - q.ultime.length + i + 1) + '</td><td>' + esc(dataBreve(s.i)) + '</td><td class="n" style="font-weight:400">' + tempoMs(s.ms) + '</td><td class="n" style="font-weight:400">' + s.r + '</td><td class="n">' + s.c + '</td><td class="n">' + (s.e || 0) + '</td><td class="n" style="font-weight:400">' + s.s + '</td><td class="n">' + s.n + '</td><td class="n" style="font-weight:400">' + (s.p || 0) + '</td></tr>'; }).reverse().join('') +
      '</tbody></table>' + (q.sessioni > q.ultime.length ? '<p class="muted" style="margin:6px 0 0;font-size:13px">Sono mostrate le ultime ' + q.ultime.length + ' sessioni su ' + q.sessioni + '.</p>' : '') + '</td></tr>';
  });
  return h + '</tbody></table></div></section>' + bloccoSollecitiQuiz(righe);
}

/* --- interrogazione orale --- */
function paginaOrale() {
  if (S.orSc) return schedaScelta();
  if (S.or) return schedaOrale();
  var righe = (S.d.panoramica || []).filter(function (r) { return inClasse(r.id); });
  var fatte = righe.filter(function (r) { return votiDi(r.id).orale; }).length, puo = PUO('voti') && !RO();
  var amm = righe.filter(function (r) { return quizDi(r.id).superata; }).length, fuori = righe.filter(function (r) { return quizDi(r.id).stato === 'scaduto'; }).length;
  var h = '<section class="card stack" id="oraleTab"><h2 style="margin:0;font-size:22px">Interrogazioni</h2>' +
    '<p class="muted" style="margin:0"><b>È ammesso all\'interrogazione solo chi ha superato il quiz</b> entro la scadenza: gli altri non vengono interrogati e restano senza voto (le loro definizioni restano sui cartelloni). ' +
    'Per ogni alunno ammesso <b>scegli tu i termini</b> oppure li fai pescare dal glossario (' + RG().orale.domande + ', bilanciati sulle aree, di preferenza i meno usciti nella classe). In entrambi i casi <b>mai i termini del suo scritto</b>, e vedi quali termini sono già stati usati. ' +
    'Ogni risposta vale 1 punto se corretta, ½ se parziale, 0 se sbagliata. <b>' + regolaOrale() + '</b> (massimo ' + fv(RG().orale.max) + '); per gli esclusi dallo scritto ' + fv(RG().orale.base) + ' + ' + frz(RG().orale.passoEsclusi) + ' per punto (massimo ' + fv(RG().orale.maxEsclusi) + '). ' +
    'Il <b>voto finale</b> è la ' + mediaTxt() + ' (per gli esclusi vale solo l\'orale): oltre il mezzo voto si arrotonda all\'intero superiore, sotto a quello inferiore (7,75 → 8 · 7,5 → 7,5 · 7,4 → 7).</p>' +
    '<div class="row"><span class="chip s-approvata">' + amm + ' su ' + righe.length + ' ammessi (quiz superato)</span><span class="chip s-vuota">' + fatte + ' interrogati</span>' + (fuori ? '<span class="chip s-correggere">' + fuori + ' non ammessi: senza voto</span>' : '') + scadenzeQuiz() + '</div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th><th>Ammissione (quiz)</th><th style="text-align:right">Scritto</th><th style="text-align:right">Orale</th><th style="text-align:right">Finale</th><th>Quando</th><th></th></tr></thead><tbody>';
  righe.forEach(function (r) {
    var v = votiDi(r.id), q = quizDi(r.id), o = v.orale;
    h += '<tr data-orale="' + r.id + '"><td>' + linkScheda(r) + (eBES(q) ? ' <span class="chip s-bozza" title="Studente BES: interrogazione su ' + Math.max(1, Math.round(RG().orale.domande / 2)) + ' termini">BES</span>' : '') + (r.escluso ? ' <span class="chip s-correggere">Escluso · max ' + fv(RG().orale.maxEsclusi) + '</span>' : '') + '</td><td class="n">' + esc(etich(r)) + '</td>' +
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
    (puo ? bloccoProgramma(righe) : '') + elencoDelGiorno(righe, puo) + h + '</tbody></table></div>' + terminiUsatiOrale(righe) + '</section>';
}
/* --- calendario delle interrogazioni --- */
function oggiIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function giornoIt(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); }
function celPiano(r, q, o, puo) {
  var p = q.piano;
  if (!q.superata || o) return p && !o ? '<span class="muted" style="font-size:13px">' + esc(giornoIt(p.data)) + '</span>' : '';
  if (!puo) return p ? esc(giornoIt(p.data)) + (p.ora ? ' · ' + p.ora + 'ª ora' : '') : '<span class="muted">da programmare</span>';
  return '<div class="row" style="gap:4px;flex-wrap:nowrap">' + (p ? '<button class="btn sec tb" title="Copia il messaggio per ' + esc(r.nome) + '" onclick="copiaTesto(messaggioOrale(\'' + r.id + '\'), this)">Messaggio</button>' : '') + '<input type="date" aria-label="Giorno dell\'interrogazione di ' + esc(r.nome) + '" data-pgiorno="' + r.id + '" value="' + (p ? p.data : '') + '" onchange="salvaPiano(\'' + r.id + '\')" style="min-height:38px;max-width:150px">' +
    '<select aria-label="Ora di lezione" data-pora="' + r.id + '" onchange="salvaPiano(\'' + r.id + '\')" style="min-height:38px;max-width:86px"><option value="">ora</option>' +
    [1, 2, 3, 4, 5, 6, 7, 8].map(function (h) { return '<option value="' + h + '"' + (p && p.ora === h ? ' selected' : '') + '>' + h + 'ª</option>'; }).join('') + '</select></div>';
}
function salvaPiano(id) {
  var g = document.querySelector('[data-pgiorno="' + id + '"]'), o = document.querySelector('[data-pora="' + id + '"]');
  api('pianoorale', { alunno: id, data: g ? g.value : '', ora: o ? o.value : '' }).then(function (x) {
    var q = quizDi(id); q.piano = x.piano;
    toast(x.piano ? nomeAlunno(id) + ': ' + giornoIt(x.piano.data) + (x.piano.ora ? ', ' + x.piano.ora + 'ª ora' : '') + ' · lo vedrà nell\'app' : nomeAlunno(id) + ': da programmare');
    var y = window.scrollY; vistaDocente(); window.scrollTo(0, y); return;
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
      return '<li><b>' + esc(r.nome) + '</b> <span class="muted">' + esc(etich(r)) + (q.piano.ora ? ' · ' + q.piano.ora + 'ª ora' : '') + '</span>' + (eBES(q) ? ' <span class="chip s-bozza">BES</span>' : '') +
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
/* evidenza: termini già usati nelle interrogazioni concluse delle classi mostrate */
function terminiUsatiOrale(righe) {
  var m = {}, n = 0;
  righe.forEach(function (r) { var o = votiDi(r.id).orale; ((o && o.termini) || []).forEach(function (t) { var k = t.a + '-' + t.k; if (!m[k]) { m[k] = { a: t.a, it: t.it, chi: [] }; n++; } m[k].chi.push(r.nome); }); });
  if (!n) return '<p class="muted" id="orUsati" style="margin:0;font-size:14px">Nessun termine ancora usato nelle interrogazioni.</p>';
  var L = Object.keys(m).map(function (k) { return m[k]; }).sort(function (x, y) { return x.a - y.a || String(x.it).localeCompare(String(y.it)); });
  return '<details id="orUsati" class="card" style="padding:14px 18px"><summary style="font-weight:800;cursor:pointer">Termini già usati nelle interrogazioni (' + n + ')</summary>' +
    '<div style="overflow-x:auto;margin-top:10px"><table class="tbl"><thead><tr><th>Area</th><th>Termine</th><th style="text-align:right">Volte</th><th>Interrogati</th></tr></thead><tbody>' +
    L.map(function (x) { var a = area(x.a) || {}; return '<tr><td><i class="dot" style="background:' + esc(a.colore || '#15212B') + '"></i>' + esc(a.it || x.a) + '</td><td><b>' + esc(x.it || '') + '</b></td><td class="n">' + x.chi.length + '</td><td>' + esc(x.chi.join(', ')) + '</td></tr>'; }).join('') +
    '</tbody></table></div></details>';
}
/* due modi: pescare dal glossario o scegliere i termini (riprende quella in corso, se c'è) */
function apriOrale(id, btn) {
  if (votiDi(id).oraleInCorso) return pescaOrale(id, btn);
  finestra('Interrogazione di ' + nomeAlunno(id), '<p style="margin:0">Come vuoi scegliere i termini? In entrambi i casi non escono i termini del suo scritto, e vedi quali sono già stati usati.</p>', [
    { t: 'Scegli tu i termini', s: 'dall\'elenco del glossario, area per area', f: function () { apriSceltaOrale(id, null); } },
    { t: 'Pesca dal glossario', s: RG().orale.domande + ' termini bilanciati sulle aree, di preferenza i meno usciti nella classe; poi puoi cambiarli', f: function () { pescaOrale(id, null); } }]);
}
function pescaOrale(id, btn) {
  if (btn) btn.disabled = true;
  api('oralepesca', { alunno: id }).then(function (d) {
    S.or = riprendiOrale({ alunno: id, bozza: d.bozza, esiti: d.bozza.termini.map(function () { return null; }), nota: '' });
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
  memoOrale();
  var h = spiaOrale() + '<section class="card stack" id="oraleScheda"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">' + (o.prova ? 'Simulazione dell\'interrogazione' + (o.bes ? ' · ' + o.esiti.length + ' termini' : '') : 'Interrogazione di ' + esc(r.nome || nomeAlunno(o.alunno))) + ' <span class="muted" style="font-weight:400;font-size:16px">' + (o.prova ? '' : esc(etich(r))) + '</span></h2>' +
    '<div class="row" style="gap:6px"><button class="btn sec tb" id="orPieno" onclick="schermoPieno(' + (S.orPieno ? 'false' : 'true') + ')">' + (S.orPieno ? 'Esci dallo schermo pieno' : 'Schermo pieno') + '</button><button class="btn sec tb" onclick="S.or=null;if(S.orPieno)schermoPieno(false);vistaDocente()">Torna all\'elenco</button></div></div>' +
    (o.prova ? '<div class="note" id="orInfo">Simulazione: termini pescati a caso tra tutti quelli del glossario. Segna le risposte e cambia i termini come in un\'interrogazione vera: <b>niente viene salvato</b> e nessuno studente è coinvolto.</div>' : '' +
    '<div class="or-info" id="orInfo"><div><span class="kl">Voto dello scritto</span><b>' + (r.escluso ? 'Escluso' : fv(vs.voto)) + '</b><small>' + (r.escluso ? 'non entra nel finale' : (vs.errIt || 0) + (vs.errIt === 1 ? ' errore' : ' errori') + (vs.manuale != null ? ' · voto manuale' : '')) + '</small></div>' +
    '<div><span class="kl">Tempo nel quiz</span><b>' + (q.sessioni ? tempoMs(q.ms) : '—') + '</b><small>' + (q.sessioni ? q.sessioni + (q.sessioni === 1 ? ' sessione' : ' sessioni') + (q.superata ? ' · ' + tempoMs(q.msFine) + ' per superarlo' : '') : 'nessuna sessione') + '</small></div>' +
    '<div><span class="kl">Risposte nel quiz</span><b>' + q.corrette + ' / ' + q.risposte + '</b><small>' + (q.risposte ? Math.round(q.corrette / q.risposte * 100) + '% corrette · ' + (q.errori || 0) + ' errori' : 'nessuna risposta') + '</small></div>' +
    (function () { var x = ((S.d.admin || {}).attivita || {})[o.alunno] || {}; return '<div><span class="kl">Ripasso sulla pagina pubblica</span><b>' + (x.minutiPubblica ? durata(x.minutiPubblica) : '—') + '</b><small>' + (x.minutiPubblica ? (x.sessioniPubblica || 0) + (x.sessioniPubblica === 1 ? ' sessione' : ' sessioni') + (x.ripassoPrep != null ? ' · ' + durata(x.ripassoPrep) + ' da quando è programmata' : '') + (x.ultimoPubblica ? ' · ultimo ' + esc(dataBreve(x.ultimoPubblica)) : '') : 'nessun ripasso registrato') + '</small></div>' +
      '<div><span class="kl">Tempo totale in app</span><b>' + (x.minuti ? durata(x.minuti) : '—') + '</b><small>' + (x.minutiAlGiorno != null && x.minuti ? durata(x.minutiAlGiorno) + ' al giorno su ' + x.giorniAttivita + ' giorni · ' : '') + (x.giorni ? x.giorni + (x.giorni === 1 ? ' giorno attivo' : ' giorni attivi') : 'nessun accesso') + '</small></div>'; })() +
    '<div><span class="kl">Termini indovinati</span><b>' + q.indovinati + ' / ' + q.soglia + '</b><small>' + (q.superata ? 'quiz superato il ' + esc(dataBreve(q.superata)) : 'quiz non superato') + '</small></div></div>' +
    (r.escluso ? '<div class="note warn"><b>Alunno escluso dallo scritto:</b> all\'orale può arrivare al massimo a ' + fv(RG().orale.maxEsclusi) + ' (' + fv(RG().orale.base) + ' + ' + frz(RG().orale.passoEsclusi) + ' per punto).</div>' : '')) +
    '</section><div class="or-punti" id="orPunti" aria-live="polite"><div><span class="kl">Risposte segnate</span><b>' + fatti + ' / ' + o.esiti.length + '</b></div><div><span class="kl">Punti</span><b>' + fv(punti) + ' / ' + o.esiti.length + '</b>' + (o.esiti.length !== RG().orale.domande ? '<small>' + (o.bozza.scelti ? o.esiti.length + ' termini scelti da te' : 'studente BES: ' + o.esiti.length + ' termini') + ', ogni punto vale ' + (RG().orale.domande / o.esiti.length === 2 ? 'doppio' : 'come ' + fv(Math.round(RG().orale.domande / o.esiti.length * 100) / 100) + ' punti') + '</small>' : '') + '</div>' +
    '<div><span class="kl">Voto orale</span><b>' + (tutti ? fv(votoOraleDa(punti, r.escluso, o.esiti.length)) : '—') + '</b></div></div>';
  o.bozza.termini.forEach(function (t, i) {
    var a = area(t.area) || {}, e = o.esiti[i];
    h += '<section class="card or-voce" data-pos="' + i + '" style="border-left:8px solid ' + esc(a.colore || '#15212B') + '"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="muted" style="font-size:13px">' + (i + 1) + ' di ' + o.bozza.termini.length + ' · ' + esc(a.it || '') + '</div>' +
      '<div class="or-term">' + esc(t.it) + '</div>' + (o.prova ? '' : '<div class="or-usato">' + ((t.usati || []).length ? 'Già usato con ' + esc(t.usati.join(', ')) : 'Mai usato in questa classe') + '</div>') + '</div>' +
      '<div class="row" style="gap:6px"><button class="btn sec tb" onclick="cambiaOrale(' + i + ',this)">Pesca un altro</button>' + (o.prova ? '' : '<button class="btn sec tb" onclick="apriSceltaOrale(S.or.alunno,' + i + ')">Scegli tu</button>') + '</div></div>' +
      '<p class="or-def"><span class="muted" style="font-size:13px;display:block">Definizione corretta (la vedi solo tu)</span>' + esc(t.def) + '</p>' +
      '<div class="row or-esiti" role="group" aria-label="Esito della risposta ' + (i + 1) + '">' + [[1, 'Corretta', 'ok'], [0.5, 'Parziale', 'mz'], [0, 'Sbagliata', 'no']].map(function (x) {
        return '<button class="or-b ' + x[2] + (e === x[0] ? ' on' : '') + '" aria-pressed="' + (e === x[0]) + '" onclick="esitoOrale(' + i + ',' + x[0] + ')">' + x[1] + ' <small>' + fv(x[0]) + '</small></button>'; }).join('') + '</div></section>';
  });
  var calc = tutti ? votoOraleDa(punti, r.escluso, o.esiti.length) : null, mano = o.mano != null; // scelto «lo assegno io» (anche col campo ancora vuoto)
  h += '<section class="card stack" id="orVoto"><h3 style="margin:0;font-size:19px">Voto dell\'interrogazione</h3>' +
    '<div class="row" role="radiogroup" aria-label="Voto orale">' +
      '<label class="row" style="gap:8px;font-weight:700"><input type="radio" name="orTipo" id="orCalc" ' + (!mano ? 'checked' : '') + ' onchange="S.or.mano=null;vistaOralePos()" style="width:20px;height:20px"> Calcolato dalle risposte' + (tutti ? ': <span class="disp">' + fv(calc) + '</span>' : '') + '</label>' +
      '<label class="row" style="gap:8px;font-weight:700"><input type="radio" name="orTipo" id="orMano" ' + (mano ? 'checked' : '') + ' onchange="S.or.mano=S.or.mano||\'\';vistaOralePos();var e=$(\'orManoV\');if(e)e.focus()" style="width:20px;height:20px"> Lo assegno io</label>' +
      (o.mano != null ? '<input id="orManoV" type="text" inputmode="decimal" placeholder="es. 6,5" value="' + esc(o.mano) + '" oninput="S.or.mano=this.value;aggiornaSalvaOrale();memoOrale()" style="max-width:120px" aria-label="Voto orale assegnato dal docente">' : '') +
    '</div>' + (o.mano != null ? '<p class="muted" style="margin:0;font-size:14px">Da 1 a 10, a quarti di voto. Il voto calcolato' + (tutti ? ' (' + fv(calc) + ')' : '') + ' resta salvato accanto, per confronto.</p>' : '') + '</section>';
  h += '<section class="card stack"><label for="orNota">Nota (facoltativa, resta nel registro dell\'interrogazione)</label><input id="orNota" type="text" maxlength="300" value="' + esc(o.nota || '') + '" oninput="S.or.nota=this.value;memoOrale()">' +
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
  memoOrale();
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
  var dati = { alunno: S.or.alunno, esiti: S.or.esiti.slice(), nota: S.or.nota, votoDocente: mano };
  api('oralesalva', dati).then(function (d) {
    togliMemoOrale(dati.alunno); S.or = null; return ricarica('Interrogazione salvata: voto orale ' + fv(d.orale.voto) + (d.orale.manuale ? ' (assegnato da te; calcolato ' + fv(d.orale.votoCalcolato) + ')' : ''));
  }).catch(function (e) {
    if (!e.rete) { toast(errMsg(e), true); btn.disabled = false; return; }
    // niente internet: l'interrogazione resta sul dispositivo e parte da sola appena torna la rete
    mettiInCoda(dati); togliMemoOrale(dati.alunno); var nome = nomeAlunno(dati.alunno); S.or = null; if (S.orPieno) schermoPieno(false); vistaDocente();
    finestra('Salvata sul dispositivo', '<p style="margin:0">Manca la connessione: l\'interrogazione di <b>' + esc(nome) + '</b> è salvata su questo dispositivo e verrà inviata <b>da sola appena torna internet</b>.</p><p class="muted" style="margin:0">Non chiudere il browser cancellandone i dati. Puoi continuare a lavorare: lo stato dell\'invio lo vedi in cima alla pagina.</p>', [], 'ok');
  });
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
  return '<div class="row" id="accessiQuiz">' + CLASSI().map(function (c) { return '<button class="btn" onclick="stampaSchede(\'' + c + '\')">Fogli accessi · ' + c + '</button>'; }).join('') +
    (CLASSI().length > 1 ? '<button class="btn sec" onclick="stampaSchede(\'tutte\')">Fogli accessi di tutte le classi</button>' : '') + '</div>' +
    '<p class="muted" style="margin:0;font-size:14px">Un unico PDF: per ogni alunno una pagina A4 con le date di scritto e quiz, QR, indirizzo e codice dello scritto e QR e indirizzo del quiz (stesso codice). Si apre la stampa: scegli «Salva come PDF».</p>';
}
function stampaAccessiQuiz(classe) { stampaSchede(classe); }

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

/* regole personali del quiz (per chiunque: PDP, DSA, BES o altro). Un'unica scheda: ogni salvataggio sostituisce tutte le regole precedenti.
   «Studente BES» è un'etichetta a parte (all'interrogazione: metà dei termini). */
function eBES(q) { return !!q.bes && q.bes.etichetta !== false; }
function haRegole(q) { return q.sogliaPersonale != null || q.passoPersonale != null || !!q.bes; }
function regolePersonaliChip(q) {
  if (!haRegole(q)) return '';
  var B = q.bes || {}, R = RG().quiz, v = [];
  if (q.sogliaPersonale != null) v.push(q.soglia + ' termini');
  if (q.passoPersonale != null) v.push('−' + q.passo + ' per errore');
  if (B.secondi === 0) v.push('senza tempo'); else if (B.secondi) v.push(B.secondi + ' s');
  if (B.dimezza) v.push('dimezza opzioni');
  return '<div class="regpers" title="Regole personali del quiz">' + (eBES(q) ? '<b class="rpbes">BES</b>' : '') + (v.length ? v.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') : '<span>regole della classe</span>') + '</div>';
}
function regolePersonaliQuiz(id) {
  var q = quizDi(id), imp = (S.d.admin && S.d.admin.impostazioni && S.d.admin.impostazioni.quiz) || {}, sc = imp.soglia || S.d.termini.length, pc = RG().quiz.passo, sCl = RG().quiz.secondi;
  var B = q.bes || null;
  S.qp = { soglia: q.sogliaPersonale != null ? String(q.sogliaPersonale) : '', passo: q.passoPersonale != null ? String(q.passoPersonale) : '',
    tempo: B && B.secondi === 0 ? 'no' : B && B.secondi ? 'mio' : 'classe', secondi: B && B.secondi ? String(B.secondi) : '', dimezza: !!(B && B.dimezza), bes: eBES(q) };
  var salva = function (classe) {
    var P = classe ? { soglia: '', passo: '', secondi: '', dimezza: false, bes: false } :
      { soglia: String(S.qp.soglia).trim(), passo: String(S.qp.passo).trim(), secondi: S.qp.tempo === 'no' ? 0 : S.qp.tempo === 'classe' ? '' : String(S.qp.secondi).trim(), dimezza: S.qp.dimezza, bes: S.qp.bes };
    if (!classe && S.qp.tempo === 'mio' && !P.secondi) { toast('Scrivi i secondi personali, oppure scegli «Come la classe».', true); return; }
    api('quizpersonale', Object.assign({ alunno: id }, P)).then(function (x) {
      return ricarica(classe ? 'Regole della classe per ' + nomeAlunno(id) : 'Regole personali salvate per ' + nomeAlunno(id) + (x.etichetta ? ' (BES)' : '') + (x.superata ? ': ha già indovinato abbastanza termini, è ammesso all\'orale' : ''));
    }).catch(function (e) { toast(errMsg(e), true); });
  };
  var scelte = [{ t: 'Salva le regole', f: function () { salva(false); } }];
  if (haRegole(q)) scelte.push({ t: 'Togli tutto: regole della classe', warn: true, f: function () { salva(true); } });
  finestra('Regole personali del quiz · ' + nomeAlunno(id),
    '<p style="margin:0">Valgono per qualunque studente (PDP, DSA, BES o altro). Lascia vuoto un campo per usare la regola della classe. <b>Il salvataggio sostituisce tutte le regole precedenti.</b> ' +
    esc(nomeAlunno(id)) + ' ha indovinato finora <b>' + q.indovinati + '</b> termini.</p>' +
    '<div class="grid2"><div><label for="qpSoglia">Termini da indovinare</label><input id="qpSoglia" type="text" inputmode="numeric" placeholder="classe: ' + sc + '" value="' + esc(S.qp.soglia) + '" oninput="S.qp.soglia=this.value"></div>' +
    '<div><label for="qpPasso">Termini persi a ogni errore</label><input id="qpPasso" type="text" inputmode="numeric" placeholder="classe: ' + pc + '" value="' + esc(S.qp.passo) + '" oninput="S.qp.passo=this.value"></div></div>' +
    '<div class="grid2"><div><label for="qpTempo">Tempo per rispondere</label><select id="qpTempo" onchange="S.qp.tempo=this.value;$(\'qpSecBox\').hidden=this.value!==\'mio\'">' +
      [['classe', 'Come la classe (' + sCl + ' secondi)'], ['mio', 'Secondi personali'], ['no', 'Senza limite di tempo']].map(function (o) { return '<option value="' + o[0] + '"' + (S.qp.tempo === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div id="qpSecBox"' + (S.qp.tempo === 'mio' ? '' : ' hidden') + '><label for="qpSec">Secondi (10-600)</label><input id="qpSec" type="text" inputmode="numeric" value="' + esc(S.qp.secondi) + '" oninput="S.qp.secondi=this.value"></div></div>' +
    '<label class="row" style="gap:10px"><input type="checkbox" id="qpDim" ' + (S.qp.dimezza ? 'checked' : '') + ' onchange="S.qp.dimezza=this.checked;S.qp.dimTocco=1" style="width:22px;height:22px"> Pulsante «Dimezza opzioni» nel quiz (da ' + RG().quiz.opzioni + ' a 2 definizioni)</label>' +
    '<p class="muted" style="margin:0;font-size:14px">Se con la nuova soglia ha già indovinato abbastanza termini, risulta subito ammesso all\'interrogazione. Con una soglia più bassa di quella della classe, all\'interrogazione si pesca solo tra i termini del suo quiz.</p>' +
    '<fieldset class="stack" style="gap:8px;border:2px solid var(--line);border-radius:12px;padding:10px 14px;margin:0"><legend style="font-weight:700;padding:0 6px">Studente BES</legend>' +
      '<label class="row" style="gap:10px;font-weight:700"><input type="checkbox" id="qpBes" ' + (S.qp.bes ? 'checked' : '') + ' onchange="S.qp.bes=this.checked;if(this.checked&&!S.qp.dimTocco){S.qp.dimezza=true;$(\'qpDim\').checked=true;}" style="width:22px;height:22px"> Segna come studente BES</label>' +
      '<p class="muted" style="margin:0;font-size:14px">Solo un\'etichetta per te e per il report: all\'interrogazione lo studente BES risponde su <b>' + Math.max(1, Math.round(RG().orale.domande / 2)) + ' termini</b> invece di ' + RG().orale.domande + ' (ogni punto vale doppio, il voto massimo resta lo stesso). Lo studente non vede nessuna etichetta.</p>' +
    '</fieldset>', scelte);
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

/* ---------- scelta dei termini dell'interrogazione ----------
 * tutti i termini del glossario, area per area: quelli del suo scritto non si possono scegliere;
 * accanto a ogni termine, chi l'ha già avuto all'interrogazione. pos = null: tutti i termini; pos = n: solo quello */
function apriSceltaOrale(id, pos) {
  api('oralecatalogo', { alunno: id }).then(function (d) {
    var sel = pos != null && S.or && S.or.bozza ? [] : [];
    S.orSc = { alunno: id, dati: d, pos: pos, sel: sel, nasc: false };
    vistaDocente(); window.scrollTo(0, 0);
  }).catch(function (e) { toast(errMsg(e), true); });
}
function schedaScelta() {
  var c = S.orSc, d = c.dati, uno = c.pos != null, nome = nomeAlunno(c.alunno);
  var inUso = {}; if (uno && S.or && S.or.bozza) S.or.bozza.termini.forEach(function (t, i) { if (i !== c.pos) inUso[t.area + '-' + t.k] = 1; });
  var h = '<section class="card stack" id="orScelta"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2 style="margin:0;font-size:22px">' +
    (uno ? 'Scegli il termine ' + (c.pos + 1) + ' per ' + esc(nome) : 'Scegli i termini per ' + esc(nome)) + '</h2>' +
    '<p class="muted" style="margin:4px 0 0;font-size:15px">' + (d.bacino != null ? 'Il suo quiz aveva meno termini del glossario: si possono scegliere <b>solo i ' + d.bacino + ' termini del suo quiz</b>. ' : '') + 'I termini del suo scritto non si possono scegliere. Accanto a ogni termine vedi chi l\'ha già avuto all\'interrogazione.' + (uno ? '' : ' Consigliati: <b>' + d.domande + '</b>.') + '</p></div>' +
    '<button class="btn sec tb" onclick="S.orSc=null;vistaDocente()">Annulla</button></div>' +
    '<div class="row" style="gap:10px"><input id="orScQ" type="search" placeholder="Cerca un termine" oninput="filtraScelta()" style="flex:1;min-width:200px">' +
    '<label class="row" style="gap:6px;font-weight:700"><input type="checkbox" id="orScN" onchange="S.orSc.nasc=this.checked;filtraScelta()" style="width:20px;height:20px"> Nascondi i già usati</label></div>' +
    (uno ? '' : '<div class="row" style="justify-content:space-between;position:sticky;top:0;background:var(--card,#fff);padding:8px 0;z-index:2"><b id="orScN2">Scelti: 0 / ' + d.domande + '</b><button class="btn ok" id="orScVia" disabled onclick="iniziaScelta(this)">Inizia l\'interrogazione</button></div>') + '</section>';
  d.aree.forEach(function (g) {
    var a = area(g.area) || {};
    h += '<section class="card stack or-sc-area" style="border-left:8px solid ' + esc(a.colore || '#15212B') + '"><h3 style="margin:0;font-size:18px">' + esc(a.it || ('Area ' + g.area)) + '</h3><div class="or-sc-lista">' +
      g.termini.map(function (t) {
        var k = g.area + '-' + t.k, blocc = t.suo || t.fuori || inUso[k], us = (t.usati || []).length;
        return '<label class="or-sc' + (blocc ? ' no' : '') + '" data-k="' + k + '" data-it="' + esc(String(t.it).toLowerCase()) + '" data-us="' + (us ? 1 : 0) + '">' +
          '<input type="' + (uno ? 'radio' : 'checkbox') + '" name="orSc" value="' + k + '"' + (blocc ? ' disabled' : '') + ' onchange="sceltaCambia(this)">' +
          '<span><b>' + esc(t.it) + '</b>' + (t.suo ? '<small class="or-sc-suo">termine del suo scritto</small>' : t.fuori ? '<small class="or-sc-suo">non era nel suo quiz</small>' : inUso[k] ? '<small>già in questa interrogazione</small>' : us ? '<small class="or-sc-us">già usato con ' + esc(t.usati.join(', ')) + '</small>' : '<small>mai usato</small>') + '</span></label>';
      }).join('') + '</div></section>';
  });
  if (uno) h += '<section class="card row"><button class="btn ok" id="orScVia" disabled onclick="usaScelta(this)">Usa questo termine</button><button class="btn sec" onclick="S.orSc=null;vistaDocente()">Annulla</button></section>';
  return h;
}
function filtraScelta() {
  var q = ($('orScQ').value || '').trim().toLowerCase(), nasc = S.orSc.nasc;
  document.querySelectorAll('.or-sc').forEach(function (el) {
    var vede = (!q || el.getAttribute('data-it').indexOf(q) >= 0) && !(nasc && el.getAttribute('data-us') === '1' && !el.querySelector('input').checked);
    el.hidden = !vede;
  });
}
function sceltaCambia(inp) {
  var c = S.orSc, p = inp.value.split('-'), t = { a: Number(p[0]), k: Number(p[1]) };
  if (c.pos != null) c.sel = [t];
  else if (inp.checked) c.sel.push(t);
  else c.sel = c.sel.filter(function (x) { return !(x.a === t.a && x.k === t.k); });
  var b = $('orScVia'); if (b) b.disabled = !c.sel.length;
  var n = $('orScN2'); if (n) n.textContent = 'Scelti: ' + c.sel.length + ' / ' + c.dati.domande;
}
function iniziaScelta(btn) {
  btn.disabled = true;
  var id = S.orSc.alunno;
  api('oraleimposta', { alunno: id, termini: S.orSc.sel }).then(function (d) {
    S.orSc = null; S.or = { alunno: id, bozza: d.bozza, esiti: d.bozza.termini.map(function () { return null; }), nota: '' };
    vistaDocente(); window.scrollTo(0, 0);
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}
function usaScelta(btn) {
  btn.disabled = true;
  var pos = S.orSc.pos;
  api('oralesceglieuno', { alunno: S.orSc.alunno, pos: pos, termine: S.orSc.sel[0] }).then(function (d) {
    S.orSc = null; S.or.bozza = d.bozza; S.or.esiti[pos] = null; vistaDocente(); toast('Termine cambiato');
    setTimeout(function () { var el = document.querySelector('.or-voce[data-pos="' + pos + '"]'); if (el) el.scrollIntoView({ block: 'center' }); }, 50);
  }).catch(function (e) { btn.disabled = false; toast(errMsg(e), true); });
}

/* ---------- programmazione delle interrogazioni ----------
 * ammessi (quiz superato) non ancora interrogati e senza data: si spuntano, si sceglie giorno e ora, e la data
 * compare nell'app dello studente con l'invito a prepararsi sulla pagina pubblica. Messaggi pronti da copiare. */
function messaggioOrale(id) {
  var p = quizDi(id).piano; if (!p) return '';
  var nome = String(nomeAlunno(id)).split(' ').slice(-1)[0];
  return 'Ciao ' + nome + ', hai superato il quiz del glossario: la tua interrogazione è fissata per ' + giornoOrale(p) + '.\n' +
    'Preparati ripassando termini e definizioni sulla pagina pubblica: ' + urlPubblico('msg') + '\n' +
    'Trovi la data anche nell\'app del glossario.';
}
function bloccoProgramma(righe) {
  var da = righe.filter(function (r) { var q = quizDi(r.id); return q.superata && !votiDi(r.id).orale && !q.piano; });
  var fiss = righe.filter(function (r) { var q = quizDi(r.id); return q.superata && !votiDi(r.id).orale && q.piano; });
  var h = '<section class="card stack" id="orProg"><h3 style="margin:0;font-size:19px">Programma le interrogazioni</h3>' +
    '<p class="muted" style="margin:0;font-size:14px">Chi ha superato il quiz ha diritto all\'interrogazione. Fissa la data: lo studente la vede nella sua app, con l\'invito a prepararsi sulla pagina pubblica del glossario. Puoi anche copiare il messaggio e mandarlo tu.</p>';
  if (da.length) h += '<div class="stack" style="gap:6px"><b style="font-size:15px">Da programmare (' + da.length + ')</b><div class="row" style="gap:6px 14px">' +
    da.map(function (r) { return '<label class="row" style="gap:6px;font-weight:600"><input type="checkbox" class="orPrSel" value="' + r.id + '" style="width:20px;height:20px"> ' + esc(r.nome) + ' <span class="muted" style="font-weight:400">' + esc(etich(r)) + '</span></label>'; }).join('') + '</div>' +
    '<div class="row" style="gap:8px;align-items:center"><input type="date" id="orPrData" aria-label="Giorno dell\'interrogazione" value="' + oggiIso() + '" style="min-height:42px;width:auto">' +
    '<select id="orPrOra" aria-label="Ora di lezione" style="min-height:42px;width:auto;max-width:200px"><option value="">ora (facoltativa)</option>' + [1, 2, 3, 4, 5, 6, 7, 8].map(function (x) { return '<option value="' + x + '">' + x + 'ª ora</option>'; }).join('') + '</select>' +
    '<button class="btn" id="orPrVai" onclick="fissaInterrogazioni(this)">Fissa la data per i selezionati</button></div></div>';
  else h += '<p style="margin:0;font-size:15px">' + (fiss.length ? 'Tutti gli ammessi hanno una data.' : 'Nessuno studente da programmare: compariranno qui quando superano il quiz.') + '</p>';
  if (fiss.length) h += '<div class="stack" style="gap:6px"><div class="row" style="justify-content:space-between;align-items:center"><b style="font-size:15px">Già programmati (' + fiss.length + ')</b>' +
    '<button class="btn sec tb" id="orPrCopia" onclick="copiaTesto(messaggiProgrammati(), this)">Copia tutti i messaggi</button></div>' +
    '<ul style="margin:0;padding-left:20px">' + fiss.sort(function (a, b) { var p = quizDi(a.id).piano, q = quizDi(b.id).piano; return (p.data + (p.ora || 9)).localeCompare(q.data + (q.ora || 9)); }).map(function (r) {
      return '<li><b>' + esc(r.nome) + '</b> · ' + esc(giornoOrale(quizDi(r.id).piano)) + ' <button class="btn sec tb" onclick="copiaTesto(messaggioOrale(\'' + r.id + '\'), this)">Messaggio</button></li>'; }).join('') + '</ul></div>';
  return h + '</section>';
}
function messaggiProgrammati() {
  return (S.d.panoramica || []).filter(function (r) { var q = quizDi(r.id); return inClasse(r.id) && q.superata && !votiDi(r.id).orale && q.piano; })
    .map(function (r) { return nomeAlunno(r.id) + ' — ' + messaggioOrale(r.id); }).join('\n\n');
}
function fissaInterrogazioni(btn) {
  var ids = [].slice.call(document.querySelectorAll('.orPrSel:checked')).map(function (x) { return x.value; });
  var data = $('orPrData').value, ora = $('orPrOra').value;
  if (!ids.length) { toast('Spunta almeno uno studente', true); return; }
  if (!data) { toast('Scegli il giorno', true); return; }
  btn.disabled = true;
  var fatti = 0;
  (function prossimo() {
    if (fatti >= ids.length) { toast(ids.length + (ids.length === 1 ? ' interrogazione fissata' : ' interrogazioni fissate') + ' per ' + giornoOrale({ data: data, ora: ora ? Number(ora) : null }) + ': gli studenti la vedono nell\'app'); var y = window.scrollY; vistaDocente(); window.scrollTo(0, y); return; }
    var id = ids[fatti];
    api('pianoorale', { alunno: id, data: data, ora: ora }).then(function (x) { quizDi(id).piano = x.piano; fatti++; prossimo(); })
      .catch(function (e) { btn.disabled = false; toast(errMsg(e), true); var y = window.scrollY; vistaDocente(); window.scrollTo(0, y); });
  })();
}

/* ---------- interrogazione a prova di connessione ----------
 * mentre interroghi, gli esiti restano anche sul dispositivo (un ricaricamento o una caduta della rete non li perde);
 * se al salvataggio manca internet, l'interrogazione va in coda e parte da sola appena la rete torna. */
var KEY_ORMEMO = 'glossario_orale_memo', KEY_ORCODA = 'glossario_orale_coda';
function leggiLS(k, def) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
function scriviLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function chiaveMemo(id) { return (S.att || 'main') + ':' + id; }
function memoOrale() {
  if (!S.or || S.or.prova) return;
  var m = leggiLS(KEY_ORMEMO, {});
  m[chiaveMemo(S.or.alunno)] = { data: S.or.bozza.data, termini: S.or.bozza.termini.map(function (t) { return t.area + '-' + t.k; }).join(','), esiti: S.or.esiti, nota: S.or.nota || '', mano: S.or.mano == null ? null : S.or.mano, ts: Date.now() };
  S.or.salvatoQui = scriviLS(KEY_ORMEMO, m);
}
function togliMemoOrale(id) { var m = leggiLS(KEY_ORMEMO, {}); delete m[chiaveMemo(id)]; scriviLS(KEY_ORMEMO, m); }
/* stessa interrogazione (stessa data e stessi termini): tornano gli esiti segnati */
function riprendiOrale(o) {
  var x = leggiLS(KEY_ORMEMO, {})[chiaveMemo(o.alunno)];
  if (x && x.data === o.bozza.data && x.termini === o.bozza.termini.map(function (t) { return t.area + '-' + t.k; }).join(',') && x.esiti.length === o.esiti.length) {
    o.esiti = x.esiti; o.nota = x.nota || ''; if (x.mano != null) o.mano = x.mano;
    if (x.esiti.some(function (e) { return e !== null; })) setTimeout(function () { toast('Ripresi gli esiti segnati su questo dispositivo'); }, 300);
  }
  return o;
}
function codaOrale() { return leggiLS(KEY_ORCODA, []); }
function mettiInCoda(dati) {
  var c = codaOrale().filter(function (x) { return !(x.att === (S.att || 'main') && x.alunno === dati.alunno); });
  c.push(Object.assign({ att: S.att || 'main', codice: S.codice, nome: nomeAlunno(dati.alunno), ts: Date.now() }, dati));
  scriviLS(KEY_ORCODA, c); avviaInvioCoda();
}
var invioInCorso = false;
function inviaCoda(manuale) {
  // le rifiutate dal server restano in elenco col motivo e non si ritentano da sole (solo con «Invia ora»)
  var c = codaOrale().filter(function (y) { return manuale || !y.errore; }); if (!c.length || invioInCorso) return Promise.resolve();
  invioInCorso = true;
  var x = c[0], corpo = Object.assign({ azione: 'oralesalva', codice: x.codice }, x.att && x.att !== 'main' ? { att: x.att } : {}, { alunno: x.alunno, esiti: x.esiti, nota: x.nota, votoDocente: x.votoDocente });
  return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      var resto = codaOrale().filter(function (y) { return !(y.att === x.att && y.alunno === x.alunno && y.ts === x.ts); });
      if (j.ok) { scriviLS(KEY_ORCODA, resto); toast('Interrogazione di ' + x.nome + (j.dati.giaSalvata ? ' già salvata' : ' inviata') + ': voto orale ' + fv(j.dati.orale.voto)); invioInCorso = false; if (S.d && S.d.utente && S.d.utente.ruolo === 'docente' && !S.or && !S.orSc) ricarica(); else aggiornaSpie(); return inviaCoda(manuale); }
      // il server l'ha rifiutata (per esempio interrogazione già chiusa): resta in elenco con il motivo
      // segna il motivo solo se nel frattempo non è stata tolta dall'elenco
      var ora = codaOrale(); ora.forEach(function (y) { if (y.att === x.att && y.alunno === x.alunno && y.ts === x.ts) y.errore = j.errore || 'rifiutata dal server'; }); scriviLS(KEY_ORCODA, ora); invioInCorso = false; aggiornaSpie();
    })
    .catch(function () { invioInCorso = false; aggiornaSpie(); if (manuale) toast('Ancora nessuna connessione: riprovo da solo appena torna.', true); });
}
var timerCoda = null;
function avviaInvioCoda() {
  aggiornaSpie();
  if (!timerCoda) timerCoda = setInterval(function () { if (!codaOrale().some(function (x) { return !x.errore; })) { clearInterval(timerCoda); timerCoda = null; return; } inviaCoda(); }, 20000);
  inviaCoda();
}
function scartaDaCoda(ts) { scriviLS(KEY_ORCODA, codaOrale().filter(function (x) { return String(x.ts) !== String(ts); })); aggiornaSpie(); }
/* in cima alla pagina: interrogazioni in attesa di invio */
function bannerCoda() {
  var c = codaOrale(); if (!c.length) return '';
  return '<div class="note warn" id="codaOrale"><b>' + (c.length === 1 ? '1 interrogazione salvata sul dispositivo' : c.length + ' interrogazioni salvate sul dispositivo') + '</b>, in attesa di invio' + (navigator.onLine === false ? ' (nessuna connessione)' : '') + ':' +
    '<ul style="margin:6px 0">' + c.map(function (x, i) { return '<li>' + esc(x.nome) + (x.errore ? ' — <b>non inviata:</b> ' + esc(x.errore) + ' <button class="btn sec tb" onclick="scartaDaCoda(\'' + x.ts + '\')">Togli</button>' : ''); }).join('') + '</ul>' +
    '<button class="btn tb" onclick="inviaCoda(true)">Invia ora</button> <span class="muted" style="font-size:14px">Partono da sole appena torna internet.</span></div>';
}
/* nella scheda: dove sono gli esiti segnati */
function spiaOrale() {
  if (!S.or || S.or.prova) return '';
  var off = navigator.onLine === false;
  return '<div class="row" id="spiaOrale" style="gap:8px;font-size:14px;font-weight:700;color:' + (off ? '#9A5B00' : '#2E7D32') + '"><span style="width:10px;height:10px;border-radius:50%;background:currentColor;display:inline-block"></span>' +
    (off ? 'Connessione assente: continua pure a segnare, gli esiti restano su questo dispositivo e al salvataggio partono appena torna internet.' : S.or.salvatoQui === false ? 'Attenzione: questo browser non permette di salvare sul dispositivo.' : 'Esiti salvati anche su questo dispositivo') + '</div>';
}
function aggiornaSpie() {
  var b = document.getElementById('codaOrale'), h = bannerCoda();
  if (b) { if (h) b.outerHTML = h; else b.remove(); }
  else if (h) { var m = document.querySelector('main.dcont'); if (m) m.insertAdjacentHTML('afterbegin', h); }
  var s = document.getElementById('spiaOrale'); if (s) s.outerHTML = spiaOrale();
}
window.addEventListener('online', function () { aggiornaSpie(); inviaCoda(); });
window.addEventListener('offline', aggiornaSpie);
