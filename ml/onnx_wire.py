"""Минимальный редактор ONNX на уровне protobuf wire format (без пакета onnx).

Поддерживает то, что нужно проекту:
  * найти выход узла по имени узла;
  * добавить выход графа (для извлечения признаков);
  * заменить веса и смещение финального слоя Gemm и размерность выхода.
Номера полей взяты из onnx.proto: ModelProto.graph=7; GraphProto: node=1,
initializer=5, output=12; NodeProto: input=1, output=2, name=3, op_type=4;
TensorProto: dims=1, data_type=2, name=8, raw_data=9, float_data=4;
ValueInfoProto: name=1, type=2.
"""
import numpy as np


def _varint(buf, i):
    shift = res = 0
    while True:
        b = buf[i]; i += 1
        res |= (b & 0x7F) << shift
        if b < 0x80:
            return res, i
        shift += 7


def _enc_varint(v):
    out = bytearray()
    while True:
        b = v & 0x7F; v >>= 7
        if v:
            out.append(b | 0x80)
        else:
            out.append(b); return bytes(out)


def parse(buf):
    """bytes -> list[[field, wiretype, value]]; value: int или bytes."""
    i, out = 0, []
    while i < len(buf):
        key, i = _varint(buf, i)
        f, wt = key >> 3, key & 7
        if wt == 0:
            v, i = _varint(buf, i)
        elif wt == 1:
            v = buf[i:i + 8]; i += 8
        elif wt == 2:
            ln, i = _varint(buf, i); v = buf[i:i + ln]; i += ln
        elif wt == 5:
            v = buf[i:i + 4]; i += 4
        else:
            raise ValueError(f'wiretype {wt}')
        out.append([f, wt, v])
    return out


def build(fields):
    out = bytearray()
    for f, wt, v in fields:
        out += _enc_varint((f << 3) | wt)
        if wt == 0:
            out += _enc_varint(v)
        elif wt == 2:
            out += _enc_varint(len(v)) + bytes(v)
        else:
            out += bytes(v)
    return bytes(out)


def get(fields, f):
    return [x for x in fields if x[0] == f]


def text(fields, f):
    xs = get(fields, f)
    return bytes(xs[0][2]).decode() if xs else ''


class Model:
    def __init__(self, path):
        self.m = parse(open(path, 'rb').read())
        self.g_entry = get(self.m, 7)[0]
        self.g = parse(self.g_entry[2])

    def save(self, path):
        self.g_entry[2] = build(self.g)
        open(path, 'wb').write(build(self.m))

    def nodes(self):
        for e in get(self.g, 1):
            n = parse(e[2])
            yield e, n

    def node_output(self, node_name):
        for _, n in self.nodes():
            if text(n, 3) == node_name:
                return [bytes(x[2]).decode() for x in get(n, 2)]
        raise KeyError(node_name)

    def node_by_type(self, op):
        return [(e, n) for e, n in self.nodes() if text(n, 4) == op]

    def outputs(self):
        return [parse(e[2]) for e in get(self.g, 12)]

    def add_output_like(self, tensor_name, last_dim):
        """Копирует описание существующего выхода, меняя имя и последнюю размерность."""
        vi = parse(get(self.g, 12)[0][2])
        self._set_vi(vi, tensor_name, last_dim)
        self.g.append([12, 2, build(vi)])

    def set_output_dim(self, last_dim):
        e = get(self.g, 12)[0]
        vi = parse(e[2]); self._set_vi(vi, None, last_dim); e[2] = build(vi)

    @staticmethod
    def _set_vi(vi, name, last_dim):
        if name is not None:
            for x in vi:
                if x[0] == 1:
                    x[2] = name.encode()
        tp = parse(get(vi, 2)[0][2]); tt = parse(get(tp, 1)[0][2]); sh = parse(get(tt, 2)[0][2])
        dims = get(sh, 1)
        last = parse(dims[-1][2]); last = [x for x in last if x[0] != 1 and x[0] != 2] + [[1, 0, last_dim]]
        dims[-1][2] = build(last)
        get(tt, 2)[0][2] = build(sh); get(tp, 1)[0][2] = build(tt); get(vi, 2)[0][2] = build(tp)

    def set_initializer(self, name, arr):
        arr = np.ascontiguousarray(arr, np.float32)
        t = [[1, 0, int(d)] for d in arr.shape] + [[2, 0, 1], [8, 2, name.encode()], [9, 2, arr.tobytes()]]
        for e in get(self.g, 5):
            if text(parse(e[2]), 8) == name:
                e[2] = build(t); return
        raise KeyError(name)
