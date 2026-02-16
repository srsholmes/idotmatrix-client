import sharp from "sharp";

export async function loadPng(filePath: string): Promise<Buffer> {
	return sharp(filePath).png().toBuffer();
}

export async function getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
	const metadata = await sharp(filePath).metadata();
	return {
		width: metadata.width ?? 0,
		height: metadata.height ?? 0,
	};
}
