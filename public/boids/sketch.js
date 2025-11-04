// ========== CONFIGURAÇÕES GLOBAIS ==========
const CONFIG = {
  // Canvas
  CANVAS_WIDTH: 1600,
  CANVAS_HEIGHT: 900,

  // Boids
  INITIAL_BOIDS: 100,
  MAX_BOIDS: 500,
  BOID_SIZE: 3.0,
  BOID_MAX_SPEED: 3,
  BOID_MAX_FORCE: 0.2,

  // Cores
  BACKGROUND_COLOR: [20, 20, 30],
  BOID_FILL_COLOR: [127, 200, 255],
  BOID_STROKE_COLOR: [200, 220, 255],

  // Comportamento
  SEPARATION_DISTANCE: 25.0,
  NEIGHBOR_DISTANCE: 50,
  SEPARATION_WEIGHT: 1.5,
  ALIGNMENT_WEIGHT: 1.0,
  COHESION_WEIGHT: 1.0
};

let flock;

function setup() {
  let canvas = createCanvas(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  canvas.parent('canvas-container');

  flock = new Flock();
  for (let i = 0; i < CONFIG.INITIAL_BOIDS; i++) {
    let b = new Boid(width / 2, height / 2);
    flock.addBoid(b);
  }

  setupControls();
}

function setupControls() {
  // Speed slider
  const speedSlider = document.getElementById('speedSlider');
  const speedValue = document.getElementById('speedValue');
  speedSlider.addEventListener('input', (e) => {
    CONFIG.BOID_MAX_SPEED = parseFloat(e.target.value);
    speedValue.textContent = e.target.value;
    updateAllBoids();
  });

  // Separation slider
  const separationSlider = document.getElementById('separationSlider');
  const separationValue = document.getElementById('separationValue');
  separationSlider.addEventListener('input', (e) => {
    CONFIG.SEPARATION_WEIGHT = parseFloat(e.target.value);
    separationValue.textContent = e.target.value;
  });

  // Alignment slider
  const alignmentSlider = document.getElementById('alignmentSlider');
  const alignmentValue = document.getElementById('alignmentValue');
  alignmentSlider.addEventListener('input', (e) => {
    CONFIG.ALIGNMENT_WEIGHT = parseFloat(e.target.value);
    alignmentValue.textContent = e.target.value;
  });

  // Cohesion slider
  const cohesionSlider = document.getElementById('cohesionSlider');
  const cohesionValue = document.getElementById('cohesionValue');
  cohesionSlider.addEventListener('input', (e) => {
    CONFIG.COHESION_WEIGHT = parseFloat(e.target.value);
    cohesionValue.textContent = e.target.value;
  });

  // Size slider
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValue = document.getElementById('sizeValue');
  sizeSlider.addEventListener('input', (e) => {
    CONFIG.BOID_SIZE = parseFloat(e.target.value);
    sizeValue.textContent = e.target.value;
    updateAllBoids();
  });

  // Reset button
  const resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', resetSimulation);
}

function updateAllBoids() {
  for (let boid of flock.boids) {
    boid.maxspeed = CONFIG.BOID_MAX_SPEED;
    boid.r = CONFIG.BOID_SIZE;
  }
}

function resetSimulation() {
  flock.boids = [];
  for (let i = 0; i < CONFIG.INITIAL_BOIDS; i++) {
    let b = new Boid(width / 2, height / 2);
    flock.addBoid(b);
  }
}

function draw() {
  background(CONFIG.BACKGROUND_COLOR);
  flock.run();

  // Update boid count display
  document.getElementById('boidCount').textContent = flock.boids.length;
}

// Add a new boid into the System
function mouseDragged() {
  if (flock.boids.length < CONFIG.MAX_BOIDS) {
    flock.addBoid(new Boid(mouseX, mouseY));
  }
}


// Flock object, does very little, simply manages the array of all the boids
function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
}

Flock.prototype.run = function () {
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
  }
}

Flock.prototype.addBoid = function (b) {
  this.boids.push(b);
}

// Boid class, methods for Separation, Cohesion, Alignment added
function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = CONFIG.BOID_SIZE;
  this.maxspeed = CONFIG.BOID_MAX_SPEED;
  this.maxforce = CONFIG.BOID_MAX_FORCE;
}

Boid.prototype.run = function (boids) {
  this.flock(boids);
  this.update();
  this.borders();
  this.render();
}

Boid.prototype.applyForce = function (force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function (boids) {
  let sep = this.separate(boids);   // Separation
  let ali = this.align(boids);      // Alignment
  let coh = this.cohesion(boids);   // Cohesion
  // Arbitrarily weight these forces
  sep.mult(CONFIG.SEPARATION_WEIGHT);
  ali.mult(CONFIG.ALIGNMENT_WEIGHT);
  coh.mult(CONFIG.COHESION_WEIGHT);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}

// Method to update location
Boid.prototype.update = function () {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function (target) {
  let desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}


Boid.prototype.render = function () {                // Draw a triangle rotated in the direction of velocity
  let theta = this.velocity.heading() + radians(90);
  fill(CONFIG.BOID_FILL_COLOR);
  stroke(CONFIG.BOID_STROKE_COLOR);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.r * 2);
  vertex(-this.r, this.r * 2);
  vertex(this.r, this.r * 2);
  endShape(CLOSE);
  pop();
}

// Wraparound
Boid.prototype.borders = function () {
  if (this.position.x < -this.r) this.position.x = width + this.r;
  if (this.position.y < -this.r) this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation, method checks for nearby boids and steers away
Boid.prototype.separate = function (boids) {
  let desiredseparation = CONFIG.SEPARATION_DISTANCE;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment, for every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function (boids) {
  let neighbordist = CONFIG.NEIGHBOR_DISTANCE;
  let sum = createVector(0, 0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion, for the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function (boids) {
  let neighbordist = CONFIG.NEIGHBOR_DISTANCE;
  let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}
