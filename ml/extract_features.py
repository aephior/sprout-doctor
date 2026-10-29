"""Шаг 1. Разбиение PlantVillage (13 классов) и извлечение признаков MobileNetV2.

Выход: features.npz (X, y, split, paths) и classes.json.
Признаки — вектор 1280 после GlobalAveragePool (тензор '472' — выход Reshape_103, добавлен в граф onnx_wire.py).
"""
import json, os, random, sys, time
import cv2
import onnxruntime as ort
import numpy as np

ROOT = '/home/claude/data/pv/raw/color'
MODEL = '/home/claude/data/mnv2_feat.onnx'   # mobilenetv2-12 + выход признаков '472'
OUT = '/home/claude/ml'
CAP = 1400            # не больше N изображений на класс (экономия CPU)
SEED = 42

CLASSES = [  # id: (папка PlantVillage, ключ, название в игре)
    ('Tomato___healthy', 'tomato_healthy', 'Томат: здоров'),
    ('Tomato___Early_blight', 'tomato_early_blight', 'Томат: альтернариоз'),
    ('Tomato___Late_blight', 'tomato_late_blight', 'Томат: фитофтороз'),
    ('Tomato___Bacterial_spot', 'tomato_bacterial_spot', 'Томат: бактериальная пятнистость'),
    ('Tomato___Leaf_Mold', 'tomato_leaf_mold', 'Томат: кладоспориоз'),
    ('Tomato___Septoria_leaf_spot', 'tomato_septoria', 'Томат: септориоз'),
    ('Tomato___Spider_mites Two-spotted_spider_mite', 'tomato_spider_mites', 'Томат: паутинный клещ'),
    ('Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'tomato_ylcv', 'Томат: вирус жёлтой курчавости'),
    ('Potato___healthy', 'potato_healthy', 'Картофель: здоров'),
    ('Potato___Early_blight', 'potato_early_blight', 'Картофель: альтернариоз'),
    ('Potato___Late_blight', 'potato_late_blight', 'Картофель: фитофтороз'),
    ('Pepper,_bell___healthy', 'pepper_healthy', 'Перец: здоров'),
    ('Pepper,_bell___Bacterial_spot', 'pepper_bacterial_spot', 'Перец: бактериальная пятнистость'),
]
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)


def preprocess(path):
    img = cv2.imread(path)[:, :, ::-1]                    # BGR -> RGB
    img = cv2.resize(img, (224, 224), interpolation=cv2.INTER_AREA)
    img = (img.astype(np.float32) / 255.0 - MEAN) / STD
    return img.transpose(2, 0, 1)


def main():
    rnd = random.Random(SEED)
    items = []
    for cid, (folder, _, _) in enumerate(CLASSES):
        files = sorted(os.listdir(os.path.join(ROOT, folder)))
        rnd.shuffle(files)
        files = files[:CAP]
        n = len(files); n_test = round(n * 0.15); n_val = round(n * 0.15)
        for i, f in enumerate(files):
            split = 'test' if i < n_test else ('val' if i < n_test + n_val else 'train')
            items.append((os.path.join(folder, f), cid, split))
    print('images:', len(items), flush=True)

    so = ort.SessionOptions(); so.intra_op_num_threads = 2
    sess = ort.InferenceSession(MODEL, so)
    X = np.zeros((len(items), 1280), np.float32)
    B = 32; t0 = time.time()
    for s in range(0, len(items), B):
        batch = np.stack([preprocess(os.path.join(ROOT, p)) for p, _, _ in items[s:s + B]])
        X[s:s + len(batch)] = sess.run(['472'], {'input': batch})[0]
        if (s // B) % 20 == 0:
            done = s + len(batch); el = time.time() - t0
            print(f'{done}/{len(items)}  {el:.0f}s  ETA {el / done * (len(items) - done):.0f}s', flush=True)
    np.savez_compressed(os.path.join(OUT, 'features.npz'), X=X,
                        y=np.array([c for _, c, _ in items]),
                        split=np.array([s for _, _, s in items]),
                        paths=np.array([p for p, _, _ in items]))
    json.dump([{'id': i, 'folder': f, 'key': k, 'name': n} for i, (f, k, n) in enumerate(CLASSES)],
              open(os.path.join(OUT, 'classes.json'), 'w'), ensure_ascii=False, indent=1)
    print('done', time.time() - t0)


if __name__ == '__main__':
    main()
