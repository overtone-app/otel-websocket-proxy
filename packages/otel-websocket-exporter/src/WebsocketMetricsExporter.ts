import type {
	PushMetricExporter,
	ResourceMetrics,
} from "@opentelemetry/sdk-metrics";
import {
	createOtlpNetworkExportDelegate,
	getSharedConfigurationDefaults,
	OTLPExporterBase,
} from "@opentelemetry/otlp-exporter-base";

import { JsonMetricsSerializer } from "@opentelemetry/otlp-transformer";
import {
	createWebSocketExporterTransport,
	type WebSocketTransportConfig,
} from "./websocket-exporter-transport.js";

export class WebsocketMetricExporter
	extends OTLPExporterBase<ResourceMetrics>
	implements PushMetricExporter
{
	constructor(config: WebSocketTransportConfig = {}) {
		super(
			createOtlpNetworkExportDelegate(
				getSharedConfigurationDefaults(),
				JsonMetricsSerializer,
				createWebSocketExporterTransport(config),
			),
		);
	}
}
