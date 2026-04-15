# Canvas 3D AI Guide

This document explains how the Canvas 3D feature is structured and what an AI agent should check before editing it.

## Purpose and Scope

Canvas 3D is a hybrid setup:
- React UI lives in Next.js components under src/components/canvas-3d.
- The 3D engine/runtime lives in public/canvas-3d as vanilla Three.js modules.
- React and runtime communicate through a global bridge (window.Canvas3DBridge) and a state event (canvas3d:state).

If you edit Canvas 3D behavior, you usually need to touch both the React side and runtime side.

## Entry Points

- Route entry: src/app/canvas-3d/page.tsx
- Route styles: src/app/canvas-3d/canvas3d.css
- React workspace root: src/components/canvas-3d/Canvas3DWorkspace.tsx
- Runtime root: public/canvas-3d/main.js

## React Side Structure

### src/components/canvas-3d/Canvas3DWorkspace.tsx
Main orchestrator. Responsibilities:
- Inject import map and load runtime script.
- Mount/unmount Canvas runtime via bridge.
- Subscribe to runtime state event canvas3d:state.
- Keep UI state (menus, color input mode, open panels).
- Pass callbacks and state to child components.
- Render KaTeX matrix preview based on selected object/mode.

### src/components/canvas-3d/LeftSidebar.tsx
Left panel UI:
- Scene hierarchy list.
- Object creation buttons.
- Tool mode buttons.
- Transform matrix panel.

### src/components/canvas-3d/RightSidebar.tsx
Right panel UI:
- Transform controls (position, rotation, scale, skew).
- Material controls (RGB/HSV/Hex/alpha).

Note: this file replaced an older InspectorSidebar naming pattern.

### src/components/canvas-3d/SettingsPane.tsx
Tweakpane-based settings popover.

### src/components/canvas-3d/DebugPane.tsx
Tweakpane-based live debug monitors (mode, selection, object count, FPS, etc).

### src/components/canvas-3d/DraggableNumberInput.tsx
Reusable number input with horizontal drag-to-scrub behavior.

### src/components/canvas-3d/types.ts
Single source of truth for:
- Canvas state types.
- Bridge function types.
- Empty/default state values.
- Global event typing for canvas3d:state.

### src/components/canvas-3d/runtime.ts
Runtime bootstrap helpers:
- injectImportMap()
- loadCanvasRuntimeModule()
- waitForBridge()

### src/components/canvas-3d/workspaceMath.ts
UI math utilities:
- clamp()
- Matrix title + transform matrix generation for KaTeX.

## Runtime Side Structure

### public/canvas-3d/main.js
Core app class and bridge implementation.

Key responsibilities:
- Initialize Three.js scene, controls, transform controls, viewport gizmo.
- Manage object selection/hover/deletion.
- Handle transform/skew editing.
- Handle material color/alpha updates.
- Emit app state snapshots through event.
- Expose bridge methods on window.Canvas3DBridge.

### Other runtime modules
- public/canvas-3d/core/sceneManager.js
- public/canvas-3d/core/controlsManager.js
- public/canvas-3d/objects/objectManager.js
- public/canvas-3d/objects/booleanOperations.js
- public/canvas-3d/gizmos/gizmoManager.js
- public/canvas-3d/gizmos/skewGizmo.js
- public/canvas-3d/utils/constants.js

## Data Flow Contract

### Runtime -> React
- Runtime emits window event named canvas3d:state.
- Event detail is a full state snapshot matching Canvas3DState in types.ts.

### React -> Runtime
- React calls methods from window.Canvas3DBridge.
- Canvas3DWorkspace and sidebars should avoid writing runtime state directly.

If bridge signatures change, update all of:
1) public/canvas-3d/main.js (App methods + window.Canvas3DBridge mapping)
2) src/components/canvas-3d/types.ts (Canvas3DBridge type)
3) Any React callers

## State Fields and Naming Rules

Transform update/reset fields use string keys expected by runtime:
- Position: pos-x, pos-y, pos-z
- Rotation: rot-x, rot-y, rot-z
- Scale: scale-x, scale-y, scale-z
- Skew: skew-xy, skew-xz, skew-yx, skew-yz, skew-zx, skew-zy

Do not rename these keys unless runtime parsing in main.js is updated too.

## Important Editing Rules

1. Always emit state after runtime mutations.
- Most runtime mutations should call emitState() so React UI stays in sync.

2. Keep import map and runtime imports aligned.
- runtime.ts injects import map entries (including three-viewport-gizmo).
- main.js imports should remain compatible with that map.

3. Keep CSS canvas targeting scoped.
- In canvas3d.css, target main canvas specifically.
- Avoid generic rules that affect all canvases under #canvas-container (can break culling/secondary viewport behavior).

4. Preserve id hooks expected by runtime.
- Runtime looks for #canvas-container.
- If changing layout ids/classes, verify runtime bootstrap still finds container.

5. Do not reintroduce legacy static UI assumptions.
- React now drives hierarchy/settings/inspector.
- main.js should continue exposing state + bridge, not direct DOM-driven panel logic.

6. Use types.ts as the API contract.
- Prefer adding/updating state and bridge definitions there first.

## Quick Change Playbooks

### Add a new runtime setting
1) Add runtime method and state snapshot field in public/canvas-3d/main.js.
2) Add bridge signature in src/components/canvas-3d/types.ts.
3) Connect UI control in React component(s).
4) Ensure emitState() is called after change.

### Add a new object type button
1) Add creation logic in runtime (main.js/objectManager.js).
2) Extend CanvasObjectKind in types.ts.
3) Add button in LeftSidebar.tsx and call onAddObject with new kind.

### Add a new inspector field
1) Extend selected snapshot in runtime getSelectedSnapshot().
2) Extend SelectedObjectState type.
3) Render control in RightSidebar.tsx and wire callback.
4) Implement update/reset handling in runtime methods.

## Validation Checklist After Edits

- Open /canvas-3d route and verify runtime loads (no loading error overlay).
- Add/select/delete objects from hierarchy.
- Switch transform modes (translate/rotate/scale/skew).
- Confirm matrix panel updates with mode/selection.
- Confirm RGB/HSV/Hex and alpha all update material.
- Toggle settings pane values and verify scene changes.
- Toggle camera type and culling view.
- Confirm debug pane still updates.

## Current File Map (React)

- src/components/canvas-3d/Canvas3DWorkspace.tsx
- src/components/canvas-3d/LeftSidebar.tsx
- src/components/canvas-3d/RightSidebar.tsx
- src/components/canvas-3d/SettingsPane.tsx
- src/components/canvas-3d/DebugPane.tsx
- src/components/canvas-3d/DraggableNumberInput.tsx
- src/components/canvas-3d/runtime.ts
- src/components/canvas-3d/workspaceMath.ts
- src/components/canvas-3d/types.ts

## Final Note for Future AI Agents

Before making Canvas 3D edits:
- Read this file.
- Treat bridge methods and state snapshots as a contract between React and runtime.
- Keep changes minimal and contract-safe.
