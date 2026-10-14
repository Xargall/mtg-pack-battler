#!/usr/bin/env node
// Holt echte Play-Booster-Zusammensetzungen (Rarity-Sheets samt Gewichtung)
// von github.com/taw/magic-sealed-data und schneidet sie auf die Sets zu,
// die wir aktuell unterstützen. Lauf manuell bei Bedarf (neues Set
// hinzugefügt / Daten aktualisieren):
//
//   node scripts/fetch-booster-collation.mjs
//
// Das Ergebnis landet als statisches JSON in src/game/data/collation/ und
// wird zur Laufzeit importiert — kein Live-Fetch gegen GitHub im Browser.
// Gehört zur selben "Rohdaten cachen statt live abfragen"-Idee wie die
// geplante Scryfall-Zwischenspeicherung (siehe docs/IDEAS.md).

import { mkdir, writeFile } from 'node:fs/promises'

const SEALED_DATA_URL = 'https://raw.githubusercontent.com/taw/magic-sealed-data/master/sealed_basic_data.json'

// Muss manuell mit src/game/sets.ts synchron gehalten werden — dieses
// Skript läuft außerhalb der Vite/TS-Pipeline, daher kein Import von dort.
const SET_CODES = ['blb', 'dsk']

const outDir = new URL('../src/game/data/collation/', import.meta.url)

function stripCardKey(setCode, rawKey) {
  // "blb:102" oder "blb:102:foil" -> "102". Die Foil-Kennzeichnung
  // ignorieren wir (noch) — unser Kartenmodell unterscheidet nicht
  // zwischen Foil/Non-Foil, nur zwischen Drucken (Collector Number).
  const [prefix, number] = rawKey.split(':')
  if (prefix !== setCode) return null
  return number
}

function extractSheet(setCode, rawSheet) {
  const cards = {}
  for (const [rawKey, weight] of Object.entries(rawSheet.cards)) {
    const number = stripCardKey(setCode, rawKey)
    if (number === null) return null // Sheet verweist auf ein anderes Set — nicht self-contained
    cards[number] = (cards[number] ?? 0) + weight
  }
  return { totalWeight: rawSheet.total_weight, cards }
}

function extractCollation(setCode, boosterEntry) {
  const rawSheets = boosterEntry.sheets
  const sheets = {}
  const boosters = []

  for (const variant of boosterEntry.boosters) {
    const sheetNames = Object.keys(variant.sheets)
    const extractedSheets = {}
    let selfContained = true

    for (const name of sheetNames) {
      if (!(name in sheets)) {
        const extracted = extractSheet(setCode, rawSheets[name])
        if (extracted === null) {
          selfContained = false
          break
        }
        extractedSheets[name] = extracted
      }
    }

    if (!selfContained) continue // z.B. "special_guest"-Varianten, die auf ein Crossover-Set (spg) verweisen
    Object.assign(sheets, extractedSheets)
    boosters.push({ sheets: variant.sheets, weight: variant.weight })
  }

  return { boosters, sheets }
}

async function main() {
  console.log(`Lade ${SEALED_DATA_URL} …`)
  const response = await fetch(SEALED_DATA_URL)
  if (!response.ok) throw new Error(`Download fehlgeschlagen: ${response.status}`)
  const allBoosters = await response.json()

  await mkdir(outDir, { recursive: true })

  for (const setCode of SET_CODES) {
    const entry = allBoosters.find((b) => b.code === `${setCode}-play`)
    if (!entry) {
      console.warn(`⚠ Kein "${setCode}-play" Play-Booster-Eintrag gefunden — übersprungen.`)
      continue
    }

    const collation = extractCollation(setCode, entry)
    const droppedVariants = entry.boosters.length - collation.boosters.length
    const outPath = new URL(`${setCode}.json`, outDir)
    await writeFile(outPath, JSON.stringify(collation, null, 2))

    console.log(
      `✓ ${setCode}: ${collation.boosters.length} Booster-Varianten (${droppedVariants} wegen Crossover-Sheets übersprungen), ${Object.keys(collation.sheets).length} Sheets -> ${outPath.pathname}`,
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
