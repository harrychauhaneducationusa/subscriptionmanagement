exports.up = (pgm) => {
  pgm.createTable('consents', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    provider: { type: 'varchar(32)', notNull: true, default: 'setu_aa' },
    institution_name: { type: 'varchar(128)', notNull: true },
    purpose: { type: 'varchar(256)', notNull: true },
    scope: { type: 'jsonb', notNull: true, default: '[]' },
    status: { type: 'varchar(32)', notNull: true, default: 'pending_user_action' },
    issued_at: { type: 'timestamptz' },
    expires_at: { type: 'timestamptz' },
    revoked_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('institution_links', {
    id: { type: 'varchar(64)', primaryKey: true },
    consent_id: { type: 'varchar(64)', notNull: true, references: 'consents(id)' },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    institution_name: { type: 'varchar(128)', notNull: true },
    link_status: { type: 'varchar(32)', notNull: true, default: 'pending' },
    last_successful_sync_at: { type: 'timestamptz' },
    last_failure_reason: { type: 'varchar(256)' },
    repair_required: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('bank_accounts', {
    id: { type: 'varchar(64)', primaryKey: true },
    institution_link_id: { type: 'varchar(64)', notNull: true, references: 'institution_links(id)' },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    account_type: { type: 'varchar(32)', notNull: true, default: 'savings' },
    masked_account_reference: { type: 'varchar(32)', notNull: true },
    provider_account_id: { type: 'varchar(128)' },
    account_status: { type: 'varchar(32)', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createIndex('consents', ['household_id', 'status'])
  pgm.createIndex('institution_links', ['household_id', 'link_status'])
  pgm.createIndex('bank_accounts', ['household_id', 'account_status'])
}

exports.down = (pgm) => {
  pgm.dropIndex('bank_accounts', ['household_id', 'account_status'])
  pgm.dropIndex('institution_links', ['household_id', 'link_status'])
  pgm.dropIndex('consents', ['household_id', 'status'])
  pgm.dropTable('bank_accounts')
  pgm.dropTable('institution_links')
  pgm.dropTable('consents')
}
