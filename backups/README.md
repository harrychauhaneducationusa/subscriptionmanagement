# Database backups

Point-in-time PostgreSQL dumps paired with git commits so you can restore **code + data** together.

## Quick restore (code + database)

1. Find the backup in `manifest.json` (match `gitCommit` or `file`).
2. Check out that commit:

   ```bash
   git checkout <gitCommit>
   ```

3. Restore the dump:

   ```bash
   ./scripts/db-restore.sh backups/dumps/<dump-file>.sql.gz
   ```

4. If needed, align migrations:

   ```bash
   cd backend && npm run migrate
   ```

5. Restart API/worker and use the same `.env` `DATABASE_URL` as when the backup was taken.

## Create a new backup

```bash
./scripts/db-backup.sh
./scripts/db-backup.sh --note "before production trial"
```

This writes:

- `backups/dumps/subsense-<UTC-timestamp>-<short-sha>.sql.gz`
- An entry in `backups/manifest.json`

## Manifest fields

| Field | Meaning |
|-------|---------|
| `gitCommit` | Full SHA — checkout this for matching application code |
| `gitBranch` | Branch at backup time |
| `file` | Path to the `.sql.gz` dump |
| `migrationCount` | Rows in `pgmigrations` when backup was taken |
| `restoreHint` | Copy-paste restore commands |

## Requirements

- `pg_dump` / `psql` (PostgreSQL client)
- `DATABASE_URL` in repo-root `.env`
- Dump files under `backups/dumps/` are **not** committed (see `.gitignore`); keep them on disk or copy to secure storage.

## Docker Postgres (optional)

If you use `infra/docker-compose.yml`:

```bash
docker compose -f infra/docker-compose.yml up -d postgres
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/subsense
```
