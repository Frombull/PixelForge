import * as THREE from 'three';
import { MODES } from '/canvas-3d/utils/constants.js';

export class TransformHandler {
    constructor() {
        this.isDragging = false;
        this.dragAxis = null;
        this.dragPlane = null;
        this.objectStartPos = new THREE.Vector3();
        this.objectStartScale = new THREE.Vector3();
        this.objectStartQuaternion = new THREE.Quaternion();
        this.intersectionStart = new THREE.Vector3();
        
        this.worldRotationX = 0;
        this.worldRotationY = 0;
        this.worldRotationZ = 0;
        
        this.snapToGrid = false;
        this.gridSize = 0.5;
    }
    
    startDrag(object, axis, intersectPoint, mode) {
        this.isDragging = true;
        this.dragAxis = axis;
        this.objectStartPos.copy(object.position);
        this.objectStartScale.copy(object.scale);
        this.objectStartQuaternion.copy(object.quaternion);
        this.intersectionStart.copy(intersectPoint);
        
        this.createDragPlane(axis, object.position, mode);
    }
    
    stopDrag() {
        this.isDragging = false;
        this.dragAxis = null;
        this.dragPlane = null;
    }
    
    createDragPlane(axis, position, mode) {
        const normal = new THREE.Vector3();
        
        if (mode === MODES.ROTATE) {
            if (axis === 'x') normal.set(1, 0, 0);
            else if (axis === 'y') normal.set(0, 1, 0);
            else normal.set(0, 0, 1);
        } else if (mode === MODES.SKEW) {
            if (axis === 'xy') normal.set(0, 0, 1);
            else if (axis === 'xz') normal.set(0, 1, 0);
            else if (axis === 'yz') normal.set(1, 0, 0);
        } else {
            if (axis === 'x') normal.set(0, 1, 0);
            else if (axis === 'y') normal.set(1, 0, 1).normalize();
            else normal.set(1, 0, 0);
        }
        
        this.dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, position);
    }
    
    handleTranslate(object, intersection) {
        const delta = intersection.clone().sub(this.intersectionStart);
        
        let x = this.objectStartPos.x + delta.x;
        let y = this.objectStartPos.y + delta.y;
        let z = this.objectStartPos.z + delta.z;
        
        if (this.snapToGrid) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
            z = Math.round(z / this.gridSize) * this.gridSize;
        }
        
        if (this.dragAxis === 'x') object.position.x = x;
        else if (this.dragAxis === 'y') object.position.y = y;
        else if (this.dragAxis === 'z') object.position.z = z;
    }
    
    handleScale(object, intersection) {
        const delta = new THREE.Vector3().subVectors(intersection, this.intersectionStart);
        let movement = 0;
        
        if (this.dragAxis === 'x') movement = delta.x;
        else if (this.dragAxis === 'y') movement = delta.y;
        else if (this.dragAxis === 'z') movement = delta.z;
        
        const factor = 1 + movement;
        
        if (this.dragAxis === 'x') object.scale.x = Math.max(0.1, this.objectStartScale.x * factor);
        else if (this.dragAxis === 'y') object.scale.y = Math.max(0.1, this.objectStartScale.y * factor);
        else if (this.dragAxis === 'z') object.scale.z = Math.max(0.1, this.objectStartScale.z * factor);
    }
    
    handleRotate(object, intersection) {
        const objPos = object.position;
        const startVec = new THREE.Vector3().subVectors(this.intersectionStart, objPos);
        const currentVec = new THREE.Vector3().subVectors(intersection, objPos);
        
        object.quaternion.copy(this.objectStartQuaternion);
        
        let angle = 0;
        let worldAxis;
        
        if (this.dragAxis === 'x') {
            const s2D = new THREE.Vector2(startVec.y, startVec.z);
            const c2D = new THREE.Vector2(currentVec.y, currentVec.z);
            angle = Math.atan2(c2D.y, c2D.x) - Math.atan2(s2D.y, s2D.x);
            worldAxis = new THREE.Vector3(1, 0, 0);
            this.worldRotationX += angle;
        } else if (this.dragAxis === 'y') {
            const s2D = new THREE.Vector2(startVec.x, startVec.z);
            const c2D = new THREE.Vector2(currentVec.x, currentVec.z);
            angle = Math.atan2(s2D.y, s2D.x) - Math.atan2(c2D.y, c2D.x);
            worldAxis = new THREE.Vector3(0, 1, 0);
            this.worldRotationY += angle;
        } else {
            const s2D = new THREE.Vector2(startVec.x, startVec.y);
            const c2D = new THREE.Vector2(currentVec.x, currentVec.y);
            angle = Math.atan2(c2D.y, c2D.x) - Math.atan2(s2D.y, s2D.x);
            worldAxis = new THREE.Vector3(0, 0, 1);
            this.worldRotationZ += angle;
        }
        
        const rotQuat = new THREE.Quaternion().setFromAxisAngle(worldAxis, angle);
        object.quaternion.premultiply(rotQuat);
    }
    
    handleSkew(object, intersection, objectManager) {
        const delta = new THREE.Vector3().subVectors(intersection, this.intersectionStart);
        const skew = objectManager.getSkew(object);
        
        if (this.dragAxis === 'xy') skew.xy = delta.y * 0.5;
        else if (this.dragAxis === 'xz') skew.xz = delta.z * 0.5;
        else if (this.dragAxis === 'yz') skew.yz = delta.z * 0.5;
        
        objectManager.setSkew(object, skew);
        objectManager.applySkew(object);
    }
    
    setPosition(object, x, y, z) {
        if (this.snapToGrid) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
            z = Math.round(z / this.gridSize) * this.gridSize;
        }
        object.position.set(x, y, z);
    }
    
    setRotationFromDegrees(object, rx, ry, rz) {
        this.worldRotationX = rx * Math.PI / 180;
        this.worldRotationY = ry * Math.PI / 180;
        this.worldRotationZ = rz * Math.PI / 180;
        this.applyWorldRotations(object);
    }
    
    applyWorldRotations(object) {
        object.quaternion.identity();
        
        const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), this.worldRotationX);
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), this.worldRotationY);
        const qZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), this.worldRotationZ);
        
        object.quaternion.multiply(qX).multiply(qY).multiply(qZ);
    }
    
    resetRotation(axis, object) {
        if (axis === 'x') this.worldRotationX = 0;
        else if (axis === 'y') this.worldRotationY = 0;
        else if (axis === 'z') this.worldRotationZ = 0;
        this.applyWorldRotations(object);
    }
    
    resetWorldRotations() {
        this.worldRotationX = 0;
        this.worldRotationY = 0;
        this.worldRotationZ = 0;
    }
    
    getRotationDegrees() {
        return {
            x: this.worldRotationX * 180 / Math.PI,
            y: this.worldRotationY * 180 / Math.PI,
            z: this.worldRotationZ * 180 / Math.PI
        };
    }
}