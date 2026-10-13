import { useEffect, useState } from 'react'
import { fetchCardsBySet } from './api/scryfall'
import type { Card } from './types/card'
import './App.css'

// Sanity-Check für die Scryfall-Anbindung: lädt ein Set und zeigt die
// Rohdaten als Liste. Wird durch die echte Pack-UI ersetzt.
const TEST_SET_CODE = 'blb' // Bloomburrow

function App() {
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCardsBySet(TEST_SET_CODE)
      .then(setCards)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <p>Lade Karten…</p>
  if (error) return <p>Fehler: {error}</p>

  return (
    <ul>
      {cards.map((card) => (
        <li key={card.id}>
          {card.name} — {card.manaCost ?? '–'} — {card.typeLine} ({card.rarity})
        </li>
      ))}
    </ul>
  )
}

export default App
