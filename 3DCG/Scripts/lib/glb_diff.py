"""2つの glb の構造を突き合わせる。書き出しを作り直したときの回帰チェック用。

Blender の UI を見ずに「壊れていない」ことを示す手段が要るため、
ノード名・メッシュ頂点数・マテリアル名を機械的に比較する。
"""
import json
import struct
import sys


def load(path):
    data = open(path, "rb").read()
    clen, _ = struct.unpack("<II", data[12:20])
    return json.loads(data[20:20 + clen])


def summary(js):
    meshes = {}
    for m in js.get("meshes", []):
        meshes[m["name"]] = sum(
            js["accessors"][p["attributes"]["POSITION"]]["count"] for p in m["primitives"]
        )
    return {
        "nodes": sorted(n.get("name", "") for n in js.get("nodes", [])),
        "meshes": meshes,
        "materials": sorted(m["name"] for m in js.get("materials", [])),
        "animations": sorted(a.get("name", "") for a in js.get("animations", [])),
    }


def diff(a_path, b_path, ignore_animations=False):
    a, b = summary(load(a_path)), summary(load(b_path))
    ok = True
    for key in ("nodes", "materials", "animations"):
        if ignore_animations and key == "animations":
            print(f"  {key}: {a[key]} -> {b[key]}  (比較対象外)")
            continue
        if a[key] == b[key]:
            print(f"  {key}: 一致 ({len(a[key])})")
        else:
            ok = False
            print(f"  {key}: ★差分  欠落={sorted(set(a[key])-set(b[key]))} 追加={sorted(set(b[key])-set(a[key]))}")
    for name in sorted(set(a["meshes"]) | set(b["meshes"])):
        va, vb = a["meshes"].get(name), b["meshes"].get(name)
        if va == vb:
            print(f"  mesh {name}: 一致 ({va} 頂点)")
        else:
            ok = False
            print(f"  mesh {name}: ★差分 {va} -> {vb}")
    return ok


if __name__ == "__main__":
    args = [x for x in sys.argv[1:] if not x.startswith("-")]
    print(f"=== {args[0]}  vs  {args[1]} ===")
    good = diff(args[0], args[1], ignore_animations="--ignore-anim" in sys.argv)
    print("結果:", "一致" if good else "★差分あり")
    sys.exit(0 if good else 1)
