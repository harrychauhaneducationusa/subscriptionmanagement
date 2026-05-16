/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.addColumn('consents', {
    provider_access_token: {
      type: 'text',
      comment: 'Plaid access_token (POC; encrypt at rest before production)',
    },
  })
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropColumn('consents', 'provider_access_token', { ifExists: true })
}
