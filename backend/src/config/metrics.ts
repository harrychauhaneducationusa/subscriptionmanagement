import { collectDefaultMetrics, Counter, Registry } from 'prom-client'

export const metricsRegistry = new Registry()

collectDefaultMetrics({ register: metricsRegistry })

export const httpRequestCounter = new Counter({
  name: 'subsense_http_requests_total',
  help: 'Total HTTP requests handled by the API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
})

export const productEventCounter = new Counter({
  name: 'subsense_product_events_total',
  help: 'Total tracked product analytics events',
  labelNames: ['event_name'],
  registers: [metricsRegistry],
})

export const notificationActionCounter = new Counter({
  name: 'subsense_notification_actions_total',
  help: 'Total notification lifecycle actions',
  labelNames: ['notification_type', 'action'],
  registers: [metricsRegistry],
})
