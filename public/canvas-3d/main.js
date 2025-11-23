import * as THREE from 'three';
import { SceneManager } from '/canvas-3d/core/sceneManager.js';
import { ControlsManager } from '/canvas-3d/core/controlsManager.js';
import { ObjectManager } from '/canvas-3d/objects/objectManager.js';
import { BooleanOperations } from '/canvas-3d/objects/booleanOperations.js';
import { GizmoManager } from '/canvas-3d/gizmos/gizmoManager.js';
import { TransformHandler } from '/canvas-3d/transforms/transformHandler.js';
import { PositionPanel } from '/canvas-3d/ui/positionPanel.js';
import { ColorPickerUI } from '/canvas-3d/ui/colorPicker.js';
import { SettingsMenu } from '/canvas-3d/ui/settingsMenu.js';
import { MODES } from '/canvas-3d/utils/constants.js';

class App {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }
    
    init() {
        const container = document.getElementById('canvas-container');
        
        // Core
        this.sceneManager = new SceneManager(container);
        this.controlsManager = new ControlsManager(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        
        // Objects & Transforms
        this.objectManager = new ObjectManager(this.sceneManager.scene);
        this.booleanOps = new BooleanOperations(this.objectManager.objects);
        this.gizmoManager = new GizmoManager(this.sceneManager.scene);
        this.transformHandler = new TransformHandler();
        
        // UI
        this.positionPanel = new PositionPanel(
            this.transformHandler, this.objectManager, this.gizmoManager
        );
        this.colorPicker = new ColorPickerUI(this.objectManager);
        this.settingsMenu = new SettingsMenu(this.sceneManager, this.transformHandler);
        
        this.setupEventListeners();
        this.setupToolbar();
        this.animate();
    }
    
    setupEventListeners() {
        const canvas = this.sceneManager.renderer.domElement;
        
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        window.addEventListener('resize', () => this.sceneManager.onResize());
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        document.getElementById('toolbar').addEventListener('contextmenu', e => e.preventDefault());
        document.getElementById('close-instructions')?.addEventListener('click', () => {
            document.getElementById('instructions')?.classList.add('hidden');
        });
        
        this.setupResetButtons();
    }
    
    setupToolbar() {
        // Setup dropdowns
        this.setupDropdowns();
        
        // Add objects
        document.getElementById('addCube')?.addEventListener('click', () => this.objectManager.addCube());
        document.getElementById('addCylinder')?.addEventListener('click', () => this.objectManager.addCylinder());
        document.getElementById('addSphere')?.addEventListener('click', () => {
            console.log('Adicionar Esfera - Em breve!');
        });
        document.getElementById('addCone')?.addEventListener('click', () => {
            console.log('Adicionar Cone - Em breve!');
        });
        document.getElementById('addTorus')?.addEventListener('click', () => {
            console.log('Adicionar Torus - Em breve!');
        });
        document.getElementById('addZFighting')?.addEventListener('click', () => this.objectManager.addZFightingDemo());
        document.getElementById('addSubtractCube')?.addEventListener('click', () => this.objectManager.addSubtractCube());
        document.getElementById('addSkewDemo')?.addEventListener('click', () => {});
        
        // Mode buttons
        document.getElementById('btn-translate')?.addEventListener('click', () => this.setMode(MODES.TRANSLATE));
        document.getElementById('btn-scale')?.addEventListener('click', () => this.setMode(MODES.SCALE));
        document.getElementById('btn-rotate')?.addEventListener('click', () => this.setMode(MODES.ROTATE));
        document.getElementById('btn-skew')?.addEventListener('click', () => this.setMode(MODES.SKEW));
        
        // Camera/View
        document.getElementById('btn-reset-camera')?.addEventListener('click', () => 
            this.sceneManager.resetCamera(this.controlsManager.controls)
        );
        document.getElementById('btn-toggle-camera')?.addEventListener('click', () => {
            const isOrtho = this.sceneManager.toggleCameraType(this.controlsManager.controls);
            document.getElementById('btn-toggle-camera')?.classList.toggle('active', isOrtho);
        });
        document.getElementById('btn-toggle-culling')?.addEventListener('click', () => {
            const show = this.sceneManager.toggleSecondViewport();
            document.getElementById('btn-toggle-culling')?.classList.toggle('active', show);
        });
    }
    
    setupDropdowns() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('open');
                });
            }
        });
        
        // Setup primitive dropdown
        const primitiveBtn = document.getElementById('addPrimitiveBtn');
        const primitiveDropdown = primitiveBtn?.closest('.dropdown');
        primitiveBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            primitiveDropdown?.classList.toggle('open');
            // Close other dropdowns
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                if (dropdown !== primitiveDropdown) {
                    dropdown.classList.remove('open');
                }
            });
        });
        
        // Setup demo dropdown
        const demoBtn = document.getElementById('demoBtn');
        const demoDropdown = demoBtn?.closest('.dropdown');
        demoBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            demoDropdown?.classList.toggle('open');
            // Close other dropdowns
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                if (dropdown !== demoDropdown) {
                    dropdown.classList.remove('open');
                }
            });
        });
        
        // Close dropdown when clicking on an item
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                item.closest('.dropdown')?.classList.remove('open');
            });
        });
    }
    
    setupResetButtons() {
        document.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.dataset.reset;
                
                // Settings resets
                if (['near-clip', 'far-clip', 'snap-size'].includes(target)) {
                    this.settingsMenu.resetValue(target);
                    return;
                }
                
                const obj = this.objectManager.selectedObject;
                if (!obj) return;
                
                // Position resets
                if (target.startsWith('pos-')) {
                    const axis = target.split('-')[1];
                    obj.position[axis] = 0;
                    this.gizmoManager.updatePosition(obj.position);
                }
                // Scale resets
                else if (target.startsWith('scale-')) {
                    const axis = target.split('-')[1];
                    obj.scale[axis] = 1;
                }
                // Rotation resets
                else if (target.startsWith('rot-')) {
                    const axis = target.split('-')[1];
                    this.transformHandler.resetRotation(axis, obj);
                }
                // Skew resets
                else if (target.startsWith('skew-')) {
                    const axes = target.split('-')[1];
                    const skew = this.objectManager.getSkew(obj);
                    skew[axes] = 0;
                    this.objectManager.setSkew(obj, skew);
                    this.objectManager.applySkew(obj);
                }
                
                this.positionPanel.update();
            });
        });
    }
    
    setMode(mode) {
        this.gizmoManager.setMode(mode);
        
        document.getElementById('btn-translate')?.classList.toggle('active', mode === MODES.TRANSLATE);
        document.getElementById('btn-scale')?.classList.toggle('active', mode === MODES.SCALE);
        document.getElementById('btn-rotate')?.classList.toggle('active', mode === MODES.ROTATE);
        document.getElementById('btn-skew')?.classList.toggle('active', mode === MODES.SKEW);
        
        this.gizmoManager.update(this.objectManager.selectedObject);
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
        
        // Check gizmo first
        const gizmoHits = this.gizmoManager.raycast(this.raycaster);
        if (gizmoHits.length > 0 && gizmoHits[0].object.userData.isGizmo) {
            const axis = gizmoHits[0].object.userData.axis;
            this.transformHandler.startDrag(
                this.objectManager.selectedObject,
                axis,
                gizmoHits[0].point,
                this.gizmoManager.currentMode
            );
            this.controlsManager.disable();
            return;
        }
        
        // Check objects
        const hits = this.objectManager.raycastObjects(this.raycaster);
        if (hits.length > 0) {
            this.objectManager.select(hits[0].object);
            this.transformHandler.resetWorldRotations();
            this.updateSelection();
        } else {
            this.objectManager.deselect();
            this.updateSelection();
        }
    }
    
    onMouseMove(e) {
        this.updateMouse(e);
        
        if (this.transformHandler.isDragging) {
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
            const intersection = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.transformHandler.dragPlane, intersection);
            
            if (intersection) {
                const obj = this.objectManager.selectedObject;
                const mode = this.gizmoManager.currentMode;
                
                if (mode === MODES.TRANSLATE) {
                    this.transformHandler.handleTranslate(obj, intersection);
                } else if (mode === MODES.SCALE) {
                    this.transformHandler.handleScale(obj, intersection);
                } else if (mode === MODES.ROTATE) {
                    this.transformHandler.handleRotate(obj, intersection);
                } else if (mode === MODES.SKEW) {
                    this.transformHandler.handleSkew(obj, intersection, this.objectManager);
                }
                
                this.gizmoManager.updatePosition(obj.position);
            }
        } else {
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
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
        }
    }
    
    onMouseUp() {
        this.transformHandler.stopDrag();
        this.controlsManager.enable();
    }
    
    onKeyDown(e) {
        if (document.activeElement.tagName === 'INPUT') return;
        
        const key = e.key.toLowerCase();
        
        if (key === 'f' && this.objectManager.selectedObject) {
            this.controlsManager.focusOnObject(
                this.objectManager.selectedObject, 
                this.sceneManager.camera
            );
        }
        else if (key === 'r') this.setMode(MODES.ROTATE);
        else if (key === 's') this.setMode(MODES.SCALE);
        else if (key === 't') this.setMode(MODES.TRANSLATE);
        else if (key === 'k') this.setMode(MODES.SKEW);
        else if (key === 'delete' && this.objectManager.selectedObject) {
            this.objectManager.deleteSelected();
            this.updateSelection();
        }
    }
    
    updateSelection() {
        this.gizmoManager.update(this.objectManager.selectedObject);
        
        if (this.objectManager.selectedObject) {
            this.positionPanel.show();
            this.positionPanel.update();
            this.colorPicker.updateFromObject();
        } else {
            this.positionPanel.hide();
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controlsManager.update();
        
        if (this.objectManager.selectedObject && 
            !this.positionPanel.isUpdating && 
            document.activeElement.type !== 'number') {
            this.positionPanel.update();
        }
        
        this.booleanOps.update();
        this.sceneManager.render();
    }
}

new App();