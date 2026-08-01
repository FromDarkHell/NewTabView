#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/data}"
PG_DATA="$DATA_DIR/postgres"
REDIS_DATA="$DATA_DIR/redis"
PG_BIN="$(dirname "$(find /usr/lib/postgresql -maxdepth 2 -name initdb | head -n1)")"
PG_USER="${POSTGRES_USER:-newtab}"
PG_PASSWORD="${POSTGRES_PASSWORD:-newtab}"
PG_DB="${POSTGRES_DB:-newtab}"

start_embedded_postgres() {
  mkdir -p "$PG_DATA"
  chown -R postgres:postgres "$PG_DATA"

  if [ ! -s "$PG_DATA/PG_VERSION" ]; then
    echo "==> Initializing embedded Postgres at $PG_DATA"
    printf '%s' "$PG_PASSWORD" > /tmp/pgpass
    su postgres -c "'$PG_BIN/initdb' -D '$PG_DATA' -U '$PG_USER' --auth=scram-sha-256 --pwfile=/tmp/pgpass"
    rm -f /tmp/pgpass
  fi

  echo "==> Starting embedded Postgres"
  su postgres -c "'$PG_BIN/pg_ctl' -D '$PG_DATA' -l '$DATA_DIR/postgres.log' -o '-c listen_addresses=localhost -c port=5432' start"

  until su postgres -c "'$PG_BIN/pg_isready' -p 5432 -U '$PG_USER'" >/dev/null 2>&1; do
    sleep 0.5
  done

  if ! su postgres -c "'$PG_BIN/psql' -p 5432 -U '$PG_USER' -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname = '$PG_DB'\"" | grep -q 1; then
    su postgres -c "'$PG_BIN/createdb' -p 5432 -U '$PG_USER' -O '$PG_USER' '$PG_DB'"
  fi

  export DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@localhost:5432/${PG_DB}"
}

start_embedded_redis() {
  mkdir -p "$REDIS_DATA"
  echo "==> Starting embedded Redis"
  redis-server --daemonize yes --dir "$REDIS_DATA" --port 6379 --save 60 1
  export REDIS_URL="redis://localhost:6379"
}

if [ -z "$DATABASE_URL" ]; then
  start_embedded_postgres
else
  echo "==> Using external DATABASE_URL"
fi

if [ -z "$REDIS_URL" ]; then
  start_embedded_redis
else
  echo "==> Using external REDIS_URL"
fi

echo "==> Running database migrations"
npx prisma migrate deploy

exec "$@"
