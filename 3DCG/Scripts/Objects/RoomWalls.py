"""Rebuild the portfolio room's walls with a window opening and a green accent wall.

Replaces the `Wall` mesh baked into portfolio_room_1_1.glb. The original mesh is
imported so the silhouette stays byte-identical where we don't touch it; we only
cut the window and repaint one face.

Layout (three.js world coords, matching the room GLB):
  Z panel  x -1.493..1.627, y -0.4..2.6, z -1.628..-1.388   inner face z=-1.388 (+z)
  X panel  x  1.387..1.627, y -0.4..2.6, z -1.628..1.492    inner face x= 1.387 (-x)

  green   -> Z panel inner face only (paint on one face, like the reference)
  window  -> cut through the X panel, so a directional light outside casts a
             real window-shaped patch on the floor

Blender is Z-up, the glTF importer converts on the way in, so everything below
works in Blender coords: (bx, by, bz) = (x, -z, y).

Usage: blender -b -P room_walls.py -- <out.glb> [out.blend]
"""

import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
out_path = argv[0]

ROOM_GLB = "/Users/k21109/_src/_GitHub/portfolio/public/portfolio_room_1_1.glb"

# --- window opening, in three.js coords -----------------------------------
WIN_Z0, WIN_Z1 = -0.50, 0.80  # along the X wall
WIN_Y0, WIN_Y1 = 1.05, 2.00
WALL_INNER_X = 1.387
WALL_OUTER_X = 1.627

CASING_W = 0.07  # face width of the trim
CASING_D = 0.035  # how far it stands proud of the wall
MULLION_Z = 0.15
MULLION_W = 0.05
SILL_DEPTH = 0.10
SILL_T = 0.06

GREEN_PLANE_Z = -1.388  # three.js z of the face to paint


def t2b(x, y, z):
    """three.js -> Blender."""
    return Vector((x, -z, y))


def new_material(name, rgb, roughness=0.5, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs[0].default_value = (*rgb, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = roughness
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 1.0
    return mat


def add_box(name, lo, hi, material):
    """Axis-aligned box from two three.js-space corners."""
    b0, b1 = t2b(*lo), t2b(*hi)
    centre = (b0 + b1) / 2
    size = Vector((abs(b1.x - b0.x), abs(b1.y - b0.y), abs(b1.z - b0.z)))
    bpy.ops.mesh.primitive_cube_add(size=1, location=centre)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    return obj


bpy.ops.wm.read_factory_settings(use_empty=True)

# Linear values: white matches the room's own `Wall`, wood matches
# `Guitar_spruce.001` (the shelf), green is sampled from the reference photo.
mat_white = new_material("WallWhite", (0.820, 0.780, 0.715))
mat_green = new_material("WallGreen", (0.440, 0.500, 0.330))
mat_frame = new_material("WindowFrame", (0.600, 0.376, 0.180))
mat_sky = new_material("WindowSky", (1.0, 1.0, 1.0), roughness=1.0, emission=(0.95, 1.0, 0.92))

# --- bring in the original wall -------------------------------------------
before = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=ROOM_GLB)
wall = next(o for o in bpy.context.scene.objects if o not in before and o.name == "Wall")

# Detach it from the imported hierarchy and bake the transform so we can work in
# world coordinates.
wall.matrix_world = wall.matrix_world.copy()
matrix = wall.matrix_world.copy()
wall.parent = None
wall.matrix_world = matrix
bpy.ops.object.select_all(action="DESELECT")
wall.select_set(True)
bpy.context.view_layer.objects.active = wall
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

for other in [o for o in bpy.context.scene.objects if o is not wall]:
    bpy.data.objects.remove(other, do_unlink=True)

wall.data.materials.clear()
wall.data.materials.append(mat_white)
wall.data.materials.append(mat_green)

# --- cut the opening -------------------------------------------------------
cutter = add_box(
    "Cutter",
    (WALL_INNER_X - 0.2, WIN_Y0, WIN_Z0),
    (WALL_OUTER_X + 0.2, WIN_Y1, WIN_Z1),
    mat_white,
)
mod = wall.modifiers.new("Opening", "BOOLEAN")
mod.operation = "DIFFERENCE"
mod.object = cutter
mod.solver = "EXACT"
bpy.context.view_layer.objects.active = wall
bpy.ops.object.modifier_apply(modifier="Opening")
bpy.data.objects.remove(cutter, do_unlink=True)

# --- paint the accent face -------------------------------------------------
# Only the inner face of the Z panel, so the wall's top edge stays white the way
# real paint on one face would look.
green_normal = t2b(0, 0, 1) - t2b(0, 0, 0)  # three +z in Blender space
green_plane_by = t2b(0, 0, GREEN_PLANE_Z).y

mesh = wall.data
painted = 0
for poly in mesh.polygons:
    if poly.normal.dot(green_normal) > 0.99 and abs(poly.center.y - green_plane_by) < 0.005:
        poly.material_index = 1
        painted += 1
print(f"painted {painted} face(s) green")

# Split the painted face off into its own object so every exported node carries a
# single material — otherwise the node becomes a multi-primitive mesh and the
# React side has to reference nodes by `_1` suffixes.
bpy.ops.object.select_all(action="DESELECT")
wall.select_set(True)
bpy.context.view_layer.objects.active = wall
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="MATERIAL")
bpy.ops.object.mode_set(mode="OBJECT")

# Separation keeps every slot on both halves, so identify each piece by the
# material index its faces actually use, then collapse it to a single slot.
for obj in [o for o in bpy.context.scene.objects if o.type == "MESH"]:
    if not obj.data.polygons:
        continue
    # `separate` remaps material_index per object, so resolve through the slot
    # list and compare the actual datablock.
    is_green = obj.data.materials[obj.data.polygons[0].material_index] is mat_green
    obj.name = "WallGreen" if is_green else "WallWhite"
    obj.data.materials.clear()
    obj.data.materials.append(mat_green if is_green else mat_white)
    for poly in obj.data.polygons:
        poly.material_index = 0

# --- window trim -----------------------------------------------------------
trim_parts = []
x_in, x_out = WALL_INNER_X - CASING_D, WALL_INNER_X + 0.02

# left / right jamb casing
for z0, z1 in ((WIN_Z0 - CASING_W, WIN_Z0), (WIN_Z1, WIN_Z1 + CASING_W)):
    trim_parts.append(
        add_box("Casing", (x_in, WIN_Y0 - CASING_W, z0), (x_out, WIN_Y1 + CASING_W, z1), mat_frame)
    )
# head / foot casing
for y0, y1 in ((WIN_Y0 - CASING_W, WIN_Y0), (WIN_Y1, WIN_Y1 + CASING_W)):
    trim_parts.append(add_box("Casing", (x_in, y0, WIN_Z0), (x_out, y1, WIN_Z1), mat_frame))

# centre mullion
trim_parts.append(
    add_box(
        "Mullion",
        (WALL_INNER_X - 0.02, WIN_Y0, MULLION_Z - MULLION_W / 2),
        (WALL_INNER_X + 0.02, WIN_Y1, MULLION_Z + MULLION_W / 2),
        mat_frame,
    )
)

# sill
trim_parts.append(
    add_box(
        "Sill",
        (WALL_INNER_X - SILL_DEPTH, WIN_Y0 - CASING_W - SILL_T, WIN_Z0 - CASING_W - 0.03),
        (WALL_INNER_X + 0.02, WIN_Y0 - CASING_W, WIN_Z1 + CASING_W + 0.03),
        mat_frame,
    )
)

bpy.ops.object.select_all(action="DESELECT")
for part in trim_parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = trim_parts[0]
bpy.ops.object.join()
trim = bpy.context.object
trim.name = "WindowFrame"
trim.data.materials.clear()
trim.data.materials.append(mat_frame)

# --- blown-out "outside" panel --------------------------------------------
# Sits beyond the wall so it is only ever seen through the opening. Kept inside
# the wall's silhouette so it can't peek around the edges.
sky = add_box("WindowSky", (1.75, 0.55, -1.05), (1.76, 2.50, 1.30), mat_sky)
sky.name = "WindowSky"

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
