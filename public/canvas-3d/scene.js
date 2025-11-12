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
let objectStartRotation = new THREE.Euler();
let objectStartQuaternion = new THREE.Quaternion();
let intersectionStart = new THREE.Vector3();
let rotationStartAngle = 0;

// Track world-space rotations separately
let worldRotationX = 0;
let worldRotationY = 0;
let worldRotationZ = 0;

// Position panel elements
let positionPanel;
let posXInput, posYInput, posZInput;
let scaleXInput, scaleYInput, scaleZInput;
let rotXInput, rotYInput, rotZInput;
let isUpdatingInputs = false;

// Color picker elements
let colorPicker;
let colorRInput, colorGInput, colorBInput;
let colorHInput, colorSInput, colorVInput;
let colorAlphaInput, alphaValueSpan;
let colorHexInput;
let currentColorMode = 'rgb';
let isUpdatingColor = false;

// Hover state
let hoveredGizmo = null;

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
    camera.position.set(3, 3, 3);
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
    
    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    
    controls.mouseButtons = {
        LEFT: null,                   // Disable left click for orbit
        MIDDLE: THREE.MOUSE.ROTATE,   // Middle mouse to rotate
        RIGHT: THREE.MOUSE.ROTATE     // Right mouse to rotate (same as middle)
    };
    
    // Pan with Shift + Middle mouse
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.keyPanSpeed = 7.0;
    
    // Position panel
    positionPanel = document.getElementById('position-panel');
    posXInput = document.getElementById('pos-x');
    posYInput = document.getElementById('pos-y');
    posZInput = document.getElementById('pos-z');
    scaleXInput = document.getElementById('scale-x');
    scaleYInput = document.getElementById('scale-y');
    scaleZInput = document.getElementById('scale-z');
    rotXInput = document.getElementById('rot-x');
    rotYInput = document.getElementById('rot-y');
    rotZInput = document.getElementById('rot-z');
    
    // Color picker initialization
    initColorPicker();
    
    // Position input listeners
    posXInput.addEventListener('change', onPositionInputChange);
    posYInput.addEventListener('change', onPositionInputChange);
    posZInput.addEventListener('change', onPositionInputChange);
    
    // Scale input listeners
    scaleXInput.addEventListener('change', onScaleInputChange);
    scaleYInput.addEventListener('change', onScaleInputChange);
    scaleZInput.addEventListener('change', onScaleInputChange);
    
    // Update on Enter key
    [posXInput, posYInput, posZInput].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onPositionInputChange();
            }
        });
    });
    
    [scaleXInput, scaleYInput, scaleZInput].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onScaleInputChange();
            }
        });
    });
    
    // Rotation input listeners
    rotXInput.addEventListener('change', onRotationInputChange);
    rotYInput.addEventListener('change', onRotationInputChange);
    rotZInput.addEventListener('change', onRotationInputChange);
    
    [rotXInput, rotYInput, rotZInput].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onRotationInputChange();
            }
        });
    });
    
    // Event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    
    // Shift + Middle mouse for pan
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
    
    // Update position panel if object is selected and no input is focused
    if (selectedObject && !isUpdatingInputs && document.activeElement.type !== 'number') {
        updatePositionPanel();
    }
    
    // Check for gizmo hover
    if (!isDragging) {
        checkGizmoHover();
    }
    
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

function addZFightingDemo() {
    const position = new THREE.Vector3(0, 0.5, 0);
    
    // First cube red
    const geometry1 = new THREE.BoxGeometry(1.00001, 1, 1);
    const material1 = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        metalness: 0.3,
        roughness: 0.7
    });
    const mesh1 = new THREE.Mesh(geometry1, material1);
    mesh1.position.copy(position);
    scene.add(mesh1);
    objects.push(mesh1);
    
    // Second cube blue
    const geometry2 = new THREE.BoxGeometry(1, 1, 1);
    const material2 = new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        metalness: 0.3,
        roughness: 0.7
    });
    const mesh2 = new THREE.Mesh(geometry2, material2);
    mesh2.position.copy(position);
    scene.add(mesh2);
    objects.push(mesh2);
}

// Translate gizmos
function createTranslateGizmo(position) {
    const gizmoGroup = new THREE.Group();
    gizmoGroup.position.copy(position);
    
    const arrowLength = 1.5;
    const arrowRadius = 0.03;
    const coneHeight = 0.2;
    const coneRadius = 0.08;
    
    // X axis group
    const xGroup = new THREE.Group();
    xGroup.userData.axis = 'x';
    xGroup.userData.isGizmo = true;
    
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
    
    xGroup.add(xCyl, xCone);
    
    // Y axis group
    const yGroup = new THREE.Group();
    yGroup.userData.axis = 'y';
    yGroup.userData.isGizmo = true;
    
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
    
    yGroup.add(yCyl, yCone);
    
    // Z axis group
    const zGroup = new THREE.Group();
    zGroup.userData.axis = 'z';
    zGroup.userData.isGizmo = true;
    
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
    
    zGroup.add(zCyl, zCone);
    
    gizmoGroup.add(xGroup, yGroup, zGroup);
    return gizmoGroup;
}

// Rotate gizmos
function createRotateGizmo(position) {
    const gizmoGroup = new THREE.Group();
    gizmoGroup.position.copy(position);
    
    const radius = 1.5;
    const tubeRadius = 0.03;
    const segments = 64;
    
    // X axis ring, red
    const xGroup = new THREE.Group();
    xGroup.userData.axis = 'x';
    xGroup.userData.isGizmo = true;
    
    const xMat = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        depthTest: false,
        depthWrite: false
    });
    
    const xRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tubeRadius, 16, segments),
        xMat
    );
    xRing.rotation.y = Math.PI / 2;
    xRing.userData.axis = 'x';
    xRing.userData.isGizmo = true;
    xRing.renderOrder = 999;
    
    xGroup.add(xRing);
    
    // Y axis ring, green
    const yGroup = new THREE.Group();
    yGroup.userData.axis = 'y';
    yGroup.userData.isGizmo = true;
    
    const yMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        depthTest: false,
        depthWrite: false
    });
    
    const yRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tubeRadius, 16, segments),
        yMat
    );
    yRing.rotation.x = Math.PI / 2;
    yRing.userData.axis = 'y';
    yRing.userData.isGizmo = true;
    yRing.renderOrder = 999;
    
    yGroup.add(yRing);
    
    // Z axis ring, blue
    const zGroup = new THREE.Group();
    zGroup.userData.axis = 'z';
    zGroup.userData.isGizmo = true;
    
    const zMat = new THREE.MeshBasicMaterial({ 
        color: 0x0000ff,
        depthTest: false,
        depthWrite: false
    });
    
    const zRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tubeRadius, 16, segments),
        zMat
    );
    zRing.userData.axis = 'z';
    zRing.userData.isGizmo = true;
    zRing.renderOrder = 999;
    
    zGroup.add(zRing);
    
    gizmoGroup.add(xGroup, yGroup, zGroup);
    return gizmoGroup;
}

// Scale gizmos 
function createScaleGizmo(position) {
    const gizmoGroup = new THREE.Group();
    gizmoGroup.position.copy(position);
    
    const lineLength = 1.5;
    const lineRadius = 0.03;
    const cubeSize = 0.15;
    
    // X axis group
    const xGroup = new THREE.Group();
    xGroup.userData.axis = 'x';
    xGroup.userData.isGizmo = true;
    
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
    
    xGroup.add(xLine, xCube);
    
    // Y axis group
    const yGroup = new THREE.Group();
    yGroup.userData.axis = 'y';
    yGroup.userData.isGizmo = true;
    
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
    
    yGroup.add(yLine, yCube);
    
    // Z axis group
    const zGroup = new THREE.Group();
    zGroup.userData.axis = 'z';
    zGroup.userData.isGizmo = true;
    
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
    
    zGroup.add(zLine, zCube);
    
    gizmoGroup.add(xGroup, yGroup, zGroup);
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
        } else if (currentMode === 'scale') {
            gizmo = createScaleGizmo(selectedObject.position);
        } else if (currentMode === 'rotate') {
            gizmo = createRotateGizmo(selectedObject.position);
        }
        scene.add(gizmo);
        
        // Show position panel
        positionPanel.style.display = 'block';
        updatePositionPanel();
        updateColorPickerFromObject();
    } else {
        // Hide position panel
        positionPanel.style.display = 'none';
    }
}

function updatePositionPanel() {
    if (!selectedObject) return;
    
    posXInput.value = selectedObject.position.x.toFixed(2);
    posYInput.value = selectedObject.position.y.toFixed(2);
    posZInput.value = selectedObject.position.z.toFixed(2);
    
    scaleXInput.value = selectedObject.scale.x.toFixed(2);
    scaleYInput.value = selectedObject.scale.y.toFixed(2);
    scaleZInput.value = selectedObject.scale.z.toFixed(2);
    
    // Display world-space rotations in degrees
    rotXInput.value = (worldRotationX * 180 / Math.PI).toFixed(2);
    rotYInput.value = (worldRotationY * 180 / Math.PI).toFixed(2);
    rotZInput.value = (worldRotationZ * 180 / Math.PI).toFixed(2);
}

function onPositionInputChange() {
    if (!selectedObject) return;
    
    isUpdatingInputs = true;
    
    const x = parseFloat(posXInput.value) || 0;
    const y = parseFloat(posYInput.value) || 0;
    const z = parseFloat(posZInput.value) || 0;
    
    selectedObject.position.set(x, y, z);
    
    if (gizmo) {
        gizmo.position.copy(selectedObject.position);
    }
    
    // Reset flag after a delay
    setTimeout(() => {
        isUpdatingInputs = false;
    }, 50);
}

function onScaleInputChange() {
    if (!selectedObject) return;
    
    isUpdatingInputs = true;
    
    const x = Math.max(0.1, parseFloat(scaleXInput.value) || 1);
    const y = Math.max(0.1, parseFloat(scaleYInput.value) || 1);
    const z = Math.max(0.1, parseFloat(scaleZInput.value) || 1);
    
    selectedObject.scale.set(x, y, z);
    
    // Reset flag after a delay
    setTimeout(() => {
        isUpdatingInputs = false;
    }, 50);
}

function onRotationInputChange() {
    if (!selectedObject) return;
    
    isUpdatingInputs = true;
    
    // DEG to RAD
    worldRotationX = (parseFloat(rotXInput.value) || 0) * Math.PI / 180;
    worldRotationY = (parseFloat(rotYInput.value) || 0) * Math.PI / 180;
    worldRotationZ = (parseFloat(rotZInput.value) || 0) * Math.PI / 180;
    
    // Apply rotations in world space using quaternions
    selectedObject.quaternion.identity();
    
    const quatX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), worldRotationX);
    const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), worldRotationY);
    const quatZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), worldRotationZ);
    
    selectedObject.quaternion.multiply(quatX).multiply(quatY).multiply(quatZ);
    
    // Reset flag after a delay
    setTimeout(() => {
        isUpdatingInputs = false;
    }, 50);
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('btn-translate').classList.toggle('active', mode === 'translate');
    document.getElementById('btn-scale').classList.toggle('active', mode === 'scale');
    document.getElementById('btn-rotate').classList.toggle('active', mode === 'rotate');
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
                objectStartRotation.copy(selectedObject.rotation);
                objectStartQuaternion.copy(selectedObject.quaternion);
                intersectionStart.copy(intersect.point);
                
                // Disable OrbitControls while dragging gizmo
                controls.enabled = false;
                
                // Drag plane
                createDragPlane(dragAxis);
                return;
            }
        }
    }
    
    // Object click
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        
        // Reset world rotation tracking for newly selected object
        worldRotationX = 0;
        worldRotationY = 0;
        worldRotationZ = 0;
        
        updateGizmo();
    } else {
        selectedObject = null;
        updateGizmo();
    }
}

function createDragPlane(axis) {
    const normal = new THREE.Vector3();
    
    if (currentMode === 'rotate') {
        // For rotation, use plane perpendicular to rotation axis
        if (axis === 'x') {
            normal.set(1, 0, 0); // YZ plane
        } else if (axis === 'y') {
            normal.set(0, 1, 0); // XZ plane
        } else {
            normal.set(0, 0, 1); // XY plane
        }
    } else {
        // For translate and scale
        if (axis === 'x') {
            normal.set(0, 1, 0);
        } else if (axis === 'y') {
            normal.set(1, 0, 1).normalize();
        } else {
            normal.set(1, 0, 0);
        }
    }
    
    dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        normal,
        selectedObject.position
    );
}

function onMouseMove(event) {
    // Update mouse position for raycasting
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (!isDragging || !selectedObject || !dragAxis) return;
    
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
        } else if (currentMode === 'rotate') {
            // Calculate rotation based on angular movement around the axis
            const objectPos = selectedObject.position;
            
            // Vectors from object center to start and current intersection points
            const startVec = new THREE.Vector3().subVectors(intersectionStart, objectPos);
            const currentVec = new THREE.Vector3().subVectors(intersection, objectPos);
            
            let rotationAngle = 0;
            
            // Reset to initial quaternion
            selectedObject.quaternion.copy(objectStartQuaternion);
            
            if (dragAxis === 'x') {
                // Project vectors onto YZ plane
                const start2D = new THREE.Vector2(startVec.y, startVec.z);
                const current2D = new THREE.Vector2(currentVec.y, currentVec.z);
                
                // Calculate angle between vectors
                rotationAngle = Math.atan2(current2D.y, current2D.x) - Math.atan2(start2D.y, start2D.x);
                
                // Apply rotation around world X axis using quaternion
                const worldAxis = new THREE.Vector3(1, 0, 0);
                const rotationQuat = new THREE.Quaternion().setFromAxisAngle(worldAxis, rotationAngle);
                selectedObject.quaternion.premultiply(rotationQuat);
                
                // Update world rotation tracking
                worldRotationX += rotationAngle;
            } else if (dragAxis === 'y') {
                // Project vectors onto XZ plane
                const start2D = new THREE.Vector2(startVec.x, startVec.z);
                const current2D = new THREE.Vector2(currentVec.x, currentVec.z);
                
                // Calculate angle between vectors (inverted for correct direction)
                rotationAngle = Math.atan2(start2D.y, start2D.x) - Math.atan2(current2D.y, current2D.x);
                
                // Apply rotation around world Y axis using quaternion
                const worldAxis = new THREE.Vector3(0, 1, 0);
                const rotationQuat = new THREE.Quaternion().setFromAxisAngle(worldAxis, rotationAngle);
                selectedObject.quaternion.premultiply(rotationQuat);
                
                // Update world rotation tracking
                worldRotationY += rotationAngle;
            } else if (dragAxis === 'z') {
                // Project vectors onto XY plane
                const start2D = new THREE.Vector2(startVec.x, startVec.y);
                const current2D = new THREE.Vector2(currentVec.x, currentVec.y);
                
                // Calculate angle between vectors
                rotationAngle = Math.atan2(current2D.y, current2D.x) - Math.atan2(start2D.y, start2D.x);
                
                // Apply rotation around world Z axis using quaternion
                const worldAxis = new THREE.Vector3(0, 0, 1);
                const rotationQuat = new THREE.Quaternion().setFromAxisAngle(worldAxis, rotationAngle);
                selectedObject.quaternion.premultiply(rotationQuat);
                
                // Update world rotation tracking
                worldRotationZ += rotationAngle;
            }
        }
        
        if (gizmo) {
            gizmo.position.copy(selectedObject.position);
        }
    }
}

function checkGizmoHover() {
    if (!gizmo) {
        if (hoveredGizmo) {
            resetGizmoScale(hoveredGizmo);
            hoveredGizmo = null;
            renderer.domElement.style.cursor = 'default';
        }
        return;
    }
    
    raycaster.setFromCamera(mouse, camera);
    const gizmoIntersects = raycaster.intersectObjects(gizmo.children, true);
    
    if (gizmoIntersects.length > 0) {
        // Filter out highlight discs from intersections
        const validIntersect = gizmoIntersects.find(intersect => 
            intersect.object.userData.isGizmo && !intersect.object.userData.isHighlightDisc
        );
        
        if (validIntersect) {
            // Find the axis group (parent)
            let axisGroup = validIntersect.object;
            while (axisGroup.parent && axisGroup.parent !== gizmo) {
                axisGroup = axisGroup.parent;
            }
            
            // New hover
            if (hoveredGizmo !== axisGroup) {
                // Reset previous
                if (hoveredGizmo) {
                    resetGizmoScale(hoveredGizmo);
                }
                
                // Set new hover
                hoveredGizmo = axisGroup;
                highlightGizmo(hoveredGizmo);
                renderer.domElement.style.cursor = 'pointer';
            }
        } else {
            // No valid hover (only hit highlight disc)
            if (hoveredGizmo) {
                resetGizmoScale(hoveredGizmo);
                hoveredGizmo = null;
                renderer.domElement.style.cursor = 'default';
            }
        }
    } else {
        // No hover
        if (hoveredGizmo) {
            resetGizmoScale(hoveredGizmo);
            hoveredGizmo = null;
            renderer.domElement.style.cursor = 'default';
        }
    }
}

function highlightGizmo(gizmoObject) {
    const axis = gizmoObject.userData.axis;
    
    if (currentMode === 'rotate') {
        // For rotate mode, add a transparent disc instead of scaling
        if (!gizmoObject.userData.highlightDisc) {
            const radius = 1.5;
            const discGeometry = new THREE.CircleGeometry(radius, 64);
            const discMaterial = new THREE.MeshBasicMaterial({
                color: axis === 'x' ? 0xff0000 : axis === 'y' ? 0x00ff00 : 0x0000ff,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide,
                depthTest: false,
                depthWrite: false
            });
            const disc = new THREE.Mesh(discGeometry, discMaterial);
            disc.renderOrder = 998; // Behind the ring
            
            // Mark disc as non-interactive for raycasting
            disc.userData.isHighlightDisc = true;
            
            // Orient the disc based on axis
            if (axis === 'x') {
                disc.rotation.y = Math.PI / 2;
            } else if (axis === 'y') {
                disc.rotation.x = Math.PI / 2;
            }
            // Z axis disc is already in correct orientation
            
            gizmoObject.add(disc);
            gizmoObject.userData.highlightDisc = disc;
        }
    } else {
        // For translate and scale modes, use the original scaling behavior
        if (axis === 'x') {
            gizmoObject.scale.set(1, 1.2, 1.2); // Grow in Y and Z
        } else if (axis === 'y') {
            gizmoObject.scale.set(1.2, 1, 1.2); // Grow in X and Z
        } else if (axis === 'z') {
            gizmoObject.scale.set(1.2, 1.2, 1); // Grow in X and Y
        }
    }
}

function resetGizmoScale(gizmoObject) {
    if (currentMode === 'rotate') {
        // Remove the highlight disc if it exists
        if (gizmoObject.userData.highlightDisc) {
            gizmoObject.remove(gizmoObject.userData.highlightDisc);
            gizmoObject.userData.highlightDisc.geometry.dispose();
            gizmoObject.userData.highlightDisc.material.dispose();
            gizmoObject.userData.highlightDisc = null;
        }
    } else {
        // Reset scale for translate and scale modes
        gizmoObject.scale.set(1, 1, 1);
    }
}

function onMouseUp() {
    isDragging = false;
    dragAxis = null;
    dragPlane = null;
    controls.enabled = true;
    
    // Check if mouse is still over gizmo after releasing
    if (gizmo) {
        raycaster.setFromCamera(mouse, camera);
        const gizmoIntersects = raycaster.intersectObjects(gizmo.children, true);
        if (gizmoIntersects.length > 0 && gizmoIntersects[0].object.userData.isGizmo) {
            renderer.domElement.style.cursor = 'pointer';
        } else {
            renderer.domElement.style.cursor = 'default';
        }
    } else {
        renderer.domElement.style.cursor = 'default';
    }
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

document.getElementById('addZFighting').addEventListener('click', () => {
    addZFightingDemo();
});

document.getElementById('btn-translate').addEventListener('click', () => {
    setMode('translate');
});

document.getElementById('btn-scale').addEventListener('click', () => {
    setMode('scale');
});

document.getElementById('btn-rotate').addEventListener('click', () => {
    setMode('rotate');
});

document.getElementById('btn-reset-camera').addEventListener('click', () => {
    resetCamera();
});

// Disable right-click context menu on toolbar
document.getElementById('toolbar').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Close instructions button
document.getElementById('close-instructions').addEventListener('click', () => {
    document.getElementById('instructions').classList.add('hidden');
});

// Color picker functions
function initColorPicker() {
    // Get elements
    colorRInput = document.getElementById('color-r');
    colorGInput = document.getElementById('color-g');
    colorBInput = document.getElementById('color-b');
    colorHInput = document.getElementById('color-h');
    colorSInput = document.getElementById('color-s');
    colorVInput = document.getElementById('color-v');
    colorAlphaInput = document.getElementById('color-alpha');
    alphaValueSpan = document.getElementById('alpha-value');
    colorHexInput = document.getElementById('color-hex');
    
    // Initialize iro.js color picker
    colorPicker = new iro.ColorPicker('#color-picker-container', {
        width: 180,
        color: '#ffffff',
        borderWidth: 1,
        borderColor: '#444',
        layout: [
            {
                component: iro.ui.Box,
            },
            {
                component: iro.ui.Slider,
                options: {
                    sliderType: 'hue'
                }
            }
        ]
    });
    
    // Color picker change event
    colorPicker.on('color:change', (color) => {
        if (isUpdatingColor) return;
        updateColorInputs(color);
        applyColorToObject(color);
    });
    
    // Collapsible color section
    const colorHeader = document.getElementById('color-header');
    const colorSection = document.getElementById('color-section');
    
    colorHeader.addEventListener('click', () => {
        const isExpanded = colorSection.classList.contains('expanded');
        if (isExpanded) {
            colorSection.classList.remove('expanded');
            colorSection.classList.add('collapsed');
            colorHeader.classList.remove('open');
        } else {
            colorSection.classList.remove('collapsed');
            colorSection.classList.add('expanded');
            colorHeader.classList.add('open');
        }
    });
    
    // Color mode tabs
    const colorTabs = document.querySelectorAll('.color-tab');
    colorTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.mode;
            switchColorMode(mode);
        });
    });
    
    // RGB inputs
    [colorRInput, colorGInput, colorBInput].forEach(input => {
        input.addEventListener('change', onRGBInputChange);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') onRGBInputChange();
        });
    });
    
    // HSV inputs
    [colorHInput, colorSInput, colorVInput].forEach(input => {
        input.addEventListener('change', onHSVInputChange);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') onHSVInputChange();
        });
    });
    
    // Alpha input
    colorAlphaInput.addEventListener('input', onAlphaInputChange);
    
    // Hex input
    colorHexInput.addEventListener('change', onHexInputChange);
    colorHexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onHexInputChange();
    });
}

function switchColorMode(mode) {
    currentColorMode = mode;
    
    // Update tabs
    document.querySelectorAll('.color-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    // Show/hide inputs
    document.getElementById('rgb-inputs').style.display = mode === 'rgb' ? 'block' : 'none';
    document.getElementById('hsv-inputs').style.display = mode === 'hsv' ? 'block' : 'none';
}

function updateColorInputs(color) {
    isUpdatingColor = true;
    
    // RGB
    colorRInput.value = color.rgb.r;
    colorGInput.value = color.rgb.g;
    colorBInput.value = color.rgb.b;
    
    // HSV
    colorHInput.value = Math.round(color.hsv.h);
    colorSInput.value = Math.round(color.hsv.s);
    colorVInput.value = Math.round(color.hsv.v);
    
    // Hex
    colorHexInput.value = color.hexString;
    
    setTimeout(() => {
        isUpdatingColor = false;
    }, 50);
}

function onRGBInputChange() {
    if (!selectedObject) return;
    
    const r = Math.max(0, Math.min(255, parseInt(colorRInput.value) || 0));
    const g = Math.max(0, Math.min(255, parseInt(colorGInput.value) || 0));
    const b = Math.max(0, Math.min(255, parseInt(colorBInput.value) || 0));
    
    isUpdatingColor = true;
    colorPicker.color.rgb = { r, g, b };
    applyColorToObject(colorPicker.color);
    
    setTimeout(() => {
        isUpdatingColor = false;
    }, 50);
}

function onHSVInputChange() {
    if (!selectedObject) return;
    
    const h = Math.max(0, Math.min(360, parseInt(colorHInput.value) || 0));
    const s = Math.max(0, Math.min(100, parseInt(colorSInput.value) || 0));
    const v = Math.max(0, Math.min(100, parseInt(colorVInput.value) || 0));
    
    isUpdatingColor = true;
    colorPicker.color.hsv = { h, s, v };
    applyColorToObject(colorPicker.color);
    
    setTimeout(() => {
        isUpdatingColor = false;
    }, 50);
}

function onAlphaInputChange() {
    if (!selectedObject) return;
    
    const alpha = parseInt(colorAlphaInput.value) / 100;
    alphaValueSpan.textContent = colorAlphaInput.value + '%';
    
    if (selectedObject.material) {
        selectedObject.material.transparent = alpha < 1;
        selectedObject.material.opacity = alpha;
        selectedObject.material.needsUpdate = true;
    }
}

function onHexInputChange() {
    if (!selectedObject) return;
    
    let hex = colorHexInput.value.trim();
    if (!hex.startsWith('#')) {
        hex = '#' + hex;
    }
    
    // Validate hex
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        isUpdatingColor = true;
        colorPicker.color.hexString = hex;
        applyColorToObject(colorPicker.color);
        
        setTimeout(() => {
            isUpdatingColor = false;
        }, 50);
    }
}

function applyColorToObject(color) {
    if (!selectedObject || !selectedObject.material) return;
    
    const alpha = parseInt(colorAlphaInput.value) / 100;
    selectedObject.material.color.setHex(parseInt(color.hexString.substring(1), 16));
    selectedObject.material.transparent = alpha < 1;
    selectedObject.material.opacity = alpha;
    selectedObject.material.needsUpdate = true;
}

function updateColorPickerFromObject() {
    if (!selectedObject || !selectedObject.material) return;
    
    isUpdatingColor = true;
    
    const color = selectedObject.material.color;
    const hex = '#' + color.getHexString();
    colorPicker.color.hexString = hex;
    
    const alpha = Math.round((selectedObject.material.opacity || 1) * 100);
    colorAlphaInput.value = alpha;
    alphaValueSpan.textContent = alpha + '%';
    
    updateColorInputs(colorPicker.color);
    
    setTimeout(() => {
        isUpdatingColor = false;
    }, 50);
}

init();