import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { setFullscreenColor } from "../../protocol/commands/fullscreen-color.ts";
import { log, error } from "../../utils/logger.ts";

export function registerColorCommand(program: Command): void {
	program
		.command("color")
		.description("Fill screen with a solid color")
		.argument("<hex>", "Color as hex (e.g. ff0000 for red)")
		.action(async (hex: string) => {
			const color = parseHexColor(hex);
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(setFullscreenColor(color));
			log(`Color set to #${hex}.`);
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
