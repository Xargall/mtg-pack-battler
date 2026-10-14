export type View = 'home' | 'collection'

interface BottomNavProps {
  view: View
  onChange: (view: View) => void
}

const ITEMS: { key: View; label: string; icon: string }[] = [
  { key: 'home', label: 'Start', icon: '🏛️' },
  { key: 'collection', label: 'Sammlung', icon: '🗂️' },
]

export function BottomNav({ view, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`bottom-nav__item${view === item.key ? ' bottom-nav__item--active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      <button type="button" className="bottom-nav__item bottom-nav__item--disabled" disabled>
        <span className="bottom-nav__icon">⚔️</span>
        <span>Kampf</span>
      </button>
    </nav>
  )
}
