"""椅子を動かした部屋を glb に書き出す。

既存の public/portfolio_room_1_1.glb と同じノード構成になるかを検証したいので、
出力先はスクラッチに置き、リポジトリのファイルは上書きしない。
"""
import os
import sys

# 3DCG/Scripts 配下のサブフォルダを import できるようにする
_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import math
import bpy

OUT = os.environ.get("ROOM_GLB", P.out("portfolio_room_1_1.glb"))

# 部屋の書き出しでは Mixamo(アバター)・Enviroment(カメラ/ライト)・Backup・Collection 1 を外す
DROP = {"Mixamo", "Mesh Mixamo", "Outfits.001", "Hair.001", "Weight transfer Mixamo",
        "Enviroment", "Backup", "Collection 1"}

def walk(lc):
    if lc.name in DROP:
        lc.exclude = True
        return
    lc.exclude = False
    lc.hide_viewport = False
    lc.collection.hide_viewport = False
    lc.collection.hide_render = False
    for ch in lc.children:
        walk(ch)

walk(bpy.context.view_layer.layer_collection)
bpy.context.view_layer.update()

# 椅子を移動（motions.py と同じ値）
# 椅子の移動はモーション作業の変更なので、ここでは行わない。
# 反映する場合は MOVE_CHAIR=1 を付けて実行する。
if os.environ.get("MOVE_CHAIR"):
    from motions import place_chair
    chair = bpy.data.objects["Chair.001"]
    place_chair(chair)
    bpy.context.view_layer.update()
    print("CHAIR:", tuple(round(v, 3) for v in chair.location),
          round(math.degrees(chair.rotation_euler.z), 2))

# 既存の portfolio_room_1_1.glb に入っていないもの。書き出し時に隠されていた分
# （WoodFloor は WoodFloorResized に置き換わった旧床。中の 平面 ごと消える）
DROP_OBJECTS = {"Book", "はしご", "円柱.011", "WoodFloor"}

for o in bpy.data.objects:
    drop = o.name in DROP_OBJECTS
    o.hide_render = drop
    # 除外コレクションのオブジェクトは hide_set できない。
    # hide_render だけ効いていれば書き出しには足りるので、失敗は無視する。
    try:
        o.hide_set(drop)
    except RuntimeError:
        pass

bpy.ops.object.select_all(action="DESELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_visible=True,
    # モディファイアを焼き込まない。既存 portfolio_room_1_1.glb は
    # ベッド掛け布団の SOLIDIFY を適用せず (46頂点) 書き出されており、
    # 適用すると 92 頂点になって別物になる。
    export_apply=False,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
)
print("EXPORTED:", OUT, os.path.getsize(OUT))
