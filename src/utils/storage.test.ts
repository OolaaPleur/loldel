// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatCountdown,
  todayUTC,
  loadStats,
  saveStats,
  loadDailyState,
  saveDailyState,
} from './storage'

// ─── formatCountdown ──────────────────────────────────────────────────────────

describe('formatCountdown', () => {
  it('formats hours, minutes, seconds with padding', () => {
    expect(formatCountdown(3_661_000)).toBe('01:01:01')
  })

  it('pads single-digit values', () => {
    expect(formatCountdown(3_600_000)).toBe('01:00:00')
  })

  it('handles exactly zero', () => {
    expect(formatCountdown(0)).toBe('00:00:00')
  })

  it('clamps negative ms to zero', () => {
    expect(formatCountdown(-5_000)).toBe('00:00:00')
  })

  it('handles 59 seconds', () => {
    expect(formatCountdown(59_000)).toBe('00:00:59')
  })

  it('handles 23:59:59', () => {
    expect(formatCountdown(86_399_000)).toBe('23:59:59')
  })
})

// ─── todayUTC ─────────────────────────────────────────────────────────────────

describe('todayUTC', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    expect(todayUTC()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches the UTC date from Date', () => {
    const expected = new Date().toISOString().slice(0, 10)
    expect(todayUTC()).toBe(expected)
  })
})

// ─── loadStats / saveStats ────────────────────────────────────────────────────

describe('loadStats / saveStats', () => {
  beforeEach(() => localStorage.clear())

  it('returns default stats when nothing is saved', () => {
    expect(loadStats('unlimited')).toEqual({
      gamesWon: 0,
      totalGuesses: 0,
      oneShots: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
  })

  it('round-trips saved stats', () => {
    const stats = { gamesWon: 5, totalGuesses: 20, oneShots: 1, currentStreak: 3, maxStreak: 5 }
    saveStats('unlimited', stats)
    expect(loadStats('unlimited')).toEqual(stats)
  })

  it('keeps unlimited and daily stats separate', () => {
    saveStats('unlimited', { gamesWon: 10, totalGuesses: 40, oneShots: 2, currentStreak: 4, maxStreak: 8 })
    expect(loadStats('daily')).toEqual({
      gamesWon: 0, totalGuesses: 0, oneShots: 0, currentStreak: 0, maxStreak: 0,
    })
  })

  it('returns default stats on corrupted JSON', () => {
    localStorage.setItem('loldle_stats_unlimited', 'not{json')
    expect(loadStats('unlimited')).toEqual({
      gamesWon: 0, totalGuesses: 0, oneShots: 0, currentStreak: 0, maxStreak: 0,
    })
  })
})

// ─── loadDailyState / saveDailyState ─────────────────────────────────────────

describe('loadDailyState / saveDailyState', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing is saved', () => {
    expect(loadDailyState()).toBeNull()
  })

  it('returns null for a stale (yesterday) date', () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const staleDate = yesterday.toISOString().slice(0, 10)
    localStorage.setItem('loldle_daily', JSON.stringify({ date: staleDate, guesses: [], won: false }))
    expect(loadDailyState()).toBeNull()
  })

  it('returns state saved for today', () => {
    const state = { date: todayUTC(), guesses: [], won: false }
    saveDailyState(state)
    expect(loadDailyState()).toEqual(state)
  })

  it('returns state with won=true saved for today', () => {
    const state = { date: todayUTC(), guesses: [], won: true }
    saveDailyState(state)
    expect(loadDailyState()?.won).toBe(true)
  })

  it('returns null on corrupted JSON', () => {
    localStorage.setItem('loldle_daily', 'bad{json')
    expect(loadDailyState()).toBeNull()
  })
})
