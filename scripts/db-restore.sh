#!/usr/bin/env bash
# Restore a PostgreSQL dump created by scripts/db-backup.sh
#
# Usage:
#   ./scripts/db-restore.sh backups/dumps/subsense-YYYYMMDDTHHMMSSZ-028cbe7.sql.gz
#
# WARNING: This drops and recreates the public schema in the target database.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/.env"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path-to-dump.sql.gz|path-to-dump.sql>" >&2
  exit 1
fi

DUMP_INPUT="$1"

if [[ "${DUMP_INPUT}" != /* ]]; then
  DUMP_INPUT="${ROOT}/${DUMP_INPUT}"
fi

if [[ ! -f "${DUMP_INPUT}" ]]; then
  echo "Dump file not found: ${DUMP_INPUT}" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}" >&2
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

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client tools." >&2
  exit 1
fi

echo "==> Restoring ${DUMP_INPUT}"
echo "    Target: DATABASE_URL from .env"
echo ""
read -r -p "This will DROP the public schema. Continue? [y/N] " CONFIRM

if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

TMP_SQL="$(mktemp "${TMPDIR:-/tmp}/subsense-restore.XXXXXX.sql")"
trap 'rm -f "${TMP_SQL}"' EXIT

if [[ "${DUMP_INPUT}" == *.gz ]]; then
  gunzip -c "${DUMP_INPUT}" > "${TMP_SQL}"
else
  cp "${DUMP_INPUT}" "${TMP_SQL}"
fi

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
SQL

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${TMP_SQL}"

echo ""
echo "==> Restore complete"
echo "    Run migrations if this dump predates your checkout:"
echo "      cd backend && npm run migrate"
