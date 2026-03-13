import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // `loading` stays true until the initial session check resolves. AppShell
  // renders nothing during this window to prevent a flash of the login screen
  // on page load when the user already has a valid session.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore any existing session from the stored token on first load.
    // This resolves synchronously from the local token, not a network call.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to subsequent auth events: sign in, sign out, token refresh.
    // This keeps `user` in sync for the lifetime of the app.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Clean up the subscription when the provider unmounts to avoid stale callbacks.
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

