const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const TICK_MS = 500;

const randomInRange = (max) => Math.floor(Math.random() * max);

const makeRobot = (id) => ({
  id,
  x: randomInRange(GRID_WIDTH),
  y: randomInRange(GRID_HEIGHT),
  status: "idle",
  path: [],
  task: null,
});

const robots = [makeRobot("R1"), makeRobot("R2"), makeRobot("R3")];

const taskQueue = [];
let obstacles = [];
let nextTaskId = 1;

function addObstacle(x, y) {
  const key = `${x},${y}`;
  const index = obstacles.findIndex((o) => o.x === x && o.y === y);
  if (index === -1) {
    obstacles.push({ x, y });
  } else {
    obstacles.splice(index, 1);
  }
}

function isInsideGrid(x, y) {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

function bfsPath(start, end, blockedSet) {
  const startKey = `${start.x},${start.y}`;
  const endKey = `${end.x},${end.y}`;

  if (startKey === endKey) {
    return [];
  }

  const queue = [start];
  const visited = new Set([startKey]);
  const parent = new Map();
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = `${current.x},${current.y}`;

    if (currentKey === endKey) {
      const path = [];
      let nodeKey = endKey;
      while (nodeKey !== startKey) {
        const [x, y] = nodeKey.split(",").map(Number);
        path.unshift({ x, y });
        nodeKey = parent.get(nodeKey);
      }
      return path;
    }

    for (const { dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const nextKey = `${nx},${ny}`;
      const isObstacle = obstacles.some((o) => o.x === nx && o.y === ny);

      if (!isInsideGrid(nx, ny)) {
        continue;
      }
      if (visited.has(nextKey)) {
        continue;
      }
      if (isObstacle) {
        continue;
      }
      if (blockedSet.has(nextKey) && nextKey !== endKey) {
        continue;
      }

      visited.add(nextKey);
      parent.set(nextKey, currentKey);
      queue.push({ x: nx, y: ny });
    }
  }

  return [];
}

function distanceManhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function assignQueuedTasks() {
  for (const task of [...taskQueue]) {
    const idleRobots = robots.filter((robot) => robot.status === "idle");
    if (idleRobots.length === 0) {
      break;
    }

    let selected = idleRobots[0];
    let bestDist =
      Math.abs(selected.x - task.end.x) + Math.abs(selected.y - task.end.y);

    for (const robot of idleRobots.slice(1)) {
      const dist = Math.abs(robot.x - task.end.x) + Math.abs(robot.y - task.end.y);
      if (dist < bestDist) {
        bestDist = dist;
        selected = robot;
      }
    }

    const blocked = new Set(
      robots
        .filter((robot) => robot.id !== selected.id)
        .map((robot) => `${robot.x},${robot.y}`)
    );
    const toStart = bfsPath(selected, task.start, blocked);
    const toEnd = bfsPath(task.start, task.end, blocked);
    const path = [...toStart, ...toEnd];

    if (path) {
      selected.path = path;
      selected.task = task;
      selected.status = selected.path.length > 0 ? "moving" : "idle";
      const taskIndex = taskQueue.findIndex((queuedTask) => queuedTask.id === task.id);
      if (taskIndex >= 0) {
        taskQueue.splice(taskIndex, 1);
      }
    }
  }
}

function tick() {
  assignQueuedTasks();

  const occupied = new Set(robots.map((robot) => `${robot.x},${robot.y}`));

  for (const robot of robots) {
    if (robot.path.length === 0) {
      if (robot.task) {
        robot.task = null;
      }
      robot.status = "idle";
      continue;
    }

    const nextCell = robot.path[0];
    const currentKey = `${robot.x},${robot.y}`;
    const nextKey = `${nextCell.x},${nextCell.y}`;

    occupied.delete(currentKey);
    if (occupied.has(nextKey)) {
      occupied.add(currentKey);
      robot.status = "moving";
      continue;
    }

    robot.x = nextCell.x;
    robot.y = nextCell.y;
    robot.path.shift();
    robot.status = robot.path.length > 0 ? "moving" : "idle";
    if (robot.path.length === 0) {
      robot.task = null;
    }
    occupied.add(nextKey);
  }
}

function createTask(start, end) {
  if (!isInsideGrid(start.x, start.y) || !isInsideGrid(end.x, end.y)) {
    throw new Error("Task coordinates are outside the grid.");
  }

  const task = {
    id: `T${nextTaskId}`,
    start,
    end,
    createdAt: Date.now(),
  };
  nextTaskId += 1;
  taskQueue.push(task);

  assignQueuedTasks();
  return task;
}

function getRobots() {
  return robots.map((robot) => ({
    id: robot.id,
    x: robot.x,
    y: robot.y,
    status: robot.status,
    taskId: robot.task?.id ?? null,
  }));
}

function getState() {
  return {
    grid: { width: GRID_WIDTH, height: GRID_HEIGHT },
    tickMs: TICK_MS,
    robots: getRobots(),
    queuedTasks: [...taskQueue],
    obstacles: [...obstacles],
  };
}

module.exports = {
  TICK_MS,
  tick,
  getRobots,
  getState,
  createTask,
  addObstacle,
};
