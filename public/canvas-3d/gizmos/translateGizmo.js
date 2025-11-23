import * as THREE from 'three';
import { GIZMO_CONFIG, COLORS } from '/canvas-3d/utils/constants.js';

export class TranslateGizmo {
    static create(position) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const { arrowLength, arrowRadius, coneHeight, coneRadius } = GIZMO_CONFIG;
        
        group.add(this.createAxis('x', arrowLength, arrowRadius, coneHeight, coneRadius, COLORS.axisX));
        group.add(this.createAxis('y', arrowLength, arrowRadius, coneHeight, coneRadius, COLORS.axisY));
        group.add(this.createAxis('z', arrowLength, arrowRadius, coneHeight, coneRadius, COLORS.axisZ));
        
        return group;
    }
    
    static createAxis(axis, length, radius, coneH, coneR, color) {
        const group = new THREE.Group();
        group.userData.axis = axis;
        group.userData.isGizmo = true;
        
        const mat = new THREE.MeshBasicMaterial({ 
            color, depthTest: false, depthWrite: false 
        });
        
        const cyl = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, length, 8), mat
        );
        cyl.userData = { axis, isGizmo: true };
        cyl.renderOrder = 999;
        
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(coneR, coneH, 8), mat
        );
        cone.userData = { axis, isGizmo: true };
        cone.renderOrder = 999;
        
        if (axis === 'x') {
            cyl.rotation.z = -Math.PI / 2;
            cyl.position.x = length / 2;
            cone.rotation.z = -Math.PI / 2;
            cone.position.x = length;
        } else if (axis === 'y') {
            cyl.position.y = length / 2;
            cone.position.y = length;
        } else {
            cyl.rotation.x = Math.PI / 2;
            cyl.position.z = length / 2;
            cone.rotation.x = Math.PI / 2;
            cone.position.z = length;
        }
        
        group.add(cyl, cone);
        return group;
    }
}