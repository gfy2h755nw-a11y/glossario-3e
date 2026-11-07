/** Funzione programmata (vedi netlify.toml): ogni sera backup + report su Dropbox. */
const { db } = require('./lib/firestore');
const auto = require('./lib/automatico');
const logica = require('./lib/logica');

exports.handler = async () => {
  try {
    const d = db();
    await logica.migra(d);
    const r = await auto.esegui(d, 'automatico');
    console.log('report automatico:', JSON.stringify(r));
    return { statusCode: 200, body: JSON.stringify(r) };
  } catch (e) {
    console.error('report automatico non riuscito:', e);
    return { statusCode: 500, body: String(e.message || e) };
  }
};
