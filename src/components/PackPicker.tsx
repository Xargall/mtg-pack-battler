import { useLayoutEffect, useRef } from 'react'

interface PackPickerProps {
  count: number
  onPick: (index: number) => void
  onCancel: () => void
}

const MAX_ROTATE_DEG = 28
const MAX_SCALE_DROP = 0.3
const MAX_OPACITY_DROP = 0.6
const DRAG_CLICK_SUPPRESS_PX = 4

/**
 * `count` verdeckte Packs desselben Sets als Coverflow-Karussell zum
 * Durchwischen (wie bei Pokémon TCG Pocket) — der Inhalt aller `count`
 * Packs steht schon fest (siehe App.tsx), das Wischen ist reine Auswahl,
 * kein Reroll. Tippen auf eine Kachel, egal ob zentriert oder am Rand,
 * deckt genau dieses Pack auf.
 *
 * Rotation/Skalierung hängt live am Abstand jeder Kachel zur
 * Container-Mitte (per rAF bei jedem Scroll-Frame aktualisiert). Touch
 * scrollt den Container nativ; für Maus gibt es dafür keine
 * Browser-Standardgeste, deshalb zusätzlich manuelles Pointer-Drag.
 */
export function PackPicker({ count, onPick, onCancel }: PackPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const suppressClickRef = useRef(false)

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let rafHandle: number | null = null

    function applyTransforms() {
      rafHandle = null
      const containerEl = scrollRef.current
      if (!containerEl) return
      const containerRect = containerEl.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width / 2

      tileRefs.current.forEach((tile) => {
        const rect = tile.getBoundingClientRect()
        const tileCenterX = rect.left + rect.width / 2
        const offset = Math.max(-1.6, Math.min(1.6, (tileCenterX - centerX) / rect.width))
        const magnitude = Math.min(1, Math.abs(offset))

        const rotateY = -offset * MAX_ROTATE_DEG
        const scale = 1 - magnitude * MAX_SCALE_DROP
        const translateZ = -magnitude * 50
        const opacity = 1 - magnitude * MAX_OPACITY_DROP

        tile.style.transform = `perspective(800px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`
        tile.style.opacity = String(opacity)
        tile.style.zIndex = String(Math.round((1 - magnitude) * 100))
      })
    }

    function handleScroll() {
      if (rafHandle === null) rafHandle = requestAnimationFrame(applyTransforms)
    }

    applyTransforms()
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', applyTransforms)

    // Maus-Drag: scrollLeft manuell mitziehen, da overflow-x per Maus
    // nicht nativ scrollt (nur Touch/Trackpad tun das von sich aus).
    // Bewusst kein setPointerCapture: das würde in Chromium auch die
    // Kompatibilitäts-Mausevents (inkl. "click") auf den Container
    // umlenken, wodurch Klicks auf den Pack-Buttons nie ankämen — selbst
    // ohne tatsächliches Ziehen. Stattdessen Move/Up-Listener auf window,
    // die auch bei Verlassen des Containers weiter mitlaufen.
    let isDragging = false
    let dragStartX = 0
    let dragStartScrollLeft = 0
    let dragDistance = 0

    function onPointerMove(e: PointerEvent) {
      if (!isDragging) return
      const delta = e.clientX - dragStartX
      dragDistance = Math.max(dragDistance, Math.abs(delta))
      container.scrollLeft = dragStartScrollLeft - delta
    }

    function endDrag() {
      if (!isDragging) return
      isDragging = false
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      if (dragDistance > DRAG_CLICK_SUPPRESS_PX) suppressClickRef.current = true
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      isDragging = true
      dragDistance = 0
      dragStartX = e.clientX
      dragStartScrollLeft = container.scrollLeft
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', endDrag)
      window.addEventListener('pointercancel', endDrag)
    }

    container.addEventListener('pointerdown', onPointerDown)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', applyTransforms)
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      if (rafHandle !== null) cancelAnimationFrame(rafHandle)
    }
  }, [count])

  function handleTileClick(index: number) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onPick(index)
  }

  return (
    <div className="pack-picker">
      <p className="pill-badge">Wähle eins der verdeckten Packs</p>
      <div className="pack-picker__carousel" ref={scrollRef}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            ref={(el) => {
              if (el) tileRefs.current.set(i, el)
              else tileRefs.current.delete(i)
            }}
            type="button"
            className="pack-back"
            onClick={() => handleTileClick(i)}
          >
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
