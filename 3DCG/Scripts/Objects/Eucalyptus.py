"""
既存の EucalyptusPlant.blend を「形はそのまま」で光を受けるように書き出し直す。

元のファイルでは EucalyptusLeaf マテリアルが
    画像テクスチャ -> マテリアル出力
と直結していて BSDF を経由していない。この形は glTF に
KHR_materials_unlit として書き出され、three.js では MeshBasicMaterial に
なるため光を一切受けない。

ここでやること:
  1. 葉のマテリアルを 画像テクスチャ -> Principled BSDF -> 出力 に組み替える
  2. テクスチャの明るさと彩度を調整する
     （unlit のときはテクスチャの色がそのまま出ていた。ライティングを通すと
       環境光ぶん暗く沈むので明るさを持ち上げる。彩度は落とす）
  3. 枝の色を差し替える
     （元は葉より暗い緑。参考写真のユーカリは枝の方が明るい銀灰色で、
       そのままだと葉だけ浮いて見える）

元の .blend とテクスチャ PNG は読み込むだけで、保存も上書きもしない。
出力先の GLB だけを書く。

    blender -b EucalyptusPlant.blend -P Relight.py -- <出力先.glb> [gain] [sat] [枝の色]
"""

import os
import sys

_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import bpy

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = os.path.abspath(args[0]) if args else "EucalyptusPlantLit.glb"
LEAF_GAIN = float(args[1]) if len(args) > 1 else 1.7
LEAF_SAT = float(args[2]) if len(args) > 2 else 0.70
# 枝の色。元は葉より暗い緑で、葉を明るくすると茎だけ浮いてしまう。
# 参考写真のユーカリは枝が葉より明るい銀灰色なので、それに寄せる。
TRUNK_HEX = args[3] if len(args) > 3 else "#b6bcaa"


def srgb_to_linear(hexstr):
    """Principled BSDF の Base Color はリニア値で持つ。"""

    def ch(v):
        v /= 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

    h = hexstr.lstrip("#")
    return (*[ch(int(h[i : i + 2], 16)) for i in (0, 2, 4)], 1.0)

# ---- 葉のマテリアルを組み替える ----------------------------------------
mat = bpy.data.materials["EucalyptusLeaf"]
nodes = mat.node_tree.nodes
links = mat.node_tree.links

image = next(n for n in nodes if n.type == "TEX_IMAGE").image

# ノードを消すとコレクションが再確保され、掴んでおいた参照が無効になる。
# 一部を残して使い回すのではなく、全部消してから作り直す。
nodes.clear()


def sock(collection, identifier):
    """
    UI 名はロケールで変わる（この .blend は日本語で保存されている）ので、
    翻訳されない identifier で引く。
    """
    return next(s for s in collection if s.identifier == identifier)


tex = nodes.new("ShaderNodeTexImage")
tex.image = image
tex.location = (-320, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (tex.location.x + 320, tex.location.y)
sock(bsdf.inputs, "Roughness").default_value = 0.85
sock(bsdf.inputs, "Metallic").default_value = 0.0

out = nodes.new("ShaderNodeOutputMaterial")
out.location = (bsdf.location.x + 320, bsdf.location.y)

links.new(sock(tex.outputs, "Color"), sock(bsdf.inputs, "Base Color"))
links.new(sock(bsdf.outputs, "BSDF"), sock(out.inputs, "Surface"))

# ---- テクスチャの明るさと彩度を調整する --------------------------------
# pixels はリニア値。アルファはそのまま残す。
#
# 彩度は輝度に寄せて落とす。明るさだけで薄くしようとすると、緑チャンネルが
# 先に振り切れて色相が青へずれるので、彩度側で落とす。
# ユーカリはもともと白みがかった葉なので、落とした方がモチーフにも合う。
px = list(image.pixels)
for i in range(0, len(px), 4):
    r, g, b = px[i], px[i + 1], px[i + 2]
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    r = luma + (r - luma) * LEAF_SAT
    g = luma + (g - luma) * LEAF_SAT
    b = luma + (b - luma) * LEAF_SAT
    px[i] = min(r * LEAF_GAIN, 1.0)
    px[i + 1] = min(g * LEAF_GAIN, 1.0)
    px[i + 2] = min(b * LEAF_GAIN, 1.0)
image.pixels = px

# 元の PNG を書き換えないよう、ファイルには一切触らずに .blend 内へ埋め込む。
# こうしておくと書き出し時もディスクの PNG ではなくこの内容が使われる。
image.pack()

# ---- 枝の色 -------------------------------------------------------------
trunk_mat = bpy.data.materials["EucalyptusTrunk"]
trunk_bsdf = next(n for n in trunk_mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
sock(trunk_bsdf.inputs, "Base Color").default_value = srgb_to_linear(TRUNK_HEX)

# ---- 書き出し -----------------------------------------------------------
bpy.ops.object.select_all(action="DESELECT")
for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        obj.select_set(True)
        print("EXPORT", obj.name, [m.name for m in obj.data.materials])

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)
print("WROTE", OUT)

# ---- マスター化 ---------------------------------------------------------
# 以前はこのスクリプトが glb を吐くだけで .blend が残らず、ユーカリ単体を
# 修正する手段が無かった（運用ルール「シーンに配置するオブジェクトは必ず
# Objects/ にマスターを持つ」の違反）。加工後の状態を保存して master にする。
if os.environ.get("EUCALYPTUS_BLEND"):
    dst = os.environ["EUCALYPTUS_BLEND"]
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=dst)
    print("SAVED MASTER", dst, os.path.getsize(dst))
