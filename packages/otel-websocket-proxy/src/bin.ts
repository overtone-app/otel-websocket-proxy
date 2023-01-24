#!/usr/bin/env node

import { listen } from './index.js'

const port = process.env.OTEL_WEBSOCKET_PROXY_PORT ? Number(process.env.OTEL_WEBSOCKET_PROXY_PORT) : 44318
const useHttps = process.env.OTEL_WEBSOCKET_HTTPS !== undefined

listen({ port, useHttps })
