import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { requireSession } from './requireSession.js'

const getSession = vi.hoisted(() => vi.fn())

vi.mock('../modules/auth/auth.store.js', () => ({
  getSession,
}))

describe('requireSession', () => {
  it('401 when Authorization missing', async () => {
    const next = vi.fn()
    const req = { headers: {} } as Request
    await requireSession(req, {} as Response, next as unknown as NextFunction)

    expect(getSession).not.toHaveBeenCalled()
    expect(vi.mocked(next).mock.calls[0]?.[0]).toMatchObject({ statusCode: 401, code: 'AUTH_REQUIRED' })
  })

  it('401 when session not found', async () => {
    getSession.mockResolvedValueOnce(null)
    const next = vi.fn()
    const req = { headers: { authorization: 'Bearer ses_bad' } } as unknown as Request
    await requireSession(req, {} as Response, next as unknown as NextFunction)

    expect(getSession).toHaveBeenCalledWith('ses_bad')
    expect(vi.mocked(next).mock.calls[0]?.[0]).toMatchObject({ statusCode: 401, code: 'SESSION_INVALID' })
  })

  it('attaches session and calls next', async () => {
    const session = {
      sessionId: 'ses_ok',
      userId: 'usr_1',
      phoneNumberMasked: '******0000',
      authState: 'verified' as const,
      defaultHouseholdId: 'hh_1',
      lifecycleStatus: 'active' as const,
      createdAt: new Date().toISOString(),
    }
    getSession.mockResolvedValueOnce(session)
    const next = vi.fn()
    const req = { headers: { authorization: 'Bearer ses_ok' } } as unknown as Request
    await requireSession(req, {} as Response, next as unknown as NextFunction)

    expect(req.authSession).toEqual(session)
    expect(next).toHaveBeenCalledWith()
  })
})
