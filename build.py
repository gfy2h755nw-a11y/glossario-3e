# Costruisce public/index.html da src/ (stile, modello del cartellone, app).
import os
B = os.path.dirname(os.path.abspath(__file__))
r = lambda p: open(os.path.join(B, p), encoding='utf-8').read()
# caratteri ospitati dall'app (public/fonts): niente dipendenza da Google Fonts, misure dei cartelloni sempre uguali
FONTI = [('Archivo', 400, 'normal', 'archivo-latin-400-normal'), ('Archivo', 600, 'normal', 'archivo-latin-600-normal'), ('Archivo', 600, 'italic', 'archivo-latin-600-italic'),
         ('Archivo', 700, 'normal', 'archivo-latin-700-normal'), ('Archivo', 800, 'normal', 'archivo-latin-800-normal'), ('Archivo', 900, 'normal', 'archivo-latin-900-normal'),
         ('Cormorant Garamond', 500, 'italic', 'cormorant-garamond-latin-500-italic'), ('Cormorant Garamond', 600, 'italic', 'cormorant-garamond-latin-600-italic'),
         ('Atkinson Hyperlegible', 400, 'normal', 'atkinson-hyperlegible-latin-400-normal'), ('Atkinson Hyperlegible', 700, 'normal', 'atkinson-hyperlegible-latin-700-normal'),
         ('Atkinson Hyperlegible', 400, 'italic', 'atkinson-hyperlegible-latin-400-italic'), ('Atkinson Hyperlegible', 700, 'italic', 'atkinson-hyperlegible-latin-700-italic')]
for f in FONTI: assert os.path.exists(os.path.join(B, 'public/fonts', f[3] + '.woff2')), f
FONT_CSS = ''.join("@font-face{font-family:'%s';font-style:%s;font-weight:%d;font-display:swap;src:url(/fonts/%s.woff2) format('woff2')}" % (f[0], f[2], f[1], f[3]) for f in FONTI)
html = '''<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Glossario odontotecnico</title>
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#2E7D32">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Glossario">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<style>''' + FONT_CSS + '''</style>
<style>''' + r('src/stile.css') + r('src/docente.css') + '''</style>
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
''' + r('src/visore.js') + '''
</script>
<script>
''' + r('src/gestione.js') + '''
''' + r('src/layout.js') + '''
''' + r('src/orale.js') + '''
''' + r('src/wizard.js') + '''
''' + r('src/banca.js') + '''
</script>
</body>
</html>
'''
open(os.path.join(B, 'public/index.html'), 'w', encoding='utf-8').write(html)
print('public/index.html', len(html))

# pagina pubblica di consultazione (/glossario): logo dal modello del cartellone
con = r('src/consulta.html').replace('/*POSTER*/', r('src/poster.js')).replace('/*FONTI*/', FONT_CSS)
open(os.path.join(B, 'public/glossario.html'), 'w', encoding='utf-8').write(con)
print('public/glossario.html', len(con))
# pagina del quiz (/quiz): separata dalla pagina pubblica, si entra con il codice personale o con il QR della scheda
qz = r('src/quiz.html').replace('/*POSTER*/', r('src/poster.js')).replace('/*FONTI*/', FONT_CSS)
open(os.path.join(B, 'public/quiz.html'), 'w', encoding='utf-8').write(qz)
print('public/quiz.html', len(qz))
