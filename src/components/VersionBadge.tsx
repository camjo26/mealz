import { useState } from 'react'
import { VERSION, CHANGELOG } from '../version'

// Fixed badge showing the current version; click to see the changelog. Rendered
// once at the app root (in main.tsx) so it shows on every screen, in every mode.
export default function VersionBadge() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="version-badge" onClick={() => setOpen(true)} title="Changelog">
        {VERSION}
      </button>
      {open && (
        <div className="changelog-overlay" onClick={() => setOpen(false)}>
          <div className="changelog" onClick={(e) => e.stopPropagation()}>
            <h2>Changelog</h2>
            {CHANGELOG.map((entry) => (
              <section key={entry.version}>
                <h3>
                  {entry.version} <span className="muted">{entry.date}</span>
                </h3>
                <ul>
                  {entry.notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </section>
            ))}
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}
