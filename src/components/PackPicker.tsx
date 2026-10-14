interface PackPickerProps {
  count: number
  onPick: (index: number) => void
  onCancel: () => void
}

/**
 * Zeigt `count` verdeckte Packs zur Auswahl — alle bereits zufällig
 * generiert, der Inhalt steht also schon fest. Die Auswahl selbst ändert
 * nichts an den Odds, verschärft aber den Zufallsfaktor gefühlt: man weiß
 * bis zum Aufdecken nicht, welches der zuvor gewählten Packs man bekommt.
 */
export function PackPicker({ count, onPick, onCancel }: PackPickerProps) {
  return (
    <div className="pack-picker">
      <p className="pill-badge">Wähle eins der verdeckten Packs</p>
      <div className="pack-picker__grid">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} type="button" className="pack-back" onClick={() => onPick(i)}>
            <span className="pack-back__ornament" aria-hidden="true">
              ✦
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="pack-picker__cancel" onClick={onCancel}>
        Abbrechen
      </button>
    </div>
  )
}
