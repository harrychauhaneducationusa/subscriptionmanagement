exports.up = (pgm) => {
  pgm.createTable('recurring_candidates', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    merchant_profile_id: { type: 'varchar(64)', references: 'merchant_profiles(id)' },
    candidate_type: { type: 'varchar(32)', notNull: true },
    display_name: { type: 'varchar(128)', notNull: true },
    category: { type: 'varchar(64)', notNull: true },
    confidence_score: { type: 'numeric(5,2)', notNull: true },
    reason_codes: { type: 'jsonb', notNull: true, default: '[]' },
    suggested_amount: { type: 'numeric(12,2)', notNull: true },
    cadence: { type: 'varchar(32)', notNull: true },
    ownership_scope: { type: 'varchar(32)', notNull: true, default: 'personal' },
    suggested_next_occurrence_at: { type: 'timestamptz' },
    review_status: { type: 'varchar(32)', notNull: true, default: 'pending_review' },
    source_transaction_refs: { type: 'jsonb', notNull: true, default: '[]' },
    merged_target_kind: { type: 'varchar(32)' },
    merged_target_id: { type: 'varchar(64)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createIndex('recurring_candidates', ['household_id', 'review_status'])
  pgm.createIndex('recurring_candidates', ['merchant_profile_id'])
}

exports.down = (pgm) => {
  pgm.dropIndex('recurring_candidates', ['merchant_profile_id'])
  pgm.dropIndex('recurring_candidates', ['household_id', 'review_status'])
  pgm.dropTable('recurring_candidates')
}
