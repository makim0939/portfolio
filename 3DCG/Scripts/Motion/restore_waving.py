import bpy, os
MASTER = P.SCENE
print("before:", [a.name for a in bpy.data.actions])
if "Waving_Mixamo" not in bpy.data.actions:
    with bpy.data.libraries.load(MASTER, link=False) as (src, dst):
        dst.actions = [n for n in src.actions if n == "Waving_Mixamo"]
    print("appended:", [a.name for a in bpy.data.actions if a.name == "Waving_Mixamo"])
for a in bpy.data.actions:
    a.use_fake_user = True
print("after:", [a.name for a in bpy.data.actions])
bpy.ops.wm.save_mainfile()
print("SAVED")
