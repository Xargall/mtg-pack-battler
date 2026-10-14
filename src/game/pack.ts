import { getCollation, type CollationBoosterVariant, type CollationSheet, type SetCollation } from './collation'
import type { Card } from '../types/card'

const COMMON_COUNT = 6
const UNCOMMON_COUNT = 3
const WILDCARD_COUNT = 2
const RARE_MYTHIC_SLOT_COUNT = 1

// Chance auf Mythic statt Rare im garantierten Rare/Mythic-Slot,
// angenähert an echte Booster-Odds (ca. 1 von 8 Packs).
const MYTHIC_CHANCE_IN_RARE_SLOT = 1 / 8

export interface OpenedPack {
  cards: Card[] // die Spielkarten für den Deckbau (ohne Land)
  token: Card
  land: Card
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function pickOne<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Öffnet ein Pack mit der echten Booster-Zusammensetzung des Sets, falls
 * via scripts/fetch-booster-collation.mjs vorab geladen (siehe
 * src/game/collation.ts). Fällt sonst auf eine grobe Rarity-Näherung
 * zurück (siehe openPackApprox), z. B. für neu hinzugefügte Sets, für die
 * das Skript noch nicht gelaufen ist.
 */
export function openPack(setCode: string, cardPool: Card[], tokenPool: Card[], landPool: Card[]): OpenedPack {
  const collation = getCollation(setCode)
  if (!collation) return openPackApprox(cardPool, tokenPool, landPool)

  const cardsByNumber = new Map<string, Card>()
  for (const card of [...cardPool, ...landPool]) cardsByNumber.set(card.collectorNumber, card)

  return openPackFromCollation(collation, cardsByNumber, tokenPool)
}

function pickWeightedKey(entries: [string, number][]): string {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [key, weight] of entries) {
    roll -= weight
    if (roll <= 0) return key
  }
  return entries[entries.length - 1][0]
}

/**
 * Zieht `count` Karten aus einem Sheet, gewichtet nach den Druck-Gewichten.
 * Namensgleiche Karten innerhalb desselben Sheets werden neu gewürfelt
 * (wie von magic-sealed-data empfohlen) — Duplikate über verschiedene
 * Sheets hinweg (z. B. Common- und Wildcard-Slot) bleiben erlaubt, das
 * entspricht echten Booster-Odds.
 */
function drawFromSheet(sheet: CollationSheet, count: number, cardsByNumber: Map<string, Card>): Card[] {
  const entries = Object.entries(sheet.cards)
  const picked: Card[] = []
  const pickedNames = new Set<string>()
  const maxAttempts = count * 200

  for (let attempts = 0; picked.length < count && attempts < maxAttempts; attempts++) {
    const collectorNumber = pickWeightedKey(entries)
    const card = cardsByNumber.get(collectorNumber)
    if (!card || pickedNames.has(card.name)) continue
    pickedNames.add(card.name)
    picked.push(card)
  }

  // Falls das Sheet weniger eindeutige Namen hat als `count` (sollte bei
  // unseren Sheet-Größen nicht vorkommen), den Rest ohne Dedup auffüllen,
  // damit immer `count` Karten zurückkommen.
  while (picked.length < count) {
    const card = cardsByNumber.get(pickWeightedKey(entries))
    if (card) picked.push(card)
  }

  return picked
}

function pickVariant(boosters: CollationBoosterVariant[]): CollationBoosterVariant {
  const total = boosters.reduce((sum, b) => sum + b.weight, 0)
  let roll = Math.random() * total
  for (const variant of boosters) {
    roll -= variant.weight
    if (roll <= 0) return variant
  }
  return boosters[boosters.length - 1]
}

const LAND_SHEET_NAMES = new Set(['land', 'foil_land'])

function openPackFromCollation(
  collation: SetCollation,
  cardsByNumber: Map<string, Card>,
  tokenPool: Card[],
): OpenedPack {
  const variant = pickVariant(collation.boosters)
  const cards: Card[] = []
  let land: Card | undefined

  for (const [sheetName, count] of Object.entries(variant.sheets)) {
    const sheet = collation.sheets[sheetName]
    if (!sheet) continue
    const drawn = drawFromSheet(sheet, count, cardsByNumber)
    if (LAND_SHEET_NAMES.has(sheetName)) {
      land = drawn[0] ?? land
    } else {
      cards.push(...drawn)
    }
  }

  if (!land) throw new Error('Collation enthält kein Land-Sheet')
  return { cards, land, token: pickOne(tokenPool) }
}

// --- Fallback für Sets ohne echte Collation-Daten ---

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

function pickUnique<T>(pool: T[], count: number): T[] {
  return shuffle(pool).slice(0, count)
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

function pickPlayableCardsApprox(cardPool: Card[]): Card[] {
  const byRarity = groupByRarity(cardPool.filter((c) => !c.typeLine.includes('Basic Land')))

  return [
    ...pickUnique(byRarity.common, COMMON_COUNT),
    ...pickUnique(byRarity.uncommon, UNCOMMON_COUNT),
    ...Array.from({ length: WILDCARD_COUNT }, () => pickWildcard(byRarity)),
    ...Array.from({ length: RARE_MYTHIC_SLOT_COUNT }, () => pickRareOrMythic(byRarity)),
  ]
}

function openPackApprox(cardPool: Card[], tokenPool: Card[], landPool: Card[]): OpenedPack {
  return {
    cards: pickPlayableCardsApprox(cardPool),
    token: pickOne(tokenPool),
    land: pickOne(landPool),
  }
}
