"""Шаг 3. Экспорт ONNX-модели в формат для собственного JS-движка (без ONNX Runtime Web).

Выход:
  leaf_model.json — список операций в порядке выполнения (conv / relu6 / add / gap / gemm);
  leaf_weights.bin — веса float16 подряд (смещения в json).
Причина: страница игры не может скачивать wasm-файлы ONNX Runtime с CDN,
а игра должна работать офлайн на защите.
"""
import json, struct, sys
import numpy as np
from onnx_wire import Model, parse, get, text

SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/ml/sprout_leaf_v1.onnx'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/sprout-doctor/public'


def attrs(n):
    out = {}
    for a in get(n, 5):
        f = parse(a[2]); name = text(f, 1)
        ints = []
        for x in get(f, 8):
            if x[1] == 0: ints.append(x[2])
            else:
                buf, i = bytes(x[2]), 0
                while i < len(buf):
                    v = shift = 0
                    while True:
                        b = buf[i]; i += 1; v |= (b & 0x7F) << shift; shift += 7
                        if b < 0x80: break
                    ints.append(v)
        i_ = get(f, 3); fl = get(f, 2)
        out[name] = ints if ints else (i_[0][2] if i_ else (struct.unpack('<f', bytes(fl[0][2]))[0] if fl else None))
    return out


m = Model(SRC)
inits = {}
for e in get(m.g, 5):
    t = parse(e[2]); name = text(t, 8)
    dims = [x[2] for x in get(t, 1)]
    dt = get(t, 2)[0][2] if get(t, 2) else 1
    if dt != 1:
        continue   # не float32 (служебные int64-константы формы)
    raw = get(t, 9)
    if raw: arr = np.frombuffer(bytes(raw[0][2]), np.float32)
    else:
        fd = get(t, 4)
        arr = np.frombuffer(b''.join(bytes(x[2]) for x in fd if x[1] == 5), np.float32) if fd and fd[0][1] == 5 else \
            np.frombuffer(bytes(fd[0][2]), np.float32) if fd else np.zeros(0, np.float32)
    inits[name] = arr.reshape(dims) if dims else arr

blob = bytearray(); ops = []
def put(arr):
    off = len(blob); blob.extend(arr.astype(np.float16).tobytes()); return [off // 2, arr.size]

alias = {}   # тензоры, которые просто переименовываются (reshape/flatten)
for _, n in m.nodes():
    op = text(n, 4)
    ins = [alias.get(bytes(x[2]).decode(), bytes(x[2]).decode()) for x in get(n, 1)]
    outs = [bytes(x[2]).decode() for x in get(n, 2)]
    a = attrs(n)
    if op == 'Conv':
        W = inits[ins[1]]; B = inits[ins[2]] if len(ins) > 2 else np.zeros(W.shape[0], np.float32)
        assert a.get('dilations', [1, 1]) == [1, 1]
        ops.append({'op': 'conv', 'in': ins[0], 'out': outs[0], 'cout': W.shape[0], 'cin': W.shape[1] * a['group'],
                    'k': a['kernel_shape'][0], 's': a['strides'][0], 'p': a['pads'][0], 'g': a['group'],
                    'w': put(W), 'b': put(B)})
    elif op == 'Clip':
        lo, hi = float(np.ravel(inits[ins[1]])[0]), float(np.ravel(inits[ins[2]])[0])
        assert (lo, hi) == (0.0, 6.0), (lo, hi)
        ops.append({'op': 'relu6', 'in': ins[0], 'out': outs[0]})
    elif op == 'Add':
        ops.append({'op': 'add', 'in': ins[0], 'in2': ins[1], 'out': outs[0]})
    elif op == 'GlobalAveragePool':
        ops.append({'op': 'gap', 'in': ins[0], 'out': outs[0]})
    elif op == 'Reshape':
        alias[outs[0]] = ins[0]
    elif op in ('Shape', 'Constant', 'Gather', 'Unsqueeze', 'Concat'):
        pass   # вычисление формы для Reshape — не нужно
    elif op == 'Gemm':
        W = inits[ins[1]]; B = inits[ins[2]]
        assert a.get('transB') == 1
        ops.append({'op': 'gemm', 'in': ins[0], 'out': outs[0], 'nout': W.shape[0], 'nin': W.shape[1], 'w': put(W), 'b': put(B)})
    else:
        raise ValueError(op)

# время жизни тензоров: после последнего использования их можно освобождать
last = {}
for i, o in enumerate(ops):
    for k in ('in', 'in2'):
        if k in o: last[o[k]] = i
for i, o in enumerate(ops):
    o['free'] = [t for t in ([o['in']] + ([o['in2']] if 'in2' in o else [])) if last.get(t) == i and t != 'input']

json.dump({'input': 'input', 'output': ops[-1]['out'], 'size': 224, 'ops': ops}, open(f'{OUT}/leaf_model.json', 'w'))
open(f'{OUT}/leaf_weights.bin', 'wb').write(bytes(blob))
print(len(ops), 'ops,', len(blob) / 1e6, 'MB')
