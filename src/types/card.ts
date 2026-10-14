// Ausschnitt der Scryfall-Karten-Felder, die wir aktuell brauchen.
// Volles Schema: https://scryfall.com/docs/api/cards
export interface Card {
  id: string
  name: string
  manaCost: string | null
  typeLine: string
  oracleText: string | null
  power: string | null
  toughness: string | null
  colors: string[]
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus'
  imageUrl: string | null
  // Nur das Gemälde ohne Kartenrahmen — für Darstellungen wie die
  // Start-Screen-Pack-Kachel, wo eigener Text über das Bild gelegt wird.
  artCropUrl: string | null
  collectorNumber: string
}
