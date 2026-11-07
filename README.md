# Glossario odontotecnico – Classi 3E e 3F

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
| `netlify/functions/lib/dati.js` | Aree, 260 termini (65 per area: 1–40 della 3E, 41–65 della 3F) con le definizioni corrette, nomi degli alunni delle due classi, docenti, tappe, valutazione |
| `netlify/functions/lib/firestore.js` | Collegamento a Firebase Firestore |
| `netlify/functions/lib/attivita.js` | Registro accessi e sessioni degli alunni |
| `netlify/functions/lib/report.js` | Report PDF generato sul server (pdfkit) |
| `netlify/functions/lib/presentazione.js` | Presentazione PowerPoint di riepilogo con grafici nativi (pptxgenjs), solo admin |
| `netlify/functions/lib/dropbox.js`, `lib/automatico.js` | Collegamento Dropbox, backup e invio del report |
| `netlify/functions/report-automatico.js` | Funzione programmata: ogni sera backup + report su Dropbox (orario in `netlify.toml`) |
| `netlify/functions/dropbox.js` | Ritorno da Dropbox dopo l'autorizzazione (`/dropbox`) |
| `firestore.rules` | Regole Firestore: nessun accesso diretto dal browser |

## Variabili d'ambiente su Netlify

- `FIREBASE_SERVICE_ACCOUNT`: il contenuto completo del file JSON della chiave dell'account di servizio Firebase.
- `SETUP_KEY`: una parola d'ordine a scelta, chiesta da `setup.html`.
- `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`: chiavi dell'app creata su dropbox.com/developers (cartella dell'app, permesso `files.content.write`, redirect URI `https://<sito>/dropbox`).

## Dati in Firestore

- `config/main`: `chiusa`, `docenti` (lista di `{nome, codice}`), `lingue` (`['it']`), `classi` (`['3E','3F']`), `partenza` (data ISO o `null`: prima della partenza gli alunni vedono solo il conto alla rovescia), `scadenze`, `proposta` (A = −0,25, B = −0,50), `giorniIt`, `versioneDati`
- `alunni/A01…A16` (3E, `gruppo` 1–4 = area) e `alunni/F01…F10` (3F, `gruppo` F, termini di tutte le aree): `nome`, `gruppo`, `classe`, `codice`
- `attivita/A01…A16`: `sessioni` (`inizio`, `fine`, `n` segnali, `disp`), `accessi`, `risposte`, `primo`, `ultimo`
- `segreti/dropbox`: token di lunga durata e stato dell'ultimo invio (mai inviato al browser)
- `termini/T101…T465`: `area`, `termine_it`, `termine_en`, `alunno_id`, `aggiornato` e, per `_it` e `_en`: `scelta` (indice della definizione scelta), `stato`, `commento`, `tent`, `primo_ok`, `scartate`, `da` (docente che ha approvato)

Modalità: ogni alunno sceglie la definizione giusta tra 8 alternative (la corretta + 7 definizioni di termini vicini della stessa area). Le risposte giuste non vengono mai inviate al browser degli alunni.

Date delle tappe, nomi, gruppi e codici si possono modificare direttamente dalla console Firebase: valgono subito.

## Due classi (versione dati 3)

- Partenza unica per 3E e 3F, fissata dal docente admin in «Partenza, scadenza e valutazione»; finché è vuota o futura gli alunni vedono il conto alla rovescia e non possono rispondere.
- Scadenza unica (20 novembre 23:59), 10 termini a testa, voto massimo 7,5 (erede 9,5), proposta B (−0,50) per default.
- Nell'area docenti un filtro «Classe» vale per revisione, panoramica, tabellone, attività, codici, report e presentazione PowerPoint.
- Schede A4 con QR per classe (area admin › Codici personali): una pagina per alunno con link, codice, partenza, scadenza e i suoi 10 termini.
- Cartelloni: 65 termini per area su tre colonne, autori divisi per classe.
- Aggiornamento automatico: al primo accesso dopo il caricamento (`migra` in `logica.js`) un database "solo 3E" riceve la classe sugli alunni, i 10 alunni della 3F con codici nuovi, i 100 termini nuovi, proposta B e partenza vuota. Risposte e codici esistenti restano.

## Esclusione e riassegnazione

Dopo una scadenza, al primo accesso (login o risposta) la funzione `manutenzione` in `logica.js`:
1. segna come esclusi gli alunni con termini senza risposta (campo `esclusione` in `alunni`, permanente salvo `riammesso`);
2. passa i loro termini, azzerati, a un compagno **della stessa classe** estratto a sorte tra i non esclusi che non hanno già ricevuto termini (`ereditati`);
3. imposta sui termini `ereditato`, `alunno_orig`, `scad_it` e `scad_en` (giorni da `EREDITA` in `dati.js`, modificabili dall'app).

Chi riceve termini ha voto massimo `votoMaxErede` (9,5) invece di `votoMax` (7,5): valori in `VALUTAZIONE` in `dati.js`.

Se chi ha ricevuto i termini non risponde entro `scad_it`/`scad_en`, non viene escluso: si registra `tetto` sull'alunno e il voto finale diventa `min(voto calcolato, 6)` (`tettoEredeInRitardo` in `dati.js`). I termini ricevuti si possono completare anche in ritardo, per il cartellone.

## Registro attività, backup e report

L'app manda un segnale al minuto mentre è aperta e in primo piano sul dispositivo di un alunno (`presenza`), oltre a login e risposte: una pausa di più di 10 minuti chiude la sessione. Il tempo indicato è quindi il tempo con l'app aperta, non necessariamente di lavoro effettivo.

Ogni giorno alle 23:59 (`schedule` in `netlify.toml`, orario UTC) la funzione `report-automatico` carica nella cartella dell'app su Dropbox:
- `Backup/glossario-3e_backup_AAAA-MM-GG_HHMM.json`: copia completa del database, ripristinabile dall'app (area admin › Ripristina da backup);
- `Report/Report_Glossario_3E_AAAA-MM-GG_HHMM.pdf` e `Report_ULTIMO.pdf`: sintesi della classe, situazioni da tenere d'occhio, una pagina per alunno con voti, termini, tentativi e sessioni.
