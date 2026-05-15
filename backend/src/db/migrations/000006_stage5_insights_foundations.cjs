exports.up = (pgm) => {
  pgm.createTable('recommendations', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    recommendation_type: { type: 'varchar(32)', notNull: true },
    target_entity_type: { type: 'varchar(32)', notNull: true },
    target_entity_id: { type: 'varchar(64)', notNull: true },
    title: { type: 'varchar(160)', notNull: true },
    message: { type: 'text', notNull: true },
    estimated_monthly_value: { type: 'numeric(12,2)', notNull: true },
    confidence: { type: 'numeric(5,2)', notNull: true },
    assumptions: { type: 'jsonb', notNull: true, default: '[]' },
    priority_rank: { type: 'integer', notNull: true, default: 0 },
    status: { type: 'varchar(32)', notNull: true, default: 'open' },
    actioned_at: { type: 'timestamptz' },
    actioned_by: { type: 'varchar(64)' },
    snoozed_until: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createTable('insight_events', {
    id: { type: 'varchar(64)', primaryKey: true },
    household_id: { type: 'varchar(64)', notNull: true, references: 'households(id)' },
    insight_type: { type: 'varchar(64)', notNull: true },
    source_recommendation_id: { type: 'varchar(64)', references: 'recommendations(id)' },
    generated_text: { type: 'text', notNull: true },
    evidence_refs: { type: 'jsonb', notNull: true, default: '[]' },
    freshness_status: { type: 'varchar(32)', notNull: true, default: 'fresh' },
    confidence_label: { type: 'varchar(32)' },
    generation_mode: { type: 'varchar(32)', notNull: true, default: 'rules' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createIndex('recommendations', ['household_id', 'status'])
  pgm.createIndex('recommendations', ['household_id', 'priority_rank'])
  pgm.createIndex('insight_events', ['household_id', 'created_at'])
  pgm.createIndex('insight_events', ['source_recommendation_id'])
}

exports.down = (pgm) => {
  pgm.dropIndex('insight_events', ['source_recommendation_id'])
  pgm.dropIndex('insight_events', ['household_id', 'created_at'])
  pgm.dropIndex('recommendations', ['household_id', 'priority_rank'])
  pgm.dropIndex('recommendations', ['household_id', 'status'])
  pgm.dropTable('insight_events')
  pgm.dropTable('recommendations')
}
