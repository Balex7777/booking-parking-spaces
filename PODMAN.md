# Запуск приложения в контейнерах (Podman)

Инструкция для macOS с **Podman Desktop** (без Docker Desktop).
Приложение — stateless: вся БД хранится в **PostgreSQL**, который работает в отдельном контейнере.

---

## Что нужно заранее

1. **Podman Desktop** установлен, машина в статусе *Running*.
2. Команда `podman` доступна в терминале (см. раздел ниже).
3. `podman-compose` установлен:

```bash
pip3 install podman-compose
# или
brew install podman-compose
```

Проверка:

```bash
podman --version
podman-compose --version
```

## Если `command not found: podman`

Podman Desktop часто ставит CLI в `/opt/podman/bin`. Добавьте в `~/.zshrc`:

```bash
export PATH="/opt/podman/bin:$PATH"
```

Затем `source ~/.zshrc`.

---

## Быстрый старт (podman-compose)

```bash
cd /путь/к/ikbo-12-23-morev

# 1. Миграции (одноразовый контейнер, тот же образ)
podman-compose --profile tools run --rm migrate

# 2. Поднять PostgreSQL, Redis, приложение и gateway
podman-compose up --build -d

# Браузер: http://localhost:8080
```

## Административные команды (one-off)

Один образ, разные команды (без входа в running-контейнер):

```bash
# Миграции
podman-compose --profile tools run --rm migrate

# Администратор
podman run --rm \
  -e DATABASE_URL=postgres://parking:parking_secret@db:5432/parking \
  --network=ikbo-12-23-morev_default \
  parking-app:local \
  create-admin --email=admin@example.com --password=secret

# Очистка сессий Redis
podman run --rm \
  -e REDIS_URL=redis://redis:6379 \
  --network=ikbo-12-23-morev_default \
  parking-app:local \
  clear-cache
```

Остановка:

```bash
podman-compose down
```

Остановка с удалением данных PostgreSQL:

```bash
podman-compose down -v
```

---

## Переменные окружения

Все настройки в `docker-compose.yml`, секция `environment` сервиса `app`.
Один и тот же образ — разное поведение:

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `PORT` | `8080` | Порт сервера внутри контейнера |
| `HOST` | `0.0.0.0` | Адрес привязки |
| `NODE_ENV` | `production` | Среда |
| `DATABASE_URL` | *(обязательна)* | Строка подключения к PostgreSQL |
| `CORS_ORIGIN` | `*` | Разрешённый CORS-origin |
| `MIN_BOOKING_HOURS` | `1` | Мин. длительность бронирования |
| `LOG_LEVEL` | `info` | Уровень логирования |

---

## Запуск без compose (один контейнер + внешний PG)

```bash
# Сборка
podman build -t ikbo-parking:latest .

# Запуск (указать DATABASE_URL на свой PostgreSQL)
podman run --rm -p 8080:8080 \
  -e DATABASE_URL=postgres://user:pass@host:5432/dbname \
  ikbo-parking:latest
```

---

## Локальная разработка (SQLite, без контейнеров)

Без `DATABASE_URL` приложение автоматически использует SQLite (файл `backend/data/parking.db`):

```bash
cd backend
npm install
npm run dev
# [development] [sqlite] Сервер: http://0.0.0.0:3001
```

---

## Масштабирование (шаг 4 задания)

Запуск нескольких экземпляров приложения:

```bash
podman-compose up --build -d --scale app=3
```

Все 3 реплики подключаются к **одному** PostgreSQL. Данные не дублируются и не теряются.

Проброс портов при scale: в `docker-compose.yml` замените фиксированный порт на диапазон:

```yaml
ports:
  - "8080-8082:8080"
```

Или уберите `ports` и добавьте реверс-прокси (nginx).

---

## Симуляция сбоя (шаг 4 задания)

```bash
# Посмотреть контейнеры
podman ps

# Остановить один из app-контейнеров
podman stop <container_id>

# Убедиться, что данные на месте (через оставшиеся реплики)
curl http://localhost:8080/api/parkings
curl http://localhost:8080/api/bookings
```

---

## Проверка stateless (шаг 5 задания)

```bash
# 1. Создать бронь
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"parkingId":"1","spotNumber":"B-5","date":"2026-05-01","timeFrom":"10:00","timeTo":"14:00"}'

# 2. Остановить ВСЕ контейнеры с приложением
podman-compose stop app

# 3. Запустить заново
podman-compose start app

# 4. Данные на месте
curl http://localhost:8080/api/bookings
```

PostgreSQL (сервис `db`) с named volume `pg_data` сохраняет данные между перезапусками.

---

## Graceful shutdown (SIGTERM)

При остановке контейнера приложение:

1. возвращает **503** на новые запросы;
2. завершает уже начатые запросы (до `SHUTDOWN_GRACE_MS`, по умолчанию 15 с);
3. закрывает Redis и PostgreSQL;
4. выходит из процесса.

В `docker-compose.yml` для `app-*` задано `stop_grace_period: 20s`.

### Тест с Podman

```bash
podman-compose up --build -d
CID=$(podman ps --filter name=app-1 -q | head -1)

# Сигнал завершения (аналог docker kill --signal=SIGTERM)
podman kill --signal=SIGTERM "$CID" &

# Новые запросы во время shutdown
curl -i http://localhost:8080/api/parkings
# Ожидается: HTTP/1.1 503
```

Проверка готовности (быстрый старт, healthcheck):

```bash
curl http://localhost:8080/api/ready
# {"status":"ready","ready":true}
```

### Утилизируемость под нагрузкой

```bash
npm run load:test -- http://localhost:8080 60 12 &
CID=$(podman ps --filter name=app-2 -q | head -1)
podman kill --signal=SIGTERM "$CID"
# gateway продолжит отдавать ответы через app-1 и app-3
```

---

## Типичные проблемы

| Симптом | Что сделать |
|---|---|
| `command not found: podman` | PATH: `/opt/podman/bin` (см. выше) |
| `command not found: podman-compose` | `pip3 install podman-compose` или `brew install podman-compose` |
| `connection refused` к БД | Дождитесь healthcheck; `podman-compose logs db` |
| `port is already allocated` | Смените `APP_PORT`: `APP_PORT=9090 podman-compose up -d` |
| Данные пропали после `down -v` | Флаг `-v` удаляет тома; без `-v` данные сохраняются |
