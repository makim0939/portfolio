"""issue #36 のモーション定義。

Bondee 的な質感を出すための約束ごと:
  - スクワッシュ&ストレッチ … ボーンの scale を使う。sy がボーン長手方向なので、
    sy を縮めたら sx/sz を膨らませて体積が変わって見えないようにする。
  - オーバーシュート     … 目標値を一度行き過ぎてから戻す。sin ではなく減衰振動で作る。
  - 予備動作             … 本動作の前に逆方向へ軽く溜める。
  - 常時アイドル         … 完全静止させず、呼吸の周期運動を必ず重ねる。
"""
import math
import bpy
from mathutils import Vector
from pose_lib import *
from ref_signal import HEAD_X, HEAD_Y, FPS as REF_FPS

FPS = 24


def squash(arm, bone, amount):
    """amount>0 で潰れ（横に膨らむ）、amount<0 で伸びる。"""
    sy = 1.0 - amount
    sxz = 1.0 + amount * 0.55
    scale(arm, bone, sxz, sy, sxz)


def breathe(arm, t, depth=1.0):
    """呼吸。静止して見えないよう全モーション共通で薄く重ねる。"""
    b = math.sin(t * math.tau)
    squash(arm, "Spine1", -0.012 * depth * b)
    squash(arm, "Spine2", -0.008 * depth * b)


def damped(t, freq=3.0, decay=4.0):
    """0→1 の減衰振動。オーバーシュートを作る。"""
    if t <= 0.0:
        return 0.0
    if t >= 1.0:
        return 1.0
    return 1.0 - math.exp(-decay * t) * math.cos(freq * math.tau * t * 0.25)


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def bake(arm, name, nframes, pose_fn, step=2):
    """毎フレーム pose_fn でポーズを作り、step 間隔でキーを打つ。

    step=2（＝いわゆる「2コマ打ち」）にしてあるのは、データ量を半分にしつつ
    手描きアニメ的な小気味よさを出すため。glb のサイズにも効く。
    """
    arm.animation_data_clear()
    arm.animation_data_create()
    old = bpy.data.actions.get(name)
    if old is not None:                      # 作り直しのたびに .001 が増えないように
        bpy.data.actions.remove(old)
    action = bpy.data.actions.new(name)
    arm.animation_data.action = action
    try:
        slot = action.slots.new(id_type="OBJECT", name=name)
        arm.animation_data.action_slot = slot
    except AttributeError:
        pass

    for f in range(1, nframes + 1, step):
        reset_pose(arm)
        pose_fn(arm, f, (f - 1) / float(nframes))
        bpy.context.view_layer.update()
        key_all(arm, f)

    # ループを閉じる: 最終フレームは1フレーム目と同じポーズ
    reset_pose(arm)
    pose_fn(arm, 1, 0.0)
    bpy.context.view_layer.update()
    key_all(arm, nframes + 1)

    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.easing = "AUTO"
    action.use_fake_user = True
    return action


# ---------------------------------------------------------------- PC作業
# gogh の参考動画をコマ送りで採寸した結果にもとづく。
#
#   姿勢: 上腕は肩から下前方へ、肘は机の手前端に「乗る」。前腕は天板に水平。
#         背中はやや丸め、頭は約20度下向き。ノートPCは体の正面。
#   揺らぎ: 単一の正弦ではなく 1.45/1.86/2.61/4.34 秒の成分が重なっていた。
#         人手で作ると規則的になるので、実測カーブ(ref_signal)をそのまま流用する。
#   拍   : 13.03秒のうち、1.4-2.6秒に「うつむき」、10.75-12.7秒に「腕を前へ伸ばす」。
#         伸ばしきりで約0.8秒とまるのが効いている。
LOOP_SEC = 13.03

# 椅子はノートPCの正面へ移動させる（部屋側も同じ位置に動かすこと）
CHAIR_XY = (-0.906, -0.735)   # 「座面の重心」をここへ持ってくる（＝腰の位置）

# 椅子の配置。何度実行しても同じ結果になるよう、加算ではなく絶対値で入れる。
#   元の Chair.001: location=(-0.45,-0.802) rot_z=313.36度
#   このとき椅子の正面は -136.65 度（斜め）。+46.8 度で -Y 正対(-89.85度)になる（実測）
#   回転はオブジェクト原点まわりなので、回した後の座面重心は原点から (0, -0.031) ずれる
CHAIR_ROT_Z_DEG = 313.36 + 46.8
CHAIR_SEAT_OFFSET_Y = -0.031


def place_chair(chair):
    chair.location = (CHAIR_XY[0], CHAIR_XY[1] - CHAIR_SEAT_OFFSET_Y, chair.location.z)
    chair.rotation_euler.z = math.radians(CHAIR_ROT_Z_DEG)
SEAT_Z = 0.469
DESK_TOP = 0.80
FACE = (CHAIR_XY[0], CHAIR_XY[1] - 1.0)   # -Y を向く
HALF = 0.055                               # ノートPCのキーボードは狭いので手も近い

HAND_Y = -1.190
HAND_Z = DESK_TOP + 0.018
FOOT_L = (CHAIR_XY[0] + 0.085, -1.030, 0.055)
FOOT_R = (CHAIR_XY[0] - 0.085, -1.030, 0.055)

# 実測カーブ 1px(1/5縮尺) あたりの換算。頭の高さ ≒ 40px ≒ 0.22m から求めた
PX_TO_DEG = 0.70


def ref_at(table, t):
    """0..1 の位相で実測カーブを線形補間して引く。"""
    x = (t % 1.0) * (len(table) - 1)
    i = int(x)
    a = x - i
    return table[i] * (1 - a) + table[min(i + 1, len(table) - 1)] * a


def _reach_env(t):
    """腕を前へ伸ばす拍。参考動画の 10.75→11.40→12.20→12.70 秒をそのまま使う。"""
    s = t * LOOP_SEC
    if s < 10.75 or s >= 12.70:
        return 0.0, 0.0
    if s < 10.95:                      # 予備動作: わずかに手前へ引いて溜める
        return 0.0, math.sin((s - 10.75) / 0.20 * math.pi)
    if s < 11.40:                      # 伸ばす
        return ease((s - 10.95) / 0.45), 0.0
    if s < 12.20:                      # 伸ばしきりで保持。ごく小さく揺れて止まる
        u = (s - 11.40) / 0.80
        return 1.0 + 0.025 * math.exp(-6.0 * u) * math.cos(u * math.tau * 1.2), 0.0
    return 1.0 - ease((s - 12.20) / 0.50), 0.0


def pose_typing(arm, f, t):
    w, antic = _reach_env(t)

    # --- 実測カーブによるゆらぎ。頭が下がる(+)ほど前傾が深くなる
    drift = ref_at(HEAD_Y, t) * PX_TO_DEG      # 度
    sway = ref_at(HEAD_X, t) * PX_TO_DEG * 0.5

    lean = 15.0 + drift * 0.30 - 4.0 * w + 1.5 * antic
    hip_h = SEAT_Z + 0.095 - 0.0022 * drift - 0.004 * antic

    place_via_hips(arm, CHAIR_XY, hip_h, face_xy=FACE, yaw_extra_deg=0.35 * sway)

    ik2(arm, "LeftUpLeg", "LeftLeg", FOOT_L, (CHAIR_XY[0] + 0.10, CHAIR_XY[1] - 1.4, 0.95))
    ik2(arm, "RightUpLeg", "RightLeg", FOOT_R, (CHAIR_XY[0] - 0.10, CHAIR_XY[1] - 1.4, 0.95))
    rot(arm, "LeftFoot", rx=28);  rot(arm, "RightFoot", rx=28)

    rot(arm, "Spine",  rx=lean * 0.40, rz=0.35 * sway)
    rot(arm, "Spine1", rx=lean * 0.32, rz=0.30 * sway)
    rot(arm, "Spine2", rx=lean * 0.22, rz=0.25 * sway)
    # 首から上は胴より 0.08 秒遅らせる。この遅れが「生きている感じ」を作る
    lag = ref_at(HEAD_Y, t - 0.08 / LOOP_SEC) * PX_TO_DEG
    lagx = ref_at(HEAD_X, t - 0.08 / LOOP_SEC) * PX_TO_DEG
    rot(arm, "Neck", rx=-lean * 0.28 + 9 + lag * 0.35 + 2 * w, rz=-0.30 * lagx)
    rot(arm, "Head", rx=-lean * 0.20 + 13 + lag * 0.35 + 3 * w, rz=-0.45 * lagx,
        ry=0.35 * lagx)

    breathe(arm, t * LOOP_SEC / 3.6, depth=0.30)

    rot(arm, "LeftShoulder",  rz=2 - 6 * w, rx=-3 * w)
    rot(arm, "RightShoulder", rz=-2 + 6 * w, rx=-3 * w)

    # --- 手。肘を机の手前端に落とすため、ポールを下後方に置く
    tapL = max(0.0, math.sin(t * LOOP_SEC * math.tau * 3.8)) * (1 - w)
    tapR = max(0.0, math.sin(t * LOOP_SEC * math.tau * 3.8 + 2.4)) * (1 - w)

    hy = HAND_Y + 0.006 * antic
    restL = (CHAIR_XY[0] + HALF, hy, HAND_Z + 0.008 * tapL)
    restR = (CHAIR_XY[0] - HALF, hy, HAND_Z + 0.008 * tapR)
    # 伸ばしきり: ノートPCの画面を越えて前方へ。腕の全長より遠いので肘が伸び切る
    outL = (CHAIR_XY[0] + HALF + 0.02, -1.310, DESK_TOP + 0.265)
    outR = (CHAIR_XY[0] - HALF - 0.02, -1.310, DESK_TOP + 0.265)
    lerp = lambda a, b: tuple(a[i] + (b[i] - a[i]) * min(1.0, w) for i in range(3))

    poleL = (CHAIR_XY[0] + 0.32, CHAIR_XY[1] + 0.45, 0.28 + 0.9 * w)
    poleR = (CHAIR_XY[0] - 0.32, CHAIR_XY[1] + 0.45, 0.28 + 0.9 * w)
    ik2(arm, "LeftArm", "LeftForeArm", lerp(restL, outL), poleL)
    ik2(arm, "RightArm", "RightForeArm", lerp(restR, outR), poleR)

    # 打鍵中は手首をやや反らせ、伸ばしきりでは掌を下に開く
    rot(arm, "LeftHand", rx=-10 - 6 * w);  rot(arm, "RightHand", rx=-10 - 6 * w)
    for i, sdeg in ((1, 16), (2, 22), (3, 14)):
        rot(arm, f"LeftHandIndex{i}",  rx=-sdeg * tapL + sdeg * 1.1 * w)
        rot(arm, f"RightHandIndex{i}", rx=-sdeg * tapR + sdeg * 1.1 * w)
