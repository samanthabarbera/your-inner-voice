import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Starburst from './Starburst'

export default function Nav() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <Link to="/" className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-ink">
        <Starburst size={18} showLines={false} />
        Your Inner Voice
      </Link>

      <div className="flex items-center gap-2">
        {user && (
          <Link
            to="/my-meditations"
            className="rounded-full px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            My Meditations
          </Link>
        )}

        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-canvas-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#2A2A2E]"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/auth"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0B0B0C] transition-colors hover:bg-[#E9E9EC] active:scale-[0.97]"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
