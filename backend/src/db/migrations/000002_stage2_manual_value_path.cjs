exports.up = (pgm) => {
  pgm.addColumns('users', {
    phone_number_e164: { type: 'varchar(32)' },
  })

  pgm.addConstraint('users', 'users_phone_number_e164_unique', {
    unique: ['phone_number_e164'],
  })

  pgm.createTable('otp_requests', {
    id: { type: 'varchar(64)', primaryKey: true },
    phone_number: { type: 'varchar(32)', notNull: true },
    requested_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    consumed_at: { type: 'timestamptz' },
  })

  pgm.createTable('auth_sessions', {
    id: { type: 'varchar(64)', primaryKey: true },
    user_id: { type: 'varchar(64)', notNull: true, references: 'users(id)' },
    phone_number_masked: { type: 'varchar(32)', notNull: true },
    auth_state: { type: 'varchar(32)', notNull: true, default: 'verified' },
    default_household_id: { type: 'varchar(64)', references: 'households(id)' },
    lifecycle_status: { type: 'varchar(32)', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('subscriptions', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    name: { type: 'varchar(128)', notNull: true },
    provider_name: { type: 'varchar(128)', notNull: true },
    category: { type: 'varchar(64)', notNull: true },
    amount: { type: 'numeric(12,2)', notNull: true },
    cadence: { type: 'varchar(32)', notNull: true },
    normalized_monthly_amount: { type: 'numeric(12,2)', notNull: true },
    next_renewal_at: { type: 'timestamptz' },
    ownership_scope: { type: 'varchar(32)', notNull: true, default: 'personal' },
    source_type: { type: 'varchar(32)', notNull: true, default: 'manual' },
    status: { type: 'varchar(32)', notNull: true, default: 'active' },
    created_by: { type: 'varchar(64)', notNull: true, references: 'users(id)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('utility_bills', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    provider_name: { type: 'varchar(128)', notNull: true },
    category: { type: 'varchar(64)', notNull: true },
    typical_amount: { type: 'numeric(12,2)', notNull: true },
    cadence: { type: 'varchar(32)', notNull: true },
    normalized_monthly_amount: { type: 'numeric(12,2)', notNull: true },
    next_due_at: { type: 'timestamptz' },
    ownership_scope: { type: 'varchar(32)', notNull: true, default: 'personal' },
    source_type: { type: 'varchar(32)', notNull: true, default: 'manual' },
    status: { type: 'varchar(32)', notNull: true, default: 'active' },
    created_by: { type: 'varchar(64)', notNull: true, references: 'users(id)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createIndex('subscriptions', ['household_id', 'status'])
  pgm.createIndex('subscriptions', ['household_id', 'next_renewal_at'])
  pgm.createIndex('utility_bills', ['household_id', 'status'])
  pgm.createIndex('utility_bills', ['household_id', 'next_due_at'])
}

exports.down = (pgm) => {
  pgm.dropIndex('utility_bills', ['household_id', 'next_due_at'])
  pgm.dropIndex('utility_bills', ['household_id', 'status'])
  pgm.dropIndex('subscriptions', ['household_id', 'next_renewal_at'])
  pgm.dropIndex('subscriptions', ['household_id', 'status'])
  pgm.dropTable('utility_bills')
  pgm.dropTable('subscriptions')
  pgm.dropTable('auth_sessions')
  pgm.dropTable('otp_requests')
  pgm.dropConstraint('users', 'users_phone_number_e164_unique')
  pgm.dropColumns('users', ['phone_number_e164'])
}
