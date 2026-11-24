/* ---------- consensi privacy digitali (24/11/2026) ----------
   Pagina /consenso: si entra con il codice personale dello studente, si compila e si firma a schermo.
   Il telefono prepara il modulo A4 come immagine (la stessa che diventa il PDF); qui si controlla e si conserva.
   - collezione «consensi» (una per attività): un documento per ogni modulo inviato, con l'immagine A4
   - sull'alunno: «consenso» = riepilogo dell'ultimo modulo (vale l'ultimo) e «consensi_storico» = i precedenti */
const L = require('./logica');

const MAX_IMG = 850000; // ~620 KB di JPEG: un A4 a 150 dpi ne pesa circa 150-250
const MAX_AL_GIORNO = 10;
const err = (m) => L.errore(m);
const pulito = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 80);

function eta(nascitaIso, oggi) {
  const d = new Date(String(nascitaIso) + 'T12:00:00'); if (isNaN(d)) return null;
  let e = oggi.getFullYear() - d.getFullYear(); const m = oggi.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && oggi.getDate() < d.getDate())) e--;
  return e;
}
function intestazione(cfg) {
  const conc = cfg && cfg.concessione;
  return { docente: conc ? conc.docente : 'Prof. Danilo Cerrato', materia: conc ? conc.materia || '' : 'Laboratorio odontotecnico', titolo: conc ? (conc.materia ? 'Glossario di ' + conc.materia : 'Glossario') : 'Glossario odontotecnico',
    scuola: 'IIS «E. Barsanti» · sede Salvetti · Massa (MS)', as: (function () { try { return L.impostazioni(cfg).edizione.as || ''; } catch (e) { return ((cfg && cfg.edizione) || {}).as || ''; } })() };
}
async function alunnoDa(db, codice) {
  const a = await db.alunnoDaCodice(codice);
  if (!a) err('Codice non riconosciuto. Controlla la scheda accessi dello studente: le lettere I e O non ci sono.');
  return a;
}
/* passo 1: dal codice, solo nome abbreviato e classe (mai il nome completo) */
async function cerca(db, { codice }) {
  const a = await alunnoDa(db, codice), cfg = await db.leggiConfig();
  const c = a.consenso || null;
  return Object.assign(intestazione(cfg), { studente: L.nomePubblico(a.nome), classe: L.classeDi(a), ultimo: c ? { si: !!c.si, il: c.il } : null });
}
/* passo 2: invio del modulo firmato */
async function invia(db, p) {
  const a = await alunnoDa(db, p.codice), now = new Date();
  const e = eta(p.nascita, now);
  if (e == null || e < 10 || e > 60) err('Controlla la data di nascita dello studente.');
  const magg = e >= 18;
  if (typeof p.si !== 'boolean') err('Scegli se dare o negare il consenso.');
  const n1 = pulito(p.n1), n2 = pulito(p.n2), luogo = pulito(p.luogo, 60), data = String(p.data || '');
  if (n1.split(' ').length < 2) err(magg ? 'Scrivi nome e cognome dello studente.' : 'Scrivi nome e cognome del genitore.');
  if (!magg && !n2 && !p.unico) err('Serve la firma di entrambi i genitori, oppure la dichiarazione di firma unica.');
  if (luogo.length < 2) err('Scrivi il luogo in cui firmi.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Math.abs(new Date(data + 'T12:00:00') - now) > 40 * 86400000) err('Controlla la data della firma.');
  if (!p.letto) err('Conferma di aver letto l\'informativa.');
  const img = String(p.img || '');
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(img) || img.length < 20000) err('Il modulo non è stato preparato: riprova.');
  if (img.length > MAX_IMG) err('Il modulo è troppo pesante: riprova da un altro telefono o computer.');
  const oggi = now.toISOString().slice(0, 10), storico = Array.isArray(a.consensi_storico) ? a.consensi_storico : [];
  if (storico.concat(a.consenso ? [a.consenso] : []).filter((x) => String(x.il || '').slice(0, 10) === oggi).length >= MAX_AL_GIORNO) err('Oggi per questo studente sono già arrivati molti moduli: riprova domani o chiedi al docente.');
  const ver = /^CP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(p.ver)) ? String(p.ver) : err('Il modulo non è stato preparato: riprova.');
  const nomeS = pulito(p.nomeS);
  if (nomeS.split(' ').length < 2) err('Scrivi nome e cognome dello studente.');
  const doc = a.id + '_' + now.getTime();
  const riep = { si: p.si, il: now.toISOString(), studente: nomeS, chi: magg ? 'studente' : 'genitori', firm: n1 + (n2 ? ', ' + n2 : ''), unico: !magg && !n2, luogo, data, ver, doc };
  await db.scriviConsenso(doc, Object.assign({ alunno: a.id, nascita: String(p.nascita), img }, riep));
  await db.scriviAlunno(a.id, { consenso: riep, consensi_storico: (a.consenso ? storico.concat([a.consenso]) : storico).slice(-20) });
  // il nome compare (cartelloni e pagina web) solo con il consenso firmato: elenco dei nomi ammessi, aggiornato a ogni modulo
  const cfg = await db.leggiConfig(), prima = Array.isArray(cfg && cfg.privacy_ok) ? cfg.privacy_ok : [];
  const dopo = prima.filter((x) => x.id !== a.id).concat(p.si ? [{ id: a.id, nome: L.nomePubblico(a.nome) }] : []);
  if (JSON.stringify(dopo) !== JSON.stringify(prima)) await db.scriviConfig({ privacy_ok: dopo });
  return { studente: L.nomePubblico(a.nome), si: p.si, ver, il: riep.il };
}
/* docente: l'immagine A4 di un modulo (l'ultimo dello studente, o uno dello storico) */
async function immagine(db, { codice, alunno, doc }) {
  const stato = await db.leggiTutto(), chi = L.identifica(stato, codice);
  if (chi.ruolo !== 'docente') err('Operazione riservata ai docenti.');
  const P = chi.permessi || {};
  if (!chi.admin && !P.studenti && !P.documenti) err('Il prof. Cerrato non ti ha dato questa facoltà.');
  const a = stato.alunni.find((x) => x.id === alunno); if (!a) err('Studente non trovato.');
  const voci = (a.consensi_storico || []).concat(a.consenso ? [a.consenso] : []);
  const v = doc ? voci.find((x) => x.doc === doc) : a.consenso;
  if (!v) err('Per questo studente non è arrivato nessun modulo.');
  const d = await db.leggiConsenso(v.doc); if (!d) err('Modulo non trovato.');
  return { alunno: a.id, nome: a.nome, img: d.img, consenso: v };
}
module.exports = { cerca, invia, immagine, eta };
