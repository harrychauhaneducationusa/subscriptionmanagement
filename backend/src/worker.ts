import { logger } from './config/logger.js'
import { queues } from './queues/registry.js'
import { startAggregationLifecycleWorker } from './workers/aggregationLifecycle.worker.js'
import { startNotificationDispatchWorker } from './workers/notificationDispatch.worker.js'
import { startRecurringDetectionWorker } from './workers/recurringDetection.worker.js'
import { startTransactionIngestionWorker } from './workers/transactionIngestion.worker.js'
import { startTransactionNormalizationWorker } from './workers/transactionNormalization.worker.js'

const enabledQueues = Object.entries(queues)
  .filter(([, queue]) => queue !== null)
  .map(([name]) => name)

const aggregationLifecycleWorker = startAggregationLifecycleWorker()
const notificationDispatchWorker = startNotificationDispatchWorker()
const recurringDetectionWorker = startRecurringDetectionWorker()
const transactionIngestionWorker = startTransactionIngestionWorker()
const transactionNormalizationWorker = startTransactionNormalizationWorker()

logger.info(
  {
    enabledQueues,
    redisConfigured: enabledQueues.length > 0,
    aggregationLifecycleWorker: Boolean(aggregationLifecycleWorker),
    notificationDispatchWorker: Boolean(notificationDispatchWorker),
    recurringDetectionWorker: Boolean(recurringDetectionWorker),
    transactionIngestionWorker: Boolean(transactionIngestionWorker),
    transactionNormalizationWorker: Boolean(transactionNormalizationWorker),
  },
  'SubSense worker started',
)

setInterval(() => {
  logger.debug(
    {
      enabledQueues,
    },
    'Worker heartbeat',
  )
}, 30_000)
