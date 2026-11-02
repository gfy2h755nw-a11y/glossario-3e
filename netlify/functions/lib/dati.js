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
  {
    "data": "2026-11-03",
    "testo": "Presentazione del progetto, gruppi e codici personali"
  },
  {
    "data": "2026-11-13",
    "chiave": "it",
    "testo": "Scadenza italiano: risposta a tutti e 5 i termini"
  },
  {
    "data": "2026-11-20",
    "testo": "Italiano corretto e approvato dal prof. Cerrato"
  },
  {
    "data": "2026-11-27",
    "chiave": "en",
    "testo": "Scadenza inglese: risposta a tutti e 5 i termini"
  },
  {
    "data": "2026-12-03",
    "testo": "Inglese corretto e approvato dalla prof.ssa Aliboni: l'app si chiude"
  },
  {
    "data": "2026-12-07",
    "testo": "Cartelloni definitivi in tipografia"
  },
  {
    "data": "2026-12-11",
    "testo": "Consegna e presentazione dei cartelloni"
  }
];

// Scadenze iniziali (modificabili dall'area docenti, solo prof. Cerrato). Ora italiana.
const SCADENZE = { it: '2026-11-13T23:59:00+01:00', en: '2026-11-27T23:59:00+01:00' };

// Valutazione: voto massimo 8; proposta A = -0,25 per errore, B = -0,50 (scelta dall'area docenti).
// tettoEredeInRitardo: chi non risponde in tempo ai termini ricevuti da un escluso non può superare questo voto
const VALUTAZIONE = { votoMax: 8, votoMaxErede: 10, votoMin: 4, votoEsclusione: 4, tettoEredeInRitardo: 6, proposta: 'A' };

// Termini degli esclusi: passano a sorte a un compagno, che ha questi giorni (dalla riassegnazione) per rispondere.
const EREDITA = { giorniIt: 2, giorniEn: 4 };

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

module.exports = { AREE, TERMINI, DEFINIZIONI, NOMI_ALUNNI, DOCENTI, TAPPE, SCADENZE, VALUTAZIONE, EREDITA };
