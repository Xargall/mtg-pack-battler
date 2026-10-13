// Sammlung, gruppiert nach Set-Code. Pro Set: Scryfall-Karten-ID -> Anzahl
// besessener Exemplare. Jedes Set sammelt für sich (wie bei TCG Pocket).
export interface Collection {
  [setCode: string]: {
    [cardId: string]: number
  }
}
