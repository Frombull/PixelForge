import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ControlsManager {
    constructor(camera, domElement) {
        this.controls = new OrbitControls(camera, domElement);
        this.domElement = domElement;
        this.init();
    }
    
    init() {
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        
        this.controls.mouseButtons = {
            LEFT: null,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.ROTATE
        };
        
        this.controls.enablePan = true;
        this.controls.panSpeed = 1.0;
        this.controls.keyPanSpeed = 7.0;
        this.controls.maxZoom = 2;
        this.controls.minZoom = 0.8;
        
        this.setupPanOnShift();
    }
    
    setupPanOnShift() {
        this.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                this.controls.mouseButtons.MIDDLE = e.shiftKey 
                    ? THREE.MOUSE.PAN 
                    : THREE.MOUSE.ROTATE;
            }
        });
    }
    
    update() {
        this.controls.update();
    }
    
    enable() {
        this.controls.enabled = true;
    }
    
    disable() {
        this.controls.enabled = false;
    }
    
    setCamera(camera) {
        this.controls.object = camera;
    }
    
    get target() {
        return this.controls.target;
    }
    
    focusOnObject(object, camera) {
        const targetPosition = object.position.clone();
        this.controls.target.copy(targetPosition);
        
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const distance = camera.position.distanceTo(this.controls.target);
        
        camera.position.copy(targetPosition).sub(direction.multiplyScalar(distance));
        this.controls.update();
    }
}