import type { Card } from '../types/card'

const COMMON_COUNT = 6
const UNCOMMON_COUNT = 3
const WILDCARD_COUNT = 2
const RARE_MYTHIC_SLOT_COUNT = 1

// Chance auf Mythic statt Rare im garantierten Rare/Mythic-Slot,
// angenähert an echte Booster-Odds (ca. 1 von 8 Packs).
const MYTHIC_CHANCE_IN_RARE_SLOT = 1 / 8

export interface OpenedPack {
  cards: Card[] // die 12 Spielkarten für den Deckbau
  token: Card
  land: Card
}

interface RarityPool {
  common: Card[]
  uncommon: Card[]
  rare: Card[]
  mythic: Card[]
}

function groupByRarity(cards: Card[]): RarityPool {
  return {
    common: cards.filter((c) => c.rarity === 'common'),
    uncommon: cards.filter((c) => c.rarity === 'uncommon'),
    rare: cards.filter((c) => c.rarity === 'rare'),
    mythic: cards.filter((c) => c.rarity === 'mythic'),
  }
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function pickUnique<T>(pool: T[], count: number): T[] {
  return shuffle(pool).slice(0, count)
}

function pickOne<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

// Wildcard-Slot: Rarity-Gewichtung angenähert an echte Booster-Odds.
function pickWildcard(pool: RarityPool): Card {
  const roll = Math.random()
  if (roll < 0.6) return pickOne(pool.common)
  if (roll < 0.85) return pickOne(pool.uncommon)
  if (roll < 0.97) return pickOne(pool.rare)
  return pickOne(pool.mythic)
}

function pickRareOrMythic(pool: RarityPool): Card {
  return Math.random() < MYTHIC_CHANCE_IN_RARE_SLOT ? pickOne(pool.mythic) : pickOne(pool.rare)
}

/**
 * Stellt die 12 Spielkarten eines Packs zusammen: 6 Common, 3 Uncommon,
 * 2 Wildcard-Slots (zufällige Rarity) und 1 garantierter Rare/Mythic-Slot.
 * Basic Lands werden hier ausgeschlossen — die kommen separat über den
 * eigenen Land-Slot.
 */
function pickPlayableCards(cardPool: Card[]): Card[] {
  const byRarity = groupByRarity(cardPool.filter((c) => !c.typeLine.includes('Basic Land')))

  return [
    ...pickUnique(byRarity.common, COMMON_COUNT),
    ...pickUnique(byRarity.uncommon, UNCOMMON_COUNT),
    ...Array.from({ length: WILDCARD_COUNT }, () => pickWildcard(byRarity)),
    ...Array.from({ length: RARE_MYTHIC_SLOT_COUNT }, () => pickRareOrMythic(byRarity)),
  ]
}

/**
 * Öffnet ein Play-Booster-Pack: 12 Spielkarten + 1 Token + 1 Standardland.
 * Token und Land werden separat übergeben, da sie aus eigenen
 * Scryfall-Abfragen stammen (Token-Set bzw. `type:basic`).
 */
export function openPack(cardPool: Card[], tokenPool: Card[], landPool: Card[]): OpenedPack {
  return {
    cards: pickPlayableCards(cardPool),
    token: pickOne(tokenPool),
    land: pickOne(landPool),
  }
}
