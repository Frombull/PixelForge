import * as THREE from 'three';
import { SceneManager } from '/canvas-3d/core/sceneManager.js';
import { ControlsManager } from '/canvas-3d/core/controlsManager.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { ObjectManager } from '/canvas-3d/objects/objectManager.js';
import { BooleanOperations } from '/canvas-3d/objects/booleanOperations.js';
import { GizmoManager } from '/canvas-3d/gizmos/gizmoManager.js';
import { APP_CONFIG, DEFAULT_VALUES, KEY_BINDINGS, MODES } from '/canvas-3d/utils/constants.js';
import { ViewportGizmo } from 'three-viewport-gizmo';

const STATE_EVENT_NAME = APP_CONFIG.stateEventName;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function hsvToRgb(h, s, v) {
    const sat = clamp(s, 0, 100) / 100;
    const val = clamp(v, 0, 100) / 100;
    const hue = ((h % 360) + 360) % 360;

    const c = val * sat;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = val - c;

    let rPrime = 0;
    let gPrime = 0;
    let bPrime = 0;

    if (hue < 60) {
        rPrime = c;
        gPrime = x;
    } else if (hue < 120) {
        rPrime = x;
        gPrime = c;
    } else if (hue < 180) {
        gPrime = c;
        bPrime = x;
    } else if (hue < 240) {
        gPrime = x;
        bPrime = c;
    } else if (hue < 300) {
        rPrime = x;
        bPrime = c;
    } else {
        rPrime = c;
        bPrime = x;
    }

    return {
        r: Math.round((rPrime + m) * 255),
        g: Math.round((gPrime + m) * 255),
        b: Math.round((bPrime + m) * 255)
    };
}

function rgbToHsv(r, g, b) {
    const red = clamp(r, 0, 255) / 255;
    const green = clamp(g, 0, 255) / 255;
    const blue = clamp(b, 0, 255) / 255;

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
        if (max === red) h = 60 * (((green - blue) / delta) % 6);
        else if (max === green) h = 60 * ((blue - red) / delta + 2);
        else h = 60 * ((red - green) / delta + 4);
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return {
        h: Math.round((h + 360) % 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };
}

class App {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.viewportGizmo = null;
        this.transformControls = null;

        this.wireframeVisible = false;
        this.snapToGrid = false;
        this.snapSize = DEFAULT_VALUES.snapSize;
        this.isSkewDragging = false;
        this.skewDragAxis = null;
        this.skewDragPlane = null;
        this.skewIntersectionStart = new THREE.Vector3();

        this.animationFrameId = null;
        this.isDestroyed = false;

        this.handleWindowResize = () => {
            this.sceneManager.onResize();
            this.viewportGizmo?.update();
        };
        this.handleWindowKeyDown = (e) => this.onKeyDown(e);

        this.init();
    }

    init() {
        const container = document.getElementById('canvas-container');
        if (!container) throw new Error('Canvas container nao encontrado.');

        this.sceneManager = new SceneManager(container);
        this.controlsManager = new ControlsManager(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        this.transformControls = new TransformControls(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        this.transformControls.setSpace('world');
        this.transformControls.setSize(APP_CONFIG.transformControlSize);
        this.transformControls.enabled = false;
        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.controlsManager.controls.enabled = !event.value;
        });
        this.transformControls.addEventListener('objectChange', () => {
            this.emitState();
        });
        this.sceneManager.scene.add(this.transformControls);

        this.viewportGizmo = new ViewportGizmo(
            this.sceneManager.camera,
            this.sceneManager.renderer,
            {
                container: this.sceneManager.container,
                placement: APP_CONFIG.viewportGizmo.placement,
                size: APP_CONFIG.viewportGizmo.size,
                offset: APP_CONFIG.viewportGizmo.offset
            }
        );
        this.viewportGizmo.attachControls(this.controlsManager.controls);

        this.objectManager = new ObjectManager(this.sceneManager.scene);
        this.booleanOps = new BooleanOperations(this.objectManager.objects);
        this.gizmoManager = new GizmoManager(this.sceneManager.scene);

        this.setupEventListeners();
        this.animate();
        this.emitState();
    }

    setupEventListeners() {
        const canvas = this.sceneManager.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        window.addEventListener('resize', this.handleWindowResize);
        window.addEventListener('keydown', this.handleWindowKeyDown);
    }

    getGridColorHex() {
        const material = this.sceneManager.gridHelper?.material;

        if (Array.isArray(material) && material[0]?.color) {
            return `#${material[0].color.getHexString()}`;
        }

        if (material?.color) {
            return `#${material.color.getHexString()}`;
        }

        return APP_CONFIG.defaultGridColorHex;
    }

    getSelectedSnapshot() {
        const obj = this.objectManager.selectedObject;
        if (!obj) return null;

        const rotation = {
            x: obj.rotation.x * 180 / Math.PI,
            y: obj.rotation.y * 180 / Math.PI,
            z: obj.rotation.z * 180 / Math.PI
        };
        const skew = this.objectManager.getSkew(obj);

        const material = obj.material;
        const color = material?.color || new THREE.Color(APP_CONFIG.defaultMaterialColorHex);
        const rgb = {
            r: Math.round(color.r * 255),
            g: Math.round(color.g * 255),
            b: Math.round(color.b * 255)
        };

        return {
            uuid: obj.uuid,
            name: obj.userData.name || obj.userData.type || 'Object',
            position: {
                x: obj.position.x,
                y: obj.position.y,
                z: obj.position.z
            },
            scale: {
                x: obj.scale.x,
                y: obj.scale.y,
                z: obj.scale.z
            },
            rotation,
            skew,
            material: {
                hex: `#${color.getHexString()}`,
                rgb,
                hsv: rgbToHsv(rgb.r, rgb.g, rgb.b),
                alpha: Math.round((material?.opacity ?? 1) * 100)
            }
        };
    }

    getSettingsSnapshot() {
        const bgColor = this.sceneManager.getBackgroundColorHex
            ? this.sceneManager.getBackgroundColorHex()
            : '#ffffff';

        return {
            gridVisible: this.sceneManager.gridHelper?.visible ?? true,
            axesVisible: this.sceneManager.axesHelper?.visible ?? true,
            wireframeVisible: this.wireframeVisible,
            snapToGrid: this.snapToGrid,
            snapSize: this.snapSize,
            backgroundColor: bgColor,
            gridColor: this.getGridColorHex(),
            nearClip: this.sceneManager.perspectiveCamera.near,
            farClip: this.sceneManager.perspectiveCamera.far
        };
    }

    getStateSnapshot() {
        return {
            mode: this.gizmoManager.currentMode,
            isOrthographic: !this.sceneManager.isPerspective,
            isCullingViewEnabled: this.sceneManager.showSecondViewport,
            selectedUuid: this.objectManager.selectedObject?.uuid || null,
            objects: this.objectManager.objects.map(obj => ({
                uuid: obj.uuid,
                name: obj.userData.name || obj.userData.type || 'Object',
                type: obj.userData.type || 'Object'
            })),
            selected: this.getSelectedSnapshot(),
            settings: this.getSettingsSnapshot()
        };
    }

    applyTransformSnapSettings() {
        if (!this.transformControls) return;

        if (this.snapToGrid) {
            this.transformControls.setTranslationSnap(this.snapSize);
        } else {
            this.transformControls.setTranslationSnap(null);
        }
    }

    setMaterialWireframe(material, visible) {
        if (!material) return;

        if (Array.isArray(material)) {
            material.forEach((entry) => this.setMaterialWireframe(entry, visible));
            return;
        }

        if (typeof material.wireframe === 'boolean') {
            material.wireframe = visible;
            material.needsUpdate = true;
        }
    }

    applyWireframeVisibility() {
        this.objectManager.objects.forEach((obj) => {
            this.setMaterialWireframe(obj.material, this.wireframeVisible);
        });
    }

    setPositionWithSnap(object, x, y, z) {
        let nextX = x;
        let nextY = y;
        let nextZ = z;

        if (this.snapToGrid) {
            nextX = Math.round(nextX / this.snapSize) * this.snapSize;
            nextY = Math.round(nextY / this.snapSize) * this.snapSize;
            nextZ = Math.round(nextZ / this.snapSize) * this.snapSize;
        }

        object.position.set(nextX, nextY, nextZ);
    }

    startSkewDrag(object, axis, intersectPoint) {
        if (!object) return;

        this.isSkewDragging = true;
        this.skewDragAxis = axis;
        this.skewIntersectionStart.copy(intersectPoint);

        const normal = new THREE.Vector3();
        if (axis === 'xy') normal.set(0, 0, 1);
        else if (axis === 'xz') normal.set(0, 1, 0);
        else normal.set(1, 0, 0);

        this.skewDragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, object.position);
    }

    stopSkewDrag() {
        this.isSkewDragging = false;
        this.skewDragAxis = null;
        this.skewDragPlane = null;
    }

    handleSkewDrag(object, intersection) {
        const delta = new THREE.Vector3().subVectors(intersection, this.skewIntersectionStart);
        const skew = this.objectManager.getSkew(object);

        if (this.skewDragAxis === 'xy') skew.xy = delta.y * APP_CONFIG.skewDragFactor;
        else if (this.skewDragAxis === 'xz') skew.xz = delta.z * APP_CONFIG.skewDragFactor;
        else if (this.skewDragAxis === 'yz') skew.yz = delta.z * APP_CONFIG.skewDragFactor;

        this.objectManager.setSkew(object, skew);
        this.objectManager.applySkew(object);
    }

    emitState() {
        window.dispatchEvent(new CustomEvent(STATE_EVENT_NAME, {
            detail: this.getStateSnapshot()
        }));
    }

    addObject(kind) {
        if (kind === 'cube') this.objectManager.addCube();
        else if (kind === 'cylinder') this.objectManager.addCylinder();
        else if (kind === 'subtractCube') this.objectManager.addSubtractCube();
        else if (kind === 'zFighting') this.objectManager.addZFightingDemo();
        this.applyWireframeVisibility();
        this.emitState();
    }

    setMode(mode) {
        this.gizmoManager.setMode(mode);

        if (mode === MODES.SKEW) {
            this.transformControls.detach();
            this.transformControls.enabled = false;
            this.gizmoManager.update(this.objectManager.selectedObject);
        } else {
            this.gizmoManager.remove();
            this.transformControls.setMode(mode);
            this.applyTransformSnapSettings();

            if (this.objectManager.selectedObject) {
                this.transformControls.attach(this.objectManager.selectedObject);
                this.transformControls.enabled = true;
            } else {
                this.transformControls.detach();
                this.transformControls.enabled = false;
            }
        }

        this.emitState();
    }

    selectObjectByUuid(uuid) {
        const obj = this.objectManager.objects.find(item => item.uuid === uuid);
        if (!obj) return;

        this.objectManager.select(obj);
        this.updateSelection();
    }

    focusObjectByUuid(uuid) {
        const obj = this.objectManager.objects.find(item => item.uuid === uuid);
        if (!obj) return;

        this.controlsManager.focusOnObject(obj, this.sceneManager.camera);
    }

    deleteSelected() {
        const deleted = this.objectManager.deleteSelected();
        if (!deleted) return false;

        this.updateSelection();
        return true;
    }

    deleteObjectByUuid(uuid) {
        this.selectObjectByUuid(uuid);
        this.deleteSelected();
    }

    resetCamera() {
        this.sceneManager.resetCamera(this.controlsManager.controls);
        this.emitState();
    }

    setCameraAxisView(axis) {
        const controls = this.controlsManager.controls;
        const camera = this.sceneManager.camera;
        const target = controls.target.clone();
        const distance = Math.max(camera.position.distanceTo(target), 0.001);

        const axisDirection = new THREE.Vector3();
        if (axis === 'front') axisDirection.set(0, 1, 0);
        else if (axis === 'right') axisDirection.set(1, 0, 0);
        else if (axis === 'top') axisDirection.set(0, 0, 1);
        else return;

        camera.position.copy(target).add(axisDirection.multiplyScalar(distance));
        camera.lookAt(target);
        controls.target.copy(target);
        controls.update();

        if (this.viewportGizmo) {
            this.viewportGizmo.update();
        }

        this.emitState();
    }

    toggleCameraType() {
        const isOrtho = this.sceneManager.toggleCameraType(this.controlsManager.controls);
        this.transformControls.camera = this.sceneManager.camera;
        if (this.viewportGizmo) {
            this.viewportGizmo.camera = this.sceneManager.camera;
            this.viewportGizmo.update();
        }
        this.emitState();
        return isOrtho;
    }

    toggleCullingView() {
        const show = this.sceneManager.toggleSecondViewport();
        this.emitState();
        return show;
    }

    setGridVisible(visible) {
        this.sceneManager.setGridVisible(visible);
        this.emitState();
    }

    setAxesVisible(visible) {
        this.sceneManager.setAxesVisible(visible);
        this.emitState();
    }

    setSnapEnabled(enabled) {
        this.snapToGrid = enabled;
        this.applyTransformSnapSettings();
        this.emitState();
    }

    setWireframeVisible(visible) {
        this.wireframeVisible = Boolean(visible);
        this.applyWireframeVisibility();
        this.emitState();
    }

    setSnapSize(value) {
        const next = Number(value);
        if (!Number.isFinite(next) || next <= 0) return;

        this.snapSize = next;
        this.applyTransformSnapSettings();
        this.emitState();
    }

    setBackgroundColor(hex) {
        this.sceneManager.setBackgroundColor(hex);
        this.emitState();
    }

    setGridColor(hex) {
        this.sceneManager.setGridColor(hex);
        this.emitState();
    }

    setNearClip(value) {
        const near = Number(value);
        if (!Number.isFinite(near) || near <= 0) return;

        this.sceneManager.setClipPlanes(near, undefined);
        this.emitState();
    }

    setFarClip(value) {
        const far = Number(value);
        if (!Number.isFinite(far) || far <= 0) return;

        this.sceneManager.setClipPlanes(undefined, far);
        this.emitState();
    }

    resetSetting(target) {
        if (target === 'near-clip') {
            this.sceneManager.setClipPlanes(DEFAULT_VALUES.nearClip, undefined);
        } else if (target === 'far-clip') {
            this.sceneManager.setClipPlanes(undefined, DEFAULT_VALUES.farClip);
        } else if (target === 'snap-size') {
            this.snapSize = DEFAULT_VALUES.snapSize;
            this.applyTransformSnapSettings();
        }

        this.emitState();
    }

    updateSelectedTransform(field, value) {
        const obj = this.objectManager.selectedObject;
        if (!obj) return;

        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return;

        if (field.startsWith('pos-')) {
            const axis = field.split('-')[1];
            const current = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
            current[axis] = parsed;
            this.setPositionWithSnap(obj, current.x, current.y, current.z);
        } else if (field.startsWith('scale-')) {
            const axis = field.split('-')[1];
            obj.scale[axis] = Math.max(APP_CONFIG.minScale, parsed);
        } else if (field.startsWith('rot-')) {
            const axis = field.split('-')[1];
            obj.rotation[axis] = parsed * Math.PI / 180;
        } else if (field.startsWith('skew-')) {
            const axes = field.split('-')[1];
            const skew = this.objectManager.getSkew(obj);
            skew[axes] = parsed;
            this.objectManager.setSkew(obj, skew);
            this.objectManager.applySkew(obj);
        }

        this.emitState();
    }

    resetTransformField(target) {
        const obj = this.objectManager.selectedObject;
        if (!obj) return;

        if (target.startsWith('pos-')) {
            const axis = target.split('-')[1];
            obj.position[axis] = 0;
        } else if (target.startsWith('scale-')) {
            const axis = target.split('-')[1];
            obj.scale[axis] = 1;
        } else if (target.startsWith('rot-')) {
            const axis = target.split('-')[1];
            obj.rotation[axis] = 0;
        } else if (target.startsWith('skew-')) {
            const axes = target.split('-')[1];
            const skew = this.objectManager.getSkew(obj);
            skew[axes] = 0;
            this.objectManager.setSkew(obj, skew);
            this.objectManager.applySkew(obj);
        }

        this.emitState();
    }

    setSelectedColorHex(hex) {
        const obj = this.objectManager.selectedObject;
        if (!obj?.material) return;

        const value = String(hex || '').trim();
        const normalized = value.startsWith('#') ? value : `#${value}`;
        if (!/^#[0-9A-F]{6}$/i.test(normalized)) return;

        obj.material.color.set(normalized);
        obj.material.needsUpdate = true;
        this.emitState();
    }

    setSelectedColorHSV(h, s, v) {
        const obj = this.objectManager.selectedObject;
        if (!obj?.material) return;

        const hue = Number(h);
        const sat = Number(s);
        const val = Number(v);
        if (!Number.isFinite(hue) || !Number.isFinite(sat) || !Number.isFinite(val)) return;

        const rgb = hsvToRgb(hue, sat, val);
        obj.material.color.setRGB(rgb.r / 255, rgb.g / 255, rgb.b / 255);
        obj.material.needsUpdate = true;
        this.emitState();
    }

    setSelectedAlpha(alphaPercent) {
        const obj = this.objectManager.selectedObject;
        if (!obj?.material) return;

        const alpha = clamp(Number(alphaPercent), 0, 100) / 100;
        obj.material.transparent = alpha < 1;
        obj.material.opacity = alpha;
        obj.material.needsUpdate = true;
        this.emitState();
    }

    updateMouse(e) {
        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        this.updateMouse(e);
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        if (this.gizmoManager.currentMode === MODES.SKEW) {
            const gizmoHits = this.gizmoManager.raycast(this.raycaster);
            if (gizmoHits.length > 0 && gizmoHits[0].object.userData.isGizmo) {
                const axis = gizmoHits[0].object.userData.axis;
                this.startSkewDrag(
                    this.objectManager.selectedObject,
                    axis,
                    gizmoHits[0].point
                );
                this.controlsManager.disable();
                return;
            }
        } else if (this.transformControls?.axis || this.transformControls?.dragging) {
            return;
        }

        const hits = this.objectManager.raycastObjects(this.raycaster);
        if (hits.length > 0) {
            this.objectManager.select(hits[0].object);
            this.updateSelection();
        } else {
            this.objectManager.deselect();
            this.updateSelection();
        }
    }

    onMouseMove(e) {
        this.updateMouse(e);

        if (this.gizmoManager.currentMode === MODES.SKEW && this.isSkewDragging) {
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
            const intersection = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.skewDragPlane, intersection);

            if (intersection) {
                const obj = this.objectManager.selectedObject;
                if (!obj) return;

                this.handleSkewDrag(obj, intersection);

                this.gizmoManager.updatePosition(obj.position);
                this.emitState();
            }
        } else {
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
            if (this.gizmoManager.currentMode === MODES.SKEW) {
                const hoveredAxis = this.gizmoManager.checkHover(this.raycaster);

                if (hoveredAxis) {
                    this.sceneManager.renderer.domElement.style.cursor = 'pointer';
                    this.objectManager.clearHover();
                } else {
                    const hits = this.objectManager.raycastObjects(this.raycaster);
                    if (hits.length > 0) {
                        this.objectManager.setHovered(hits[0].object);
                    } else {
                        this.objectManager.clearHover();
                    }
                    this.sceneManager.renderer.domElement.style.cursor =
                        this.objectManager.hoveredObject ? 'pointer' : 'default';
                }
            } else {
                if (this.transformControls?.axis || this.transformControls?.dragging) {
                    this.objectManager.clearHover();
                    return;
                }

                const hits = this.objectManager.raycastObjects(this.raycaster);
                if (hits.length > 0) {
                    this.objectManager.setHovered(hits[0].object);
                } else {
                    this.objectManager.clearHover();
                }
                this.sceneManager.renderer.domElement.style.cursor =
                    this.objectManager.hoveredObject ? 'pointer' : 'default';
            }
        }
    }

    onMouseUp() {
        if (this.gizmoManager.currentMode !== MODES.SKEW) return;

        this.stopSkewDrag();
        this.controlsManager.enable();
        this.emitState();
    }

    onKeyDown(e) {
        if (document.activeElement?.tagName === 'INPUT') return;

        const key = e.key.toLowerCase();
        const code = e.code;

        if (key === KEY_BINDINGS.FOCUS_SELECTED && this.objectManager.selectedObject) {
            this.controlsManager.focusOnObject(
                this.objectManager.selectedObject,
                this.sceneManager.camera
            );
        }
        else if (key === KEY_BINDINGS.ROTATE_MODE) this.setMode(MODES.ROTATE);
        else if (key === KEY_BINDINGS.SCALE_MODE) this.setMode(MODES.SCALE);
        else if (key === KEY_BINDINGS.TRANSLATE_MODE) this.setMode(MODES.TRANSLATE);
        else if (key === KEY_BINDINGS.SKEW_MODE) this.setMode(MODES.SKEW);
        else if (code === KEY_BINDINGS.VIEW_FRONT) this.setCameraAxisView('front');
        else if (code === KEY_BINDINGS.VIEW_RIGHT) this.setCameraAxisView('right');
        else if (code === KEY_BINDINGS.VIEW_TOP) this.setCameraAxisView('top');
        else if (key === KEY_BINDINGS.DELETE_SELECTED && this.objectManager.selectedObject) {
            this.deleteSelected();
        }
    }

    updateSelection() {
        if (this.gizmoManager.currentMode === MODES.SKEW) {
            this.transformControls.detach();
            this.transformControls.enabled = false;
            this.gizmoManager.update(this.objectManager.selectedObject);
        } else {
            this.gizmoManager.remove();

            if (this.objectManager.selectedObject) {
                this.transformControls.attach(this.objectManager.selectedObject);
                this.transformControls.enabled = true;
            } else {
                this.transformControls.detach();
                this.transformControls.enabled = false;
            }
        }

        this.emitState();
    }

    animate() {
        if (this.isDestroyed) return;

        this.animationFrameId = requestAnimationFrame(() => this.animate());
        if (!this.viewportGizmo?.animating) {
            this.controlsManager.update();
        }
        this.booleanOps.update();
        this.sceneManager.render();
        this.viewportGizmo?.render();
    }

    destroy() {
        this.isDestroyed = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        window.removeEventListener('resize', this.handleWindowResize);
        window.removeEventListener('keydown', this.handleWindowKeyDown);

        this.transformControls?.detach();
        this.transformControls?.dispose?.();
        this.transformControls = null;
        this.controlsManager?.controls?.dispose?.();
        this.viewportGizmo?.dispose();
        this.viewportGizmo = null;

        if (this.sceneManager?.secondRenderer?.domElement) {
            this.sceneManager.secondRenderer.domElement.remove();
            this.sceneManager.secondRenderer.dispose();
        }

        if (this.sceneManager?.renderer?.domElement) {
            this.sceneManager.renderer.domElement.remove();
            this.sceneManager.renderer.dispose();
        }
    }
}

let appInstance = null;

export function mountCanvas3DApp() {
    if (appInstance) return appInstance;
    appInstance = new App();
    return appInstance;
}

export function unmountCanvas3DApp() {
    if (!appInstance) return;
    appInstance.destroy();
    appInstance = null;
}

window.Canvas3DBridge = {
    mount: mountCanvas3DApp,
    unmount: unmountCanvas3DApp,
    getState: () => appInstance?.getStateSnapshot() || null,

    addObject: (kind) => appInstance?.addObject(kind),
    setMode: (mode) => appInstance?.setMode(mode),

    selectObject: (uuid) => appInstance?.selectObjectByUuid(uuid),
    focusObject: (uuid) => appInstance?.focusObjectByUuid(uuid),
    deleteSelected: () => appInstance?.deleteSelected(),
    deleteObject: (uuid) => appInstance?.deleteObjectByUuid(uuid),

    resetCamera: () => appInstance?.resetCamera(),
    toggleCameraType: () => appInstance?.toggleCameraType(),
    toggleCullingView: () => appInstance?.toggleCullingView(),

    setGridVisible: (visible) => appInstance?.setGridVisible(visible),
    setAxesVisible: (visible) => appInstance?.setAxesVisible(visible),
    setWireframeVisible: (visible) => appInstance?.setWireframeVisible(visible),
    setSnapEnabled: (enabled) => appInstance?.setSnapEnabled(enabled),
    setSnapSize: (size) => appInstance?.setSnapSize(size),
    setBackgroundColor: (hex) => appInstance?.setBackgroundColor(hex),
    setGridColor: (hex) => appInstance?.setGridColor(hex),
    setNearClip: (value) => appInstance?.setNearClip(value),
    setFarClip: (value) => appInstance?.setFarClip(value),
    resetSetting: (target) => appInstance?.resetSetting(target),

    updateSelectedTransform: (field, value) => appInstance?.updateSelectedTransform(field, value),
    resetTransformField: (target) => appInstance?.resetTransformField(target),
    setSelectedColorHex: (hex) => appInstance?.setSelectedColorHex(hex),
    setSelectedColorHSV: (h, s, v) => appInstance?.setSelectedColorHSV(h, s, v),
    setSelectedAlpha: (alphaPercent) => appInstance?.setSelectedAlpha(alphaPercent)
};
