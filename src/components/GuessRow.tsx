import { useState } from 'react'
import type { GuessRecord } from '../types'
import { PropertyTile } from './PropertyTile'

type ColKey = 'gender' | 'positions' | 'species' | 'resource' | 'rangeType' | 'regions' | 'releaseYear'

interface GuessRowProps {
  record: GuessRecord
  index: number   // used to stagger animation delay
  hardened?: boolean
}

export function GuessRow({ record, index, hardened }: GuessRowProps) {
  const { champion: c, results: r } = record
  const [revealed, setRevealed] = useState<Set<ColKey>>(new Set())

  function reveal(col: ColKey) {
    setRevealed((prev) => {
      const next = new Set(prev)
      next.add(col)
      return next
    })
  }

  // In hardened mode each row allows revealing exactly one tile
  const hasRevealed = revealed.size > 0
  const isHidden = (col: ColKey) => hardened && !revealed.has(col)
  const canReveal = (col: ColKey) => hardened && !revealed.has(col) && !hasRevealed

  const label = [
    `Gender: ${c.gender} — ${r.gender.state}`,
    `Position: ${c.positions.join(', ')} — ${r.positions.state}`,
    `Species: ${c.species.join(', ')} — ${r.species.state}`,
    `Resource: ${c.resource} — ${r.resource.state}`,
    `Range: ${c.rangeType} — ${r.rangeType.state}`,
    `Region: ${c.regions.join(', ')} — ${r.regions.state}`,
    `Year: ${c.releaseYear} — ${r.releaseYear.state}${r.releaseYear.direction ? `, answer is ${r.releaseYear.direction}` : ''}`,
  ].join('. ')

  return (
    <div
      className="guess-row animate-row"
      style={{ '--row-index': index } as React.CSSProperties}
      aria-label={`Guess ${index + 1}: ${c.name}. ${label}`}
    >
      <div className="guess-portrait">
        <img
          src={c.iconUrl}
          alt=""
          className="portrait-img"
          loading="lazy"
        />
        <span className="portrait-name" aria-hidden="true">{c.name}</span>
      </div>

      <PropertyTile label="Gender"   value={c.gender}              result={r.gender}      index={0} hidden={isHidden('gender')}      onReveal={canReveal('gender')      ? () => reveal('gender')      : undefined} />
      <PropertyTile label="Position" value={c.positions}           result={r.positions}   index={1} hidden={isHidden('positions')}    onReveal={canReveal('positions')    ? () => reveal('positions')    : undefined} />
      <PropertyTile label="Species"  value={c.species}             result={r.species}     index={2} hidden={isHidden('species')}      onReveal={canReveal('species')      ? () => reveal('species')      : undefined} />
      <PropertyTile label="Resource" value={c.resource}            result={r.resource}    index={3} hidden={isHidden('resource')}     onReveal={canReveal('resource')     ? () => reveal('resource')     : undefined} />
      <PropertyTile label="Range"    value={c.rangeType}           result={r.rangeType}   index={4} hidden={isHidden('rangeType')}    onReveal={canReveal('rangeType')    ? () => reveal('rangeType')    : undefined} />
      <PropertyTile label="Region"   value={c.regions}             result={r.regions}     index={5} hidden={isHidden('regions')}      onReveal={canReveal('regions')      ? () => reveal('regions')      : undefined} />
      <PropertyTile label="Year"     value={String(c.releaseYear)} result={r.releaseYear} index={6} hidden={isHidden('releaseYear')}  onReveal={canReveal('releaseYear')  ? () => reveal('releaseYear')  : undefined} />
    </div>
  )
}
