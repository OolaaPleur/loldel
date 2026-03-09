import { describe, it, expect } from 'vitest'
import { buildShareText } from './share'
import type { GuessRecord } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<GuessRecord['results']> = {}): GuessRecord {
  return {
    champion: { id: 'Ahri', name: 'Ahri' } as GuessRecord['champion'],
    results: {
      gender:      { state: 'correct' },
      positions:   { state: 'partial' },
      species:     { state: 'incorrect' },
      resource:    { state: 'correct' },
      rangeType:   { state: 'correct' },
      regions:     { state: 'partial' },
      releaseYear: { state: 'incorrect', direction: 'higher' },
      ...overrides,
    },
  }
}

// ─── buildShareText ───────────────────────────────────────────────────────────

describe('buildShareText', () => {
  it('includes daily header with date for daily mode', () => {
    const text = buildShareText([makeRecord()], 'daily', 'Ahri')
    const today = new Date().toISOString().slice(0, 10)
    expect(text).toContain(`LoLdle Daily — ${today}`)
  })

  it('includes unlimited header for unlimited mode', () => {
    const text = buildShareText([makeRecord()], 'unlimited', 'Ahri')
    expect(text).toContain('LoLdle Unlimited')
  })

  it('shows singular "guess" for 1 guess', () => {
    const text = buildShareText([makeRecord()], 'unlimited', 'Ahri')
    expect(text).toContain('1 guess — Ahri')
  })

  it('shows plural "guesses" for multiple guesses', () => {
    const text = buildShareText([makeRecord(), makeRecord()], 'unlimited', 'Ahri')
    expect(text).toContain('2 guesses — Ahri')
  })

  it('shows 0 guesses for empty array', () => {
    const text = buildShareText([], 'unlimited', 'Ahri')
    expect(text).toContain('0 guesses — Ahri')
  })

  it('maps correct state to 🟩', () => {
    const text = buildShareText([makeRecord({ gender: { state: 'correct' } })], 'unlimited', 'Ahri')
    expect(text).toContain('🟩')
  })

  it('maps partial state to 🟧', () => {
    const text = buildShareText([makeRecord({ gender: { state: 'partial' } })], 'unlimited', 'Ahri')
    expect(text).toContain('🟧')
  })

  it('maps incorrect state to 🟥', () => {
    const text = buildShareText([makeRecord({ gender: { state: 'incorrect' } })], 'unlimited', 'Ahri')
    expect(text).toContain('🟥')
  })

  it('appends ⬆ arrow for higher direction', () => {
    const text = buildShareText(
      [makeRecord({ releaseYear: { state: 'incorrect', direction: 'higher' } })],
      'unlimited', 'Ahri',
    )
    expect(text).toContain('🟥⬆')
  })

  it('appends ⬇ arrow for lower direction', () => {
    const text = buildShareText(
      [makeRecord({ releaseYear: { state: 'incorrect', direction: 'lower' } })],
      'unlimited', 'Ahri',
    )
    expect(text).toContain('🟥⬇')
  })

  it('appends no arrow for correct year', () => {
    const text = buildShareText(
      [makeRecord({ releaseYear: { state: 'correct' } })],
      'unlimited', 'Ahri',
    )
    expect(text).not.toMatch(/🟩[⬆⬇]/)
  })

  it('reverses guess order so oldest appears first', () => {
    // Guesses are stored newest-first: [newest, oldest]
    const newest = makeRecord({ gender: { state: 'correct' } })   // row starts with 🟩
    const oldest = makeRecord({ gender: { state: 'incorrect' } }) // row starts with 🟥
    const text = buildShareText([newest, oldest], 'unlimited', 'Ahri')
    const lines = text.split('\n')
    const redIdx   = lines.findIndex((l) => l.startsWith('🟥'))
    const greenIdx = lines.findIndex((l) => l.startsWith('🟩'))
    expect(redIdx).toBeGreaterThan(-1)
    expect(greenIdx).toBeGreaterThan(-1)
    expect(redIdx).toBeLessThan(greenIdx)
  })

  it('each row contains all 7 property tiles', () => {
    const text = buildShareText([makeRecord()], 'unlimited', 'Ahri')
    const lines = text.split('\n')
    // Find the emoji row — it follows the blank line after the header
    const emojiRow = lines.find((l) => /[🟩🟧🟥]/u.test(l))
    // Count emoji tiles: each is 1-2 chars (emoji + optional arrow)
    const tiles = [...(emojiRow ?? '')].filter((c) => ['🟩', '🟧', '🟥'].includes(c))
    expect(tiles).toHaveLength(7)
  })
})
