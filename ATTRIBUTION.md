# Public model attribution / provenance

This project now attempts to load a public male body model at runtime for the mannequin.

## Runtime mannequin source

- **CC0 Male Base Mesh**
- Repository: `BoQsc/Godot-3D-Male-Base-Mesh`
- Path used at runtime: `Original/male_base_mesh.glb`
- License noted by the repository: **CC0 / public domain dedication for the original male base mesh**

This project uses CDN / raw GitHub URLs at runtime rather than bundling the GLB inside the ZIP.
If the runtime model does not load, the site falls back to the built-in procedural mannequin.

## Why the vest and helmet are still procedural in this ZIP

Public downloadable vest and helmet candidates were identified, but their binary assets were not bundled into this ZIP here.
The current codebase keeps the tactical vest and helmet as procedural meshes so the project stays deployable immediately.

You can later replace those with hosted GLB URLs once you download and host the assets you want to use.
