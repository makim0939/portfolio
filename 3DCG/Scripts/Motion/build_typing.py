import os
import sys

# 3DCG/Scripts 配下のサブフォルダを import できるようにする
_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import math
import bpy
from preview_lib import *
from pose_lib import *
from motions import *

OUT  = P.out_tmp("renders", "typing")
OUT2 = OUT + "_side"
for d in (OUT, OUT2): os.makedirs(d, exist_ok=True)

enable_all_collections(); add_preview_light()
arm = get_arm()

# 椅子をノートPCの正面へ。元は (-0.45,-0.802) で45度斜めを向いていた
place_chair(bpy.data.objects["Chair.001"])
bpy.context.view_layer.update()

N = 312
act = bake(arm, "PCWork", N, pose_typing, step=2)
print("baked:", act.name, act.frame_range[:], "fcurves:", len(act.fcurves))

sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start = 1; sc.frame_end = N

# --- 微調整用に .blend を保存
SAVE = P.AVATAR
bpy.ops.wm.save_as_mainfile(filepath=SAVE)
print("saved blend:", SAVE)

# --- プレビュー
setup_render(os.path.join(OUT, "f_"), res=(440, 440))
hide_room(True, keep=["Desk", "Chair.001", "PCボディ", "PCトップ", "モニター27インチ"])
TGT = (CHAIR_XY[0] - 0.02, CHAIR_XY[1] - 0.28, 0.80)

setup_camera(target=TGT, ortho_scale=1.7, loc=(-5.0, -5.0, 3.0))
sc.render.filepath = os.path.join(OUT, "site_")
bpy.ops.render.render(animation=True)

setup_camera(target=(CHAIR_XY[0], CHAIR_XY[1] - 0.30, 0.93), ortho_scale=0.98, loc=(CHAIR_XY[0] - 4.0, CHAIR_XY[1] - 0.30, 0.95))
sc.render.filepath = os.path.join(OUT2, "side_")
bpy.ops.render.render(animation=True)
