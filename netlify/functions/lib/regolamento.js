/* Regole dell'attività: un documento chiaro e sempre aggiornato, costruito dalle impostazioni vere dell'app
   (scritto, scadenze ed esclusione, quiz, misure personali/BES, interrogazione, voto finale, pagina pubblica e cartelloni).
   Lo vede solo chi insegna nell'attività: ci sono anche le misure personali, che gli studenti non vedono mai. */
const L = require('./logica');
const REG = require('./regole');
const OR = require('./orale');
const CAT = require('./catalogo');

const n = (x) => String(Math.round(Number(x) * 1000) / 1000).replace('.', ',');
const GG = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MM = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
function quando(iso) {
  if (!iso) return null; const t = Date.parse(iso); if (!isFinite(t)) return null;
  const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(t)).forEach((x) => { p[x.type] = x.value; });
  const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  return GG[d.getUTCDay()] + ' ' + (+p.day) + ' ' + MM[+p.month - 1] + ' ' + p.year + ', ' + p.hour.replace(/^0/, '') + ':' + p.minute;
}
const elenco = (v) => (v.length > 1 ? v.slice(0, -1).join(', ') + ' e ' + v[v.length - 1] : v.join(''));

function genera(stato) {
  const C = stato.config, imp = L.impostazioni(C), R = REG.di(C), classi = imp.classi;
  const cat = CAT.materializza(C).cat, tot = Object.values(cat).reduce((s, v) => s + v.length, 0), aree = Object.keys(cat).length;
  const conc = !!C.concessione, en = imp.lingue.indexOf('en') >= 0;
  const sez = [];
  const S = (titolo, colore, punti, nota) => sez.push({ titolo, colore, punti: punti.filter(Boolean), nota: nota || '' });

  // calendario per classe
  const cal = classi.map((c) => {
    const ic = L.impClasse(imp, c), q = OR.cfgQuiz(C, c, tot, null);
    return { classe: c, alunni: stato.alunni.filter((a) => L.classeDi(a) === c).length, termini: L.termPerAlunno(imp, c), scrittoDa: quando(ic.partenza), scrittoA: quando(ic.scadenzaIt), quizDa: quando(q.partenza) || (q.scadenzaClasse ? 'da subito' : null), quizA: quando(q.scadenzaClasse) };
  });

  S('In breve', '#17212B', [
    'L\'attività ha quattro tappe: <b>scritto</b> da casa → <b>quiz</b> da casa → <b>interrogazione</b> in classe → <b>voto finale</b> (media tra scritto e interrogazione).',
    'Il glossario ha <b>' + tot + ' termini</b> divisi in <b>' + aree + ' aree</b>; ogni studente lavora sui suoi termini nello scritto, ma il quiz e l\'interrogazione riguardano <b>tutto il glossario</b>.',
    'Gli studenti usano l\'app da telefono o da PC con il loro <b>codice personale</b>, consegnato dal docente con il foglio degli accessi.',
    'Il quiz non dà voto: serve per essere <b>ammessi all\'interrogazione</b>. Senza quiz superato non c\'è interrogazione e non c\'è voto.'
  ]);

  S('Lo scritto', '#1F5FA8', [
    cal.map((x) => 'Classe <b>' + x.classe + '</b> (' + x.alunni + ' studenti): <b>' + x.termini + ' termini</b> a testa' + (x.scrittoA ? (x.scrittoDa ? ', dal ' + x.scrittoDa + ' al <b>' + x.scrittoA + '</b>' : ', entro <b>' + x.scrittoA + '</b>') : '') + '.').join('<br>'),
    'Per ogni termine lo studente sceglie la definizione giusta tra <b>8 definizioni</b> proposte (una sola è corretta) e la invia' + (en ? '; dopo l\'approvazione dell\'italiano si sblocca l\'inglese' : '') + '.',
    'Il docente <b>approva</b> la scelta giusta oppure la <b>rimanda</b>: la definizione sbagliata viene scartata e lo studente ne sceglie un\'altra tra le rimaste.',
    'Il voto dello scritto parte da <b>' + n(imp.votoMax) + '</b> e scende di <b>' + n(imp.penalita) + '</b> per ogni definizione sbagliata inviata, senza scendere sotto <b>' + n(imp.votoMin) + '</b>. Il voto compare dalla prima risposta inviata.',
    'Una scelta approvata non si può più cambiare. Il docente può inserire a mano un voto dello scritto, che sostituisce quello calcolato.'
  ]);

  S('Scadenze, proroghe ed esclusione', '#B3261E', [
    'Chi entro la scadenza non ha risposto a tutti i suoi termini viene <b>escluso dallo scritto</b> e prende <b>' + n(imp.votoEsclusione) + '</b> per mancata consegna.',
    imp.riassegnazione === 'manuale'
      ? 'I termini dello studente escluso passano ai compagni <b>scelti dal docente</b>, della stessa classe; chi li riceve ha i giorni indicati dal docente (di norma <b>' + imp.giorniIt + '</b>) per rispondere.'
      : 'I termini dello studente escluso passano <b>a sorte</b> a un compagno della stessa classe, che ha <b>' + imp.giorniIt + ' giorni</b> per rispondere.',
    'In ogni momento il docente può anche <b>assegnare lui i termini non pervenuti</b> a un compagno a sua scelta, decidendo quali termini e fino a quando rispondere, e può <b>bloccare il passaggio automatico</b> per uno studente.',
    'Chi riceve termini da un compagno escluso può arrivare a <b>' + n(imp.votoMaxErede) + '</b> invece di ' + n(imp.votoMax) + ', con le stesse penalità.',
    'Se non risponde in tempo ai termini ricevuti non viene escluso, ma il suo voto dello scritto scende a <b>' + n(imp.tetto) + '</b> (se era più alto).',
    'Il docente può concedere una <b>proroga individuale</b> della scadenza e può <b>riammettere</b> uno studente escluso.',
    'Lo studente escluso <b>può comunque fare il quiz e l\'interrogazione</b>: in quel caso il voto finale è solo quello dell\'interrogazione, che per lui arriva al massimo a <b>' + n(R.orale.maxEsclusi) + '</b>.',
    'Gli studenti esclusi dallo scritto non compaiono sui cartelloni.'
  ]);

  const qp = OR.cfgQuiz(C, classi[0], tot, null);
  S('Il quiz', '#6B4FA0', [
    cal.map((x) => 'Classe <b>' + x.classe + '</b>: ' + (x.quizA ? 'aperto ' + (x.quizDa === 'da subito' ? 'da subito' : 'dal ' + x.quizDa) + ' al <b>' + x.quizA + '</b>' : '<b>date da fissare</b> (finché non c\'è la scadenza il quiz resta chiuso)') + '.').join('<br>'),
    'Si fa da casa, nella pagina del quiz, con lo stesso codice personale dello scritto, anche in più volte: <b>i progressi restano</b> tra un accesso e l\'altro.',
    'A ogni domanda compare un termine con <b>' + R.quiz.opzioni + ' definizioni</b>; lo studente ha <b>' + R.quiz.secondi + ' secondi</b> per scegliere quella giusta.',
    'Risposta giusta: il termine è indovinato. Risposta sbagliata o tempo scaduto: <b>la risposta giusta non viene mostrata</b> e lo studente <b>torna indietro di ' + R.quiz.passo + ' termini</b> (perde gli ultimi indovinati).',
    'Il quiz è superato quando i termini indovinati arrivano a <b>' + qp.sogliaClasse + (qp.sogliaClasse === tot ? ' (tutti i termini del glossario)' : ' su ' + tot) + '</b>.',
    'Solo chi supera il quiz è <b>ammesso all\'interrogazione</b>. Chi non lo supera entro la scadenza resta <b>senza interrogazione e senza voto</b>; le sue definizioni restano comunque sui cartelloni.',
    'Il docente può concedere una <b>proroga individuale</b> del quiz. Dopo averlo superato, lo studente vede solo i complimenti e poi la data dell\'interrogazione: non può più rifare il quiz.'
  ]);

  const besN = stato.alunni.filter((a) => a.bes && a.bes.etichetta !== false).length, pers = stato.alunni.filter((a) => a.quiz_soglia != null || (a.quiz_passo != null && a.quiz_passo !== '')).length;
  S('Misure personali (BES, DSA, PDP)', '#0E7C7B', [
    'Per gli studenti con un piano personale il docente può impostare, uno per uno:',
    '• <b>tempo personale</b> per ogni domanda del quiz, oppure <b>nessun limite di tempo</b>;',
    '• il pulsante <b>«Dimezza opzioni»</b>: della domanda in corso restano la definizione giusta e una sbagliata;',
    '• una <b>soglia personale</b> di termini da indovinare e/o <b>meno termini persi</b> a ogni errore;',
    '• all\'interrogazione, i termini si pescano <b>solo tra quelli del suo quiz</b> (quelli indovinati), se il suo quiz aveva meno termini del glossario;',
    '• all\'interrogazione, <b>metà dei termini</b> (' + Math.max(1, Math.round(R.orale.domande / 2)) + ' invece di ' + R.orale.domande + '): ogni punto vale il doppio, così il voto massimo resta lo stesso (' + n(R.orale.max) + ').',
    'Le misure sono riservate: <b>lo studente non vede mai l\'etichetta BES</b> né le regole personali, solo i numeri che gli servono (per esempio quanti termini mancano).',
    'In questa attività: ' + (besN ? besN + (besN === 1 ? ' studente con misure BES' : ' studenti con misure BES') : 'nessuno studente con misure BES') + (pers ? ', ' + pers + ' con regole personali del quiz' : '') + '.'
  ]);

  S('L\'interrogazione', '#B4511A', [
    'È la verifica finale, in classe, <b>su tutto il glossario</b> (sui soli termini del suo quiz per chi aveva una soglia personale, vedi sotto): ' + R.orale.domande + ' termini per studente, che lo studente deve spiegare a voce.',
    'I termini li <b>sceglie il docente</b>, oppure il docente chiede all\'app di proporli: equilibrati tra le aree e preferendo quelli meno usciti nella classe.',
    'Mai i termini che lo studente ha avuto nello scritto; il docente vede quali termini sono già usciti e con chi.',
    'Chi ha fatto il quiz su <b>tutti i termini</b> viene interrogato su tutto il glossario; chi aveva una <b>soglia personale più bassa</b> (es. studenti BES) solo sui <b>termini del suo quiz</b>, sia quando l\'app pesca sia quando sceglie il docente.',
    'Il docente <b>fissa la data</b> dell\'interrogazione; lo studente la vede nell\'app con l\'invito a ripassare sulla pagina pubblica.',
    'Ogni risposta vale: <b>corretta 1 punto</b>, <b>parziale ½</b>, <b>sbagliata 0</b>.',
    'Voto dell\'interrogazione = <b>' + n(R.orale.base) + ' + ' + n(R.orale.passo) + ' per ogni punto</b>, fino a <b>' + n(R.orale.max) + '</b>. Per chi è stato escluso dallo scritto: ' + n(R.orale.base) + ' + ' + n(R.orale.passoEsclusi) + ' per punto, fino a <b>' + n(R.orale.maxEsclusi) + '</b>.',
    'L\'app propone il voto secondo questi criteri, ma <b>decide il docente</b>: può modificarlo e aggiungere una nota. Durante l\'interrogazione vede il voto dello scritto e il tempo passato sull\'app.',
    'Gli esiti restano salvati anche sul dispositivo: se cade la connessione, partono da soli appena torna.'
  ]);

  const ps = R.finale.pesoScritto;
  S('Il voto finale', '#2E7D32', [
    ps === 50 ? 'Voto finale = <b>media tra scritto e interrogazione</b>.' : 'Voto finale = <b>scritto ' + ps + '%</b> + <b>interrogazione ' + (100 - ps) + '%</b>.',
    'Arrotondamento: sopra il mezzo voto si sale all\'intero, sotto si scende, il mezzo voto resta. Esempi: <b>7,75 → 8</b> · <b>7,5 → 7,5</b> · <b>7,4 → 7</b>.',
    'Esempio: scritto ' + n(imp.votoMax) + ' e interrogazione ' + n(R.orale.max) + ' → ' + n(L.arrotFinale(imp.votoMax * ps / 100 + R.orale.max * (1 - ps / 100))) + '.',
    'Chi è stato escluso dallo scritto: voto finale = solo l\'interrogazione (massimo ' + n(R.orale.maxEsclusi) + ').',
    'Chi non supera il quiz: nessuna interrogazione e nessun voto finale.',
    'Il voto finale e il giudizio si vedono a video o in PDF, pronti da inserire nel registro Argo. Lo studente, dopo l\'interrogazione, legge solo che il voto è sul registro.'
  ]);

  S('Pagina pubblica e cartelloni', '#5E6873', [
    'La pagina pubblica mostra termini, definizioni e autori <b>solo dopo che il docente preme «Pubblica sulla pagina pubblica»</b>; può anche ritirarle. Quando il quiz è finito, l\'app ricorda di pubblicare.',
    'Sulla pagina pubblica si consulta il glossario, ci si mette alla prova e si gioca a squadre; il tempo di ripasso dello studente riconosciuto conta nei suoi report.',
    'I QR dei cartelloni portano alla home di tutti i glossari. Sui cartelloni e sulla pagina pubblica gli studenti compaiono con nome e iniziale del cognome (es. «Linda B.»).',
    conc ? 'Questa attività è di <b>' + (C.concessione.docente || 'un collega') + '</b>: su cartelloni, app, pagina pubblica e documenti compare «Per gentile concessione del Prof. Danilo Cerrato».' : null
  ]);

  return { titolo: 'Regole dell\'attività', attivita: imp.edizione.nome, as: imp.edizione.as, aggiornato: new Date().toISOString(), sezioni: sez };
}

module.exports = { genera };
