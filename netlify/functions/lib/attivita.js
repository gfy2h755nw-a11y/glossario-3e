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

/* aggiorna il documento con un nuovo segnale; tipo: login | presenza | scegli | pubblica (ripasso sulla pagina pubblica) */
function aggiorna(cur, now, disp, tipo) {
  if (tipo === 'pubblica') return aggiornaPubblica(cur, now, disp);
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

/* tempo sulla pagina pubblica (ripasso): sessioni a parte, contate anche nel tempo totale */
function aggiornaPubblica(cur, now, disp) {
  const a = Object.assign({ sessioni: [], accessi: 0, risposte: 0 }, cur || {});
  const s = (a.pubblica || []).slice(), ult = s[s.length - 1];
  if (ult && now - Date.parse(ult.fine) <= PAUSA && now >= Date.parse(ult.inizio)) s[s.length - 1] = Object.assign({}, ult, { fine: iso(now), n: (ult.n || 1) + 1 });
  else s.push({ inizio: iso(now), fine: iso(now), n: 1, disp: disp || '' });
  a.pubblica = s.length > MAX_SESSIONI ? s.slice(-MAX_SESSIONI) : s;
  a.ultimoPubblica = iso(now);
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
  let msPub = 0;
  (a.pubblica || []).forEach((x) => { msPub += Math.max(0, Date.parse(x.fine) - Date.parse(x.inizio)); giorni.add(giornoRoma(Date.parse(x.inizio))); });
  return {
    accessi: a.accessi || s.length,
    // tempo totale: app + ripasso sulla pagina pubblica (che si vede anche a parte)
    minuti: Math.round((ms + msPub) / 60000),
    minutiApp: Math.round(ms / 60000),
    minutiPubblica: Math.round(msPub / 60000),
    sessioniPubblica: (a.pubblica || []).length,
    ultimoPubblica: a.ultimoPubblica || null,
    giorni: giorni.size,
    primo: a.primo || null,
    ultimo: a.ultimo || null,
    giorniDaUltimo: ultimo ? Math.floor((now - ultimo) / 86400000) : null,
    risposte: a.risposte || 0,
    dispositivi: disp,
    sessioni: s.slice(-30).reverse().map((x) => ({ inizio: x.inizio, fine: x.fine, minuti: Math.round(Math.max(0, Date.parse(x.fine) - Date.parse(x.inizio)) / 60000), disp: x.disp || '' }))
  };
}

/* tempo di studio per il report:
   - tempo totale (app + pagina pubblica) diviso per i giorni dell'attività: dal giorno di partenza dello scritto
     al giorno dell'interrogazione (o a oggi, se non è ancora stato interrogato);
   - ripasso sulla pagina pubblica dal giorno in cui l'interrogazione è stata programmata al giorno dell'interrogazione. */
function studio(doc, { partenza, fissata, fine }, now) {
  doc = doc || {};
  const giorno = (ms) => Date.parse(giornoRoma(ms) + 'T12:00:00Z');
  const giorniTra = (da, a) => Math.max(1, Math.round((giorno(a) - giorno(da)) / 86400000) + 1);
  const fineMs = fine ? Math.min(Date.parse(fine), now) : now;
  const r = riepilogo(doc, now), out = { giorniAttivita: null, minutiAlGiorno: null, ripassoPrep: null, giorniPrep: null, ripassoPrepAlGiorno: null };
  const p0 = partenza ? Date.parse(partenza) : null;
  if (p0 && p0 <= fineMs) { out.giorniAttivita = giorniTra(p0, fineMs); out.minutiAlGiorno = Math.round(r.minuti / out.giorniAttivita); }
  const f0 = fissata ? Date.parse(fissata) : null;
  if (f0 && f0 <= fineMs) {
    let ms = 0;
    (doc.pubblica || []).forEach((x) => { const i = Math.max(Date.parse(x.inizio), f0), f = Math.min(Date.parse(x.fine), fineMs); if (f > i) ms += f - i; });
    out.ripassoPrep = Math.round(ms / 60000); out.giorniPrep = giorniTra(f0, fineMs); out.ripassoPrepAlGiorno = Math.round(out.ripassoPrep / out.giorniPrep);
  }
  return out;
}
module.exports = { aggiorna, riepilogo, studio, dispositivo, PAUSA };
