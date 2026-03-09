import { useState, useRef, useEffect } from 'react'
import './index.css'
import { useChampions } from './hooks/useChampions'
import { useGame } from './hooks/useGame'
import { GuessInput } from './components/GuessInput'
import { GuessRow } from './components/GuessRow'
import { ColumnHeaders } from './components/ColumnHeaders'
import { ClueSection } from './components/ClueSection'
import { CountdownTimer } from './components/CountdownTimer'
import { StatsModal } from './components/StatsModal'
import { buildShareText } from './utils/share'

export default function App() {
  const { champions, loading, error } = useChampions()
  const { target, guesses, won, mode, stats, guess, newGame, switchMode } = useGame(champions)
  const [showStats, setShowStats] = useState(false)
  const [copied, setCopied] = useState(false)
  const liveRef = useRef<HTMLDivElement>(null)

  // Announce latest guess result to screen readers
  useEffect(() => {
    if (guesses.length === 0 || !liveRef.current) return
    const latest = guesses[0]
    const allCorrect = Object.values(latest.results).every((r) => r.state === 'correct')
    liveRef.current.textContent = allCorrect
      ? `Correct! The answer was ${latest.champion.name}.`
      : `Guessed ${latest.champion.name}. Keep trying.`
  }, [guesses])

  if (loading) return <div className="loading" role="status">Loading champions…</div>
  if (error)   return <div className="error" role="alert">Error: {error}</div>

  const guessedIds = new Set(guesses.map((g) => g.champion.id))

  async function handleShare() {
    if (!target) return
    const text = buildShareText(guesses, mode, target.name)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      prompt('Copy your result:', text)
    }
  }

  return (
    <>
      {/* Screen-reader live region */}
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      <header className="header">
        <span className="header-title" aria-label="LolDel — League of Legends guessing game">
          LolDel
        </span>

        <div className="header-center">
          <div className="mode-switcher" role="group" aria-label="Game mode">
            <button
              className={`mode-btn${mode === 'unlimited' ? ' active' : ''}`}
              aria-pressed={mode === 'unlimited'}
              onClick={() => switchMode('unlimited')}
            >
              Unlimited
            </button>
            <button
              className={`mode-btn${mode === 'daily' ? ' active' : ''}`}
              aria-pressed={mode === 'daily'}
              onClick={() => switchMode('daily')}
            >
              Daily
            </button>
          </div>
        </div>

        <button className="stats-btn" onClick={() => setShowStats(true)} aria-label="View statistics">
          📊 Stats
        </button>
      </header>

      <main className="game-board">
        {won ? (
          <div className="status-banner won" role="status">
            🎉 <strong>{target?.name}</strong> — {guesses.length}{' '}
            {guesses.length === 1 ? 'guess' : 'guesses'}!
            <div className="win-actions">
              <button className="share-btn" onClick={handleShare}>
                {copied ? '✓ Copied!' : '📋 Share'}
              </button>
              {mode === 'unlimited' && (
                <button className="new-game-btn" onClick={newGame}>New Game</button>
              )}
            </div>
            {mode === 'daily' && <CountdownTimer />}
          </div>
        ) : (
          <GuessInput
            champions={champions}
            guessedIds={guessedIds}
            onGuess={guess}
            disabled={false}
          />
        )}

        {target && <ClueSection key={target.id} target={target} guessCount={guesses.length} />}

        {guesses.length > 0 && (
          <div className="guess-history" aria-label="Guess history">
            <ColumnHeaders />
            {guesses.map((record, i) => (
              <GuessRow key={record.champion.id} record={record} index={i} />
            ))}
          </div>
        )}
      </main>

      {showStats && (
        <StatsModal
          stats={stats}
          mode={mode}
          onClose={() => setShowStats(false)}
        />
      )}
    </>
  )
}
