/**
 * Elenchi pronti di termini e definizioni per le attività con aree proprie.
 * Nella procedura «Nuova attività» il docente sceglie un elenco: aree, colori e termini vengono proposti da qui
 * (come la banca delle 4 aree del laboratorio) e si possono sostituire uno per uno.
 * Ogni area ha qualche termine in più del necessario, per le sostituzioni.
 */
module.exports = {
  'quarta-digitale-protesi-implanto-orto': {
    nome: 'Tecnologie digitali, protesi fissa, implantoprotesi, ortodonzia',
    aree: [{"it": "Tecnologie digitali", "colore": "#2E6DB4"}, {"it": "Protesi fissa", "colore": "#B5532A"}, {"it": "Implantoprotesi", "colore": "#1F8A70"}, {"it": "Ortodonzia", "colore": "#7A4FA0"}],
    termini: {
 "1": [
  [
   "Flusso di lavoro digitale",
   "Sequenza di fasi (acquisizione, progettazione, produzione) con cui il manufatto protesico viene realizzato con strumenti digitali."
  ],
  [
   "Scanner intraorale",
   "Dispositivo che acquisisce direttamente nella bocca del paziente un modello tridimensionale di denti e gengive, al posto dell'impronta tradizionale."
  ],
  [
   "Impronta ottica",
   "Modello virtuale dell'arcata ottenuto con lo scanner, usato al posto dell'impronta in materiale elastomerico."
  ],
  [
   "Nuvola di punti",
   "Insieme di punti con coordinate x, y e z rilevati dallo scanner, da cui il software ricostruisce la superficie."
  ],
  [
   "Mesh",
   "Superficie digitale formata da tanti piccoli triangoli collegati tra loro, ottenuta elaborando la nuvola di punti."
  ],
  [
   "File STL",
   "Formato che descrive la forma di un oggetto 3D come insieme di triangoli, senza colore né texture."
  ],
  [
   "File PLY",
   "Formato 3D che oltre alla forma conserva il colore della superficie, usato dagli scanner a colori."
  ],
  [
   "File OBJ",
   "Formato aperto per modelli 3D che può includere texture e colori, letto dalla maggior parte dei programmi."
  ],
  [
   "Formato aperto",
   "File leggibile da programmi di produttori diversi, che permette di scambiare il lavoro senza vincoli."
  ],
  [
   "Sistema chiuso",
   "Catena digitale in cui scanner, software e macchine dello stesso produttore comunicano solo tra loro."
  ],
  [
   "Software CAD",
   "Programma per progettare al computer corone, ponti e strutture a partire dal modello digitale."
  ],
  [
   "Software CAM",
   "Programma che trasforma il progetto in istruzioni per la macchina, calcolando i percorsi degli utensili."
  ],
  [
   "Libreria di denti",
   "Raccolta di forme dentali digitali da cui il software propone la morfologia da adattare al caso."
  ],
  [
   "Moncone digitale",
   "Porzione del modello virtuale corrispondente al dente preparato, isolata per progettare il restauro."
  ],
  [
   "Tracciatura del margine",
   "Fase in cui sul modello digitale si segna il limite della preparazione dove terminerà il restauro."
  ],
  [
   "Spazio per il cemento",
   "Spessore virtuale lasciato nel progetto tra moncone e restauro per accogliere il cemento."
  ],
  [
   "Blocco dei sottosquadri",
   "Funzione del software che riempie virtualmente le zone sottosquadro rispetto alla direzione di inserimento."
  ],
  [
   "Articolatore virtuale",
   "Simulazione al computer dell'articolatore, che riproduce i movimenti mandibolari sui modelli digitali."
  ],
  [
   "Scansione in occlusione",
   "Acquisizione delle due arcate chiuse, che serve al software per metterle nella corretta relazione."
  ],
  [
   "Allineamento best fit",
   "Procedura con cui il software sovrappone due scansioni facendo coincidere le zone in comune."
  ],
  [
   "Fresatore a cinque assi",
   "Macchina a controllo numerico che muove fresa e pezzo su cinque assi, adatta a forme complesse."
  ],
  [
   "Fresatura a secco",
   "Lavorazione senza liquido di raffreddamento, usata per zirconia presinterizzata, cere e resine."
  ],
  [
   "Fresatura a umido",
   "Lavorazione con liquido di raffreddamento, necessaria per vetroceramiche, titanio e leghe."
  ],
  [
   "Disco di zirconia",
   "Blocco circolare di zirconia presinterizzata da cui il fresatore ricava i restauri."
  ],
  [
   "Blank",
   "Pezzo grezzo di materiale (ceramica, resina o metallo) predisposto per essere fresato."
  ],
  [
   "Fresa CAM",
   "Utensile rotante della macchina che asporta il materiale seguendo il percorso calcolato dal software."
  ],
  [
   "Strategia di fresatura",
   "Insieme di scelte del CAM (utensili, passate, velocità) che determina precisione e tempi della lavorazione."
  ],
  [
   "Nesting",
   "Disposizione di più elementi nello stesso disco o sulla piattaforma di stampa per sfruttare al meglio il materiale."
  ],
  [
   "Connettori di sostegno",
   "Piccoli ponti di materiale che tengono il pezzo attaccato al disco durante la fresatura e poi si tagliano."
  ],
  [
   "Sinterizzazione della zirconia",
   "Trattamento termico in forno che compatta la zirconia presinterizzata fino a densità e durezza finali."
  ],
  [
   "Fattore di ingrandimento",
   "Coefficiente con cui il software ingrandisce il progetto per compensare il ritiro della zirconia in forno."
  ],
  [
   "Forno di sinterizzazione",
   "Forno ad altissima temperatura, intorno ai 1500 gradi, che porta la zirconia alla densità finale."
  ],
  [
   "Manifattura additiva",
   "Produzione in cui l'oggetto viene costruito strato dopo strato a partire dal file digitale."
  ],
  [
   "Manifattura sottrattiva",
   "Produzione in cui l'oggetto viene ricavato togliendo materiale da un blocco pieno, come nella fresatura."
  ],
  [
   "Stereolitografia",
   "Tecnica di stampa che indurisce una resina liquida con un raggio laser, uno strato alla volta."
  ],
  [
   "Stampa DLP",
   "Tecnica in cui un proiettore polimerizza un intero strato di resina con una sola esposizione di luce."
  ],
  [
   "Stampa LCD",
   "Stampa a resina in cui uno schermo a cristalli liquidi lascia passare la luce UV solo dove serve."
  ],
  [
   "Resina fotopolimerizzabile",
   "Materiale liquido che indurisce se esposto a luce di una precisa lunghezza d'onda."
  ],
  [
   "Spessore dello strato",
   "Altezza di ogni strato stampato: più è piccola, più la superficie è liscia, ma la stampa dura di più."
  ],
  [
   "Supporti di stampa",
   "Strutture provvisorie che sostengono le parti sporgenti durante la stampa e che poi si rimuovono."
  ],
  [
   "Orientamento di stampa",
   "Inclinazione del pezzo sulla piattaforma, scelta per precisione, numero di supporti e tempi."
  ],
  [
   "Lavaggio post-stampa",
   "Pulizia del pezzo stampato in alcol isopropilico per eliminare la resina non indurita."
  ],
  [
   "Post-polimerizzazione",
   "Esposizione finale a luce UV e calore che completa l'indurimento del pezzo stampato."
  ],
  [
   "Modello stampato",
   "Riproduzione in resina dell'arcata ottenuta dalla scansione, usata al posto del modello in gesso."
  ],
  [
   "Fusione laser selettiva",
   "Stampa 3D del metallo: un laser fonde strati sottilissimi di polvere di lega, per esempio di cromo-cobalto."
  ],
  [
   "Polvere metallica",
   "Lega ridotta in particelle finissime, usata come materia prima nella fusione laser."
  ],
  [
   "Wax-up digitale",
   "Progettazione al computer della forma finale dei denti, da mostrare al paziente o da trasformare in prova."
  ],
  [
   "Smile design digitale",
   "Studio estetico del sorriso su foto e scansioni del paziente per pianificare forma e posizione dei denti."
  ],
  [
   "Mock-up",
   "Prova in bocca, con resina provvisoria, della forma progettata, per verificarne estetica e funzione."
  ],
  [
   "Paziente virtuale",
   "Insieme di scansioni, foto del volto e radiografie 3D sovrapposte per pianificare il trattamento."
  ],
  [
   "CBCT",
   "Tomografia a fascio conico che fornisce immagini 3D di ossa e denti con una dose ridotta di radiazioni."
  ],
  [
   "File DICOM",
   "Formato standard delle immagini radiologiche, usato per importare la CBCT nei programmi di pianificazione."
  ],
  [
   "Segmentazione",
   "Separazione nel software di strutture diverse di un'immagine 3D, per esempio denti, osso e canale del nervo."
  ],
  [
   "Scansione del volto",
   "Acquisizione 3D del viso del paziente per progettare i denti in armonia con i lineamenti."
  ],
  [
   "Registrazione dei movimenti mandibolari",
   "Sistema elettronico che registra i movimenti reali della mandibola per usarli nella progettazione."
  ],
  [
   "Calibrazione dello scanner",
   "Controllo periodico con un oggetto campione che garantisce la precisione delle misure dello scanner."
  ],
  [
   "Accuratezza di scansione",
   "Quanto la scansione corrisponde all'oggetto reale: somma di esattezza e ripetibilità."
  ],
  [
   "Risoluzione",
   "Dimensione del più piccolo dettaglio che uno scanner o una stampante riesce a riprodurre."
  ],
  [
   "Spray opacizzante",
   "Polvere spray che rende opache le superfici lucide o trasparenti per permetterne la scansione."
  ],
  [
   "Archiviazione in cloud",
   "Conservazione dei file su server in internet, per scambiarli tra studio e laboratorio."
  ],
  [
   "Protezione dei dati sanitari",
   "Regole che impongono di trattare scansioni e dati del paziente in modo sicuro e riservato."
  ],
  [
   "Restauro monolitico",
   "Restauro ricavato da un unico blocco di materiale, senza stratificazione di ceramica."
  ],
  [
   "Disco multistrato",
   "Disco con sfumature di colore e traslucenza dal colletto al bordo incisale, per restauri monolitici estetici."
  ],
  [
   "Cut-back",
   "Riduzione digitale della parte vestibolare di un restauro per lasciare spazio alla ceramica stratificata."
  ],
  [
   "Riduzione anatomica",
   "Progetto della struttura con la forma del dente ridotta in modo uniforme, per sostenere bene la ceramica."
  ],
  [
   "Provvisorio fresato",
   "Restauro temporaneo ricavato da un disco di PMMA, più resistente di quello in resina autopolimerizzante."
  ],
  [
   "Compensazione dell'utensile",
   "Correzione del CAM che tiene conto del diametro della fresa nelle zone più strette."
  ],
  [
   "Esportazione del progetto",
   "Salvataggio del lavoro CAD in un file da inviare alla macchina o a un altro laboratorio."
  ],
  [
   "Scanner a luce strutturata",
   "Scanner che proietta sull'oggetto righe di luce e ne calcola la forma da come si deformano."
  ],
  [
   "Percorso utensile",
   "Traiettoria calcolata dal software CAM che la fresa segue per ricavare il pezzo dal disco."
  ],
  [
   "Blocchetto CAD/CAM",
   "Piccolo blocco di ceramica, composito o resina su un supporto metallico, da cui si fresa un singolo restauro."
  ],
  [
   "Ceramica ibrida",
   "Materiale fresabile formato da una rete ceramica infiltrata di resina, meno fragile della ceramica pura."
  ],
  [
   "Piattaforma di costruzione",
   "Piano della stampante 3D su cui si attacca il primo strato e su cui cresce il pezzo stampato."
  ],
  [
   "Slicer",
   "Software che divide il modello 3D in strati sottili e prepara il file che la stampante deve eseguire."
  ],
  [
   "Tempo di esposizione",
   "Secondi di luce dati a ogni strato di resina; se è sbagliato il pezzo esce fragile o deformato."
  ],
  [
   "Stitching",
   "Unione automatica delle singole immagini acquisite dallo scanner in un unico modello tridimensionale."
  ],
  [
   "Pulizia della mesh",
   "Eliminazione delle parti inutili della scansione, come lingua, guance o bordi dell'impronta."
  ],
  [
   "Ripetibilità",
   "Capacità di uno scanner o di una macchina di dare sempre lo stesso risultato ripetendo la stessa operazione."
  ],
  [
   "Formato 3MF",
   "Formato di file 3D più recente dell'STL che conserva anche colori, materiali e informazioni di stampa."
  ]
 ],
 "2": [
  [
   "Protesi fissa",
   "Protesi cementata o avvitata in modo stabile, che il paziente non può togliere da solo."
  ],
  [
   "Corona integrale in ceramica",
   "Corona interamente in ceramica, senza metallo, per la massima estetica."
  ],
  [
   "Corona in zirconia monolitica",
   "Corona fresata da un unico blocco di zirconia, molto resistente, adatta soprattutto ai settori posteriori."
  ],
  [
   "Pilastro di ponte",
   "Dente naturale o impianto che sostiene un ponte."
  ],
  [
   "Connettore",
   "Zona di unione tra gli elementi di un ponte, che deve avere una sezione sufficiente a resistere ai carichi."
  ],
  [
   "Ponte in estensione",
   "Ponte con l'elemento intermedio sostenuto da pilastri su un solo lato."
  ],
  [
   "Ponte Maryland",
   "Ponte adesivo con alette incollate sulla superficie linguale o palatale dei denti vicini."
  ],
  [
   "Inlay",
   "Restauro parziale cementato all'interno della cavità, senza ricoprire le cuspidi."
  ],
  [
   "Onlay",
   "Restauro parziale che ricopre una o più cuspidi."
  ],
  [
   "Overlay",
   "Restauro parziale che ricopre l'intera superficie occlusale."
  ],
  [
   "Faccetta in ceramica",
   "Sottile lamina di ceramica incollata sulla superficie vestibolare per correggere colore e forma."
  ],
  [
   "Perno moncone fuso",
   "Ricostruzione in lega con un perno nel canale radicolare che sostiene la corona su un dente devitalizzato."
  ],
  [
   "Perno in fibra",
   "Perno in fibra di vetro o di carbonio cementato nel canale, con elasticità simile alla dentina."
  ],
  [
   "Preparazione protesica",
   "Riduzione del dente eseguita dal dentista per creare spazio e forma al restauro."
  ],
  [
   "Linea di finitura",
   "Limite della preparazione verso la radice, dove termina il restauro."
  ],
  [
   "Preparazione a spalla",
   "Margine con un gradino a 90 gradi, che dà spazio a uno spessore uniforme di materiale."
  ],
  [
   "Chamfer",
   "Margine di preparazione arrotondato, a forma di quarto di cerchio."
  ],
  [
   "Preparazione verticale",
   "Preparazione senza gradino che termina sfumando sulla radice, detta anche a finire."
  ],
  [
   "Chiusura marginale",
   "Precisione con cui il bordo del restauro combacia con la linea di finitura."
  ],
  [
   "Profilo di emergenza",
   "Forma con cui il restauro esce dalla gengiva, importante per estetica e salute dei tessuti."
  ],
  [
   "Ampiezza biologica",
   "Spazio occupato da epitelio e connettivo sopra l'osso, che i margini del restauro devono rispettare."
  ],
  [
   "Cappetta",
   "Guscio sottile in metallo o zirconia che riveste il moncone e sostiene la ceramica."
  ],
  [
   "Ceramica pressata",
   "Tecnica in cui la ceramica resa fluida dal calore viene iniettata nello stampo lasciato da una modellazione in cera."
  ],
  [
   "Massa dentina",
   "Strato di ceramica che dà il colore di base del dente."
  ],
  [
   "Massa smalto",
   "Ceramica traslucente applicata nella parte incisale per riprodurre lo smalto."
  ],
  [
   "Ceramica di spalla",
   "Massa specifica che sostituisce il metallo al margine vestibolare, per un colletto più estetico."
  ],
  [
   "Cottura della ceramica",
   "Ciclo in forno che fa fondere e compattare la ceramica stratificata."
  ],
  [
   "Ritiro della ceramica",
   "Riduzione di volume della ceramica durante la cottura, che obbliga ad apportarne un po' in eccesso."
  ],
  [
   "Coefficiente di espansione termica",
   "Valore che indica quanto un materiale si dilata con il calore: lega e ceramica devono essere compatibili."
  ],
  [
   "Cementazione adesiva",
   "Fissaggio con cementi resinosi e trattamento delle superfici, necessario per le ceramiche vetrose."
  ],
  [
   "Mordenzatura con acido fluoridrico",
   "Trattamento che rende ruvida la superficie interna della vetroceramica per favorire l'adesione."
  ],
  [
   "Silanizzazione",
   "Applicazione di silano sulla ceramica mordenzata per creare un legame chimico con il cemento."
  ],
  [
   "Prova della struttura",
   "Controllo in bocca della struttura, prima della ceramica, per verificarne precisione e spazio."
  ],
  [
   "Prova biscotto",
   "Prova del restauro in ceramica non ancora glasata, per correggere forma e contatti."
  ],
  [
   "Punto di contatto",
   "Zona in cui il restauro tocca il dente vicino, che impedisce al cibo di infilarsi tra i denti."
  ],
  [
   "Anatomia occlusale",
   "Forma di cuspidi, solchi e fosse della superficie masticatoria."
  ],
  [
   "Spessimetro",
   "Strumento che misura in decimi di millimetro lo spessore di strutture e ceramica."
  ],
  [
   "Provvisorio armato",
   "Provvisorio in resina rinforzato con metallo o fibre, per ponti lunghi o lunghe attese."
  ],
  [
   "Corona telescopica",
   "Doppia corona: una interna cementata sul pilastro e una esterna nella protesi, che vi si innesta per attrito."
  ],
  [
   "Fresaggio parallelo",
   "Lavorazione delle pareti di una corona con il parallelometro fresatore, per guidare l'inserimento di una protesi combinata."
  ],
  [
   "Splintaggio",
   "Unione di più elementi tra loro per stabilizzare denti mobili o distribuire meglio i carichi."
  ],
  [
   "Effetto ferula",
   "Fascia di dentina sana sopra il margine, abbracciata dalla corona, che protegge dalle fratture il dente devitalizzato."
  ],
  [
   "Zirconia traslucente",
   "Zirconia con più fase cubica, più estetica ma meno resistente, per corone monolitiche anteriori."
  ],
  [
   "Chipping",
   "Distacco di piccoli frammenti di ceramica dalla struttura sottostante."
  ],
  [
   "Rapporto corona-radice",
   "Proporzione tra la parte del dente fuori dall'osso e la radice inserita, che indica se può fare da pilastro."
  ],
  [
   "Legge di Ante",
   "Regola secondo cui la superficie delle radici dei pilastri deve essere almeno pari a quella dei denti da sostituire."
  ],
  [
   "Ceramica rosa",
   "Ceramica color gengiva usata nei ponti per compensare la perdita dei tessuti."
  ],
  [
   "Pontic ovoidale",
   "Elemento intermedio con base convessa che si appoggia in una piccola conca della gengiva, per un aspetto naturale."
  ],
  [
   "Spazio protesico",
   "Spazio disponibile in altezza e larghezza per il restauro, che condiziona materiale e progetto."
  ],
  [
   "Mappa cromatica",
   "Schema del dente con zone di colore e caratterizzazioni, per comunicare al laboratorio l'estetica richiesta."
  ],
  [
   "Ponte a sella",
   "Ponte con elemento intermedio appoggiato largamente sulla cresta, difficile da pulire e oggi sconsigliato."
  ],
  [
   "Corona a giacca",
   "Vecchia corona interamente in ceramica feldspatica, cotta su una lamina di platino, oggi superata dalle ceramiche integrali."
  ],
  [
   "Corona tre quarti",
   "Corona che ricopre il dente tranne la superficie vestibolare, lasciando in vista lo smalto naturale."
  ],
  [
   "Ceramica per zirconia",
   "Ceramica con dilatazione termica adatta alla zirconia, stratificata sulle strutture in ossido di zirconio."
  ],
  [
   "Liner per zirconia",
   "Primo strato sottile di ceramica che migliora legame e colore sulla struttura in zirconia."
  ],
  [
   "Masse effetto",
   "Ceramiche traslucenti o opalescenti che riproducono dettagli come aloni incisali e mammelloni."
  ],
  [
   "Alone incisale",
   "Sottile bordo più chiaro e opaco lungo il margine incisale, riprodotto nella ceramica con masse apposite."
  ],
  [
   "Opalescenza",
   "Proprietà dello smalto di apparire azzurrino con la luce riflessa e aranciato con la luce che lo attraversa."
  ],
  [
   "Fluorescenza",
   "Capacità del dente di emettere luce bluastra sotto i raggi ultravioletti, da riprodurre nella ceramica."
  ],
  [
   "Traslucenza",
   "Capacità di un materiale di lasciar passare parte della luce, come fa lo smalto naturale."
  ],
  [
   "Valore",
   "Quantità di chiaro o di scuro di un colore: è il parametro più importante nella scelta del colore del dente."
  ],
  [
   "Croma",
   "Saturazione di un colore: indica quanto il colore è intenso e carico."
  ],
  [
   "Tinta",
   "Famiglia di colore del dente, indicata dalla lettera della scala colori classica (A, B, C, D)."
  ],
  [
   "Lucidatura meccanica della ceramica",
   "Rifinitura con gommini e paste diamantate che rende lucida la ceramica senza cottura di glasura."
  ],
  [
   "Sabbiatura della struttura",
   "Trattamento con ossido di alluminio che pulisce e irruvidisce la struttura metallica prima dell'opaco."
  ],
  [
   "Spessore minimo della struttura",
   "Spessore al di sotto del quale la struttura in metallo o zirconia rischia di deformarsi o rompersi."
  ],
  [
   "Sezione del connettore",
   "Area della zona di unione tra due elementi del ponte: in zirconia, nei settori posteriori, servono almeno 9 mm quadrati."
  ],
  [
   "Modello master",
   "Modello di lavoro definitivo con monconi sfilabili, su cui si realizza il restauro."
  ],
  [
   "Scontornatura del moncone",
   "Rifinitura del moncone in gesso sotto la linea di finitura, per renderla ben visibile e accessibile."
  ],
  [
   "Evidenziazione del margine",
   "Tracciatura con una matita apposita del limite della preparazione sul moncone, per lavorarvi con precisione."
  ],
  [
   "Ceratura diagnostica",
   "Modellazione in cera della forma finale dei denti sul modello di studio, prima di iniziare il trattamento."
  ],
  [
   "Restauro adesivo",
   "Restauro fissato con tecniche adesive, che permette preparazioni più conservative del dente."
  ]
,
  [
   "Corona fusa integrale",
   "Corona interamente in lega metallica, senza rivestimento estetico; molto resistente, adatta ai settori posteriori."
  ],
  [
   "Corona Richmond",
   "Corona e perno radicolare realizzati in un unico pezzo, usata su denti trattati con poca corona residua."
  ],
  [
   "Pontic igienico",
   "Elemento intermedio sollevato dalla cresta, con superficie inferiore convessa che si pulisce facilmente."
  ],
  [
   "Preparazione a lama di coltello",
   "Preparazione senza un vero gradino, con margine sottilissimo; conserva tessuto ma rende difficile leggere il limite."
  ],
  [
   "Filo retrattore",
   "Filo sottile inserito nel solco gengivale prima dell'impronta per scostare la gengiva e mostrare il margine."
  ],
  [
   "Cementazione convenzionale",
   "Fissaggio della corona con cementi che trattengono per attrito, come fosfato di zinco e vetroionomero."
  ],
  [
   "Cemento provvisorio",
   "Cemento poco tenace che fissa i provvisori e permette di toglierli senza danneggiare il moncone."
  ],
  [
   "Bonder",
   "Strato intermedio applicato sulla lega per migliorare l'adesione della ceramica e ridurre le bolle."
  ],
  [
   "Massa cervicale",
   "Ceramica più satura di colore usata vicino al colletto per imitare la dentina che traspare."
  ],
  [
   "Micro-layering",
   "Stratificazione di uno strato sottilissimo di ceramica sopra una struttura quasi a forma piena."
  ],
  [
   "Raffreddamento controllato",
   "Discesa lenta della temperatura dopo la cottura per evitare tensioni e crepe nella ceramica."
  ],
  [
   "Tessitura superficiale",
   "Rilievi e linee sulla superficie vestibolare del dente, riprodotti per riflettere la luce in modo naturale."
  ],
  [
   "Sovracontorno",
   "Corona con volume eccessivo vicino alla gengiva, che trattiene placca e infiamma i tessuti."
  ],
  [
   "Basculamento",
   "Movimento oscillante della corona sul moncone, segno di un adattamento non corretto."
  ],
  [
   "Perle ritentive",
   "Piccole sfere sulla struttura metallica che creano ritenzione meccanica per la resina estetica."
  ],
  [
   "Bisello",
   "Smusso sottile del bordo della preparazione che rende il margine più netto e facile da sigillare."
  ],
  [
   "Allungamento di corona clinica",
   "Intervento che sposta gengiva e osso verso la radice per scoprire più dente sano su cui preparare la corona."
  ]
 ],
 "3": [
  [
   "Osteointegrazione",
   "Unione diretta e stabile tra l'osso vivo e la superficie dell'impianto."
  ],
  [
   "Connessione interna",
   "Collegamento tra impianto e abutment che avviene dentro l'impianto, più stabile e meglio sigillato."
  ],
  [
   "Esagono esterno",
   "Collegamento con una piccola testa esagonale che sporge dall'impianto e su cui si incastra l'abutment."
  ],
  [
   "Cono Morse",
   "Accoppiamento conico tra abutment e impianto che si blocca per attrito e riduce le infiltrazioni."
  ],
  [
   "Componente antirotazionale",
   "Pezzo con una geometria che impedisce all'abutment di ruotare: indispensabile per le corone singole."
  ],
  [
   "Componente rotazionale",
   "Pezzo senza blocco della rotazione, usato nelle strutture che uniscono più impianti."
  ],
  [
   "Abutment",
   "Componente avvitato all'impianto che sostiene la corona, detto anche pilastro protesico."
  ],
  [
   "Abutment prefabbricato",
   "Pilastro di serie, con forma e altezza già stabilite dal produttore."
  ],
  [
   "Abutment individualizzato",
   "Pilastro progettato e fresato su misura per il singolo paziente."
  ],
  [
   "Abutment angolato",
   "Pilastro inclinato che corregge la differenza tra l'asse dell'impianto e l'asse della corona."
  ],
  [
   "Base in titanio",
   "Supporto in titanio su cui si incolla una sovrastruttura in zirconia o ceramica, poi avvitata all'impianto."
  ],
  [
   "Vite passante",
   "Vite che fissa l'abutment o la protesi all'impianto."
  ],
  [
   "Torque di serraggio",
   "Forza di rotazione, misurata in newton-centimetri (Ncm), con cui si stringe la vite secondo le indicazioni del produttore."
  ],
  [
   "Cacciavite dinamometrico",
   "Strumento che stringe le viti con il torque esatto."
  ],
  [
   "Vite di guarigione",
   "Componente avvitato dopo la chirurgia che guida la guarigione della gengiva intorno all'impianto."
  ],
  [
   "Vite tappo",
   "Piccola vite che chiude l'impianto mentre guarisce sotto la gengiva."
  ],
  [
   "Transfer da impronta",
   "Componente avvitato all'impianto che ne trasferisce la posizione nell'impronta."
  ],
  [
   "Tecnica a cucchiaio aperto",
   "Impronta in cui i transfer restano nel materiale e si svitano attraverso fori nel portaimpronta."
  ],
  [
   "Tecnica a cucchiaio chiuso",
   "Impronta in cui i transfer restano in bocca e vengono riposizionati nel materiale dopo la presa."
  ],
  [
   "Analogo digitale",
   "Replica dell'impianto per modelli stampati, inserita nella sede progettata dal software."
  ],
  [
   "Scanbody",
   "Componente avvitato all'impianto che lo scanner riconosce per calcolarne posizione e orientamento."
  ],
  [
   "Maschera gengivale",
   "Materiale morbido intorno all'analogo nel modello, che riproduce la gengiva intorno all'impianto."
  ],
  [
   "Protesi cementata su impianti",
   "Protesi fissata con cemento sull'abutment."
  ],
  [
   "Protesi avvitata su impianti",
   "Protesi fissata con viti, che il dentista può rimuovere per controlli e riparazioni."
  ],
  [
   "Foro di accesso alla vite",
   "Canale nella corona attraverso cui si raggiunge la vite."
  ],
  [
   "Accesso angolato",
   "Sistema che permette di spostare il foro della vite fuori dalla zona estetica."
  ],
  [
   "Passività",
   "Adattamento senza tensioni di una struttura su più impianti: stringendo le viti non nascono forze."
  ],
  [
   "Test di Sheffield",
   "Prova della passività: si stringe una sola vite e si controlla che la struttura non si sollevi sugli altri impianti."
  ],
  [
   "Barra su impianti",
   "Struttura metallica che unisce più impianti e su cui si aggancia una protesi rimovibile."
  ],
  [
   "Overdenture",
   "Protesi totale rimovibile che si appoggia e si aggancia a impianti o a radici."
  ],
  [
   "Attacco a sfera",
   "Ancoraggio con una testa sferica sull'impianto e una cappetta ritentiva nella protesi."
  ],
  [
   "Attacco Locator",
   "Attacco di altezza ridotta con inserti ritentivi in nylon intercambiabili."
  ],
  [
   "Cappetta ritentiva",
   "Elemento inserito nella protesi che si aggancia all'attacco."
  ],
  [
   "All-on-four",
   "Arcata fissa completa sostenuta da quattro impianti, con i due posteriori inclinati."
  ],
  [
   "Carico immediato",
   "Applicazione di una protesi provvisoria sugli impianti entro pochi giorni dall'inserimento."
  ],
  [
   "Carico differito",
   "Protesi applicata dopo alcuni mesi, quando l'osteointegrazione è avvenuta."
  ],
  [
   "Protesi Toronto",
   "Protesi fissa avvitata a più impianti, con struttura rigida e denti in resina o composito."
  ],
  [
   "Piattaforma implantare",
   "Superficie della testa dell'impianto su cui appoggia l'abutment."
  ],
  [
   "Platform switching",
   "Uso di un abutment più stretto della piattaforma per proteggere l'osso intorno al collo dell'impianto."
  ],
  [
   "Diametro implantare",
   "Larghezza dell'impianto, scelta in base allo spessore dell'osso e al dente da sostituire."
  ],
  [
   "Impianto corto",
   "Impianto di lunghezza ridotta, usato quando l'osso disponibile in altezza è poco."
  ],
  [
   "Osso corticale",
   "Strato esterno compatto dell'osso, molto resistente."
  ],
  [
   "Densità ossea",
   "Compattezza dell'osso, classificata da D1 a D4, che influenza la stabilità dell'impianto."
  ],
  [
   "Stabilità primaria",
   "Bloccaggio meccanico dell'impianto subito dopo l'inserimento."
  ],
  [
   "Rialzo del seno mascellare",
   "Intervento che aumenta l'osso sotto il seno mascellare per poter inserire impianti."
  ],
  [
   "Rigenerazione ossea guidata",
   "Tecnica che usa membrane e materiale da innesto per ricostruire l'osso mancante."
  ],
  [
   "Mucosite perimplantare",
   "Infiammazione reversibile della gengiva intorno all'impianto, senza perdita di osso."
  ],
  [
   "Perimplantite",
   "Infiammazione intorno all'impianto con perdita progressiva dell'osso."
  ],
  [
   "Tessuto cheratinizzato",
   "Fascia di gengiva compatta intorno all'impianto che protegge i tessuti e facilita l'igiene."
  ],
  [
   "Dima chirurgica",
   "Mascherina che guida il chirurgo a inserire l'impianto nella posizione progettata."
  ],
  [
   "Chirurgia guidata",
   "Inserimento degli impianti con una dima ricavata dalla pianificazione digitale sulla CBCT."
  ],
  [
   "Pianificazione implantare",
   "Progetto di numero, posizione e inclinazione degli impianti, fatto partendo dalla protesi da realizzare."
  ],
  [
   "Boccola guida",
   "Anello metallico inserito nella dima che guida le frese e l'impianto."
  ],
  [
   "Mascherina radiologica",
   "Dima con marcatori radiopachi indossata durante la radiografia per mettere in relazione protesi e osso."
  ],
  [
   "Sovrastruttura",
   "Parte protesica che poggia sugli abutment o direttamente sugli impianti."
  ],
  [
   "Corona avvitata singola",
   "Corona che si avvita direttamente all'impianto, senza cemento."
  ],
  [
   "Componente compatibile",
   "Pezzo prodotto da un'altra ditta per adattarsi a un sistema implantare, di cui va verificata la precisione."
  ],
  [
   "Titanio di grado 5",
   "Lega di titanio con alluminio e vanadio, più resistente del titanio puro, usata per abutment e viti."
  ],
  [
   "Superficie ruvida dell'impianto",
   "Trattamento della superficie che aumenta il contatto con l'osso e accelera l'osteointegrazione."
  ],
  [
   "Distanza tra impianti",
   "Spazio minimo, circa 3 millimetri, da lasciare tra due impianti per conservare l'osso tra di essi."
  ],
  [
   "Allentamento della vite",
   "Svitamento spontaneo della vite, segno di carichi eccessivi o di serraggio sbagliato."
  ],
  [
   "Frattura della vite",
   "Rottura della vite protesica, spesso per sovraccarico o per mancanza di passività."
  ],
  [
   "Flangia in resina rosa",
   "Parte della protesi che riproduce la gengiva mancante nelle arcate complete su impianti."
  ],
  [
   "Incollaggio intraorale",
   "Incollaggio in bocca dei cilindri alla struttura, per ottenere una passività perfetta."
  ],
  [
   "Cilindro calcinabile",
   "Componente in plastica che brucia nel rivestimento, per fondere un abutment o una struttura su misura."
  ],
  [
   "Abutment multi-unit",
   "Pilastro intermedio che porta le connessioni allo stesso livello, per protesi avvitate su più impianti."
  ],
  [
   "Richiami periodici",
   "Visite programmate per controllare tessuti, viti e protesi e prevenire la perimplantite."
  ],
  [
   "Libreria implantare",
   "Archivio digitale delle componenti di ogni sistema implantare, che il software usa per progettare."
  ],
  [
   "Impianto conico",
   "Impianto che si restringe verso l'apice, utile per ottenere stabilità nell'osso poco compatto."
  ],
  [
   "Lunghezza implantare",
   "Altezza dell'impianto, scelta in base all'osso disponibile e alla distanza da nervi e seno mascellare."
  ],
  [
   "Impianto zigomatico",
   "Impianto molto lungo ancorato nell'osso zigomatico, usato quando il mascellare superiore è troppo riassorbito."
  ],
  [
   "Impianto bone level",
   "Impianto inserito con la testa a livello dell'osso; la connessione con l'abutment resta sotto la gengiva."
  ],
  [
   "Collo implantare",
   "Parte superiore dell'impianto, spesso liscia, a contatto con l'osso marginale e con i tessuti molli."
  ],
  [
   "Tecnica sommersa",
   "Impianto coperto dalla gengiva durante la guarigione e scoperto con un secondo piccolo intervento."
  ],
  [
   "Impianto post-estrattivo",
   "Impianto inserito nello stesso intervento in cui si estrae il dente, direttamente nell'alveolo."
  ],
  [
   "Torque di inserimento",
   "Forza di rotazione misurata mentre l'impianto viene avvitato nell'osso; indica la sua stabilità iniziale."
  ],
  [
   "Stabilità secondaria",
   "Stabilità che l'impianto acquista nei mesi successivi grazie alla formazione di nuovo osso attorno."
  ],
  [
   "Quoziente di stabilità implantare",
   "Valore da 1 a 100, misurato con la frequenza di risonanza, che indica quanto è stabile l'impianto."
  ],
  [
   "Classificazione di Lekholm e Zarb",
   "Suddivisione dell'osso in quattro tipi, da D1 molto compatto a D4 molto spugnoso, utile a pianificare l'impianto."
  ],
  [
   "Innesto osseo autologo",
   "Osso prelevato dallo stesso paziente e trapiantato dove manca, per permettere l'inserimento dell'impianto."
  ],
  [
   "Membrana riassorbibile",
   "Barriera di collagene che protegge l'innesto osseo dai tessuti molli e si dissolve da sola."
  ],
  [
   "Fenotipo gengivale",
   "Spessore e qualità della gengiva, sottile o spessa, che influenzano estetica e stabilità attorno all'impianto."
  ],
  [
   "Abutment in zirconia",
   "Pilastro in zirconia, chiaro e biocompatibile, che evita il riflesso grigio del titanio sotto gengive sottili."
  ],
  [
   "Cantilever su impianti",
   "Parte della protesi che sporge oltre l'ultimo impianto; se è troppo lunga sovraccarica viti e osso."
  ],
  [
   "Condizionamento dei tessuti molli",
   "Modellazione graduale della gengiva con il provvisorio per ottenere un profilo naturale attorno alla corona."
  ],
  [
   "Passaporto implantare",
   "Tessera consegnata al paziente con marca, modello, misura e lotto degli impianti inseriti."
  ]
 ],
 "4": [
  [
   "Ortodonzia",
   "Branca dell'odontoiatria che corregge la posizione dei denti e i rapporti tra le arcate."
  ],
  [
   "Apparecchio fisso",
   "Dispositivo con attacchi incollati sui denti, che il paziente non può togliere."
  ],
  [
   "Apparecchio mobile",
   "Dispositivo che il paziente inserisce e toglie da solo, con placca in resina e componenti in filo."
  ],
  [
   "Bracket",
   "Piccolo attacco incollato sul dente che accoglie il filo ortodontico."
  ],
  [
   "Bracket ceramico",
   "Attacco trasparente o color dente, più estetico di quello in metallo."
  ],
  [
   "Bracket autolegante",
   "Attacco con una clip che trattiene il filo senza bisogno di legature."
  ],
  [
   "Arco ortodontico",
   "Filo metallico che, inserito negli attacchi, esercita la forza che sposta i denti."
  ],
  [
   "Nichel-titanio",
   "Lega superelastica a memoria di forma, usata per gli archi delle prime fasi della cura."
  ],
  [
   "Filo in acciaio",
   "Filo rigido usato nelle fasi finali e per costruire le parti degli apparecchi."
  ],
  [
   "Legatura elastica",
   "Piccolo anello che fissa il filo nell'attacco."
  ],
  [
   "Banda ortodontica",
   "Anello metallico cementato intorno a un molare, con tubi e attacchi saldati."
  ],
  [
   "Tubo molare",
   "Elemento fissato sul molare in cui scorre l'estremità dell'arco."
  ],
  [
   "Placca di Schwarz",
   "Apparecchio mobile in resina con vite di espansione, usato per allargare le arcate."
  ],
  [
   "Vite di espansione",
   "Dispositivo che, girato con una chiavetta, allarga poco alla volta l'apparecchio."
  ],
  [
   "Espansore rapido del palato",
   "Apparecchio fisso con vite centrale che apre la sutura del palato nei ragazzi in crescita."
  ],
  [
   "Sutura palatina mediana",
   "Linea di unione delle due metà del palato, che l'espansore apre durante la crescita."
  ],
  [
   "Gancio di Adams",
   "Gancio in filo d'acciaio che trattiene l'apparecchio mobile sui molari."
  ],
  [
   "Arco vestibolare",
   "Filo che passa davanti agli incisivi per guidarli o tenerli in posizione."
  ],
  [
   "Molla digitale",
   "Piccola molla in filo che spinge un singolo dente nella direzione voluta."
  ],
  [
   "Ansa",
   "Piega del filo che ne aumenta l'elasticità o permette di regolarlo."
  ],
  [
   "Pinza a becchi",
   "Pinza ortodontica usata per piegare e modellare il filo."
  ],
  [
   "Resina ortodontica",
   "Resina autopolimerizzante usata per costruire le placche, colorabile e trasparente."
  ],
  [
   "Tecnica a spruzzo",
   "Costruzione della placca alternando polvere e liquido direttamente sul modello."
  ],
  [
   "Polimerizzatrice a pressione",
   "Apparecchio che indurisce la resina in acqua calda e sotto pressione, riducendo le porosità."
  ],
  [
   "Apparecchio funzionale",
   "Dispositivo che sfrutta la forza dei muscoli per guidare la crescita delle ossa mascellari."
  ],
  [
   "Attivatore",
   "Apparecchio funzionale in un solo blocco che porta in avanti la mandibola."
  ],
  [
   "Twin block",
   "Apparecchio funzionale con due placche separate e piani inclinati che fanno avanzare la mandibola."
  ],
  [
   "Bionator",
   "Apparecchio funzionale ridotto, con poca resina, che lascia libero lo spazio della lingua."
  ],
  [
   "Morso di costruzione",
   "Registrazione della mandibola in posizione avanzata, con cui si costruisce l'apparecchio funzionale."
  ],
  [
   "Contenzione",
   "Fase che mantiene i denti nella nuova posizione dopo la cura."
  ],
  [
   "Splint linguale",
   "Filo incollato dietro i denti anteriori per impedire che si spostino dopo la cura."
  ],
  [
   "Placca di Hawley",
   "Apparecchio mobile di contenzione con arco vestibolare e ganci."
  ],
  [
   "Mascherina di contenzione",
   "Guscio trasparente termostampato che mantiene i denti in posizione."
  ],
  [
   "Allineatori trasparenti",
   "Serie di mascherine che spostano i denti un poco alla volta."
  ],
  [
   "Setup digitale",
   "Simulazione al computer degli spostamenti dei denti fino alla posizione finale."
  ],
  [
   "Attachment",
   "Piccolo rilievo in composito incollato sul dente che aiuta l'allineatore a esercitare la forza."
  ],
  [
   "Termostampaggio",
   "Formatura a caldo, sotto vuoto o sotto pressione, di un foglio di plastica sul modello."
  ],
  [
   "Recidiva",
   "Ritorno dei denti verso la posizione iniziale dopo la fine della cura."
  ],
  [
   "Mantenitore di spazio",
   "Apparecchio che conserva lo spazio di un dente da latte perso troppo presto."
  ],
  [
   "Arco linguale",
   "Filo appoggiato dietro i denti inferiori, saldato a bande sui molari, per mantenere lo spazio."
  ],
  [
   "Barra palatina",
   "Filo che attraversa il palato unendo i due primi molari superiori per stabilizzarli."
  ],
  [
   "Quad-helix",
   "Apparecchio fisso in filo con quattro spire, che allarga lentamente l'arcata superiore."
  ],
  [
   "Maschera facciale",
   "Apparecchio esterno al viso che porta in avanti il mascellare nei casi di terza classe."
  ],
  [
   "Trazione extraorale",
   "Apparecchio con arco facciale e cuffia che frena la crescita del mascellare o arretra i molari superiori."
  ],
  [
   "Elastici intermascellari",
   "Elastici agganciati tra le due arcate per correggere il rapporto tra mascellare e mandibola."
  ],
  [
   "Minivite ortodontica",
   "Piccola vite in titanio inserita nell'osso come ancoraggio fisso temporaneo."
  ],
  [
   "Ancoraggio ortodontico",
   "Resistenza che impedisce ai denti di sostegno di muoversi mentre si spostano gli altri."
  ],
  [
   "Cefalometria",
   "Analisi di misure e angoli su una radiografia laterale del cranio, per la diagnosi ortodontica."
  ],
  [
   "Teleradiografia laterale",
   "Radiografia del cranio di profilo, usata per lo studio cefalometrico."
  ],
  [
   "Modelli di studio",
   "Modelli delle arcate, in gesso o digitali, usati per la diagnosi e per confrontare prima e dopo la cura."
  ],
  [
   "Zoccolatura ortodontica",
   "Base dei modelli di studio squadrata secondo regole precise, per valutarli in occlusione."
  ],
  [
   "Analisi dello spazio",
   "Confronto tra lo spazio disponibile nell'arcata e lo spazio necessario ai denti."
  ],
  [
   "Respirazione orale",
   "Abitudine a respirare con la bocca, che può alterare la crescita del palato."
  ],
  [
   "Deglutizione atipica",
   "Spinta della lingua contro i denti durante la deglutizione, che può causare malocclusioni."
  ],
  [
   "Griglia linguale",
   "Elemento che impedisce alla lingua di spingere tra gli incisivi."
  ],
  [
   "Lip bumper",
   "Scudo davanti ai denti inferiori che allontana il labbro e favorisce lo sviluppo dell'arcata."
  ],
  [
   "Saldatura a punti",
   "Unione di bande e fili con una scarica elettrica tra due elettrodi."
  ],
  [
   "Saldobrasatura",
   "Unione di elementi in acciaio con una lega d'argento fusa alla fiamma."
  ],
  [
   "Distalizzatore",
   "Apparecchio che sposta indietro i molari superiori per guadagnare spazio."
  ],
  [
   "Piano inclinato",
   "Rampa in resina sulla placca che guida la mandibola in avanti quando la bocca si chiude."
  ],
  [
   "Rotazione dentale",
   "Movimento del dente intorno al proprio asse lungo, corretto con l'apparecchio fisso."
  ],
  [
   "Torque radicolare",
   "Inclinazione della radice ottenuta torcendo il filo nell'attacco."
  ],
  [
   "Chiavetta di attivazione",
   "Piccolo strumento con cui il paziente gira la vite di espansione secondo le indicazioni."
  ],
  [
   "Scheda di prescrizione",
   "Modulo con cui l'ortodontista indica al laboratorio tipo di apparecchio, componenti e attivazioni."
  ],
  [
   "Seconda classe scheletrica",
   "Rapporto in cui la mandibola è arretrata rispetto al mascellare superiore, spesso con profilo convesso."
  ],
  [
   "Terza classe scheletrica",
   "Rapporto in cui la mandibola è avanzata rispetto al mascellare superiore, con profilo concavo."
  ],
  [
   "Morso a forbice",
   "Arcata superiore che nei settori laterali chiude completamente all'esterno di quella inferiore."
  ],
  [
   "Agenesia dentale",
   "Mancanza congenita di uno o più denti, che l'ortodonzia gestisce chiudendo o riaprendo lo spazio."
  ],
  [
   "Dente incluso",
   "Dente che non riesce a erompere e resta nell'osso, spesso il canino superiore."
  ],
  [
   "Regolatore di funzione di Fränkel",
   "Apparecchio funzionale con scudi laterali e labiali che allontanano guance e labbra per favorire lo sviluppo delle arcate."
  ],
  [
   "Apparecchio di Herbst",
   "Apparecchio fisso con pistoni telescopici che tengono la mandibola in avanti per correggere la seconda classe."
  ],
  [
   "Pista di Planas",
   "Placca con piste in resina sui settori posteriori che guidano i movimenti della mandibola e ne stimolano la crescita."
  ],
  [
   "Vite a ventaglio",
   "Vite di espansione che apre la placca soprattutto nella parte anteriore, a forma di ventaglio."
  ],
  [
   "Gancio a palla",
   "Gancio in filo con una piccola sfera all'estremità che si inserisce nello spazio tra due denti."
  ],
  [
   "Gancio a freccia",
   "Gancio di Schwarz con punte a forma di freccia che fanno presa negli spazi interdentali."
  ],
  [
   "Molla a Z",
   "Molla in filo piegata a zeta, montata sulla placca per spingere in fuori un singolo dente."
  ],
  [
   "Slot del bracket",
   "Scanalatura del bracket in cui si inserisce l'arco; le misure più comuni sono 0,018 e 0,022 pollici."
  ],
  [
   "Ortodonzia linguale",
   "Tecnica con bracket incollati sulla faccia interna dei denti, invisibili quando il paziente sorride."
  ],
  [
   "Legatura metallica",
   "Filo d'acciaio sottilissimo attorcigliato attorno alle alette per bloccare saldamente l'arco nel bracket."
  ],
  [
   "Mentoniera",
   "Apparecchio extraorale che appoggia sul mento e frena la crescita in avanti della mandibola."
  ],
  [
   "Ortodonzia intercettiva",
   "Trattamento precoce in dentatura mista che corregge un problema prima che si aggravi."
  ],
  [
   "Canino ectopico",
   "Canino che si sviluppa fuori dalla sua posizione normale e rischia di restare incluso."
  ],
  [
   "Indice IOTN",
   "Indice che classifica la gravità della malocclusione e il bisogno di trattamento ortodontico."
  ],
  [
   "Apparecchio di Crozat",
   "Apparecchio mobile tutto in metallo, con fili e ganci, che sposta i denti con molle sottili."
  ]
 ]
}
  }
};
