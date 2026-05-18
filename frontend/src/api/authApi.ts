import type { AuthUser, LoginPayload, RegisterPayload } from '../types/parking'
import { api } from './client'

type AuthResponse = {
  user: AuthUser | null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await api.get<AuthResponse>('/auth/me')
  return response.user
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const response = await api.post<AuthResponse>('/auth/register', payload)
  if (!response.user) {
    throw new Error('Не удалось создать пользователя')
  }
  return response.user
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  if (!response.user) {
    throw new Error('Не удалось войти')
  }
  return response.user
}

export async function logout(): Promise<void> {
  await api.post<null>('/auth/logout', {})
}
