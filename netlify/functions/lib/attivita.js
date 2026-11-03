/**
 * Registro delle attività degli alunni: accessi, sessioni di lavoro, tempo con l'app aperta.
 * Un documento per alunno in "attivita/<id>":
 *   { sessioni: [{ inizio, fine, n, disp }], accessi, risposte, primo, ultimo }
 * Una sessione continua finché arrivano segnali a meno di PAUSA di distanza
 * (l'app manda un segnale al minuto mentre è aperta e in primo piano).
 */
const PAUSA = 10 * 60 * 1000;
const MAX_SESSIONI = 400;

const iso = (ms) => new Date(ms).toISOString();

function dispositivo(ua) {
  ua = String(ua || '');
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'telefono';
  return ua ? 'computer' : '';
}

/* aggiorna il documento con un nuovo segnale; tipo: login | presenza | scegli */
function aggiorna(cur, now, disp, tipo) {
  const a = Object.assign({ sessioni: [], accessi: 0, risposte: 0 }, cur || {});
  a.sessioni = (a.sessioni || []).slice();
  const ult = a.sessioni[a.sessioni.length - 1];
  if (ult && now - Date.parse(ult.fine) <= PAUSA && now >= Date.parse(ult.inizio)) {
    a.sessioni[a.sessioni.length - 1] = Object.assign({}, ult, { fine: iso(now), n: (ult.n || 1) + 1, disp: ult.disp || disp });
  } else {
    a.sessioni.push({ inizio: iso(now), fine: iso(now), n: 1, disp: disp || '' });
    a.accessi = (a.accessi || 0) + 1;
  }
  if (tipo === 'scegli') a.risposte = (a.risposte || 0) + 1;
  if (!a.primo) a.primo = iso(now);
  a.ultimo = iso(now);
  if (a.sessioni.length > MAX_SESSIONI) a.sessioni = a.sessioni.slice(-MAX_SESSIONI);
  return a;
}

const giornoRoma = (ms) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));

/* riepilogo per tabellone e report */
function riepilogo(a, now) {
  a = a || {};
  const s = a.sessioni || [];
  let ms = 0;
  const giorni = new Set(), disp = {};
  s.forEach((x) => {
    const i = Date.parse(x.inizio), f = Date.parse(x.fine);
    ms += Math.max(0, f - i);
    giorni.add(giornoRoma(i));
    if (x.disp) disp[x.disp] = (disp[x.disp] || 0) + 1;
  });
  const ultimo = a.ultimo ? Date.parse(a.ultimo) : null;
  return {
    accessi: a.accessi || s.length,
    minuti: Math.round(ms / 60000),
    giorni: giorni.size,
    primo: a.primo || null,
    ultimo: a.ultimo || null,
    giorniDaUltimo: ultimo ? Math.floor((now - ultimo) / 86400000) : null,
    risposte: a.risposte || 0,
    dispositivi: disp,
    sessioni: s.slice(-30).reverse().map((x) => ({ inizio: x.inizio, fine: x.fine, minuti: Math.round(Math.max(0, Date.parse(x.fine) - Date.parse(x.inizio)) / 60000), disp: x.disp || '' }))
  };
}

module.exports = { aggiorna, riepilogo, dispositivo, PAUSA };
