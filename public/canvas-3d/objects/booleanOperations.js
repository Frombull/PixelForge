import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

export class BooleanOperations {
    constructor(objects) {
        this.objects = objects;
        this.evaluator = new Evaluator();
    }
    
    update() {
        this.objects.forEach(obj => {
            if (obj.userData.isSubtractCube) {
                this.applySubtraction(obj);
            }
        });
    }
    
    applySubtraction(subtractCube) {
        if (!subtractCube.userData.isSubtractCube) return;
        
        const hasMoved = !subtractCube.position.equals(subtractCube.userData.lastPosition);
        const hasRotated = !subtractCube.quaternion.equals(subtractCube.userData.lastRotation);
        const hasScaled = !subtractCube.scale.equals(subtractCube.userData.lastScale);
        
        if (!hasMoved && !hasRotated && !hasScaled) return;
        
        subtractCube.userData.lastPosition.copy(subtractCube.position);
        subtractCube.userData.lastRotation.copy(subtractCube.quaternion);
        subtractCube.userData.lastScale.copy(subtractCube.scale);
        
        const subtractBox = new THREE.Box3().setFromObject(subtractCube);
        
        this.objects.forEach(obj => {
            if (obj === subtractCube || obj.userData.isSubtractCube) return;
            
            const objBox = new THREE.Box3().setFromObject(obj);
            
            if (subtractBox.intersectsBox(objBox)) {
                this.performSubtraction(subtractCube, obj);
            } else {
                this.restoreOriginal(subtractCube, obj);
            }
        });
    }
    
    performSubtraction(subtractCube, target) {
        try {
            if (!subtractCube.userData.subtractedObjects.has(target)) {
                subtractCube.userData.subtractedObjects.set(target, {
                    geometry: target.geometry.clone(),
                    position: target.position.clone(),
                    rotation: target.rotation.clone(),
                    scale: target.scale.clone()
                });
            }
            
            const original = subtractCube.userData.subtractedObjects.get(target);
            
            const targetBrush = new Brush(original.geometry);
            targetBrush.position.copy(original.position);
            targetBrush.rotation.copy(original.rotation);
            targetBrush.scale.copy(original.scale);
            targetBrush.quaternion.copy(target.quaternion);
            targetBrush.updateMatrixWorld();
            
            const subtractBrush = new Brush(subtractCube.geometry);
            subtractBrush.position.copy(subtractCube.position);
            subtractBrush.rotation.copy(subtractCube.rotation);
            subtractBrush.scale.copy(subtractCube.scale);
            subtractBrush.quaternion.copy(subtractCube.quaternion);
            subtractBrush.updateMatrixWorld();
            
            const result = this.evaluator.evaluate(targetBrush, subtractBrush, SUBTRACTION);
            
            if (result?.geometry) {
                target.geometry.dispose();
                target.geometry = result.geometry;
                target.position.set(0, 0, 0);
                target.rotation.set(0, 0, 0);
                target.scale.set(1, 1, 1);
                target.updateMatrixWorld();
            }
        } catch (error) {
            console.warn('Boolean subtraction failed:', error);
        }
    }
    
    restoreOriginal(subtractCube, target) {
        if (subtractCube.userData.subtractedObjects.has(target)) {
            const original = subtractCube.userData.subtractedObjects.get(target);
            target.geometry.dispose();
            target.geometry = original.geometry.clone();
            target.position.copy(original.position);
            target.rotation.copy(original.rotation);
            target.scale.copy(original.scale);
            target.updateMatrixWorld();
            subtractCube.userData.subtractedObjects.delete(target);
        }
    }
}