#!/usr/bin/env node

import { listen } from "./index.js";

console.log(
	"process.env.OTEL_*\n",
	Object.keys(process.env)
		.filter((k) => k.startsWith("OTEL_"))
		.map((k) => `  ${k}=${process.env[k]}`)
		.join("\n"),
);

const port = process.env.OTEL_WEBSOCKET_PROXY_PORT
	? Number(process.env.OTEL_WEBSOCKET_PROXY_PORT)
	: 44318;
const useHttps = process.env.OTEL_WEBSOCKET_HTTPS !== undefined;

const sslKey = process.env.OTEL_WEBSOCKET_HTTPS_KEY_PATH;
const sslCert = process.env.OTEL_WEBSOCKET_HTTPS_CERT_PATH;

const ssl = sslKey && sslCert ? { key: sslKey, cert: sslCert } : undefined;

const maxPayloadBytes = process.env.OTEL_WEBSOCKET_MAX_PAYLOAD_BYTES
	? Number(process.env.OTEL_WEBSOCKET_MAX_PAYLOAD_BYTES)
	: undefined;

listen({ port, useHttps, ssl, maxPayloadBytes });
