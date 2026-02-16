import { describe, it, expect } from "vitest";
import { setCountdownMode } from "../../src/protocol/commands/countdown.ts";

describe("countdown commands", () => {
	it("start 5:30", () => {
		expect(Array.from(setCountdownMode(1, 5, 30))).toEqual([7, 0, 8, 128, 1, 5, 30]);
	});

	it("disable", () => {
		expect(Array.from(setCountdownMode(0, 0, 0))).toEqual([7, 0, 8, 128, 0, 0, 0]);
	});

	it("clamps seconds to 59", () => {
		expect(Array.from(setCountdownMode(1, 10, 99))).toEqual([7, 0, 8, 128, 1, 10, 59]);
	});
});
