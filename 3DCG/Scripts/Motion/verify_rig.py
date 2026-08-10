import os
import sys

# 3DCG/Scripts 配下のサブフォルダを import できるようにする
_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import bpy
from preview_lib import *
from motions import CHAIR_XY

OUT = P.out_tmp("renders", "verify")
os.makedirs(OUT, exist_ok=True)
enable_all_collections(); add_preview_light()
sc = bpy.context.scene
sc.render.fps = 24
setup_render(os.path.join(OUT, "v_"), res=(440, 440))
hide_room(True, keep=["Desk", "Chair.001", "PCボディ", "PCトップ", "モニター27インチ"])
setup_camera(target=(CHAIR_XY[0], CHAIR_XY[1] - 0.30, 0.93), ortho_scale=0.98,
             loc=(CHAIR_XY[0] - 4.0, CHAIR_XY[1] - 0.30, 0.95))
for f in (1, 45, 120, 265, 280, 300):
    sc.frame_set(f)
    render_still(os.path.join(OUT, f"rig_{f:04d}.png"))
print("VERIFY DONE")
