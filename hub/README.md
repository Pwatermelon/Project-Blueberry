# Hub-сервис «Цифровой ВУЗ»

**Родительский портал** — не копия данных вузов, а общий слой поверх их реплик.

## Что на hub

- **Главная** — реестр вузов со ссылками на их домены
- **Яндекс ID** — вход для межвузовского общения
- **Чаты** — `FederatedChannel` / `FederatedMessage`
- **Реестр** — `RegisteredTenant` (мета + `siteUrl`, без расписания и карт)

## Что НЕ на hub

Расписание, корпуса, локальные участники, домашки — только на **реплике вуза** (`DEPLOYMENT_MODE=tenant`).

## Развёртывание hub

```env
DEPLOYMENT_MODE=hub
HUB_ROOT_ADMIN_EMAIL=you@yandex.ru
DATABASE_URL=postgresql://...
AUTH_URL=https://cifrovoy-vuz.ru
YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...
```

Root: `/hub/admin/tenants` — добавить вуз после того, как он развернул реплику и сообщил домен.

## Связь с репликами

Вуз в `.env` реплики:

```env
HUB_BASE_URL=https://cifrovoy-vuz.ru
```

Студенты переходят на hub для межвузовских чатов; локальный портал — для учёбы и данных вуза.

Подробнее: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
