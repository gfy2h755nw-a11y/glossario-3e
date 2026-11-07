// Dati iniziali del glossario: modificabili prima del setup.
const AREE = [
  {
    "n": 1,
    "it": "Anatomia e morfologia dentale",
    "en": "Dental anatomy and morphology",
    "colore": "#1F5FA8"
  },
  {
    "n": 2,
    "it": "Occlusione e gnatologia",
    "en": "Occlusion and gnathology",
    "colore": "#6B4FA0"
  },
  {
    "n": 3,
    "it": "Materiali dentali",
    "en": "Dental materials",
    "colore": "#B4511A"
  },
  {
    "n": 4,
    "it": "Laboratorio: attrezzature e procedure",
    "en": "Dental laboratory: equipment and procedures",
    "colore": "#2E7D32"
  }
];

const TERMINI = {
  "1": [
    [
      "Smalto",
      "Enamel"
    ],
    [
      "Dentina",
      "Dentin"
    ],
    [
      "Polpa dentale",
      "Dental pulp"
    ],
    [
      "Cemento radicolare",
      "Cementum"
    ],
    [
      "Corona anatomica",
      "Anatomic crown"
    ],
    [
      "Radice",
      "Root"
    ],
    [
      "Colletto",
      "Cervical line (CEJ)"
    ],
    [
      "Apice radicolare",
      "Root apex"
    ],
    [
      "Cuspide",
      "Cusp"
    ],
    [
      "Solco",
      "Groove"
    ],
    [
      "Fossa",
      "Fossa"
    ],
    [
      "Cingolo",
      "Cingulum"
    ],
    [
      "Cresta marginale",
      "Marginal ridge"
    ],
    [
      "Margine incisale",
      "Incisal edge"
    ],
    [
      "Faccia mesiale",
      "Mesial surface"
    ],
    [
      "Faccia distale",
      "Distal surface"
    ],
    [
      "Faccia vestibolare",
      "Facial (buccal/labial) surface"
    ],
    [
      "Faccia palatale / linguale",
      "Palatal / lingual surface"
    ],
    [
      "Faccia occlusale",
      "Occlusal surface"
    ],
    [
      "Numerazione FDI",
      "FDI two-digit notation"
    ]
  ],
  "2": [
    [
      "Occlusione",
      "Occlusion"
    ],
    [
      "Mascellare superiore",
      "Maxilla"
    ],
    [
      "Mandibola",
      "Mandible"
    ],
    [
      "Articolazione temporo-mandibolare",
      "Temporomandibular joint (TMJ)"
    ],
    [
      "Condilo",
      "Condyle"
    ],
    [
      "Dente antagonista",
      "Opposing tooth (antagonist)"
    ],
    [
      "Massima intercuspidazione",
      "Maximum intercuspation"
    ],
    [
      "Relazione centrica",
      "Centric relation"
    ],
    [
      "Dimensione verticale",
      "Vertical dimension"
    ],
    [
      "Sovrapposizione orizzontale",
      "Overjet"
    ],
    [
      "Sovrapposizione verticale",
      "Overbite"
    ],
    [
      "Curva di Spee",
      "Curve of Spee"
    ],
    [
      "Curva di Wilson",
      "Curve of Wilson"
    ],
    [
      "Piano occlusale",
      "Occlusal plane"
    ],
    [
      "Guida canina",
      "Canine guidance"
    ],
    [
      "Guida incisiva",
      "Incisal guidance"
    ],
    [
      "Movimento di lateralità",
      "Lateral excursion (laterotrusion)"
    ],
    [
      "Protrusione",
      "Protrusion"
    ],
    [
      "Arco facciale",
      "Facebow"
    ],
    [
      "Articolatore",
      "Articulator"
    ]
  ],
  "3": [
    [
      "Gesso dentale",
      "Dental gypsum"
    ],
    [
      "Gesso extraduro",
      "Die stone"
    ],
    [
      "Rapporto acqua/polvere",
      "Water/powder ratio"
    ],
    [
      "Tempo di presa",
      "Setting time"
    ],
    [
      "Espansione di presa",
      "Setting expansion"
    ],
    [
      "Cera da modellazione",
      "Modeling wax"
    ],
    [
      "Rivestimento",
      "Investment material"
    ],
    [
      "Lega dentale",
      "Dental alloy"
    ],
    [
      "Lega nobile",
      "Noble alloy"
    ],
    [
      "Lega cromo-cobalto",
      "Cobalt-chromium alloy"
    ],
    [
      "Resina acrilica (PMMA)",
      "Acrylic resin (PMMA)"
    ],
    [
      "Monomero",
      "Monomer"
    ],
    [
      "Polimero",
      "Polymer"
    ],
    [
      "Polimerizzazione",
      "Polymerization"
    ],
    [
      "Alginato",
      "Alginate"
    ],
    [
      "Silicone per addizione",
      "Addition silicone (VPS)"
    ],
    [
      "Isolante",
      "Separating medium"
    ],
    [
      "Ceramica dentale",
      "Dental ceramic"
    ],
    [
      "Zirconia",
      "Zirconia"
    ],
    [
      "Biocompatibilità",
      "Biocompatibility"
    ]
  ],
  "4": [
    [
      "Impronta",
      "Impression"
    ],
    [
      "Modello",
      "Dental cast"
    ],
    [
      "Moncone sfilabile",
      "Removable die"
    ],
    [
      "Pin",
      "Dowel pin"
    ],
    [
      "Zoccolatura",
      "Cast basing"
    ],
    [
      "Squadramodelli",
      "Model trimmer"
    ],
    [
      "Vibratore",
      "Vibrator"
    ],
    [
      "Miscelatore sottovuoto",
      "Vacuum mixer"
    ],
    [
      "Ceratura",
      "Wax-up"
    ],
    [
      "Perno di colata",
      "Sprue"
    ],
    [
      "Cilindro",
      "Casting ring"
    ],
    [
      "Messa in rivestimento",
      "Investing"
    ],
    [
      "Preriscaldo del cilindro",
      "Burnout"
    ],
    [
      "Fusione a cera persa",
      "Lost-wax technique"
    ],
    [
      "Fonditrice",
      "Casting machine"
    ],
    [
      "Sabbiatrice",
      "Sandblasting unit"
    ],
    [
      "Rifinitura",
      "Finishing"
    ],
    [
      "Lucidatura",
      "Polishing"
    ],
    [
      "Micromotore",
      "Micromotor"
    ],
    [
      "Fresa",
      "Bur"
    ]
  ]
};

const NOMI_ALUNNI = [
  "Bertelà Linda",
  "Biagi Tommaso",
  "Calvani Giulio",
  "Dalle Luche Grace",
  "Fialdini Alessandro",
  "Francesconi Andrea",
  "Giannarelli Rigel Francesca Lina",
  "Iodice Francesca",
  "Menale Alessio",
  "Napoli Jacopo",
  "Olobardi Rachele",
  "Ottaviano Jacopo",
  "Pinelli Raul",
  "Rubini Alessio",
  "Tonlorenzi Fabio",
  "Venè Ludovica"
];

const DOCENTI = [
  { nome: 'prof. Danilo Cerrato', lingua: 'it', admin: true },
  { nome: 'prof.ssa Federica Aliboni', lingua: 'en' }
];

// Tappe: quelle con "chiave" prendono la data dalle scadenze impostate dal prof. Cerrato nell'app.
const TAPPE = [
  { "data": "2026-11-09", "chiave": "partenza", "testo": "Partenza: si apre l'app per 3E e 3F" },
  { "data": "2026-11-13", "lingua": "en", "chiave": "it", "testo": "Scadenza italiano: risposta a tutti i termini" },
  { "data": "2026-11-20", "soloIt": true, "chiave": "it", "testo": "Scadenza: risposta a tutti e 10 i termini" },
  { "data": "2026-11-20", "lingua": "en", "testo": "Italiano corretto e approvato dal prof. Cerrato" },
  { "data": "2026-11-27", "soloIt": true, "testo": "Definizioni corrette e approvate dal prof. Cerrato: l'app si chiude" },
  { "data": "2026-11-27", "lingua": "en", "chiave": "en", "testo": "Scadenza inglese: risposta a tutti i termini" },
  { "data": "2026-12-03", "lingua": "en", "testo": "Inglese corretto e approvato dalla prof.ssa Aliboni: l'app si chiude" },
  { "data": "2026-12-07", "testo": "Cartelloni definitivi in tipografia" },
  { "data": "2026-12-11", "testo": "Consegna e presentazione dei cartelloni" }
];

// Scadenze iniziali (modificabili dall'area docenti, solo prof. Cerrato). Ora italiana.
const SCADENZE = { it: '2026-11-20T23:59:00+01:00', en: '2026-11-27T23:59:00+01:00' };

// Lingue attive: ['it'] = solo italiano (dal 5/11/2026); ['it', 'en'] riattiva l'inglese (servono le definizioni EN dei termini 21-40).
const LINGUE = ['it'];
// Termini per alunno: 5 della prima fase + 5 nuovi (aree da 40 termini).
const TERMINI_PER_ALUNNO = 10;

// Classi: la 3E (16 alunni, gruppi per area) e la 3F (10 alunni, termini di tutte le aree).
const CLASSI = ['3E', '3F'];
const NOMI_3F = ["Balleri Christian", "Bonuccelli Martina", "Chiorescu Vlada", "Corradini Helena", "Dadà Matteo", "Dieng Ibrahima", "Domenichelli Alessio", "Fazzi Matilda", "Ferrara Lucia", "Taddei Nicole"];
// Partenza del compito: la imposta il prof. Cerrato dall'app (prima di quel momento gli alunni non vedono i termini).
const PARTENZA = null;

// Valutazione: voto massimo 8; proposta A = -0,25 per errore, B = -0,50 (scelta dall'area docenti).
// tettoEredeInRitardo: chi non risponde in tempo ai termini ricevuti da un escluso non può superare questo voto
// dal 7/11/2026 (lavoro a casa): voto massimo 7,5, 9,5 per chi riceve i termini di un escluso, proposta B (−0,50) di default
const VALUTAZIONE = { votoMax: 7.5, votoMaxErede: 9.5, votoMin: 4, votoEsclusione: 4, tettoEredeInRitardo: 6, proposta: 'B' };

// Termini degli esclusi: passano a sorte a un compagno, che ha questi giorni (dalla riassegnazione) per rispondere.
const EREDITA = { giorniIt: 3, giorniEn: 4 };

// Definizioni corrette [italiano, inglese], nello stesso ordine dei termini.
const DEFINIZIONI = {
 "1": [
  [
   "Tessuto più duro e mineralizzato del corpo umano; riveste e protegge la corona anatomica del dente.",
   "Highly mineralized tissue, the hardest in the human body, that covers and protects the anatomic crown."
  ],
  [
   "Tessuto mineralizzato giallastro che forma la maggior parte del dente, sotto lo smalto e il cemento.",
   "Yellowish mineralized tissue that forms the bulk of the tooth, beneath the enamel and the cementum."
  ],
  [
   "Tessuto molle con vasi sanguigni e nervi, contenuto nella camera pulpare e nei canali radicolari.",
   "Soft connective tissue containing blood vessels and nerves, housed in the pulp chamber and root canals."
  ],
  [
   "Sottile tessuto mineralizzato che riveste la radice e ancora le fibre del legamento parodontale.",
   "Thin mineralized tissue covering the root, into which the periodontal ligament fibers are inserted."
  ],
  [
   "Parte del dente rivestita di smalto, che si trova sopra la giunzione amelo-cementizia.",
   "Portion of the tooth covered by enamel, extending coronally from the cementoenamel junction."
  ],
  [
   "Parte del dente rivestita di cemento e inserita nell'osso alveolare.",
   "Portion of the tooth covered by cementum and anchored in the alveolar bone."
  ],
  [
   "Linea di passaggio tra corona e radice, dove lo smalto incontra il cemento.",
   "Boundary between crown and root where the enamel meets the cementum (cementoenamel junction)."
  ],
  [
   "Estremità della radice, con il forame da cui entrano i vasi e i nervi della polpa.",
   "Terminal end of the root, containing the apical foramen through which vessels and nerves enter the pulp."
  ],
  [
   "Rilievo appuntito della superficie masticatoria di canini, premolari e molari.",
   "Pointed or rounded elevation on the masticatory surface of canines, premolars and molars."
  ],
  [
   "Depressione lineare tra due rilievi della superficie occlusale.",
   "Linear depression between adjacent ridges or cusps on the occlusal surface."
  ],
  [
   "Depressione arrotondata della superficie del dente, ad esempio al centro della faccia occlusale dei molari.",
   "Rounded depression on the tooth surface, such as the central fossa on the occlusal surface of molars."
  ],
  [
   "Rilievo convesso nel terzo cervicale della faccia palatale o linguale dei denti anteriori.",
   "Convex prominence on the cervical third of the lingual surface of anterior teeth."
  ],
  [
   "Rilievo di smalto che delimita mesialmente e distalmente la faccia occlusale.",
   "Enamel elevation forming the mesial and distal borders of the occlusal surface."
  ],
  [
   "Bordo tagliente di incisivi e canini, usato per tagliare il cibo.",
   "Cutting edge of incisors and canines, used to incise food."
  ],
  [
   "Faccia del dente rivolta verso la linea mediana dell'arcata.",
   "Tooth surface facing toward the midline of the dental arch."
  ],
  [
   "Faccia del dente rivolta in direzione opposta alla linea mediana dell'arcata.",
   "Tooth surface facing away from the midline of the dental arch."
  ],
  [
   "Faccia del dente rivolta verso labbra e guance.",
   "Tooth surface facing the lips or cheeks; also called labial or buccal."
  ],
  [
   "Faccia del dente rivolta verso il palato nell'arcata superiore o verso la lingua in quella inferiore.",
   "Tooth surface facing the palate in the maxillary arch or the tongue in the mandibular arch."
  ],
  [
   "Faccia masticatoria di premolari e molari, che entra in contatto con i denti antagonisti.",
   "Masticatory surface of premolars and molars that contacts the opposing teeth."
  ],
  [
   "Sistema che identifica ogni dente con due cifre: la prima indica il quadrante, la seconda il dente.",
   "Two-digit notation in which the first digit identifies the quadrant and the second the tooth position."
  ]
 ],
 "2": [
  [
   "Rapporto di contatto tra i denti dell'arcata superiore e quelli dell'arcata inferiore.",
   "Static contact relationship between the maxillary and mandibular teeth."
  ],
  [
   "Osso pari che forma la parte centrale del viso e sostiene i denti dell'arcata superiore.",
   "Paired bone forming the central part of the facial skeleton and bearing the maxillary teeth."
  ],
  [
   "Unico osso mobile del cranio; sostiene i denti dell'arcata inferiore.",
   "The only movable bone of the skull, bearing the mandibular teeth."
  ],
  [
   "Articolazione tra il condilo della mandibola e l'osso temporale, che permette i movimenti della bocca.",
   "Articulation between the mandibular condyle and the temporal bone that allows mandibular movements."
  ],
  [
   "Estremità arrotondata del ramo mandibolare che si articola con l'osso temporale.",
   "Rounded process at the end of the mandibular ramus that articulates with the temporal bone."
  ],
  [
   "Dente dell'arcata opposta che entra in contatto con il dente considerato.",
   "Tooth in the opposite arch that occludes with the tooth under consideration."
  ],
  [
   "Posizione in cui le cuspidi delle due arcate hanno il massimo numero di contatti.",
   "Mandibular position in which the opposing cusps achieve the greatest number of contacts."
  ],
  [
   "Posizione di riferimento della mandibola, con i condili stabili, indipendente dal contatto tra i denti.",
   "Reproducible maxillomandibular relationship with the condyles in a stable position, independent of tooth contact."
  ],
  [
   "Distanza tra un punto sopra e uno sotto la bocca, misurata con i denti in contatto.",
   "Distance between two selected points, one above and one below the mouth, measured with the teeth in occlusion."
  ],
  [
   "Distanza orizzontale tra il margine incisale degli incisivi superiori e la faccia vestibolare di quelli inferiori.",
   "Horizontal overlap between the incisal edge of the maxillary incisors and the labial surface of the mandibular incisors."
  ],
  [
   "Quanto gli incisivi superiori coprono verticalmente quelli inferiori a bocca chiusa.",
   "Vertical overlap of the maxillary incisors over the mandibular incisors with the teeth in occlusion."
  ],
  [
   "Curva antero-posteriore formata dalle cuspidi dei denti posteriori, vista di profilo.",
   "Anteroposterior curvature formed by the cusps of the posterior teeth, viewed in the sagittal plane."
  ],
  [
   "Curva trasversale formata dalle cuspidi dei molari dei due lati, vista frontalmente.",
   "Mediolateral curvature formed by the cusps of the left and right molars, viewed in the frontal plane."
  ],
  [
   "Piano immaginario su cui si incontrano i denti delle due arcate.",
   "Imaginary surface on which the teeth of the opposing arches meet."
  ],
  [
   "Nei movimenti laterali i canini guidano la mandibola e separano i denti posteriori.",
   "In lateral excursions the canines guide the mandible and disocclude the posterior teeth."
  ],
  [
   "Nella protrusione gli incisivi guidano la mandibola e separano i denti posteriori.",
   "In protrusion the incisors guide the mandible and disocclude the posterior teeth."
  ],
  [
   "Movimento della mandibola verso destra o verso sinistra.",
   "Movement of the mandible to the right or left of the midline."
  ],
  [
   "Movimento in avanti della mandibola.",
   "Anterior movement of the mandible."
  ],
  [
   "Strumento che registra la posizione dell'arcata superiore rispetto alle articolazioni e la trasferisce all'articolatore.",
   "Instrument that records the position of the maxillary arch relative to the TMJs and transfers it to the articulator."
  ],
  [
   "Strumento meccanico che riproduce i movimenti della mandibola; vi si montano i modelli.",
   "Mechanical device that simulates mandibular movements and to which the dental casts are mounted."
  ]
 ],
 "3": [
  [
   "Solfato di calcio emiidrato che, miscelato con acqua, fa presa; serve per modelli e zoccoli.",
   "Calcium sulfate hemihydrate that sets when mixed with water; used for casts and bases."
  ],
  [
   "Gesso di tipo IV, molto resistente e preciso, usato per monconi e modelli di protesi fissa.",
   "Type IV high-strength gypsum with high accuracy, used for dies and fixed prosthodontic casts."
  ],
  [
   "Quantità di acqua e di polvere da miscelare, indicata dal fabbricante per ogni materiale.",
   "Proportion of water to powder specified by the manufacturer for each material."
  ],
  [
   "Tempo che il materiale impiega a indurire dopo la miscelazione.",
   "Time required for the material to harden after mixing."
  ],
  [
   "Lieve aumento di volume del gesso o del rivestimento durante l'indurimento.",
   "Slight dimensional increase of gypsum or investment during setting."
  ],
  [
   "Materiale termoplastico usato per dare forma ai manufatti prima della fusione o della pressatura.",
   "Thermoplastic material used to form the pattern of a restoration before casting or pressing."
  ],
  [
   "Materiale refrattario che avvolge la ceratura e forma lo stampo per la fusione.",
   "Refractory material that surrounds the wax pattern and forms the mold for casting."
  ],
  [
   "Miscela di due o più metalli usata per strutture protesiche.",
   "Combination of two or more metals used to fabricate prosthetic frameworks."
  ],
  [
   "Lega con un'alta percentuale di oro, platino o palladio, resistente alla corrosione.",
   "Alloy with a high content of gold, platinum or palladium, offering high corrosion resistance."
  ],
  [
   "Lega non nobile, rigida e leggera, usata soprattutto per gli scheletrati.",
   "Rigid, lightweight base-metal alloy used mainly for removable partial denture frameworks."
  ],
  [
   "Polimero usato per basi di protesi mobili, provvisori e bite.",
   "Polymer used for denture bases, provisional restorations and occlusal splints."
  ],
  [
   "Liquido formato da piccole molecole che, unendosi, danno origine alla resina.",
   "Liquid composed of small molecules that link together to form the resin."
  ],
  [
   "Polvere formata da lunghe catene di molecole unite tra loro.",
   "Powder composed of long chains of linked molecules."
  ],
  [
   "Reazione chimica con cui il monomero si trasforma in polimero e la resina indurisce.",
   "Chemical reaction in which the monomer is converted into polymer and the resin hardens."
  ],
  [
   "Materiale da impronta elastico ricavato dalle alghe; l'impronta va colata subito.",
   "Irreversible hydrocolloid impression material derived from seaweed; the impression must be poured immediately."
  ],
  [
   "Materiale da impronta elastico, molto preciso e stabile nel tempo.",
   "Elastomeric impression material with high accuracy and excellent dimensional stability."
  ],
  [
   "Prodotto steso tra due materiali per impedire che si uniscano.",
   "Agent applied between two materials to prevent them from bonding."
  ],
  [
   "Materiale inorganico cotto ad alta temperatura, usato per riprodurre l'aspetto del dente naturale.",
   "Inorganic material fired at high temperature, used to reproduce the appearance of natural teeth."
  ],
  [
   "Ossido ceramico molto resistente, fresato con sistemi CAD/CAM per corone e ponti.",
   "High-strength ceramic oxide milled with CAD/CAM systems for crowns and bridges."
  ],
  [
   "Capacità di un materiale di stare a contatto con i tessuti del corpo senza danneggiarli.",
   "Ability of a material to remain in contact with living tissues without causing harm."
  ]
 ],
 "4": [
  [
   "Copia in negativo dei denti e dei tessuti della bocca, da cui si ricava il modello.",
   "Negative reproduction of the teeth and oral tissues, from which the cast is made."
  ],
  [
   "Copia in positivo dell'arcata, ottenuta colando il gesso nell'impronta.",
   "Positive reproduction of the dental arch, obtained by pouring gypsum into the impression."
  ],
  [
   "Parte del modello con il dente preparato, che si può estrarre e riposizionare.",
   "Sectioned part of the cast containing the prepared tooth, which can be removed and accurately repositioned."
  ],
  [
   "Perno metallico fissato sotto il moncone per riposizionarlo con precisione nello zoccolo.",
   "Metal pin fixed to the underside of the die so that it can be accurately repositioned in the base."
  ],
  [
   "Realizzazione della base in gesso del modello.",
   "Fabrication of the gypsum base of the cast."
  ],
  [
   "Macchina con disco abrasivo e getto d'acqua che rifinisce la base dei modelli in gesso.",
   "Machine with an abrasive wheel and water spray used to trim the base of gypsum casts."
  ],
  [
   "Apparecchio che fa vibrare l'impronta durante la colata per eliminare le bolle d'aria.",
   "Device that vibrates the impression during pouring to eliminate air bubbles."
  ],
  [
   "Apparecchio che mescola gesso o rivestimento togliendo l'aria dall'impasto.",
   "Device that mixes gypsum or investment under vacuum to remove air from the mix."
  ],
  [
   "Modellazione in cera della forma del futuro manufatto.",
   "Wax pattern reproducing the shape of the future restoration."
  ],
  [
   "Canale in cera che porterà il metallo fuso dentro lo stampo.",
   "Wax channel that will guide the molten alloy into the mold."
  ],
  [
   "Anello metallico che contiene il rivestimento durante la messa in rivestimento.",
   "Metal ring that contains the investment during investing."
  ],
  [
   "Inclusione della ceratura nel rivestimento, all'interno del cilindro.",
   "Embedding of the wax pattern in investment inside the casting ring."
  ],
  [
   "Riscaldamento del cilindro in forno per eliminare la cera ed espandere il rivestimento.",
   "Heating of the casting ring in a furnace to eliminate the wax and expand the investment."
  ],
  [
   "Tecnica in cui la cera viene eliminata e il suo spazio viene riempito dal metallo fuso.",
   "Casting technique in which the wax pattern is burned out and the space is filled with molten alloy."
  ],
  [
   "Macchina che fonde la lega e la spinge nello stampo.",
   "Equipment that melts the alloy and forces it into the mold."
  ],
  [
   "Apparecchio che pulisce le superfici con un getto di sabbia sotto pressione.",
   "Device that cleans surfaces with a jet of abrasive particles under pressure."
  ],
  [
   "Eliminazione delle eccedenze e regolarizzazione della forma del manufatto.",
   "Removal of excess material and refinement of the contours of the restoration."
  ],
  [
   "Ultima fase di lavorazione che rende la superficie liscia e brillante.",
   "Final procedure that makes the surface smooth and glossy."
  ],
  [
   "Manipolo elettrico a velocità regolabile su cui si montano frese e gommini.",
   "Electric handpiece with adjustable speed that holds burs and polishing points."
  ],
  [
   "Strumento rotante con superficie tagliente o abrasiva per modellare e rifinire.",
   "Rotary instrument with a cutting or abrasive head, used for shaping and finishing."
  ]
 ]
};


// Seconda fase (approvati dal prof. Cerrato il 4/11/2026): 20 termini in più per area, solo in italiano.
// Diventano i termini 21-40 di ogni area (T121-T140, T221-T240, ...).
const NUOVI = {
 "1": [
  [
   "Camera pulpare",
   "Cavità interna della corona che contiene la polpa e prosegue nei canali radicolari."
  ],
  [
   "Canale radicolare",
   "Canale sottile che attraversa la radice e porta vasi e nervi dalla punta della radice alla polpa."
  ],
  [
   "Forame apicale",
   "Piccola apertura all'apice della radice da cui entrano ed escono vasi e nervi della polpa."
  ],
  [
   "Legamento parodontale",
   "Fibre connettivali che uniscono il cemento radicolare all'osso alveolare e ammortizzano i carichi masticatori."
  ],
  [
   "Gengiva",
   "Mucosa che riveste i processi alveolari e circonda il colletto dei denti, proteggendo i tessuti sottostanti."
  ],
  [
   "Osso alveolare",
   "Porzione dei mascellari che forma gli alveoli e sostiene le radici; dopo l'estrazione si riassorbe."
  ],
  [
   "Parodonto",
   "Insieme dei tessuti di sostegno del dente: gengiva, legamento parodontale, cemento radicolare e osso alveolare."
  ],
  [
   "Dente deciduo",
   "Dente da latte del bambino, destinato a cadere e a essere sostituito da un dente permanente."
  ],
  [
   "Dente permanente",
   "Dente della seconda dentizione: 32 elementi nell'adulto, terzi molari compresi; non viene più sostituito."
  ],
  [
   "Formula dentaria",
   "Modo sintetico di scrivere quanti incisivi, canini, premolari e molari ci sono in metà arcata."
  ],
  [
   "Incisivo",
   "Dente anteriore a corona appiattita con margine tagliente, destinato a tagliare il cibo; 8 nella dentatura permanente."
  ],
  [
   "Canino",
   "Dente con una sola cuspide appuntita e la radice più lunga dell'arcata; guida i movimenti di lateralità."
  ],
  [
   "Premolare",
   "Dente posteriore tra canino e molari, di solito con due cuspidi (vestibolare e linguale); inizia la triturazione."
  ],
  [
   "Molare",
   "Dente posteriore con ampia faccia occlusale a più cuspidi e due o tre radici, destinato a macinare il cibo."
  ],
  [
   "Tubercolo di Carabelli",
   "Cuspide accessoria sulla faccia palatale della cuspide mesio-palatale del primo molare superiore."
  ],
  [
   "Cresta obliqua",
   "Rilievo di smalto che attraversa la faccia occlusale dei molari superiori unendo la cuspide disto-vestibolare alla mesio-palatale."
  ],
  [
   "Area di contatto",
   "Zona in cui la faccia prossimale di un dente tocca quella del vicino; protegge la papilla e stabilizza l'arcata."
  ],
  [
   "Furcazione",
   "Punto in cui le radici di un molare si separano l'una dall'altra."
  ],
  [
   "Corona clinica",
   "Parte del dente visibile in bocca, sopra il margine gengivale; può differire dalla corona anatomica."
  ],
  [
   "Diastema",
   "Spazio tra due denti contigui, frequente tra gli incisivi centrali superiori."
  ]
 ],
 "2": [
  [
   "Classe I di Angle",
   "Rapporto in cui la cuspide mesio-vestibolare del primo molare superiore occlude nel solco vestibolare del primo molare inferiore."
  ],
  [
   "Classe II di Angle",
   "Malocclusione in cui il primo molare inferiore è distale rispetto al superiore: mandibola arretrata."
  ],
  [
   "Classe III di Angle",
   "Malocclusione in cui il primo molare inferiore è mesiale rispetto al superiore: mandibola avanzata."
  ],
  [
   "Morso aperto",
   "Mancanza di contatto tra denti superiori e inferiori in una zona dell'arcata, con gli altri denti in occlusione."
  ],
  [
   "Morso crociato",
   "Rapporto trasversale invertito: uno o più denti superiori occludono all'interno degli antagonisti inferiori."
  ],
  [
   "Linea mediana",
   "Linea al centro del viso e delle arcate, tra i due incisivi centrali."
  ],
  [
   "Spazio libero",
   "Piccolo spazio che resta tra i denti quando la bocca è rilassata e chiusa senza stringere."
  ],
  [
   "Contatto prematuro",
   "Contatto tra due denti che avviene prima degli altri in chiusura e impedisce la massima intercuspidazione."
  ],
  [
   "Interferenza occlusale",
   "Contatto indesiderato che ostacola i movimenti mandibolari di lateralità o di protrusione."
  ],
  [
   "Lato lavorante",
   "Lato verso cui si sposta la mandibola durante un movimento di lateralità."
  ],
  [
   "Lato bilanciante",
   "Lato opposto a quello verso cui si muove la mandibola in lateralità; detto anche lato non lavorante."
  ],
  [
   "Funzione di gruppo",
   "Nel movimento laterale più denti dello stesso lato si toccano insieme, invece del solo canino."
  ],
  [
   "Occlusione bilanciata",
   "Contatti simultanei sul lato lavorante e su quello bilanciante durante i movimenti; ricercata nelle protesi totali."
  ],
  [
   "Muscolo massetere",
   "Muscolo masticatorio elevatore che va dall'arcata zigomatica all'angolo della mandibola; il più potente in chiusura."
  ],
  [
   "Disco articolare",
   "Lamina fibrocartilaginea interposta tra condilo e fossa glenoidea nell'articolazione temporo-mandibolare."
  ],
  [
   "Movimento di Bennett",
   "Spostamento laterale del condilo del lato lavorante durante la lateralità della mandibola."
  ],
  [
   "Piano di Camper",
   "Linea di riferimento dal naso all'orecchio, usata per orientare i denti nelle protesi."
  ],
  [
   "Triangolo di Bonwill",
   "Triangolo immaginario tra i due condili e il centro degli incisivi inferiori, con lati di circa 10 cm."
  ],
  [
   "Tavolo incisale",
   "Piastrina dell'articolatore su cui scorre l'asta anteriore e che simula la guida degli incisivi."
  ],
  [
   "Registrazione occlusale",
   "Registrazione in cera, silicone o resina dei rapporti tra le arcate, per montare i modelli in articolatore."
  ]
 ],
 "3": [
  [
   "Lega non nobile",
   "Lega con meno del 25% di metalli nobili, come cromo-cobalto e nichel-cromo; economica e molto rigida."
  ],
  [
   "Titanio",
   "Metallo leggero e molto biocompatibile, resistente alla corrosione grazie allo strato di ossido; usato per impianti e strutture."
  ],
  [
   "Resistenza alla corrosione",
   "Capacità di un metallo di non arrugginire né rovinarsi a contatto con la saliva."
  ],
  [
   "Coefficiente di dilatazione termica",
   "Variazione di dimensione di un materiale per grado di temperatura; lega e ceramica devono averlo compatibile."
  ],
  [
   "Durezza",
   "Resistenza di un materiale alla penetrazione e alla scalfittura superficiale; si misura con prove Vickers o Knoop."
  ],
  [
   "Modulo elastico",
   "Valore che misura quanto un materiale è rigido, cioè quanto poco si piega sotto carico."
  ],
  [
   "Contrazione di polimerizzazione",
   "Riduzione di volume di una resina durante l'indurimento, dovuta all'avvicinamento delle molecole che si legano."
  ],
  [
   "Resina autopolimerizzante",
   "Resina acrilica che indurisce a temperatura ambiente grazie a un attivatore chimico; usata per riparazioni e cucchiai."
  ],
  [
   "Resina termopolimerizzante",
   "Resina che indurisce in acqua calda o in forno, usata per le basi delle dentiere."
  ],
  [
   "Resina fotopolimerizzante",
   "Resina che indurisce quando una lampada a luce blu attiva il fotoiniziatore contenuto nel materiale."
  ],
  [
   "Composito",
   "Materiale di matrice resinosa e riempitivo inorganico legati da un silano; usato per faccette e rivestimenti."
  ],
  [
   "Disilicato di litio",
   "Vetroceramica ad alta resistenza, lavorata per pressatura o fresatura, adatta a corone singole estetiche."
  ],
  [
   "Ceramica feldspatica",
   "Ceramica a base di feldspato, quarzo e caolino, molto estetica ma fragile; si stratifica su metallo o ossido."
  ],
  [
   "Opaco",
   "Primo strato di ceramica sulla struttura metallica: ne copre il colore e crea il legame con la ceramica."
  ],
  [
   "Cera collante",
   "Cera dura e appiccicosa da fusa, usata per unire temporaneamente parti prima di saldatura o riparazione."
  ],
  [
   "Rivestimento fosfatico",
   "Rivestimento con legante fosfatico (fosfato di ammonio e ossido di magnesio) che regge alte temperature; per leghe non nobili e ceramiche pressate."
  ],
  [
   "Ossido di alluminio",
   "Sabbia dura usata nella sabbiatrice per pulire e irruvidire i metalli."
  ],
  [
   "Abrasivo",
   "Materiale più duro della superficie da lavorare, usato in grane decrescenti per asportare e levigare."
  ],
  [
   "Polietere",
   "Materiale da impronta elastomerico, rigido, preciso e idrofilo, adatto alle impronte per protesi fissa."
  ],
  [
   "Idrocolloide",
   "Materiale da impronta che contiene molta acqua e si deforma se si aspetta troppo a colare il gesso."
  ]
 ],
 "4": [
  [
   "Cucchiaio individuale",
   "Portaimpronta in resina costruito sul modello di studio del paziente, per un'impronta di precisione."
  ],
  [
   "Placca base",
   "Base rigida su cui si mettono la cera e i denti per provare la dentiera."
  ],
  [
   "Vallo in cera",
   "Rilievo in cera sulla placca base che indica altezza, piano occlusale e linea mediana per il montaggio dei denti."
  ],
  [
   "Montaggio dei denti",
   "Posizionamento dei denti artificiali sul vallo in cera secondo regole estetiche e occlusali."
  ],
  [
   "Muffola",
   "Contenitore metallico in due parti in cui la protesi in cera viene messa in gesso per sostituire la cera con resina."
  ],
  [
   "Polimerizzatrice",
   "Apparecchio che fa indurire le resine con calore, pressione o luce, secondo il tipo di materiale."
  ],
  [
   "Scheletrato",
   "Protesi parziale rimovibile con struttura in cromo-cobalto fusa, ganci e selle in resina con i denti."
  ],
  [
   "Corona protesica",
   "Restauro fisso che ricopre tutta la parte coronale di un dente preparato, ripristinandone forma e funzione."
  ],
  [
   "Ponte",
   "Protesi fissa che sostituisce uno o più denti mancanti appoggiandosi a denti pilastro preparati."
  ],
  [
   "Elemento intermedio",
   "Dente artificiale del ponte che sostituisce il dente mancante tra i pilastri; detto anche pontic."
  ],
  [
   "Margine di preparazione",
   "Linea sul dente limato dove deve finire esattamente la corona."
  ],
  [
   "Lacca spaziatrice",
   "Vernice stesa sul moncone in strati controllati per creare lo spazio del cemento sotto la corona."
  ],
  [
   "Parallelometro",
   "Strumento che individua l'asse di inserzione comune e i sottosquadri sul modello, per scheletrati e protesi combinata."
  ],
  [
   "Forno per ceramica",
   "Forno con vuoto e programmi di cottura controllati, in cui si cuociono gli strati di ceramica."
  ],
  [
   "Scanner da laboratorio",
   "Apparecchio che rileva in 3D modelli e impronte, creando il file digitale da progettare al CAD."
  ],
  [
   "CAD/CAM",
   "Flusso digitale di progettazione (CAD) e fabbricazione assistita (CAM) dei manufatti protesici."
  ],
  [
   "Fresatore CNC",
   "Macchina comandata dal computer che scolpisce la protesi da un blocco di materiale."
  ],
  [
   "Pulitrice",
   "Motore a banco con mandrini su cui si montano spazzole e feltri per lucidare le protesi."
  ],
  [
   "Vaporizzatrice",
   "Apparecchio che produce vapore in pressione per pulire modelli, fusioni e manufatti prima della consegna."
  ],
  [
   "Saldatrice laser",
   "Apparecchio che unisce parti metalliche con un raggio laser, con poco calore e precisione puntuale."
  ]
 ]
};
Object.keys(NUOVI).forEach((n) => NUOVI[n].forEach(([it, def]) => { TERMINI[n].push([it, '']); DEFINIZIONI[n].push([def, '']); }));


// Terza fase (approvati dal prof. Cerrato il 7/11/2026): 25 termini per area per la 3F, diversi da quelli della 3E.
// Diventano i termini 41-65 di ogni area (T141-T165, ...).
const NUOVI_3F = {
 "1": [
  [
   "Giunzione amelo-cementizia",
   "Linea al colletto in cui lo smalto della corona incontra il cemento della radice."
  ],
  [
   "Giunzione amelo-dentinale",
   "Superficie di contatto tra smalto e dentina all'interno della corona."
  ],
  [
   "Prisma dello smalto",
   "Unità strutturale dello smalto: bastoncello di cristalli di idrossiapatite che va dalla dentina alla superficie."
  ],
  [
   "Odontoblasto",
   "Cellula della polpa che costruisce la dentina."
  ],
  [
   "Dentina secondaria",
   "Dentina deposta dopo la formazione della radice, che riduce lentamente la camera pulpare con l'età."
  ],
  [
   "Mammelloni",
   "Tre piccoli rilievi sul margine incisale degli incisivi appena erotti, che si consumano con l'uso."
  ],
  [
   "Cresta triangolare",
   "Rilievo che scende dall'apice di una cuspide verso il centro della faccia occlusale."
  ],
  [
   "Cresta trasversale",
   "Unione di due creste triangolari che attraversa la faccia occlusale da vestibolare a linguale."
  ],
  [
   "Convessità vestibolare",
   "Zona di massima sporgenza della faccia vestibolare, che protegge la gengiva durante la masticazione."
  ],
  [
   "Arcata dentaria",
   "Insieme dei denti di un mascellare disposti a ferro di cavallo: superiore o inferiore."
  ],
  [
   "Quadrante",
   "Ciascuna delle quattro parti in cui la linea mediana e il piano occlusale dividono la dentatura; nella FDI va da 1 a 4."
  ],
  [
   "Dentatura mista",
   "Fase tra i 6 e i 12 anni circa in cui in bocca sono presenti insieme denti decidui e permanenti."
  ],
  [
   "Eruzione dentaria",
   "Movimento con cui il dente si sposta dall'osso fino a raggiungere la sua posizione in arcata."
  ],
  [
   "Germe dentario",
   "Abbozzo del dente all'interno dell'osso, da cui si sviluppano smalto, dentina, polpa e tessuti di sostegno."
  ],
  [
   "Terzo molare",
   "Ultimo dente dell'arcata permanente, detto dente del giudizio; spesso erompe tardi o resta incluso."
  ],
  [
   "Papilla interdentale",
   "Porzione di gengiva che riempie lo spazio tra due denti vicini, sotto l'area di contatto."
  ],
  [
   "Solco gengivale",
   "Piccolo spazio tra la superficie del dente e il bordo libero della gengiva; in salute è profondo 1-3 mm."
  ],
  [
   "Recessione gengivale",
   "Ritiro del margine gengivale verso l'apice, che scopre la radice e allunga la corona clinica."
  ],
  [
   "Abrasione dentale",
   "Usura dei denti causata da agenti esterni, come uno spazzolamento troppo energico."
  ],
  [
   "Placca batterica",
   "Pellicola morbida di batteri che si forma sui denti; è la causa principale di carie e gengivite."
  ],
  [
   "Tartaro",
   "Placca batterica mineralizzata e indurita, che si rimuove solo con la pulizia professionale."
  ],
  [
   "Carie dentale",
   "Malattia che distrugge i tessuti duri del dente per gli acidi prodotti dai batteri della placca."
  ],
  [
   "Palato duro",
   "Parte anteriore e ossea del tetto della bocca, rivestita di mucosa; è la zona d'appoggio principale della protesi totale superiore."
  ],
  [
   "Tuberosità mascellare",
   "Rilievo osseo dietro l'ultimo molare superiore; nella protesi totale aiuta stabilità e ritenzione."
  ],
  [
   "Frenulo labiale",
   "Piega di mucosa che unisce il labbro alla gengiva sulla linea mediana; la protesi deve lasciargli spazio."
  ]
 ],
 "2": [
  [
   "Muscolo temporale",
   "Muscolo masticatorio a ventaglio sul lato del cranio; eleva e retrude la mandibola."
  ],
  [
   "Muscolo pterigoideo laterale",
   "Muscolo che porta in avanti il condilo: agisce nell'apertura, nella protrusione e nella lateralità."
  ],
  [
   "Muscolo pterigoideo mediale",
   "Muscolo elevatore che lavora insieme al massetere sul lato interno dell'angolo della mandibola."
  ],
  [
   "Fossa glenoidea",
   "Cavità dell'osso temporale in cui si appoggia il condilo della mandibola."
  ],
  [
   "Asse cerniera",
   "Asse immaginario passante per i due condili, attorno al quale la mandibola ruota nella prima fase di apertura."
  ],
  [
   "Angolo di Bennett",
   "Angolo formato dal percorso del condilo bilanciante con il piano sagittale nei movimenti di lateralità."
  ],
  [
   "Piano di Francoforte",
   "Piano passante per il margine inferiore dell'orbita e il margine superiore del condotto uditivo; riferimento in cefalometria."
  ],
  [
   "Cuspidi di supporto",
   "Cuspidi che occludono nelle fosse degli antagonisti e mantengono la dimensione verticale: palatine superiori e vestibolari inferiori."
  ],
  [
   "Cuspidi di guida",
   "Cuspidi non di supporto (vestibolari superiori e linguali inferiori) che guidano i movimenti e proteggono guance e lingua."
  ],
  [
   "Stop occlusale",
   "Punto di contatto stabile tra una cuspide di supporto e la superficie antagonista in massima intercuspidazione."
  ],
  [
   "Tripodismo",
   "Contatto di una cuspide su tre punti dei versanti della fossa antagonista, che ne garantisce la stabilità."
  ],
  [
   "Morso profondo",
   "Sovrapposizione verticale eccessiva: gli incisivi superiori coprono troppo quelli inferiori."
  ],
  [
   "Morso inverso",
   "Malocclusione in cui gli incisivi inferiori chiudono davanti a quelli superiori."
  ],
  [
   "Affollamento dentario",
   "Mancanza di spazio in arcata che costringe i denti a disporsi ruotati o sovrapposti."
  ],
  [
   "Masticazione",
   "Insieme dei movimenti ritmici di mandibola, lingua e guance che riducono il cibo e lo mescolano alla saliva."
  ],
  [
   "Deglutizione",
   "Atto con cui il bolo passa dalla bocca alla faringe e all'esofago; durante la deglutizione i denti vanno a contatto."
  ],
  [
   "Bruxismo",
   "Digrignamento involontario dei denti, spesso notturno, che causa usura e sovraccarico di muscoli e articolazioni."
  ],
  [
   "Click articolare",
   "Rumore secco dell'articolazione temporo-mandibolare in apertura o chiusura, spesso legato a uno spostamento del disco."
  ],
  [
   "Disfunzione temporo-mandibolare",
   "Insieme di disturbi di articolazione temporo-mandibolare e muscoli masticatori: dolore, rumori, apertura limitata."
  ],
  [
   "Placca occlusale",
   "Dispositivo in resina che copre l'arcata, detto bite, usato per proteggere i denti e rilassare la muscolatura."
  ],
  [
   "Malocclusione",
   "Qualsiasi rapporto anomalo tra i denti delle due arcate o tra le arcate e i mascellari."
  ],
  [
   "Retrusione",
   "Movimento con cui la mandibola si sposta all'indietro, opposto alla protrusione."
  ],
  [
   "Muscolo digastrico",
   "Muscolo sotto la mandibola che contribuisce ad abbassarla nell'apertura della bocca."
  ],
  [
   "Movimento di apertura",
   "Abbassamento della mandibola: prima rotazione dei condili, poi traslazione in avanti sull'eminenza."
  ],
  [
   "Apparecchio ortodontico",
   "Dispositivo fisso o mobile che applica forze controllate per spostare i denti o guidare la crescita delle ossa."
  ]
 ],
 "3": [
  [
   "Cera in lastra",
   "Cera rosa in fogli, rammollita al calore, usata per valli, placche base e prove di montaggio."
  ],
  [
   "Resina calcinabile",
   "Resina che brucia senza lasciare residui nel cilindro; usata per parti da fondere al posto della cera."
  ],
  [
   "Silicone per condensazione",
   "Elastomero da impronta che indurisce liberando alcol: più economico ma meno stabile del silicone per addizione."
  ],
  [
   "Condizionatore tessutale",
   "Materiale morbido e temporaneo applicato sotto una protesi per far guarire i tessuti irritati."
  ],
  [
   "Resina per ribasatura",
   "Resina usata per aggiungere materiale alla base di una protesi e adattarla di nuovo ai tessuti."
  ],
  [
   "Cemento vetroionomerico",
   "Cemento a base di vetro e acido poliacrilico che si lega al dente e rilascia fluoro."
  ],
  [
   "Cemento composito",
   "Cemento resinoso usato con adesivi per fissare restauri in ceramica e composito."
  ],
  [
   "Silano",
   "Agente di accoppiamento che lega chimicamente le ceramiche vetrose alla resina del cemento."
  ],
  [
   "Mordenzatura",
   "Trattamento con acido (ortofosforico sul dente, fluoridrico sulla vetroceramica) che crea microritenzioni per l'adesione."
  ],
  [
   "Glasura",
   "Strato vetroso finale cotto sulla ceramica che la rende lucida, liscia e meno abrasiva."
  ],
  [
   "Supercolori",
   "Pigmenti ceramici applicati in superficie per caratterizzare il colore: macchie, fessure, zone cervicali."
  ],
  [
   "Sinterizzazione",
   "Cottura ad alta temperatura che compatta le particelle di polvere, come nella zirconia fresata, con forte ritiro."
  ],
  [
   "Ossidazione della lega",
   "Cottura della struttura metallica che forma lo strato di ossidi necessario al legame con la ceramica."
  ],
  [
   "Ritiro di fusione",
   "Contrazione della lega durante il raffreddamento da liquida a solida, compensata dall'espansione del rivestimento."
  ],
  [
   "Resistenza alla flessione",
   "Sollecitazione massima che un materiale sopporta quando viene piegato prima di rompersi; si misura in MPa."
  ],
  [
   "Monomero residuo",
   "Quota di monomero non polimerizzato che resta nella resina; può irritare i tessuti e ridurre la resistenza."
  ],
  [
   "Scala colori",
   "Campionario di denti di riferimento usato per scegliere e comunicare il colore del restauro."
  ],
  [
   "Lega nichel-cromo",
   "Lega non nobile rigida ed economica per strutture metallo-ceramiche; il nichel può causare allergie."
  ],
  [
   "Oro",
   "Metallo nobile duttile e resistente alla corrosione, base delle leghe nobili in odontotecnica."
  ],
  [
   "Gesso ortodontico",
   "Gesso bianco tipo III, liscio e resistente, usato per i modelli di studio e ortodontici."
  ],
  [
   "Indurente per monconi",
   "Liquido che penetra nel gesso del moncone e ne aumenta durezza e resistenza all'abrasione."
  ],
  [
   "Silicone da laboratorio",
   "Silicone denso, tipo putty, usato per mascherine, chiavi e muffole in laboratorio."
  ],
  [
   "Resina per stampa 3D",
   "Resina liquida fotopolimerizzabile che la stampante indurisce strato per strato con luce UV."
  ],
  [
   "Viscosità",
   "Resistenza di un materiale fluido a scorrere; condiziona l'uso di impronte, resine e gessi."
  ],
  [
   "Elastomero",
   "Materiale da impronta gommoso ed elastico dopo l'indurimento, come siliconi e polieteri; torna alla forma originale dopo la deformazione."
  ]
 ],
 "4": [
  [
   "Protesi totale",
   "Protesi rimovibile che sostituisce tutti i denti di un'arcata, sostenuta dalla mucosa e dall'osso."
  ],
  [
   "Classificazione di Kennedy",
   "Classificazione delle arcate parzialmente edentule in quattro classi, in base alla posizione delle zone senza denti."
  ],
  [
   "Barra linguale",
   "Connettore maggiore dello scheletrato inferiore che passa dietro i denti anteriori e unisce le due parti."
  ],
  [
   "Sella",
   "Parte della protesi rimovibile che poggia sulla cresta edentula e porta i denti artificiali."
  ],
  [
   "Attacco di precisione",
   "Dispositivo a due parti che collega una protesi rimovibile a una protesi fissa senza ganci visibili."
  ],
  [
   "Ribasatura",
   "Procedura che rifà la superficie interna di una protesi rimovibile per adattarla di nuovo ai tessuti cambiati."
  ],
  [
   "Faccetta",
   "Sottile restauro in ceramica o composito incollato sulla faccia vestibolare di un dente anteriore."
  ],
  [
   "Intarsio",
   "Restauro parziale costruito in laboratorio e cementato in una cavità del dente; inlay, onlay o overlay."
  ],
  [
   "Corona metallo-ceramica",
   "Corona con struttura in lega metallica rivestita di ceramica per l'estetica."
  ],
  [
   "Stratificazione ceramica",
   "Tecnica di applicazione della ceramica a strati successivi (opaco, dentina, smalto) con più cotture."
  ],
  [
   "Pressatura",
   "Tecnica in cui una pastiglia di vetroceramica viene fusa e iniettata in uno stampo ricavato dalla ceratura."
  ],
  [
   "Provvisorio",
   "Restauro temporaneo in resina che protegge i monconi in attesa della protesi definitiva."
  ],
  [
   "Mascherina in silicone",
   "Chiave in silicone presa sulla ceratura o sul modello, usata come guida per riprodurre forme e volumi."
  ],
  [
   "Duplicazione del modello",
   "Copia del modello originale con gel o silicone, per lavorare senza rovinare il master."
  ],
  [
   "Impianto",
   "Vite in titanio inserita nell'osso che sostituisce la radice di un dente mancante."
  ],
  [
   "Moncone implantare",
   "Elemento avvitato sull'impianto che sostiene la corona protesica."
  ],
  [
   "Analogo da laboratorio",
   "Replica dell'impianto inserita nel modello in gesso per riprodurne posizione e connessione."
  ],
  [
   "Disinfezione dell'impronta",
   "Trattamento dell'impronta con disinfettante appena arriva dallo studio, prima di colarla."
  ],
  [
   "Aspiratore",
   "Impianto che cattura polveri e trucioli durante la rifinitura per proteggere chi lavora."
  ],
  [
   "Dispositivi di protezione individuale",
   "Occhiali, mascherina, guanti e camice che proteggono l'operatore da polveri, schegge e sostanze chimiche."
  ],
  [
   "Stampante 3D",
   "Apparecchio che costruisce modelli, provvisori o mascherine strato per strato da un file digitale."
  ],
  [
   "Bagno a ultrasuoni",
   "Vasca con liquido in cui le onde ultrasoniche staccano lo sporco da manufatti e strumenti."
  ],
  [
   "Prescrizione protesica",
   "Documento scritto del dentista che indica tipo di protesi, materiali, colore e caratteristiche del lavoro."
  ],
  [
   "Dichiarazione di conformità",
   "Documento con cui il laboratorio attesta che il dispositivo su misura rispetta il regolamento europeo sui dispositivi medici."
  ],
  [
   "Becco Bunsen",
   "Bruciatore a gas usato in laboratorio per scaldare spatole, cere e strumenti."
  ]
 ]
};
Object.keys(NUOVI_3F).forEach((n) => NUOVI_3F[n].forEach(([it, def]) => { TERMINI[n].push([it, '']); DEFINIZIONI[n].push([def, '']); }));

module.exports = { AREE, TERMINI, DEFINIZIONI, NOMI_ALUNNI, DOCENTI, TAPPE, SCADENZE, VALUTAZIONE, EREDITA, LINGUE, TERMINI_PER_ALUNNO, CLASSI, NOMI_3F, PARTENZA };
