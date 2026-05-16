/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable('link_sync_schedule', {
    link_id: {
      type: 'varchar(64)',
      primaryKey: true,
      references: 'institution_links(id)',
      onDelete: 'CASCADE',
      comment: 'Per-institution-link scheduler row for delta sync cadence',
    },
    sync_tier: {
      type: 'varchar(16)',
      notNull: true,
      default: 'free',
      comment: 'free | premium — controls baseline interval until billing integration',
    },
    interval_seconds_effective: {
      type: 'integer',
      notNull: true,
      comment: 'Last computed interval used for next_run_at (adaptive tuning later)',
    },
    jitter_seconds_max: {
      type: 'integer',
      notNull: true,
      default: 300,
    },
    next_run_at: {
      type: 'timestamptz',
      notNull: true,
      comment: 'When the link is eligible for the next scheduled delta sync',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  })

  pgm.createIndex('link_sync_schedule', ['next_run_at'], {
    name: 'link_sync_schedule_next_run_at_idx',
  })
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropIndex('link_sync_schedule', 'link_sync_schedule_next_run_at_idx', { ifExists: true })
  pgm.dropTable('link_sync_schedule', { ifExists: true })
}
