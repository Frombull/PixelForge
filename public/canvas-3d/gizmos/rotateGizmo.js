import * as THREE from 'three';
import { GIZMO_CONFIG, COLORS } from '/canvas-3d/utils/constants.js';

export class RotateGizmo {
    static create(position) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const { ringRadius, tubeRadius } = GIZMO_CONFIG;
        
        group.add(this.createRing('x', ringRadius, tubeRadius, COLORS.axisX));
        group.add(this.createRing('y', ringRadius, tubeRadius, COLORS.axisY));
        group.add(this.createRing('z', ringRadius, tubeRadius, COLORS.axisZ));
        
        return group;
    }
    
    static createRing(axis, radius, tube, color) {
        const group = new THREE.Group();
        group.userData.axis = axis;
        group.userData.isGizmo = true;
        
        const mat = new THREE.MeshBasicMaterial({ 
            color, depthTest: false, depthWrite: false 
        });
        
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, tube, 16, 64), mat
        );
        ring.userData = { axis, isGizmo: true };
        ring.renderOrder = 999;
        
        if (axis === 'x') ring.rotation.y = Math.PI / 2;
        else if (axis === 'y') ring.rotation.x = Math.PI / 2;
        
        group.add(ring);
        return group;
    }
}