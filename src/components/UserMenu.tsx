import { useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'

const MAX_INITIALS = 2

type Props = {
  user: User
  onSignOut: () => void
}

// The signed-in badge: initials in the corner, and the sign-out option tucked
// behind a tap. Signing out is rare and slightly destructive of your place, so
// it does not deserve a permanent button competing with the app itself.
export default function UserMenu({ user, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on a click anywhere else, or on Escape, so the menu never strands you.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const initials = initialsFor(user)

  return (
    <div className="user-menu" ref={wrapRef}>
      <button
        className="avatar"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Signed in as ${user.email ?? 'this account'}. Open account menu.`}
        title={user.email ?? undefined}
      >
        {initials}
      </button>

      {open && (
        <div className="user-popover" role="menu">
          <p className="user-email">{user.email}</p>
          <button role="menuitem" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// Initials from the display name when there is one, otherwise from the email.
// "phil_outram@..." gives PO; a single run like "camjoutram@..." has no second
// word to take, so it falls back to the first two letters.
export function initialsFor(user: Pick<User, 'displayName' | 'email'>): string {
  const source = (user.displayName || user.email?.split('@')[0] || '').trim()
  if (!source) return '?'

  const words = source.split(/[^A-Za-z]+/).filter(Boolean)
  if (words.length >= MAX_INITIALS) {
    return words.slice(0, MAX_INITIALS).map((word) => word[0]).join('').toUpperCase()
  }
  return (words[0] || source).slice(0, MAX_INITIALS).toUpperCase()
}
