"""シーンに残っている壊れた画像パスを繋ぎ直す。

Windows で作業していた頃の `G:/マイドライブ/...` や、存在しない
`_Projects/Portfolio_renewal/...` を指したままの画像がある。
実体が Reference/ にあるものは相対パスに繋ぎ直し、無いものは報告だけする。
"""
import os
import sys

_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import bpy

# 壊れた参照 -> Reference/ 内の実体
REMAP = {
    "acoustic_guitar_front.jpg": "AcousticGuitar/acoustic_guitar_front.jpg",
    "YAMAHA_MOXF6.webp": "Synthesizer/YAMAHA_MOXF6.webp",
    "YAMAHA_MOXF8.jpg": "Synthesizer/YAMAHA_MOXF8.jpg",
    "YAMAHA_MOXF8_back.webp": "Synthesizer/YAMAHA_MOXF8_back.webp",
}

fixed, lost = [], []
for img in bpy.data.images:
    if img.name == "Render Result" or img.packed_file or not img.filepath or img.library:
        continue
    if os.path.exists(bpy.path.abspath(img.filepath)):
        continue
    rel = REMAP.get(img.name)
    if rel and os.path.exists(os.path.join(P.REFERENCE, rel)):
        img.filepath = bpy.path.relpath(os.path.join(P.REFERENCE, rel))
        fixed.append((img.name, img.filepath))
    else:
        lost.append((img.name, img.filepath, img.users))

for n, p in fixed:
    print(f"  繋ぎ直し: {n} -> {p}")
for n, p, u in lost:
    print(f"  実体なし: {n}  path={p}  users={u}")

if fixed:
    bpy.ops.wm.save_mainfile()
    print("SAVED")
