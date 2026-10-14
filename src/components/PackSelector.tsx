export interface PackOption {
  setCode: string
  setName: string
  artUrl: string | null
}

interface PackSelectorProps {
  options: PackOption[]
  selectedSetCode: string
  onSelect: (setCode: string) => void
  disabled?: boolean
}

/** Auswahl, welches große Set (Bloomburrow, Duskmourn, …) geöffnet wird. */
export function PackSelector({ options, selectedSetCode, onSelect, disabled = false }: PackSelectorProps) {
  return (
    <div className={`pack-selector${disabled ? ' pack-selector--disabled' : ''}`}>
      {options.map((option) => {
        const isSelected = option.setCode === selectedSetCode
        return (
          <button
            key={option.setCode}
            type="button"
            className={`pack-tile${isSelected ? ' pack-tile--selected' : ''}`}
            onClick={() => onSelect(option.setCode)}
            aria-pressed={isSelected}
            disabled={disabled}
          >
            {option.artUrl && <img className="pack-tile__art" src={option.artUrl} alt="" />}
            <div className="pack-tile__frame">
              <span className="pack-tile__set">{option.setName}</span>
            </div>
            {isSelected && (
              <span className="pack-tile__badge" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
