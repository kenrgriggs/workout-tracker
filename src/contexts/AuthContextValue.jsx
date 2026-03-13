import { createContext } from 'react'

// Separated from AuthContext.jsx (the provider) so tests can import the context
// object directly without pulling in the provider's Supabase dependency.
// The provider lives in AuthContext.jsx; consumers use useAuth() from useAuth.jsx.
export const AuthContext = createContext(null)
