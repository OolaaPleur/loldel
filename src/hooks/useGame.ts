import { useState, useCallback, useRef, useEffect } from 'react'
import type { Champion, GuessRecord, GameMode, GameStats } from '../types'
import { matchScalar, matchArray, matchYear } from '../utils/matching'
import {
  loadStats, saveStats,
  loadDailyState, saveDailyState, todayUTC,
} from '../utils/storage'

// ─── Target selection ─────────────────────────────────────────────────────────

function pickUnlimitedTarget(champions: Champion[]): Champion {
  return champions[Math.floor(Math.random() * champions.length)]
}

function pickDailyTarget(champions: Champion[]): Champion {
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)
  return champions[daysSinceEpoch % champions.length]
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

function evaluate(guess: Champion, answer: Champion): GuessRecord['results'] {
  return {
    gender:      matchScalar(guess.gender, answer.gender),
    positions:   matchArray(guess.positions, answer.positions),
    species:     matchArray(guess.species, answer.species),
    resource:    matchScalar(guess.resource, answer.resource),
    rangeType:   matchScalar(guess.rangeType, answer.rangeType),
    regions:     matchArray(guess.regions, answer.regions),
    releaseYear: matchYear(guess.releaseYear, answer.releaseYear),
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function addWin(stats: GameStats, guessCount: number): GameStats {
  return {
    gamesWon: stats.gamesWon + 1,
    totalGuesses: stats.totalGuesses + guessCount,
    oneShots: stats.oneShots + (guessCount === 1 ? 1 : 0),
    currentStreak: stats.currentStreak + 1,
    maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1),
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface GameState {
  target: Champion | null
  guesses: GuessRecord[]
  won: boolean
  mode: GameMode
  stats: GameStats
  guess: (champion: Champion) => void
  newGame: () => void
  switchMode: (mode: GameMode) => void
}

export function useGame(champions: Champion[]): GameState {
  const [mode, setMode] = useState<GameMode>('unlimited')
  const [target, setTarget] = useState<Champion | null>(null)
  const [guesses, setGuesses] = useState<GuessRecord[]>([])
  const [won, setWon] = useState(false)
  const [stats, setStats] = useState<GameStats>(() => loadStats('unlimited'))

  const startedRef = useRef(false)

  const startGame = useCallback(
    (newMode: GameMode, champList: Champion[]) => {
      if (champList.length === 0) return

      if (newMode === 'daily') {
        const saved = loadDailyState()
        const dailyTarget = pickDailyTarget(champList)
        if (saved) {
          setTarget(dailyTarget)
          setGuesses(saved.guesses)
          setWon(saved.won)
          return
        }
        setTarget(dailyTarget)
        setGuesses([])
        setWon(false)
        saveDailyState({ date: todayUTC(), guesses: [], won: false })
      } else {
        setTarget(pickUnlimitedTarget(champList))
        setGuesses([])
        setWon(false)
      }
    },
    [],
  )

  // Auto-start once champions are available (runs after render, safe in concurrent mode)
  useEffect(() => {
    if (champions.length === 0 || startedRef.current) return
    startedRef.current = true
    startGame(mode, champions)
    // startGame is stable ([] deps); mode is always 'unlimited' on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champions])

  const guess = useCallback(
    (champion: Champion) => {
      if (!target || won) return
      const results = evaluate(champion, target)
      const record: GuessRecord = { champion, results }

      setGuesses((prev) => {
        const next = [record, ...prev]
        const isWin = champion.id === target.id

        if (mode === 'daily') {
          saveDailyState({ date: todayUTC(), guesses: next, won: isWin })
        }

        if (isWin) {
          setWon(true)
          setStats((s) => {
            const updated = addWin(s, next.length)
            saveStats(mode, updated)
            return updated
          })
        }

        return next
      })
    },
    [target, won, mode],
  )

  const newGame = useCallback(() => {
    if (champions.length === 0) return
    startGame('unlimited', champions)
    setMode('unlimited')
  }, [champions, startGame])

  const switchMode = useCallback(
    (newMode: GameMode) => {
      setMode(newMode)
      setStats(loadStats(newMode))
      startGame(newMode, champions)
    },
    [champions, startGame],
  )

  return { target, guesses, won, mode, stats, guess, newGame, switchMode }
}
