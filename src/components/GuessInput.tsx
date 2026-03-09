import { useState, useRef, useEffect } from 'react'
import type { Champion } from '../types'

interface GuessInputProps {
  champions: Champion[]
  guessedIds: Set<string>
  onGuess: (champion: Champion) => void
  disabled: boolean
}

export function GuessInput({ champions, guessedIds, onGuess, disabled }: GuessInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = query.trim().length === 0
    ? []
    : champions.filter(
        (c) =>
          !guessedIds.has(c.id) &&
          c.name.toLowerCase().includes(query.toLowerCase()),
      )

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  function select(champion: Champion) {
    onGuess(champion)
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlighted]) select(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  return (
    <div className="guess-input-wrapper">
      <div className="guess-input-row">
        <input
          ref={inputRef}
          className="guess-input"
          type="text"
          placeholder="Type a champion name…"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
          autoComplete="off"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul ref={listRef} className="autocomplete-list">
          {filtered.map((c, i) => (
            <li
              key={c.id}
              className={`autocomplete-item${i === highlighted ? ' highlighted' : ''}`}
              onMouseDown={() => select(c)}
              onMouseEnter={() => setHighlighted(i)}
            >
              <img
                className="autocomplete-icon"
                src={c.iconUrl}
                alt={c.name}
                loading="lazy"
              />
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
