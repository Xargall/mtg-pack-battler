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
  collectorNumber: string
}
