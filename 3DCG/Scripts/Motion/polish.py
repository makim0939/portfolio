import os
import sys

# 3DCG/Scripts 配下のサブフォルダを import できるようにする
_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import bpy
from preview_lib import *
from motions import CHAIR_XY
from rig_controls import decimate_action

act = bpy.data.actions["PCWork"]
# 画面上のキャラは小さいので、回転0.46度・位置3.5mm のズレは見えない
b, a = decimate_action(act, tol_rot=0.0045, tol_loc=0.35, tol_scale=0.004)
print(f"PCWork: {b} -> {a} キー")
per = {}
for fc in act.fcurves:
    k = fc.data_path.split('"')[1] if '"' in fc.data_path else fc.data_path
    per[k] = per.get(k, 0) + len(fc.keyframe_points)
for k in sorted(per, key=lambda x: -per[x])[:8]:
    print(f"  {k}: {per[k]}")

SAVE = P.AVATAR
bpy.ops.wm.save_as_mainfile(filepath=SAVE)
print("SAVED")

OUT = P.out_tmp("renders", "verify")
enable_all_collections(); add_preview_light()
sc = bpy.context.scene; sc.render.fps = 24
setup_render(os.path.join(OUT, "p_"), res=(440, 440))
hide_room(True, keep=["Desk", "Chair.001", "PCボディ", "PCトップ", "モニター27インチ"])
setup_camera(target=(CHAIR_XY[0], CHAIR_XY[1] - 0.30, 0.93), ortho_scale=0.98,
             loc=(CHAIR_XY[0] - 4.0, CHAIR_XY[1] - 0.30, 0.95))
for f in (1, 45, 120, 265, 280, 300):
    sc.frame_set(f)
    render_still(os.path.join(OUT, f"pol_{f:04d}.png"))
print("DONE")
