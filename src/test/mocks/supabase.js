import { vi } from 'vitest'

/**
 * buildQueryMock — use this in component tests.
 * Call supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_DATA }))
 * to control what a query resolves to for a given test.
 */
export function buildQueryMock(result = { data: [], error: null }) {
  const chain = {
    select:  vi.fn().mockReturnThis(),
    insert:  vi.fn().mockReturnThis(),
    upsert:  vi.fn().mockReturnThis(),
    update:  vi.fn().mockReturnThis(),
    delete:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    neq:     vi.fn().mockReturnThis(),
    in:      vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    limit:   vi.fn().mockReturnThis(),
    single:  vi.fn().mockResolvedValue({ data: result.data?.[0] ?? null, error: result.error }),
    then:    (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

/**
 * createSupabaseMock — legacy name, kept for backwards compat.
 * Prefer buildQueryMock for new tests.
 */
export function createSupabaseMock(defaultResult = { data: [], error: null }) {
  let result = defaultResult
  const chain = buildQueryMock(result)
  chain.mockResolve = (newResult) => { result = newResult }
  return chain
}

export function createAuthMock(user = null) {
  return {
    getSession: vi.fn().mockResolvedValue({
      data: { session: user ? { user } : null },
      error: null,
    }),
    onAuthStateChange: vi.fn((callback) => {
      // Immediately fire with the initial state
      callback('INITIAL_SESSION', user ? { user } : null)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
  }
}