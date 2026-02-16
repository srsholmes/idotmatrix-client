/**
 * Clock mode commands.
 * Style 0-7, with optional date visibility and 24h format flags.
 */

import type { ClockStyle, Color } from "../types.ts";

export function setTimeIndicator(enabled: boolean): Uint8Array {
	return new Uint8Array([5, 0, 7, 128, enabled ? 1 : 0]);
}

export function setClockMode(
	style: ClockStyle,
	color: Color = { r: 255, g: 255, b: 255 },
	visibleDate = true,
	hour24 = true,
): Uint8Array {
	const flags = (style | (visibleDate ? 128 : 0)) | (hour24 ? 64 : 0);
	return new Uint8Array([8, 0, 6, 1, flags, color.r & 0xff, color.g & 0xff, color.b & 0xff]);
}
