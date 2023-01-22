import { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 8080 });
console.log("Listening on", 8080);

server.on("connection", (ws) => {
  console.log("New connection");

  ws.on("message", (data) => {
    console.log("Received message", data.toString());
    ws.send("pong");
  });

  ws.send("welcome!");
});
