import type { GuessRecord, GameMode } from '../types'

const EMOJI: Record<string, string> = {
  correct:   '🟩',
  partial:   '🟧',
  incorrect: '🟥',
}

const ARROW: Record<string, string> = { higher: '⬆', lower: '⬇' }

export function buildShareText(
  guesses: GuessRecord[],
  mode: GameMode,
  targetName: string,
): string {
  const header = mode === 'daily'
    ? `LoLdle Daily — ${new Date().toISOString().slice(0, 10)}`
    : `LoLdle Unlimited`

  // Guesses are stored newest-first, so reverse for display
  const rows = [...guesses].reverse().map((g) => {
    const r = g.results
    const year = EMOJI[r.releaseYear.state] + (r.releaseYear.direction ? ARROW[r.releaseYear.direction] : '')
    return [
      EMOJI[r.gender.state],
      EMOJI[r.positions.state],
      EMOJI[r.species.state],
      EMOJI[r.resource.state],
      EMOJI[r.rangeType.state],
      EMOJI[r.regions.state],
      year,
    ].join('')
  })

  return [
    header,
    `${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'} — ${targetName}`,
    '',
    ...rows,
  ].join('\n')
}
