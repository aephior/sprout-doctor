"""Шаг 4. Честная проверка модели «Линза Фуку» на полевых фото PlantDoc.

PlantDoc — снимки листьев, сделанные «в поле» (разный фон, свет, ракурс), в отличие от
лабораторных снимков PlantVillage, на которых модель обучена. Модель на PlantDoc не обучалась,
поэтому для проверки используются обе части PlantDoc (train и test).
Режим маски по культуре: в игре культура грядки известна, поэтому сравниваются только классы этой культуры.
"""
import json, os
import cv2
import numpy as np
import onnxruntime as ort
from sklearn.metrics import accuracy_score, confusion_matrix

ROOT = '/home/claude/data/plantdoc'
MODEL = '/home/claude/ml/sprout_leaf_v1.onnx'
MAP = {  # папка PlantDoc -> id класса модели
    'Tomato leaf': 0, 'Tomato Early blight leaf': 1, 'Tomato leaf late blight': 2, 'Tomato leaf bacterial spot': 3,
    'Tomato mold leaf': 4, 'Tomato Septoria leaf spot': 5, 'Tomato leaf yellow virus': 7,
    'Potato leaf early blight': 9, 'Potato leaf late blight': 10,
    'Bell_pepper leaf': 11, 'Bell_pepper leaf spot': 12,
}
CROP = {i: ('tomato' if i <= 7 else 'potato' if i <= 10 else 'pepper') for i in range(13)}
MEAN = np.array([0.485, 0.456, 0.406], np.float32); STD = np.array([0.229, 0.224, 0.225], np.float32)
classes = json.load(open('/home/claude/ml/classes.json'))


def prep(path):
    img = cv2.imread(path)
    if img is None:
        return None
    img = cv2.resize(img[:, :, ::-1], (224, 224), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    return ((img - MEAN) / STD).transpose(2, 0, 1)


sess = ort.InferenceSession(MODEL)
y, p_all, p_crop = [], [], []
for folder, cid in MAP.items():
    for part in ('train', 'test'):
        d = os.path.join(ROOT, part, folder)
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            x = prep(os.path.join(d, f))
            if x is None:
                continue
            logits = sess.run(None, {'input': x[None]})[0][0]
            y.append(cid); p_all.append(int(logits.argmax()))
            mask = np.array([CROP[i] == CROP[cid] for i in range(13)])
            p_crop.append(int(np.where(mask, logits, -1e9).argmax()))

y, p_all, p_crop = map(np.array, (y, p_all, p_crop))
present = sorted(set(y))
res = {
    'n': int(len(y)),
    'accuracy_all13': float(accuracy_score(y, p_all)),
    'accuracy_crop_mask': float(accuracy_score(y, p_crop)),
    'chance_crop_mask': float(np.mean([1 / sum(CROP[i] == CROP[c] for i in range(13)) for c in y])),
    'per_class': {classes[c]['name']: {'n': int((y == c).sum()), 'acc': float((p_crop[y == c] == c).mean())} for c in present},
    'labels': [int(c) for c in present],
    'confusion_crop_mask': confusion_matrix(y, p_crop, labels=list(range(13))).tolist(),
}
json.dump(res, open('/home/claude/ml/field_metrics.json', 'w'), ensure_ascii=False, indent=1)
print(f"PlantDoc: n={res['n']}  all-13={res['accuracy_all13']:.3f}  crop-mask={res['accuracy_crop_mask']:.3f}  chance={res['chance_crop_mask']:.3f}")
for k, v in res['per_class'].items():
    print(f'  {k:40s} n={v["n"]:4d}  acc={v["acc"]:.2f}')
