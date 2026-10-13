import type { OpenedPack } from '../game/pack'
import type { Card } from '../types/card'
import type { Collection } from '../types/collection'

const STORAGE_KEY = 'mtg-pack-battler:collection'

export function loadCollection(): Collection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Collection) : {}
  } catch {
    return {}
  }
}

export function saveCollection(collection: Collection): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection))
}

function addCards(
  setCollection: Record<string, number>,
  cards: Card[],
): Record<string, number> {
  const result = { ...setCollection }
  for (const card of cards) {
    result[card.id] = (result[card.id] ?? 0) + 1
  }
  return result
}

/**
 * Fügt alle 14 gezogenen Karten eines Packs (Spielkarten + Token + Land)
 * der Sammlung des jeweiligen Sets hinzu.
 */
export function addPackToCollection(
  collection: Collection,
  setCode: string,
  pack: OpenedPack,
): Collection {
  const setCollection = addCards(collection[setCode] ?? {}, [
    ...pack.cards,
    pack.token,
    pack.land,
  ])
  return { ...collection, [setCode]: setCollection }
}

export function countOwnedCards(collection: Collection, setCode: string): number {
  const setCollection = collection[setCode]
  if (!setCollection) return 0
  return Object.values(setCollection).reduce((sum, count) => sum + count, 0)
}

export function countDistinctCards(collection: Collection, setCode: string): number {
  return Object.keys(collection[setCode] ?? {}).length
}
