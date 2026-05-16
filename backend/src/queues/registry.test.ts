import { describe, expect, it, vi } from 'vitest'

vi.mock('../config/redis.js', () => ({
  getRedisConnection: () => ({ host: '127.0.0.1', port: 6379 }),
}))

vi.mock('bullmq', () => ({
  Queue: vi.fn((name: string) => ({ __queueName: name })),
}))

import { Queue } from 'bullmq'
import { queues } from './registry.js'

describe('queues registry', () => {
  it('defines lifecycle and worker queue slots', () => {
    expect(Object.keys(queues).sort()).toEqual([
      'aggregationLifecycle',
      'notificationDispatch',
      'recurringDetection',
      'transactionIngestion',
      'transactionNormalization',
    ])
  })

  it('constructs a Bull queue per slot when Redis is configured', () => {
    expect(Queue).toHaveBeenCalled()
    expect(queues.transactionIngestion).toEqual({ __queueName: 'transaction_ingestion' })
  })
})
