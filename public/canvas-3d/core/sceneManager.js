import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
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
        this.axesHelper = null;
        this.cameraHelper = null;
        this.sky = null;
        this.backgroundColor = new THREE.Color(COLORS.background);
        this.isPerspective = true;
        this.showSecondViewport = false;
        
        this.init();
    }

    getEffectivePixelRatio() {
        return Math.min(window.devicePixelRatio || 1, 2);
    }
    
    init() {
        this.createScene();
        this.createCameras();
        this.createRenderer();
        this.createSecondViewport();
        this.createLights();
        this.createSky();
        this.createGrid();
        this.createAxes();
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = this.backgroundColor.clone();
        this.scene.fog = new THREE.Fog(this.backgroundColor.clone(), 20, 90);
    }

    createSky() {
        this.sky = new Sky();
        this.sky.scale.setScalar(this.perspectiveCamera.far * 0.9);

        const uniforms = this.sky.material.uniforms;
        uniforms.turbidity.value = 0.3;
        uniforms.rayleigh.value = 103;
        uniforms.mieCoefficient.value = 0.005;
        uniforms.mieDirectionalG.value = 0.86;

        const sun = new THREE.Vector3();
        const phi = THREE.MathUtils.degToRad(88);
        const theta = THREE.MathUtils.degToRad(180);
        sun.setFromSphericalCoords(1, phi, theta);
        uniforms.sunPosition.value.copy(sun);

        this.scene.add(this.sky);
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
        this.renderer.setPixelRatio(this.getEffectivePixelRatio());
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.domElement.classList.add('main-canvas3d');
        this.container.appendChild(this.renderer.domElement);
    }
    
    createSecondViewport() {
        this.secondCamera = new THREE.PerspectiveCamera(70, 1, 0.01, 100);
        this.secondCamera.position.set(6, 6, 6);
        this.secondCamera.lookAt(0, 0, 0);
        
        this.secondRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.secondRenderer.setPixelRatio(this.getEffectivePixelRatio());
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
        this.axesHelper = new THREE.AxesHelper(5);
        if (this.axesHelper.material) this.axesHelper.material.depthTest = false;
        this.scene.add(this.axesHelper);
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

    normalizeRenderMethod(renderMethod) {
        if (renderMethod === 'painter' || renderMethod === 'reversePainter') {
            return renderMethod;
        }

        return 'zbuffer';
    }

    setMaterialDepthMode(material, useDepthBuffer) {
        if (!material) return;

        if (Array.isArray(material)) {
            material.forEach((entry) => this.setMaterialDepthMode(entry, useDepthBuffer));
            return;
        }

        let changed = false;

        if (typeof material.depthTest === 'boolean') {
            if (material.depthTest !== useDepthBuffer) {
                material.depthTest = useDepthBuffer;
                changed = true;
            }
        }

        if (typeof material.depthWrite === 'boolean') {
            if (material.depthWrite !== useDepthBuffer) {
                material.depthWrite = useDepthBuffer;
                changed = true;
            }
        }

        if (changed) {
            material.needsUpdate = true;
        }
    }

    applyRenderMethod(objects, camera, renderMethod) {
        const list = Array.isArray(objects) ? objects : [];
        const method = this.normalizeRenderMethod(renderMethod);
        const useDepthBuffer = method === 'zbuffer';

        list.forEach((object) => {
            object.traverse((node) => {
                if (!node.isMesh) return;

                this.setMaterialDepthMode(node.material, useDepthBuffer);

                if (useDepthBuffer) {
                    node.renderOrder = 0;
                }
            });
        });

        if (useDepthBuffer || !camera || list.length === 0) {
            return;
        }

        const cameraPos = new THREE.Vector3();
        const worldA = new THREE.Vector3();
        const worldB = new THREE.Vector3();
        camera.getWorldPosition(cameraPos);

        const sorted = [...list].sort((a, b) => {
            const distA = cameraPos.distanceToSquared(a.getWorldPosition(worldA));
            const distB = cameraPos.distanceToSquared(b.getWorldPosition(worldB));

            if (method === 'painter') {
                return distB - distA;
            }

            return distA - distB;
        });

        sorted.forEach((object, index) => {
            const baseOrder = index * 10;
            object.renderOrder = baseOrder;
            object.traverse((node) => {
                if (node !== object) {
                    node.renderOrder = baseOrder + 1;
                }
            });
        });
    }
    
    render(objects = [], renderMethod = 'zbuffer') {
        this.applyRenderMethod(objects, this.camera, renderMethod);

        if (this.sky) {
            this.sky.position.copy(this.camera.position);
        }

        this.renderer.render(this.scene, this.camera);
        if (this.showSecondViewport) {
            this.updateCameraHelper();
            this.applyRenderMethod(objects, this.secondCamera, renderMethod);
            if (this.sky) {
                this.sky.position.copy(this.secondCamera.position);
            }
            this.secondRenderer.render(this.scene, this.secondCamera);
            if (this.sky) {
                this.sky.position.copy(this.camera.position);
            }
        }
    }
    
    onResize() {
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        const pixelRatio = this.getEffectivePixelRatio();

        this.renderer.setPixelRatio(pixelRatio);
        if (this.secondRenderer) {
            this.secondRenderer.setPixelRatio(pixelRatio);
        }

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
        this.backgroundColor.set(color);

        if (this.scene.background?.isColor) {
            this.scene.background.copy(this.backgroundColor);
        } else {
            this.scene.background = this.backgroundColor.clone();
        }

        if (this.scene.fog?.isFog) {
            this.scene.fog.color.copy(this.backgroundColor);
        }
    }

    getBackgroundColorHex() {
        return `#${this.backgroundColor.getHexString()}`;
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

    setAxesVisible(visible) {
        if (this.axesHelper) this.axesHelper.visible = visible;
    }
    
    setClipPlanes(near, far) {
        [this.perspectiveCamera, this.orthographicCamera].forEach(cam => {
            if (near !== undefined) cam.near = near;
            if (far !== undefined) cam.far = far;
            cam.updateProjectionMatrix();
        });

        const skyRadius = Math.max(10, this.perspectiveCamera.far * 0.9);
        if (this.sky) {
            this.sky.scale.setScalar(skyRadius);
        }

        if (this.scene.fog?.isFog) {
            this.scene.fog.near = Math.max(5, skyRadius * 0.22);
            this.scene.fog.far = skyRadius;
        }
    }
}