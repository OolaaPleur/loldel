// ─── Champion ────────────────────────────────────────────────────────────────

export interface Spell {
  name: string
  imageUrl: string
}

export interface Champion {
  id: string              // Internal ddragon key, e.g. "MonkeyKing"
  name: string            // Display name, e.g. "Wukong"
  image: string           // Icon filename, e.g. "MonkeyKing.png"
  iconUrl: string         // Versioned square icon URL
  splashUrl: string       // Full splash art URL
  gender: 'Male' | 'Female' | 'Other'
  positions: string[]     // e.g. ["Top", "Jungle"]
  species: string[]       // e.g. ["Human", "Vastaya"]
  resource: string        // e.g. "Mana", "Energy", "Manaless"
  rangeType: 'Melee' | 'Ranged' | 'Melee & Ranged'
  regions: string[]       // e.g. ["Ionia"]
  releaseYear: number     // e.g. 2011
  spells: {
    passive: Spell
    Q: Spell
    W: Spell
    E: Spell
    R: Spell
  }
}

// ─── Supplementary JSON schema ────────────────────────────────────────────────

export interface ChampionExtra {
  id: string
  gender: 'Male' | 'Female' | 'Other'
  species: string[]
  regions: string[]
  releaseYear: number
  positions: string[]
  /** Override rangeType when ddragon attackrange is misleading (Jayce, Nidalee, Gnar) */
  rangeTypeOverride?: 'Melee' | 'Ranged' | 'Melee & Ranged'
}

// ─── Matching ─────────────────────────────────────────────────────────────────

export type MatchState = 'correct' | 'partial' | 'incorrect'

export interface MatchResult {
  state: MatchState
  direction?: 'higher' | 'lower'
}

// ─── Guess record ─────────────────────────────────────────────────────────────

export interface GuessRecord {
  champion: Champion
  results: {
    gender: MatchResult
    positions: MatchResult
    species: MatchResult
    resource: MatchResult
    rangeType: MatchResult
    regions: MatchResult
    releaseYear: MatchResult
  }
}

// ─── Game mode ───────────────────────────────────────────────────────────────

export type GameMode = 'unlimited' | 'daily' | 'hardened'

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface GameStats {
  gamesWon: number
  totalGuesses: number
  oneShots: number
  currentStreak: number
  maxStreak: number
}

// ─── Cache ───────────────────────────────────────────────────────────────────

export interface LocalCache {
  version: string
  champions: Champion[]
}
