import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// Renderer
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// Zoom
controls.minDistance = 1;
controls.maxDistance = 5;

// 8 vertices of the cube in RGB space
const vertices = new Float32Array([
  -1, -1, -1,  // 0: Black   (0,0,0)
  1, -1, -1,   // 1: Red     (1,0,0)
  1,  1, -1,   // 2: Yellow  (1,1,0)
  -1,  1, -1,  // 3: Green   (0,1,0)
  -1, -1,  1,  // 4: Blue    (0,0,1)
  1, -1,  1,   // 5: Magenta (1,0,1)
  1,  1,  1,   // 6: White   (1,1,1)
  -1,  1,  1   // 7: Cyan    (0,1,1)
]);

// 8 vertex colors (RGB values)
const vertexColors = new Float32Array([
  0, 0, 0,  // 0: Black
  1, 0, 0,  // 1: Red
  1, 1, 0,  // 2: Yellow
  0, 1, 0,  // 3: Green
  0, 0, 1,  // 4: Blue
  1, 0, 1,  // 5: Magenta
  1, 1, 1,  // 6: White
  0, 1, 1   // 7: Cyan
]);

// Define the 12 triangles (2 per face, 6 faces)
const indices = new Uint16Array([
  // Front face (z = 1)
  4, 5, 6,  4, 6, 7,
  // Back face (z = -1)
  1, 0, 3,  1, 3, 2,
  // Top face (y = 1)
  7, 6, 2,  7, 2, 3,
  // Bottom face (y = -1)
  0, 1, 5,  0, 5, 4,
  // Right face (x = 1)
  5, 1, 2,  5, 2, 6,
  // Left face (x = -1)
  0, 4, 7,  0, 7, 3
]);

// Create geometry and set attributes
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
geometry.setIndex(new THREE.BufferAttribute(indices, 1));
geometry.computeVertexNormals();

// Create material with vertex colors enabled
const material = new THREE.MeshBasicMaterial({ 
  vertexColors: true,
  side: THREE.DoubleSide
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Edges
const edges = new THREE.EdgesGeometry(geometry);
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
edgeLines.visible = true;
cube.add(edgeLines);

// Wireframe
const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
const wireframe = new THREE.LineSegments(edges.clone(), wireframeMaterial);
wireframe.visible = false;
cube.add(wireframe);

// vertex markers
const labelGroup = new THREE.Group();
const vertexInfo = [
  { pos: [-1, -1, -1], color: [0, 0, 0], label: 'Black (0,0,0)' },
  { pos: [ 1, -1, -1], color: [1, 0, 0], label: 'Red (1,0,0)' },
  { pos: [ 1,  1, -1], color: [1, 1, 0], label: 'Yellow (1,1,0)' },
  { pos: [-1,  1, -1], color: [0, 1, 0], label: 'Green (0,1,0)' },
  { pos: [-1, -1,  1], color: [0, 0, 1], label: 'Blue (0,0,1)' },
  { pos: [ 1, -1,  1], color: [1, 0, 1], label: 'Magenta (1,0,1)' },
  { pos: [ 1,  1,  1], color: [1, 1, 1], label: 'White (1,1,1)' },
  { pos: [-1,  1,  1], color: [0, 1, 1], label: 'Cyan (0,1,1)' }
];

// Spheres at each vertex
vertexInfo.forEach((info) => {
  const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial({ 
    color: new THREE.Color(info.color[0], info.color[1], info.color[2])
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(info.pos[0], info.pos[1], info.pos[2]);
  labelGroup.add(sphere);
});

scene.add(labelGroup);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Controls setup
const autoRotateCheckbox = document.getElementById('autoRotate');
const showEdgesCheckbox = document.getElementById('showEdges');
const wireframeCheckbox = document.getElementById('wireframe');
const showVerticesCheckbox = document.getElementById('showVertices');
const resetBtn = document.getElementById('resetBtn');

autoRotateCheckbox.addEventListener('change', (e) => {
  controls.autoRotate = e.target.checked;
});

showEdgesCheckbox.addEventListener('change', (e) => {
  edgeLines.visible = e.target.checked;
});

wireframeCheckbox.addEventListener('change', (e) => {
  wireframe.visible = e.target.checked;
  material.wireframe = e.target.checked;
});

showVerticesCheckbox.addEventListener('change', (e) => {
  labelGroup.visible = e.target.checked;
});

resetBtn.addEventListener('click', () => {
  camera.position.set(0, 0, 5);
  controls.reset();
});

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Window resize
window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  controls.update();
  
  renderer.render(scene, camera);
}

animate();
