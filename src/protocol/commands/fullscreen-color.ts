/**
 * Fullscreen solid color fill.
 */

import type { Color } from "../types.ts";

export function setFullscreenColor(color: Color): Uint8Array {
	return new Uint8Array([7, 0, 2, 2, color.r & 0xff, color.g & 0xff, color.b & 0xff]);
}
