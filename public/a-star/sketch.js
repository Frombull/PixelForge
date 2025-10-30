let cols, rows;
let cellSize = 32;
let grid = [];
let start, end;
let path = [];
let openSet = [];
let closedSet = [];
let isRunning = false;
let pathfindingGenerator = null;

function setup() {
  createCanvas(windowWidth, windowHeight);

  cols = floor(width / cellSize);
  rows = floor(height / cellSize);

  // Inicializar grid
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0; // 0 = vazio, 1 = parede
    }
  }

  // Definir início (verde) e objetivo (vermelho)
  start = { x: floor(cols / 4), y: floor(rows / 2) };
  end = { x: floor(3 * cols / 4), y: floor(rows / 2) };

  // Configurar botões
  document.getElementById("playBtn").addEventListener("click", runPathfinding);
  document
    .getElementById("clearPathBtn")
    .addEventListener("click", clearPath);
  document
    .getElementById("clearWallsBtn")
    .addEventListener("click", clearWalls);

  // Menu de contexto
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

function draw() {
  background(255);

  // Grid
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * cellSize;
      let y = j * cellSize;

      // Check closedSet (já explorado)
      let inClosed = closedSet.some((node) => node.x === i && node.y === j);
      // Check openSet (fronteira)
      let inOpen = openSet.some((node) => node.x === i && node.y === j);

      // Colorir células
      if (i === start.x && j === start.y) {
        fill(0, 255, 0); // Verde - início
      } else if (i === end.x && j === end.y) {
        fill(255, 0, 0); // Vermelho - objetivo
      } else if (grid[i][j] === 1) {
        fill(0); // Preto - parede
      } else if (inClosed) {
        fill(255, 150, 150); // Rosa - já explorado
      } else if (inOpen) {
        fill(150, 255, 150); // Verde - fronteira (a explorar)
      } else {
        fill(255); // Branco - vazio
      }

      stroke(200);
      strokeWeight(1);
      rect(x, y, cellSize, cellSize);
    }
  }

  // Desenhar caminho
  if (path.length > 0) {
    stroke(0, 0, 255);
    strokeWeight(3);
    noFill();
    beginShape();
    for (let cell of path) {
      let x = cell.x * cellSize + cellSize / 2;
      let y = cell.y * cellSize + cellSize / 2;
      vertex(x, y);
    }
    endShape();
  }

  // Executar próximo passo do algoritmo
  if (isRunning && pathfindingGenerator) {
    let result = pathfindingGenerator.next();

    if (!result.done && result.value) {
      openSet = result.value.openSet || [];
      closedSet = result.value.closedSet || [];
    } else if (result.done && result.value) {
      // Algoritmo terminou
      isRunning = false;
      openSet = result.value.openSet || [];
      closedSet = result.value.closedSet || [];
      path = result.value.path || [];

      if (path.length === 0) {
        console.log("Nenhum caminho encontrado!");
        alert("Nenhum caminho encontrado!");
      } else {
        console.log(`Caminho encontrado com ${path.length} passos`);
      }
    }
  }
}

function isMouseOverSidebar() {
  let sidebar = document.getElementById("sidebar");
  let rect = sidebar.getBoundingClientRect();
  return (
    mouseX >= rect.left &&
    mouseX <= rect.right &&
    mouseY >= rect.top &&
    mouseY <= rect.bottom
  );
}

function mouseDragged() {
  // Ignorar se o mouse está sobre a sidebar
  if (isMouseOverSidebar()) {
    return;
  }

  let i = floor(mouseX / cellSize);
  let j = floor(mouseY / cellSize);

  if (i >= 0 && i < cols && j >= 0 && j < rows) {
    // Não permitir pintar sobre início ou objetivo
    if ((i === start.x && j === start.y) || (i === end.x && j === end.y)) {
      return;
    }

    if (mouseButton === LEFT) {
      grid[i][j] = 1; // Pintar de preto (parede)
    } else if (mouseButton === RIGHT) {
      grid[i][j] = 0; // Pintar de branco (vazio)
    }
  }

  return false; // Prevenir comportamento padrão
}

function mousePressed() {
  if (isMouseOverSidebar()) {
    return;
  }

  mouseDragged(); // Permitir pintar com clique único também
  return false; // Menu de contexto
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  cols = floor(width / cellSize);
  rows = floor(height / cellSize);

  // Reinicializar grid
  let newGrid = [];
  for (let i = 0; i < cols; i++) {
    newGrid[i] = [];
    for (let j = 0; j < rows; j++) {
      newGrid[i][j] = (grid[i] && grid[i][j]) || 0;
    }
  }
  grid = newGrid;
}

// Botões
function runPathfinding() {
  if (isRunning) 
    return;

  let algorithm = document.getElementById("algorithm").value;
  console.log(`Executando ${algorithm.toUpperCase()}...`);

  // Limpar visualização anterior
  path = [];
  openSet = [];
  closedSet = [];

  if (algorithm === "astar") {
    pathfindingGenerator = aStarGenerator(start, end, cols, rows, grid);
    isRunning = true;
  } else if (algorithm === "bfs") {
    pathfindingGenerator = bfsGenerator(start, end, cols, rows, grid);
    isRunning = true;
  }
}

function clearPath() {
  path = [];
  openSet = [];
  closedSet = [];
  isRunning = false;
  pathfindingGenerator = null;
}

function clearWalls() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 1) {
        grid[i][j] = 0;
      }
    }
  }
  path = [];
  openSet = [];
  closedSet = [];
  isRunning = false;
  pathfindingGenerator = null;
}
