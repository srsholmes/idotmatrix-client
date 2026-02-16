import { Command } from "commander";
import { setVerbose } from "../utils/logger.ts";
import { registerScanCommand } from "./commands/scan.ts";
import { registerScreenCommand } from "./commands/screen.ts";
import { registerImageCommand } from "./commands/image.ts";
import { registerGifCommand } from "./commands/gif.ts";
import { registerClockCommand } from "./commands/clock.ts";
import { registerCountdownCommand } from "./commands/countdown.ts";
import { registerChronographCommand } from "./commands/chronograph.ts";
import { registerScoreboardCommand } from "./commands/scoreboard.ts";
import { registerColorCommand } from "./commands/color.ts";
import { registerPixelCommand } from "./commands/pixel.ts";
import { registerResetCommand } from "./commands/reset.ts";

export function createProgram(): Command {
	const program = new Command();

	program
		.name("idm")
		.description("iDotMatrix LED display controller")
		.version("0.1.0")
		.option("-a, --address <address>", "Device BLE address (or set IDOTMATRIX_ADDRESS env var)")
		.option("-v, --verbose", "Enable verbose debug logging")
		.hook("preAction", (_thisCommand, actionCommand) => {
			const opts = actionCommand.optsWithGlobals();
			if (opts.verbose) {
				setVerbose(true);
			}
		});

	registerScanCommand(program);
	registerScreenCommand(program);
	registerImageCommand(program);
	registerGifCommand(program);
	registerClockCommand(program);
	registerCountdownCommand(program);
	registerChronographCommand(program);
	registerScoreboardCommand(program);
	registerColorCommand(program);
	registerPixelCommand(program);
	registerResetCommand(program);

	return program;
}
