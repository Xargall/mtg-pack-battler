import type { OpenedPack } from '../game/pack'
import { PackSelector, type PackOption } from './PackSelector'
import { PackView } from './PackView'

interface HomeScreenProps {
  packOptions: PackOption[]
  selectedSetCode: string
  onSelectSet: (setCode: string) => void
  onOpenPack: () => void
  lastOpenedPack: OpenedPack | null
  previewPacks: OpenedPack[]
  onReshufflePreview: () => void
}

export function HomeScreen({
  packOptions,
  selectedSetCode,
  onSelectSet,
  onOpenPack,
  lastOpenedPack,
  previewPacks,
  onReshufflePreview,
}: HomeScreenProps) {
  return (
    <div className="home">
      <PackSelector options={packOptions} selectedSetCode={selectedSetCode} onSelect={onSelectSet} />

      <button type="button" className="open-pack-cta" onClick={onOpenPack}>
        Pack öffnen
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
