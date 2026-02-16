import { describe, it, expect } from "vitest";
import { setPixel } from "../../src/protocol/commands/graffiti.ts";

describe("graffiti commands", () => {
	it("setPixel at (10, 20) red", () => {
		expect(Array.from(setPixel(10, 20, { r: 255, g: 0, b: 0 }))).toEqual([
			10, 0, 5, 1, 0, 255, 0, 0, 10, 20,
		]);
	});

	it("setPixel at (0, 0) black", () => {
		expect(Array.from(setPixel(0, 0, { r: 0, g: 0, b: 0 }))).toEqual([
			10, 0, 5, 1, 0, 0, 0, 0, 0, 0,
		]);
	});
});
