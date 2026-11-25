# ЭКСПЕДИЦИЯ №2 — Модульный GDD-хаб (GitHub Pages + Supabase)

Статический модульный сайт без сборщика (ES Modules + JSON).

## Запуск и деплой
1. Содержимое папки `expedition2-gdd-pages` залей в корень репозитория GitHub.
2. Включи **Settings → Pages → Deploy from a branch (`main` / `root`)**.
3. Локально на ПК запускай через `python -m http.server 8080` или VS Code Live Server (через `file://` браузер блокирует `fetch()` для JSON).

## Подключение Supabase
1. Выполни `supabase/schema.sql` в **Supabase → SQL Editor**.
2. Вставь `url` и `anonKey` в `js/config.js` или введи их прямо на сайте через кнопку **БД: LocalStorage**.
