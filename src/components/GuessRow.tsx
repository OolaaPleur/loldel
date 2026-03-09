import type { GuessRecord } from '../types'
import { PropertyTile } from './PropertyTile'

interface GuessRowProps {
  record: GuessRecord
  index: number   // used to stagger animation delay
}

export function GuessRow({ record, index }: GuessRowProps) {
  const { champion: c, results: r } = record

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

      <PropertyTile label="Gender"   value={c.gender}             result={r.gender}      index={0} />
      <PropertyTile label="Position" value={c.positions}          result={r.positions}   index={1} />
      <PropertyTile label="Species"  value={c.species}            result={r.species}     index={2} />
      <PropertyTile label="Resource" value={c.resource}           result={r.resource}    index={3} />
      <PropertyTile label="Range"    value={c.rangeType}          result={r.rangeType}   index={4} />
      <PropertyTile label="Region"   value={c.regions}            result={r.regions}     index={5} />
      <PropertyTile label="Year"     value={String(c.releaseYear)} result={r.releaseYear} index={6} />
    </div>
  )
}
