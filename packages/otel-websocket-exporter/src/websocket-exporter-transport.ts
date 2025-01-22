import type {
	ExportResponse,
	IExporterTransport,
} from "@opentelemetry/otlp-exporter-base";
import { diag } from "@opentelemetry/api";
import {
	connectToWebSocket,
	sendToWebSocket,
	closeWebSocket,
} from "./websocket.js";

const DEFAULT_WEBSOCKET_RESOURCE_PATH = "v1/traces";
const DEFAULT_WEBSOCKET_URL = `http://localhost:44318/${DEFAULT_WEBSOCKET_RESOURCE_PATH}`;

export interface WebSocketTransportConfig {
	url?: string;
	headers?: Record<string, string>;
	// Add other websocket-specific options as needed
}

class WebSocketExporterTransport implements IExporterTransport {
	private _websocketPromise: Promise<WebSocket>;

	constructor(private _config: WebSocketTransportConfig) {
		this._websocketPromise = connectToWebSocket(
			this._config.url ?? DEFAULT_WEBSOCKET_URL,
		);
	}

	async send(data: Uint8Array, timeoutMillis: number): Promise<ExportResponse> {
		const socket = await this._websocketPromise;
		try {
			// Convert Uint8Array to format expected by WebSocket
			const message = new TextDecoder().decode(data);

			sendToWebSocket(socket, message);
			return { status: "success" };
		} catch (error) {
			diag.error("Failed to send data through WebSocket", error);
			return {
				status: "failure",
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}

	shutdown() {
		if (this._websocketPromise) {
			this._websocketPromise
				.then((socket) => {
					closeWebSocket(socket);
				})
				.catch((error) => {
					diag.error("Failed to close WebSocket connection", error);
				});
		}
	}
}

export function createWebSocketExporterTransport(
	config: WebSocketTransportConfig,
): IExporterTransport {
	return new WebSocketExporterTransport(config);
}
