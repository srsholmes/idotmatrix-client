import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { log } from "../../utils/logger.ts";

export function registerScanCommand(program: Command): void {
	program
		.command("scan")
		.description("Scan for nearby iDotMatrix devices")
		.option("-t, --timeout <ms>", "Scan timeout in milliseconds", "5000")
		.action(async (opts) => {
			const timeout = Number.parseInt(opts.timeout, 10);
			log(`Scanning for iDotMatrix devices (${timeout}ms)...`);

			const transport = new NobleTransport();
			const devices = await transport.scan(timeout);

			if (devices.length === 0) {
				log("No devices found.");
			} else {
				log(`Found ${devices.length} device(s):`);
				for (const device of devices) {
					log(`  ${device.name}  ${device.address}  RSSI: ${device.rssi ?? "N/A"}`);
				}
			}

			process.exit(0);
		});
}
