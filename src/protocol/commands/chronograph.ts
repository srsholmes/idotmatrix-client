/**
 * Chronograph (stopwatch) commands.
 * Mode: 0=reset, 1=start, 2=pause, 3=continue
 */

import type { ChronographMode } from "../types.ts";

export function setChronographMode(mode: ChronographMode): Uint8Array {
	return new Uint8Array([5, 0, 9, 128, mode]);
}
