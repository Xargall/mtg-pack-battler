import type { Card } from '../types/card'

const PACK_SIZE = 14

/**
 * Rein zufällige Ziehung von `size` Karten aus dem Pool, ohne Zurücklegen.
 * Noch keine Rarity-Slots, kein Token/Land — reiner Sanity-Check, ob die
 * Zufallsauswahl aus den Scryfall-Daten funktioniert.
 */
export function openPack(pool: Card[], size = PACK_SIZE): Card[] {
  const shuffled = [...pool]

  // Fisher-Yates-Shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, size)
}
