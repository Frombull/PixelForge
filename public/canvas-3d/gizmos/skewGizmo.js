import * as THREE from 'three';
import { GIZMO_CONFIG, COLORS } from '/canvas-3d/utils/constants.js';

export class SkewGizmo {
    static create(position) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const { arrowLength: len, arrowRadius: rad, diamondSize } = GIZMO_CONFIG;
        
        group.add(this.createAxis('xy', len, rad, diamondSize, COLORS.skewXY));
        group.add(this.createAxis('xz', len, rad, diamondSize, COLORS.skewXZ));
        group.add(this.createAxis('yz', len, rad, diamondSize, COLORS.skewYZ));
        
        return group;
    }
    
    static createAxis(axis, length, radius, diamondSize, color) {
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
        
        const diamond = new THREE.Mesh(
            new THREE.OctahedronGeometry(diamondSize, 0), mat
        );
        diamond.userData = { axis, isGizmo: true };
        diamond.renderOrder = 999;
        
        if (axis === 'xy') {
            line.rotation.z = -Math.PI / 4;
            line.position.set(
                length / 2 * Math.cos(-Math.PI / 4),
                length / 2 * Math.sin(-Math.PI / 4), 0
            );
            diamond.position.set(
                length * Math.cos(-Math.PI / 4),
                length * Math.sin(-Math.PI / 4), 0
            );
        } else if (axis === 'xz') {
            line.rotation.y = Math.PI / 4;
            line.rotation.z = -Math.PI / 2;
            line.position.set(
                length / 2 * Math.cos(Math.PI / 4), 0,
                length / 2 * Math.sin(Math.PI / 4)
            );
            diamond.position.set(
                length * Math.cos(Math.PI / 4), 0,
                length * Math.sin(Math.PI / 4)
            );
        } else {
            line.rotation.x = Math.PI / 4;
            line.position.set(0,
                length / 2 * Math.cos(Math.PI / 4),
                length / 2 * Math.sin(Math.PI / 4)
            );
            diamond.position.set(0,
                length * Math.cos(Math.PI / 4),
                length * Math.sin(Math.PI / 4)
            );
        }
        
        group.add(line, diamond);
        return group;
    }
}