import { useState } from 'react'
import type { Champion } from '../types'

type ClueKey = 'splash' | 'ability'

const SPLASH_UNLOCK_AT  = 5
const ABILITY_UNLOCK_AT = 8

interface ClueSectionProps {
  target: Champion
  guessCount: number
}

export function ClueSection({ target, guessCount }: ClueSectionProps) {
  const [revealed, setRevealed] = useState<Set<ClueKey>>(new Set())

  function toggle(key: ClueKey) {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const splashLocked  = guessCount < SPLASH_UNLOCK_AT
  const abilityLocked = guessCount < ABILITY_UNLOCK_AT

  return (
    <div className="clue-section">
      <h3 className="clue-heading">Clues</h3>
      <div className="clue-panels">

        {/* Splash Art */}
        <div className="clue-panel">
          {splashLocked ? (
            <button className="clue-btn" disabled>
              🔒 Splash Art · {SPLASH_UNLOCK_AT - guessCount} more
            </button>
          ) : (
            <button
              className={`clue-btn${revealed.has('splash') ? ' active' : ''}`}
              onClick={() => toggle('splash')}
            >
              {revealed.has('splash') ? 'Hide Splash' : '🖼 Splash Art'}
            </button>
          )}
          {revealed.has('splash') && (
            <div className="splash-crop-wrapper">
              <img
                className="splash-crop splash-bw"
                src={target.splashUrl}
                alt="Splash art clue"
              />
            </div>
          )}
        </div>

        {/* Ability (R) */}
        <div className="clue-panel">
          {abilityLocked ? (
            <button className="clue-btn" disabled>
              🔒 Ability (R) · {ABILITY_UNLOCK_AT - guessCount} more
            </button>
          ) : (
            <button
              className={`clue-btn${revealed.has('ability') ? ' active' : ''}`}
              onClick={() => toggle('ability')}
            >
              {revealed.has('ability') ? 'Hide Ability' : '⚡ Ability (R)'}
            </button>
          )}
          {revealed.has('ability') && (
            <div className="ability-clue">
              <img
                className="ability-icon"
                src={target.spells.R.imageUrl}
                alt={target.spells.R.name}
              />
              <span className="ability-name">{target.spells.R.name}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
