import { createContext } from 'react'
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/parking'

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
