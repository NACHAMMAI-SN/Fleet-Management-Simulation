const express = require("express");

function createRouter(simulation) {
  const router = express.Router();

  router.get("/robots", (_req, res) => {
    res.json(simulation.getRobots());
  });

  router.get("/state", (_req, res) => {
    res.json(simulation.getState());
  });

  router.post("/task", (req, res) => {
    try {
      const { start, end } = req.body;

      if (
        !start ||
        !end ||
        typeof start.x !== "number" ||
        typeof start.y !== "number" ||
        typeof end.x !== "number" ||
        typeof end.y !== "number"
      ) {
        return res.status(400).json({
          error: "Invalid task payload. Use { start: {x,y}, end: {x,y} }.",
        });
      }

      const task = simulation.createTask(start, end);
      return res.status(201).json(task);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createRouter };
