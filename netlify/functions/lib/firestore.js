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

const COL = { config: 'config', alunni: 'alunni', termini: 'termini', attivita: 'attivita', segreti: 'segreti' };
const docs = (snap) => snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => a.id.localeCompare(b.id));

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
    async aggiungiAlunni(alunni) {
      const batch = f.batch();
      alunni.forEach((a) => { const { id, ...r } = a; batch.set(f.collection(COL.alunni).doc(id), r, { merge: true }); });
      await batch.commit();
    },
    async aggiungiTermini(termini) {
      for (let i = 0; i < termini.length; i += 400) {
        const batch = f.batch();
        termini.slice(i, i + 400).forEach((t) => { const { id, ...r } = t; batch.set(f.collection(COL.termini).doc(id), r); });
        await batch.commit();
      }
    },
    async esisteGlossario() { return (await cfgRef.get()).exists; },
    async creaGlossario(config, alunni, termini) {
      const batch = f.batch();
      batch.set(cfgRef, config);
      alunni.forEach((a) => { const { id, ...r } = a; batch.set(f.collection(COL.alunni).doc(id), r); });
      termini.forEach((t) => { const { id, ...r } = t; batch.set(f.collection(COL.termini).doc(id), r); });
      await batch.commit();
    },
    /* ---- registro attività ---- */
    async alunnoDaCodice(codice) {
      const q = await f.collection(COL.alunni).where('codice', '==', String(codice || '').trim().toUpperCase()).limit(1).get();
      return q.docs.length ? Object.assign({ id: q.docs[0].id }, q.docs[0].data()) : null;
    },
    async registraAttivita(id, aggiorna) {
      const ref = f.collection(COL.attivita).doc(String(id));
      await f.runTransaction(async (tx) => { const s = await tx.get(ref); tx.set(ref, aggiorna(s.exists ? s.data() : null)); });
    },
    async leggiAttivita() {
      const out = {}; docs(await f.collection(COL.attivita).get()).forEach((d) => { const { id, ...r } = d; out[id] = r; }); return out;
    },
    /* ---- segreti (token Dropbox): mai inviati al browser ---- */
    async leggiSegreto(nome) { const s = await f.collection(COL.segreti).doc(nome).get(); return s.exists ? s.data() : null; },
    async scriviSegreto(nome, mod) { await f.collection(COL.segreti).doc(nome).set(mod, { merge: true }); },
    async cancellaSegreto(nome) { await f.collection(COL.segreti).doc(nome).delete(); },
    /* ---- backup completo e ripristino ---- */
    async backupGrezzo() {
      const [c, a, t, at] = await Promise.all([cfgRef.get(), f.collection(COL.alunni).get(), f.collection(COL.termini).get(), f.collection(COL.attivita).get()]);
      return { config: c.exists ? c.data() : null, alunni: docs(a), termini: docs(t), attivita: docs(at) };
    },
    async ripristina(b) {
      const batch = f.batch();
      batch.set(cfgRef, b.config);
      b.alunni.forEach((x) => { const { id, ...r } = x; batch.set(f.collection(COL.alunni).doc(id), r); });
      b.termini.forEach((x) => { const { id, ...r } = x; batch.set(f.collection(COL.termini).doc(id), r); });
      (b.attivita || []).forEach((x) => { const { id, ...r } = x; batch.set(f.collection(COL.attivita).doc(id), r); });
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
