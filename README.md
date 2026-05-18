# Сервис поиска и бронирования парковочных мест

Фронтенд: React + TypeScript + Vite (`frontend/`). Бэкенд: Node.js + Express (`backend/`).

## Запуск

```bash
# Установка зависимостей обоих модулей
npm run install:all

# Бэкенд (порт 3001)
npm run dev:backend

# Фронтенд (порт 5173, в отдельном терминале)
npm run dev:frontend
```

В режиме разработки Vite проксирует запросы `/api` на бэкенд.

## Структура проекта

```
├── backend/                  # Node.js + Express
│   ├── data/                 # JSON-файлы БД
│   │   └── initialData.json
│   ├── src/
│   │   ├── db/               # Работа с БД
│   │   │   └── store.js
│   │   ├── services/         # Бизнес-логика
│   │   │   ├── parkingService.js
│   │   │   └── bookingService.js
│   │   ├── routes/           # Роутинг (API)
│   │   │   ├── parkingsRouter.js
│   │   │   └── bookingsRouter.js
│   │   └── index.js          # Точка входа
│   └── package.json
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/              # Работа с API (fetch-обёртки)
│   │   │   ├── client.ts
│   │   │   ├── parkingsApi.ts
│   │   │   └── bookingsApi.ts
│   │   ├── services/         # Бизнес-логика на клиенте
│   │   │   └── bookingService.ts
│   │   ├── routes/           # Роутинг (React Router)
│   │   │   └── AppRoutes.tsx
│   │   ├── types/            # Типы TypeScript
│   │   │   └── parking.ts
│   │   ├── components/       # UI-компоненты
│   │   ├── pages/            # Страницы
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── package.json              # Корневые скрипты
└── README.md
```

## Модули

### Бэкенд (`backend/`)

| Модуль | Назначение |
|--------|------------|
| **Роутинг** | `src/routes/` — маршруты API: `parkingsRouter.js`, `bookingsRouter.js` |
| **Работа с БД** | `src/db/store.js` — чтение/запись JSON (файл `data/db.json`), при первом запуске копируется из `initialData.json` |
| **Бизнес-логика** | `src/services/` — `parkingService.js` (список/парковка по id), `bookingService.js` (расчёт суммы, создание брони, валидация) |

API: `GET /api/parkings`, `GET /api/parkings/:id`, `GET /api/bookings`, `POST /api/bookings`.

### Фронтенд (`frontend/`)

| Модуль | Назначение |
|--------|------------|
| **Роутинг** | `src/routes/AppRoutes.tsx` — конфигурация страниц React Router |
| **Работа с API** | `src/api/` — `client.ts` (базовый fetch), `parkingsApi.ts`, `bookingsApi.ts` |
| **Бизнес-логика** | `src/services/bookingService.ts` — расчёт времени и стоимости брони на клиенте |
| **Типы** | `src/types/parking.ts` — `ParkingLot`, `Booking`, `CreateBookingPayload` |

## CI/CD и релизы

### 1. Сборка образа с уникальным тегом

Workflow [.github/workflows/build-image.yml](.github/workflows/build-image.yml) запускается на каждый push в `main` и публикует Docker-образ в `GHCR` с тегами:

- `${GITHUB_SHA}` — фиксированная версия образа
- `latest` — удобный alias для последней сборки

Сборка выполняется один раз, после чего один и тот же образ можно использовать в любом окружении.

### 2. Разделение build и runtime-конфигурации

В финальном образе больше нет `ENV` с runtime-настройками. Конфигурация передаётся только во время запуска контейнера:

- `DATABASE_URL`
- `REDIS_URL`
- `SESSION_SECRET`
- `RELEASE_VERSION`
- `RELEASE_ENVIRONMENT`
- другие переменные из `docker-compose`/GitHub Environments

Это позволяет использовать один и тот же image tag для `staging` и `production` без пересборки.

### 3. Деплой фиксированного релиза

Workflow [.github/workflows/deploy-release.yml](.github/workflows/deploy-release.yml):

- не собирает образ
- берёт уже существующий tag (`workflow_dispatch`) или `${GITHUB_SHA}` для веток `staging`/`production`
- формирует release как пару `APP_IMAGE + env config`
- запускает удалённый `docker compose pull && docker compose up -d`

В логах приложения и в ответе `GET /api/meta` доступны:

- `releaseVersion`
- `environment`
- `instanceId`

Так релиз однозначно идентифицируется без пересборки.

Для GitHub Environments `staging` и `production` нужно задать:

- Secrets: `DEPLOY_HOST`, `DEPLOY_USERNAME`, `DEPLOY_KEY`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `SESSION_SECRET`
- Variables: `APP_PORT`, `CORS_ORIGIN`, `DEPLOY_PATH`, `MIN_BOOKING_HOURS`, `LOG_LEVEL`, `SESSION_COOKIE_SECURE`

## Горизонтальное масштабирование

Для локальной проверки используется `docker-compose.yml`:

- `db` — PostgreSQL
- `redis` — централизованное хранилище сессий
- `app-1`, `app-2`, `app-3` — три экземпляра одного и того же приложения
- `gateway` — Nginx, распределяющий запросы между экземплярами

Запуск:

```bash
docker compose up --build
```

Проверка распределения запросов:

```bash
npm run load:test -- http://localhost:8080 90 18
```

Скрипт [scripts/load-test.mjs](scripts/load-test.mjs) делает серию запросов к `GET /api/meta` и показывает, сколько запросов обработал каждый `instanceId`.

## Сессии без sticky sessions

Сессии хранятся в Redis через `express-session + connect-redis`.

- cookie содержит только идентификатор сессии
- данные сессии лежат централизованно в Redis
- бронирования теперь привязываются к `sessionId`
- страница "Мои бронирования" показывает данные текущей пользовательской сессии даже если запросы попадают на разные экземпляры приложения

Если Redis не задан в локальной разработке, backend временно использует `MemoryStore`, но для масштабируемого окружения нужно задавать `REDIS_URL`.
