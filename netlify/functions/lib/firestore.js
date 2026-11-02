/** Adattatore Firestore (firebase-admin) per la logica del glossario. */
const admin = require('firebase-admin');

let fs = null;
function firestore() {
  if (fs) return fs;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('Variabile FIREBASE_SERVICE_ACCOUNT non impostata su Netlify.');
  let cred;
  try { cred = JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')); }
  catch (e) { throw new Error('FIREBASE_SERVICE_ACCOUNT non è un JSON valido: incolla l\'intero file della chiave.'); }
  if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, '\n');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(cred) });
  fs = admin.firestore();
  return fs;
}

const COL = { config: 'config', alunni: 'alunni', termini: 'termini' };

function compone(cfgSnap, aluSnap, terSnap) {
  if (!cfgSnap.exists) throw Object.assign(new Error('Glossario non ancora configurato: apri la pagina /setup.html.'), { utente: true });
  const alunni = aluSnap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => a.id.localeCompare(b.id));
  const termini = terSnap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => a.id.localeCompare(b.id));
  return { config: cfgSnap.data(), alunni, termini };
}

function db() {
  const f = firestore();
  const cfgRef = f.collection(COL.config).doc('main');
  return {
    async leggiTutto() {
      const [c, a, t] = await Promise.all([cfgRef.get(), f.collection(COL.alunni).get(), f.collection(COL.termini).get()]);
      return compone(c, a, t);
    },
    async leggiConfig() { const c = await cfgRef.get(); return c.exists ? c.data() : null; },
    async scriviConfig(mod) { await cfgRef.set(mod, { merge: true }); },
    async scriviAlunno(id, mod) { await f.collection(COL.alunni).doc(String(id)).set(mod, { merge: true }); },
    async esisteGlossario() { return (await cfgRef.get()).exists; },
    async creaGlossario(config, alunni, termini) {
      const batch = f.batch();
      batch.set(cfgRef, config);
      alunni.forEach((a) => { const { id, ...r } = a; batch.set(f.collection(COL.alunni).doc(id), r); });
      termini.forEach((t) => { const { id, ...r } = t; batch.set(f.collection(COL.termini).doc(id), r); });
      await batch.commit();
    },
    async transazione(fn) {
      return f.runTransaction(async (tx) => {
        const scritture = [];
        const ctx = {
          async leggiTutto() {
            const [c, a, t] = await Promise.all([tx.get(cfgRef), tx.get(f.collection(COL.alunni)), tx.get(f.collection(COL.termini))]);
            return compone(c, a, t);
          },
          // lettura leggera: config + alunni + un solo termine (≈18 letture invece di ≈97)
          async leggiTermine(id) {
            const [c, a, t] = await Promise.all([tx.get(cfgRef), tx.get(f.collection(COL.alunni)), tx.get(f.collection(COL.termini).doc(String(id)))]);
            const st = compone(c, a, { docs: [] });
            if (t.exists) st.termini = [Object.assign({ id: t.id }, t.data())];
            return st;
          },
          scriviTermine(id, mod) { scritture.push([f.collection(COL.termini).doc(id), mod]); },
          scriviAlunno(id, mod) { scritture.push([f.collection(COL.alunni).doc(String(id)), mod, true]); }
        };
        const r = await fn(ctx);
        scritture.forEach(([ref, mod, unisci]) => (unisci ? tx.set(ref, mod, { merge: true }) : tx.update(ref, mod)));
        return r;
      });
    }
  };
}

module.exports = { db };
