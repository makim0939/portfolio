"""プレビュー描画の共通処理。サイトのカメラ（オルソ・(-5,3,5)からlookAt(0,1,0)）を
BlenderのZ-up座標に置き換えて再現する。three.js(x,y,z) -> blender(x,-z,y)。"""
import math
import bpy
from mathutils import Vector, Quaternion

ARM_NAME = "Armature"


def get_arm():
    return bpy.data.objects[ARM_NAME]


def enable_all_collections():
    """マスターは書き出し用に Mixamo 等を exclude してあるので、全部有効にする。"""
    def walk(lc):
        if lc.name == "Backup":
            lc.exclude = True
            return
        lc.exclude = False
        lc.hide_viewport = False
        lc.collection.hide_viewport = False
        lc.collection.hide_render = False
        for ch in lc.children:
            walk(ch)
    walk(bpy.context.view_layer.layer_collection)
    bpy.context.view_layer.update()


def add_preview_light():
    """マスターのライトは Enviroment コレクションにあり別管理なので、確認用に自前で足す。"""
    if bpy.data.objects.get("PreviewSun"):
        return
    d = bpy.data.lights.new("PreviewSun", type="SUN")
    d.energy = 3.0
    o = bpy.data.objects.new("PreviewSun", d)
    bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = (math.radians(50), 0.0, math.radians(-130))
    bpy.data.worlds[0].use_nodes = True
    bg = bpy.data.worlds[0].node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.62, 0.66, 0.72, 1.0)
        bg.inputs[1].default_value = 0.9


def setup_camera(target=(0.0, 0.0, 0.9), ortho_scale=3.0, loc=(-5.0, -5.0, 3.0)):
    cam = bpy.data.objects.get("PreviewCam")
    if cam is None:
        cam_data = bpy.data.cameras.new("PreviewCam")
        cam = bpy.data.objects.new("PreviewCam", cam_data)
        bpy.context.scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = ortho_scale
    cam.location = Vector(loc)
    direction = Vector(target) - Vector(loc)
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def setup_render(out_path, res=(640, 640), engine="BLENDER_EEVEE_NEXT", samples=16):
    scene = bpy.context.scene
    try:
        scene.render.engine = engine
    except TypeError:
        scene.render.engine = "BLENDER_WORKBENCH"
    if scene.render.engine.startswith("BLENDER_EEVEE"):
        try:
            scene.eevee.taa_render_samples = samples
        except AttributeError:
            pass
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.filepath = out_path
    scene.render.image_settings.file_format = "PNG"


def hide_room(hide=True, keep=()):
    """アバター以外を隠す。keep に入れた名前のオブジェクトは残す。

    小道具はコレクションインスタンス（Empty）なので、Empty だけ残しても元メッシュを
    隠すとインスタンスごと消える。keep に渡した Empty の参照先も一緒に残す。
    """
    avatar = {"Armature", "Body", "Tops", "Bottoms", "Hair", "PreviewCam", "PreviewSun"}
    keep_set = set(keep)
    for n in list(keep_set):
        o = bpy.data.objects.get(n)
        if o and o.instance_collection:
            for src in o.instance_collection.all_objects:
                keep_set.add(src.name)
    for obj in bpy.data.objects:
        if obj.type in {"CAMERA", "LIGHT"}:
            continue
        should_hide = hide and obj.name not in avatar and obj.name not in keep_set
        # 親エンプティ経由で残したい場合は子も辿る
        obj.hide_render = should_hide
        obj.hide_viewport = should_hide


def keep_tree(names):
    """指定オブジェクトとその子孫の名前を集める。"""
    out = set()
    def walk(o):
        out.add(o.name)
        for c in o.children:
            walk(c)
    for n in names:
        o = bpy.data.objects.get(n)
        if o:
            walk(o)
    return out


def render_still(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
