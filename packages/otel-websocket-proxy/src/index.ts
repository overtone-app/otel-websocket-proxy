import { createServer } from "http";
import { parse } from "url";
import { traces, metrics } from "./proxy";

const server = createServer();

server.on("upgrade", function (request, socket, upgradeHead) {
  const { pathname } = parse(request.url ?? "");

  if (pathname === "/v1/traces") {
    console.log(pathname);
    traces.handleUpgrade(request, socket, upgradeHead, (ws) =>
      traces.emit("connection", ws, request)
    );
  } else if (pathname === "/v1/metrics") {
    metrics.handleUpgrade(request, socket, upgradeHead, (ws) =>
      metrics.emit("connection", ws, request)
    );
  } else {
    socket.destroy();
  }
});

const PORT = 44318;
server.listen(PORT);
console.log("Listening on", PORT);
