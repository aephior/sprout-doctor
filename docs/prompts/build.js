// Сборка страницы промптов (HTML для публикации) и копии prompts.md из data.js.
const fs = require('fs');
const path = require('path');
const D = require('./data');
const OUT_HTML = process.argv[2] || path.join(__dirname, 'prompts.html');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PR = { 1: ['high', 'Важно'], 2: ['mid', 'Желательно'], 3: ['opt', 'По желанию'] };
const total = D.sections.reduce((n, s) => n + s.items.length, 0);

const card = (it) => `
      <article class="item" id="${it.id}" data-pr="${it.pr}">
        <header class="item-head">
          <label class="done"><input type="checkbox" id="chk-${it.id}" data-id="${it.id}"><span class="item-title">${esc(it.title)}</span></label>
          <span class="pill pr-${PR[it.pr][0]}">${PR[it.pr][1]}</span>
        </header>
        <div class="meta"><code class="chip">${esc(it.file)}</code><span class="chip">${esc(it.size)}</span></div>
        <div class="prompt"><pre id="p-${it.id}">${esc(it.prompt)}</pre><button class="copy" type="button" data-target="p-${it.id}">Копировать</button></div>
        ${it.note ? `<p class="note">${esc(it.note)}</p>` : ''}
      </article>`;

const html = `<title>Sprout Doctor Art Prompts</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Golos+Text:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap">
<style>
/* Макет: одна колонка карточек «полевого дневника», наверху — общие правила и навигация по разделам */
:root {
  --bg: #f4efe3; --surface: #fffaf0; --ink: #1e1b2e; --ink2: #5a5470; --line: #e0d6bf;
  --accent: #127a74; --accent-ink: #ffffff; --magenta: #b0245f; --code-bg: #f1e8d4;
  --high: #b0245f; --mid: #a8531a; --opt: #6b6886;
  --display: "Pixelify Sans", "Courier New", monospace; --body: "Golos Text", system-ui, sans-serif; --mono: "JetBrains Mono", ui-monospace, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #1c1a33; --surface: #26244a; --ink: #f2ecdc; --ink2: #b9b4d4; --line: #3a3766; --accent: #3fd0c9; --accent-ink: #12102a;
  --magenta: #ff6fae; --code-bg: #1a1830; --high: #ff6fae; --mid: #f2a95c; --opt: #9a97bd; color-scheme: dark; } }
:root[data-theme="dark"] {
  --bg: #1c1a33; --surface: #26244a; --ink: #f2ecdc; --ink2: #b9b4d4; --line: #3a3766; --accent: #3fd0c9; --accent-ink: #12102a;
  --magenta: #ff6fae; --code-bg: #1a1830; --high: #ff6fae; --mid: #f2a95c; --opt: #9a97bd; color-scheme: dark; }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--ink); font: 16px/1.55 var(--body); margin: 0; }
.wrap { max-width: 920px; margin: 0 auto; padding-block: 32px 64px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1, h2 { font-family: var(--display); font-weight: 700; text-wrap: balance; margin: 0; letter-spacing: 0.01em; }
h1 { font-size: clamp(30px, 6vw, 44px); line-height: 1.05; }
h1 span { color: var(--accent); }
h2 { font-size: 26px; margin-top: 48px; }
.lede { color: var(--ink2); max-width: 64ch; margin: 12px 0 0; }
.progress { display: flex; align-items: center; gap: 12px; margin-top: 20px; font-variant-numeric: tabular-nums; color: var(--ink2); }
.bar { flex: 1; max-width: 320px; height: 8px; background: var(--line); border-radius: 4px; overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--accent); width: 0; transition: width .3s; }
.steps { margin: 28px 0 0; padding: 20px 20px 20px 44px; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; }
.steps li { margin: 6px 0; max-width: 70ch; }
.steps b { color: var(--accent); font-weight: 600; }
.rules { display: grid; gap: 12px; margin-top: 16px; }
.rule { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; min-width: 0; }
.rule h3 { font: 600 14px var(--body); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink2); }
nav.toc { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; position: sticky; top: env(safe-area-inset-top, 0px); background: var(--bg); padding-block: 10px; z-index: 5; }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
nav.toc a { font: 500 14px var(--body); color: var(--ink); text-decoration: none; padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); }
nav.toc a:hover, nav.toc a:focus-visible { border-color: var(--accent); outline: none; }
nav.toc .filters { margin-left: auto; display: flex; gap: 8px; align-items: center; color: var(--ink2); font-size: 14px; }
.section-intro { color: var(--ink2); max-width: 70ch; margin: 8px 0 16px; }
.items { display: grid; gap: 14px; }
.item { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 16px; min-width: 0; }
.item.is-done { opacity: 0.55; }
.item-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.done { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; }
.done input { width: 18px; height: 18px; margin-top: 3px; accent-color: var(--accent); flex: none; }
.item-title { font-weight: 600; font-size: 17px; }
.pill { font: 600 12px var(--body); padding: 3px 9px; border-radius: 999px; border: 1px solid currentColor; white-space: nowrap; letter-spacing: 0.02em; }
.pr-high { color: var(--high); } .pr-mid { color: var(--mid); } .pr-opt { color: var(--opt); }
.meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 12px 28px; }
.chip { font: 13px var(--mono); color: var(--ink2); background: var(--code-bg); padding: 2px 8px; border-radius: 4px; overflow-wrap: anywhere; }
.prompt { position: relative; }
pre { margin: 0; font: 13px/1.55 var(--mono); background: var(--code-bg); border: 1px solid var(--line); border-radius: 4px; padding: 12px 12px 44px; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--ink); }
.copy { position: absolute; right: 8px; bottom: 8px; font: 600 13px var(--body); background: var(--accent); color: var(--accent-ink); border: 0; border-radius: 4px; padding: 7px 14px; cursor: pointer; }
.copy:focus-visible { outline: 2px solid var(--magenta); outline-offset: 2px; }
.copy.ok { background: var(--magenta); color: #fff; }
.note { margin: 10px 0 0 28px; color: var(--ink2); font-size: 14px; max-width: 70ch; }
select { font: 14px var(--body); background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 4px; padding: 4px 8px; }
.hidden-by-filter { display: none; }
footer { margin-top: 56px; color: var(--ink2); font-size: 14px; border-top: 1px solid var(--line); padding-top: 16px; }
@media (max-width: 560px) { nav.toc { position: static; } nav.toc .filters { margin-left: 0; width: 100%; } .meta, .note { margin-left: 0; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="wrap">
  <header>
    <h1>Sprout Doctor<br><span>промпты для генерации</span></h1>
    <p class="lede">Всё, что можно сгенерировать нейросетью, чтобы заменить нарисованный кодом пиксель-арт: персонажи, противники, ферма, растения, интерьеры, иконки и музыка. Промпты на английском — генераторы понимают его лучше. Игра уже работает без этих файлов: каждый готовый файл просто заменяет временную графику.</p>
    <div class="progress"><div class="bar"><i id="bar"></i></div><span id="count">Готово 0 из ${total}</span></div>
  </header>

  <ol class="steps">
    <li>Начните с пунктов <b>«Важно»</b>: Аой, Фуку, Огава, Хайкаби, дом, лавка и фоны сцен. Остальное — по желанию.</li>
    <li>Одна картинка — один предмет или одна поза. Персонажей и предметы — <b>на ярко-зелёном фоне</b> (#00FF00): его я вырежу автоматически.</li>
    <li>Сначала сгенерируйте «главную» картинку персонажа, затем остальные позы делайте <b>с ней в качестве референса</b> (загрузите её в генератор), чтобы лицо и одежда совпадали.</li>
    <li>Если в генераторе есть поле «негативный промпт» — вставьте туда текст из блока ниже.</li>
    <li>Сохраняйте файлы с именами из серых плашек и пришлите архивом в чат. Я уменьшу их до игрового размера, приведу к палитре игры и встрою.</li>
  </ol>

  <div class="rules">
    <div class="rule"><h3>Негативный промпт (для всех)</h3><div class="prompt"><pre id="p-neg">${esc(D.NEG)}</pre><button class="copy" type="button" data-target="p-neg">Копировать</button></div></div>
    <div class="rule"><h3>Общий стиль (уже включён в каждый промпт)</h3><div class="prompt"><pre id="p-style">${esc(D.STYLE)}</pre><button class="copy" type="button" data-target="p-style">Копировать</button></div></div>
  </div>

  <nav class="toc" aria-label="Разделы">
    ${D.sections.map((s) => `<a href="#sec-${s.id}">${esc(s.title)}</a>`).join('\n    ')}
    <span class="filters"><label for="flt">Показать</label><select id="flt"><option value="all">все</option><option value="1">только «Важно»</option><option value="2">«Важно» и «Желательно»</option><option value="todo">не готовые</option></select></span>
  </nav>

  ${D.sections.map((s) => `<section id="sec-${s.id}">
    <h2>${esc(s.title)}</h2>
    <p class="section-intro">${esc(s.intro)}</p>
    <div class="items">${s.items.map(card).join('')}
    </div>
  </section>`).join('\n  ')}

  <footer>Sprout Doctor · тема №15 «AI-Умная ферма». Палитра игры: #4F8A3C, #8A5A3B, #F6E7C1, #E8833A, #F2A7B8, #2B2A4C, #3FD0C9, #FF4F9A.</footer>
</div>

<script>
(function () {
  var KEY = 'sd-art-done', done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { done = {}; }
  var boxes = Array.prototype.slice.call(document.querySelectorAll('input[data-id]'));
  function save() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }
  function paint() {
    var n = 0;
    boxes.forEach(function (b) { var on = !!done[b.dataset.id]; b.checked = on; b.closest('.item').classList.toggle('is-done', on); if (on) n++; });
    document.getElementById('count').textContent = 'Готово ' + n + ' из ' + boxes.length;
    document.getElementById('bar').style.width = (100 * n / boxes.length) + '%';
    filter();
  }
  function filter() {
    var v = document.getElementById('flt').value;
    document.querySelectorAll('.item').forEach(function (it) {
      var pr = +it.dataset.pr, hide = (v === '1' && pr > 1) || (v === '2' && pr > 2) || (v === 'todo' && done[it.id]);
      it.classList.toggle('hidden-by-filter', !!hide);
    });
  }
  boxes.forEach(function (b) { b.addEventListener('change', function () { done[b.dataset.id] = b.checked; if (!b.checked) delete done[b.dataset.id]; save(); paint(); }); });
  document.getElementById('flt').addEventListener('change', filter);
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = document.getElementById(btn.dataset.target), txt = pre.textContent;
      function ok() { btn.textContent = 'Скопировано'; btn.classList.add('ok'); setTimeout(function () { btn.textContent = 'Копировать'; btn.classList.remove('ok'); }, 1600); }
      function fallback() { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Выделено — Ctrl+C'; }
      try { navigator.clipboard.writeText(txt).then(ok, fallback); } catch (e) { fallback(); }
    });
  });
  paint();
})();
</script>
`;
fs.writeFileSync(OUT_HTML, html);

// Markdown-копия для репозитория
let md = `# Sprout Doctor — промпты для генерации\n\nВсего: ${total}. Приоритет: 1 — важно, 2 — желательно, 3 — по желанию.\n\n**Негативный промпт:** ${D.NEG}\n\n`;
for (const s of D.sections) {
  md += `## ${s.title}\n\n${s.intro}\n\n`;
  for (const it of s.items) md += `### ${it.title} (приоритет ${it.pr})\n\nФайл: \`${it.file}\` · ${it.size}\n\n\`\`\`\n${it.prompt}\n\`\`\`\n${it.note ? `\n${it.note}\n` : ''}\n`;
}
fs.writeFileSync(path.join(__dirname, 'prompts.md'), md);
console.log('items', total, '->', OUT_HTML);
