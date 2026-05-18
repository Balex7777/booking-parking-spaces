import { useEffect, useState } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/authApi'
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/parking'
import { AuthContext } from './AuthContext.shared'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  async function login(payload: LoginPayload) {
    const nextUser = await loginRequest(payload)
    setUser(nextUser)
  }

  async function register(payload: RegisterPayload) {
    const nextUser = await registerRequest(payload)
    setUser(nextUser)
  }

  async function logout() {
    await logoutRequest()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
