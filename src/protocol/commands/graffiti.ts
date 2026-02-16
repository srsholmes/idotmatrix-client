/**
 * Graffiti (pixel drawing) commands.
 */

import type { Color } from "../types.ts";

export function setPixel(x: number, y: number, color: Color): Uint8Array {
	return new Uint8Array([
		10,
		0,
		5,
		1,
		0,
		color.r & 0xff,
		color.g & 0xff,
		color.b & 0xff,
		x & 0xff,
		y & 0xff,
	]);
}
