# LolDel — Claude Code Guide

## Project Overview

LolDel is a League of Legends champion guessing game (Wordle-style). Players guess a hidden champion and receive color-coded feedback on seven attributes. Two modes: **unlimited** (random) and **daily** (one shared champion per UTC day).

## Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** (dev server + build)
- **Vitest** + jsdom (tests)
- **ESLint** (zero warnings policy)
- No backend — localStorage only; champion data from Riot Data Dragon API

## Commands

```bash
bun run dev        # Dev server → http://localhost:5173
bun run build      # tsc type-check + Vite build → dist/
bun run preview    # Preview production build
bun run lint       # ESLint (max-warnings 0)
bun run test       # Run all tests once (not `bun test` — that is Bun's own runner)
bun run test:watch # Tests in watch mode
```

### Container (Podman/Docker)
```bash
podman build -t loldel .       # Multi-stage build → nginx:alpine
podman run -p 8080:80 loldel   # Serve on http://localhost:8080
```

## Architecture

### Key Source Files

| File | Role |
|------|------|
| `src/App.tsx` | Root layout — header, mode switcher, guess input, clue section, guess history |
| `src/hooks/useGame.ts` | All game state: target selection, guess evaluation, stats, daily persistence |
| `src/hooks/useChampions.ts` | Wraps `loadChampions()` with loading/error states |
| `src/utils/ddragon.ts` | Fetches champions from Riot CDN, merges extra data, caches in localStorage |
| `src/utils/matching.ts` | Pure eval functions: `matchScalar`, `matchArray`, `matchYear` |
| `src/utils/storage.ts` | localStorage wrappers for stats (per mode) and daily state (date-aware) |
| `src/utils/share.ts` | Builds emoji grid (🟩🟧🟥) for clipboard sharing |
| `src/data/champions-extra.json` | Manually maintained lore attributes (gender, species, regions, positions, release year) |
| `src/types.ts` | `Champion`, `GuessRecord`, `GameStats` interfaces |

### Component Tree

```
App
├── GuessInput          # Autocomplete with keyboard nav (↑↓ Enter Esc)
├── ClueSection         # Splash art (unlocks at 5 guesses) + ability icon (8 guesses)
├── ColumnHeaders       # Property column labels
├── GuessRow[]          # One row per guess
│   └── PropertyTile[]  # Green/orange/red tile per attribute
├── StatsModal          # Wins, avg guesses, streaks (per mode)
└── CountdownTimer      # Daily mode: countdown to next UTC day
```

### Matching Logic

- **Scalar** (gender, resource, range): exact match only → green or red
- **Array** (positions, species, regions): green if identical set, orange if overlap, red if none
- **Year**: green if exact, orange with ↑/↓ hint, red with ↑/↓ hint

### Data Flow

Champions are a two-source merge:
1. **Riot Data Dragon** (fetched at runtime): stats, resource type, attack range, icons, splash art
2. **`champions-extra.json`** (static, manually updated): gender, species, regions, release year, positions

Merged data is cached in localStorage with version checking — auto-refreshes when patch changes.

## Adding New Champions

When a new champion releases, update `src/data/champions-extra.json` with their lore attributes (gender, species, regions, positions, release year). The Riot API fields are fetched automatically.

## Testing

Tests live alongside utils in `src/utils/`. Currently covers:
- `matching.test.ts` — `matchScalar`, `matchArray`, `matchYear`
- `storage.test.ts` — localStorage read/write helpers

Run with `bun run test`. Tests use Vitest + jsdom (no browser required).

## Code Conventions

- Strict TypeScript — no `any`, no unused locals/params
- ESLint zero warnings — lint before committing
- No backend, no auth — keep it purely client-side
- Stats are tracked separately per game mode (unlimited vs daily)
- Daily champion is deterministic: `dayOffset % championsArray.length`
