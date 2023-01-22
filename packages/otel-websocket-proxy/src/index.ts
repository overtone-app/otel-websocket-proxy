import { DiagConsoleLogger } from "@opentelemetry/api";
import { createServer } from "http";
import { parse } from "url";
import { WebSocketServer } from "ws";
import { metrics } from "./metrics";
// import { traces } from "./traces";

const collectorUrl =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
  "http://localhost:4318/v1/traces";

const server = createServer();
const traces = new WebSocketServer({ port: 44318 });
console.log("Listening");

traces.on("connection", (ws) => {
  console.log("Waiting for handshake");
  ws.once("message", async (body) => {
    // Handshake
    let handshake = body.toString();
    if (handshake !== "init-request") {
      console.log("Handshake failed");
      ws.close(400, "Unauthorized");
      return;
    }
    ws.send("init-response");

    console.log("Starting proxy loop");
    while (ws.readyState !== ws.CLOSED) {
      try {
        await new Promise((resolve, reject) => {
          ws.once("message", (body) => {
            console.log("Proxying", Buffer.isBuffer(body));
            if (Buffer.isBuffer(body)) {
              fetch(collectorUrl, {
                method: "POST",
                body,
                headers: { "Content-Type": "application/json" },
              })
                .then(resolve)
                .catch(reject);
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
