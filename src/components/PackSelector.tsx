import { useLayoutEffect, useRef } from 'react'

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

const MAX_ROTATE_DEG = 32
const MAX_SCALE_DROP = 0.22
const MAX_OPACITY_DROP = 0.55
const SCROLL_END_DEBOUNCE_MS = 120
const DRAG_CLICK_SUPPRESS_PX = 4

/**
 * Pack-Karussell mit Coverflow-artigem Dreheffekt: Rotation/Skalierung
 * jeder Kachel hängt live an ihrem Abstand zur Container-Mitte, nicht an
 * einem festen "ausgewählt"-Zustand — fühlt sich beim Wischen wie ein
 * echter 3D-Slider an. Welche Kachel gerade zentriert ist, wird nach dem
 * Scroll-Ende automatisch zur Auswahl (wie bei Pokémon TCG Pocket); Tippen
 * auf eine Kachel scrollt sie zusätzlich direkt in die Mitte.
 *
 * Touch scrollt den Container nativ (overflow-x + scroll-snap). Für Maus
 * gibt es dafür keine Browser-Standardgeste, deshalb zusätzlich ein
 * manuelles Pointer-Drag, das scrollLeft direkt mitzieht und beim Loslassen
 * auf die nächste Kachel einrastet.
 */
export function PackSelector({ options, selectedSetCode, onSelect, disabled = false }: PackSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const onSelectRef = useRef(onSelect)
  const selectedSetCodeRef = useRef(selectedSetCode)
  const disabledRef = useRef(disabled)
  const suppressClickRef = useRef(false)

  // Refs pro Render synchron halten, ohne sie im Render-Body selbst zu
  // mutieren (verboten) — die Scroll-/Pointer-Handler unten greifen über
  // die Refs auf die jeweils aktuellen Werte zu, ohne neu zu binden.
  useLayoutEffect(() => {
    onSelectRef.current = onSelect
    selectedSetCodeRef.current = selectedSetCode
    disabledRef.current = disabled
  })

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let rafHandle: number | null = null
    let scrollEndTimeout: ReturnType<typeof setTimeout> | null = null

    function applyTransforms() {
      rafHandle = null
      const containerEl = scrollRef.current
      if (!containerEl) return
      const containerRect = containerEl.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width / 2

      tileRefs.current.forEach((tile) => {
        const rect = tile.getBoundingClientRect()
        const tileCenterX = rect.left + rect.width / 2
        // -1 (ganz links) .. 0 (Mitte) .. 1 (ganz rechts), auf Tile-Breiten normiert.
        const offset = Math.max(-1.6, Math.min(1.6, (tileCenterX - centerX) / rect.width))
        const magnitude = Math.min(1, Math.abs(offset))

        const rotateY = -offset * MAX_ROTATE_DEG
        const scale = 1 - magnitude * MAX_SCALE_DROP
        const translateZ = -magnitude * 60
        const opacity = 1 - magnitude * MAX_OPACITY_DROP

        tile.style.transform = `perspective(900px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`
        tile.style.opacity = String(opacity)
        tile.style.zIndex = String(Math.round((1 - magnitude) * 100))
      })
    }

    function findNearestCode(): string | null {
      const containerEl = scrollRef.current
      if (!containerEl) return null
      const containerRect = containerEl.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width / 2

      let closestCode: string | null = null
      let closestDistance = Infinity
      tileRefs.current.forEach((tile, code) => {
        const rect = tile.getBoundingClientRect()
        const distance = Math.abs(rect.left + rect.width / 2 - centerX)
        if (distance < closestDistance) {
          closestDistance = distance
          closestCode = code
        }
      })
      return closestCode
    }

    function selectCenteredTile() {
      if (disabledRef.current) return
      const closestCode = findNearestCode()
      if (closestCode && closestCode !== selectedSetCodeRef.current) {
        onSelectRef.current(closestCode)
      }
    }

    function handleScroll() {
      if (rafHandle === null) rafHandle = requestAnimationFrame(applyTransforms)
      if (scrollEndTimeout) clearTimeout(scrollEndTimeout)
      scrollEndTimeout = setTimeout(selectCenteredTile, SCROLL_END_DEBOUNCE_MS)
    }

    applyTransforms()
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', applyTransforms)

    // --- Maus-Drag: scrollLeft manuell mitziehen, da overflow-x per Maus
    // nicht nativ scrollt (nur Touch/Trackpad tun das von sich aus). ---
    let isDragging = false
    let dragStartX = 0
    let dragStartScrollLeft = 0
    let dragDistance = 0

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== 'mouse' || disabledRef.current) return
      isDragging = true
      dragDistance = 0
      dragStartX = e.clientX
      dragStartScrollLeft = container.scrollLeft
      container.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging) return
      const delta = e.clientX - dragStartX
      dragDistance = Math.max(dragDistance, Math.abs(delta))
      container.scrollLeft = dragStartScrollLeft - delta
    }

    function endDrag(e: PointerEvent) {
      if (!isDragging) return
      isDragging = false
      container.releasePointerCapture(e.pointerId)
      if (dragDistance > DRAG_CLICK_SUPPRESS_PX) {
        suppressClickRef.current = true
        // scrollLeft wurde manuell gesetzt, bekommt also kein natives
        // Scroll-Snap-Einrasten — von Hand auf die nächste Kachel einrasten.
        const nearestCode = findNearestCode()
        const nearestTile = nearestCode ? tileRefs.current.get(nearestCode) : null
        nearestTile?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        if (nearestCode && nearestCode !== selectedSetCodeRef.current) {
          onSelectRef.current(nearestCode)
        }
      }
    }

    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', endDrag)
    container.addEventListener('pointercancel', endDrag)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', applyTransforms)
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', endDrag)
      container.removeEventListener('pointercancel', endDrag)
      if (rafHandle !== null) cancelAnimationFrame(rafHandle)
      if (scrollEndTimeout) clearTimeout(scrollEndTimeout)
    }
  }, [options])

  function handleTileClick(option: PackOption) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onSelect(option.setCode)
    tileRefs.current.get(option.setCode)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <div className={`pack-selector${disabled ? ' pack-selector--disabled' : ''}`} ref={scrollRef}>
      {options.map((option) => {
        const isSelected = option.setCode === selectedSetCode
        return (
          <button
            key={option.setCode}
            ref={(el) => {
              if (el) tileRefs.current.set(option.setCode, el)
              else tileRefs.current.delete(option.setCode)
            }}
            type="button"
            className={`pack-tile${isSelected ? ' pack-tile--selected' : ''}`}
            onClick={() => handleTileClick(option)}
            aria-pressed={isSelected}
            disabled={disabled}
          >
            {option.artUrl && <img className="pack-tile__art" src={option.artUrl} alt="" draggable={false} />}
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
