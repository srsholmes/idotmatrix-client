import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { screenOn, screenOff, flipScreen, setBrightness, freezeScreen } from "../../protocol/commands/common.ts";
import { log, error } from "../../utils/logger.ts";

export function registerScreenCommand(program: Command): void {
	const cmd = program
		.command("screen")
		.description("Control screen state (on/off/flip/brightness/freeze)");

	cmd
		.command("on")
		.description("Turn screen on")
		.action(async () => {
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(screenOn());
			log("Screen turned on.");
			await transport.disconnect();
		});

	cmd
		.command("off")
		.description("Turn screen off")
		.action(async () => {
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(screenOff());
			log("Screen turned off.");
			await transport.disconnect();
		});

	cmd
		.command("flip")
		.description("Flip screen 180 degrees")
		.option("--no-flip", "Return to normal orientation")
		.action(async (opts) => {
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(flipScreen(opts.flip !== false));
			log(opts.flip !== false ? "Screen flipped." : "Screen orientation normal.");
			await transport.disconnect();
		});

	cmd
		.command("brightness")
		.description("Set screen brightness (5-100)")
		.argument("<percent>", "Brightness percentage (5-100)")
		.action(async (percent: string) => {
			const pct = Number.parseInt(percent, 10);
			if (Number.isNaN(pct) || pct < 5 || pct > 100) {
				error("Brightness must be between 5 and 100.");
				process.exit(1);
			}
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(setBrightness(pct));
			log(`Brightness set to ${pct}%.`);
			await transport.disconnect();
		});

	cmd
		.command("freeze")
		.description("Freeze/unfreeze the screen")
		.action(async () => {
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(freezeScreen());
			log("Screen freeze toggled.");
			await transport.disconnect();
		});
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
