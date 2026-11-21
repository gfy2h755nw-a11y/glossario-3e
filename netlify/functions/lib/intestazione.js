/* Intestazioni dei documenti: nelle attività preparate per un collega compaiono il suo nome e la sua materia,
 * con la dicitura di concessione; nelle altre il prof. Cerrato e il laboratorio odontotecnico. */
const CONCESSIONE = 'Per gentile concessione del Prof. Danilo Cerrato';
const conc = (cfg) => (cfg && cfg.concessione) || null;
const materia = (cfg) => (conc(cfg) ? conc(cfg).materia || '' : 'Laboratorio odontotecnico');
const titolo = (cfg) => (conc(cfg) ? (conc(cfg).materia ? 'Glossario di ' + conc(cfg).materia : 'Glossario') : 'Glossario odontotecnico');
const docente = (cfg) => (conc(cfg) ? conc(cfg).docente : 'Prof. Danilo Cerrato');
/* «Prof. X · Materia» più la dicitura, se serve */
const firma = (cfg, sep) => docente(cfg) + (materia(cfg) ? (sep || ' · ') + materia(cfg) : '') + (conc(cfg) ? ' · ' + CONCESSIONE : '');
module.exports = { CONCESSIONE, conc, materia, titolo, docente, firma };
