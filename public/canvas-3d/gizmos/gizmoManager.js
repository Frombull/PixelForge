import { SkewGizmo } from '/canvas-3d/gizmos/skewGizmo.js';
import { MODES } from '/canvas-3d/utils/constants.js';

export class GizmoManager {
    constructor(scene) {
        this.scene = scene;
        this.gizmo = null;
        this.hoveredGizmo = null;
        this.currentMode = MODES.TRANSLATE;
    }
    
    update(selectedObject) {
        this.remove();
        
        if (!selectedObject || this.currentMode !== MODES.SKEW) return;

        this.gizmo = SkewGizmo.create(selectedObject.position);
        
        if (this.gizmo) {
            this.scene.add(this.gizmo);
        }
    }
    
    remove() {
        if (this.gizmo) {
            this.scene.remove(this.gizmo);
            this.gizmo = null;
        }
    }
    
    setMode(mode) {
        this.currentMode = mode;
    }
    
    updatePosition(position) {
        if (this.gizmo) {
            this.gizmo.position.copy(position);
        }
    }
    
    checkHover(raycaster) {
        if (!this.gizmo) {
            this.clearHover();
            return null;
        }
        
        const intersects = raycaster.intersectObjects(this.gizmo.children, true);
        
        if (intersects.length > 0) {
            const valid = intersects.find(i => i.object.userData.isGizmo);
            
            if (valid) {
                let axisGroup = valid.object;
                while (axisGroup.parent && axisGroup.parent !== this.gizmo) {
                    axisGroup = axisGroup.parent;
                }
                
                if (this.hoveredGizmo !== axisGroup) {
                    this.clearHover();
                    this.hoveredGizmo = axisGroup;
                    this.highlight(axisGroup);
                }
                return axisGroup.userData.axis;
            }
        }
        
        this.clearHover();
        return null;
    }
    
    highlight(gizmoObject) {
        gizmoObject.scale.setScalar(1.15);
    }
    
    clearHover() {
        if (!this.hoveredGizmo) return;

        this.hoveredGizmo.scale.set(1, 1, 1);
        
        this.hoveredGizmo = null;
    }
    
    raycast(raycaster) {
        if (!this.gizmo) return [];
        return raycaster.intersectObjects(this.gizmo.children, true);
    }
    
    get isHovered() {
        return this.hoveredGizmo !== null;
    }
}