import { describe, it, expect } from 'vitest'
import { matchScalar, matchArray, matchYear } from './matching'

// ─── matchScalar ─────────────────────────────────────────────────────────────

describe('matchScalar', () => {
  it('returns correct when values are equal', () => {
    expect(matchScalar('Mana', 'Mana')).toEqual({ state: 'correct' })
  })

  it('returns incorrect when values differ', () => {
    expect(matchScalar('Energy', 'Mana')).toEqual({ state: 'incorrect' })
  })

  it('is case-sensitive', () => {
    expect(matchScalar('mana', 'Mana')).toEqual({ state: 'incorrect' })
  })

  it('handles empty strings', () => {
    expect(matchScalar('', '')).toEqual({ state: 'correct' })
    expect(matchScalar('', 'Mana')).toEqual({ state: 'incorrect' })
  })
})

// ─── matchArray ──────────────────────────────────────────────────────────────

describe('matchArray', () => {
  it('returns correct when arrays are identical', () => {
    expect(matchArray(['Top', 'Jungle'], ['Top', 'Jungle'])).toEqual({ state: 'correct' })
  })

  it('returns correct regardless of order', () => {
    expect(matchArray(['Jungle', 'Top'], ['Top', 'Jungle'])).toEqual({ state: 'correct' })
  })

  it('returns partial when there is overlap but not a full match', () => {
    expect(matchArray(['Top', 'Middle'], ['Top', 'Jungle'])).toEqual({ state: 'partial' })
  })

  it('returns partial when guess is a subset of answer', () => {
    expect(matchArray(['Top'], ['Top', 'Jungle'])).toEqual({ state: 'partial' })
  })

  it('returns partial when answer is a subset of guess', () => {
    expect(matchArray(['Top', 'Jungle'], ['Top'])).toEqual({ state: 'partial' })
  })

  it('returns incorrect when there is no overlap', () => {
    expect(matchArray(['Support'], ['Top', 'Jungle'])).toEqual({ state: 'incorrect' })
  })

  it('returns correct for single-element identical arrays', () => {
    expect(matchArray(['Mana'], ['Mana'])).toEqual({ state: 'correct' })
  })

  it('returns incorrect for two empty arrays', () => {
    // Both sets have size 0 and intersection size 0 — correct by set equality
    expect(matchArray([], [])).toEqual({ state: 'correct' })
  })

  it('returns incorrect when guess is empty but answer is not', () => {
    expect(matchArray([], ['Top'])).toEqual({ state: 'incorrect' })
  })

  it('handles duplicate values in input arrays gracefully (treats as sets)', () => {
    // Duplicates collapse in Set — ["Top","Top"] == ["Top"]
    expect(matchArray(['Top', 'Top'], ['Top'])).toEqual({ state: 'correct' })
  })

  it('multi-region partial: one region matches', () => {
    expect(matchArray(['Ionia', 'Noxus'], ['Ionia', 'Demacia'])).toEqual({ state: 'partial' })
  })

  it('multi-species correct: full match across multiple species', () => {
    expect(matchArray(['Human', 'Void'], ['Human', 'Void'])).toEqual({ state: 'correct' })
  })
})

// ─── matchYear ───────────────────────────────────────────────────────────────

describe('matchYear', () => {
  it('returns correct when years are equal', () => {
    expect(matchYear(2012, 2012)).toEqual({ state: 'correct' })
  })

  it('returns incorrect with direction higher when answer > guess', () => {
    expect(matchYear(2010, 2015)).toEqual({ state: 'incorrect', direction: 'higher' })
  })

  it('returns incorrect with direction lower when answer < guess', () => {
    expect(matchYear(2020, 2015)).toEqual({ state: 'incorrect', direction: 'lower' })
  })

  it('handles earliest release year (2009)', () => {
    expect(matchYear(2009, 2009)).toEqual({ state: 'correct' })
    expect(matchYear(2009, 2010)).toEqual({ state: 'incorrect', direction: 'higher' })
  })

  it('handles newest release year (2025)', () => {
    expect(matchYear(2025, 2025)).toEqual({ state: 'correct' })
    expect(matchYear(2025, 2024)).toEqual({ state: 'incorrect', direction: 'lower' })
  })

  it('does not include direction on correct match', () => {
    const result = matchYear(2013, 2013)
    expect(result.state).toBe('correct')
    expect('direction' in result).toBe(false)
  })
})
