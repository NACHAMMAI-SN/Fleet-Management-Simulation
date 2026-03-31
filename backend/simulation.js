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
let nextTaskId = 1;

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

      if (!isInsideGrid(nx, ny)) {
        continue;
      }
      if (visited.has(nextKey)) {
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
  if (taskQueue.length === 0) {
    return;
  }

  for (let i = 0; i < taskQueue.length; i += 1) {
    const task = taskQueue[i];
    const idleRobots = robots.filter((robot) => robot.status === "idle");

    if (idleRobots.length === 0) {
      return;
    }

    let selected = idleRobots[0];
    let bestDist = distanceManhattan(selected, task.start);

    for (const robot of idleRobots.slice(1)) {
      const dist = distanceManhattan(robot, task.start);
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

    selected.path = [...toStart, ...toEnd];
    selected.task = task;
    selected.status = selected.path.length > 0 ? "moving" : "idle";

    taskQueue.splice(i, 1);
    i -= 1;
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
  };
}

module.exports = {
  TICK_MS,
  tick,
  getRobots,
  getState,
  createTask,
};
