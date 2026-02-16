import { describe, it, expect } from "vitest";
import { setScoreboard } from "../../src/protocol/commands/scoreboard.ts";

describe("scoreboard commands", () => {
	it("score 0 - 0", () => {
		expect(Array.from(setScoreboard(0, 0))).toEqual([8, 0, 10, 128, 0, 0, 0, 0]);
	});

	it("score 1 - 2", () => {
		expect(Array.from(setScoreboard(1, 2))).toEqual([8, 0, 10, 128, 1, 0, 2, 0]);
	});

	it("score 999 - 999", () => {
		// 999 = 0x03E7, low = 0xE7 (231), high = 0x03 (3)
		expect(Array.from(setScoreboard(999, 999))).toEqual([8, 0, 10, 128, 231, 3, 231, 3]);
	});

	it("clamps to 999", () => {
		const result = Array.from(setScoreboard(1500, -5));
		expect(result).toEqual([8, 0, 10, 128, 231, 3, 0, 0]);
	});
});
