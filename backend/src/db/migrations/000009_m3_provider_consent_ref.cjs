exports.up = (pgm) => {
  pgm.addColumn('consents', {
    provider_consent_ref: {
      type: 'varchar(128)',
      notNull: false,
    },
  })
  pgm.createIndex('consents', 'provider_consent_ref')
}

exports.down = (pgm) => {
  pgm.dropIndex('consents', 'provider_consent_ref', { ifExists: true })
  pgm.dropColumn('consents', 'provider_consent_ref')
}
