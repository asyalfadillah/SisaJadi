import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = memuat
  const [profile, setProfile] = useState(null)

  const loadProfile = useCallback(async (s) => {
    if (!s) return setProfile(null)
    const m = s.user.user_metadata || {}
    const { data } = await supabase.rpc('sj_ensure_profile', {
      p_name: m.full_name || m.name || null,
      p_business: m.business_name || null,
    })
    setProfile(data || null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      loadProfile(data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setTimeout(() => loadProfile(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading: session === undefined,
    isAdmin: profile?.role === 'admin',
    refreshProfile: () => loadProfile(session),
    signOut: () => supabase.auth.signOut(),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProfileCity() {
  const { profile } = useAuth()
  return { city: profile?.address || '' }
}
