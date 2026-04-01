#!/usr/bin/env node
/**
 * One-time script to populate src/data/champions-quotes.json
 * with Russian quotes from the League of Legends Russian wiki.
 *
 * Usage:
 *   node scripts/fetch-quotes.mjs
 *
 * Writes (or updates) src/data/champions-quotes.json.
 * Champions that could not be fetched are printed at the end —
 * fill them in manually.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const EXTRA_PATH   = join(ROOT, 'src/data/champions-extra.json')
const QUOTES_PATH  = join(ROOT, 'src/data/champions-quotes.json')

const DELAY_MS     = 600   // between requests — be polite
const BASE_URL     = 'https://leagueoflegends.fandom.com/ru/wiki'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'ru-RU,ru;q=0.9',
  'Accept': 'text/html,application/xhtml+xml',
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Extract the first plain Russian quote text from an audio/quotes wiki page.
 * Returns null if nothing usable is found.
 */
function extractFirstQuote(html) {
  // Remove script/style blocks first
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '')

  // Strip all HTML tags to get plain text per line
  // Then find first line that looks like a Russian quote (≥10 chars, contains Cyrillic)
  const stripped = html.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#[0-9]+;/g, ' ').replace(/&[a-z]+;/g, ' ')
  const lines = stripped.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)

  // Heuristic: first line with Cyrillic text that's a plausible quote (10–200 chars)
  const cyrillicRe = /[а-яёА-ЯЁ]/
  for (const line of lines) {
    if (cyrillicRe.test(line) && line.length >= 10 && line.length <= 300) {
      // Skip navigation / meta lines
      if (/^(Перейти|Навигация|Содержание|Категор|Страниц|Обсужд|Справка|Лиг|Игра|Чемпион|Предмет|Заклинан|Руна|Патч|Пресс|Ролев|Фанат|Разработ|Вики|Последн|Создан|Открыт|Добавлен|Правк|Архив)/i.test(line)) continue
      // Strip surrounding quotes if present
      return line.replace(/^[«"'""]+/, '').replace(/[»"'"]+$/, '').trim()
    }
  }
  return null
}

async function fetchQuote(championId) {
  // Try English-name URL first — Fandom usually redirects to Russian name
  const url = `${BASE_URL}/${encodeURIComponent(championId)}/LoL/%D0%9E%D0%B7%D0%B2%D1%83%D1%87%D0%BA%D0%B0`

  let resp
  try {
    resp = await fetch(url, { headers: HEADERS })
  } catch (err) {
    return { id: championId, quote: null, error: String(err) }
  }

  if (!resp.ok) {
    return { id: championId, quote: null, error: `HTTP ${resp.status}` }
  }

  const html = await resp.text()
  const quote = extractFirstQuote(html)
  return { id: championId, quote, error: quote ? null : 'no quote found in page' }
}

async function main() {
  const extra = JSON.parse(readFileSync(EXTRA_PATH, 'utf8'))
  const ids = extra.map((c) => c.id)

  // Load existing quotes so we can do incremental updates
  let existing = {}
  try {
    existing = JSON.parse(readFileSync(QUOTES_PATH, 'utf8'))
  } catch {
    // file doesn't exist yet
  }

  const failed = []
  let updated = 0

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]

    if (existing[id]) {
      process.stdout.write(`[${i + 1}/${ids.length}] ${id} — skipped (already set)\n`)
      continue
    }

    process.stdout.write(`[${i + 1}/${ids.length}] ${id} … `)
    const { quote, error } = await fetchQuote(id)

    if (quote) {
      existing[id] = quote
      process.stdout.write(`OK: ${quote.slice(0, 60)}\n`)
      updated++
    } else {
      process.stdout.write(`FAILED: ${error}\n`)
      failed.push(id)
    }

    await sleep(DELAY_MS)
  }

  // Write sorted output
  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => a.localeCompare(b))
  )
  writeFileSync(QUOTES_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8')

  console.log(`\nDone. ${updated} new quotes written to src/data/champions-quotes.json`)

  if (failed.length) {
    console.log(`\nFailed (${failed.length}) — fill these in manually:`)
    failed.forEach((id) => console.log(`  "${id}": "",`))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
