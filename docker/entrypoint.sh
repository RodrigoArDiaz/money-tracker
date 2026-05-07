#!/bin/sh
set -e

# Imagen CLI (Dockerfile raíz): /var/www/html · imagen FPM (docker/php/Dockerfile): /var/www
if [ -d /var/www/html ]; then
    APP_ROOT=/var/www/html
elif [ -d /var/www ]; then
    APP_ROOT=/var/www
else
    echo "entrypoint: no se encontró el directorio de la app (/var/www/html ni /var/www)" >&2
    exit 1
fi

cd "$APP_ROOT"

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -d vendor ]; then
  composer install --no-interaction --prefer-dist
fi

if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
  php artisan key:generate --force --no-interaction
fi

if [ ! -d node_modules ]; then
  npm install --ignore-scripts
fi

exec "$@"
