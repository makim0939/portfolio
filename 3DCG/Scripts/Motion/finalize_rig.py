"""指の打鍵と手の微振動だけがキー数を食っているので、2アクションに分ける。

  PCWork          … 手で調整する用。指は打鍵せず、軽く曲げた形のまま
  PCWork_detailed … 指の打鍵と手の8mm上下を残した版（寄りで見るとき用）

打鍵は 3.8Hz なので 13 秒で約50周期あり、どう間引いても密になる。
本体のカーブは既に十分疎なので、細部だけ別アクションへ逃がすのが現実的。
"""
import os
import sys

# 3DCG/Scripts 配下のサブフォルダを import できるようにする
_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import bpy
from rig_controls import decimate_action, rdp

arm = bpy.data.objects["Armature"]
act = bpy.data.actions["PCWork"]

detailed = act.copy()
detailed.name = "PCWork_detailed"
detailed.use_fake_user = True

# PCWork 側: 指と手の上下から打鍵成分を落とす（大きな許容値で間引く＝均される）
FINGER = "HandIndex"
n_before = sum(len(fc.keyframe_points) for fc in act.fcurves)
for fc in act.fcurves:
    dp = fc.data_path
    is_finger = FINGER in dp
    is_hand_z = dp.startswith('pose.bones["CTRL.hand.') and "location" in dp and fc.array_index == 2
    if not (is_finger or is_hand_z):
        continue
    pts = [(kp.co[0], kp.co[1]) for kp in fc.keyframe_points]
    eps = 0.09 if is_finger else 0.6     # 打鍵の振れ幅より大きく取って潰す
    keep = sorted(rdp(pts, eps))
    kept = [pts[i] for i in keep]
    fc.keyframe_points.clear()
    for x, y in kept:
        kp = fc.keyframe_points.insert(x, y, options={'FAST'})
        kp.interpolation = "BEZIER"
        kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"
    fc.update()
n_after = sum(len(fc.keyframe_points) for fc in act.fcurves)
print(f"PCWork: {n_before} -> {n_after} キー")
print(f"PCWork_detailed: {sum(len(fc.keyframe_points) for fc in detailed.fcurves)} キー")

act.use_fake_user = True
arm.animation_data.action = act

per = {}
for fc in act.fcurves:
    b = fc.data_path.split('"')[1] if '"' in fc.data_path else fc.data_path
    per[b] = per.get(b, 0) + len(fc.keyframe_points)
print("--- PCWork のボーン別キー数 ---")
for b in sorted(per, key=lambda k: -per[k]):
    print(f"  {b}: {per[b]}")

SAVE = P.AVATAR
bpy.ops.wm.save_as_mainfile(filepath=SAVE)
print("SAVED:", SAVE)
