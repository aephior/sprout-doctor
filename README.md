# Sprout Doctor

Браузерная 2D-игра по теме №15 «AI-Умная ферма». Аой лечит урожай: нейросеть «Линза Фуку» ставит диагноз по фото листа, игрок выполняет ритуал лечения.

## Запуск

**Играть онлайн:** https://aephior.github.io/sprout-doctor/ (Chrome или Edge; для управления жестами разрешите доступ к камере).

**Офлайн:** скачайте [SproutDoctor.html](https://aephior.github.io/sprout-doctor/SproutDoctor.html) (правая кнопка → «Сохранить ссылку как…») и откройте в Chrome/Edge (файл ~50 МБ, первая загрузка 10–20 с).

**Сборка из исходников:**

```sh
npm i -g typescript bun        # один раз
./build.sh                     # TypeScript → dist/ (+ release/SproutDoctor.html)
npx serve dist                 # или: python3 -m http.server -d dist → http://localhost:8000
```

Движок Phaser 3.80 (MIT) лежит в `vendor/phaser/`, трекинг рук MediaPipe — в `vendor/mediapipe-hands/`; интернет во время игры не нужен.

## Структура

| Путь | Что внутри |
|---|---|
| `src/scenes/` | Boot, Menu, World (ферма), Hud (интерфейс), Procedure (лечение) |
| `src/ai/engine.ts` | инференс MobileNetV2 на TypeScript (свёртки, ReLU6, GAP, Gemm) |
| `src/ai/leaf.ts`, `leaf.worker.ts` | «Линза Фуку»: предобработка, Web Worker, топ-3 |
| `src/data/diseases.ts` | 13 классов и правила «диагноз → лечение» |
| `src/state/game.ts` | грядки, ресурсы, ночь, сохранение |
| `src/art/` | временные спрайты (пиксель-арт в коде) |
| `ml/` | обучение и экспорт модели |
| `public/` | веса модели, карточки листьев из тестовой выборки |

## Модель «Линза Фуку»

1. `ml/extract_features.py` — PlantVillage (томат, картофель, перец; 13 классов, до 1400 фото на класс), разбиение 70/15/15 с seed=42, признаки MobileNetV2 (ImageNet).
2. `ml/train_head.py` — логистическая регрессия на признаках, подбор C по валидации, оценка на тесте, веса вшиваются в ONNX вместо слоя ImageNet.
3. `ml/export_js_model.py` — экспорт в формат JS-движка (float16).

**Результат:** accuracy на тесте 97,1% (2236 изображений), метрики по классам — `ml/leaf_metrics.json`. JS-движок совпадает с ONNX Runtime по топ-1 на всех проверенных изображениях.

Ограничение: снимки PlantVillage лабораторные, точность на реальных фото будет ниже (отдельная проверка на PlantDoc — в плане).


## Графика

Ферма и персонажи на ней — свободные LPC-ассеты (CC-BY-SA 3.0 / GPL 3.0 / OGA-BY 3.0), сцены, портреты и враги — сгенерированы нейросетью и обработаны. Авторы и лицензии — в [CREDITS.md](CREDITS.md). Скрипты сборки графики — `tools/art/` (сборка персонажей из слоёв LPC, шляпа Аой, карта фермы, обработка сгенерированных картинок).
