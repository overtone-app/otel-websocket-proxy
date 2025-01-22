import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";
import {
	createOtlpNetworkExportDelegate,
	getSharedConfigurationDefaults,
	OTLPExporterBase,
} from "@opentelemetry/otlp-exporter-base";

import { JsonTraceSerializer } from "@opentelemetry/otlp-transformer";
import {
	createWebSocketExporterTransport,
	type WebSocketTransportConfig,
} from "./websocket-exporter-transport.js";

/**
 * Websocket Trace Exporter for Web
 */
export class WebsocketTraceExporter
	extends OTLPExporterBase<ReadableSpan[]>
	implements SpanExporter
{
	constructor(config: WebSocketTransportConfig = {}) {
		super(
			createOtlpNetworkExportDelegate(
				getSharedConfigurationDefaults(),
				JsonTraceSerializer,
				createWebSocketExporterTransport(config),
			),
		);
	}
}
