#!/bin/sh
set -e

cd /var/www

# Con volumen nombrado vacío, /var/www/storage queda vacío: crear árbol mínimo para Laravel.
if [ ! -f storage/.docker-vol-ready ]; then
    mkdir -p \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/framework/testing \
        storage/logs \
        storage/app/public \
        storage/app/private
    touch storage/.docker-vol-ready
fi

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Mantener el entrypoint oficial de la imagen (extensiones / señales).
exec docker-php-entrypoint "$@"
