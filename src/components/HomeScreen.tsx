import type { OpenedPack } from '../game/pack'
import { PackPicker } from './PackPicker'
import { PackSelector, type PackOption } from './PackSelector'
import { PackView } from './PackView'

interface HomeScreenProps {
  packOptions: PackOption[]
  selectedSetCode: string
  onSelectSet: (setCode: string) => void
  candidatePacks: OpenedPack[] | null
  onStartOpening: () => void
  onPickCandidate: (index: number) => void
  onCancelPicking: () => void
  lastOpenedPack: OpenedPack | null
  previewPacks: OpenedPack[]
  onReshufflePreview: () => void
}

export function HomeScreen({
  packOptions,
  selectedSetCode,
  onSelectSet,
  candidatePacks,
  onStartOpening,
  onPickCandidate,
  onCancelPicking,
  lastOpenedPack,
  previewPacks,
  onReshufflePreview,
}: HomeScreenProps) {
  const isPicking = candidatePacks !== null

  return (
    <div className="home">
      <PackSelector
        options={packOptions}
        selectedSetCode={selectedSetCode}
        onSelect={onSelectSet}
        disabled={isPicking}
      />

      {isPicking ? (
        <PackPicker count={candidatePacks.length} onPick={onPickCandidate} onCancel={onCancelPicking} />
      ) : (
        <button type="button" className="open-pack-cta" onClick={onStartOpening}>
          Pack öffnen
        </button>
      )}

      {lastOpenedPack && !isPicking && (
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
