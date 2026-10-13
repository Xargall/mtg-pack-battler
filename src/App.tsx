import { useEffect, useState } from 'react'
import { fetchCardsBySet } from './api/scryfall'
import { openPack } from './game/pack'
import type { Card } from './types/card'
import './App.css'

const TEST_SET_CODE = 'blb' // Bloomburrow
const PACK_COUNT = 4

function App() {
  const [cardPool, setCardPool] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packs, setPacks] = useState<Card[][]>([])

  useEffect(() => {
    fetchCardsBySet(TEST_SET_CODE)
      .then((cards) => {
        setCardPool(cards)
        setPacks(Array.from({ length: PACK_COUNT }, () => openPack(cards)))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  function reshuffle() {
    setPacks(Array.from({ length: PACK_COUNT }, () => openPack(cardPool)))
  }

  if (isLoading) return <p>Lade Karten…</p>
  if (error) return <p>Fehler: {error}</p>

  return (
    <>
      <button type="button" onClick={reshuffle}>
        Neu mischen
      </button>

      {packs.map((pack, i) => (
        <section key={i}>
          <h2>Pack {i + 1}</h2>
          <div className="pack-grid">
            {pack.map((card) => (
              <figure key={card.id}>
                {card.imageUrl && <img src={card.imageUrl} alt={card.name} width={150} />}
                <figcaption>
                  {card.name} ({card.rarity})
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export default App
