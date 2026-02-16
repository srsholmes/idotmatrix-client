import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { setClockMode } from "../../protocol/commands/clock.ts";
import { setTime } from "../../protocol/commands/common.ts";
import { log, error } from "../../utils/logger.ts";
import type { ClockStyle } from "../../protocol/types.ts";

export function registerClockCommand(program: Command): void {
	const cmd = program.command("clock").description("Clock mode controls");

	cmd
		.command("set")
		.description("Set clock display mode")
		.option("--style <n>", "Clock style (0-7)", "0")
		.option("--color <hex>", "Clock color as hex (e.g. ff0000)", "ffffff")
		.option("--no-date", "Hide date")
		.option("--12h", "Use 12-hour format")
		.action(async (opts) => {
			const style = Number.parseInt(opts.style, 10) as ClockStyle;
			if (style < 0 || style > 7) {
				error("Clock style must be 0-7.");
				process.exit(1);
			}
			const color = parseHexColor(opts.color);
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(setClockMode(style, color, opts.date !== false, !opts["12h"]));
			log("Clock mode set.");
			await transport.disconnect();
		});

	cmd
		.command("sync")
		.description("Sync device time to current system time")
		.action(async () => {
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(setTime(new Date()));
			log("Time synced.");
			await transport.disconnect();
		});
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace(/^#/, "");
	return {
		r: Number.parseInt(clean.slice(0, 2), 16) || 0,
		g: Number.parseInt(clean.slice(2, 4), 16) || 0,
		b: Number.parseInt(clean.slice(4, 6), 16) || 0,
	};
}

function getAddress(program: Command): string {
	const opts = program.opts();
	const address = opts.address ?? process.env.IDOTMATRIX_ADDRESS;
	if (!address) {
		error("Device address required. Use --address or set IDOTMATRIX_ADDRESS env var.");
		process.exit(1);
	}
	return address;
}
