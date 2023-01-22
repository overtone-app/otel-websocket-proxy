import { listen } from './index.js'

const port = process.env.OTEL_WEBSOCKET_PROXY_PORT ? Number(process.env.OTEL_WEBSOCKET_PROXY_PORT) : 44318

listen(port)
