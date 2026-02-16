import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { setScoreboard } from "../../protocol/commands/scoreboard.ts";
import { log, error } from "../../utils/logger.ts";

export function registerScoreboardCommand(program: Command): void {
	program
		.command("scoreboard")
		.description("Display scoreboard with two counters")
		.argument("<score1>", "First score (0-999)")
		.argument("<score2>", "Second score (0-999)")
		.action(async (score1: string, score2: string) => {
			const s1 = Number.parseInt(score1, 10);
			const s2 = Number.parseInt(score2, 10);
			if (Number.isNaN(s1) || Number.isNaN(s2)) {
				error("Scores must be numbers.");
				process.exit(1);
			}
			const transport = new NobleTransport();
			await transport.connect(getAddress(program));
			await transport.write(setScoreboard(s1, s2));
			log(`Scoreboard set: ${s1} - ${s2}`);
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
