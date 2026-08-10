"""重複して作られたコントロールボーンとボーンコレクションを消す。"""
import re
import bpy

arm = bpy.data.objects["Armature"]
bpy.context.view_layer.objects.active = arm

dup = re.compile(r"^CTRL\..*\.\d{3}$")
targets = [b.name for b in arm.data.bones if dup.match(b.name)]
print("削除するボーン:", targets)

# アクションにキーが残っていないか確認
act = bpy.data.actions["PCWork"]
keyed = {fc.data_path.split('"')[1] for fc in act.fcurves if '"' in fc.data_path}
print("重複ボーンのキー:", sorted(n for n in targets if n in keyed) or "なし")

bpy.ops.object.mode_set(mode="EDIT")
eb = arm.data.edit_bones
for n in targets:
    if n in eb:
        eb.remove(eb[n])
bpy.ops.object.mode_set(mode="OBJECT")

for coll in list(arm.data.collections):
    if re.match(r"^CTRL\.\d{3}$", coll.name) or len(coll.bones) == 0:
        print("削除するボーンコレクション:", coll.name)
        arm.data.collections.remove(coll)

print("残ったCTRLボーン:", sorted(b.name for b in arm.data.bones if b.name.startswith("CTRL")))
print("--- コンストレイントの参照先 ---")
for pb in arm.pose.bones:
    for c in pb.constraints:
        tgt = getattr(c, "subtarget", "")
        pole = getattr(c, "pole_subtarget", "")
        ok = (not tgt or tgt in arm.data.bones) and (not pole or pole in arm.data.bones)
        print(f"  {pb.name}: {c.type} -> {tgt}{'  pole=' + pole if pole else ''}  {'OK' if ok else '参照切れ!'}")

bpy.ops.wm.save_mainfile()
print("SAVED")
