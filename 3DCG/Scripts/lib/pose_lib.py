"""Mixamoリグをポーズ付けするための小道具。

アーマチュア空間の軸（実測）:
    +X = キャラの左, +Y = 上, +Z = 前
ボーンのローカル軸はこれをボーンごとに回したもの。degrees で指定する。
"""
import math
import bpy
from mathutils import Euler, Quaternion, Vector

B = "mixamorig:"


def reset_pose(arm):
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = Quaternion((1, 0, 0, 0))
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)


def rot(arm, bone, rx=0.0, ry=0.0, rz=0.0):
    """ボーンのローカル軸まわりに XYZ オイラーで回す（度）。"""
    pb = arm.pose.bones[B + bone]
    pb.rotation_mode = "QUATERNION"
    e = Euler((math.radians(rx), math.radians(ry), math.radians(rz)), "XYZ")
    pb.rotation_quaternion = e.to_quaternion()


def add_rot(arm, bone, rx=0.0, ry=0.0, rz=0.0):
    pb = arm.pose.bones[B + bone]
    e = Euler((math.radians(rx), math.radians(ry), math.radians(rz)), "XYZ")
    pb.rotation_quaternion = pb.rotation_quaternion @ e.to_quaternion()


def scale(arm, bone, sx=1.0, sy=1.0, sz=1.0):
    """スクワッシュ&ストレッチ用。sy がボーン長手方向。"""
    arm.pose.bones[B + bone].scale = (sx, sy, sz)


def loc(arm, bone, x=0.0, y=0.0, z=0.0):
    """ボーンのローカル軸で平行移動（Mixamoは cm 単位）。"""
    arm.pose.bones[B + bone].location = (x, y, z)


ALL_BONES = [
    "Hips", "Spine", "Spine1", "Spine2", "Neck", "Head",
    "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand",
    "LeftHandIndex1", "LeftHandIndex2", "LeftHandIndex3",
    "RightShoulder", "RightArm", "RightForeArm", "RightHand",
    "RightHandIndex1", "RightHandIndex2", "RightHandIndex3",
    "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase",
    "RightUpLeg", "RightLeg", "RightFoot", "RightToeBase",
]


def key_all(arm, frame, scale_too=True, loc_too=True):
    for name in ALL_BONES:
        pb = arm.pose.bones[B + name]
        pb.keyframe_insert("rotation_quaternion", frame=frame)
        if scale_too:
            pb.keyframe_insert("scale", frame=frame)
        if loc_too and name == "Hips":
            pb.keyframe_insert("location", frame=frame)


def set_interpolation(action, kind="BEZIER", easing="EASE_IN_OUT"):
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = kind
            kp.easing = easing


def place(arm, x, y, z_offset=0.0, yaw_deg=None, facing_target=None):
    """アーマチュアをワールドに配置。facing_target を渡すとそちらを向く。"""
    if facing_target is not None:
        dx = facing_target[0] - x
        dy = facing_target[1] - y
        # 正面ベクトルは (sin(yaw), -cos(yaw))
        yaw = math.atan2(dx, -dy)
    else:
        yaw = math.radians(yaw_deg if yaw_deg is not None else 129.37)
    arm.location = (x, y, z_offset)
    arm.rotation_euler = (math.pi / 2, 0.0, yaw)
    return math.degrees(yaw)


HIPS_REST_WORLD = None


def hips_rest_world(arm):
    """レストポーズでの Hips のワールド位置。"""
    global HIPS_REST_WORLD
    if HIPS_REST_WORLD is None:
        HIPS_REST_WORLD = arm.matrix_world @ arm.data.bones[B + "Hips"].head_local
    return HIPS_REST_WORLD


def facing_world(arm):
    """キャラの正面ベクトル（ワールド、水平成分）。アーマチュア空間の +Z が正面。"""
    v = (arm.matrix_world.to_3x3() @ Vector((0, 0, 1)))
    v.z = 0
    return v.normalized()


def place_via_hips(arm, target_xy, hips_z, face_xy=None, yaw_extra_deg=0.0):
    """Hips ボーンだけで全身を配置する。

    Tops/Bottoms/Hair はアーマチュアに親子付けされておらず Armature モディファイア
    経由でしか動かないため、アーマチュアのオブジェクト変換をいじると衣装と体が
    ちぎれる。配置は必ずこの関数（＝Hips のポーズ変換）で行う。
    """
    pb = arm.pose.bones[B + "Hips"]
    pb.rotation_mode = "QUATERNION"

    yaw = math.radians(yaw_extra_deg)
    if face_xy is not None:
        cur = facing_world(arm)
        want = Vector((face_xy[0] - target_xy[0], face_xy[1] - target_xy[1], 0.0)).normalized()
        yaw += math.atan2(cur.x * want.y - cur.y * want.x, cur.x * want.x + cur.y * want.y)
    # Hips のローカル Y はアーマチュア空間の上方向
    pb.rotation_quaternion = Quaternion((0, 1, 0), yaw)

    rest = hips_rest_world(arm)
    delta_world = Vector((target_xy[0] - rest.x, target_xy[1] - rest.y, hips_z - rest.z))
    m3 = arm.matrix_world.to_3x3()
    pb.location = m3.inverted() @ delta_world
    return math.degrees(yaw)


def to_arm_space(arm, world_co):
    return arm.matrix_world.inverted() @ Vector(world_co)


def _bone_dir(m):
    """ポーズ行列のY列＝ボーンの長手方向。"""
    return Vector(m.col[1][:3]).normalized()


def ik2(arm, upper, lower, target_world, pole_world, stretch_max=1.0):
    """2ボーンIK。upper/lower の2本で手先を target に届かせる。

    Blender の IK コンストレイントを使わず自前で解く。バックグラウンド実行での
    ベイク（オペレータのコンテキスト依存）を避けられ、フレームごとに決定的に決まる。
    pole_world は肘（膝）を向けたい方向のヒント。
    """
    ub = arm.pose.bones[B + upper]
    lb = arm.pose.bones[B + lower]

    bpy.context.view_layer.update()
    S = ub.matrix.translation.copy()
    T = to_arm_space(arm, target_world)
    P = to_arm_space(arm, pole_world)

    l1 = arm.data.bones[B + upper].length
    l2 = arm.data.bones[B + lower].length

    to_t = T - S
    d = to_t.length
    if d < 1e-6:
        return
    reach = (l1 + l2) * stretch_max
    if d > reach * 0.999:
        d = reach * 0.999
        T = S + to_t.normalized() * d
        to_t = T - S
    d = max(d, abs(l1 - l2) + 1e-4)

    # 肩から見た上腕の開き角（余弦定理）
    cos_a = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
    alpha = math.acos(max(-1.0, min(1.0, cos_a)))

    to_t_n = to_t.normalized()
    pole_vec = (P - S)
    axis = to_t_n.cross(pole_vec)
    if axis.length < 1e-6:
        axis = to_t_n.cross(Vector((0, 0, 1)))
    axis.normalize()

    upper_dir = Quaternion(axis, alpha) @ to_t_n
    E = S + upper_dir * l1
    lower_dir = (T - E).normalized()

    # レスト方向から目標方向への最小回転を、現在のポーズ行列に掛ける
    cur = ub.matrix.copy()
    q = _bone_dir(cur).rotation_difference(upper_dir)
    m = q.to_matrix().to_4x4() @ cur.to_3x3().to_4x4()
    m.translation = cur.translation
    ub.matrix = m
    bpy.context.view_layer.update()

    cur = lb.matrix.copy()
    q = _bone_dir(cur).rotation_difference(lower_dir)
    m = q.to_matrix().to_4x4() @ cur.to_3x3().to_4x4()
    m.translation = cur.translation
    lb.matrix = m
    bpy.context.view_layer.update()


def hand_world(arm, side):
    bpy.context.view_layer.update()
    return arm.matrix_world @ arm.pose.bones[B + side + "Hand"].matrix.translation
