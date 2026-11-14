/**
 * Controllo delle somiglianze tra termini: serve a non riproporre in un'edizione nuova
 * termini già usati (anche scritti in modo diverso, al singolare/plurale o con sinonimi).
 */
const STOP = new Set(['di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
  'del', 'dello', 'della', 'dei', 'degli', 'delle', 'al', 'allo', 'alla', 'ai', 'agli', 'alle', 'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle', 'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle', 'e', 'ed', 'o', 'd', 'l', 'che', 'come']);
const NEGAZIONI = new Set(['non', 'senza', 'anti', 'semi', 'pre', 'post', 'auto', 'termo', 'foto']);
// gruppi di espressioni equivalenti (già normalizzate con la funzione chiave)
const SINONIMI_TESTO = [
  ['terzo molare', 'dente del giudizio'],
  ['articolazione temporo mandibolare', 'atm'],
  ['zirconia', 'ossido di zirconio', 'zirconio'],
  ['lega cromo cobalto', 'lega cocr', 'lega co cr', 'cromo cobalto', 'lega di cromo cobalto'],
  ['dente deciduo', 'dente da latte', 'dente temporaneo'],
  ['dente permanente', 'dente definitivo'],
  ['dentatura decidua', 'dentatura da latte', 'dentatura temporanea'],
  ['protesi totale', 'dentiera', 'protesi completa'],
  ['scheletrato', 'protesi scheletrica', 'protesi parziale rimovibile', 'scheletrica'],
  ['provvisorio', 'corona provvisoria', 'restauro provvisorio'],
  ['cad cam', 'cadcam'],
  ['muffola', 'cilindro di rivestimento'],
  ['resina acrilica pmma', 'resina acrilica', 'pmma', 'polimetilmetacrilato'],
  ['vaporizzatrice', 'vaporizzatore', 'pulitrice a vapore', 'vaporiera'],
  ['sabbiatrice', 'sabbiatore'],
  ['piano occlusale', 'piano di occlusione'],
  ['dimensione verticale', 'dimensione verticale di occlusione', 'dvo'],
  ['relazione centrica', 'centrica'],
  ['massima intercuspidazione', 'intercuspidazione massima', 'occlusione abituale', 'mic'],
  ['sovrapposizione orizzontale', 'overjet'],
  ['sovrapposizione verticale', 'overbite'],
  ['colletto', 'linea cervicale'],
  ['ossido di alluminio', 'allumina', 'corindone'],
  ['cera collante', 'cera adesiva'],
  ['cera da modellazione', 'cera modellante', 'cera per modellare'],
  ['stampante 3d', 'stampante tridimensionale'],
  ['scanner da laboratorio', 'scanner desktop', 'scanner da banco'],
  ['micromotore', 'motore da laboratorio'],
  ['fresatore cnc', 'fresatrice', 'fresatore'],
  ['placca occlusale', 'bite', 'bite occlusale'],
  ['bruxismo', 'digrignamento'],
  ['disfunzione temporo mandibolare', 'dtm', 'disturbo temporo mandibolare'],
  ['moncone sfilabile', 'moncone smontabile'],
  ['perno di colata', 'canale di colata'],
  ['impronta', 'calco'],
  ['dispositivi di protezione individuale', 'dpi'],
  ['placca batterica', 'biofilm dentale', 'biofilm'],
  ['tartaro', 'calcolo dentale'],
  ['palato duro', 'volta palatina'],
  ['linea vibrante', 'linea a', 'linea ah'],
  ['vallo in cera', 'vallo occlusale', 'valli di cera'],
  ['cucchiaio individuale', 'portaimpronta individuale'],
  ['silicone per addizione', 'polivinilsilossano', 'vps'],
  ['gesso extraduro', 'gesso di tipo iv', 'gesso classe 4'],
  ['gesso duro', 'gesso di tipo iii', 'gesso classe 3'],
  ['gesso di tipo ii', 'gesso alabastrino', 'gesso classe 2']
];

function parole(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}
// radice semplice: toglie le desinenze più comuni (singolare/plurale, maschile/femminile)
function radice(w) {
  if (w.length <= 4) return w;
  return w.replace(/(azione|azioni|mento|menti|amento|amenti|ale|ali|ici|ico|ica|iche|ari|ario|aria|arie)$/, '').replace(/[aeio]$/, '') || w;
}
function gettoni(s) { return parole(s).filter((w) => !STOP.has(w)).map(radice); }
function chiave(s) { return gettoni(s).slice().sort().join(' '); }

const SINONIMI = new Map();
SINONIMI_TESTO.forEach((g, i) => g.forEach((x) => SINONIMI.set(chiave(x), i)));

function jaccard(a, b) {
  const A = new Set(a), B = new Set(b); if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((x) => { if (B.has(x)) inter++; });
  return inter / (A.size + B.size - inter);
}

/* Due termini sono "simili" se: uguali dopo la normalizzazione, sinonimi, quasi tutte le parole in comune
   o uno contiene tutte le parole (almeno due) dell'altro. Le negazioni (non, senza, ...) li distinguono. */
function confronta(t1, t2) {
  const k1 = chiave(t1), k2 = chiave(t2);
  if (!k1 || !k2) return null;
  if (k1 === k2) return 'stesso termine';
  if (SINONIMI.has(k1) && SINONIMI.get(k1) === SINONIMI.get(k2)) return 'sinonimo';
  const g1 = gettoni(t1), g2 = gettoni(t2);
  const diff = g1.filter((x) => g2.indexOf(x) < 0).concat(g2.filter((x) => g1.indexOf(x) < 0));
  if (diff.some((x) => NEGAZIONI.has(x))) return null;
  const j = jaccard(g1, g2);
  if (j >= 0.75) return 'quasi uguale';
  const [corto, lungo] = g1.length <= g2.length ? [g1, g2] : [g2, g1];
  // "Arco facciale" e "Arco facciale di trasferimento": stesse parole più una sola in aggiunta
  if (corto.length >= 2 && lungo.length - corto.length <= 1 && corto.every((x) => lungo.indexOf(x) >= 0)) return 'contenuto nell\'altro';
  return null;
}
function defSimili(d1, d2) {
  if (!d1 || !d2) return false;
  const g1 = gettoni(d1).filter((x) => x.length > 3), g2 = gettoni(d2).filter((x) => x.length > 3);
  return g1.length >= 5 && g2.length >= 5 && jaccard(g1, g2) >= 0.6;
}

/* cerca in un elenco [{termine, def, dove}] il primo elemento simile a (termine, def) */
function trovaSimile(termine, def, elenco) {
  for (const x of elenco) {
    const m = confronta(termine, x.termine);
    if (m) return { termine: x.termine, dove: x.dove || '', motivo: m };
    if (def && defSimili(def, x.def)) return { termine: x.termine, dove: x.dove || '', motivo: 'definizione quasi uguale' };
  }
  return null;
}

module.exports = { confronta, defSimili, trovaSimile, chiave, gettoni };
