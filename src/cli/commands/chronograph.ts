import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { setChronographMode } from "../../protocol/commands/chronograph.ts";
import { log, error } from "../../utils/logger.ts";
import type { ChronographMode } from "../../protocol/types.ts";

export function registerChronographCommand(program: Command): void {
	program
		.command("chronograph")
		.description("Stopwatch controls")
		.argument("<action>", "Action: reset, start, pause, continue")
		.action(async (action: string) => {
			const modes: Record<string, ChronographMode> = {
				reset: 0,
				start: 1,
				pause: 2,
				continue: 3,
			};
			const mode = modes[action];
			if (mode === undefined) {
				error("Action must be: reset, start, pause, or continue.");
				process.exit(1);
			}
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(setChronographMode(mode));
			log(`Chronograph ${action}.`);
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
