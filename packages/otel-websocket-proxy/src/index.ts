import { createServer } from "http";
import { parse } from "url";
import { WebSocketServer } from "ws";
import { metrics } from "./metrics";
// import { traces } from "./traces";

const URL = "http://localhost:4318/v1/traces";
const PORT = 8080;

const server = createServer();
const traces = new WebSocketServer({ port: PORT });

traces.on("connection", (ws) => {
  ws.once("message", async (body) => {
    // Handshake
    let handshake = body.toString();
    if (handshake !== "init-request") {
      ws.close(400, "Unauthorized");
      return;
    }
    ws.send("init-response");

    console.log("Starting proxy loop");
    while (ws.readyState !== ws.CLOSED) {
      try {
        await new Promise((resolve, reject) => {
          ws.once("message", (body) => {
            console.log("Proxying");
            if (Buffer.isBuffer(body)) {
              fetch(URL, { method: "POST", body }).then(resolve).catch(reject);
            }
          });
        });
      } catch (e) {
        console.error("Fetch failure:", e);
      }
    }
  });

  ws.on("close", (code, reason) => {});
});

// server.on("upgrade", function (request, socket, upgradeHead) {
//   const { pathname } = parse(request.url ?? "");

//   if (pathname === "/v1/traces") {
//     console.log(pathname);
//     traces.handleUpgrade(request, socket, upgradeHead, function (ws) {
//       ws.emit("connection", ws, request);
//     });
//   } else if (pathname === "/v1/metrics") {
//     metrics.handleUpgrade(request, socket, upgradeHead, (ws) =>
//       ws.emit("connection", ws, request)
//     );
//   } else {
//     socket.destroy();
//   }
// });

// server.listen(PORT);
// console.log("Listening on", PORT);
