import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

// Create cube with color spectrum
const geometry = new THREE.BoxGeometry(2, 2, 2);

// Create materials for each face with different colors
const materials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Right - Red
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Left - Green
  new THREE.MeshBasicMaterial({ color: 0x0000ff }), // Top - Blue
  new THREE.MeshBasicMaterial({ color: 0xffff00 }), // Bottom - Yellow
  new THREE.MeshBasicMaterial({ color: 0xff00ff }), // Front - Magenta
  new THREE.MeshBasicMaterial({ color: 0x00ffff })  // Back - Cyan
];

const cube = new THREE.Mesh(geometry, materials);
scene.add(cube);

// Add edges for better visibility
const edges = new THREE.EdgesGeometry(geometry);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
const wireframe = new THREE.LineSegments(edges, lineMaterial);
wireframe.visible = false;
cube.add(wireframe);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Controls setup
const rotationSpeedSlider = document.getElementById('rotationSpeed');
const rotationValue = document.getElementById('rotationValue');
const autoRotateCheckbox = document.getElementById('autoRotate');
const wireframeCheckbox = document.getElementById('wireframe');
const resetBtn = document.getElementById('resetBtn');

rotationSpeedSlider.addEventListener('input', (e) => {
  const speed = parseFloat(e.target.value);
  controls.autoRotateSpeed = speed;
  rotationValue.textContent = speed.toFixed(1);
});

autoRotateCheckbox.addEventListener('change', (e) => {
  controls.autoRotate = e.target.checked;
});

wireframeCheckbox.addEventListener('change', (e) => {
  wireframe.visible = e.target.checked;
  materials.forEach(mat => {
    mat.wireframe = e.target.checked;
  });
});

resetBtn.addEventListener('click', () => {
  camera.position.set(0, 0, 5);
  controls.reset();
});

// Handle window resize
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
