import { describe, it, expect } from "vitest";
import { setChronographMode } from "../../src/protocol/commands/chronograph.ts";

describe("chronograph commands", () => {
	it("reset (0)", () => {
		expect(Array.from(setChronographMode(0))).toEqual([5, 0, 9, 128, 0]);
	});

	it("start (1)", () => {
		expect(Array.from(setChronographMode(1))).toEqual([5, 0, 9, 128, 1]);
	});

	it("pause (2)", () => {
		expect(Array.from(setChronographMode(2))).toEqual([5, 0, 9, 128, 2]);
	});

	it("continue (3)", () => {
		expect(Array.from(setChronographMode(3))).toEqual([5, 0, 9, 128, 3]);
	});
});
