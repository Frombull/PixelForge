import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let objects = [];
let selectedObject = null;
let gizmo = null;
let currentMode = 'translate';
let gridHelper = null;
let snapToGrid = false;
let gridSize = 0.5;
let isPerspective = true;
let perspectiveCamera, orthographicCamera;

// Second viewport
let secondCamera, secondRenderer;
let showSecondViewport = false;

// Skew values for each object
let skewValues = new Map();

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
let skewXYInput, skewXZInput, skewYXInput, skewYZInput, skewZXInput, skewZYInput;
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
let hoveredObject = null;

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    // Cameras
    const aspect = window.innerWidth / (window.innerHeight - 44);
    
    perspectiveCamera = new THREE.PerspectiveCamera(
        70,
        aspect,
        0.01,
        100
    );
    perspectiveCamera.position.set(3, 3, 3);
    perspectiveCamera.lookAt(0, 0, 0);
    
    const frustumSize = 5;
    orthographicCamera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.01,
        100
    );
    orthographicCamera.position.set(3, 3, 3);
    orthographicCamera.lookAt(0, 0, 0);
    
    // Set initial camera
    camera = perspectiveCamera;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight - 44);
    container.appendChild(renderer.domElement);
    
    // Second camera for culling visualization
    secondCamera = new THREE.PerspectiveCamera(
        70,
        1, // Updated based on viewport size
        0.01,
        100
    );
    secondCamera.position.set(6, 6, 6);
    secondCamera.lookAt(0, 0, 0);
    
    // Second renderer for culling visualization
    secondRenderer = new THREE.WebGLRenderer({ antialias: true });
    secondRenderer.setSize(800, 450);
    secondRenderer.domElement.style.position = 'fixed';
    secondRenderer.domElement.style.bottom = '12px';
    secondRenderer.domElement.style.right = '12px';
    secondRenderer.domElement.style.border = '1px solid #8b5cf6';
    secondRenderer.domElement.style.borderRadius = '4px';
    secondRenderer.domElement.style.display = 'none';
    secondRenderer.domElement.style.zIndex = '999';
    container.appendChild(secondRenderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    // Grid
    gridHelper = new THREE.GridHelper(40, 40, 0xbbbbbb, 0xdddddd);
    scene.add(gridHelper);
    
    // World axis  
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.material.depthTest = false;        // Avoid z-fight with grid
    scene.add(axesHelper);
    
    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
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

    // Orthographic camera zoom
    controls.maxZoom = 2;
    controls.minZoom = 0.8;
    
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
    skewXYInput = document.getElementById('skew-xy');
    skewXZInput = document.getElementById('skew-xz');
    skewYXInput = document.getElementById('skew-yx');
    skewYZInput = document.getElementById('skew-yz');
    skewZXInput = document.getElementById('skew-zx');
    skewZYInput = document.getElementById('skew-zy');
    
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
    
    // Skew input listeners
    skewXYInput.addEventListener('change', onSkewInputChange);
    skewXZInput.addEventListener('change', onSkewInputChange);
    skewYXInput.addEventListener('change', onSkewInputChange);
    skewYZInput.addEventListener('change', onSkewInputChange);
    skewZXInput.addEventListener('change', onSkewInputChange);
    skewZYInput.addEventListener('change', onSkewInputChange);
    
    [skewXYInput, skewXZInput, skewYXInput, skewYZInput, skewZXInput, skewZYInput].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onSkewInputChange();
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
            e.preventDefault(); // Prevent MMB
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
        checkObjectHover();
    }
    
    renderer.render(scene, camera);
    
    // Render second viewport if enabled
    if (showSecondViewport) {
        // Create a helper to visualize the main camera frustum
        updateCameraHelper();
        secondRenderer.render(scene, secondCamera);
    }
}

let cameraHelper = null;

function updateCameraHelper() {
    // Remove old helper
    if (cameraHelper) {
        scene.remove(cameraHelper);
    }
    
    // Create new helper for the main camera
    cameraHelper = new THREE.CameraHelper(camera);
    cameraHelper.material.linewidth = 2;
    scene.add(cameraHelper);
    cameraHelper.update();
}

function addCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0.3,
        roughness: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0.5, 0.5, 0.5);
    scene.add(mesh);
    objects.push(mesh);
    
    // Initialize skew values for this object
    skewValues.set(mesh, { xy: 0, xz: 0, yx: 0, yz: 0, zx: 0, zy: 0 });
}

function addCylinder() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0.3,
        roughness: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(1.5, 0.5, 1.5);
    scene.add(mesh);
    objects.push(mesh);
    
    // Initialize skew values for this object
    skewValues.set(mesh, { xy: 0, xz: 0, yx: 0, yz: 0, zx: 0, zy: 0 });
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
    skewValues.set(mesh1, { xy: 0, xz: 0, yx: 0, yz: 0, zx: 0, zy: 0 });
    
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
    skewValues.set(mesh2, { xy: 0, xz: 0, yx: 0, yz: 0, zx: 0, zy: 0 });
}

function addSkewDemo() {
    return;
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

// Skew gizmo
function createSkewGizmo(position) {
    const gizmoGroup = new THREE.Group();
    gizmoGroup.position.copy(position);
    
    const lineLength = 1.5;
    const lineRadius = 0.03;
    const diamondSize = 0.12;
    
    // Helper function to create a diamond shape
    function createDiamond(material) {
        const geometry = new THREE.OctahedronGeometry(diamondSize, 0);
        return new THREE.Mesh(geometry, material);
    }
    
    // XY skew (X affected by Y) - Red/Green
    const xyGroup = new THREE.Group();
    xyGroup.userData.axis = 'xy';
    xyGroup.userData.isGizmo = true;
    
    const xyMat = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        depthTest: false,
        depthWrite: false
    });
    const xyLine = new THREE.Mesh(
        new THREE.CylinderGeometry(lineRadius, lineRadius, lineLength, 8),
        xyMat
    );
    xyLine.rotation.z = -Math.PI / 4;
    xyLine.position.set(lineLength / 2 * Math.cos(-Math.PI / 4), lineLength / 2 * Math.sin(-Math.PI / 4), 0);
    xyLine.userData.axis = 'xy';
    xyLine.userData.isGizmo = true;
    xyLine.renderOrder = 999;
    
    const xyDiamond = createDiamond(xyMat);
    xyDiamond.position.set(lineLength * Math.cos(-Math.PI / 4), lineLength * Math.sin(-Math.PI / 4), 0);
    xyDiamond.userData.axis = 'xy';
    xyDiamond.userData.isGizmo = true;
    xyDiamond.renderOrder = 999;
    
    xyGroup.add(xyLine, xyDiamond);
    
    // XZ skew (X affected by Z) - Red/Blue
    const xzGroup = new THREE.Group();
    xzGroup.userData.axis = 'xz';
    xzGroup.userData.isGizmo = true;
    
    const xzMat = new THREE.MeshBasicMaterial({ 
        color: 0xff00ff,
        depthTest: false,
        depthWrite: false
    });
    const xzLine = new THREE.Mesh(
        new THREE.CylinderGeometry(lineRadius, lineRadius, lineLength, 8),
        xzMat
    );
    xzLine.rotation.y = Math.PI / 4;
    xzLine.rotation.z = -Math.PI / 2;
    xzLine.position.set(lineLength / 2 * Math.cos(Math.PI / 4), 0, lineLength / 2 * Math.sin(Math.PI / 4));
    xzLine.userData.axis = 'xz';
    xzLine.userData.isGizmo = true;
    xzLine.renderOrder = 999;
    
    const xzDiamond = createDiamond(xzMat);
    xzDiamond.position.set(lineLength * Math.cos(Math.PI / 4), 0, lineLength * Math.sin(Math.PI / 4));
    xzDiamond.userData.axis = 'xz';
    xzDiamond.userData.isGizmo = true;
    xzDiamond.renderOrder = 999;
    
    xzGroup.add(xzLine, xzDiamond);
    
    // YZ skew (Y affected by Z) - Green/Blue
    const yzGroup = new THREE.Group();
    yzGroup.userData.axis = 'yz';
    yzGroup.userData.isGizmo = true;
    
    const yzMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        depthTest: false,
        depthWrite: false
    });
    const yzLine = new THREE.Mesh(
        new THREE.CylinderGeometry(lineRadius, lineRadius, lineLength, 8),
        yzMat
    );
    yzLine.rotation.x = Math.PI / 4;
    yzLine.position.set(0, lineLength / 2 * Math.cos(Math.PI / 4), lineLength / 2 * Math.sin(Math.PI / 4));
    yzLine.userData.axis = 'yz';
    yzLine.userData.isGizmo = true;
    yzLine.renderOrder = 999;
    
    const yzDiamond = createDiamond(yzMat);
    yzDiamond.position.set(0, lineLength * Math.cos(Math.PI / 4), lineLength * Math.sin(Math.PI / 4));
    yzDiamond.userData.axis = 'yz';
    yzDiamond.userData.isGizmo = true;
    yzDiamond.renderOrder = 999;
    
    yzGroup.add(yzLine, yzDiamond);
    
    gizmoGroup.add(xyGroup, xzGroup, yzGroup);
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
        } else if (currentMode === 'skew') {
            gizmo = createSkewGizmo(selectedObject.position);
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
    
    // Display skew values
    const skew = skewValues.get(selectedObject) || { xy: 0, xz: 0, yx: 0, yz: 0, zx: 0, zy: 0 };
    skewXYInput.value = skew.xy.toFixed(2);
    skewXZInput.value = skew.xz.toFixed(2);
    skewYXInput.value = skew.yx.toFixed(2);
    skewYZInput.value = skew.yz.toFixed(2);
    skewZXInput.value = skew.zx.toFixed(2);
    skewZYInput.value = skew.zy.toFixed(2);
}

function onPositionInputChange() {
    if (!selectedObject) return;
    
    isUpdatingInputs = true;
    
    let x = parseFloat(posXInput.value) || 0;
    let y = parseFloat(posYInput.value) || 0;
    let z = parseFloat(posZInput.value) || 0;
    
    // Apply snap to grid if enabled
    if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
        z = Math.round(z / gridSize) * gridSize;
        
        // Update inputs with snapped values
        posXInput.value = x.toFixed(2);
        posYInput.value = y.toFixed(2);
        posZInput.value = z.toFixed(2);
    }
    
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

function onSkewInputChange() {
    if (!selectedObject) return;
    
    isUpdatingInputs = true;
    
    const skew = {
        xy: parseFloat(skewXYInput.value) || 0,
        xz: parseFloat(skewXZInput.value) || 0,
        yx: parseFloat(skewYXInput.value) || 0,
        yz: parseFloat(skewYZInput.value) || 0,
        zx: parseFloat(skewZXInput.value) || 0,
        zy: parseFloat(skewZYInput.value) || 0
    };
    
    skewValues.set(selectedObject, skew);
    applySkewToObject(selectedObject);
    
    // Reset flag after a delay
    setTimeout(() => {
        isUpdatingInputs = false;
    }, 50);
}

function applySkewToObject(object) {
    if (!object) return;
    
    const skew = skewValues.get(object);
    if (!skew) return;
    
    // Skew matrix, Matrix format in Three.js is column-major
    const matrix = new THREE.Matrix4();
    matrix.set(
        1,        skew.yx, skew.zx, 0,
        skew.xy,  1,       skew.zy, 0,
        skew.xz,  skew.yz, 1,       0,
        0,        0,       0,       1
    );
    
    // Store original geometry
    if (!object.userData.originalGeometry) {
        object.userData.originalGeometry = object.geometry.clone();
    }
    
    // Reset original geometry
    object.geometry.dispose();
    object.geometry = object.userData.originalGeometry.clone();
    
    // Apply skew to vertices
    object.geometry.applyMatrix4(matrix);
    object.geometry.computeVertexNormals();
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('btn-translate').classList.toggle('active', mode === 'translate');
    document.getElementById('btn-scale').classList.toggle('active', mode === 'scale');
    document.getElementById('btn-rotate').classList.toggle('active', mode === 'rotate');
    document.getElementById('btn-skew').classList.toggle('active', mode === 'skew');
    updateGizmo();
}

// Event handlers
function onMouseDown(event) {
    // Ignore right mouse button for selection
    if (event.button === 2) {
        return;
    }
    
    // Ignore middle mouse button for selection
    if (event.button === 1) {
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
        
        // Remove highlight from newly selected object
        if (hoveredObject === selectedObject) {
            removeObjectHighlight(hoveredObject);
            hoveredObject = null;
        }
        
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
    } else if (currentMode === 'skew') {
        // For skew, use appropriate plane based on axis combination
        if (axis === 'xy') {
            normal.set(0, 0, 1); // XY plane
        } else if (axis === 'xz') {
            normal.set(0, 1, 0); // XZ plane
        } else if (axis === 'yz') {
            normal.set(1, 0, 0); // YZ plane
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
            
            let newX = objectStartPos.x + delta.x;
            let newY = objectStartPos.y + delta.y;
            let newZ = objectStartPos.z + delta.z;
            
            // Apply snap to grid if enabled
            if (snapToGrid) {
                newX = Math.round(newX / gridSize) * gridSize;
                newY = Math.round(newY / gridSize) * gridSize;
                newZ = Math.round(newZ / gridSize) * gridSize;
            }
            
            if (dragAxis === 'x') {
                selectedObject.position.x = newX;
            } else if (dragAxis === 'y') {
                selectedObject.position.y = newY;
            } else if (dragAxis === 'z') {
                selectedObject.position.z = newZ;
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
        } else if (currentMode === 'skew') {
            // Calculate skew based on movement
            const delta = new THREE.Vector3().subVectors(intersection, intersectionStart);
            
            const skew = skewValues.get(selectedObject) || { xy: 0, xz: 0, yx: 0, yz: 0, zx: 0, zy: 0 };
            
            if (dragAxis === 'xy') {
                // X affected by Y movement
                skew.xy = delta.y * 0.5;
            } else if (dragAxis === 'xz') {
                // X affected by Z movement
                skew.xz = delta.z * 0.5;
            } else if (dragAxis === 'yz') {
                // Y affected by Z movement
                skew.yz = delta.z * 0.5;
            }
            
            skewValues.set(selectedObject, skew);
            applySkewToObject(selectedObject);
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

function checkObjectHover() {
    // Don't check object hover if we're hovering over a gizmo
    if (hoveredGizmo) {
        if (hoveredObject) {
            removeObjectHighlight(hoveredObject);
            hoveredObject = null;
        }
        return;
    }
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // New hover
        if (hoveredObject !== object) {
            // Reset previous
            if (hoveredObject) {
                removeObjectHighlight(hoveredObject);
            }
            
            // Set new hover
            hoveredObject = object;
            addObjectHighlight(hoveredObject);
        }
    } else {
        // No hover
        if (hoveredObject) {
            removeObjectHighlight(hoveredObject);
            hoveredObject = null;
        }
    }
}

function addObjectHighlight(object) {
    // Don't highlight if it's the selected object
    if (object === selectedObject) return;
    
    // Create outline mesh silhouette
    if (!object.userData.outlineMesh) {
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffa500,
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
}

function removeObjectHighlight(object) {
    if (object.userData.outlineMesh) {
        object.remove(object.userData.outlineMesh);
        object.userData.outlineMesh.material.dispose();
        object.userData.outlineMesh = null;
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
    const aspect = window.innerWidth / (window.innerHeight - 44);
    
    if (isPerspective) {
        perspectiveCamera.aspect = aspect;
        perspectiveCamera.updateProjectionMatrix();
    } else {
        const frustumSize = 5;
        orthographicCamera.left = frustumSize * aspect / -2;
        orthographicCamera.right = frustumSize * aspect / 2;
        orthographicCamera.top = frustumSize / 2;
        orthographicCamera.bottom = frustumSize / -2;
        orthographicCamera.updateProjectionMatrix();
    }
    
    renderer.setSize(window.innerWidth, window.innerHeight - 44);
    
    // Update second camera aspect ratio
    secondCamera.aspect = 1;
    secondCamera.updateProjectionMatrix();
}

function toggleSecondViewport() {
    showSecondViewport = !showSecondViewport;
    
    if (showSecondViewport) {
        secondRenderer.domElement.style.display = 'block';
    } else {
        secondRenderer.domElement.style.display = 'none';
        
        // Remove camera helper when viewport is hidden
        if (cameraHelper) {
            scene.remove(cameraHelper);
            cameraHelper = null;
        }
    }
    
    // Update button state
    const btn = document.getElementById('btn-toggle-culling');
    if (btn) {
        btn.classList.toggle('active', showSecondViewport);
    }
}

function toggleCameraType() {
    isPerspective = !isPerspective;
    
    // Store current camera state
    const currentPosition = camera.position.clone();
    const currentTarget = controls.target.clone();
    
    // Switch camera
    if (isPerspective) {
        camera = perspectiveCamera;
    } else {
        camera = orthographicCamera;
    }
    
    // Restore position and target
    camera.position.copy(currentPosition);
    camera.lookAt(currentTarget);
    
    // Update controls
    controls.object = camera;
    controls.target.copy(currentTarget);
    controls.update();
    
    // Update button state
    const btn = document.getElementById('btn-toggle-camera');
    if (btn) {
        btn.classList.toggle('active', !isPerspective);
    }
    
    // Trigger resize to update projection
    onWindowResize();
}

function onKeyDown(event) {
    // Ignore if typing in an input field
    if (document.activeElement.tagName === 'INPUT') {
        return;
    }
    
    // F key - Focus on selected object
    if (event.key === 'f' || event.key === 'F') {
        if (selectedObject) {
            focusOnObject(selectedObject);
        }
    }
    
    // R
    if (event.key === 'r' || event.key === 'R') {
        setMode('rotate');
    }
    
    // S
    if (event.key === 's' || event.key === 'S') {
        setMode('scale');
    }
    
    // T
    if (event.key === 't' || event.key === 'T') {
        setMode('translate');
    }
    
    // K
    if (event.key === 'k' || event.key === 'K') {
        setMode('skew');
    }
    
    // Delete
    if (event.key === 'Delete' || event.key === 'Del') {
        if (selectedObject) {
            deleteSelectedObject();
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

function deleteSelectedObject() {
    if (!selectedObject) return;
    
    // Remove highlight if this was the hovered object
    if (hoveredObject === selectedObject) {
        removeObjectHighlight(hoveredObject);
        hoveredObject = null;
    }
    
    // Remove from scene
    scene.remove(selectedObject);
    
    // Dispose geometry and material
    if (selectedObject.geometry) {
        selectedObject.geometry.dispose();
    }
    if (selectedObject.material) {
        selectedObject.material.dispose();
    }
    
    // Dispose original geometry if exists
    if (selectedObject.userData.originalGeometry) {
        selectedObject.userData.originalGeometry.dispose();
    }
    
    // Remove from objects array
    const index = objects.indexOf(selectedObject);
    if (index > -1) {
        objects.splice(index, 1);
    }
    
    // Remove skew values
    skewValues.delete(selectedObject);
    
    // Clear selection
    selectedObject = null;
    updateGizmo();
}

function resetCamera() {
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);
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

document.getElementById('addSkewDemo').addEventListener('click', () => {
    addSkewDemo();
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

document.getElementById('btn-skew').addEventListener('click', () => {
    setMode('skew');
});

document.getElementById('btn-reset-camera').addEventListener('click', () => {
    resetCamera();
});

document.getElementById('btn-toggle-camera').addEventListener('click', () => {
    toggleCameraType();
});

document.getElementById('btn-toggle-culling').addEventListener('click', () => {
    toggleSecondViewport();
});

// Disable right-click context menu on toolbar
document.getElementById('toolbar').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Close instructions button
document.getElementById('close-instructions').addEventListener('click', () => {
    document.getElementById('instructions').classList.add('hidden');
});

// Settings menu
const settingsBtn = document.getElementById('btn-settings');
const settingsMenu = document.getElementById('settings-menu');
const toggleGridCheckbox = document.getElementById('toggle-grid');
const toggleSnapCheckbox = document.getElementById('toggle-snap');
const snapSizeInput = document.getElementById('snap-size');
const snapSizeItem = document.querySelector('.snap-size-item');
const bgColorInput = document.getElementById('bg-color');
const gridColorInput = document.getElementById('grid-color');
const nearClipInput = document.getElementById('near-clip');
const nearClipValue = document.getElementById('near-clip-value');
const farClipInput = document.getElementById('far-clip');
const farClipValue = document.getElementById('far-clip-value');

// Toggle settings menu
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('hidden');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
        settingsMenu.classList.add('hidden');
    }
});

// Prevent menu from closing when clicking inside
settingsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Toggle grid visibility
toggleGridCheckbox.addEventListener('change', (e) => {
    if (gridHelper) {
        gridHelper.visible = e.target.checked;
    }
});

// Toggle snap to grid
toggleSnapCheckbox.addEventListener('change', (e) => {
    snapToGrid = e.target.checked;
    
    // Enable/disable snap size input
    if (snapToGrid) {
        snapSizeItem.classList.add('enabled');
    } else {
        snapSizeItem.classList.remove('enabled');
    }
});

// Change snap size
snapSizeInput.addEventListener('change', (e) => {
    const value = parseFloat(e.target.value);
    if (value > 0) {
        gridSize = value;
    } else {
        snapSizeInput.value = gridSize;
    }
});

snapSizeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const value = parseFloat(snapSizeInput.value);
        if (value > 0) {
            gridSize = value;
        } else {
            snapSizeInput.value = gridSize;
        }
    }
});

// Change background color
bgColorInput.addEventListener('input', (e) => {
    scene.background = new THREE.Color(e.target.value);
});

// Change grid color
gridColorInput.addEventListener('input', (e) => {
    if (gridHelper) {
        const newColor = new THREE.Color(e.target.value);
        gridHelper.material.color.copy(newColor);
        gridHelper.material.needsUpdate = true;
    }
});

// Change near clip plane (slider)
nearClipInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (value > 0 && value < camera.far) {
        perspectiveCamera.near = value;
        orthographicCamera.near = value;
        perspectiveCamera.updateProjectionMatrix();
        orthographicCamera.updateProjectionMatrix();
        nearClipValue.textContent = value.toFixed(2);
    }
});

// Change far clip plane (slider)
farClipInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (value > camera.near) {
        perspectiveCamera.far = value;
        orthographicCamera.far = value;
        perspectiveCamera.updateProjectionMatrix();
        orthographicCamera.updateProjectionMatrix();
        farClipValue.textContent = value;
    }
});

// Default values for reset
const defaultValues = {
    nearClip: 0.01,
    farClip: 100,
    snapSize: 0.5
};

// Reset buttons
document.querySelectorAll('.reset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const resetTarget = btn.dataset.reset;
        
        // Settings menu resets
        if (resetTarget === 'near-clip') {
            perspectiveCamera.near = defaultValues.nearClip;
            orthographicCamera.near = defaultValues.nearClip;
            perspectiveCamera.updateProjectionMatrix();
            orthographicCamera.updateProjectionMatrix();
            nearClipInput.value = defaultValues.nearClip;
            nearClipValue.textContent = defaultValues.nearClip.toFixed(2);
            return;
        } else if (resetTarget === 'far-clip') {
            perspectiveCamera.far = defaultValues.farClip;
            orthographicCamera.far = defaultValues.farClip;
            perspectiveCamera.updateProjectionMatrix();
            orthographicCamera.updateProjectionMatrix();
            farClipInput.value = defaultValues.farClip;
            farClipValue.textContent = defaultValues.farClip;
            return;
        } else if (resetTarget === 'snap-size') {
            gridSize = defaultValues.snapSize;
            snapSizeInput.value = defaultValues.snapSize;
            return;
        }
        
        if (!selectedObject) return;
        
        isUpdatingInputs = true;
        
        // Position resets
        if (resetTarget === 'pos-x') {
            selectedObject.position.x = 0;
            posXInput.value = '0.00';
        } else if (resetTarget === 'pos-y') {
            selectedObject.position.y = 0;
            posYInput.value = '0.00';
        } else if (resetTarget === 'pos-z') {
            selectedObject.position.z = 0;
            posZInput.value = '0.00';
        }
        
        // Rotation resets
        else if (resetTarget === 'rot-x') {
            worldRotationX = 0;
            rotXInput.value = '0.00';
            applyWorldRotations();
        } else if (resetTarget === 'rot-y') {
            worldRotationY = 0;
            rotYInput.value = '0.00';
            applyWorldRotations();
        } else if (resetTarget === 'rot-z') {
            worldRotationZ = 0;
            rotZInput.value = '0.00';
            applyWorldRotations();
        }
        
        // Scale resets
        else if (resetTarget === 'scale-x') {
            selectedObject.scale.x = 1;
            scaleXInput.value = '1.00';
        } else if (resetTarget === 'scale-y') {
            selectedObject.scale.y = 1;
            scaleYInput.value = '1.00';
        } else if (resetTarget === 'scale-z') {
            selectedObject.scale.z = 1;
            scaleZInput.value = '1.00';
        }
        
        // Skew resets
        else if (resetTarget === 'skew-xy') {
            const skew = skewValues.get(selectedObject);
            if (skew) {
                skew.xy = 0;
                skewXYInput.value = '0.00';
                applySkewToObject(selectedObject);
            }
        } else if (resetTarget === 'skew-xz') {
            const skew = skewValues.get(selectedObject);
            if (skew) {
                skew.xz = 0;
                skewXZInput.value = '0.00';
                applySkewToObject(selectedObject);
            }
        } else if (resetTarget === 'skew-yx') {
            const skew = skewValues.get(selectedObject);
            if (skew) {
                skew.yx = 0;
                skewYXInput.value = '0.00';
                applySkewToObject(selectedObject);
            }
        } else if (resetTarget === 'skew-yz') {
            const skew = skewValues.get(selectedObject);
            if (skew) {
                skew.yz = 0;
                skewYZInput.value = '0.00';
                applySkewToObject(selectedObject);
            }
        } else if (resetTarget === 'skew-zx') {
            const skew = skewValues.get(selectedObject);
            if (skew) {
                skew.zx = 0;
                skewZXInput.value = '0.00';
                applySkewToObject(selectedObject);
            }
        } else if (resetTarget === 'skew-zy') {
            const skew = skewValues.get(selectedObject);
            if (skew) {
                skew.zy = 0;
                skewZYInput.value = '0.00';
                applySkewToObject(selectedObject);
            }
        }
        
        if (gizmo) {
            gizmo.position.copy(selectedObject.position);
        }
        
        setTimeout(() => {
            isUpdatingInputs = false;
        }, 50);
    });
});

function applyWorldRotations() {
    if (!selectedObject) return;
    
    selectedObject.quaternion.identity();
    
    const quatX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), worldRotationX);
    const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), worldRotationY);
    const quatZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), worldRotationZ);
    
    selectedObject.quaternion.multiply(quatX).multiply(quatY).multiply(quatZ);
}

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
        padding: 0,
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
    
    // Collapsible sections
    const collapsibleSections = [
        { header: 'position-header', section: 'position-section' },
        { header: 'rotation-header', section: 'rotation-section' },
        { header: 'scale-header', section: 'scale-section' },
        { header: 'skew-header', section: 'skew-section' }
    ];
    
    collapsibleSections.forEach(({ header, section }) => {
        const headerEl = document.getElementById(header);
        const sectionEl = document.getElementById(section);
        
        headerEl.addEventListener('click', () => {
            const isExpanded = sectionEl.classList.contains('expanded');
            if (isExpanded) {
                sectionEl.classList.remove('expanded');
                sectionEl.classList.add('collapsed');
                headerEl.classList.remove('open');
            } else {
                sectionEl.classList.remove('collapsed');
                sectionEl.classList.add('expanded');
                headerEl.classList.add('open');
            }
        });
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