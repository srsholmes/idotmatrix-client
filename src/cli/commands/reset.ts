import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { reset } from "../../protocol/commands/common.ts";
import { log, error } from "../../utils/logger.ts";

export function registerResetCommand(program: Command): void {
	program
		.command("reset")
		.description("Reset device to defaults")
		.action(async () => {
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			const packets = reset();
			for (const packet of packets) {
				await transport.write(packet);
			}
			log("Device reset.");
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
