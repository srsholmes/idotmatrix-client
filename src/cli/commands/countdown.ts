import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { setCountdownMode } from "../../protocol/commands/countdown.ts";
import { log, error } from "../../utils/logger.ts";
import type { CountdownMode } from "../../protocol/types.ts";

export function registerCountdownCommand(program: Command): void {
	program
		.command("countdown")
		.description("Countdown timer controls")
		.argument("<action>", "Action: start, pause, restart, disable")
		.option("-m, --minutes <n>", "Minutes", "0")
		.option("-s, --seconds <n>", "Seconds", "0")
		.action(async (action: string, opts) => {
			const modes: Record<string, CountdownMode> = {
				disable: 0,
				start: 1,
				pause: 2,
				restart: 3,
			};
			const mode = modes[action];
			if (mode === undefined) {
				error("Action must be: start, pause, restart, or disable.");
				process.exit(1);
			}
			const minutes = Number.parseInt(opts.minutes, 10);
			const seconds = Number.parseInt(opts.seconds, 10);
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(setCountdownMode(mode, minutes, seconds));
			log(`Countdown ${action}.`);
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
