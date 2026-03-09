import type { GameStats, GameMode } from '../types'

interface StatsModalProps {
  stats: GameStats
  mode: GameMode
  onClose: () => void
}

export function StatsModal({ stats, mode, onClose }: StatsModalProps) {
  const avg = stats.gamesWon > 0
    ? (stats.totalGuesses / stats.gamesWon).toFixed(1)
    : '—'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="modal-title">Stats — {mode === 'daily' ? 'Daily' : 'Unlimited'}</h2>

        <div className="stats-grid">
          <div className="stat-cell">
            <span className="stat-value">{stats.gamesWon}</span>
            <span className="stat-label">Won</span>
          </div>
          <div className="stat-cell">
            <span className="stat-value">{avg}</span>
            <span className="stat-label">Avg guesses</span>
          </div>
          <div className="stat-cell">
            <span className="stat-value">{stats.oneShots}</span>
            <span className="stat-label">One-shots</span>
          </div>
          <div className="stat-cell">
            <span className="stat-value">{stats.currentStreak}</span>
            <span className="stat-label">Current streak</span>
          </div>
          <div className="stat-cell">
            <span className="stat-value">{stats.maxStreak}</span>
            <span className="stat-label">Best streak</span>
          </div>
          <div className="stat-cell">
            <span className="stat-value">{stats.totalGuesses}</span>
            <span className="stat-label">Total guesses</span>
          </div>
        </div>
      </div>
    </div>
  )
}
