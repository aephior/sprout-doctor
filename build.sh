#!/bin/sh
# Сборка: TypeScript → dist/ (bun). Внешних зависимостей во время игры нет (кроме шрифта Google Fonts).
set -e
cd "$(dirname "$0")"
tsc -p .
rm -rf dist && mkdir -p dist/vendor
bun build src/main.ts --outfile dist/game.js --target browser --minify-syntax --minify-whitespace >/dev/null
bun build src/ai/leaf.worker.ts --outfile dist/leaf-worker.js --target browser --minify-syntax --minify-whitespace >/dev/null
cp index.html dist/
cp vendor/phaser/dist/phaser.min.js dist/vendor/
cp -r public/* dist/
python3 -c "import base64;open('dist/leaf_weights.b64.txt','w').write(base64.b64encode(open('dist/leaf_weights.bin','rb').read()).decode())" && rm dist/leaf_weights.bin
# Вариант для публикации (страница без <html>/<head>/<body> — их добавляет хостинг)
python3 - <<'PY'
import re
s = open('dist/index.html').read()
head = re.search(r'<head>(.*)</head>', s, re.S).group(1)
body = re.search(r'<body>(.*)</body>', s, re.S).group(1)
head = re.sub(r'\s*<meta charset[^>]*>|\s*<meta name="viewport"[^>]*>', '', head)
# скрипты встраиваются в страницу: опубликованная страница не загружает сторонние файлы-скрипты
for f in ['vendor/phaser.min.js', 'game.js']:
    code = open('dist/' + f).read().replace('</script', '<\\/script')
    body = body.replace(f'<script src="{f}"></script>', '<script>' + code + '</script>')
open('dist/artifact.html', 'w').write(head.strip() + '\n' + body.strip() + '\n')
PY
echo "built: $(du -sh dist | cut -f1), $(find dist -type f | wc -l) files"
