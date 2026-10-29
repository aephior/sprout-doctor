"""Графики и сводные цифры для отчёта о тестировании AI (печатный отчёт, светлый фон)."""
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

OUT = '/home/claude/ml/fig'
import os; os.makedirs(OUT, exist_ok=True)
lab = json.load(open('/home/claude/ml/leaf_metrics.json'))
field = json.load(open('/home/claude/ml/field_metrics.json'))
names = lab['classes']
short = [n.replace('Томат: ', 'Т: ').replace('Картофель: ', 'К: ').replace('Перец: ', 'П: ')
         .replace('бактериальная пятнистость', 'бакт. пятнистость').replace('вирус жёлтой курчавости', 'вирус YLCV') for n in names]

INK, INK2, GRID, SURF = '#0b0b0b', '#52514e', '#e4e3df', '#ffffff'
LAB, FIELD = '#2a78d6', '#eb6834'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 9, 'axes.edgecolor': GRID, 'axes.labelcolor': INK2,
                     'xtick.color': INK2, 'ytick.color': INK2, 'text.color': INK})

# 1) Матрица ошибок PlantVillage (нормирована по строкам; в ячейках — число изображений)
cm = np.array(lab['confusion_matrix'])
norm = cm / cm.sum(1, keepdims=True)
cmap = LinearSegmentedColormap.from_list('seq', ['#ffffff', '#cfe0f6', '#7aaee8', '#2a78d6', '#163f73'])
fig, ax = plt.subplots(figsize=(7.4, 6.4), dpi=200)
ax.imshow(norm, cmap=cmap, vmin=0, vmax=1)
for i in range(13):
    for j in range(13):
        if cm[i, j]:
            ax.text(j, i, cm[i, j], ha='center', va='center', fontsize=7, color='#ffffff' if norm[i, j] > 0.55 else INK)
ax.set_xticks(range(13), short, rotation=60, ha='right', fontsize=7.5)
ax.set_yticks(range(13), short, fontsize=7.5)
ax.set_xlabel('Предсказание модели'); ax.set_ylabel('Истинный класс')
for s in ax.spines.values(): s.set_visible(False)
ax.set_xticks(np.arange(-.5, 13), minor=True); ax.set_yticks(np.arange(-.5, 13), minor=True)
ax.grid(which='minor', color=SURF, linewidth=1.5); ax.tick_params(which='minor', length=0)
fig.tight_layout(); fig.savefig(f'{OUT}/cm_plantvillage.png', facecolor=SURF); plt.close(fig)

# 2) Точность по классам: лаборатория vs поле (горизонтальные пары столбцов)
present = field['labels']
lab_acc = [lab['report'][names[c]]['recall'] for c in present]
field_acc = [field['per_class'][names[c]]['acc'] for c in present]
order = np.argsort(field_acc)
fig, ax = plt.subplots(figsize=(7.4, 4.6), dpi=200)
y = np.arange(len(present)); h = 0.36
ax.barh(y + h / 2 + 0.02, [lab_acc[i] * 100 for i in order], h, color=LAB, label='PlantVillage (лабораторные фото)')
ax.barh(y - h / 2 - 0.02, [field_acc[i] * 100 for i in order], h, color=FIELD, label='PlantDoc (полевые фото)')
for k, i in enumerate(order):
    ax.text(field_acc[i] * 100 + 1, k - h / 2 - 0.02, f'{field_acc[i] * 100:.0f}%', va='center', fontsize=7, color=INK2)
ax.set_yticks(y, [short[present[i]] for i in order], fontsize=8); ax.set_ylim(-1.1, len(present) - 0.4)
ax.set_xlim(0, 105); ax.set_xlabel('Доля верных диагнозов, %')
ax.axvline(field['chance_crop_mask'] * 100, color=INK2, linewidth=1, linestyle=(0, (3, 3)))
ax.text(field['chance_crop_mask'] * 100 + 1, -0.85, 'случайное угадывание (в среднем)', fontsize=7, color=INK2)
ax.grid(axis='x', color=GRID, linewidth=0.8); ax.set_axisbelow(True)
for s in ('top', 'right', 'left'): ax.spines[s].set_visible(False)
ax.legend(loc='lower left', bbox_to_anchor=(0, 1.01), ncol=2, frameon=False, fontsize=8)
fig.tight_layout(); fig.savefig(f'{OUT}/lab_vs_field.png', facecolor=SURF); plt.close(fig)

# сводка самых частых ошибок
off = [(cm[i, j], names[i], names[j]) for i in range(13) for j in range(13) if i != j and cm[i, j]]
off.sort(reverse=True)
json.dump({'top_confusions': [[int(n), a, b] for n, a, b in off[:5]]}, open(f'{OUT}/summary.json', 'w'), ensure_ascii=False, indent=1)
print(off[:5])
