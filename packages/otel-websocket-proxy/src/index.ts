import { createServer as createServerHttp } from "node:http";
import { createServer as createServerHttps } from "node:https";
import { promises as fs } from "node:fs";
import { parse } from "node:url";
import { proxy } from "./proxy.js";
import { getCertificate } from "./ssl/index.js";
import packageInfo from "../package.json" assert { type: "json" };

const npmPackageVersion = packageInfo.version;

export type SSLInfo = {
	cert: string;
	key: string;
};

const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

const tracesEndpoint =
	process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
	(exporterEndpoint ? `${exporterEndpoint}/v1/traces` : undefined) ??
	"http://localhost:4318/v1/traces";

const metricsEndpoint =
	process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ??
	(exporterEndpoint ? `${exporterEndpoint}/v1/metrics` : undefined) ??
	"http://localhost:4318/v1/metrics";

export const listen = async ({
	port,
	useHttps = false,
	ssl,
	maxPayloadBytes,
}: {
	port: number;
	useHttps?: boolean;
	ssl?: SSLInfo;
	maxPayloadBytes?: number;
}) => {
	console.log(`Otel Websocket Proxy (version ${npmPackageVersion})`);

	const server = useHttps ? await makeHttpsServer(ssl) : createServerHttp();

	const traces = proxy("traces", tracesEndpoint, maxPayloadBytes);
	const metrics = proxy("metrics", metricsEndpoint, maxPayloadBytes);

	server.on("upgrade", (request, socket, upgradeHead) => {
		const { pathname } = parse(request.url ?? "");

		if (pathname === "/v1/traces") {
			traces.handleUpgrade(request, socket, upgradeHead, (ws) =>
				traces.emit("connection", ws, request),
			);
		} else if (pathname === "/v1/metrics") {
			metrics.handleUpgrade(request, socket, upgradeHead, (ws) =>
				metrics.emit("connection", ws, request),
			);
		} else {
			console.warn("[Unknown path]", pathname);
			socket.destroy();
		}
	});

	server.listen(port);
	console.log(`Proxy is up on :${port}`);
};

const makeHttpsServer = async (ssl?: SSLInfo) => {
	if (ssl) {
		const cert = await fs.readFile(ssl.cert, "utf8");
		const key = await fs.readFile(ssl.key, "utf8");

		return createServerHttps({ cert, key });
	}

	const certificate = await getCertificate();

	return createServerHttps({
		cert: certificate,
		key: certificate,
	});
};
