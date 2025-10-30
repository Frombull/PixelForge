// Algoritmo A* com visualização
class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.f = 0; // Custo total (g + h)
    this.g = 0; // Custo do início até este nó
    this.h = 0; // Heurística (estimativa até o objetivo)
    this.parent = null;
  }
}

function heuristic(a, b) {
  // Distância Euclidiana (melhor para movimento diagonal)
  let dx = abs(a.x - b.x);
  let dy = abs(a.y - b.y);
  return sqrt(dx * dx + dy * dy);
}

function getNeighbors(node, cols, rows, grid) {
  let neighbors = [];
  let x = node.x;
  let y = node.y;

  // Direções: [dx, dy, custo]
  // Movimentos cardinais (custo 1) e diagonais (custo √2 ≈ 1.414)
  const directions = [
    [-1, 0, 1],    // esquerda
    [1, 0, 1],     // direita
    [0, -1, 1],    // cima
    [0, 1, 1],     // baixo
    [-1, -1, 1.414], // diagonal superior esquerda
    [1, -1, 1.414],  // diagonal superior direita
    [-1, 1, 1.414],  // diagonal inferior esquerda
    [1, 1, 1.414]    // diagonal inferior direita
  ];

  for (let [dx, dy, cost] of directions) {
    let newX = x + dx;
    let newY = y + dy;

    // Verificar limites e se não é parede
    if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && grid[newX][newY] !== 1) {
      // Para movimento diagonal, verificar se os lados adjacentes não são paredes
      // (evitar "cortar cantos")
      if (dx !== 0 && dy !== 0) {
        if (grid[x + dx][y] === 1 || grid[x][y + dy] === 1) {
          continue; // Não permitir diagonal se houver parede nos lados
        }
      }
      neighbors.push({ x: newX, y: newY, cost: cost });
    }
  }

  return neighbors;
}

function reconstructPath(endNode) {
  let path = [];
  let current = endNode;

  while (current !== null) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path;
}

// Gerador para A* com visualização passo a passo
function* aStarGenerator(start, end, cols, rows, grid) {
  let openSet = [];
  let closedSet = [];
  let startNode = new Node(start.x, start.y);
  let endNode = new Node(end.x, end.y);

  openSet.push(startNode);

  while (openSet.length > 0) {
    // Encontrar nó com menor f na openSet
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }

    let current = openSet[currentIndex];

    // Chegou ao objetivo
    if (current.x === endNode.x && current.y === endNode.y) {
      return {
        done: true,
        path: reconstructPath(current),
        openSet: openSet.map((n) => ({ x: n.x, y: n.y })),
        closedSet: closedSet.map((n) => ({ x: n.x, y: n.y })),
      };
    }

    // Mover current da openSet para closedSet
    openSet.splice(currentIndex, 1);
    closedSet.push(current);

    // Verificar vizinhos
    let neighbors = getNeighbors(current, cols, rows, grid);

    for (let neighborPos of neighbors) {
      // Verificar se já está na closedSet
      let inClosed = closedSet.some(
        (node) => node.x === neighborPos.x && node.y === neighborPos.y
      );
      if (inClosed) continue;

      let neighbor = new Node(neighborPos.x, neighborPos.y);
      let tentativeG = current.g + neighborPos.cost;

      // Verificar se já está na openSet
      let existingNode = openSet.find(
        (node) => node.x === neighbor.x && node.y === neighbor.y
      );

      if (existingNode) {
        if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.h = heuristic(neighbor, endNode);
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      } else {
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
        openSet.push(neighbor);
      }
    }

    // Yield estado atual para visualização
    yield {
      done: false,
      openSet: openSet.map((n) => ({ x: n.x, y: n.y })),
      closedSet: closedSet.map((n) => ({ x: n.x, y: n.y })),
      current: { x: current.x, y: current.y },
    };
  }

  // Não encontrou caminho
  return {
    done: true,
    path: [],
    openSet: [],
    closedSet: closedSet.map((n) => ({ x: n.x, y: n.y })),
  };
}

// Algoritmo BFS (Breadth-First Search) com visualização
function* bfsGenerator(start, end, cols, rows, grid) {
  let queue = [];
  let visited = [];
  let startNode = new Node(start.x, start.y);
  let endNode = new Node(end.x, end.y);

  queue.push(startNode);
  visited.push(startNode);

  while (queue.length > 0) {
    // BFS usa FIFO - pega o primeiro da fila
    let current = queue.shift();

    // Chegou ao objetivo
    if (current.x === endNode.x && current.y === endNode.y) {
      return {
        done: true,
        path: reconstructPath(current),
        openSet: queue.map((n) => ({ x: n.x, y: n.y })),
        closedSet: visited.map((n) => ({ x: n.x, y: n.y })),
      };
    }

    // Explorar vizinhos
    let neighbors = getNeighbors(current, cols, rows, grid);

    for (let neighborPos of neighbors) {
      // Verificar se já foi visitado
      let alreadyVisited = visited.some(
        (node) => node.x === neighborPos.x && node.y === neighborPos.y
      );

      if (!alreadyVisited) {
        let neighbor = new Node(neighborPos.x, neighborPos.y);
        neighbor.parent = current;
        queue.push(neighbor);
        visited.push(neighbor);
      }
    }

    // Yield estado atual para visualização
    yield {
      done: false,
      openSet: queue.map((n) => ({ x: n.x, y: n.y })),
      closedSet: visited.map((n) => ({ x: n.x, y: n.y })),
      current: { x: current.x, y: current.y },
    };
  }

  // Não encontrou caminho
  return {
    done: true,
    path: [],
    openSet: [],
    closedSet: visited.map((n) => ({ x: n.x, y: n.y })),
  };
}
