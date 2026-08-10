"""Model the wall clock added to the portfolio room and export it as GLB.

Built at the origin facing +Z in three.js space, so the React component only has
to position it against a wall. Colours are copied from the room's existing
untextured materials so it stays in the same palette:
  case  <- Guitar_spruce.001 (light wood)
  face  <- Planter (off white)
  hands <- マテリアル.003 (near black)

Usage: blender -b -P wall_clock.py -- <out.glb> [out.blend]
"""

import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :]
out_path = argv[0]

CASE_RADIUS = 0.155
CASE_DEPTH = 0.052
FACE_RADIUS = 0.136
FACE_DEPTH = 0.014
FACE_FRONT = CASE_DEPTH / 2 + FACE_DEPTH / 2 - 0.006  # sits just inside the rim

TICK_RADIUS = 0.112
HAND_FRONT = FACE_FRONT + FACE_DEPTH / 2 + 0.004

bpy.ops.wm.read_factory_settings(use_empty=True)


def new_material(name, rgb, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs[0].default_value = (*rgb, 1.0)  # Base Color
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


# Linear-space values copied from the room GLB's own materials.
case_mat = new_material("ClockCase", (0.600, 0.376, 0.180), 0.5)
face_mat = new_material("ClockFace", (0.900, 0.900, 0.900), 0.5)
hand_mat = new_material("ClockHand", (0.019, 0.019, 0.021), 0.5)


def smooth_by_angle(obj, angle=math.radians(40)):
    """Smooth shading with hard creases kept — EdgeSplit works in background mode,
    unlike 4.x's asset-backed `shade_auto_smooth`."""
    bpy.ops.object.shade_smooth()
    mod = obj.modifiers.new("EdgeSplit", "EDGE_SPLIT")
    mod.use_edge_angle = True
    mod.split_angle = angle
    mod.use_edge_sharp = False


def apply_transform(obj):
    """Bake loc/rot/scale into the mesh so joins and the final facing rotation
    can't be clobbered by a part's own transform."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def hand_dir(angle):
    """Unit vector for a clock angle measured clockwise from 12 o'clock."""
    return math.sin(angle), math.cos(angle)


# --- case: a shallow wooden drum, softened at the edges --------------------
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=CASE_RADIUS, depth=CASE_DEPTH)
case = bpy.context.object
case.name = "ClockCase"
case.data.materials.append(case_mat)
bevel = case.modifiers.new("Bevel", "BEVEL")
bevel.width = 0.008
bevel.segments = 3
bevel.limit_method = "ANGLE"
smooth_by_angle(case)

# --- face: white dial inset into the rim -----------------------------------
bpy.ops.mesh.primitive_cylinder_add(
    vertices=48, radius=FACE_RADIUS, depth=FACE_DEPTH, location=(0, 0, FACE_FRONT)
)
face = bpy.context.object
face.name = "ClockFace"
face.data.materials.append(face_mat)
smooth_by_angle(face)
apply_transform(face)

# --- hands + hour marks ----------------------------------------------------
detail_parts = []

for i in range(4):  # marks at 12 / 3 / 6 / 9
    dx, dy = hand_dir(i * math.pi / 2)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(dx * TICK_RADIUS, dy * TICK_RADIUS, HAND_FRONT))
    tick = bpy.context.object
    tick.scale = (0.009, 0.026, 0.006)
    tick.rotation_euler = (0, 0, -i * math.pi / 2)
    apply_transform(tick)
    detail_parts.append(tick)

bpy.ops.mesh.primitive_cylinder_add(
    vertices=16, radius=0.011, depth=0.012, location=(0, 0, HAND_FRONT + 0.010)
)
apply_transform(bpy.context.object)
detail_parts.append(bpy.context.object)

bpy.ops.object.select_all(action="DESELECT")
for part in detail_parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = detail_parts[0]
bpy.ops.object.join()
marks = bpy.context.object
marks.name = "ClockMarks"
marks.data.materials.clear()
marks.data.materials.append(hand_mat)

# --- hands ------------------------------------------------------------------
# 実時刻に合わせて React 側で回すので、12時を指した状態で作り、オブジェクトの
# 原点は文字盤の中心（0,0,0）に残しておく。こうしておくと Z 軸まわりに回すだけで
# 針が中心を軸に回る。
hands = []
for name, length, width, front in (
    ("ClockHourHand", 0.072, 0.011, HAND_FRONT),
    ("ClockMinuteHand", 0.104, 0.008, HAND_FRONT + 0.005),
):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, length / 2, front))
    hand = bpy.context.object
    hand.scale = (width, length, 0.006)
    apply_transform(hand)
    hand.name = name
    hand.data.materials.clear()
    hand.data.materials.append(hand_mat)
    hands.append(hand)

# --- turn the dial to face +Z in three.js space ----------------------------
for obj in (case, face, marks, *hands):
    obj.rotation_euler = (math.pi / 2, 0, 0)
    apply_transform(obj)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)
print(f"exported: {out_path}")

if len(argv) > 1:
    bpy.ops.wm.save_as_mainfile(filepath=argv[1])
    print(f"saved: {argv[1]}")
