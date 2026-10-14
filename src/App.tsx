import { useEffect, useMemo, useState } from 'react'
import { fetchBasicLands, fetchCardsBySet, fetchTokensBySet } from './api/scryfall'
import { BottomNav, type View } from './components/BottomNav'
import { CollectionView } from './components/CollectionView'
import { HomeScreen } from './components/HomeScreen'
import type { PackOption } from './components/PackSelector'
import { openPack, type OpenedPack } from './game/pack'
import { AVAILABLE_SETS } from './game/sets'
import { addPackToCollection, countDistinctCards, countOwnedCards, loadCollection, saveCollection } from './storage/collection'
import type { Card } from './types/card'
import type { Collection } from './types/collection'
import './App.css'

const PREVIEW_PACK_COUNT = 4
// Wie bei Pokémon TCG Pocket: beim Öffnen werden mehrere Packs vorab
// gezogen, der Inhalt steht also schon fest — die Auswahl ist nur noch
// "welches verdeckte Pack tippe ich an", nicht "was bekomme ich".
const PACK_CHOICE_COUNT = 12

interface Pools {
  cards: Card[]
  tokens: Card[]
  lands: Card[]
}

// Zugkarte fürs Pack-Tile: nimmt die beste verfügbare Rarity aus dem
// Set-Pool, damit die Kachel nicht mit einem Common wirbt.
function showcaseCardFor(pools: Pools | undefined): Card | null {
  if (!pools) return null
  return (
    pools.cards.find((c) => c.rarity === 'mythic') ??
    pools.cards.find((c) => c.rarity === 'rare') ??
    pools.cards[0] ??
    null
  )
}

function App() {
  const [poolsBySet, setPoolsBySet] = useState<Record<string, Pools>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reshuffleNonce, setReshuffleNonce] = useState(0)
  const [lastOpenedPack, setLastOpenedPack] = useState<OpenedPack | null>(null)
  const [candidatePacks, setCandidatePacks] = useState<OpenedPack[] | null>(null)
  const [collection, setCollection] = useState<Collection>(loadCollection)
  const [view, setView] = useState<View>('home')
  const [selectedSetCode, setSelectedSetCode] = useState(AVAILABLE_SETS[0].code)

  useEffect(() => {
    Promise.all(
      AVAILABLE_SETS.map((set) =>
        Promise.all([
          fetchCardsBySet(set.code),
          fetchTokensBySet(set.tokenSetCode),
          fetchBasicLands(set.code),
        ]).then(([cards, tokens, lands]) => [set.code, { cards, tokens, lands }] as const),
      ),
    )
      .then((entries) => setPoolsBySet(Object.fromEntries(entries)))
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  // Sammlung bei jeder Änderung persistieren.
  useEffect(() => {
    saveCollection(collection)
  }, [collection])

  const selectedSet = AVAILABLE_SETS.find((s) => s.code === selectedSetCode) ?? AVAILABLE_SETS[0]
  const selectedPools = poolsBySet[selectedSetCode]

  // Vorschau-Packs: neu gezogen, sobald die Pools des gewählten Sets
  // verfügbar sind, sich die Auswahl ändert, oder "Neu mischen" greift.
  const previewPacks = useMemo(() => {
    if (!selectedPools) return []
    return Array.from({ length: PREVIEW_PACK_COUNT }, () =>
      openPack(selectedPools.cards, selectedPools.tokens, selectedPools.lands),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reshuffleNonce ist nur ein Trigger
  }, [selectedPools, reshuffleNonce])

  const packOptions: PackOption[] = useMemo(
    () =>
      AVAILABLE_SETS.map((set) => ({
        setCode: set.code,
        setName: set.name,
        artUrl: showcaseCardFor(poolsBySet[set.code])?.artCropUrl ?? null,
      })),
    [poolsBySet],
  )

  function selectSet(setCode: string) {
    setSelectedSetCode(setCode)
    setLastOpenedPack(null)
    setCandidatePacks(null)
  }

  function reshufflePreview() {
    setReshuffleNonce((n) => n + 1)
  }

  function startPackOpening() {
    if (!selectedPools) return
    setCandidatePacks(
      Array.from({ length: PACK_CHOICE_COUNT }, () =>
        openPack(selectedPools.cards, selectedPools.tokens, selectedPools.lands),
      ),
    )
  }

  function pickCandidate(index: number) {
    if (!candidatePacks) return
    const pack = candidatePacks[index]
    setLastOpenedPack(pack)
    setCollection((c) => addPackToCollection(c, selectedSetCode, pack))
    setCandidatePacks(null)
  }

  function cancelPicking() {
    setCandidatePacks(null)
  }

  if (isLoading) return <p className="status">Lade Karten…</p>
  if (error) return <p className="status">Fehler: {error}</p>
  if (!selectedPools) return null

  const totalPrints = selectedPools.cards.length + selectedPools.tokens.length + selectedPools.lands.length

  return (
    <>
      <header className="top-bar">
        <h1>MTG Pack Battler</h1>
        <span className="top-bar__stat">
          {countDistinctCards(collection, selectedSetCode)}/{totalPrints}
        </span>
      </header>

      <main className="app-main">
        {view === 'home' ? (
          <HomeScreen
            packOptions={packOptions}
            selectedSetCode={selectedSetCode}
            onSelectSet={selectSet}
            candidatePacks={candidatePacks}
            onStartOpening={startPackOpening}
            onPickCandidate={pickCandidate}
            onCancelPicking={cancelPicking}
            lastOpenedPack={lastOpenedPack}
            previewPacks={previewPacks}
            onReshufflePreview={reshufflePreview}
          />
        ) : (
          <section>
            <h2>Sammlung — {selectedSet.name}</h2>
            <p className="collection-summary">
              {countOwnedCards(collection, selectedSetCode)} Karten insgesamt
            </p>
            <CollectionView
              cards={selectedPools.cards}
              tokens={selectedPools.tokens}
              lands={selectedPools.lands}
              setCollection={collection[selectedSetCode]}
            />
          </section>
        )}
      </main>

      <BottomNav view={view} onChange={setView} />
    </>
  )
}

export default App
