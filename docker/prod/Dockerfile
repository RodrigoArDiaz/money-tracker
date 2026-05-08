# Imagen única multi-stage: target `app` (PHP-FPM) y `nginx` (solo public/ + proxy a FPM).
# Cada despliegue de código: rebuild de ambas imágenes (`docker compose -f docker-compose.prod.yml build`).

FROM php:8.4-fpm-alpine AS app

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

# Por defecto php-fpm limpia el entorno de los workers: Laravel no ve APP_KEY ni DB_* inyectadas por Docker (env_file).
RUN printf '\nclear_env = no\n' >> /usr/local/etc/php-fpm.d/www.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN rm -f bootstrap/cache/*.php 2>/dev/null || true

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN npm ci

RUN npm run build

RUN chown -R www-data:www-data storage bootstrap/cache

COPY docker/prod/fpm-entrypoint.sh /usr/local/bin/fpm-entrypoint.sh
RUN chmod +x /usr/local/bin/fpm-entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/fpm-entrypoint.sh"]
CMD ["php-fpm"]

FROM nginx:alpine AS nginx

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/public /var/www/public
