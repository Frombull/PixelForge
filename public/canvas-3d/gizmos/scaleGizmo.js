import * as THREE from 'three';
import { GIZMO_CONFIG, COLORS } from '/canvas-3d/utils/constants.js';

export class ScaleGizmo {
    static create(position) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const { arrowLength: len, arrowRadius: rad, cubeSize } = GIZMO_CONFIG;
        
        group.add(this.createAxis('x', len, rad, cubeSize, COLORS.axisX));
        group.add(this.createAxis('y', len, rad, cubeSize, COLORS.axisY));
        group.add(this.createAxis('z', len, rad, cubeSize, COLORS.axisZ));
        
        return group;
    }
    
    static createAxis(axis, length, radius, cubeSize, color) {
        const group = new THREE.Group();
        group.userData.axis = axis;
        group.userData.isGizmo = true;
        
        const mat = new THREE.MeshBasicMaterial({ 
            color, depthTest: false, depthWrite: false 
        });
        
        const line = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, length, 8), mat
        );
        line.userData = { axis, isGizmo: true };
        line.renderOrder = 999;
        
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize), mat
        );
        cube.userData = { axis, isGizmo: true };
        cube.renderOrder = 999;
        
        if (axis === 'x') {
            line.rotation.z = -Math.PI / 2;
            line.position.x = length / 2;
            cube.position.x = length;
        } else if (axis === 'y') {
            line.position.y = length / 2;
            cube.position.y = length;
        } else {
            line.rotation.x = Math.PI / 2;
            line.position.z = length / 2;
            cube.position.z = length;
        }
        
        group.add(line, cube);
        return group;
    }
}