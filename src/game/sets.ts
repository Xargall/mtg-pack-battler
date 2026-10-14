export interface SetConfig {
  code: string
  tokenSetCode: string
  name: string
}

// Jeder Eintrag bekommt automatisch eine eigene Pack-Kachel zur Auswahl auf
// dem Start-Screen und eine eigene Sammlung (siehe storage/collection.ts).
// Weitere Sets lassen sich also einfach durch Ergänzen eines Eintrags
// anbinden.
export const AVAILABLE_SETS: SetConfig[] = [
  { code: 'blb', tokenSetCode: 'tblb', name: 'Bloomburrow' },
  { code: 'dsk', tokenSetCode: 'tdsk', name: 'Duskmourn' },
]
