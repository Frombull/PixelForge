import * as THREE from 'three';
import { CAMERA_CONFIG, DEFAULT_VALUES, COLORS } from '/canvas-3d/utils/constants.js';

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.perspectiveCamera = null;
        this.orthographicCamera = null;
        this.camera = null;
        this.renderer = null;
        this.secondCamera = null;
        this.secondRenderer = null;
        this.gridHelper = null;
        this.cameraHelper = null;
        this.isPerspective = true;
        this.showSecondViewport = false;
        
        this.init();
    }
    
    init() {
        this.createScene();
        this.createCameras();
        this.createRenderer();
        this.createSecondViewport();
        this.createLights();
        this.createGrid();
        this.createAxes();
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.background);
    }
    
    createCameras() {
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        const { fov, near, far, position } = CAMERA_CONFIG;
        
        // Perspective
        this.perspectiveCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.perspectiveCamera.position.set(position.x, position.y, position.z);
        this.perspectiveCamera.lookAt(0, 0, 0);
        
        // Orthographic
        const frustumSize = DEFAULT_VALUES.frustumSize;
        this.orthographicCamera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2,
            frustumSize / 2, frustumSize / -2, near, far
        );
        this.orthographicCamera.position.set(position.x, position.y, position.z);
        this.orthographicCamera.lookAt(0, 0, 0);
        
        this.camera = this.perspectiveCamera;
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.domElement.classList.add('main-canvas3d');
        this.container.appendChild(this.renderer.domElement);
    }
    
    createSecondViewport() {
        this.secondCamera = new THREE.PerspectiveCamera(70, 1, 0.01, 100);
        this.secondCamera.position.set(6, 6, 6);
        this.secondCamera.lookAt(0, 0, 0);
        
        this.secondRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.secondRenderer.domElement.classList.add('culling-preview-canvas');
        
        const el = this.secondRenderer.domElement;
        Object.assign(el.style, {
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            border: '1px solid rgba(125, 207, 255, 0.7)',
            borderRadius: '6px',
            background: '#0f1017',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35)',
            display: 'none',
            zIndex: '40',
            pointerEvents: 'none'
        });

        this.updateSecondViewportSize();
        this.container.appendChild(el);
    }

    updateSecondViewportSize() {
        if (!this.secondRenderer || !this.secondCamera) return;

        const rect = this.container.getBoundingClientRect();
        const width = Math.round(Math.min(360, Math.max(220, rect.width * 0.28)));
        const height = Math.round((width * 9) / 16);

        this.secondRenderer.setSize(width, height);
        this.secondCamera.aspect = width / height;
        this.secondCamera.updateProjectionMatrix();
    }
    
    createLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(5, 10, 5);
        this.scene.add(ambient, directional);
    }
    
    createGrid() {
        this.gridHelper = new THREE.GridHelper(
            DEFAULT_VALUES.gridSize, DEFAULT_VALUES.gridSize,
            COLORS.gridMain, COLORS.gridSecondary
        );
        this.scene.add(this.gridHelper);
    }
    
    createAxes() {
        const axes = new THREE.AxesHelper(5);
        axes.material.depthTest = false;
        this.scene.add(axes);
    }
    
    toggleCameraType(controls) {
        this.isPerspective = !this.isPerspective;
        const pos = this.camera.position.clone();
        const target = controls.target.clone();
        
        this.camera = this.isPerspective ? this.perspectiveCamera : this.orthographicCamera;
        this.camera.position.copy(pos);
        this.camera.lookAt(target);
        
        controls.object = this.camera;
        controls.target.copy(target);
        controls.update();
        this.onResize();
        
        return !this.isPerspective;
    }
    
    toggleSecondViewport() {
        this.showSecondViewport = !this.showSecondViewport;
        this.secondRenderer.domElement.style.display = this.showSecondViewport ? 'block' : 'none';

        if (this.showSecondViewport) {
            this.updateSecondViewportSize();
        }
        
        if (!this.showSecondViewport && this.cameraHelper) {
            this.scene.remove(this.cameraHelper);
            this.cameraHelper = null;
        }
        return this.showSecondViewport;
    }
    
    updateCameraHelper() {
        if (this.cameraHelper) this.scene.remove(this.cameraHelper);
        this.cameraHelper = new THREE.CameraHelper(this.camera);
        this.cameraHelper.material.linewidth = 2;
        this.scene.add(this.cameraHelper);
        this.cameraHelper.update();
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
        if (this.showSecondViewport) {
            this.updateCameraHelper();
            this.secondRenderer.render(this.scene, this.secondCamera);
        }
    }
    
    onResize() {
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;

        if (this.isPerspective) {
            this.perspectiveCamera.aspect = aspect;
            this.perspectiveCamera.updateProjectionMatrix();
        } else {
            const f = DEFAULT_VALUES.frustumSize;
            Object.assign(this.orthographicCamera, {
                left: f * aspect / -2, right: f * aspect / 2,
                top: f / 2, bottom: f / -2
            });
            this.orthographicCamera.updateProjectionMatrix();
        }

        this.renderer.setSize(rect.width, rect.height);
        this.updateSecondViewportSize();
    }
    
    resetCamera(controls) {
        const { position } = CAMERA_CONFIG;
        this.camera.position.set(position.x, position.y, position.z);
        this.camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
    }
    
    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
    }
    
    setGridColor(color) {
        if (this.gridHelper) {
            this.gridHelper.material.color.set(color);
            this.gridHelper.material.needsUpdate = true;
        }
    }
    
    setGridVisible(visible) {
        if (this.gridHelper) this.gridHelper.visible = visible;
    }
    
    setClipPlanes(near, far) {
        [this.perspectiveCamera, this.orthographicCamera].forEach(cam => {
            if (near !== undefined) cam.near = near;
            if (far !== undefined) cam.far = far;
            cam.updateProjectionMatrix();
        });
    }
}