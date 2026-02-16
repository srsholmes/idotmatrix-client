import sharp from "sharp";
import type { DisplaySize } from "../protocol/types.ts";

export async function resizeGif(inputPath: string, size: DisplaySize): Promise<Buffer> {
	return sharp(inputPath, { animated: true })
		.resize(size, size, {
			fit: "contain",
			kernel: "nearest",
			background: { r: 0, g: 0, b: 0 },
		})
		.gif()
		.toBuffer();
}

export async function resizeGifBuffer(input: Buffer | Uint8Array, size: DisplaySize): Promise<Buffer> {
	return sharp(input, { animated: true })
		.resize(size, size, {
			fit: "contain",
			kernel: "nearest",
			background: { r: 0, g: 0, b: 0 },
		})
		.gif()
		.toBuffer();
}
