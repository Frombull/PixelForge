function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  ellipse(200, 200, 200, 200);
}

function mousePressed() {
  if (dist(mouseX, mouseY, 200, 200) < 100) {
    console.log("mousePressed");
    fill(random(0,255), random(0,255), random(0,255))
  }
}
