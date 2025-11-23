import * as THREE from 'three';
import { TranslateGizmo } from '/canvas-3d/gizmos/translateGizmo.js';
import { RotateGizmo } from '/canvas-3d/gizmos/rotateGizmo.js';
import { ScaleGizmo } from '/canvas-3d/gizmos/scaleGizmo.js';
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
        
        if (!selectedObject) return;
        
        const position = selectedObject.position;
        
        switch (this.currentMode) {
            case MODES.TRANSLATE:
                this.gizmo = TranslateGizmo.create(position);
                break;
            case MODES.SCALE:
                this.gizmo = ScaleGizmo.create(position);
                break;
            case MODES.ROTATE:
                this.gizmo = RotateGizmo.create(position);
                break;
            case MODES.SKEW:
                this.gizmo = SkewGizmo.create(position);
                break;
        }
        
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
            const valid = intersects.find(i => 
                i.object.userData.isGizmo && !i.object.userData.isHighlightDisc
            );
            
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
        const axis = gizmoObject.userData.axis;
        
        if (this.currentMode === MODES.ROTATE) {
            if (!gizmoObject.userData.highlightDisc) {
                const discGeo = new THREE.CircleGeometry(1.5, 64);
                const discMat = new THREE.MeshBasicMaterial({
                    color: axis === 'x' ? 0xff0000 : axis === 'y' ? 0x00ff00 : 0x0000ff,
                    transparent: true,
                    opacity: 0.15,
                    side: THREE.DoubleSide,
                    depthTest: false,
                    depthWrite: false
                });
                const disc = new THREE.Mesh(discGeo, discMat);
                disc.renderOrder = 998;
                disc.userData.isHighlightDisc = true;
                
                if (axis === 'x') disc.rotation.y = Math.PI / 2;
                else if (axis === 'y') disc.rotation.x = Math.PI / 2;
                
                gizmoObject.add(disc);
                gizmoObject.userData.highlightDisc = disc;
            }
        } else {
            if (axis === 'x') gizmoObject.scale.set(1, 1.2, 1.2);
            else if (axis === 'y') gizmoObject.scale.set(1.2, 1, 1.2);
            else if (axis === 'z') gizmoObject.scale.set(1.2, 1.2, 1);
        }
    }
    
    clearHover() {
        if (!this.hoveredGizmo) return;
        
        if (this.currentMode === MODES.ROTATE) {
            if (this.hoveredGizmo.userData.highlightDisc) {
                this.hoveredGizmo.remove(this.hoveredGizmo.userData.highlightDisc);
                this.hoveredGizmo.userData.highlightDisc.geometry.dispose();
                this.hoveredGizmo.userData.highlightDisc.material.dispose();
                this.hoveredGizmo.userData.highlightDisc = null;
            }
        } else {
            this.hoveredGizmo.scale.set(1, 1, 1);
        }
        
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