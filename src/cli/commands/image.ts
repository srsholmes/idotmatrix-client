import type { Command } from "commander";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { createGifPayloads } from "../../protocol/commands/gif.ts";
import { resizeImageToGif, resizeBufferToGif } from "../../imaging/resize.ts";
import { log, error } from "../../utils/logger.ts";
import type { DisplaySize } from "../../protocol/types.ts";
import { readFile, writeFile } from "node:fs/promises";
import { delay } from "../../utils/delay.ts";

function isUrl(input: string): boolean {
	return input.startsWith("http://") || input.startsWith("https://");
}

async function fetchImage(url: string): Promise<Buffer> {
	log(`Downloading image from ${url}...`);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
	}
	return Buffer.from(await response.arrayBuffer());
}

async function loadAndResizeToGif(input: string, size: DisplaySize, raw: boolean): Promise<Uint8Array> {
	if (raw) {
		if (isUrl(input)) {
			return fetchImage(input);
		}
		return readFile(input);
	}

	log(`Resizing image to ${size}x${size}...`);
	if (isUrl(input)) {
		const imageBuffer = await fetchImage(input);
		return resizeBufferToGif(imageBuffer, size);
	}
	return resizeImageToGif(input, size);
}

export function registerImageCommand(program: Command): void {
	const cmd = program.command("image").description("Upload static images to the display");

	cmd
		.command("upload")
		.description("Upload an image to the display")
		.argument("<source>", "Path to image file or URL (http/https)")
		.option("-s, --size <size>", "Display size (32 or 64)", "32")
		.option("--raw", "Skip resize, send file as-is")
		.action(async (source: string, opts) => {
			const size = Number.parseInt(opts.size, 10) as DisplaySize;
			if (size !== 32 && size !== 64) {
				error("Size must be 32 or 64.");
				process.exit(1);
			}

			const gifData = await loadAndResizeToGif(source, size, opts.raw);

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
		.argument("<source>", "Path to image file or URL (http/https)")
		.option("-s, --size <size>", "Display size (32 or 64)", "32")
		.option("-o, --output <path>", "Output file path", "preview.png")
		.action(async (source: string, opts) => {
			const size = Number.parseInt(opts.size, 10) as DisplaySize;
			if (size !== 32 && size !== 64) {
				error("Size must be 32 or 64.");
				process.exit(1);
			}

			const gifData = await loadAndResizeToGif(source, size, false);
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
