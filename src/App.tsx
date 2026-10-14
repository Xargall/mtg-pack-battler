import { useEffect, useState } from 'react'
import { fetchBasicLands, fetchCardsBySet, fetchTokensBySet } from './api/scryfall'
import { CollectionView } from './components/CollectionView'
import { openPack, type OpenedPack } from './game/pack'
import { addPackToCollection, countDistinctCards, countOwnedCards, loadCollection, saveCollection } from './storage/collection'
import type { Card } from './types/card'
import type { Collection } from './types/collection'
import './App.css'

const SET_CODE = 'blb' // Bloomburrow
const TOKEN_SET_CODE = 'tblb' // Bloomburrow-Tokens
const PREVIEW_PACK_COUNT = 4

interface Pools {
  cards: Card[]
  tokens: Card[]
  lands: Card[]
}

type View = 'open' | 'collection'

function App() {
  const [pools, setPools] = useState<Pools | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewPacks, setPreviewPacks] = useState<OpenedPack[]>([])
  const [lastOpenedPack, setLastOpenedPack] = useState<OpenedPack | null>(null)
  const [collection, setCollection] = useState<Collection>(loadCollection)
  const [view, setView] = useState<View>('open')

  useEffect(() => {
    Promise.all([
      fetchCardsBySet(SET_CODE),
      fetchTokensBySet(TOKEN_SET_CODE),
      fetchBasicLands(SET_CODE),
    ])
      .then(([cards, tokens, lands]) => {
        setPools({ cards, tokens, lands })
        setPreviewPacks(
          Array.from({ length: PREVIEW_PACK_COUNT }, () => openPack(cards, tokens, lands)),
        )
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  // Sammlung bei jeder Änderung persistieren.
  useEffect(() => {
    saveCollection(collection)
  }, [collection])

  function reshufflePreview() {
    if (!pools) return
    setPreviewPacks(
      Array.from({ length: PREVIEW_PACK_COUNT }, () =>
        openPack(pools.cards, pools.tokens, pools.lands),
      ),
    )
  }

  function openAndCollectPack() {
    if (!pools) return
    const pack = openPack(pools.cards, pools.tokens, pools.lands)
    setLastOpenedPack(pack)
    setCollection((c) => addPackToCollection(c, SET_CODE, pack))
  }

  if (isLoading) return <p>Lade Karten…</p>
  if (error) return <p>Fehler: {error}</p>
  if (!pools) return null

  const totalPrints = pools.cards.length + pools.tokens.length + pools.lands.length

  return (
    <>
      <nav className="view-switch">
        <button type="button" disabled={view === 'open'} onClick={() => setView('open')}>
          Packs öffnen
        </button>
        <button type="button" disabled={view === 'collection'} onClick={() => setView('collection')}>
          Sammlung
        </button>
      </nav>

      <p>
        {countDistinctCards(collection, SET_CODE)} / {totalPrints} verschiedene Karten,{' '}
        {countOwnedCards(collection, SET_CODE)} Karten insgesamt
      </p>

      {view === 'open' ? (
        <>
          <section>
            <h2>Bloomburrow</h2>
            <button type="button" onClick={openAndCollectPack}>
              Pack öffnen
            </button>

            {lastOpenedPack && (
              <>
                <h3>Zuletzt geöffnet</h3>
                <PackView pack={lastOpenedPack} />
              </>
            )}
          </section>

          <hr />

          <section>
            <h2>Vorschau (Testerei — ändert die Sammlung nicht)</h2>
            <button type="button" onClick={reshufflePreview}>
              Neu mischen
            </button>

            {previewPacks.map((pack, i) => (
              <div key={i}>
                <h3>Pack {i + 1}</h3>
                <PackView pack={pack} />
              </div>
            ))}
          </section>
        </>
      ) : (
        <section>
          <h2>Sammlung — Bloomburrow</h2>
          <CollectionView
            cards={pools.cards}
            tokens={pools.tokens}
            lands={pools.lands}
            setCollection={collection[SET_CODE]}
          />
        </section>
      )}
    </>
  )
}

function PackView({ pack }: { pack: OpenedPack }) {
  return (
    <>
      <div className="pack-grid">
        {pack.cards.map((card) => (
          <CardFigure key={card.id} card={card} />
        ))}
      </div>
      <div className="pack-grid">
        <CardFigure card={pack.token} />
        <CardFigure card={pack.land} />
      </div>
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
