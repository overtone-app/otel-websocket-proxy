import { WebSocketServer } from "ws";

const tracesEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
  "http://localhost:4318/v1/traces";

const metricsEndpoint =
  process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ??
  "http://localhost:4318/v1/metrics";

const proxy = (name: string, endpoint: string): WebSocketServer => {
  const server = new WebSocketServer({ noServer: true });

  server.on("connection", (ws) => {
    ws.once("message", async (body) => {
      let handshake = body.toString();
      if (handshake !== "init-request") {
        console.warn(`[${name}] Handshake failed, closing connection`);
        ws.close(400, "Unauthorized");
        return;
      }

      console.log(`[${name}] 🤝`);
      ws.send("init-response");

      ws.on("message", async (body) => {
        if (Buffer.isBuffer(body)) {
          fetch(endpoint, {
            method: "POST",
            body,
            headers: { "Content-Type": "application/json" },
          }).catch((e) => console.warn(`[${name}] Proxy failure`, e));
        } else {
          console.warn(`[${name}] Invalid payload on ${name}, ignoring`, body);
        }
      });
    });
  });

  return server;
};

const traces = proxy("traces", tracesEndpoint);
const metrics = proxy("metrics", metricsEndpoint);

export { traces, metrics };
