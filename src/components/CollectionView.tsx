import type { Card } from '../types/card'

interface CollectionGroupProps {
  title: string
  cards: Card[]
  setCollection: Record<string, number> | undefined
}

interface CollectionViewProps {
  cards: Card[]
  tokens: Card[]
  lands: Card[]
  setCollection: Record<string, number> | undefined
}

// Scryfall-Collector-Numbers sind Strings (z. B. "123" oder "123a"),
// daher numerischer Vergleich mit String-Fallback für Suffixe.
function sortByCollectorNumber(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const numA = parseInt(a.collectorNumber, 10)
    const numB = parseInt(b.collectorNumber, 10)
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) return numA - numB
    return a.collectorNumber.localeCompare(b.collectorNumber)
  })
}

export function CollectionView({ cards, tokens, lands, setCollection }: CollectionViewProps) {
  return (
    <>
      <CollectionGroup title="Spielkarten" cards={cards} setCollection={setCollection} />
      <CollectionGroup title="Tokens" cards={tokens} setCollection={setCollection} />
      <CollectionGroup title="Länder" cards={lands} setCollection={setCollection} />
    </>
  )
}

function CollectionGroup({ title, cards, setCollection }: CollectionGroupProps) {
  const sorted = sortByCollectorNumber(cards)
  return (
    <section>
      <h3>
        {title} ({sorted.filter((c) => (setCollection?.[c.id] ?? 0) > 0).length}/{sorted.length})
      </h3>
      <div className="collection-grid">
        {sorted.map((card) => (
          <CollectionCard key={card.id} card={card} owned={setCollection?.[card.id] ?? 0} />
        ))}
      </div>
    </section>
  )
}

function CollectionCard({ card, owned }: { card: Card; owned: number }) {
  const isOwned = owned > 0
  return (
    <figure className={`collection-card${isOwned ? '' : ' collection-card--missing'}`}>
      {card.imageUrl && <img src={card.imageUrl} alt={card.name} width={150} />}
      {owned > 1 && <span className="collection-card__count">×{owned}</span>}
      <figcaption>{card.name}</figcaption>
    </figure>
  )
}
