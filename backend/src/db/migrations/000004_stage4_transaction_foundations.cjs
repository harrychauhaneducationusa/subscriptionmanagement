exports.up = (pgm) => {
  pgm.createTable('merchant_profiles', {
    id: { type: 'varchar(64)', primaryKey: true },
    display_name: { type: 'varchar(128)', notNull: true },
    merchant_type: { type: 'varchar(64)', notNull: true },
    category_default: { type: 'varchar(64)', notNull: true },
    quality_score: { type: 'numeric(5,2)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('merchant_aliases', {
    id: { type: 'varchar(64)', primaryKey: true },
    merchant_profile_id: { type: 'varchar(64)', notNull: true, references: 'merchant_profiles(id)' },
    descriptor_raw: { type: 'varchar(256)', notNull: true },
    descriptor_normalized: { type: 'varchar(256)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.addConstraint('merchant_aliases', 'merchant_aliases_normalized_unique', {
    unique: ['descriptor_normalized'],
  })

  pgm.createTable('raw_transactions', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    institution_link_id: { type: 'varchar(64)', notNull: true, references: 'institution_links(id)' },
    bank_account_id: { type: 'varchar(64)', notNull: true, references: 'bank_accounts(id)' },
    consent_id: { type: 'varchar(64)', notNull: true, references: 'consents(id)' },
    provider_transaction_id: { type: 'varchar(128)' },
    description_raw: { type: 'varchar(256)', notNull: true },
    amount: { type: 'numeric(12,2)', notNull: true },
    direction: { type: 'varchar(16)', notNull: true },
    occurred_at: { type: 'timestamptz', notNull: true },
    ingestion_batch_id: { type: 'varchar(64)', notNull: true },
    source_payload: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.addConstraint('raw_transactions', 'raw_transactions_provider_unique', {
    unique: ['bank_account_id', 'provider_transaction_id'],
  })

  pgm.createTable('normalized_transactions', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    raw_transaction_id: { type: 'varchar(64)', notNull: true, references: 'raw_transactions(id)' },
    merchant_profile_id: { type: 'varchar(64)', references: 'merchant_profiles(id)' },
    description_normalized: { type: 'varchar(256)', notNull: true },
    category: { type: 'varchar(64)', notNull: true },
    amount: { type: 'numeric(12,2)', notNull: true },
    recurring_signals: { type: 'jsonb', notNull: true, default: '{}' },
    duplicate_flags: { type: 'jsonb' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.addConstraint('normalized_transactions', 'normalized_transactions_raw_unique', {
    unique: ['raw_transaction_id'],
  })

  pgm.createIndex('raw_transactions', ['household_id', 'occurred_at'])
  pgm.createIndex('raw_transactions', ['institution_link_id', 'occurred_at'])
  pgm.createIndex('normalized_transactions', ['household_id', 'category'])
  pgm.createIndex('normalized_transactions', ['merchant_profile_id'])
}

exports.down = (pgm) => {
  pgm.dropIndex('normalized_transactions', ['merchant_profile_id'])
  pgm.dropIndex('normalized_transactions', ['household_id', 'category'])
  pgm.dropIndex('raw_transactions', ['institution_link_id', 'occurred_at'])
  pgm.dropIndex('raw_transactions', ['household_id', 'occurred_at'])
  pgm.dropConstraint('normalized_transactions', 'normalized_transactions_raw_unique')
  pgm.dropTable('normalized_transactions')
  pgm.dropConstraint('raw_transactions', 'raw_transactions_provider_unique')
  pgm.dropTable('raw_transactions')
  pgm.dropConstraint('merchant_aliases', 'merchant_aliases_normalized_unique')
  pgm.dropTable('merchant_aliases')
  pgm.dropTable('merchant_profiles')
}
