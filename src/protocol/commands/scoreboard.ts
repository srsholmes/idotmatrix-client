/**
 * Scoreboard display commands.
 * Two counters, each 0-999.
 */

export function setScoreboard(count1: number, count2: number): Uint8Array {
	const c1 = Math.max(0, Math.min(999, Math.round(count1)));
	const c2 = Math.max(0, Math.min(999, Math.round(count2)));
	// Big-endian u16, then swap bytes for the protocol (low, high)
	const c1Low = c1 & 0xff;
	const c1High = (c1 >> 8) & 0xff;
	const c2Low = c2 & 0xff;
	const c2High = (c2 >> 8) & 0xff;
	return new Uint8Array([8, 0, 10, 128, c1Low, c1High, c2Low, c2High]);
}
