# MTG Pack Battler — Konzept

## Grundidee

Eigenständige App im Stil von Pokémon TCG Pocket, aber für Magic: The Gathering.
Fokus liegt primär auf Sammeln & Pack-Öffnen, ergänzt um Kämpfe gegen eine KI
("Kai") im Pai-Gow-Stil, um Regeln zu lernen und Decks ohne Geldeinsatz
auszuprobieren.

### Motivation

- MTG Arena reizt nicht: kaum kostenlose/leicht erspielbare Packs, Fokus nur
  auf PvP
- Viele starke Decks anderer Spieler basieren auf teuren Karten
- App soll kostenloser Sandkasten sein: Decks bauen & testen, Synergien
  verstehen, ohne echtes Geld
- Aktuell niemand vorhanden, mit dem MTG gespielt wird — KI-Gegner "Kai"
  füllt diese Lücke
- Nebenhoffnung: App könnte andere im Umfeld zum Einstieg motivieren

## Kampfsystem — Pai-Gow-Stil

Bewusste Vereinfachung gegenüber echtem MTG (kein Stack, keine
Priorität/Interrupts), um die Regel-Engine überschaubar zu halten.

- **Draft-Basis:** Spieler und KI öffnen jeweils ein Play-Booster-Pack aus
  derselben Serie (z. B. Bloomburrow). Ein Play-Booster enthält laut echten
  Booster-Collation-Daten (siehe Tech-Entscheidungen) 14 "echte" Magic-Karten
  — 13 Spielkarten + 1 Standardland — plus 1 Token/Ad-Karte als Bonus-Insert
  obendrauf (zählt offiziell nicht zu den 14). Token & Land werden
  automatisch beiseitegelegt (keine Effekte), außer der Token wird für eine
  Mini-Deck-Kombo gebraucht
- **Deckbau:** aus den 13 Spielkarten des eigenen Packs werden 4 Mini-Decks
  à 3 Karten gebaut (1 Karte bleibt ungenutzt) — Kernspielreiz: beste
  Kombinationen aus dem eigenen Pack basteln
- **Ablauf:** 4 Runden nacheinander, jeweils Mini-Deck gegen Mini-Deck
- **Rundenwahl:** Spieler wählt selbst, welches seiner 4 Mini-Decks er in
  welcher Runde einsetzt (taktisches Element)
- **Leben:** 5 Leben pro Runde (nicht gemeinsam über alle Runden) → 20
  Leben-Budget insgesamt über das Match. Verloren durch jeden Effekt
  (Kampfschaden, Zaubersprüche etc.)
- **Rundenende:**
  1. Ein Spieler steht bei 0/5 Leben → verliert die Runde
  2. Alle Karten/Effekte abgehandelt, niemand bei 0 → Draw für diese Runde
- **Matchergebnis:** zählt über gewonnene Runden (von 4). Bei Gleichstand
  nach allen 4 Runden gilt das gesamte Match als Draw
- **Mana:** unendlich — nimmt Ressourcenmanagement raus, Fokus liegt
  komplett auf Kartensynergien
- **Ziel:** kurze, knackige Kämpfe; Synergien ausprobieren statt lange
  Partien

## Pack-Einsatz als Wett-Mechanik

Zentraler Reiz des Pai-Gow-Modus: das eigene Pack steht beim Match
"auf dem Spiel".

- Gezogene Pack-Karten werden erst nach Abschluss des Matches der eigenen
  Sammlung hinzugefügt
- Sieger erhält die Karten aus beiden Packs (eigenes + gegnerisches)
- Verlierer geht komplett leer aus
- Bei Draw: jeder behält nur sein eigenes Pack
- Risiko ist bewusst gewollt (kein risikofreier Modus) — App ist primär für
  Eigengebrauch, keine Monetarisierung geplant

## Sammlung

Neben dem Pai-Gow-Modus kann man Packs auch einfach so öffnen (ohne
Wett-Risiko) — ähnlich Pokémon TCG Pocket. Diese Karten wandern direkt und
dauerhaft in die Sammlung.

- Jedes Set sammelt für sich (eigene Sammlung pro Serie, kein gemeinsamer
  Pool über mehrere Sets)
- Alle 15 gezogenen Karten eines Packs wandern in die Sammlung, inklusive
  Token und Standardland (nicht nur die 13 Spielkarten)
- Persistiert lokal via localStorage (siehe Tech-Entscheidungen — kein
  Backend)
- Im Pai-Gow-Modus bleibt es beim Wett-Prinzip: dort landen die Karten erst
  nach Matchende in der Sammlung, abhängig vom Ergebnis (siehe oben)

## Offene Punkte (noch nicht final entschieden)

- Welches Kartenset/welche Mechaniken unterstützt werden (Vanilla-Creatures
  zuerst, dann schrittweise Keyword-Abilities wie Flying/Trample, einfache
  Instants/Sorceries ohne komplexe Trigger-Ketten)
- KI-Logik für "Kai": Deckbau-Heuristik und Rundenwahl-Strategie
- Wie das Pack-Einsatz-Risiko im UI kommuniziert wird, damit klar ist, dass
  das Pack riskiert wird
- Pack-Öffnen-Cooldown: Packs sollen nicht beliebig oft direkt
  hintereinander geöffnet werden können, sondern erst nach einer gewissen
  Zeit wieder verfügbar sein — ähnlich dem Pack-System von Pokémon TCG
  Pocket. Soll das Sammeln bewusst entschleunigen (siehe auch:
  Duplikate innerhalb eines Packs sind gewollt, aus demselben Grund)

## Tech-Entscheidungen (bewusst getroffen, bitte nicht in Frage stellen)

- React + TypeScript + Vite als Stack (statt Flutter — kein Mac-Gerät für
  iOS-Builds vorhanden, eigenes Gerät ist ein iPhone, PWA macht das
  Build-Problem überflüssig)
- Vorerst KEIN Backend — Collection/Packs/State werden lokal im Browser
  gespeichert (localStorage/IndexedDB). Grund: Backend-Kurs im Bootcamp
  startet nächste Woche, danach bewusste Entscheidung ob eigenes Backend
  oder Supabase/Firebase. Backend-Thema also erstmal komplett außen vor.
- Kartendaten: Scryfall API (gleiche Quelle wie im separaten
  mtg-collection-app-Projekt). Liefert auch Karten-Bilder mit (`image_uris`)
  — eignet sich daher sowohl fürs Pack-Öffnen-Reveal als auch für die
  Sammlungsansicht
- ESLint ist Teil des Setups (Standard-Vite-Template-Config reicht)
- Pack-Zusammensetzung: echte Booster-Collation-Daten (gewichtete
  Rarity-Sheets je Set) von github.com/taw/magic-sealed-data, statt
  eigener Näherung. Per `scripts/fetch-booster-collation.mjs` einmalig pro
  Set abgerufen und als statisches JSON unter `src/game/data/collation/`
  abgelegt (kein Live-Fetch im Browser — passt zur
  Rohdaten-cachen-Idee unten). Repo hat keine LICENSE-Datei; für dieses
  private Hobbyprojekt als unkritisch eingestuft, nicht weiter geprüft.
  Sheets, die auf ein anderes Set verweisen (z. B. Special-Guest-Crossover-
  Karten), werden beim Extrahieren übersprungen, nicht nachgebaut. Sets
  ohne extrahierte Collation-Datei fallen auf eine grobe
  Rarity-Näherung zurück (`openPackApprox` in `src/game/pack.ts`)

## Spätere Idee: Scryfall-Rohdaten cachen

Noch nicht umgesetzt — erst relevant, wenn das Pack-System steht.

- Scryfall-Rohdaten (Set-Kartenlisten) per GitHub Actions regelmäßig
  abrufen und als statisches JSON im Repo zwischenspeichern, statt bei
  jedem App-Start live gegen die Scryfall-API zu fragen
- Ziel: unnötigen Traffic zu Stoßzeiten vermeiden, schnellere Ladezeit
  für den Nutzer
- Kein eigenes Backend nötig dafür — reiner Build-/CI-Schritt, der
  statische Daten erzeugt, passt also zur aktuellen No-Backend-Entscheidung
