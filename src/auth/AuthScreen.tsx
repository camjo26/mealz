import { useState, type FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

type Mode = 'signin' | 'signup'

// Signing in is only needed to change things, so this is an overlay rather than
// a wall: the plan and the recipes are readable without an account.
export default function AuthScreen({ onClose }: { onClose: () => void }) {
  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [busy, setBusy]         = useState(false)

  const isSignup = mode === 'signup'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password)
      else await signInWithEmailAndPassword(auth, email, password)
      // On success, onAuthStateChanged in App.tsx closes this overlay.
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet narrow" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <h2>{isSignup ? 'Create your account' : 'Sign in'}</h2>
          <button className="icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Working...' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(isSignup ? 'signin' : 'signup')
            setError(null)
          }}
          disabled={busy}
        >
          {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  )
}

function friendlyAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-email':
        return 'That email address does not look right.'
      case 'auth/missing-password':
        return 'Please enter a password.'
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.'
      case 'auth/email-already-in-use':
        return 'An account already exists for that email. Try signing in.'
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Wrong email or password.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Wait a moment and try again.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.'
      default:
        return err.message
    }
  }
  return 'Something went wrong. Please try again.'
}
