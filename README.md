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
