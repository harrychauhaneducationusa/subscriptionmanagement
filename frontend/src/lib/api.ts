import axios from 'axios'
import { getStoredSession } from './session'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const existingAuth =
    typeof config.headers?.get === 'function'
      ? config.headers.get('Authorization') ?? config.headers.get('authorization')
      : (config.headers as { Authorization?: string; authorization?: string } | undefined)?.Authorization ??
        (config.headers as { authorization?: string } | undefined)?.authorization

  if (existingAuth) {
    return config
  }

  const session = getStoredSession()

  if (session?.sessionId) {
    config.headers.Authorization = `Bearer ${session.sessionId}`
  }

  return config
})
