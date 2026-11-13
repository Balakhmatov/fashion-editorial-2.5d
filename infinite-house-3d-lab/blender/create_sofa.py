"""Infinite House • stylized 3D sofa — Blender 4.2+/5.x

Run in Blender: Scripting > Open > Run Script
Or headless: blender --background --python create_sofa.py

Writes sofa.glb (game asset) and sofa_preview.png (style reference)
beside this script. The GLB is Y-up for Three.js and is centered at
the sofa's floor-contact pivot. No sprites or multiple views are needed.
"""
from pathlib import Path
from math import radians
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

scene = bpy.context.scene
scene.render.resolution_x = 1152
scene.render.resolution_y = 1152
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = True
for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
    try:
        scene.render.engine = engine
        break
    except (TypeError, ValueError):
        continue

def material(name, rgba, roughness=.82, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat

red = material("coral upholstery", (.73, .245, .16, 1))
red_hi = material("cushion highlight", (.87, .38, .27, 1))
red_dark = material("red piping", (.47, .14, .105, 1))
wood = material("dark walnut legs", (.31, .17, .12, 1), .6)
cream = material("yellow decorative pillow", (1, .71, .26, 1))
pink = material("flower embroidery", (.91, .33, .28, 1))
green = material("green throw", (.41, .60, .26, 1))
materials = [red, red_hi, red_dark, wood, cream, pink, green]

# Blender is Z-up. Project code uses Y-up. Convert game (X,Y,Z)
# positions to Blender (X,-Z,Y); the GLB exporter converts it back.
def convert(x, y, z):
    return (x, -z, y)

bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
root = bpy.context.object
root.name = "InfiniteHouse_Sofa"

def rounded(name, x, y, z, w, h, d, radius, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=convert(x, y, z))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new("Soft upholstered corners", "BEVEL")
    bevel.width = min(radius, w*.42, d*.42, h*.42)
    bevel.segments = 4
    if hasattr(bevel, "affect"):
        bevel.affect = "EDGES"
    normal = obj.modifiers.new("Weighted smooth shading", "WEIGHTED_NORMAL")
    obj.data.materials.append(mat)
    obj.parent = root
    return obj

def ball(name, x, y, z, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=radius, location=convert(x,y,z))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    obj.parent = root
    return obj

def leg(name, x, z):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.078, depth=.26, location=convert(x,.18,z))
    obj = bpy.context.object
    obj.name = name
    # Cylinders start along Blender Z, matching vertical game Y.
    obj.data.materials.append(wood)
    obj.parent = root

for x in (-1.17, 1.17):
    for z in (-.60, .60):
        leg("Walnut foot", x, z)

rounded("Seat shell", 0,.51,0,2.75,.47,1.53,.18,red_dark)
rounded("Back support",0,1.07,-.70,2.72,.88,.31,.14,red)
for i,x in enumerate((-.86,0,.86),start=1):
    rounded("Back cushion %d"%i,x,1.14,-.55,.84,.60,.29,.15,red_hi)
    rounded("Seat cushion %d"%i,x,.80,.26,.83,.27,1.01,.13,red_hi)
    ball("Tuft button %d"%i,x,1.20,-.35,.035,red_dark)
for x in (-1.26,1.26):
    rounded("Rolled arm",x,.88,.06,.32,.72,1.35,.15,red)

pillow=rounded("Flower pillow",-.79,1.1,.18,.46,.46,.17,.08,cream)
pillow.rotation_euler[1]=radians(-12)
ball("Pillow flower",-.79,1.18,.34,.062,pink)
throw=rounded("Cozy green blanket",1.27,1.10,.27,.32,.18,.66,.06,green)
throw.rotation_euler[1]=radians(9)

# Export only the furniture model. No room lighting or backdrop in the GLB.
bpy.ops.object.select_all(action="DESELECT")
root.select_set(True)
for obj in bpy.data.objects:
    if obj.parent == root:
        obj.select_set(True)
bpy.context.view_layer.objects.active = root
export_path = HERE / "sofa.glb"
bpy.ops.export_scene.gltf(
    filepath=str(export_path),
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_apply=True,
    export_cameras=False,
    export_lights=False,
    export_animations=False,
)
print("GLB exported:", export_path)

# Preview-only camera and soft lighting.
bpy.ops.object.select_all(action="DESELECT")
bpy.ops.object.camera_add(location=(5.5, -7.5, 6.1))
cam = bpy.context.object
cam.name = "Orthographic preview"
direction = Vector((0, 0, .8)) - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
cam.data.type = "ORTHO"
cam.data.ortho_scale = 4.8
scene.camera = cam

for name,location,power,color,size in [
    ("Keybox",(-4,-3,8),950,(1.0,.86,.73),5),
    ("Fillbox",(4,2,6),570,(.74,.86,1.0),4),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = power
    light.data.color = color
    light.data.shape = "DISK"
    light.data.size = size
    target=Vector((0,0,.6))-light.location
    light.rotation_euler=target.to_track_quat("-Z","Y").to_euler()

scene.world.color = (.78,.80,.84)
scene.render.filepath = str(HERE / "sofa_preview.png")
bpy.ops.render.render(write_still=True)
print("Preview exported:", scene.render.filepath)
# Source stays editable. A separate GLB remains the runtime game asset.
source_path = HERE / "sofa_source.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(source_path))
print("Editable Blender source:", source_path)
