"""シーンに埋まっていたアバターを Objects/Avatar/Avatar.blend として切り出す。

元は Portfolio2025-Room-Resize.blend の中にローカル実体として置かれていて、
アバターだけを個別に修正できなかった。リグとアクションもここに同居させる
（複数モーションは1つの .blend の中でアクションを切り替えて管理する）。

使い方:
  blender -b <リグ入りの元blend> -P Avatar.py
"""
import os
import sys

_S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [os.path.join(_S, d) for d in ("lib", "Motion", "Objects", "Export")]

import paths as P
import bpy

KEEP = {"Armature", "Body", "Tops", "Bottoms", "Hair"}


def main():
    # 書き出し用に切ってあるコレクションを全部有効化してから作業する
    def enable(lc):
        lc.exclude = False
        lc.hide_viewport = False
        lc.collection.hide_viewport = False
        lc.collection.hide_render = False
        for ch in lc.children:
            enable(ch)
    enable(bpy.context.view_layer.layer_collection)
    bpy.context.view_layer.update()

    missing = KEEP - {o.name for o in bpy.data.objects}
    if missing:
        raise SystemExit(f"アバターの構成要素が見つからない: {missing}")

    for o in list(bpy.data.objects):
        if o.name not in KEEP:
            bpy.data.objects.remove(o, do_unlink=True)

    # コレクションを作り直す。元は Mixamo/Outfits/Hair に分かれていた
    scene_col = bpy.context.scene.collection
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for name in KEEP:
        o = bpy.data.objects[name]
        for c in list(o.users_collection):
            c.objects.unlink(o)
        scene_col.objects.link(o)

    # リンク切れを残さないよう、外部ライブラリへの参照を断つ
    for lib in list(bpy.data.libraries):
        bpy.data.libraries.remove(lib)

    # シーン内で複製されて .001 が付いていたマテリアル名を戻す。
    # サイト側の AvatarPrototype.tsx が materials.Body / materials.Face を参照しており、
    # .001 のままだと gltfjsx の生成名が変わってコンポーネントが壊れる。
    for old, new in (("Body.001", "Body"), ("Face.001", "Face")):
        m = bpy.data.materials.get(old)
        if m is None:
            continue
        if bpy.data.materials.get(new) is not None:
            raise SystemExit(f"{new} が既に存在するので改名できない")
        m.name = new
        print(f"rename material: {old} -> {new}")

    for a in bpy.data.actions:
        a.use_fake_user = True

    # 不要データを掃除（部屋のメッシュ・マテリアル・テクスチャが残らないように）
    for _ in range(4):
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True,
                                       do_recursive=True)

    print("objects :", sorted(o.name for o in bpy.data.objects))
    print("actions :", sorted(a.name for a in bpy.data.actions))
    print("meshes  :", sorted(m.name for m in bpy.data.meshes))
    print("images  :", [(i.name, i.packed_file is not None) for i in bpy.data.images
                        if i.name != "Render Result"])
    print("libs    :", [l.filepath for l in bpy.data.libraries] or "なし")

    os.makedirs(os.path.dirname(P.AVATAR), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=P.AVATAR)
    print("SAVED:", P.AVATAR, os.path.getsize(P.AVATAR))


main()
