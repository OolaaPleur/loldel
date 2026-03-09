const COLUMNS = ['Gender', 'Position', 'Species', 'Resource', 'Range', 'Region', 'Year']

export function ColumnHeaders() {
  return (
    <div className="guess-row column-headers" aria-hidden="true">
      <div className="guess-portrait-header" />
      {COLUMNS.map((col) => (
        <div key={col} className="col-header">{col}</div>
      ))}
    </div>
  )
}
