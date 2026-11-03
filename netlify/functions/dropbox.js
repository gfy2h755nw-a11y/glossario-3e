/** Ritorno da Dropbox dopo l'autorizzazione (GET /dropbox?code=…&state=…). */
const { db } = require('./lib/firestore');
const DBX = require('./lib/dropbox');

const pagina = (titolo, testo, ok) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  body: '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titolo + '</title>' +
    '<style>body{font-family:Arial,sans-serif;background:#F2F5F7;color:#15212B;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px}' +
    '.c{background:#fff;border-radius:12px;padding:28px;max-width:460px;box-shadow:0 2px 12px rgba(0,0,0,.08)}h1{font-size:22px;margin:0 0 10px;color:' + (ok ? '#1B6E20' : '#B0304A') + '}a{display:inline-block;margin-top:16px;background:#15212B;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none}</style></head>' +
    '<body><div class="c"><h1>' + titolo + '</h1><p>' + testo + '</p><a href="/">Torna al glossario</a></div></body></html>'
});
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  if (q.error) return pagina('Collegamento annullato', 'Dropbox non è stato collegato (' + esc(q.error_description || q.error) + ').', false);
  if (!q.code || !q.state) return pagina('Richiesta non valida', 'Avvia il collegamento dal pulsante "Collega Dropbox" nell\'area docenti.', false);
  try {
    await DBX.completaCollegamento(db(), q.code, q.state);
    return pagina('Dropbox collegato', 'Da stasera il backup e il report arriveranno da soli nella cartella <b>App › (nome della tua app)</b> del tuo Dropbox. Puoi provare subito con "Invia ora" nell\'area docenti.', true);
  } catch (e) {
    console.error(e);
    return pagina('Collegamento non riuscito', esc(e.message || e), false);
  }
};
