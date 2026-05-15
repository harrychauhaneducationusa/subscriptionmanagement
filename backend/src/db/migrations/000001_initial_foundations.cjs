exports.up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'varchar(64)', primaryKey: true },
    phone_number_masked: { type: 'varchar(32)', notNull: true },
    auth_state: { type: 'varchar(32)', notNull: true, default: 'guest' },
    default_household_id: { type: 'varchar(64)' },
    lifecycle_status: { type: 'varchar(32)', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('households', {
    id: { type: 'varchar(64)', primaryKey: true },
    name: { type: 'varchar(128)', notNull: true },
    type: { type: 'varchar(32)', notNull: true },
    owner_user_id: { type: 'varchar(64)', notNull: true, references: 'users(id)' },
    privacy_mode: { type: 'varchar(32)', notNull: true, default: 'balanced' },
    selected_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('household_members', {
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    user_id: { type: 'varchar(64)', notNull: true, references: 'users(id)' },
    role: { type: 'varchar(32)', notNull: true, default: 'owner' },
    member_status: { type: 'varchar(32)', notNull: true, default: 'active' },
    visibility_scope: { type: 'varchar(32)', notNull: true, default: 'full' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.addConstraint('household_members', 'household_members_pk', {
    primaryKey: ['household_id', 'user_id'],
  })

  pgm.createTable('onboarding_drafts', {
    id: { type: 'varchar(64)', primaryKey: true },
    user_id: { type: 'varchar(64)', references: 'users(id)' },
    household_mode: { type: 'varchar(32)' },
    household_type: { type: 'varchar(32)' },
    essential_recurring_items: { type: 'jsonb', notNull: true, default: '[]' },
    seeded_subscriptions: { type: 'jsonb', notNull: true, default: '[]' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('audit_events', {
    id: { type: 'varchar(64)', primaryKey: true },
    action: { type: 'varchar(128)', notNull: true },
    actor_type: { type: 'varchar(32)', notNull: true },
    actor_id: { type: 'varchar(64)' },
    entity_type: { type: 'varchar(64)', notNull: true },
    entity_id: { type: 'varchar(64)', notNull: true },
    metadata: { type: 'jsonb' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('audit_events')
  pgm.dropTable('onboarding_drafts')
  pgm.dropConstraint('household_members', 'household_members_pk')
  pgm.dropTable('household_members')
  pgm.dropTable('households')
  pgm.dropTable('users')
}
