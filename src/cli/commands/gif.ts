import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { createGifPayloads } from "../../protocol/commands/gif.ts";
import { resizeGif } from "../../imaging/gif.ts";
import { log, error } from "../../utils/logger.ts";
import type { DisplaySize } from "../../protocol/types.ts";
import { readFile, writeFile } from "node:fs/promises";

export function registerGifCommand(program: Command): void {
	const cmd = program.command("gif").description("Upload animated GIFs to the display");

	cmd
		.command("upload")
		.description("Upload an animated GIF to the display")
		.argument("<path>", "Path to the GIF file")
		.option("-s, --size <size>", "Display size (32 or 64)", "32")
		.option("--raw", "Skip resize, send GIF as-is")
		.action(async (filePath: string, opts) => {
			const size = Number.parseInt(opts.size, 10) as DisplaySize;
			if (size !== 32 && size !== 64) {
				error("Size must be 32 or 64.");
				process.exit(1);
			}

			let gifData: Buffer;
			if (opts.raw) {
				gifData = await readFile(filePath);
			} else {
				log(`Resizing GIF to ${size}x${size}...`);
				gifData = await resizeGif(filePath, size);
			}

			const payloads = createGifPayloads(gifData);
			log(`GIF payload: ${payloads.length} chunk(s)`);

			const transport = new NobleTransport();
			const address = getAddress(program);
			await transport.connect(address);

			for (let i = 0; i < payloads.length; i++) {
				await transport.write(payloads[i]!, true);
				log(`  Sent chunk ${i + 1}/${payloads.length}`);
			}

			log("GIF uploaded successfully.");
			await transport.disconnect();
		});

	cmd
		.command("preview")
		.description("Preview resized GIF without uploading")
		.argument("<path>", "Path to the GIF file")
		.option("-s, --size <size>", "Display size (32 or 64)", "32")
		.option("-o, --output <path>", "Output file path", "preview.gif")
		.action(async (filePath: string, opts) => {
			const size = Number.parseInt(opts.size, 10) as DisplaySize;
			if (size !== 32 && size !== 64) {
				error("Size must be 32 or 64.");
				process.exit(1);
			}

			const gifData = await resizeGif(filePath, size);
			await writeFile(opts.output, gifData);
			log(`Preview saved to ${opts.output} (${size}x${size})`);
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
