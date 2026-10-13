import type { Card } from '../types/card'

// Scryfall liefert pro Suchanfrage max. 175 Karten zurück (Pagination).
// Rohform der API-Antwort, nur die Felder, die wir tatsächlich auslesen.
interface ScryfallCardFace {
  mana_cost?: string
  power?: string
  toughness?: string
  image_uris?: { normal?: string }
}

interface ScryfallCard {
  id: string
  name: string
  mana_cost?: string
  type_line: string
  oracle_text?: string
  power?: string
  toughness?: string
  colors?: string[]
  rarity: Card['rarity']
  collector_number: string
  image_uris?: { normal?: string }
  card_faces?: ScryfallCardFace[]
}

interface ScryfallSearchResponse {
  data: ScryfallCard[]
  has_more: boolean
  next_page?: string
}

function toCard(raw: ScryfallCard): Card {
  // Doppelseitige Karten (z. B. Adventure, Transform) tragen Bild/Manakosten
  // auf der ersten "face" statt auf der Karte selbst.
  const face = raw.card_faces?.[0]

  return {
    id: raw.id,
    name: raw.name,
    manaCost: raw.mana_cost ?? face?.mana_cost ?? null,
    typeLine: raw.type_line,
    oracleText: raw.oracle_text ?? null,
    power: raw.power ?? face?.power ?? null,
    toughness: raw.toughness ?? face?.toughness ?? null,
    colors: raw.colors ?? [],
    rarity: raw.rarity,
    imageUrl: raw.image_uris?.normal ?? face?.image_uris?.normal ?? null,
    collectorNumber: raw.collector_number,
  }
}

const SCRYFALL_SEARCH_URL = 'https://api.scryfall.com/cards/search'

// Höfliche Pause zwischen Pagination-Requests, siehe Scryfall API-Etikette:
// https://scryfall.com/docs/api#rate-limits-and-good-citizenship
const REQUEST_DELAY_MS = 100

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function searchCards(query: string): Promise<Card[]> {
  const cards: Card[] = []
  let url: string | undefined =
    `${SCRYFALL_SEARCH_URL}?q=${encodeURIComponent(query)}&order=set&unique=prints`

  while (url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Scryfall-Anfrage fehlgeschlagen: ${response.status}`)
    }

    const page: ScryfallSearchResponse = await response.json()
    cards.push(...page.data.map(toCard))

    url = page.has_more ? page.next_page : undefined
    if (url) {
      await wait(REQUEST_DELAY_MS)
    }
  }

  return cards
}

/** Lädt alle regulären Spielkarten eines Sets, inklusive Basic Lands. */
export function fetchCardsBySet(setCode: string): Promise<Card[]> {
  return searchCards(`set:${setCode}`)
}

/**
 * Lädt die Tokens eines Sets über dessen eigenen Token-Set-Code (z. B. "tblb").
 * `layout:token` schließt Emblems & Co. aus, die Scryfall im selben
 * Token-Set mitführt, aber nie als physische Karte gedruckt werden.
 */
export function fetchTokensBySet(tokenSetCode: string): Promise<Card[]> {
  return searchCards(`set:${tokenSetCode} layout:token`)
}

/** Lädt nur die Standardländer (Forest/Island/Mountain/Plains/Swamp) eines Sets. */
export function fetchBasicLands(setCode: string): Promise<Card[]> {
  return searchCards(`set:${setCode} type:basic`)
}
