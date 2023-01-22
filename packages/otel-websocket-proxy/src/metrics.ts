import { WebSocketServer } from "ws";

const metrics = new WebSocketServer({ noServer: true });

metrics.on("connection", (ws) => {
  console.log("New metrics connection");

  ws.on("message", (data) => {
    console.log("Received message", data.toString());
    ws.send("m pong");
  });

  ws.send("m welcome!");
});

export { metrics };
