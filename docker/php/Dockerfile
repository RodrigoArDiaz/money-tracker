# Imagen FPM para desarrollo / compose local con volumen montado. Producción sin volumen: docker/prod/Dockerfile.
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    git \
    unzip \
    zip \
    curl \
    nodejs \
    npm \
    libpq-dev \
    oniguruma-dev

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

# Evita caché de paquetes/local que referencie proveedores solo en require-dev (p. ej. Telescope).
RUN rm -f bootstrap/cache/*.php 2>/dev/null || true

RUN composer install --no-dev --optimize-autoloader

RUN npm install

RUN npm run build

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]