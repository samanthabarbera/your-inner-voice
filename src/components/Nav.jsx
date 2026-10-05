import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Nav() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <Link to="/" className="font-display text-xl font-normal tracking-tight text-ink">
        Tune-Up
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <Link
            to="/my-meditations"
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            My Meditations
          </Link>
        )}

        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/auth"
            className="rounded-full bg-[#FF4E6A] px-4 py-1.5 text-sm font-medium text-[#E8F8F8] transition-colors hover:bg-[#e63f5a] active:scale-[0.97] active:brightness-90"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
