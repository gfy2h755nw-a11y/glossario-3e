# Costruisce public/index.html da src/ (stile, modello del cartellone, app).
import os
B = os.path.dirname(os.path.abspath(__file__))
r = lambda p: open(os.path.join(B, p), encoding='utf-8').read()
html = '''<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Glossario 3E · Bilingual dental glossary</title>
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
