import { WebSocketServer } from "ws";

const traces = new WebSocketServer({ noServer: true });

traces.on("connection", (ws) => {
  console.log("New traces connection");

  ws.on("message", (data) => {
    console.log("Received message", data.toString());
    ws.send("t pong");
  });

  ws.send("t welcome!");
});

export { traces };
