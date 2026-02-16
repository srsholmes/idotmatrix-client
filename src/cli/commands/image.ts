import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { createGifPayloads } from "../../protocol/commands/gif.ts";
import { resizeImageToGif } from "../../imaging/resize.ts";
import { log, error } from "../../utils/logger.ts";
import type { DisplaySize } from "../../protocol/types.ts";
import { readFile, writeFile } from "node:fs/promises";
import { delay } from "../../utils/delay.ts";

export function registerImageCommand(program: Command): void {
	const cmd = program.command("image").description("Upload static images to the display");

	cmd
		.command("upload")
		.description("Upload an image to the display")
		.argument("<path>", "Path to the image file")
		.option("-s, --size <size>", "Display size (32 or 64)", "32")
		.option("--raw", "Skip resize, send file as-is")
		.action(async (filePath: string, opts) => {
			const size = Number.parseInt(opts.size, 10) as DisplaySize;
			if (size !== 32 && size !== 64) {
				error("Size must be 32 or 64.");
				process.exit(1);
			}

			let gifData: Uint8Array;
			if (opts.raw) {
				gifData = await readFile(filePath);
			} else {
				log(`Resizing image to ${size}x${size}...`);
				gifData = await resizeImageToGif(filePath, size);
			}

			const payloads = createGifPayloads(gifData);
			log(`Image: ${gifData.length} bytes, ${payloads.length} chunk(s)`);

			const transport = new NobleTransport();
			const address = getAddress(program);
			await transport.connect(address);

			for (let i = 0; i < payloads.length; i++) {
				log(`Sending chunk ${i + 1}/${payloads.length} (${payloads[i]!.length} bytes)...`);
				await transport.write(payloads[i]!, true);
				await delay(1000);
			}

			log("Image uploaded successfully.");
			await transport.disconnect();
		});

	cmd
		.command("preview")
		.description("Preview pixelated image without uploading")
		.argument("<path>", "Path to the image file")
		.option("-s, --size <size>", "Display size (32 or 64)", "32")
		.option("-o, --output <path>", "Output file path", "preview.png")
		.action(async (filePath: string, opts) => {
			const size = Number.parseInt(opts.size, 10) as DisplaySize;
			if (size !== 32 && size !== 64) {
				error("Size must be 32 or 64.");
				process.exit(1);
			}

			const gifData = await resizeImageToGif(filePath, size);
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
