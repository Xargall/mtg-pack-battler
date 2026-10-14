import type { OpenedPack } from '../game/pack'
import type { Card } from '../types/card'
import { PackView } from './PackView'

interface HomeScreenProps {
  setName: string
  showcaseCard: Card | null
  onOpenPack: () => void
  lastOpenedPack: OpenedPack | null
  previewPacks: OpenedPack[]
  onReshufflePreview: () => void
}

export function HomeScreen({
  setName,
  showcaseCard,
  onOpenPack,
  lastOpenedPack,
  previewPacks,
  onReshufflePreview,
}: HomeScreenProps) {
  return (
    <div className="home">
      <button type="button" className="pack-tile" onClick={onOpenPack}>
        {showcaseCard?.artCropUrl && (
          <img className="pack-tile__art" src={showcaseCard.artCropUrl} alt="" />
        )}
        <div className="pack-tile__frame">
          <span className="pack-tile__set">{setName}</span>
          <span className="pack-tile__cta">Pack öffnen</span>
        </div>
      </button>

      {lastOpenedPack && (
        <section className="reveal">
          <h3>Zuletzt geöffnet</h3>
          <PackView pack={lastOpenedPack} />
        </section>
      )}

      <details className="dev-preview">
        <summary>Vorschau (Testerei — ändert die Sammlung nicht)</summary>
        <button type="button" onClick={onReshufflePreview}>
          Neu mischen
        </button>
        {previewPacks.map((pack, i) => (
          <div key={i}>
            <h3>Pack {i + 1}</h3>
            <PackView pack={pack} />
          </div>
        ))}
      </details>
    </div>
  )
}
