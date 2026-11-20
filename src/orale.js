/* ---------- area docenti: quiz (seconda parte della prova), ammissione e interrogazione orale ---------- */
function tempoMs(ms) { var s = Math.round((ms || 0) / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + ' h ' : '') + m + ' min ' + ('0' + (s % 60)).slice(-2) + ' s'; }
function quizDi(id) { return (S.d.quiz || []).filter(function (q) { return q.id === id; })[0] || { indovinati: 0, soglia: 260, sessioni: 0, risposte: 0, corrette: 0, errori: 0, persi: 0, massimo: 0, ms: 0, stato: 'chiuso', ultime: [] }; }
function votiDi(id) { return ((S.d.admin && S.d.admin.voti) || []).filter(function (v) { return v.id === id; })[0] || {}; }
function dataBreve(iso) { var d = new Date(iso); return d.getDate() + ' ' + MESI[d.getMonth()] + ', ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function votoOraleDa(punti, escluso) { var o = RG().orale; return Math.round((o.base + (escluso ? o.passoEsclusi : o.passo) * punti) * 1000) / 1000; }

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
    '<div class="row"><span class="chip s-approvata">' + sup + ' su ' + righe.length + ' hanno superato il quiz</span><span class="chip s-vuota">' + att + ' hanno fatto almeno una sessione</span>' + (fuori ? '<span class="chip s-correggere">' + fuori + ' non ammessi (scadenza passata)</span>' : '') + '</div>' +
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th><th style="text-align:right">Sessioni</th><th style="text-align:right">Tempo</th><th style="text-align:right" title="Tempo passato sul quiz fino al superamento (o fino alla scadenza)">Fino al termine</th><th style="text-align:right">Risposte</th><th style="text-align:right">Corrette</th><th style="text-align:right">Errori</th><th style="text-align:right">Termini persi</th><th>Termini indovinati</th><th>Ammissione all\'orale</th><th></th></tr></thead><tbody>';
  righe.forEach(function (r) {
    var q = quizDi(r.id), aperto = S.qzAperto === r.id, pc = Math.min(100, Math.round(q.indovinati / q.soglia * 100));
    var dsp = (q.subentri ? ' <span class="chip s-correggere" title="Il quiz è stato aperto su un altro dispositivo mentre la sessione precedente era ancora attiva">Sessione presa da un altro dispositivo · ' + q.subentri + (q.subentri === 1 ? ' volta' : ' volte') + '</span>' : '') +
      (q.dispositivi > 1 ? ' <span class="chip s-inviata">' + q.dispositivi + ' dispositivi</span>' : '');
    h += '<tr data-quiz="' + r.id + '"><td>' + esc(r.nome) + (r.escluso ? ' <span class="chip s-correggere">Escluso</span>' : '') + dsp + '</td><td class="n">' + esc(etich(r)) + '</td><td class="n">' + q.sessioni + '</td><td class="n" style="font-weight:400">' + (q.sessioni ? tempoMs(q.ms) : '—') + '</td>' + '<td class="n">' + fineQuizHtml(q) + '</td>' +
      '<td class="n" style="font-weight:400">' + q.risposte + '</td><td class="n">' + q.corrette + (q.risposte ? ' <span class="muted" style="font-weight:400;font-size:13px">' + Math.round(q.corrette / q.risposte * 100) + '%</span>' : '') + '</td>' +
      '<td class="n">' + (q.errori || 0) + '</td><td class="n" style="font-weight:400">' + (q.persi || 0) + '</td>' +
      '<td style="min-width:150px"><b>' + q.indovinati + '</b> / ' + q.soglia + (q.massimo > q.indovinati ? ' <span class="muted" style="font-size:13px">(massimo ' + q.massimo + ')</span>' : '') + '<div class="bar" style="margin-top:4px"><span style="width:' + pc + '%;background:' + (q.superata ? 'var(--ok)' : 'var(--a1)') + '"></span></div></td>' +
      '<td>' + chipQuiz(q) + (q.proroga ? '<br><span class="chip s-inviata" style="margin-top:4px">Proroga al ' + esc(oraIt(q.proroga)) + '</span>' : '') + '</td>' +
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap">' + (PUO('studenti') && !RO() && !q.superata && q.scadenzaClasse ? '<button class="btn sec tb" onclick="prorogaQuiz(\'' + r.id + '\')">' + (q.proroga ? 'Modifica proroga' : 'Proroga') + '</button>' : '') +
        (q.sessioni ? '<button class="btn sec tb" aria-expanded="' + aperto + '" onclick="S.qzAperto=' + (aperto ? 'null' : '\'' + r.id + '\'') + ';vistaDocente()">' + (aperto ? 'Chiudi' : 'Sessioni') + '</button>' : '') + '</div></td></tr>';
    if (aperto) h += '<tr class="qz-det"><td colspan="12" style="background:#F6F8FA"><table class="tbl" style="margin:0"><thead><tr><th>Sessione</th><th>Inizio</th><th style="text-align:right">Tempo</th><th style="text-align:right">Risposte</th><th style="text-align:right">Corrette</th><th style="text-align:right">Errori</th><th style="text-align:right">di cui scadute</th><th style="text-align:right">Termini nuovi</th><th style="text-align:right">Termini persi</th></tr></thead><tbody>' +
      q.ultime.map(function (s, i) { return '<tr><td>' + (q.sessioni - q.ultime.length + i + 1) + '</td><td>' + esc(dataBreve(s.i)) + '</td><td class="n" style="font-weight:400">' + tempoMs(s.ms) + '</td><td class="n" style="font-weight:400">' + s.r + '</td><td class="n">' + s.c + '</td><td class="n">' + (s.e || 0) + '</td><td class="n" style="font-weight:400">' + s.s + '</td><td class="n">' + s.n + '</td><td class="n" style="font-weight:400">' + (s.p || 0) + '</td></tr>'; }).reverse().join('') +
      '</tbody></table>' + (q.sessioni > q.ultime.length ? '<p class="muted" style="margin:6px 0 0;font-size:13px">Sono mostrate le ultime ' + q.ultime.length + ' sessioni su ' + q.sessioni + '.</p>' : '') + '</td></tr>';
  });
  return h + '</tbody></table></div></section>';
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
    '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Alunno</th><th style="text-align:right">Classe</th><th>Ammissione (quiz)</th><th style="text-align:right">Scritto</th><th style="text-align:right">Orale</th><th style="text-align:right">Finale</th><th></th></tr></thead><tbody>';
  righe.forEach(function (r) {
    var v = votiDi(r.id), q = quizDi(r.id), o = v.orale;
    h += '<tr data-orale="' + r.id + '"><td>' + esc(r.nome) + (r.escluso ? ' <span class="chip s-correggere">Escluso · max ' + fv(RG().orale.maxEsclusi) + '</span>' : '') + '</td><td class="n">' + esc(etich(r)) + '</td>' +
      '<td>' + chipQuiz(q) + '</td>' +
      '<td class="n">' + (r.escluso ? '<span class="muted" style="font-weight:400">—</span>' : fv(v.voto)) + '</td>' +
      '<td class="n">' + (o ? fv(o.voto) + '<br><span class="muted" style="font-weight:400;font-size:13px">' + fv(o.punti) + ' / ' + RG().orale.domande + ' · ' + esc(dataBreve(o.data)) + '</span>' : '—') + '</td>' +
      '<td class="n">' + (v.finale != null ? '<b style="font-size:18px">' + fv(v.finale) + '</b>' : q.stato === 'scaduto' ? '<span class="muted" style="font-weight:400">senza voto</span>' : '<b style="font-size:18px">—</b>') + '</td>' +
      '<td>' + (!puo ? '' : q.superata ? '<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn ' + (o ? 'sec' : '') + ' tb" onclick="apriOrale(\'' + r.id + '\',this)">' + (v.oraleInCorso ? 'Riprendi' : o ? 'Ripeti' : 'Interroga') + '</button>' +
        (o ? '<button class="btn sec tb" onclick="annullaOrale(\'' + r.id + '\',this)">Annulla voto</button>' : '') + '</div>' : '<span class="muted" style="font-size:14px">' + (q.stato === 'scaduto' ? 'non interrogabile' : 'in attesa del quiz') + '</span>') + '</td></tr>';
  });
  return h + '</tbody></table></div></section>';
}
function apriOrale(id, btn) {
  if (btn) btn.disabled = true;
  api('oralepesca', { alunno: id }).then(function (d) {
    S.or = { alunno: id, bozza: d.bozza, esiti: d.bozza.termini.map(function () { return null; }), nota: '' };
    vistaDocente(); window.scrollTo(0, 0);
  }).catch(function (e) { toast(errMsg(e), true); if (btn) btn.disabled = false; });
}
function puntiOrale() { return S.or.esiti.reduce(function (x, y) { return x + (y || 0); }, 0); }
function schedaOrale() {
  var o = S.or, r = (S.d.panoramica || []).filter(function (x) { return x.id === o.alunno; })[0] || {}, q = quizDi(o.alunno), vs = votiDi(o.alunno);
  var fatti = o.esiti.filter(function (e) { return e !== null; }).length, punti = puntiOrale(), tutti = fatti === o.esiti.length;
  var h = '<section class="card stack" id="oraleScheda"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">Interrogazione di ' + esc(r.nome || nomeAlunno(o.alunno)) + ' <span class="muted" style="font-weight:400;font-size:16px">' + esc(etich(r)) + '</span></h2>' +
    '<button class="btn sec tb" onclick="S.or=null;vistaDocente()">Torna all\'elenco</button></div>' +
    '<div class="or-info" id="orInfo"><div><span class="kl">Voto dello scritto</span><b>' + (r.escluso ? 'Escluso' : fv(vs.voto)) + '</b><small>' + (r.escluso ? 'non entra nel finale' : (vs.errIt || 0) + (vs.errIt === 1 ? ' errore' : ' errori') + (vs.manuale != null ? ' · voto manuale' : '')) + '</small></div>' +
    '<div><span class="kl">Tempo nel quiz</span><b>' + (q.sessioni ? tempoMs(q.ms) : '—') + '</b><small>' + (q.sessioni ? q.sessioni + (q.sessioni === 1 ? ' sessione' : ' sessioni') + (q.superata ? ' · ' + tempoMs(q.msFine) + ' per superarlo' : '') : 'nessuna sessione') + '</small></div>' +
    '<div><span class="kl">Risposte nel quiz</span><b>' + q.corrette + ' / ' + q.risposte + '</b><small>' + (q.risposte ? Math.round(q.corrette / q.risposte * 100) + '% corrette · ' + (q.errori || 0) + ' errori' : 'nessuna risposta') + '</small></div>' +
    '<div><span class="kl">Termini indovinati</span><b>' + q.indovinati + ' / ' + q.soglia + '</b><small>' + (q.superata ? 'quiz superato il ' + esc(dataBreve(q.superata)) : 'quiz non superato') + '</small></div></div>' +
    (r.escluso ? '<div class="note warn"><b>Alunno escluso dallo scritto:</b> all\'orale può arrivare al massimo a ' + fv(RG().orale.maxEsclusi) + ' (' + fv(RG().orale.base) + ' + ' + frz(RG().orale.passoEsclusi) + ' per punto).</div>' : '') +
    '</section><div class="or-punti" id="orPunti" aria-live="polite"><div><span class="kl">Risposte segnate</span><b>' + fatti + ' / ' + o.esiti.length + '</b></div><div><span class="kl">Punti</span><b>' + fv(punti) + ' / 10</b></div>' +
    '<div><span class="kl">Voto orale</span><b>' + (tutti ? fv(votoOraleDa(punti, r.escluso)) : '—') + '</b></div></div>';
  o.bozza.termini.forEach(function (t, i) {
    var a = area(t.area) || {}, e = o.esiti[i];
    h += '<section class="card or-voce" data-pos="' + i + '" style="border-left:8px solid ' + esc(a.colore || '#15212B') + '"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="muted" style="font-size:13px">' + (i + 1) + ' di ' + o.bozza.termini.length + ' · ' + esc(a.it || '') + '</div>' +
      '<div class="or-term">' + esc(t.it) + '</div></div><button class="btn sec tb" onclick="cambiaOrale(' + i + ',this)">Cambia termine</button></div>' +
      '<p class="or-def"><span class="muted" style="font-size:13px;display:block">Definizione corretta (la vedi solo tu)</span>' + esc(t.def) + '</p>' +
      '<div class="row or-esiti" role="group" aria-label="Esito della risposta ' + (i + 1) + '">' + [[1, 'Corretta', 'ok'], [0.5, 'Parziale', 'mz'], [0, 'Sbagliata', 'no']].map(function (x) {
        return '<button class="or-b ' + x[2] + (e === x[0] ? ' on' : '') + '" aria-pressed="' + (e === x[0]) + '" onclick="esitoOrale(' + i + ',' + x[0] + ')">' + x[1] + ' <small>' + fv(x[0]) + '</small></button>'; }).join('') + '</div></section>';
  });
  h += '<section class="card stack"><label for="orNota">Nota (facoltativa, resta nel registro dell\'interrogazione)</label><input id="orNota" type="text" maxlength="300" value="' + esc(o.nota || '') + '" oninput="S.or.nota=this.value">' +
    '<div class="row"><button class="btn ok" id="orSalva" ' + (tutti ? '' : 'disabled') + ' onclick="salvaOrale(this)">Salva l\'interrogazione' + (tutti ? ' · voto ' + fv(votoOraleDa(punti, r.escluso)) : '') + '</button>' +
    '<button class="btn sec" onclick="scartaOrale(this)">Scarta questa interrogazione</button>' + (o.bozza.cambi ? '<span class="muted" style="font-size:14px">' + (o.bozza.cambi === 1 ? '1 termine cambiato' : o.bozza.cambi + ' termini cambiati') + '</span>' : '') + '</div>' +
    (tutti ? '' : '<p class="muted" style="margin:0;font-size:14px">Segna l\'esito di tutte le risposte per salvare.</p>') + '</section>';
  return h;
}
function esitoOrale(i, v) {
  S.or.esiti[i] = S.or.esiti[i] === v ? null : v;
  var y = window.scrollY; vistaDocente(); window.scrollTo(0, y);
}
function cambiaOrale(i, btn) {
  btn.disabled = true;
  api('oralecambia', { alunno: S.or.alunno, pos: i }).then(function (d) {
    S.or.bozza = d.bozza; S.or.esiti[i] = null; var y = window.scrollY; vistaDocente(); window.scrollTo(0, y); toast('Termine cambiato');
  }).catch(function (e) { toast(errMsg(e), true); btn.disabled = false; });
}
function salvaOrale(btn) {
  btn.disabled = true;
  api('oralesalva', { alunno: S.or.alunno, esiti: S.or.esiti, nota: S.or.nota }).then(function (d) {
    S.or = null; return ricarica('Interrogazione salvata: voto orale ' + fv(d.orale.voto));
  }).catch(function (e) { toast(errMsg(e), true); btn.disabled = false; });
}
function scartaOrale(btn) {
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
