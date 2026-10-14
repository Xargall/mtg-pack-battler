import type { OpenedPack } from '../game/pack'
import { CardFigure } from './CardFigure'

export function PackView({ pack }: { pack: OpenedPack }) {
  return (
    <>
      <div className="pack-grid">
        {/* Dieselbe Karte kann mehrfach im Pack vorkommen (gewollt, wie bei
            echten Boosterslots) — Index im Key, damit React sie trotzdem
            unterscheidet. */}
        {pack.cards.map((card, i) => (
          <CardFigure key={`${card.id}-${i}`} card={card} />
        ))}
      </div>
      <div className="pack-grid">
        <CardFigure card={pack.token} />
        <CardFigure card={pack.land} />
      </div>
    </>
  )
}
