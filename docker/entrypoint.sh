#!/bin/sh
set -e
cd /var/www/html

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
