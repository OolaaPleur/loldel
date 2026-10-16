# LolDel

A League of Legends champion guessing game. Guess the hidden champion from property hints — gender, positions, species, resource, range type, region, and release year. Each guess reveals color-coded tiles showing how close you were.

## Features

- **Unlimited mode** — random champion each game, play as many as you want
- **Daily mode** — one shared champion per day, same for everyone
- **Clue system** — unlock a splash art hint at 5 guesses, ability icon at 8
- **Stats** — tracks wins, streaks, average guesses, and one-shots per mode
- **Share** — copy an emoji grid of your guess history to clipboard
- No backend, no account — runs entirely in the browser

## Data

Champion data is fetched from [Riot Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) (no API key required) and cached in `localStorage`. Lore attributes (gender, species, regions, release year, positions) are maintained manually in [`src/data/champions-extra.json`](src/data/champions-extra.json) and need updating when new champions ship.

## Local development

```bash
bun install
bun run dev       # http://localhost:5173
bun run test      # vitest unit tests (not `bun test` — that is Bun's own runner)
bun run build     # production build → dist/
```

## Container build

```bash
podman build -t loldel .
podman run -p 8080:80 loldel
# visit http://localhost:8080
```

## License

MIT — see [LICENSE](LICENSE).
