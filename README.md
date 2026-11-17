# TPU Market — Кампусный маркетплейс ТПУ

Единая полнофункциональная система (монорепозиторий), объединяющая серверную часть на **PHP / Laravel** и клиентскую часть на **React 18 / TypeScript / Vite**.

Проект разработан в строгом соответствии с Техническим заданием (ТЗ) по интеграции двух изолированных частей в единую архитектуру с поддержкой REST API, решением проблем CORS, SPA-маршрутизацией и загрузкой медиафайлов.

---

## Архитектура проекта

```plaintext
TPU_Market/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── block_with_tovar.php       # Выдача списка товаров для главной витрины
│   │       ├── category_tovar.php         # Фильтрация по 15 категориям ТПУ
│   │       ├── create_advertisements.php  # Прием multipart/form-data и сохранение фото в storage/
│   │       ├── manage_advertisements.php  # Обновление статусов, редактирование и удаление
│   │       ├── mynotices.php              # Мои объявления пользователя
│   │       ├── proverka_registr.php       # Валидация, регистрация, вход и токены Sanctum
│   │       ├── search.php                 # Поиск по ключевым словам и параметрам
│   │       └── Controller.php             # Базовый контроллер
│   └── Models/
│       ├── User.php                       # Модель пользователя (PK user_id, Sanctum tokens)
│       ├── Category.php                   # Модель категорий (PK category_id)
│       ├── advertisements_model.php       # Модель объявлений (PK advertisements_id)
│       └── advertisements_images_model.php# Модель изображений объявлений (PK image_id)
├── config/
│   └── cors.php                           # Настройка CORS для локальных адресов Vite и заголовков Auth
├── database/
│   ├── migrations/                        # Миграции схемы БД на основе SQL.docx
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 2026_10_30_082856_create_personal_access_tokens_table.php
│   │   └── 2026_10_30_090000_create_tpu_market_tables.php
│   ├── seeders/
│   │   └── DatabaseSeeder.php             # Сиды 15 категорий, тестовых пользователей и объявлений
│   ├── dump.sql                           # Полный SQL-дамп структуры и данных
│   └── database.sqlite                    # Файл базы данных SQLite
├── routes/
│   ├── api.php                            # REST API маршруты с префиксом /api/
│   └── web.php                            # Catch-all fallback маршрут отдачи React SPA (index.html)
├── frontend/                              # Исходный код React SPA
│   ├── src/                               # Компоненты, хуки, контексты, стили
│   ├── index.html                         # Главная HTML-страница
│   ├── package.json                       # Зависимости фронтенда
│   ├── tsconfig.json                      # Конфигурация TypeScript
│   └── vite.config.ts                     # Dev-proxy на 127.0.0.1:8000 и сборка в ../public
├── public/                                # Публичная директория веб-сервера
│   ├── assets/                            # Скомпилированные JS/CSS бандлы Vite
│   ├── storage/                           # Символическая ссылка на storage/app/public
│   ├── index.html                         # Точка входа SPA
│   └── index.php                          # Точка входа Laravel
├── test_endpoints.py                      # Автоматический тестовый скрипт проверки всех сценариев ТЗ
├── dump.sql                               # Дамп базы данных в корне
└── .env                                   # Настройки окружения
```

---

## Системные требования

- **PHP**: 8.2 или новее (с расширениями `pdo`, `pdo_sqlite` или `pdo_pgsql` / `pdo_mysql`, `fileinfo`, `mbstring`, `openssl`)
- **Composer**: 2.x
- **Node.js**: 18.x или 20.x+
- **npm**: 9.x или новее

---

## Пошаговая инструкция по развертыванию

### 1. Установка серверных зависимостей

В корневой директории проекта выполните:

```bash
composer install
```

### 2. Настройка файла окружения (`.env`)

Скопируйте пример конфигурации и сгенерируйте ключ приложения:

```bash
cp .env.example .env
php artisan key:generate
```

*По умолчанию в качестве базы данных настроен SQLite (`DB_CONNECTION=sqlite`), не требующий сторонних серверов. При необходимости подключения к PostgreSQL достаточно указать `DB_CONNECTION=pgsql` и параметры в `.env`.*

### 3. Подключение хранилища медиафайлов

Создайте символическую ссылку из публичной папки `public/storage` в постоянное хранилище `storage/app/public`:

```bash
php artisan storage:link
```

### 4. Применение миграций и сидеров

Выполните миграции и заполните базу данных начальными данными (15 категорий, тестовые пользователи и объявления):

```bash
php artisan migrate --seed
```

*(Альтернативно можно импортировать готовый дамп из файла `dump.sql`)*

### 5. Установка зависимостей и сборка фронтенда

Перейдите в каталог `frontend/` и выполните сборку:

```bash
cd frontend
npm install
npm run build
cd ..
```

*Команда `npm run build` скомпилирует приложение непосредственно в каталог `public/`, не затрагивая системные файлы сервера.*

---

## Запуск проекта

### Вариант 1. Продакшн-режим (Рекомендуемый)

Единый сервер Laravel обслуживает как REST API, так и скомпилированный React SPA:

```bash
php artisan serve --port=8000
```

Откройте в браузере: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

Любые переходы по страницам (`/profile`, `/listing/1`, `/favorites`, `/chats`) и обновление страниц по клавише **F5** работают корректно благодаря настроенному fallback-маршруту в `routes/web.php`.

### Вариант 2. Режим разработки (HMR + Dev Proxy)

1. Запустите бэкенд-сервер:
   ```bash
   php artisan serve --port=8000
   ```
2. В отдельном окне терминала запустите dev-сервер Vite:
   ```bash
   cd frontend
   npm run dev
   ```
   Откройте dev-сервер по адресу **[http://localhost:5173](http://localhost:5173)**. Запросы к `/api/*` и `/storage/*` автоматически проксируются на бэкенд `http://127.0.0.1:8000`.

---

## Таблица REST API маршрутов

| Метод | Маршрут | Контроллер / Метод | Описание |
|---|---|---|---|
| `GET` | `/api/products` | `block_with_tovar@index` | Список товаров витрины с фильтрацией и пагинацией |
| `GET` | `/api/products/{id}` | `block_with_tovar@show` | Детальная информация по конкретному товару |
| `GET` | `/api/categories` | `category_tovar@getCategories` | Список всех 15 категорий кампуса ТПУ |
| `GET` | `/api/{slug}` | `category_tovar@{slug}` | Фильтрация по категории (`posuda`, `technika`, `sport` и т.д.) |
| `GET` | `/api/search` | `search@search` | Поиск товаров по ключевому слову и параметрам |
| `POST` | `/api/ads` | `create_advertisements@store` | Создание объявления с загрузкой фото в `storage/` (`multipart/form-data`) |
| `GET` | `/api/ads/{id}/edit` | `manage_advertisements@edit` | Данные объявления для редактирования |
| `PUT/POST` | `/api/ads/{id}` | `manage_advertisements@update` | Обновление объявления |
| `PATCH` | `/api/ads/{id}/status` | `manage_advertisements@updateStatus` | Быстрая смена статуса (active, reserved, sold, draft) |
| `DELETE` | `/api/ads/{id}` | `manage_advertisements@destroy` | Удаление объявления и связанных фото |
| `GET` | `/api/my_notices` | `mynotices@myNotices` | Объявления текущего авторизованного пользователя |
| `GET` | `/api/my-notices` | `mynotices@myNotices` | Алиас роута «Мои объявления» |
| `POST` | `/api/register` | `proverka_registr@register` | Валидация, создание пользователя в БД и выдача токена |
| `POST` | `/api/login` | `proverka_registr@store` | Авторизация пользователя (проверка пароля по хешу) |
| `GET` | `/api/me` | `proverka_registr@me` | Текущий авторизованный пользователь |
| `POST` | `/api/logout` | `proverka_registr@logout` | Выход из системы и отзыв токена |

---

## Страницы интерфейса (SPA)

* **`/`** — Главная витрина товаров маркетплейса с фильтрами по категориям, ценам и общежитиям.
* **`/my_notices`** (или `/my-notices`) — Специализированный раздел **«Мои объявления»**, загружающий и отображающий товары текущего пользователя через контроллер `mynotices.php`, со сменой статусов (активно, черновик, продано), редактированием и удалением.
* **`/login`** — Страница авторизации пользователя (проверка логина и пароля через `proverka_registr.php`), кнопки быстрого входа под демо-пользователями (`rdm8`, `Алексей Соколов`).
* **`/register`** (или `/registr`) — Страница регистрации пользователя с валидацией и сохранением в таблицу `users` БД.
* **`/profile`** — Личный кабинет с вкладками управления профилем и объявлениями.
* **`/profile/new`** — Форма подачи нового объявления с загрузкой фотографий через `create_advertisements.php`.
* **`/listing/{id}`** — Карточка товара с характеристиками, галереей и отзывами.

---

## Тестирование и верификация

В репозиторий включен скрипт автоматического тестирования всех сценариев ТЗ:

```bash
python test_endpoints.py
```

Скрипт проверяет:
1. Корректность отдачи SPA и отсутствие ошибок 404 при F5 по всем роутам.
2. Работу каталога `block_with_tovar.php` и детализации товара.
3. Фильтрацию категорий `category_tovar.php`.
4. Поиск товаров `search.php`.
5. Регистрацию и вход пользователей `proverka_registr.php`.
6. Создание объявления через `multipart/form-data` с физической загрузкой фото в `storage/`.
7. Управление объявлениями (смена статуса, удаление) в `manage_advertisements.php`.
