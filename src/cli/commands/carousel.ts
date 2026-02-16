import type { Command } from "commander";
import sharp from "sharp";
import { createGif } from "sharp-gif2";
import { NobleTransport } from "../../transport/noble-transport.ts";
import { createGifPayloads } from "../../protocol/commands/gif.ts";
import { log, error } from "../../utils/logger.ts";
import type { DisplaySize } from "../../protocol/types.ts";
import { readFile } from "node:fs/promises";
import { delay } from "../../utils/delay.ts";

function isUrl(input: string): boolean {
	return input.startsWith("http://") || input.startsWith("https://");
}

async function loadImageBuffer(source: string): Promise<Buffer> {
	if (isUrl(source)) {
		log(`Downloading ${source}...`);
		const response = await fetch(source);
		if (!response.ok) {
			throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
		}
		return Buffer.from(await response.arrayBuffer());
	}
	return readFile(source);
}

async function createCarouselGif(
	sources: string[],
	size: DisplaySize,
	delayMs: number,
): Promise<Buffer> {
	const frames = await Promise.all(
		sources.map(async (source) => {
			const buffer = await loadImageBuffer(source);
			return sharp(buffer).resize(size, size, {
				fit: "contain",
				kernel: "nearest",
				background: { r: 0, g: 0, b: 0 },
			});
		}),
	);

	log(`Creating carousel with ${frames.length} frames (${delayMs}ms delay)...`);

	const gif = createGif({
		width: size,
		height: size,
		delay: delayMs,
		repeat: 0,
	});

	gif.addFrame(frames);

	return gif.toBuffer();
}

export function registerCarouselCommand(program: Command): void {
	const cmd = program.command("carousel").description("Upload a carousel of images as an animated GIF");

	cmd
		.command("upload")
		.description("Combine multiple images into an animated GIF and upload")
		.argument("<sources...>", "Paths to image files or URLs (http/https)")
		.option("-s, --size <size>", "Display size (32 or 64)", "32")
		.option("-d, --delay <ms>", "Delay between frames in milliseconds", "3000")
		.action(async (sources: string[], opts) => {
			const size = Number.parseInt(opts.size, 10) as DisplaySize;
			if (size !== 32 && size !== 64) {
				error("Size must be 32 or 64.");
				process.exit(1);
			}

			if (sources.length < 2) {
				error("At least 2 images are required for a carousel.");
				process.exit(1);
			}

			const delayMs = Number.parseInt(opts.delay, 10);

			const gifData = await createCarouselGif(sources, size, delayMs);

			const payloads = createGifPayloads(gifData);
			log(`Carousel: ${gifData.length} bytes, ${payloads.length} chunk(s)`);

			const transport = new NobleTransport();
			const address = getAddress(program);
			await transport.connect(address);

			for (let i = 0; i < payloads.length; i++) {
				log(`Sending chunk ${i + 1}/${payloads.length} (${payloads[i]!.length} bytes)...`);
				await transport.write(payloads[i]!, true);
				await delay(1000);
			}

			log("Carousel uploaded successfully.");
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
