exports.up = (pgm) => {
  pgm.sql(`
    alter table users
      alter column phone_number_masked type varchar(128)
  `)

  pgm.addColumns('users', {
    email: { type: 'varchar(320)' },
    email_verified: { type: 'boolean', notNull: true, default: false },
    auth_provider: { type: 'varchar(32)', notNull: true, default: 'phone' },
    oauth_provider: { type: 'varchar(32)' },
    oauth_provider_id: { type: 'varchar(255)' },
    display_name: { type: 'varchar(256)' },
  })

  pgm.sql(`
    create unique index users_email_lower_uidx
      on users (lower(email))
      where email is not null
  `)

  pgm.sql(`
    create unique index users_oauth_uidx
      on users (oauth_provider, oauth_provider_id)
      where oauth_provider is not null and oauth_provider_id is not null
  `)

  pgm.createTable('email_otp_requests', {
    id: { type: 'varchar(64)', primaryKey: true },
    email_normalized: { type: 'varchar(320)', notNull: true },
    code_hash: { type: 'varchar(128)', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    consumed_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  })

  pgm.createIndex('email_otp_requests', ['email_normalized', 'expires_at'], {
    name: 'email_otp_requests_email_expires_idx',
  })

  pgm.sql(`
    alter table auth_sessions
      alter column phone_number_masked type varchar(128)
  `)
}

exports.down = (pgm) => {
  pgm.dropIndex('email_otp_requests', 'email_otp_requests_email_expires_idx')
  pgm.dropTable('email_otp_requests')
  pgm.sql('drop index if exists users_oauth_uidx')
  pgm.sql('drop index if exists users_email_lower_uidx')
  pgm.dropColumns('users', [
    'email',
    'email_verified',
    'auth_provider',
    'oauth_provider',
    'oauth_provider_id',
    'display_name',
  ])
  pgm.sql(`
    alter table auth_sessions
      alter column phone_number_masked type varchar(32)
  `)
  pgm.sql(`
    alter table users
      alter column phone_number_masked type varchar(32)
  `)
}
