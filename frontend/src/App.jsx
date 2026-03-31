import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import GridCanvas from "./GridCanvas";
import { createTask, fetchState } from "./api";

const DEFAULT_FORM = {
  startX: 0,
  startY: 0,
  endX: 5,
  endY: 5,
};

export default function App() {
  const [state, setState] = useState({
    grid: { width: 20, height: 20 },
    robots: [],
    queuedTasks: [],
  });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchState().then(setState).catch((err) => setError(err.message));

    const socket = io("http://localhost:4000");
    socket.on("state:update", (nextState) => {
      setState(nextState);
    });

    return () => socket.disconnect();
  }, []);

  const robots = useMemo(() => state.robots || [], [state.robots]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await createTask(
        { x: Number(form.startX), y: Number(form.startY) },
        { x: Number(form.endX), y: Number(form.endY) }
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page">
      <h1>Fleet Management System with Real-Time Simulation</h1>
      <section className="content">
        <div className="map-panel">
          <h2>Grid Map</h2>
          <GridCanvas grid={state.grid} robots={robots} />
        </div>

        <aside className="sidebar">
          <form className="task-form" onSubmit={onSubmit}>
            <h2>Create Task</h2>
            <div className="row">
              <label>
                Start X
                <input
                  type="number"
                  min="0"
                  max={state.grid.width - 1}
                  value={form.startX}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startX: e.target.value }))
                  }
                />
              </label>
              <label>
                Start Y
                <input
                  type="number"
                  min="0"
                  max={state.grid.height - 1}
                  value={form.startY}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startY: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="row">
              <label>
                End X
                <input
                  type="number"
                  min="0"
                  max={state.grid.width - 1}
                  value={form.endX}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endX: e.target.value }))
                  }
                />
              </label>
              <label>
                End Y
                <input
                  type="number"
                  min="0"
                  max={state.grid.height - 1}
                  value={form.endY}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endY: e.target.value }))
                  }
                />
              </label>
            </div>
            <button type="submit">Create Task</button>
            {error ? <p className="error">{error}</p> : null}
          </form>

          <div className="robot-list">
            <h2>Robots</h2>
            <ul>
              {robots.map((robot) => (
                <li key={robot.id}>
                  <strong>{robot.id}</strong> ({robot.x}, {robot.y}) - {robot.status}
                  {robot.taskId ? ` [${robot.taskId}]` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div className="robot-list">
            <h2>Queued Tasks</h2>
            <ul>
              {state.queuedTasks.length === 0 ? (
                <li>None</li>
              ) : (
                state.queuedTasks.map((task) => (
                  <li key={task.id}>
                    {task.id}: ({task.start.x}, {task.start.y}) to ({task.end.x},{" "}
                    {task.end.y})
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
