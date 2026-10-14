import type { Card } from '../types/card'

export function CardFigure({ card }: { card: Card }) {
  return (
    <figure>
      {card.imageUrl && <img src={card.imageUrl} alt={card.name} width={150} />}
      <figcaption>
        {card.name} ({card.rarity})
      </figcaption>
    </figure>
  )
}
