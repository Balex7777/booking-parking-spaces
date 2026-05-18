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

## API и наблюдаемость

### 1. Доступ к данным только через API

Внешний доступ к данным инкапсулирован за HTTP API:

- роуты в `backend/src/routes/` принимают и валидируют запросы;
- бизнес-логика находится в `backend/src/services/`;
- детали хранения скрыты за `backend/src/db/store.js` и адаптерами `pgStore.js` / `sqliteStore.js`.

Это означает, что клиент работает только через публичные методы приложения (`/api/auth`, `/api/parkings`, `/api/bookings`) и не имеет прямого доступа к PostgreSQL или SQLite.

### 2. Структурные JSON-логи

Backend использует собственный JSON-логгер из [backend/src/logger.js](/Users/morevaleksey/Documents/ПиРКСП/ikbo-12-23-morev/backend/src/logger.js:1). Каждая запись содержит:

- `timestamp`
- `level`
- `service`
- `event`
- полезные поля события, например `requestId`, `userId`, `statusCode`, `durationMs`

Пример записи:

```json
{"timestamp":"2026-05-18T20:15:31.456Z","level":"info","service":"parking-backend","event":"http.request.completed","requestId":"3d5e9f53-5e6f-43a5-a8bb-8f5d9d70d744","method":"POST","path":"/api/bookings","statusCode":201,"durationMs":24.31,"userId":"u1747599280000"}
```

### 3. Логи только в stdout/stderr

- обычные события пишутся в `stdout`;
- ошибки пишутся в `stderr`;
- файловых логов в проекте нет.

Это делает контейнер совместимым с типичным Docker logging flow без дополнительной настройки.

### 4. Сквозной `X-Request-ID`

Для каждого входящего HTTP-запроса backend:

- принимает входящий `X-Request-ID`, если он уже был передан извне;
- либо генерирует новый UUID;
- возвращает его в ответном заголовке `X-Request-ID`;
- добавляет этот `requestId` во все связанные логи по запросу.

Так можно проследить путь одного запроса через access-log и бизнес-события.

### 5. Просмотр логов в реальном времени

Локально через Docker Compose:

```bash
docker compose up --build
docker compose logs -f app-1 app-2 app-3 gateway
```

Для release-compose на сервере:

```bash
cd /opt/parking-app
docker-compose --env-file .env.release -f docker-compose.release.yml logs -f app-1 app-2 app-3 gateway
```

Для проверки request tracing можно сделать несколько запросов:

```bash
curl -H "X-Request-ID: demo-req-1" http://localhost:8080/api/meta
curl http://localhost:8080/api/parkings
```

После этого в потоке логов будут видны JSON-события с соответствующими `requestId`.
