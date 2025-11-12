import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let objects = [];
let selectedObject = null;
let gizmo = null;
let currentMode = 'translate';

let isDragging = false;
let dragAxis = null;
let dragPlane = null;
let objectStartPos = new THREE.Vector3();
let objectStartScale = new THREE.Vector3();
let intersectionStart = new THREE.Vector3();

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / (window.innerHeight - 60),
        0.1,
        1000
    );
    camera.position.set(6, 6, 6);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight - 60);
    container.appendChild(renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    // Grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    // World axis  
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.material.depthTest = false;        // Disabled to avoid z-fighting with grid
    scene.add(axesHelper);
    
    // OrbitControls (Blender style)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    
    // Blender-style controls
    controls.mouseButtons = {
        LEFT: null,                   // Disable left click for orbit
        MIDDLE: THREE.MOUSE.ROTATE,   // Middle mouse to rotate
        RIGHT: THREE.MOUSE.ROTATE     // Right mouse to rotate (same as middle)
    };
    
    // Enable pan with Shift + Middle mouse
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.keyPanSpeed = 7.0;
    
    // Event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    
    // Blender-style: Shift + Middle mouse for pan
    renderer.domElement.addEventListener('mousedown', (e) => {
        if (e.button === 1) { // Middle mouse
            if (e.shiftKey) {
                controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
            } else {
                controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
            }
        }
    });
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function addCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0.3,
        roughness: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        (Math.random() - 0.5) * 4,
        0.5,
        (Math.random() - 0.5) * 4
    );
    scene.add(mesh);
    objects.push(mesh);
}

function addCylinder() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0.3,
        roughness: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        (Math.random() - 0.5) * 4,
        0.5,
        (Math.random() - 0.5) * 4
    );
    scene.add(mesh);
    objects.push(mesh);
}

// Translate gizmos
function createTranslateGizmo(position) {
    const gizmoGroup = new THREE.Group();
    gizmoGroup.position.copy(position);
    
    const arrowLength = 1.5;
    const arrowRadius = 0.03;
    const coneHeight = 0.2;
    const coneRadius = 0.08;
    
    // X
    const xMat = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        depthTest: false,
        depthWrite: false
    });
    const xCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(arrowRadius, arrowRadius, arrowLength, 8),
        xMat
    );
    xCyl.rotation.z = -Math.PI / 2;
    xCyl.position.x = arrowLength / 2;
    xCyl.userData.axis = 'x';
    xCyl.userData.isGizmo = true;
    xCyl.renderOrder = 999;
    
    const xCone = new THREE.Mesh(
        new THREE.ConeGeometry(coneRadius, coneHeight, 8),
        xMat
    );
    xCone.rotation.z = -Math.PI / 2;
    xCone.position.x = arrowLength;
    xCone.userData.axis = 'x';
    xCone.userData.isGizmo = true;
    xCone.renderOrder = 999;
    
    // Y
    const yMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        depthTest: false,
        depthWrite: false
    });
    const yCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(arrowRadius, arrowRadius, arrowLength, 8),
        yMat
    );
    yCyl.position.y = arrowLength / 2;
    yCyl.userData.axis = 'y';
    yCyl.userData.isGizmo = true;
    yCyl.renderOrder = 999;
    
    const yCone = new THREE.Mesh(
        new THREE.ConeGeometry(coneRadius, coneHeight, 8),
        yMat
    );
    yCone.position.y = arrowLength;
    yCone.userData.axis = 'y';
    yCone.userData.isGizmo = true;
    yCone.renderOrder = 999;
    
    // Z
    const zMat = new THREE.MeshBasicMaterial({ 
        color: 0x0000ff,
        depthTest: false,
        depthWrite: false
    });
    const zCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(arrowRadius, arrowRadius, arrowLength, 8),
        zMat
    );
    zCyl.rotation.x = Math.PI / 2;
    zCyl.position.z = arrowLength / 2;
    zCyl.userData.axis = 'z';
    zCyl.userData.isGizmo = true;
    zCyl.renderOrder = 999;
    
    const zCone = new THREE.Mesh(
        new THREE.ConeGeometry(coneRadius, coneHeight, 8),
        zMat
    );
    zCone.rotation.x = Math.PI / 2;
    zCone.position.z = arrowLength;
    zCone.userData.axis = 'z';
    zCone.userData.isGizmo = true;
    zCone.renderOrder = 999;
    
    gizmoGroup.add(xCyl, xCone, yCyl, yCone, zCyl, zCone);
    return gizmoGroup;
}

// Scale gizmos 
function createScaleGizmo(position) {
    const gizmoGroup = new THREE.Group();
    gizmoGroup.position.copy(position);
    
    const lineLength = 1.5;
    const lineRadius = 0.03;
    const cubeSize = 0.15;
    
    // X
    const xMat = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        depthTest: false,
        depthWrite: false
    });
    const xLine = new THREE.Mesh(
        new THREE.CylinderGeometry(lineRadius, lineRadius, lineLength, 8),
        xMat
    );
    xLine.rotation.z = -Math.PI / 2;
    xLine.position.x = lineLength / 2;
    xLine.userData.axis = 'x';
    xLine.userData.isGizmo = true;
    xLine.renderOrder = 999;
    
    const xCube = new THREE.Mesh(
        new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
        xMat
    );
    xCube.position.x = lineLength;
    xCube.userData.axis = 'x';
    xCube.userData.isGizmo = true;
    xCube.renderOrder = 999;
    
    // Y
    const yMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        depthTest: false,
        depthWrite: false
    });
    const yLine = new THREE.Mesh(
        new THREE.CylinderGeometry(lineRadius, lineRadius, lineLength, 8),
        yMat
    );
    yLine.position.y = lineLength / 2;
    yLine.userData.axis = 'y';
    yLine.userData.isGizmo = true;
    yLine.renderOrder = 999;
    
    const yCube = new THREE.Mesh(
        new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
        yMat
    );
    yCube.position.y = lineLength;
    yCube.userData.axis = 'y';
    yCube.userData.isGizmo = true;
    yCube.renderOrder = 999;
    
    // Z
    const zMat = new THREE.MeshBasicMaterial({ 
        color: 0x0000ff,
        depthTest: false,
        depthWrite: false
    });
    const zLine = new THREE.Mesh(
        new THREE.CylinderGeometry(lineRadius, lineRadius, lineLength, 8),
        zMat
    );
    zLine.rotation.x = Math.PI / 2;
    zLine.position.z = lineLength / 2;
    zLine.userData.axis = 'z';
    zLine.userData.isGizmo = true;
    zLine.renderOrder = 999;
    
    const zCube = new THREE.Mesh(
        new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
        zMat
    );
    zCube.position.z = lineLength;
    zCube.userData.axis = 'z';
    zCube.userData.isGizmo = true;
    zCube.renderOrder = 999;
    
    gizmoGroup.add(xLine, xCube, yLine, yCube, zLine, zCube);
    return gizmoGroup;
}

function updateGizmo() {
    if (gizmo) {
        scene.remove(gizmo);
        gizmo = null;
    }
    
    if (selectedObject) {
        if (currentMode === 'translate') {
            gizmo = createTranslateGizmo(selectedObject.position);
        } else {
            gizmo = createScaleGizmo(selectedObject.position);
        }
        scene.add(gizmo);
    }
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('btn-translate').classList.toggle('active', mode === 'translate');
    document.getElementById('btn-scale').classList.toggle('active', mode === 'scale');
    updateGizmo();
}

// Event handlers
function onMouseDown(event) {
    // Ignore right mouse button for selection
    if (event.button === 2) {
        return;
    }
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Gizmo click 
    if (gizmo) {
        const gizmoIntersects = raycaster.intersectObjects(gizmo.children, true);
        if (gizmoIntersects.length > 0) {
            const intersect = gizmoIntersects[0];
            if (intersect.object.userData.isGizmo) {
                isDragging = true;
                dragAxis = intersect.object.userData.axis;
                objectStartPos.copy(selectedObject.position);
                objectStartScale.copy(selectedObject.scale);
                intersectionStart.copy(intersect.point);
                
                // Disable OrbitControls while dragging gizmo
                controls.enabled = false;
                
                // Drag plane
                createDragPlane(dragAxis);
                return;
            }
        }
    }
    
    // Obejct click
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        updateGizmo();
    } else {
        selectedObject = null;
        updateGizmo();
    }
}

function createDragPlane(axis) {
    const normal = new THREE.Vector3();
    if (axis === 'x') {
        normal.set(0, 1, 0);
    } else if (axis === 'y') {
        normal.set(1, 0, 1).normalize();
    } else {
        normal.set(1, 0, 0);
    }
    dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        normal,
        selectedObject.position
    );
}

function onMouseMove(event) {
    if (!isDragging || !selectedObject || !dragAxis) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, intersection);
    
    if (intersection) {
        if (currentMode === 'translate') {
            const delta = intersection.sub(intersectionStart);
            
            if (dragAxis === 'x') {
                selectedObject.position.x = objectStartPos.x + delta.x;
            } else if (dragAxis === 'y') {
                selectedObject.position.y = objectStartPos.y + delta.y;
            } else if (dragAxis === 'z') {
                selectedObject.position.z = objectStartPos.z + delta.z;
            }
        } else if (currentMode === 'scale') {
            // Calculate movement along the specific axis
            const delta = new THREE.Vector3().subVectors(intersection, intersectionStart);
            let axisMovement = 0;
            
            if (dragAxis === 'x') {
                axisMovement = delta.x;
            } else if (dragAxis === 'y') {
                axisMovement = delta.y;
            } else if (dragAxis === 'z') {
                axisMovement = delta.z;
            }
            
            // Scale factor based on axis movement
            const scaleFactor = 1 + axisMovement;
            
            if (dragAxis === 'x') {
                selectedObject.scale.x = Math.max(0.1, objectStartScale.x * scaleFactor);
            } else if (dragAxis === 'y') {
                selectedObject.scale.y = Math.max(0.1, objectStartScale.y * scaleFactor);
            } else if (dragAxis === 'z') {
                selectedObject.scale.z = Math.max(0.1, objectStartScale.z * scaleFactor);
            }
        }
        
        if (gizmo) {
            gizmo.position.copy(selectedObject.position);
        }
    }
}

function onMouseUp() {
    isDragging = false;
    dragAxis = null;
    dragPlane = null;
    controls.enabled = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / (window.innerHeight - 60);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 60);
}

function onKeyDown(event) {
    // F key - Focus on selected object
    if (event.key === 'f' || event.key === 'F') {
        if (selectedObject) {
            focusOnObject(selectedObject);
        }
    }
}

function focusOnObject(object) {
    const targetPosition = object.position.clone();
    controls.target.copy(targetPosition);
    
    // Calculate camera position to maintain current viewing angle
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const distance = camera.position.distanceTo(controls.target);
    
    camera.position.copy(targetPosition).sub(direction.multiplyScalar(distance));
    controls.update();
}

function resetCamera() {
    camera.position.set(6, 6, 6);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Buttons event listeners
document.getElementById('addCube').addEventListener('click', () => {
    addCube();
});

document.getElementById('addCylinder').addEventListener('click', () => {
    addCylinder();
});

document.getElementById('btn-translate').addEventListener('click', () => {
    setMode('translate');
});

document.getElementById('btn-scale').addEventListener('click', () => {
    setMode('scale');
});

document.getElementById('btn-reset-camera').addEventListener('click', () => {
    resetCamera();
});

// Disable right-click context menu on toolbar
document.getElementById('toolbar').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

init();