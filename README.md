# Glossario odontotecnico bilingue – Classe 3E

IIS "L. Barsanti" – Plesso Salvetti, Massa · a.s. 2026/27
Laboratorio odontotecnico (prof. Danilo Cerrato) · Inglese tecnico (prof.ssa Federica Aliboni)

## Struttura

| Percorso | Cosa contiene |
|---|---|
| `public/index.html` | L'app (alunni e docenti) con l'anteprima del cartellone 70×100. È generata da `src/` con `python3 build.py` |
| `src/` | Sorgenti della pagina: `app.js`, `poster.js`, `stile.css` |
| `public/setup.html` | Configurazione iniziale, da usare una sola volta |
| `netlify/functions/api.js` | Funzione Netlify: unico accesso al database |
| `netlify/functions/lib/logica.js` | Regole: chi può scrivere cosa, stati, limiti |
| `netlify/functions/lib/dati.js` | Aree, 80 termini IT/EN, 80 definizioni corrette IT/EN, nomi degli alunni, docenti, tappe |
| `netlify/functions/lib/firestore.js` | Collegamento a Firebase Firestore |
| `firestore.rules` | Regole Firestore: nessun accesso diretto dal browser |

## Variabili d'ambiente su Netlify

- `FIREBASE_SERVICE_ACCOUNT`: il contenuto completo del file JSON della chiave dell'account di servizio Firebase.
- `SETUP_KEY`: una parola d'ordine a scelta, chiesta da `setup.html`.

## Dati in Firestore

- `config/main`: `maxCar`, `chiusa`, `tappe` (lista di `{data, testo}`), `docenti` (lista di `{nome, codice}`)
- `alunni/A01…A16`: `nome`, `gruppo`, `codice`
- `termini/T101…T420`: `area`, `termine_it`, `termine_en`, `alunno_id`, `aggiornato` e, per `_it` e `_en`: `scelta` (indice della definizione scelta), `stato`, `commento`, `tent`, `primo_ok`, `scartate`, `da` (docente che ha approvato)

Modalità: ogni alunno sceglie la definizione giusta tra 8 alternative (la corretta + 7 definizioni di termini vicini della stessa area). Le risposte giuste non vengono mai inviate al browser degli alunni.

Date delle tappe, nomi, gruppi e codici si possono modificare direttamente dalla console Firebase: valgono subito.

## Esclusione e riassegnazione

Dopo una scadenza, al primo accesso (login o risposta) la funzione `manutenzione` in `logica.js`:
1. segna come esclusi gli alunni con termini senza risposta (campo `esclusione` in `alunni`, permanente salvo `riammesso`);
2. passa i loro termini, azzerati, a un compagno estratto a sorte tra i non esclusi che non hanno già ricevuto termini (`ereditati`);
3. imposta sui termini `ereditato`, `alunno_orig`, `scad_it` e `scad_en` (giorni da `EREDITA` in `dati.js`, modificabili dall'app).

Chi riceve termini ha voto massimo `votoMaxErede` (10) invece di `votoMax` (8).

Se chi ha ricevuto i termini non risponde entro `scad_it`/`scad_en`, non viene escluso: si registra `tetto` sull'alunno e il voto finale diventa `min(voto calcolato, 6)` (`tettoEredeInRitardo` in `dati.js`). I termini ricevuti si possono completare anche in ritardo, per il cartellone.
