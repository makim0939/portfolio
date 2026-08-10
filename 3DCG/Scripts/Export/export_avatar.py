"""リグを編集したあと、アバターの .glb を書き出す。

IK コンストレイントはそのまま残してあるので、書き出し時に必ずサンプリングさせる
(export_force_sampling)。コントロールボーンは deform ではないので
export_def_bones で glb からは落ちる。
"""
import os
import sys

# 3DCG/Scripts 配下のサブフォルダを import できるようにする
_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import bpy
from preview_lib import enable_all_collections

OUT = os.environ.get("AVATAR_GLB",
    P.out("avatar_prototype.glb"))

enable_all_collections()

KEEP = {"Armature", "Body", "Tops", "Bottoms", "Hair"}
for o in bpy.data.objects:
    keep = o.name in KEEP
    o.hide_render = not keep
    try:
        o.hide_set(not keep)
    except RuntimeError:
        pass

for a in bpy.data.actions:
    a.use_fake_user = True
print("actions:", [a.name for a in bpy.data.actions])

arm = bpy.data.objects["Armature"]
sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end = int(bpy.data.actions["PCWork"].frame_range[1])
sc.render.fps = 24

bpy.ops.object.select_all(action="DESELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_visible=True,
    # Tops の SUBSURF を焼き込まない。既存 avatar_prototype.glb はベースメッシュ
    # (2908頂点) で書き出されており、適用すると 11644 頂点に増えて別物になる。
    # Armature モディファイアは glTF 側でスキニングとして扱われるので影響しない。
    export_apply=False,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_force_sampling=True,      # IK を評価して焼く
    export_def_bones=True,           # CTRL ボーンを glb に出さない
    export_cameras=False,
    export_lights=False,
)
print("EXPORTED:", OUT, os.path.getsize(OUT))
