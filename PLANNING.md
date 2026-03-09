# LolDel — Project Planning

## Overview

A League of Legends champion guessing game inspired by [loldle.org/unlimited](https://loldle.org/unlimited).
The player guesses champions and each guess reveals color-coded property tiles showing how close the guess
was to the hidden champion. Includes **Unlimited mode** (random, play as many rounds as you want) and
**Daily mode** (one shared champion per day, same for all players).

**Stack:** React + Vite, static SPA, no backend required.
**Deployment target:** Podman container (static nginx/caddy) behind Caddy reverse proxy on home server.

---

## Data Sources

### Primary: Riot Data Dragon (no API key, free)

All URLs are public and require no authentication.

| Purpose | URL |
|---|---|
| Latest patch version | `https://ddragon.leagueoflegends.com/api/versions.json` |
| All champions (summary) | `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json` |
| Individual champion | `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion/{Name}.json` |
| Champion icon | `https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{Name}.png` |
| Splash art | `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{Name}_0.jpg` |
| Ability icon | `https://ddragon.leagueoflegends.com/cdn/{version}/img/spell/{SpellImage}` |

Fetch `versions.json` first, take index `[0]` for the latest version, then use it in all subsequent URLs.

**What Data Dragon provides natively:**
- `name` — champion display name
- `tags` — e.g. `["Mage", "Support"]` (rough role classification)
- `partype` — resource type: `"Mana"`, `"Energy"`, `"None"` (Manaless), etc.
- `info.attack` — melee/ranged hint (use individual champion JSON `attackrange` field instead)
- `spells` — Q/W/E/R spell names and image filenames
- `passive` — passive name and image filename
- `skins` — list of skins (for splash art clue feature)

### Secondary: CommunityDragon (no API key, free)

`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/`

Useful for position/role data that is more accurate than ddragon tags.

### Supplementary Static JSON (`src/data/champions-extra.json`)

Data Dragon does **not** provide lore-based attributes. These must be maintained manually in a static file
bundled with the app. New champions ship roughly every 3–4 weeks (~13/year), so maintenance is minimal.

Fields to maintain manually:
- `gender` — `"Male"` | `"Female"` | `"Other"`
- `species` — array, e.g. `["Human", "Yordle"]`
- `regions` — array, e.g. `["Demacia", "Runeterra"]`
- `releaseYear` — integer, e.g. `2009`
- `positions` — array from meta play rates, e.g. `["Middle", "Support"]`

Reference source for initial population: [LoL Wiki Champion Data](https://wiki.leagueoflegends.com/en-us/Module:ChampionData/data)

---

## Champion Data Model

Each champion in the merged dataset must conform to this shape:

```typescript
interface Champion {
  id: string;           // Internal ddragon key, e.g. "MonkeyKing" for Wukong
  name: string;         // Display name, e.g. "Wukong"
  image: string;        // Icon filename, e.g. "MonkeyKing.png"
  iconUrl: string;      // Versioned square icon URL, e.g. .../img/champion/MonkeyKing.png
  splashUrl: string;    // Full splash URL
  gender: "Male" | "Female" | "Other";
  positions: string[];  // e.g. ["Top", "Jungle"]
  species: string[];    // e.g. ["Human", "Vastaya"]
  resource: string;     // e.g. "Mana", "Energy", "Manaless"
  rangeType: "Melee" | "Ranged" | "Melee & Ranged";
  regions: string[];    // e.g. ["Ionia"]
  releaseYear: number;  // e.g. 2011
  spells: {
    passive: { name: string; imageUrl: string };
    Q: { name: string; imageUrl: string };
    W: { name: string; imageUrl: string };
    E: { name: string; imageUrl: string };
    R: { name: string; imageUrl: string };
  };
}
```

**Range type logic:** use `attackrange` from the individual champion JSON.
- `attackrange >= 350` → `"Ranged"`
- `attackrange < 350` → `"Melee"`
- Special cases (e.g. Jayce, Nidalee, Gnar) → `"Melee & Ranged"` — handle in supplementary JSON.

---

## Data Pipeline

### Startup sequence (runs in browser)

```
1. GET https://ddragon.leagueoflegends.com/api/versions.json
   → latestVersion = data[0]

2. Check localStorage: cached version string
   → if latestVersion === cachedVersion, load from localStorage and skip to step 5

3. GET /cdn/{latestVersion}/data/en_US/champion.json
   → get list of all champion keys

4. For each champion key:
   GET /cdn/{latestVersion}/data/en_US/champion/{key}.json
   → extract: name, partype, attackrange, spells, passive, skins

5. Merge with champions-extra.json (gender, species, regions, releaseYear, positions)

6. Store merged dataset + version string in localStorage
   → app is ready
```

### Cache invalidation

Store `{ version: "16.5.1", champions: [...] }` in `localStorage` under key `loldle_cache_v2`.
On each load, compare stored version to `versions.json[0]`. Refetch only on mismatch.
This means players only re-download on patch days (~every 2 weeks).
The key is versioned (`_v2`, `_v3`, …) to bust stale cached data when the Champion shape changes.

---

## Matching Logic

For each property column, compute one of three states: `"correct"` | `"partial"` | `"incorrect"`.
Numeric fields additionally return a direction: `"higher"` | `"lower"`.

```typescript
type MatchResult =
  | { state: "correct" }
  | { state: "partial" }
  | { state: "incorrect" }
  | { state: "correct" | "incorrect"; direction?: "higher" | "lower" }; // for releaseYear

function matchScalar(guess: string, answer: string): MatchResult {
  return guess === answer ? { state: "correct" } : { state: "incorrect" };
}

function matchArray(guess: string[], answer: string[]): MatchResult {
  const guessSet = new Set(guess);
  const answerSet = new Set(answer);
  const intersection = [...answerSet].filter(v => guessSet.has(v));
  if (intersection.length === answerSet.size && guessSet.size === answerSet.size)
    return { state: "correct" };
  if (intersection.length > 0)
    return { state: "partial" };
  return { state: "incorrect" };
}

function matchYear(guess: number, answer: number): MatchResult {
  if (guess === answer) return { state: "correct" };
  return { state: "incorrect", direction: answer > guess ? "higher" : "lower" };
}
```

**Column mapping:**

| Column | Field | Match type |
|---|---|---|
| Gender | `gender` | scalar |
| Position(s) | `positions` | array |
| Species | `species` | array |
| Resource | `resource` | scalar |
| Range type | `rangeType` | scalar |
| Region(s) | `regions` | array |
| Release year | `releaseYear` | numeric with direction |

---

## Game Modes

### Unlimited mode
- On game start: pick a random champion using `Math.random()`
- No guess limit
- "New game" button resets and picks a new random champion
- Stats tracked in localStorage: games won, average guesses, one-shots, current streak, max streak

### Daily mode
- Target champion is determined by a date-seeded RNG: `seed = days since epoch % championCount`
- Same champion for all players on a given day
- Resets at midnight UTC
- Stats tracked separately from unlimited mode

---

## UI Components

```
App
├── Header (title, mode switcher: Unlimited / Daily, stats button)
├── StatsModal (games won, avg guesses, streaks)
├── GameBoard
│   ├── GuessInput (autocomplete text field + submit button)
│   ├── ClueSection (unlocked after N guesses: quote, splash crop, ability icon)
│   └── GuessHistory
│       └── GuessRow[] (champion portrait + 7 property tiles)
│           └── PropertyTile (colored: green/orange/red, arrow for year)
└── WinModal (shown on correct guess: champion name, guess count, share button)
```

### Color scheme
- `correct` → green (`#4CAF50` or Tailwind `green-500`)
- `partial` → orange (`#FF9800` or Tailwind `orange-400`)
- `incorrect` → red (`#F44336` or Tailwind `red-500`)
- Arrow indicators: ↑ (answer is higher) ↓ (answer is lower)

---

## Project Structure

```
loldle-clone/
├── public/
│   └── favicon.ico
├── src/
│   ├── data/
│   │   └── champions-extra.json      # Manually maintained lore data
│   ├── hooks/
│   │   ├── useChampions.ts           # Data fetching + cache logic
│   │   └── useGame.ts                # Game state, guess history, win detection
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── GuessInput.tsx            # Autocomplete input
│   │   ├── GuessRow.tsx              # One row of 7 tiles per guess
│   │   ├── PropertyTile.tsx          # Single colored tile
│   │   ├── ClueSection.tsx           # Manual-reveal clues: splash art (greyscale+blur) + ability R icon
│   │   ├── StatsModal.tsx
│   │   └── WinModal.tsx
│   ├── utils/
│   │   ├── matching.ts               # matchScalar, matchArray, matchYear
│   │   ├── ddragon.ts                # All Data Dragon fetch functions
│   │   └── storage.ts                # localStorage helpers
│   ├── types.ts                      # Champion, MatchResult, GuessRecord types
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── Containerfile                     # Podman-compatible (FROM nginx:alpine)
└── PLANNING.md                       # This file
```

---

## Milestones

| # | Phase | Deliverable |
|---|---|---|
| 1 | **Scaffold** | Vite + React + TypeScript project, folder structure, linting |
| 2 | **Data layer** | `ddragon.ts` fetch functions, localStorage caching, version check |
| 3 | **Supplementary data** | `champions-extra.json` populated for all current champions |
| 4 | **Matching logic** | `matching.ts` with full test coverage for all column types |
| 5 | **Core UI** | GuessInput autocomplete, GuessRow + PropertyTile with colors |
| 6 | **Game loop** | `useGame.ts` hook: unlimited mode, win detection, new game |
| 7 | **Daily mode** | Date-seeded target, separate stats, countdown timer to reset |
| 8 | **Clues** | Splash art crop (greyscale+blur, manually revealed) + ability R icon (manually revealed) |
| 9 | **Stats & persistence** | StatsModal, streaks, all state in localStorage |
| 10 | **Polish** | Animations, mobile layout, accessibility |
| 11 | **Container** | `Containerfile` + build script, test with Podman, Caddy config snippet |

---

## Containerfile (target)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

Build and run locally with Podman:
```bash
podman build -t loldle-clone .
podman run -p 8080:80 loldle-clone
```

---

## Starting Prompt for Claude Code

When opening this project in VS Code with Claude Code, use this as your first message:

```
Read PLANNING.md. Implement Phase 1 and Phase 2:
1. Scaffold a React + Vite + TypeScript project with the folder structure from PLANNING.md
2. Implement src/utils/ddragon.ts with all Data Dragon fetch functions and localStorage caching
3. Define all TypeScript types in src/types.ts
4. Create a placeholder src/data/champions-extra.json with the correct schema and 3 example champions (Annie, Ahri, Jinx)

Do not build UI yet. Focus on getting clean, typed data loading working first.
```
