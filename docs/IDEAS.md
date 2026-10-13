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
  derselben Serie (z. B. Bloomburrow). Ein Play-Booster enthält 14 Karten:
  12 Spielkarten + 1 Token + 1 Standardland. Token & Land werden automatisch
  beiseitegelegt (keine Effekte), außer der Token wird für eine
  Mini-Deck-Kombo gebraucht
- **Deckbau:** aus den 12 Spielkarten des eigenen Packs werden 4 Mini-Decks
  à 3 Karten gebaut — Kernspielreiz: beste Kombinationen aus dem eigenen
  Pack basteln
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

## Offene Punkte (noch nicht final entschieden)

- Welches Kartenset/welche Mechaniken unterstützt werden (Vanilla-Creatures
  zuerst, dann schrittweise Keyword-Abilities wie Flying/Trample, einfache
  Instants/Sorceries ohne komplexe Trigger-Ketten)
- KI-Logik für "Kai": Deckbau-Heuristik und Rundenwahl-Strategie
- Wie das Pack-Einsatz-Risiko im UI kommuniziert wird, damit klar ist, dass
  das Pack riskiert wird

## Tech-Entscheidungen (bewusst getroffen, bitte nicht in Frage stellen)

- React + TypeScript + Vite als Stack (statt Flutter — kein Mac-Gerät für
  iOS-Builds vorhanden, eigenes Gerät ist ein iPhone, PWA macht das
  Build-Problem überflüssig)
- Vorerst KEIN Backend — Collection/Packs/State werden lokal im Browser
  gespeichert (localStorage/IndexedDB). Grund: Backend-Kurs im Bootcamp
  startet nächste Woche, danach bewusste Entscheidung ob eigenes Backend
  oder Supabase/Firebase. Backend-Thema also erstmal komplett außen vor.
- Kartendaten: Scryfall API (gleiche Quelle wie im separaten
  mtg-collection-app-Projekt)
- ESLint ist Teil des Setups (Standard-Vite-Template-Config reicht)
