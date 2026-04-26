<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verificación</title>
</head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1b1b18; max-width: 32rem; margin: 0 auto; padding: 1.5rem;">
    <p>Hola {{ $userFirstName }},</p>
    <p>Tu código de verificación para <strong>{{ config('app.name') }}</strong> es:</p>
    <p style="font-size: 1.75rem; letter-spacing: 0.25em; font-weight: 600; margin: 1.25rem 0;">{{ $plainCode }}</p>
    <p style="font-size: 0.875rem; color: #555;">Caduca en {{ $expiresInMinutes }} minutos. Si no creaste una cuenta, ignorá este mensaje.</p>
</body>
</html>
