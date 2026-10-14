// Echte Play-Booster-Zusammensetzung (Rarity-Sheets samt Gewichtung), via
// scripts/fetch-booster-collation.mjs aus github.com/taw/magic-sealed-data
// gezogen und als statisches JSON abgelegt — siehe src/game/data/collation/.

export interface CollationSheet {
  totalWeight: number
  // Collector Number (als String, ohne Set-Präfix) -> Gewichtung
  cards: Record<string, number>
}

export interface CollationBoosterVariant {
  // Sheet-Name -> Anzahl zu ziehender Karten aus diesem Sheet
  sheets: Record<string, number>
  weight: number
}

export interface SetCollation {
  boosters: CollationBoosterVariant[]
  sheets: Record<string, CollationSheet>
}

const collationModules = import.meta.glob<SetCollation>('./data/collation/*.json', {
  eager: true,
  import: 'default',
})

const collationsByCode: Record<string, SetCollation> = {}
for (const path in collationModules) {
  const code = path.match(/([^/]+)\.json$/)?.[1]
  if (code) collationsByCode[code] = collationModules[path]
}

/** Liefert die echte Booster-Zusammensetzung eines Sets, falls vorhanden. */
export function getCollation(setCode: string): SetCollation | undefined {
  return collationsByCode[setCode]
}
