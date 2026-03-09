import type { GameStats, GameMode, GuessRecord } from '../types'

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS_KEY = (mode: GameMode) => `loldle_stats_${mode}`

const DEFAULT_STATS: GameStats = {
  gamesWon: 0,
  totalGuesses: 0,
  oneShots: 0,
  currentStreak: 0,
  maxStreak: 0,
}

export function loadStats(mode: GameMode): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY(mode))
    if (!raw) return { ...DEFAULT_STATS }
    return JSON.parse(raw) as GameStats
  } catch {
    return { ...DEFAULT_STATS }
  }
}

export function saveStats(mode: GameMode, stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY(mode), JSON.stringify(stats))
  } catch {
    // Quota exceeded — silently ignore
  }
}

// ─── Daily game state ─────────────────────────────────────────────────────────

export interface DailyState {
  date: string        // "YYYY-MM-DD"
  guesses: GuessRecord[]
  won: boolean
}

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

const DAILY_KEY = 'loldle_daily'

export function loadDailyState(): DailyState | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as DailyState
    if (state.date !== todayUTC()) return null   // stale — new day
    return state
  } catch {
    return null
  }
}

export function saveDailyState(state: DailyState): void {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded — silently ignore
  }
}

// ─── Countdown to midnight UTC ────────────────────────────────────────────────

export function msUntilMidnightUTC(): number {
  const midnight = new Date()
  midnight.setUTCHours(24, 0, 0, 0)
  return midnight.getTime() - Date.now()
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
