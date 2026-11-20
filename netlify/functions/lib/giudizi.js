/**
 * Giudizio breve per alunno, generato dai dati della prova (scritto, quiz, orale, finale).
 * Il docente lo può sostituire con il suo testo (alunno.giudizio). Non nomina mai BES o misure personali.
 */
const fv = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
function qualita(v) { return v >= 9 ? 'ottimo' : v >= 8 ? 'molto buono' : v >= 7 ? 'buono' : v >= 6 ? 'sufficiente' : v >= 5 ? 'non del tutto sufficiente' : 'insufficiente'; }
function auto(v, q) {
  const p = [];
  if (v.escluso) p.push('Non ha consegnato lo scritto entro la scadenza');
  else if (v.voto == null || !v.it || !v.it.inviate) p.push('Scritto non ancora svolto');
  else {
    const e = v.it.errate || 0;
    p.push('Ha completato lo scritto ' + (e === 0 ? 'senza errori' : e === 1 ? 'con 1 errore' : 'con ' + e + ' errori') + ' (voto ' + fv(v.voto) + ')');
  }
  if (q) {
    if (q.superata) p.push('ha superato il quiz' + (q.giorniSup ? ' in ' + q.giorniSup + (q.giorniSup === 1 ? ' giorno' : ' giorni') : '') + (q.sessioni ? ' (' + q.sessioni + (q.sessioni === 1 ? ' sessione' : ' sessioni') + ')' : ''));
    else if (q.stato === 'scaduto') p.push('non ha completato il quiz entro la scadenza');
    else if (q.sessioni) p.push('quiz in corso (' + q.indovinati + ' termini su ' + q.soglia + ')');
    else if (q.stato === 'in corso') p.push('non ha ancora iniziato il quiz');
  }
  if (v.orale && v.orale.voto != null) p.push('orale ' + qualita(v.orale.voto) + ' (' + fv(v.orale.voto) + ')');
  let t = p.join(', ') + '.';
  if (v.finale != null) t += ' Voto finale ' + fv(v.finale) + '.';
  return t.charAt(0).toUpperCase() + t.slice(1);
}
module.exports = { auto, qualita };
