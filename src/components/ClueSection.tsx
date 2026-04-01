import { useState } from 'react'
import type { Champion, GameMode } from '../types'
import championsQuotes from '../data/champions-quotes.json'

type ClueKey = 'quote' | 'ability'

interface ClueSectionProps {
  target: Champion
  guessCount: number
  mode: GameMode
}

export function ClueSection({ target, guessCount, mode }: ClueSectionProps) {
  const [revealed, setRevealed] = useState<Set<ClueKey>>(new Set())

  function toggle(key: ClueKey) {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const quoteUnlockAt   = mode === 'hardened' ? 15 : 3
  const abilityUnlockAt = mode === 'hardened' ? 20 : 8

  const quoteLocked   = guessCount < quoteUnlockAt
  const abilityLocked = guessCount < abilityUnlockAt

  const quote = (championsQuotes as Record<string, string>)[target.id] ?? null

  return (
    <div className="clue-section">
      <h3 className="clue-heading">Clues</h3>
      <div className="clue-panels">

        {/* Quote */}
        <div className="clue-panel">
          {quoteLocked ? (
            <button className="clue-btn" disabled>
              🔒 Quote · {quoteUnlockAt - guessCount} more
            </button>
          ) : (
            <button
              className={`clue-btn${revealed.has('quote') ? ' active' : ''}`}
              onClick={() => toggle('quote')}
            >
              {revealed.has('quote') ? 'Hide Quote' : '💬 Quote'}
            </button>
          )}
          {revealed.has('quote') && (
            <blockquote className="quote-clue">
              {quote ?? '—'}
            </blockquote>
          )}
        </div>

        {/* Ability (R) */}
        <div className="clue-panel">
          {abilityLocked ? (
            <button className="clue-btn" disabled>
              🔒 Ability (R) · {abilityUnlockAt - guessCount} more
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
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
