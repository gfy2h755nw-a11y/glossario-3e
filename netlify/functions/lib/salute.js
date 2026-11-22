/* Salute dell'app: gli errori imprevisti (server, app di docenti e studenti, pagina pubblica) vengono registrati
   per giorno e per tipo, così il prof. Cerrato li vede nel cruscotto prima che diventino un problema in classe.
   Nessun codice personale e nessun dato degli studenti: solo il messaggio tecnico, dove è successo e quante volte. */
const giornoRoma = (ms) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
const ORIGINI = { server: 'Server', app: 'App', pubblica: 'Pagina pubblica', quiz: 'Pagina del quiz' };
const pulisci = (s, n) => String(s == null ? '' : s).replace(/[A-Z2-9]{6,8}(?=\b)/g, (m) => (/[0-9]/.test(m) && /[A-Z]/.test(m) ? '••••••' : m)).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, n);
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
// rumore dei browser che non dipende dall'app
const RUMORE = /ResizeObserver loop|^Script error\.?$|chrome-extension:|moz-extension:|safari-extension:|Non-Error promise rejection|AbortError|Load failed|Failed to fetch|NetworkError|cancelled|annullat/i;

/* registra un errore: { origine, messaggio, dettaglio, azione, ruolo, att, pagina, disp, livello } */
async function registra(fdb, e) {
  const origine = ORIGINI[e.origine] ? e.origine : 'server';
  const messaggio = pulisci(e.messaggio || 'Errore sconosciuto', 300).trim();
  if (!messaggio || (origine !== 'server' && RUMORE.test(messaggio))) return false;
  const now = Date.now(), giorno = giornoRoma(now);
  const firma = origine + '|' + (e.azione || '') + '|' + messaggio.replace(/\d+/g, '#');
  const id = giorno + '_' + hash(firma);
  await fdb.aggiornaErrore(id, (cur) => {
    const x = cur || { giorno, firma, origine, messaggio, azione: pulisci(e.azione, 40), livello: e.livello === 'avviso' ? 'avviso' : 'errore', primo: new Date(now).toISOString(), n: 0, ruoli: {}, pagine: {}, disp: {} };
    x.n = (x.n || 0) + 1; x.ultimo = new Date(now).toISOString();
    if (!x.dettaglio && e.dettaglio) x.dettaglio = pulisci(e.dettaglio, 900);
    const piu = (m, k) => { k = pulisci(k, 40); if (k && (k in m || Object.keys(m).length < 12)) m[k] = (m[k] || 0) + 1; };
    if (e.ruolo) piu(x.ruoli, e.ruolo); if (e.pagina) piu(x.pagine, e.pagina); if (e.disp) piu(x.disp, e.disp);
    if (e.att && e.att !== 'main') piu(x.pagine, 'attività ' + e.att);
    return x;
  });
  return true;
}

/* elenco degli ultimi giorni, raggruppato per tipo di errore (più recenti prima) */
async function elenco(fdb, giorni, now) {
  now = now || Date.now();
  const da = giornoRoma(now - ((giorni || 30) - 1) * 86400000);
  const docs = await fdb.leggiErrori(da);
  const per = {};
  docs.filter((d) => d.giorno >= da).forEach((d) => {
    const g = per[d.firma] || (per[d.firma] = { firma: d.firma, origine: d.origine, dove: ORIGINI[d.origine] || d.origine, messaggio: d.messaggio, azione: d.azione || '', livello: d.livello || 'errore', dettaglio: d.dettaglio || '', n: 0, giorni: 0, primo: d.primo, ultimo: d.ultimo, ruoli: {}, pagine: {}, disp: {} });
    g.n += d.n || 0; g.giorni++;
    if (d.primo < g.primo) g.primo = d.primo; if (d.ultimo > g.ultimo) { g.ultimo = d.ultimo; if (d.dettaglio) g.dettaglio = d.dettaglio; }
    ['ruoli', 'pagine', 'disp'].forEach((k) => Object.keys(d[k] || {}).forEach((x) => { g[k][x] = (g[k][x] || 0) + d[k][x]; }));
  });
  return Object.values(per).sort((a, b) => b.ultimo.localeCompare(a.ultimo));
}

async function riepilogo(fdb, now) {
  const er = await elenco(fdb, 30, now), meta = (await fdb.leggiSalute()) || {};
  const letti = meta.letti || '';
  const nuovi = er.filter((x) => x.ultimo > letti && x.livello === 'errore');
  return { letti, nuovi: nuovi.length, ultimo: er.length ? er[0].ultimo : null, totale: er.length };
}

module.exports = { registra, elenco, riepilogo, RUMORE };
