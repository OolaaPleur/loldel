import type { MatchResult } from '../types'

export function matchScalar(guess: string, answer: string): MatchResult {
  return guess === answer ? { state: 'correct' } : { state: 'incorrect' }
}

export function matchArray(guess: string[], answer: string[]): MatchResult {
  const guessSet = new Set(guess)
  const answerSet = new Set(answer)
  const intersection = [...answerSet].filter((v) => guessSet.has(v))
  if (
    intersection.length === answerSet.size &&
    guessSet.size === answerSet.size
  ) {
    return { state: 'correct' }
  }
  if (intersection.length > 0) return { state: 'partial' }
  return { state: 'incorrect' }
}

export function matchYear(guess: number, answer: number): MatchResult {
  if (guess === answer) return { state: 'correct' }
  return {
    state: 'incorrect',
    direction: answer > guess ? 'higher' : 'lower',
  }
}
