import * as THREE from 'three';
import { COLORS } from '/canvas-3d/utils/constants.js';

export class ObjectManager {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.selectedObject = null;
        this.hoveredObject = null;
        this.skewValues = new Map();
    }
    
    addObject(mesh) {
        this.scene.add(mesh);
        this.objects.push(mesh);
        this.skewValues.set(mesh, { xy: 0, xz: 0, yx: 0, yz: 0, zx: 0, zy: 0 });
        return mesh;
    }
    
    addCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            metalness: 0.3,
            roughness: 0.7
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0.5, 0.5, 0.5);
        return this.addObject(mesh);
    }
    
    addCylinder() {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            metalness: 0.3,
            roughness: 0.7
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(1.5, 0.5, 1.5);
        return this.addObject(mesh);
    }
    
    addSubtractCube() {
        const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const material = new THREE.MeshStandardMaterial({
            color: COLORS.subtract,
            metalness: 0.3,
            roughness: 0.7,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-0.5, 0.5, -0.5);
        
        mesh.userData.isSubtractCube = true;
        mesh.userData.subtractedObjects = new Map();
        mesh.userData.lastPosition = mesh.position.clone();
        mesh.userData.lastRotation = mesh.quaternion.clone();
        mesh.userData.lastScale = mesh.scale.clone();
        
        return this.addObject(mesh);
    }
    
    addZFightingDemo() {
        const pos = new THREE.Vector3(0, 0.5, 0);
        
        const geo1 = new THREE.BoxGeometry(1.00001, 1, 1);
        const mat1 = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.3, roughness: 0.7 });
        const mesh1 = new THREE.Mesh(geo1, mat1);
        mesh1.position.copy(pos);
        this.addObject(mesh1);
        
        const geo2 = new THREE.BoxGeometry(1, 1, 1);
        const mat2 = new THREE.MeshStandardMaterial({ color: 0x0000ff, metalness: 0.3, roughness: 0.7 });
        const mesh2 = new THREE.Mesh(geo2, mat2);
        mesh2.position.copy(pos);
        this.addObject(mesh2);
    }
    
    select(object) {
        if (this.hoveredObject === object) {
            this.removeHighlight(this.hoveredObject);
            this.hoveredObject = null;
        }
        this.selectedObject = object;
        return object;
    }
    
    deselect() {
        this.selectedObject = null;
    }
    
    deleteSelected() {
        if (!this.selectedObject) return false;
        
        if (this.hoveredObject === this.selectedObject) {
            this.removeHighlight(this.hoveredObject);
            this.hoveredObject = null;
        }
        
        this.scene.remove(this.selectedObject);
        
        if (this.selectedObject.geometry) this.selectedObject.geometry.dispose();
        if (this.selectedObject.material) this.selectedObject.material.dispose();
        if (this.selectedObject.userData.originalGeometry) {
            this.selectedObject.userData.originalGeometry.dispose();
        }
        
        const index = this.objects.indexOf(this.selectedObject);
        if (index > -1) this.objects.splice(index, 1);
        
        this.skewValues.delete(this.selectedObject);
        this.selectedObject = null;
        
        return true;
    }
    
    addHighlight(object) {
        if (object === this.selectedObject) return;
        if (object.userData.outlineMesh) return;
        
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.highlight,
            side: THREE.BackSide,
            transparent: true,
            opacity: 1
        });
        
        const outlineMesh = new THREE.Mesh(object.geometry, outlineMaterial);
        outlineMesh.scale.multiplyScalar(1.02);
        outlineMesh.renderOrder = 0;
        
        object.add(outlineMesh);
        object.userData.outlineMesh = outlineMesh;
    }
    
    removeHighlight(object) {
        if (!object?.userData.outlineMesh) return;
        object.remove(object.userData.outlineMesh);
        object.userData.outlineMesh.material.dispose();
        object.userData.outlineMesh = null;
    }
    
    setHovered(object) {
        if (this.hoveredObject !== object) {
            if (this.hoveredObject) this.removeHighlight(this.hoveredObject);
            this.hoveredObject = object;
            if (object) this.addHighlight(object);
        }
    }
    
    clearHover() {
        if (this.hoveredObject) {
            this.removeHighlight(this.hoveredObject);
            this.hoveredObject = null;
        }
    }
    
    getSkew(object) {
        return this.skewValues.get(object) || { xy: 0, xz: 0, yx: 0, yz: 0, zx: 0, zy: 0 };
    }
    
    setSkew(object, skew) {
        this.skewValues.set(object, skew);
    }
    
    applySkew(object) {
        const skew = this.skewValues.get(object);
        if (!skew) return;
        
        const matrix = new THREE.Matrix4();
        matrix.set(
            1,        skew.yx, skew.zx, 0,
            skew.xy,  1,       skew.zy, 0,
            skew.xz,  skew.yz, 1,       0,
            0,        0,       0,       1
        );
        
        if (!object.userData.originalGeometry) {
            object.userData.originalGeometry = object.geometry.clone();
        }
        
        object.geometry.dispose();
        object.geometry = object.userData.originalGeometry.clone();
        object.geometry.applyMatrix4(matrix);
        object.geometry.computeVertexNormals();
    }
    
    raycastObjects(raycaster) {
        return raycaster.intersectObjects(this.objects);
    }
}