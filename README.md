# «Цифровой ВУЗ» — репозиторий платформы

Единая платформа для вузов: расписание, задания, чаты, карта корпусов, новости.  
Современный стек: **Next.js 16**, **PostgreSQL**, **Prisma**, **NextAuth**, **Docker**.

## Структура

```
Project-Blueberry/
├── src/                 # Next.js приложение
├── prisma/              # Схема БД и seed
├── tenants/             # Пакеты вузов (конфиг, карты, группы)
│   ├── sstu/            # СГТУ — данные и адаптер rasp.sstu.ru
│   └── _template/       # Шаблон для нового вуза
├── services/sstu-parser # Опциональный парсер расписания СГТУ
├── hub/                 # Документация hub-сервера (межвузовские чаты)
├── docs/                # Архитектура, авторизация, формат расписания
└── legacy/              # Архив старого JS-прототипа (2024)
```

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build
# http://localhost:3000
```

**Вход:** Яндекс ID. **Root:** `ROOT_ADMIN_EMAIL` в env → первый вход через Яндекс = админ.  
**Участники:** root/админы добавляют уже зарегистрированных пользователей в `/o/sstu/admin/members`.

Dev без root: `admin@sstu.local` / `password123`. Подробнее: [docs/AUTH.md](docs/AUTH.md).

## Подключение нового вуза

1. Скопировать `tenants/_template/` → `tenants/my-univ/`
2. Заполнить `tenant.json`, `data/buildings.json`
3. Развернуть инстанс с `TENANT_SLUG=my-univ` и своей БД
4. Админ добавляет почты студентов/преподавателей (CSV или вручную)

Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SCHEDULE_FORMAT.md](docs/SCHEDULE_FORMAT.md).

## Docker: три режима

| Файл | Назначение |
|------|------------|
| `docker-compose.yml` | Dev: hub + tenant на `:3000` |
| `docker-compose.hub.yml` | Prod hub → `:3000`, БД `:5433` |
| `docker-compose.tenant.yml` | Prod tenant → `:3001`, БД `:5434` |

```bash
# Hub
docker compose -f docker-compose.hub.yml up --build

# Tenant (у вуза)
TENANT_SLUG=sstu HUB_BASE_URL=http://localhost:3000 docker compose -f docker-compose.tenant.yml up --build
```

`HUB_SYNC_SECRET` — одинаковый на hub и tenant.

## Hub (межвузовские чаты)

Tenant-инстансы: `HUB_BASE_URL=https://hub.example.ru`  
Hub-сервер: `DEPLOYMENT_MODE=hub` (отдельная БД).

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Разработка |
| `npm run db:seed` | Демо-данные |
| `npm run tenant:import-groups -- sstu` | Импорт **учебных групп** для расписания (не пользователей!) |

## Миграция с legacy

Старый код в `legacy/`. Данные СГТУ: `tenants/sstu/data/` (ссылка на calendars из legacy).
