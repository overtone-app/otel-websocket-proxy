import { WebSocketServer } from "ws";

const tracesEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
  "http://localhost:4318/v1/traces";

const metricsEndpoint =
  process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ??
  "http://localhost:4318/v1/metrics";

const proxy = (endpoint: string): WebSocketServer => {
  const server = new WebSocketServer({ noServer: true });

  server.on("connection", (ws) => {
    console.log("Waiting for handshake");
    ws.once("message", async (body) => {
      let handshake = body.toString();
      if (handshake !== "init-request") {
        console.log("Handshake failed");
        ws.close(400, "Unauthorized");
        return;
      }
      ws.send("init-response");

      console.log("Handshake complete");
      console.log("Starting proxy loop");
      while (ws.readyState !== ws.CLOSED) {
        try {
          await new Promise((resolve, reject) => {
            ws.once("message", (body) => {
              if (Buffer.isBuffer(body)) {
                console.log("Proxying", body);
                fetch(endpoint, {
                  method: "POST",
                  body,
                  headers: { "Content-Type": "application/json" },
                })
                  .then(resolve)
                  .catch(reject);
              } else {
                console.warn("Invalid payload, ignoring");
              }
            });
          });
        } catch (e) {
          console.error("Proxy failure", e);
        }
      }
    });

    ws.on("close", (code, reason) => {});
  });

  return server;
};

const traces = proxy(tracesEndpoint);
const metrics = proxy(metricsEndpoint);

export { traces, metrics };
