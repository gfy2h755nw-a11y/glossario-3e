/* Statistiche della pagina pubblica (home dei glossari e glossari): conteggi anonimi per giorno.
   Nessun nome, nessun indirizzo di rete: solo numeri, il tipo di dispositivo, l'ora e la località approssimativa (città e regione)
   che Netlify ricava dalla connessione. Un documento per giorno nella raccolta «statistiche». */
const giornoRoma = (ms) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
const oraRoma = (ms) => Number(new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false }).format(new Date(ms))) % 24;
const EVENTI = { apertura: 1, pagina: 1, consulta: 1, ricerca: 1, prova: 1, squadre: 1, tempo: 1, installata: 1 };
const LIMITE = { vid: 6000, ricerche: 300, luoghi: 300, pagine: 60 };
const chiave = (s, max) => String(s || '').toLowerCase().normalize('NFC').replace(/[\u0000-\u001f]/g, '').replace(/^_+|_+$/g, '').trim().slice(0, max || 40);
const piu = (mappa, k, n, max) => { if (!k) return; if (!(k in mappa) && max && Object.keys(mappa).length >= max) return; mappa[k] = (mappa[k] || 0) + (n || 1); };

/* località dalla connessione (intestazione x-nf-geo di Netlify): città e regione, oppure città e paese all'estero */
function luogo(headers) {
  const h = headers || {};
  let g = null;
  try { const raw = h['x-nf-geo'] || h['X-Nf-Geo']; if (raw) g = JSON.parse(Buffer.from(String(raw), 'base64').toString('utf8')); } catch (e) { g = null; }
  if (!g) { try { const raw = h['x-nf-geo']; if (raw && /^\s*\{/.test(raw)) g = JSON.parse(raw); } catch (e) { g = null; } }
  if (!g) return { paese: h['x-country'] || '', luogo: '' };
  const paese = (g.country && g.country.code) || h['x-country'] || '';
  const citta = String(g.city || '').trim(), reg = String((g.subdivision && g.subdivision.name) || '').trim(), nomePaese = String((g.country && g.country.name) || paese).trim();
  const l = citta ? citta + ' · ' + (paese === 'IT' ? reg || 'Italia' : nomePaese) : '';
  return { paese, luogo: l.slice(0, 60) };
}

function vuoto(giorno) {
  return { giorno, visite: 0, vid: {}, pagine: {}, da: {}, disp: {}, app: 0, ore: Array(24).fill(0), luoghi: {}, paesi: {}, consulta: 0, ricerche: {}, ricercheN: 0, prove: 0, provaSomma: 0, squadre: 0, tempo: 0, tempoN: 0, installazioni: 0 };
}

/* registra un evento della pagina pubblica: { ev, pag, da, disp, app, vid, q, voto, sec } */
async function registra(fdb, p, headers) {
  const ev = String(p.ev || '');
  if (!EVENTI[ev]) return { ok: false };
  const now = Date.now(), giorno = giornoRoma(now);
  const pag = chiave(p.pag, 40).replace(/[^a-z0-9-]/g, '') || 'home';
  const loc = ev === 'apertura' ? luogo(headers) : null;
  await fdb.aggiornaStatistica(giorno, (cur) => {
    const s = Object.assign(vuoto(giorno), cur || {});
    if (!Array.isArray(s.ore) || s.ore.length !== 24) s.ore = Array(24).fill(0);
    if (ev === 'apertura') {
      s.visite++;
      const vid = String(p.vid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16);
      if (vid) piu(s.vid, vid, 1, LIMITE.vid);
      piu(s.pagine, pag, 1, LIMITE.pagine);
      piu(s.da, ['qr', 'msg', 'scheda'].indexOf(p.da) >= 0 ? p.da : 'altro');
      piu(s.disp, p.disp === 'tel' ? 'tel' : 'pc');
      if (p.app) s.app++;
      s.ore[oraRoma(now)]++;
      if (loc.paese) piu(s.paesi, loc.paese.slice(0, 3));
      if (loc.luogo) piu(s.luoghi, loc.luogo, 1, LIMITE.luoghi);
    } else if (ev === 'pagina') piu(s.pagine, pag, 1, LIMITE.pagine);
    else if (ev === 'consulta') s.consulta++;
    else if (ev === 'ricerca') { const q = chiave(p.q, 40); if (q.length >= 3) { piu(s.ricerche, q, 1, LIMITE.ricerche); s.ricercheN++; } }
    else if (ev === 'prova') { const v = Number(p.voto); if (v >= 4 && v <= 7.5) { s.prove++; s.provaSomma = Math.round((s.provaSomma + v) * 100) / 100; } }
    else if (ev === 'squadre') s.squadre++;
    else if (ev === 'tempo') { const sec = Math.round(Number(p.sec)); if (sec > 3 && sec < 4 * 3600) { s.tempo += sec; s.tempoN++; } }
    else if (ev === 'installata') s.installazioni++;
    return s;
  });
  return { ok: true };
}

/* inizio dell'anno scolastico (1° settembre) per il periodo «Anno scolastico» */
function inizioAnno(now) { const g = giornoRoma(now), y = Number(g.slice(0, 4)), m = Number(g.slice(5, 7)); return (m >= 9 ? y : y - 1) + '-09-01'; }
const somma = (dst, src) => { Object.keys(src || {}).forEach((k) => { dst[k] = (dst[k] || 0) + (src[k] || 0); }); return dst; };
const top = (m, n) => Object.keys(m).map((k) => [k, m[k]]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it')).slice(0, n);

/* riepilogo per il cruscotto: periodo = 7 | 30 | 'anno'; nomi = { idPagina: nome del glossario } */
async function riepilogo(fdb, periodo, nomi, now) {
  now = now || Date.now();
  const oggi = giornoRoma(now);
  const da = periodo === 'anno' ? inizioAnno(now) : giornoRoma(now - (Number(periodo) - 1) * 86400000);
  const docs = (await fdb.leggiStatistiche(da)).filter((d) => d.giorno >= da && d.giorno <= oggi).sort((a, b) => a.giorno.localeCompare(b.giorno));
  const per = {}; docs.forEach((d) => { per[d.giorno] = d; });
  // serie giorno per giorno, anche i giorni senza visite
  const giorni = [];
  for (let t = Date.parse(da + 'T12:00:00Z'); giornoRoma(t) <= oggi; t += 86400000) {
    const g = giornoRoma(t), d = per[g];
    if (giorni.length && giorni[giorni.length - 1].g === g) continue;
    giorni.push({ g, v: d ? d.visite || 0 : 0, u: d ? Object.keys(d.vid || {}).length : 0 });
  }
  const T = { vid: {}, pagine: {}, da: {}, disp: {}, luoghi: {}, paesi: {}, ricerche: {}, ore: Array(24).fill(0) };
  let visite = 0, app = 0, consulta = 0, prove = 0, provaSomma = 0, squadre = 0, tempo = 0, tempoN = 0, installazioni = 0, ricercheN = 0;
  docs.forEach((d) => {
    visite += d.visite || 0; app += d.app || 0; consulta += d.consulta || 0; prove += d.prove || 0; provaSomma += d.provaSomma || 0; squadre += d.squadre || 0;
    tempo += d.tempo || 0; tempoN += d.tempoN || 0; installazioni += d.installazioni || 0; ricercheN += d.ricercheN || 0;
    ['vid', 'pagine', 'da', 'disp', 'luoghi', 'paesi', 'ricerche'].forEach((k) => somma(T[k], d[k]));
    (d.ore || []).forEach((n, i) => { if (i < 24) T.ore[i] += n || 0; });
  });
  const it = T.paesi.IT || 0, tuttiPaesi = Object.values(T.paesi).reduce((a, b) => a + b, 0);
  const luoghi = top(T.luoghi, 9), altriLuoghi = Object.values(T.luoghi).reduce((a, b) => a + b, 0) - luoghi.reduce((a, x) => a + x[1], 0);
  const pagine = top(T.pagine, 12).map(([id, n]) => ({ id, nome: id === 'home' ? 'Home dei glossari' : (nomi && nomi[id]) || id, n }));
  return {
    periodo: periodo === 'anno' ? 'anno' : Number(periodo), da, oggi, aggiornato: new Date(now).toISOString(),
    giorni, visite, unici: Object.keys(T.vid).length, oggiVisite: per[oggi] ? per[oggi].visite || 0 : 0,
    tempoMedio: tempoN ? Math.round(tempo / tempoN) : 0,
    da_: T.da, disp: T.disp, app, installazioni, ore: T.ore,
    pagine, luoghi, altriLuoghi, italia: it, estero: tuttiPaesi - it, conLuogo: Object.values(T.luoghi).reduce((a, b) => a + b, 0),
    consulta, prove, mediaProva: prove ? Math.round(provaSomma / prove * 10) / 10 : null, squadre, ricercheN,
    ricerche: top(T.ricerche, 8)
  };
}

module.exports = { registra, riepilogo, luogo, giornoRoma, inizioAnno };
