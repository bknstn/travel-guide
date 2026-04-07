#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_BIN="${COMPOSE_BIN:-docker compose}"
BACKUP_OUTPUT_DIR="${BACKUP_OUTPUT_DIR:-${ROOT_DIR}/data/backups}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-travel_guide}"
POSTGRES_USER="${POSTGRES_USER:-travel_guide}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
BACKUP_FILE="${1:-${BACKUP_OUTPUT_DIR}/postgres/latest.dump}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "Restoring database from ${BACKUP_FILE}"
${COMPOSE_BIN} exec -T \
  -e PGPASSWORD="${POSTGRES_PASSWORD}" \
  "${POSTGRES_SERVICE}" \
  sh -lc "dropdb -h 127.0.0.1 -U '${POSTGRES_USER}' --if-exists '${POSTGRES_DB}' && createdb -h 127.0.0.1 -U '${POSTGRES_USER}' '${POSTGRES_DB}'"

cat "${BACKUP_FILE}" | ${COMPOSE_BIN} exec -T \
  -e PGPASSWORD="${POSTGRES_PASSWORD}" \
  "${POSTGRES_SERVICE}" \
  sh -lc "pg_restore -h 127.0.0.1 -U '${POSTGRES_USER}' -d '${POSTGRES_DB}' --no-owner --no-privileges"

echo "Database restore complete"
