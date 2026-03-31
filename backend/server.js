const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const simulation = require("./simulation");
const { createRouter } = require("./routes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/", createRouter(simulation));

io.on("connection", (socket) => {
  socket.emit("state:update", simulation.getState());
});

setInterval(() => {
  simulation.tick();
  io.emit("state:update", simulation.getState());
}, simulation.TICK_MS);

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
