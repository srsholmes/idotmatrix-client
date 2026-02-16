/**
 * Countdown timer commands.
 * Mode: 0=disable, 1=start, 2=pause, 3=restart
 */

import type { CountdownMode } from "../types.ts";

export function setCountdownMode(mode: CountdownMode, minutes: number, seconds: number): Uint8Array {
	const sec = Math.max(0, Math.min(59, Math.round(seconds)));
	const min = Math.max(0, Math.min(255, Math.round(minutes)));
	return new Uint8Array([7, 0, 8, 128, mode, min, sec]);
}
