/**
 * Visual effect commands.
 * Style 0-6, with 2-7 RGB colors.
 */

import type { Color, EffectStyle } from "../types.ts";

export function setEffect(style: EffectStyle, colors: Color[]): Uint8Array {
	const count = Math.max(2, Math.min(7, colors.length));
	const rgbBytes: number[] = [];
	for (let i = 0; i < count; i++) {
		const c = colors[i] ?? { r: 255, g: 255, b: 255 };
		rgbBytes.push(c.r & 0xff, c.g & 0xff, c.b & 0xff);
	}
	return new Uint8Array([6 + count, 0, 3, 2, style, 90, count, ...rgbBytes]);
}
