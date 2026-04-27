<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" translate="no">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Evita parpadeo: misma clave que THEME_STORAGE_KEY en resources/js/components/theme-provider.tsx --}}
        <script>
            (function () {
                var key = 'money-tracker-theme';
                var stored = localStorage.getItem(key);
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme =
                    stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
                var resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
                document.documentElement.classList.toggle('dark', resolved === 'dark');
                document.documentElement.style.colorScheme = resolved === 'dark' ? 'dark' : 'light';
            })();
        </script>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
