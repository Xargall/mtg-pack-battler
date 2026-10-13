import { useEffect, useState } from 'react'
import { fetchBasicLands, fetchCardsBySet, fetchTokensBySet } from './api/scryfall'
import { openPack, type OpenedPack } from './game/pack'
import type { Card } from './types/card'
import './App.css'

const SET_CODE = 'blb' // Bloomburrow
const TOKEN_SET_CODE = 'tblb' // Bloomburrow-Tokens
const PACK_COUNT = 4

interface Pools {
  cards: Card[]
  tokens: Card[]
  lands: Card[]
}

function App() {
  const [pools, setPools] = useState<Pools | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packs, setPacks] = useState<OpenedPack[]>([])

  useEffect(() => {
    Promise.all([
      fetchCardsBySet(SET_CODE),
      fetchTokensBySet(TOKEN_SET_CODE),
      fetchBasicLands(SET_CODE),
    ])
      .then(([cards, tokens, lands]) => {
        setPools({ cards, tokens, lands })
        setPacks(
          Array.from({ length: PACK_COUNT }, () => openPack(cards, tokens, lands)),
        )
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  function reshuffle() {
    if (!pools) return
    setPacks(
      Array.from({ length: PACK_COUNT }, () => openPack(pools.cards, pools.tokens, pools.lands)),
    )
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

          <h3>Spielkarten</h3>
          <div className="pack-grid">
            {pack.cards.map((card) => (
              <CardFigure key={card.id} card={card} />
            ))}
          </div>

          <h3>Beiseitegelegt</h3>
          <div className="pack-grid">
            <CardFigure card={pack.token} />
            <CardFigure card={pack.land} />
          </div>
        </section>
      ))}
    </>
  )
}

function CardFigure({ card }: { card: Card }) {
  return (
    <figure>
      {card.imageUrl && <img src={card.imageUrl} alt={card.name} width={150} />}
      <figcaption>
        {card.name} ({card.rarity})
      </figcaption>
    </figure>
  )
}

export default App
