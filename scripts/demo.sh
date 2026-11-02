#!/usr/bin/env bash
# Demo environment: one throwaway database + the env a tunnel run needs (PM, demo items 1-6).
#
#   scripts/demo.sh                    # recreate the database, seed, print the env block
#   scripts/demo.sh https://x.trycloudflare.com   # ...and emit AUTH_URL/APP_URL for that tunnel
#
# The database is dropped and recreated on every run, so a demo never inherits yesterday's
# rows. The cluster is project-owned (~/.local/share/biro-jasa/demo-pg, port 5433): the
# system cluster on 5432 needs the postgres password, which this account does not have.
set -euo pipefail

PGBIN=${PGBIN:-/usr/lib/postgresql/17/bin}
PORT=${DEMO_DB_PORT:-5433}
DIR=${DEMO_PG_DIR:-$HOME/.local/share/biro-jasa/demo-pg}
DB=biro_jasa_demo
TUNNEL=${1:-}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

# A public tunnel must never serve the default seed password: refuse before touching the database.
if [ -n "$TUNNEL" ] && [ -z "${DEMO_PASSWORD:-}" ]; then
  echo "DEMO_PASSWORD must be set when a tunnel URL is given." >&2
  exit 1
fi

if [ ! -d "$DIR" ]; then
  mkdir -p "$DIR"
  "$PGBIN/initdb" -D "$DIR" -U postgres -A trust >/dev/null
fi

if ! "$PGBIN/pg_ctl" -D "$DIR" status >/dev/null 2>&1; then
  "$PGBIN/pg_ctl" -D "$DIR" -o "-p $PORT -k $DIR -c listen_addresses=localhost" \
    -l "$DIR/pg.log" -w start >/dev/null
fi

"$PGBIN/psql" -h localhost -p "$PORT" -U postgres -d postgres -q \
  -c "drop database if exists $DB" -c "create database $DB"

export DATABASE_URL="postgresql://postgres@localhost:$PORT/$DB?schema=public"
cd "$ROOT"
npx prisma migrate deploy >/dev/null
node --experimental-strip-types prisma/seed.ts

cat <<EOF

Demo database ready on port $PORT (database $DB).

  DATABASE_URL="$DATABASE_URL"
EOF

if [ -n "$TUNNEL" ]; then
  cat <<EOF
  AUTH_URL="$TUNNEL"
  APP_URL="$TUNNEL"
  AUTH_TRUST_HOST="true"

Start the app with those exported:
  DATABASE_URL="$DATABASE_URL" AUTH_URL="$TUNNEL" APP_URL="$TUNNEL" AUTH_TRUST_HOST=true pnpm start -p 3010
EOF
fi
