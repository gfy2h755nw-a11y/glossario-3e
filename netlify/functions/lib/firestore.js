/** Adattatore Firestore (firebase-admin) per la logica del glossario. */
const admin = require('firebase-admin');
const CAT = require('./catalogo');

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

const COL = { config: 'config', alunni: 'alunni', termini: 'termini', attivita: 'attivita', segreti: 'segreti', archivio: 'archivio', parti: 'archivio_parti' };
const PARTE = 300000; // caratteri per documento: anche con caratteri a 3 byte resta sotto il limite Firestore di 1 MiB
const docs = (snap) => snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => a.id.localeCompare(b.id));

function compone(cfgSnap, aluSnap, terSnap) {
  if (!cfgSnap.exists) throw Object.assign(new Error('Glossario non ancora configurato: apri la pagina /setup.html.'), { utente: true });
  const alunni = aluSnap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => a.id.localeCompare(b.id));
  const termini = terSnap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => a.id.localeCompare(b.id));
  const config = cfgSnap.data();
  CAT.imposta(config); // catalogo dei termini dell'edizione in corso
  return { config, alunni, termini };
}

function db() {
  const f = firestore();
  const cfgRef = f.collection(COL.config).doc('main');
  return {
    async leggiTutto() {
      const [c, a, t] = await Promise.all([cfgRef.get(), f.collection(COL.alunni).get(), f.collection(COL.termini).get()]);
      return compone(c, a, t);
    },
    async leggiConfig() { const c = await cfgRef.get(); if (c.exists) CAT.imposta(c.data()); return c.exists ? c.data() : null; },
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
    async backupGrezzo(conArchivio) {
      const [c, a, t, at] = await Promise.all([cfgRef.get(), f.collection(COL.alunni).get(), f.collection(COL.termini).get(), f.collection(COL.attivita).get()]);
      if (c.exists) CAT.imposta(c.data());
      const out = { config: c.exists ? c.data() : null, alunni: docs(a), termini: docs(t), attivita: docs(at) };
      if (conArchivio) {
        const [m, p] = await Promise.all([f.collection(COL.archivio).get(), f.collection(COL.parti).get()]);
        out.archivio = docs(m); out.archivio_parti = docs(p);
      }
      return out;
    },
    /* sostituisce config, alunni, termini e attività (e, se presenti nel backup, l'archivio): i documenti che non ci sono più vengono cancellati.
       Scritture a gruppi di 400 (limite Firestore: 500 per gruppo). I segreti (Dropbox) non si toccano. */
    async sostituisciTutto(b) {
      const ops = [];
      const insiemi = [[COL.alunni, b.alunni], [COL.termini, b.termini], [COL.attivita, b.attivita || []]];
      if (Array.isArray(b.archivio)) insiemi.push([COL.archivio, b.archivio], [COL.parti, b.archivio_parti || []]);
      for (const [col, elenco] of insiemi) {
        // l'archivio non si cancella mai: un backup vecchio non deve far sparire edizioni archiviate dopo
        if (col !== COL.archivio && col !== COL.parti) {
          const esistenti = (await f.collection(col).get()).docs.map((d) => d.id), nuovi = new Set(elenco.map((x) => String(x.id)));
          esistenti.filter((id) => !nuovi.has(id)).forEach((id) => ops.push(['del', f.collection(col).doc(id)]));
        }
        elenco.forEach((x) => { const { id, ...r } = x; ops.push(['set', f.collection(col).doc(String(id)), r]); });
      }
      ops.push(['set', cfgRef, b.config]);
      for (let i = 0; i < ops.length; i += 400) {
        const batch = f.batch();
        ops.slice(i, i + 400).forEach(([tipo, ref, d]) => (tipo === 'del' ? batch.delete(ref) : batch.set(ref, d)));
        await batch.commit();
      }
      CAT.imposta(b.config);
    },
    async ripristina(b) { return this.sostituisciTutto(b); },
    /* ---- archivio delle edizioni concluse ---- */
    async leggiArchivi() { return docs(await f.collection(COL.archivio).get()); },
    async leggiArchivioMeta(id) { const d = await f.collection(COL.archivio).doc(String(id)).get(); return d.exists ? Object.assign({ id: d.id }, d.data()) : null; },
    async scriviArchivio(meta, testo) {
      const n = Math.max(1, Math.ceil(testo.length / PARTE)), { id, ...m } = meta;
      const vecchie = (await f.collection(COL.parti).where('ed', '==', String(id)).get()).docs.map((d) => d.id);
      const batch = f.batch();
      vecchie.forEach((pid) => batch.delete(f.collection(COL.parti).doc(pid)));
      for (let k = 0; k < n; k++) batch.set(f.collection(COL.parti).doc(id + '_' + k), { ed: String(id), k, dati: testo.slice(k * PARTE, (k + 1) * PARTE) });
      batch.set(f.collection(COL.archivio).doc(String(id)), Object.assign(m, { parti: n, dimensione: testo.length }));
      await batch.commit();
    },
    async leggiArchivioDati(id) {
      const q = await f.collection(COL.parti).where('ed', '==', String(id)).get();
      if (!q.docs.length) return null;
      return JSON.parse(q.docs.map((d) => d.data()).sort((x, y) => x.k - y.k).map((x) => x.dati).join(''));
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
