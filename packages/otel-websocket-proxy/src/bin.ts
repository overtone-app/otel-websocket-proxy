import { listen } from "./";

const port = Number(process.env.OTEL_WEBSOCKET_PROXY_PORT) ?? 44318;

listen(port);
