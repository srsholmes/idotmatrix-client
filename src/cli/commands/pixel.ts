import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { setPixel } from "../../protocol/commands/graffiti.ts";
import { log, error } from "../../utils/logger.ts";

export function registerPixelCommand(program: Command): void {
	program
		.command("pixel")
		.description("Set individual pixel color")
		.argument("<x>", "X position")
		.argument("<y>", "Y position")
		.argument("<hex>", "Color as hex (e.g. ff0000)")
		.action(async (xStr: string, yStr: string, hex: string) => {
			const x = Number.parseInt(xStr, 10);
			const y = Number.parseInt(yStr, 10);
			if (Number.isNaN(x) || Number.isNaN(y)) {
				error("X and Y must be numbers.");
				process.exit(1);
			}
			const color = parseHexColor(hex);
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(setPixel(x, y, color));
			log(`Pixel (${x}, ${y}) set to #${hex}.`);
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
