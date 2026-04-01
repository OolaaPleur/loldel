import type { MatchResult } from '../types'

interface PropertyTileProps {
  label: string
  value: string | string[]
  result: MatchResult
  index: number   // column index for staggered flip
  hidden?: boolean
  onReveal?: () => void
}

const STATE_CLASS: Record<string, string> = {
  correct:   'tile--correct',
  partial:   'tile--partial',
  incorrect: 'tile--incorrect',
}

const STATE_LABEL: Record<string, string> = {
  correct:   'Correct',
  partial:   'Partial match',
  incorrect: 'Incorrect',
}

export function PropertyTile({ label, value, result, index, hidden, onReveal }: PropertyTileProps) {
  const displayValue = Array.isArray(value) ? value.join(', ') : value
  const ariaLabel = hidden
    ? `${label}: hidden, click to reveal`
    : `${label}: ${displayValue}, ${STATE_LABEL[result.state]}${result.direction ? `, answer is ${result.direction}` : ''}`

  if (hidden) {
    const clickable = !!onReveal
    return (
      <div
        className={`tile tile--hidden${clickable ? ' tile--clickable' : ' tile--locked'} tile-flip`}
        style={{ '--tile-index': index } as React.CSSProperties}
        aria-label={ariaLabel}
        role={clickable ? 'button' : 'img'}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? onReveal : undefined}
        onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ' ? onReveal?.() : undefined) : undefined}
      >
        <span className="tile-label" aria-hidden="true">{label}</span>
        <span className="tile-value" aria-hidden="true">{clickable ? '?' : '✕'}</span>
      </div>
    )
  }

  return (
    <div
      className={`tile ${STATE_CLASS[result.state]} tile-flip`}
      style={{ '--tile-index': index } as React.CSSProperties}
      aria-label={ariaLabel}
      role="img"
    >
      <span className="tile-label" aria-hidden="true">{label}</span>
      <span className="tile-value" aria-hidden="true">{displayValue}</span>
      {result.direction && (
        <span className="tile-arrow" aria-hidden="true">
          {result.direction === 'higher' ? '↑' : '↓'}
        </span>
      )}
    </div>
  )
}
