import type { Champion, ChampionExtra, LocalCache } from '../types'
import championsExtra from '../data/champions-extra.json'

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com'
const CACHE_KEY = 'loldle_cache_v2'

// ─── Raw ddragon shapes ───────────────────────────────────────────────────────

interface DDragonChampionSummary {
  id: string
  name: string
  image: { full: string }
}

interface DDragonSpell {
  name: string
  image: { full: string }
}

interface DDragonPassive {
  name: string
  image: { full: string }
}

interface DDragonChampionDetail {
  id: string
  name: string
  partype: string
  stats: { attackrange: number }
  image: { full: string }
  spells: [DDragonSpell, DDragonSpell, DDragonSpell, DDragonSpell]
  passive: DDragonPassive
  skins: Array<{ num: number }>
}

// ─── Network helpers ──────────────────────────────────────────────────────────

export async function fetchLatestVersion(): Promise<string> {
  const res = await fetch(`${DDRAGON_BASE}/api/versions.json`)
  if (!res.ok) throw new Error(`Failed to fetch versions: ${res.status}`)
  const versions: string[] = await res.json()
  return versions[0]
}

async function fetchChampionSummaries(
  version: string,
): Promise<Record<string, DDragonChampionSummary>> {
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/champion.json`,
  )
  if (!res.ok) throw new Error(`Failed to fetch champion list: ${res.status}`)
  const data = await res.json()
  return data.data as Record<string, DDragonChampionSummary>
}

async function fetchChampionDetail(
  version: string,
  key: string,
): Promise<DDragonChampionDetail> {
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/champion/${key}.json`,
  )
  if (!res.ok)
    throw new Error(`Failed to fetch champion detail for ${key}: ${res.status}`)
  const data = await res.json()
  return data.data[key] as DDragonChampionDetail
}

// ─── Merge logic ──────────────────────────────────────────────────────────────

const RANGED_THRESHOLD = 350

function resolveRangeType(
  attackrange: number,
  extra: ChampionExtra | undefined,
): Champion['rangeType'] {
  if (extra?.rangeTypeOverride) return extra.rangeTypeOverride
  return attackrange >= RANGED_THRESHOLD ? 'Ranged' : 'Melee'
}

function buildSpellImageUrl(version: string, filename: string): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/spell/${filename}`
}

function buildPassiveImageUrl(version: string, filename: string): string {
  return `${DDRAGON_BASE}/cdn/${version}/img/passive/${filename}`
}

function buildSplashUrl(id: string): string {
  return `${DDRAGON_BASE}/cdn/img/champion/splash/${id}_0.jpg`
}

function mergeChampion(
  version: string,
  detail: DDragonChampionDetail,
  extra: ChampionExtra | undefined,
): Champion {
  const [q, w, e, r] = detail.spells

  return {
    id: detail.id,
    name: detail.name,
    image: detail.image.full,
    iconUrl: `${DDRAGON_BASE}/cdn/${version}/img/champion/${detail.image.full}`,
    splashUrl: buildSplashUrl(detail.id),
    gender: extra?.gender ?? 'Other',
    positions: extra?.positions ?? [],
    species: extra?.species ?? [],
    resource: detail.partype === 'None' ? 'Manaless' : detail.partype,
    rangeType: resolveRangeType(detail.stats.attackrange, extra),
    regions: extra?.regions ?? [],
    releaseYear: extra?.releaseYear ?? 0,
    spells: {
      passive: {
        name: detail.passive.name,
        imageUrl: buildPassiveImageUrl(version, detail.passive.image.full),
      },
      Q: {
        name: q.name,
        imageUrl: buildSpellImageUrl(version, q.image.full),
      },
      W: {
        name: w.name,
        imageUrl: buildSpellImageUrl(version, w.image.full),
      },
      E: {
        name: e.name,
        imageUrl: buildSpellImageUrl(version, e.image.full),
      },
      R: {
        name: r.name,
        imageUrl: buildSpellImageUrl(version, r.image.full),
      },
    },
  }
}

// ─── Full fetch pipeline ──────────────────────────────────────────────────────

/**
 * Fetches all champions from ddragon, merges with local extra data,
 * and returns the complete champion list.
 *
 * Requests are made concurrently (one per champion) with a small concurrency
 * cap to avoid hammering the CDN.
 */
async function fetchAllChampions(version: string): Promise<Champion[]> {
  const summaries = await fetchChampionSummaries(version)
  const keys = Object.keys(summaries)

  const extraMap = new Map<string, ChampionExtra>(
    (championsExtra as ChampionExtra[]).map((e) => [e.id, e]),
  )

  // Fetch details with a concurrency limit
  const CONCURRENCY = 10
  const champions: Champion[] = []

  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const batch = keys.slice(i, i + CONCURRENCY)
    const details = await Promise.all(
      batch.map((key) => fetchChampionDetail(version, key)),
    )
    for (const detail of details) {
      if (import.meta.env.DEV && !extraMap.has(detail.id)) {
        console.warn(`[loldle] No extra data for champion: ${detail.id} — add it to champions-extra.json`)
      }
      champions.push(mergeChampion(version, detail, extraMap.get(detail.id)))
    }
  }

  return champions.sort((a, b) => a.name.localeCompare(b.name))
}

// ─── localStorage cache ───────────────────────────────────────────────────────

function loadCache(): LocalCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LocalCache
  } catch {
    return null
  }
}

function saveCache(cache: LocalCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Loads the champion dataset, using localStorage cache when the patch version
 * has not changed. Returns a sorted array of merged Champion objects.
 */
export async function loadChampions(): Promise<Champion[]> {
  const latestVersion = await fetchLatestVersion()

  const cached = loadCache()
  if (cached && cached.version === latestVersion) {
    return cached.champions
  }

  const champions = await fetchAllChampions(latestVersion)
  saveCache({ version: latestVersion, champions })
  return champions
}

/**
 * Clears the local champion cache, forcing a full re-fetch on next load.
 */
export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY)
}
