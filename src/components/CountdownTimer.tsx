import { useState, useEffect } from 'react'
import { msUntilMidnightUTC, formatCountdown } from '../utils/storage'

export function CountdownTimer() {
  const [ms, setMs] = useState(msUntilMidnightUTC)

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = msUntilMidnightUTC()
      setMs(remaining)
      if (remaining <= 0) window.location.reload() // new day — reload for fresh daily
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="countdown">
      <span className="countdown-label">Next daily in</span>
      <span className="countdown-time">{formatCountdown(ms)}</span>
    </div>
  )
}
