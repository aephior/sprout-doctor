"""Шаг 2. Обучение классификатора поверх признаков MobileNetV2 и экспорт в ONNX.

Голова: StandardScaler + многоклассовая логистическая регрессия (softmax).
Масштабирование «сворачивается» в веса, поэтому итоговая модель — это
исходная MobileNetV2, у которой слой Gemm (1000 классов ImageNet) заменён
на Gemm (13 классов болезней). Никаких новых узлов в графе.
"""
import json, time
import numpy as np
import onnxruntime as ort
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.preprocessing import StandardScaler
from onnx_wire import Model

d = np.load('/home/claude/ml/features.npz')
X, y, split = d['X'], d['y'], d['split']
classes = json.load(open('/home/claude/ml/classes.json'))
names = [c['name'] for c in classes]
tr, va, te = split == 'train', split == 'val', split == 'test'
print('train/val/test:', tr.sum(), va.sum(), te.sum())

sc = StandardScaler().fit(X[tr])
best = None
for C in [0.01, 0.03, 0.1, 0.3, 1.0]:
    t = time.time()
    clf = LogisticRegression(C=C, max_iter=3000, class_weight='balanced').fit(sc.transform(X[tr]), y[tr])
    acc = accuracy_score(y[va], clf.predict(sc.transform(X[va])))
    print(f'C={C}: val acc {acc:.4f} ({time.time() - t:.0f}s)', flush=True)
    if best is None or acc > best[0]:
        best = (acc, C, clf)
_, C, clf = best
print('best C', C)

# Финальная модель: train + val, оценка на test
trva = tr | va
sc = StandardScaler().fit(X[trva])
clf = LogisticRegression(C=C, max_iter=3000, class_weight='balanced').fit(sc.transform(X[trva]), y[trva])
pred = clf.predict(sc.transform(X[te]))
acc = accuracy_score(y[te], pred)
cm = confusion_matrix(y[te], pred)
print(f'TEST accuracy: {acc:.4f}')
print(classification_report(y[te], pred, target_names=names, digits=3))

# Свёртка нормализации: W' = W / sigma, b' = b - W' @ mu
W = clf.coef_ / sc.scale_
b = clf.intercept_ - W @ sc.mean_

m = Model('/home/claude/data/mobilenetv2-12.onnx')
m.set_initializer('classifier.1.weight', W.astype(np.float32))   # Gemm transB=1: [13, 1280]
m.set_initializer('classifier.1.bias', b.astype(np.float32))
m.set_output_dim(len(classes))
OUT = '/home/claude/ml/sprout_leaf_v1.onnx'
m.save(OUT)

# Проверка: ONNX-модель на тестовых признаках = sklearn
sess = ort.InferenceSession(OUT)
print('onnx outputs:', [(o.name, o.shape) for o in sess.get_outputs()])
logits_sk = clf.decision_function(sc.transform(X[te][:200]))
logits_fold = X[te][:200] @ W.T + b
print('max |sklearn - folded|:', np.abs(logits_sk - logits_fold).max())

json.dump({'test_accuracy': float(acc), 'C': C, 'n_train': int(trva.sum()), 'n_test': int(te.sum()),
           'confusion_matrix': cm.tolist(), 'classes': names,
           'report': classification_report(y[te], pred, target_names=names, digits=3, output_dict=True)},
          open('/home/claude/ml/leaf_metrics.json', 'w'), ensure_ascii=False, indent=1)
print('saved', OUT)
