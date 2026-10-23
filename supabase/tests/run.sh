#!/usr/bin/env bash
# Applies migrations + RLS tests to a throwaway local Postgres database.
# Usage: PGHOST=... PGUSER=... supabase/tests/run.sh   (defaults to local postgres via sudo -u postgres)
set -euo pipefail
cd "$(dirname "$0")/.."
DB=kanban_test
PSQL="psql -v ON_ERROR_STOP=1 -q -t -A"
$PSQL -d postgres -c "drop database if exists $DB" -c "create database $DB"
$PSQL -d $DB -f tests/stub_supabase.sql
for f in migrations/*.sql; do echo "== $f"; $PSQL -d $DB -f "$f"; done
echo "== seed"; $PSQL -d $DB -f seed.sql
echo "== rls tests"; $PSQL -d $DB -f tests/rls.sql
echo "ALL OK"
