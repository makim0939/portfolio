"""焼き込み済みの PCWork を、手で調整できる形に組み替える。

やること:
  1. 手足に IK コントローラ（+ 肘/膝のポール）を追加する
  2. IK が支配する腕・脚の FK キーを捨て、代わりにコントローラのキーを打つ
  3. 残った全カーブを Ramer-Douglas-Peucker で間引く

IK は Blender のコンストレイントとして「残す」。今までは私が Python で解いて
FK に焼いていたので手で触れなかったが、これで手先を掴んで動かせるようになる。
"""
import os
import sys

# 3DCG/Scripts 配下のサブフォルダを import できるようにする
_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import math
import bpy
from mathutils import Vector, Matrix
from preview_lib import enable_all_collections

B = "mixamorig:"
ACTION = "PCWork"

# (IKを付けるボーン, 上の親, 中間関節, 先端ボーン, 左右)
LIMBS = [
    ("LeftForeArm",  "LeftArm",   "LeftForeArm", "LeftHand", "hand.L", "elbow.L"),
    ("RightForeArm", "RightArm",  "RightForeArm", "RightHand", "hand.R", "elbow.R"),
    ("LeftLeg",      "LeftUpLeg", "LeftLeg",     "LeftFoot", "foot.L", "knee.L"),
    ("RightLeg",     "RightUpLeg", "RightLeg",   "RightFoot", "foot.R", "knee.R"),
]
POLE_DIST = 18.0     # アーマチュア単位(cm)。肘/膝からポールまでの距離


def rdp(points, eps):
    """Ramer-Douglas-Peucker。残すインデックスの集合を返す。"""
    n = len(points)
    if n < 3:
        return set(range(n))
    keep = {0, n - 1}
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b - a < 2:
            continue
        x0, y0 = points[a]
        x1, y1 = points[b]
        dx, dy = x1 - x0, y1 - y0
        den = dx * dx + dy * dy
        worst, wi = -1.0, -1
        for i in range(a + 1, b):
            x, y = points[i]
            if den == 0:
                d = abs(y - y0)
            else:
                t = ((x - x0) * dx + (y - y0) * dy) / den
                d = abs(y - (y0 + t * dy))
            if d > worst:
                worst, wi = d, i
        if worst > eps:
            keep.add(wi)
            stack.append((a, wi))
            stack.append((wi, b))
    return keep


def decimate_action(action, tol_rot=0.0016, tol_loc=0.12, tol_scale=0.002):
    before = sum(len(fc.keyframe_points) for fc in action.fcurves)
    for fc in action.fcurves:
        dp = fc.data_path
        eps = tol_rot if "rotation" in dp else (tol_loc if "location" in dp else tol_scale)
        pts = [(kp.co[0], kp.co[1]) for kp in fc.keyframe_points]
        keep = sorted(rdp(pts, eps))
        if len(keep) == len(pts):
            continue
        kept = [pts[i] for i in keep]
        fc.keyframe_points.clear()
        for x, y in kept:
            kp = fc.keyframe_points.insert(x, y, options={'FAST'})
            kp.interpolation = "BEZIER"
            kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"
        fc.update()
    after = sum(len(fc.keyframe_points) for fc in action.fcurves)
    return before, after


def main():
    enable_all_collections()
    arm = bpy.data.objects["Armature"]
    bpy.context.view_layer.objects.active = arm
    act = bpy.data.actions[ACTION]
    arm.animation_data.action = act
    scene = bpy.context.scene
    f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])

    # ---- 1. 焼き込み済みポーズから、フレームごとの目標値を採取する
    data = {}
    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        bpy.context.view_layer.update()
        rec = {}
        for ik_b, upper, lower, tip, ctrl, pole in LIMBS:
            S = arm.pose.bones[B + upper].matrix.translation.copy()
            E = arm.pose.bones[B + lower].matrix.translation.copy()
            tipm = arm.pose.bones[B + tip].matrix.copy()
            W = tipm.translation.copy()
            u = (W - S)
            u = u.normalized() if u.length > 1e-6 else Vector((0, 0, 1))
            proj = S + u * ((E - S).dot(u))
            d = (E - proj)
            d = d.normalized() if d.length > 1e-5 else Vector((0, 0, 1))
            rec[ctrl] = tipm
            rec[pole] = E + d * POLE_DIST
            rec[ctrl + "_elbow"] = E
        data[f] = rec

    # ---- 2. コントロールボーンを作る
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm.data.edit_bones
    for ik_b, upper, lower, tip, ctrl, pole in LIMBS:
        src = eb[B + tip]
        c = eb.new("CTRL." + ctrl)
        c.head, c.tail, c.roll = src.head.copy(), src.tail.copy(), src.roll
        c.use_deform = False
        c.parent = None

        e_src = eb[B + lower]
        p = eb.new("CTRL." + pole)
        p.head = e_src.head + Vector((0, 0, POLE_DIST))
        p.tail = p.head + Vector((0, 4.0, 0))
        p.use_deform = False
        p.parent = None
    bpy.ops.object.mode_set(mode="OBJECT")

    coll = arm.data.collections.new("CTRL")
    for bn in arm.data.bones:
        if bn.name.startswith("CTRL."):
            coll.assign(bn)

    # ---- 3. コンストレイントを付ける
    for ik_b, upper, lower, tip, ctrl, pole in LIMBS:
        pb = arm.pose.bones[B + ik_b]
        for c in list(pb.constraints):
            pb.constraints.remove(c)
        ik = pb.constraints.new("IK")
        ik.target = arm
        ik.subtarget = "CTRL." + ctrl
        ik.pole_target = arm
        ik.pole_subtarget = "CTRL." + pole
        ik.chain_count = 2
        ik.use_tail = True

        tb = arm.pose.bones[B + tip]
        for c in list(tb.constraints):
            tb.constraints.remove(c)
        cr = tb.constraints.new("COPY_ROTATION")
        cr.target = arm
        cr.subtarget = "CTRL." + ctrl
        cr.target_space = cr.owner_space = "WORLD"

    # ---- 4. 腕・脚・手足の FK キーを捨てる（IK が支配するので邪魔になる）
    drop_bones = set()
    for ik_b, upper, lower, tip, ctrl, pole in LIMBS:
        drop_bones |= {upper, lower, tip}
    for fc in list(act.fcurves):
        if '"' not in fc.data_path:
            continue
        bone = fc.data_path.split('"')[1].replace(B, "")
        if bone in drop_bones and "scale" not in fc.data_path:
            act.fcurves.remove(fc)

    # ---- 5. コントロールにキーを打つ。ポールアングルは総当たりで合わせる
    scene.frame_set(f0)
    for ik_b, upper, lower, tip, ctrl, pole in LIMBS:
        rec = data[f0]
        arm.pose.bones["CTRL." + ctrl].matrix = rec[ctrl]
        pb = arm.pose.bones["CTRL." + pole]
        m = Matrix.Translation(rec[pole])
        pb.matrix = m
        bpy.context.view_layer.update()

        target_E = rec[ctrl + "_elbow"]
        ikc = arm.pose.bones[B + ik_b].constraints[0]
        best, best_err = 0.0, 1e9
        for deg in range(-180, 180, 3):
            ikc.pole_angle = math.radians(deg)
            bpy.context.view_layer.update()
            err = (arm.pose.bones[B + lower].matrix.translation - target_E).length
            if err < best_err:
                best_err, best = err, deg
        for deg in [best + d * 0.25 for d in range(-12, 13)]:
            ikc.pole_angle = math.radians(deg)
            bpy.context.view_layer.update()
            err = (arm.pose.bones[B + lower].matrix.translation - target_E).length
            if err < best_err:
                best_err, best = err, deg
        ikc.pole_angle = math.radians(best)
        print(f"  {ik_b}: pole_angle={best:.2f}度  肘の誤差={best_err:.3f}cm")

    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        rec = data[f]
        for ik_b, upper, lower, tip, ctrl, pole in LIMBS:
            cb = arm.pose.bones["CTRL." + ctrl]
            cb.rotation_mode = "QUATERNION"
            cb.matrix = rec[ctrl]
            bpy.context.view_layer.update()
            cb.keyframe_insert("location", frame=f)
            cb.keyframe_insert("rotation_quaternion", frame=f)

            pbn = arm.pose.bones["CTRL." + pole]
            pbn.matrix = Matrix.Translation(rec[pole])
            bpy.context.view_layer.update()
            pbn.keyframe_insert("location", frame=f)

    # ---- 6. 間引く
    before, after = decimate_action(act)
    print(f"キー数: {before} -> {after}  ({after/before*100:.1f}%)")
    print("F-Curves:", len(act.fcurves))

    scene.frame_set(f0)
    SAVE = P.AVATAR
    bpy.ops.wm.save_as_mainfile(filepath=SAVE)
    print("SAVED:", SAVE)


if __name__ == "__main__":
    # import されただけで実行されないようにする。
    # これが無いと decimate_action を import した先で main() が走り、
    # コントロールボーンが二重三重に作られる。
    main()
