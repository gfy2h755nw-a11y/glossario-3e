/**
 * Regole di valutazione di un'attività: scritto, quiz, interrogazione, voto finale.
 * L'attività 3E-3F usa i valori di sempre; un'attività nuova può fissare i suoi (config.regole), validati qui.
 */
const DATI = require('./dati');

const V = DATI.VALUTAZIONE;
const DEF = {
  // penalita: null = quella della proposta (A 0,25 · B 0,5)
  scritto: { votoMax: V.votoMax, votoMaxErede: V.votoMaxErede, votoMin: V.votoMin, votoEsclusione: V.votoEsclusione, tetto: V.tettoEredeInRitardo, penalita: null },
  quiz: { secondi: 60, opzioni: 4, passo: 5 },
  orale: { domande: 10, base: 3, passo: 0.5, passoEsclusi: 0.25 },
  // peso dello scritto nel voto finale, in percentuale (il resto è l'orale)
  finale: { pesoScritto: 50 }
};

function di(config) {
  const r = (config && config.regole) || {}, out = {};
  Object.keys(DEF).forEach((k) => { out[k] = Object.assign({}, DEF[k], r[k] || {}); });
  // valori ricavati, comodi per testi e calcoli
  out.orale.max = Math.round((out.orale.base + out.orale.passo * out.orale.domande) * 1000) / 1000;
  out.orale.maxEsclusi = Math.round((out.orale.base + out.orale.passoEsclusi * out.orale.domande) * 1000) / 1000;
  return out;
}

class ErroreRegole extends Error {}
const err = (m) => { throw Object.assign(new ErroreRegole(m), { utente: true }); };
function num(v, min, max, passo, nome) {
  const n = Number(String(v).replace(',', '.'));
  if (!isFinite(n) || n < min || n > max) err(nome + ': da ' + String(min).replace('.', ',') + ' a ' + String(max).replace('.', ',') + '.');
  if (passo && Math.abs(Math.round(n / passo) * passo - n) > 1e-9) err(nome + ': usa multipli di ' + String(passo).replace('.', ',') + '.');
  return n;
}
/* regole scritte dal docente nella procedura «Nuova attività» */
function valida(r) {
  r = r || {};
  const s = r.scritto || {}, q = r.quiz || {}, o = r.orale || {}, f = r.finale || {};
  const out = { scritto: {}, quiz: {}, orale: {}, finale: {} };
  const sc = out.scritto;
  sc.votoMax = num(s.votoMax != null ? s.votoMax : DEF.scritto.votoMax, 1, 10, 0.25, 'Voto massimo dello scritto');
  sc.votoMaxErede = num(s.votoMaxErede != null ? s.votoMaxErede : Math.max(sc.votoMax, DEF.scritto.votoMaxErede), sc.votoMax, 10, 0.25, 'Voto massimo con termini ricevuti');
  sc.votoMin = num(s.votoMin != null ? s.votoMin : DEF.scritto.votoMin, 1, sc.votoMax, 0.25, 'Voto minimo dello scritto');
  sc.votoEsclusione = num(s.votoEsclusione != null ? s.votoEsclusione : DEF.scritto.votoEsclusione, 1, 10, 0.25, 'Voto per mancata consegna');
  sc.tetto = num(s.tetto != null ? s.tetto : DEF.scritto.tetto, 1, 10, 0.25, 'Tetto per i termini ricevuti in ritardo');
  sc.penalita = num(s.penalita != null ? s.penalita : 0.5, 0, 3, 0.05, 'Punti tolti per ogni errore');
  const qz = out.quiz;
  qz.secondi = num(q.secondi != null ? q.secondi : DEF.quiz.secondi, 10, 300, 1, 'Secondi per rispondere nel quiz');
  qz.opzioni = num(q.opzioni != null ? q.opzioni : DEF.quiz.opzioni, 2, 6, 1, 'Definizioni proposte nel quiz');
  qz.passo = num(q.passo != null ? q.passo : DEF.quiz.passo, 0, 50, 1, 'Termini persi a ogni errore');
  const or = out.orale;
  or.domande = num(o.domande != null ? o.domande : DEF.orale.domande, 1, 40, 1, 'Termini dell\'interrogazione');
  or.base = num(o.base != null ? o.base : DEF.orale.base, 0, 10, 0.25, 'Voto di partenza dell\'interrogazione');
  or.passo = num(o.passo != null ? o.passo : DEF.orale.passo, 0.05, 5, 0.05, 'Valore di un punto');
  or.passoEsclusi = num(o.passoEsclusi != null ? o.passoEsclusi : DEF.orale.passoEsclusi, 0, 5, 0.05, 'Valore di un punto per chi non ha consegnato');
  if (or.base + or.passo * or.domande > 10 + 1e-9) err('Interrogazione: con ' + or.domande + ' termini, partenza ' + String(or.base).replace('.', ',') + ' e ' + String(or.passo).replace('.', ',') + ' per punto si supera il 10.');
  if (or.passoEsclusi > or.passo) err('Il punto di chi non ha consegnato non può valere più del punto normale.');
  out.finale.pesoScritto = num(f.pesoScritto != null ? f.pesoScritto : DEF.finale.pesoScritto, 0, 100, 5, 'Peso dello scritto nel voto finale');
  return out;
}

const fmt = (n) => String(Math.round(n * 1000) / 1000).replace('.', ',');
module.exports = { DEF, di, valida, fmt };
