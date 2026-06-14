#!/bin/sh
set -e

echo "[cifrovoy-vuz] Ожидание PostgreSQL и применение миграций…"
attempt=0
until npx prisma migrate deploy; do
  attempt=$((attempt + 1))
  if [ "$attempt" -gt 60 ]; then
    echo "[cifrovoy-vuz] Не удалось применить миграции за 2 минуты."
    exit 1
  fi
  echo "[cifrovoy-vuz] Повтор через 2 с (попытка $attempt)…"
  sleep 2
done

if [ "${SEED_ON_START:-true}" != "false" ]; then
  echo "[cifrovoy-vuz] Загрузка демо-данных (seed)…"
  npx prisma db seed || echo "[cifrovoy-vuz] Seed завершился с предупреждением — смотрите лог выше."
fi

echo "[cifrovoy-vuz] Запуск Next.js…"
exec npm run start
