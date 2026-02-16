import sharp from "sharp";
import type { DisplaySize } from "../protocol/types.ts";

export async function resizeImageToGif(inputPath: string, size: DisplaySize): Promise<Buffer> {
	return sharp(inputPath)
		.resize(size, size, {
			fit: "contain",
			kernel: "nearest",
			background: { r: 0, g: 0, b: 0 },
		})
		.gif()
		.toBuffer();
}

export async function resizeImageToPng(inputPath: string, size: DisplaySize): Promise<Buffer> {
	return sharp(inputPath)
		.resize(size, size, {
			fit: "cover",
			kernel: "nearest",
		})
		.png()
		.toBuffer();
}

export async function resizeBufferToGif(input: Buffer | Uint8Array, size: DisplaySize): Promise<Buffer> {
	return sharp(input)
		.resize(size, size, {
			fit: "contain",
			kernel: "nearest",
			background: { r: 0, g: 0, b: 0 },
		})
		.gif()
		.toBuffer();
}

export async function resizeBufferToPng(input: Buffer | Uint8Array, size: DisplaySize): Promise<Buffer> {
	return sharp(input)
		.resize(size, size, {
			fit: "cover",
			kernel: "nearest",
		})
		.png()
		.toBuffer();
}
