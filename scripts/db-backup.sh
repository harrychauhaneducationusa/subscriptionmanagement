#!/usr/bin/env bash
# Create a PostgreSQL dump for SubSense and record it in backups/manifest.json.
#
# Usage:
#   ./scripts/db-backup.sh
#   ./scripts/db-backup.sh --note "before plaid spike"
#
# Requires: pg_dump, DATABASE_URL in repo-root .env

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/.env"
DUMPS_DIR="${ROOT}/backups/dumps"
MANIFEST="${ROOT}/backups/manifest.json"
NOTE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --note)
      NOTE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy from .env.example first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set in ${ENV_FILE}" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump not found. Install PostgreSQL client tools." >&2
  exit 1
fi

mkdir -p "${DUMPS_DIR}"

GIT_COMMIT="$(git -C "${ROOT}" rev-parse HEAD 2>/dev/null || echo unknown)"
GIT_BRANCH="$(git -C "${ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
SHORT_SHA="${GIT_COMMIT:0:7}"
BASENAME="subsense-${TIMESTAMP}-${SHORT_SHA}"
DUMP_SQL="${DUMPS_DIR}/${BASENAME}.sql"
DUMP_GZ="${DUMP_SQL}.gz"

echo "==> Dumping database to ${DUMP_GZ}"
pg_dump "${DATABASE_URL}" --no-owner --no-acl --format=plain --file="${DUMP_SQL}"
gzip -f "${DUMP_SQL}"

FILE_SIZE_BYTES="$(wc -c < "${DUMP_GZ}" | tr -d ' ')"

MIGRATION_COUNT=""
if command -v psql >/dev/null 2>&1; then
  MIGRATION_COUNT="$(psql "${DATABASE_URL}" -tAc "select count(*) from pgmigrations" 2>/dev/null | tr -d ' ' || true)"
fi

RELATIVE_PATH="backups/dumps/$(basename "${DUMP_GZ}")"

export ROOT MANIFEST RELATIVE_PATH GIT_COMMIT GIT_BRANCH TIMESTAMP NOTE FILE_SIZE_BYTES MIGRATION_COUNT
node <<'NODE'
const fs = require('node:fs')
const path = require('node:path')

const manifestPath = process.env.MANIFEST
let manifest = { schemaVersion: 1, backups: [] }

if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

const entry = {
  id: process.env.RELATIVE_PATH.replace(/^backups\/dumps\//, '').replace(/\.sql\.gz$/, ''),
  createdAt: new Date().toISOString(),
  dumpUtc: process.env.TIMESTAMP,
  file: process.env.RELATIVE_PATH,
  format: 'plain-sql-gzip',
  gitCommit: process.env.GIT_COMMIT,
  gitBranch: process.env.GIT_BRANCH,
  migrationCount: process.env.MIGRATION_COUNT || null,
  sizeBytes: Number(process.env.FILE_SIZE_BYTES),
  note: process.env.NOTE || null,
  restoreHint: `git checkout ${process.env.GIT_COMMIT} && ./scripts/db-restore.sh ${process.env.RELATIVE_PATH}`,
}

manifest.backups = [entry, ...(manifest.backups || [])]
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify(entry, null, 2))
NODE

echo ""
echo "==> Backup complete"
echo "    File:    ${RELATIVE_PATH}"
echo "    Commit:  ${GIT_COMMIT} (${GIT_BRANCH})"
echo "    Restore: git checkout ${GIT_COMMIT}"
echo "             ./scripts/db-restore.sh ${RELATIVE_PATH}"
