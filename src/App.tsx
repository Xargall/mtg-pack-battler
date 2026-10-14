import { useEffect, useMemo, useState } from 'react'
import { fetchBasicLands, fetchCardsBySet, fetchTokensBySet } from './api/scryfall'
import { BottomNav, type View } from './components/BottomNav'
import { CollectionView } from './components/CollectionView'
import { HomeScreen } from './components/HomeScreen'
import { openPack, type OpenedPack } from './game/pack'
import { addPackToCollection, countDistinctCards, countOwnedCards, loadCollection, saveCollection } from './storage/collection'
import type { Card } from './types/card'
import type { Collection } from './types/collection'
import './App.css'

const SET_CODE = 'blb' // Bloomburrow
const SET_NAME = 'Bloomburrow'
const TOKEN_SET_CODE = 'tblb' // Bloomburrow-Tokens
const PREVIEW_PACK_COUNT = 4

interface Pools {
  cards: Card[]
  tokens: Card[]
  lands: Card[]
}

function App() {
  const [pools, setPools] = useState<Pools | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewPacks, setPreviewPacks] = useState<OpenedPack[]>([])
  const [lastOpenedPack, setLastOpenedPack] = useState<OpenedPack | null>(null)
  const [collection, setCollection] = useState<Collection>(loadCollection)
  const [view, setView] = useState<View>('home')

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

  // Zugkarte fürs Pack-Tile auf dem Start-Screen: nimmt die beste verfügbare
  // Rarity aus dem Set-Pool, damit die Kachel nicht mit einem Common wirbt.
  const showcaseCard = useMemo(() => {
    if (!pools) return null
    return (
      pools.cards.find((c) => c.rarity === 'mythic') ??
      pools.cards.find((c) => c.rarity === 'rare') ??
      pools.cards[0] ??
      null
    )
  }, [pools])

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

  if (isLoading) return <p className="status">Lade Karten…</p>
  if (error) return <p className="status">Fehler: {error}</p>
  if (!pools) return null

  const totalPrints = pools.cards.length + pools.tokens.length + pools.lands.length

  return (
    <>
      <header className="top-bar">
        <h1>MTG Pack Battler</h1>
        <span className="top-bar__stat">
          {countDistinctCards(collection, SET_CODE)}/{totalPrints}
        </span>
      </header>

      <main className="app-main">
        {view === 'home' ? (
          <HomeScreen
            setName={SET_NAME}
            showcaseCard={showcaseCard}
            onOpenPack={openAndCollectPack}
            lastOpenedPack={lastOpenedPack}
            previewPacks={previewPacks}
            onReshufflePreview={reshufflePreview}
          />
        ) : (
          <section>
            <h2>Sammlung — {SET_NAME}</h2>
            <p className="collection-summary">
              {countOwnedCards(collection, SET_CODE)} Karten insgesamt
            </p>
            <CollectionView
              cards={pools.cards}
              tokens={pools.tokens}
              lands={pools.lands}
              setCollection={collection[SET_CODE]}
            />
          </section>
        )}
      </main>

      <BottomNav view={view} onChange={setView} />
    </>
  )
}

export default App
