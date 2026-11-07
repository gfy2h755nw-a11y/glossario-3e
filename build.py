# Costruisce public/index.html da src/ (stile, modello del cartellone, app).
import os
B = os.path.dirname(os.path.abspath(__file__))
r = lambda p: open(os.path.join(B, p), encoding='utf-8').read()
html = '''<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Glossario odontotecnico · 3E e 3F</title>
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#2E7D32">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Glossario">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,600;0,700;0,800;0,900;1,600&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>''' + r('src/stile.css') + '''</style>
</head>
<body>
<div id="app"></div>
<div id="toast" role="status" aria-live="polite"></div>
<script>
''' + r('src/qrcode.js') + '''
</script>
<script>
''' + r('src/poster.js') + '''
</script>
<script>
''' + r('src/app.js') + '''
</script>
</body>
</html>
'''
open(os.path.join(B, 'public/index.html'), 'w', encoding='utf-8').write(html)
print('public/index.html', len(html))
