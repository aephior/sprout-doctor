"""Автономная версия: один HTML-файл (игра, нейросеть, MediaPipe, карточки) — открывается двойным щелчком.
Все ресурсы встраиваются в base64 и при запуске превращаются в blob-адреса (window.__SD_ASSETS)."""
import base64, json, os, re

D = 'dist'
MIME = {'.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain', '.jpg': 'image/jpeg',
        '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.tflite': 'application/octet-stream',
        '.binarypb': 'application/octet-stream', '.png': 'image/png'}
assets = {}
for root, _, files in os.walk(D):
    for f in files:
        path = os.path.join(root, f); rel = os.path.relpath(path, D).replace(os.sep, '/')
        if rel in ('index.html', 'artifact.html', 'game.js') or rel.startswith('vendor/') or rel.endswith('.html'): continue
        ext = os.path.splitext(f)[1]
        if ext not in MIME: continue
        assets[rel] = (MIME[ext], base64.b64encode(open(path, 'rb').read()).decode())

loader = ['<script>window.__SD_STANDALONE=true;(function(){var A=' + json.dumps({k: v[0] for k, v in assets.items()}) +
          ';var M=window.__SD_ASSETS={};for(var k in A){var el=document.getElementById("a:"+k);var b=atob(el.textContent);'
          'var u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);'
          'M[k]=URL.createObjectURL(new Blob([u],{type:A[k]}));el.remove();}})();</script>']
blobs = ''.join(f'<script type="application/octet-stream" id="a:{k}">{v[1]}</script>' for k, v in assets.items())

html = open(os.path.join(D, 'index.html')).read()
for f in ['vendor/phaser.min.js', 'game.js']:
    code = open(os.path.join(D, f)).read().replace('</script', '<\\/script')
    html = html.replace(f'<script src="{f}"></script>', '<script>' + code + '</script>')
html = html.replace('<div id="game"></div>', '<div id="game"></div>' + blobs + loader[0])
os.makedirs('release', exist_ok=True)
out = 'release/SproutDoctor.html'
open(out, 'w').write(html)
print(f'{out}: {os.path.getsize(out) / 1e6:.1f} MB, {len(assets)} ресурсов')
