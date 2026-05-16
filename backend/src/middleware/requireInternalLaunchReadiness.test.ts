import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { requireInternalLaunchReadinessAccess } from './requireInternalLaunchReadiness.js'

const envStub = vi.hoisted(() => ({
  INTERNAL_OPS_TOKEN: '' as string,
  NODE_ENV: 'test' as string,
}))

vi.mock('../config/env.js', () => ({
  get env() {
    return envStub
  },
}))

describe('requireInternalLaunchReadinessAccess', () => {
  it('allows when token unset outside production', () => {
    envStub.INTERNAL_OPS_TOKEN = ''
    envStub.NODE_ENV = 'test'
    const next = vi.fn()
    requireInternalLaunchReadinessAccess({ headers: {} } as Request, {} as Response, next as unknown as NextFunction)
    expect(next).toHaveBeenCalledWith()
  })

  it('403 in production when token unset', () => {
    envStub.NODE_ENV = 'production'
    envStub.INTERNAL_OPS_TOKEN = ''
    const next = vi.fn()
    requireInternalLaunchReadinessAccess({ headers: {} } as Request, {} as Response, next as unknown as NextFunction)
    expect(vi.mocked(next).mock.calls[0]?.[0]).toMatchObject({ code: 'INTERNAL_OPS_DISABLED' })
    envStub.NODE_ENV = 'test'
  })

  it('allows when x-internal-ops-token matches', () => {
    envStub.INTERNAL_OPS_TOKEN = 'secret-token'
    const next = vi.fn()
    requireInternalLaunchReadinessAccess(
      { headers: { 'x-internal-ops-token': 'secret-token' } } as unknown as Request,
      {} as Response,
      next as unknown as NextFunction,
    )
    expect(next).toHaveBeenCalledWith()
    envStub.INTERNAL_OPS_TOKEN = ''
  })

  it('403 when header mismatches token', () => {
    envStub.INTERNAL_OPS_TOKEN = 'secret-token'
    const next = vi.fn()
    requireInternalLaunchReadinessAccess(
      { headers: { 'x-internal-ops-token': 'wrong' } } as unknown as Request,
      {} as Response,
      next as unknown as NextFunction,
    )
    expect(vi.mocked(next).mock.calls[0]?.[0]).toMatchObject({ code: 'INTERNAL_OPS_FORBIDDEN' })
    envStub.INTERNAL_OPS_TOKEN = ''
  })
})
