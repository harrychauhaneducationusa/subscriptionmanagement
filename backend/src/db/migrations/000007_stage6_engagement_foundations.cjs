exports.up = (pgm) => {
  pgm.createTable('notification_preferences', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    user_id: { type: 'varchar(64)', notNull: true, references: 'users(id)' },
    in_app_recommendation_enabled: { type: 'boolean', notNull: true, default: true },
    in_app_renewal_enabled: { type: 'boolean', notNull: true, default: true },
    in_app_stale_link_enabled: { type: 'boolean', notNull: true, default: true },
    email_recommendation_enabled: { type: 'boolean', notNull: true, default: false },
    email_renewal_enabled: { type: 'boolean', notNull: true, default: false },
    email_stale_link_enabled: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.addConstraint(
    'notification_preferences',
    'notification_preferences_household_user_unique',
    'unique(household_id, user_id)',
  )

  pgm.createTable('notifications', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    user_id: { type: 'varchar(64)', notNull: true, references: 'users(id)' },
    notification_type: { type: 'varchar(32)', notNull: true },
    channel: { type: 'varchar(16)', notNull: true, default: 'in_app' },
    delivery_state: { type: 'varchar(16)', notNull: true, default: 'sent' },
    trigger_entity_type: { type: 'varchar(32)', notNull: true },
    trigger_entity_id: { type: 'varchar(64)', notNull: true },
    title: { type: 'varchar(160)', notNull: true },
    message: { type: 'text', notNull: true },
    deep_link: { type: 'varchar(255)' },
    snoozed_until: { type: 'timestamptz' },
    read_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.addConstraint(
    'notifications',
    'notifications_trigger_unique',
    'unique(user_id, channel, notification_type, trigger_entity_type, trigger_entity_id)',
  )

  pgm.createIndex('notifications', ['household_id', 'user_id', 'delivery_state'])
  pgm.createIndex('notifications', ['notification_type', 'created_at'])

  pgm.createTable('analytics_events', {
    id: { type: 'varchar(64)', primaryKey: true },
    event_name: { type: 'varchar(64)', notNull: true },
    household_id: { type: 'varchar(64)', references: 'households(id)' },
    user_id: { type: 'varchar(64)', references: 'users(id)' },
    session_id: { type: 'varchar(64)' },
    properties: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createIndex('analytics_events', ['event_name', 'created_at'])
  pgm.createIndex('analytics_events', ['household_id', 'created_at'])
}

exports.down = (pgm) => {
  pgm.dropIndex('analytics_events', ['household_id', 'created_at'])
  pgm.dropIndex('analytics_events', ['event_name', 'created_at'])
  pgm.dropTable('analytics_events')

  pgm.dropIndex('notifications', ['notification_type', 'created_at'])
  pgm.dropIndex('notifications', ['household_id', 'user_id', 'delivery_state'])
  pgm.dropConstraint('notifications', 'notifications_trigger_unique')
  pgm.dropTable('notifications')

  pgm.dropConstraint('notification_preferences', 'notification_preferences_household_user_unique')
  pgm.dropTable('notification_preferences')
}
