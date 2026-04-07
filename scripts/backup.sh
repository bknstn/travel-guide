#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_BIN="${COMPOSE_BIN:-docker compose}"
BACKUP_OUTPUT_DIR="${BACKUP_OUTPUT_DIR:-${ROOT_DIR}/data/backups}"
GUIDE_ASSETS_DIR="${GUIDE_ASSETS_DIR:-${ROOT_DIR}/data/guides}"
RESTIC_REPOSITORY="${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
RESTIC_PASSWORD="${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-travel_guide}"
POSTGRES_USER="${POSTGRES_USER:-travel_guide}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DB_BACKUP_DIR="${BACKUP_OUTPUT_DIR}/postgres"
DB_DUMP_PATH="${DB_BACKUP_DIR}/${POSTGRES_DB}-${TIMESTAMP}.dump"
LATEST_DB_DUMP="${DB_BACKUP_DIR}/latest.dump"

mkdir -p "${DB_BACKUP_DIR}"
mkdir -p "${GUIDE_ASSETS_DIR}"

echo "Creating database dump at ${DB_DUMP_PATH}"
${COMPOSE_BIN} exec -T \
  -e PGPASSWORD="${POSTGRES_PASSWORD}" \
  "${POSTGRES_SERVICE}" \
  sh -lc "pg_dump -h 127.0.0.1 -U '${POSTGRES_USER}' -Fc '${POSTGRES_DB}'" > "${DB_DUMP_PATH}"

cp "${DB_DUMP_PATH}" "${LATEST_DB_DUMP}"

echo "Running restic backup"
export RESTIC_REPOSITORY RESTIC_PASSWORD
restic backup "${LATEST_DB_DUMP}" "${GUIDE_ASSETS_DIR}"

echo "Pruning old backups"
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune

echo "Backup complete"
