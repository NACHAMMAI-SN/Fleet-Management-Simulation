import { useEffect, useRef } from "react";

const CELL_SIZE = 28;
const ROBOT_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

function drawGrid(ctx, width, height) {
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += 1) {
    const px = x * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height * CELL_SIZE);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += 1) {
    const py = y * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width * CELL_SIZE, py);
    ctx.stroke();
  }
}

export default function GridCanvas({ state, onCellClick }) {
  const canvasRef = useRef(null);
  const animatedRef = useRef(new Map());
  const robots = state.robots || [];
  const grid = state.grid;

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    onCellClick(x, y);
  };

  useEffect(() => {
    const map = animatedRef.current;
    robots.forEach((robot) => {
      const prev = map.get(robot.id);
      if (!prev) {
        map.set(robot.id, { x: robot.x, y: robot.y, tx: robot.x, ty: robot.y });
        return;
      }
      map.set(robot.id, { ...prev, tx: robot.x, ty: robot.y });
    });
  }, [robots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let lastTime = performance.now();

    const render = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      const alpha = Math.min(1, dt / 500);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(ctx, grid.width, grid.height);

      if (state.obstacles) {
        state.obstacles.forEach((obs) => {
          ctx.fillStyle = "#e74c3c";
          ctx.fillRect(
            obs.x * CELL_SIZE + 1,
            obs.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
        });
      }

      const robotsMap = animatedRef.current;
      for (const [index, robot] of robots.entries()) {
        const animated = robotsMap.get(robot.id);
        if (!animated) {
          continue;
        }

        animated.x += (animated.tx - animated.x) * alpha;
        animated.y += (animated.ty - animated.y) * alpha;

        const centerX = animated.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = animated.y * CELL_SIZE + CELL_SIZE / 2;
        const color = ROBOT_COLORS[index % ROBOT_COLORS.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, CELL_SIZE * 0.32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#111827";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(robot.id, centerX, centerY + 4);
      }

      animationId = window.requestAnimationFrame(render);
    };

    animationId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationId);
  }, [grid.height, grid.width, robots, state.obstacles]);

  return (
    <canvas
      ref={canvasRef}
      width={grid.width * CELL_SIZE}
      height={grid.height * CELL_SIZE}
      className="grid-canvas"
      onClick={handleClick}
    />
  );
}
