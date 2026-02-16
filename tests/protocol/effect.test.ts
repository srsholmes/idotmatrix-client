import { describe, it, expect } from "vitest";
import { setEffect } from "../../src/protocol/commands/effect.ts";

describe("effect commands", () => {
	it("style 0 with 2 colors", () => {
		const result = Array.from(
			setEffect(0, [
				{ r: 255, g: 0, b: 0 },
				{ r: 0, g: 255, b: 0 },
			]),
		);
		// length = 6 + 2 = 8
		expect(result).toEqual([8, 0, 3, 2, 0, 90, 2, 255, 0, 0, 0, 255, 0]);
	});

	it("style 3 with 3 colors", () => {
		const result = Array.from(
			setEffect(3, [
				{ r: 255, g: 0, b: 0 },
				{ r: 0, g: 255, b: 0 },
				{ r: 0, g: 0, b: 255 },
			]),
		);
		// length = 6 + 3 = 9
		expect(result).toEqual([9, 0, 3, 2, 3, 90, 3, 255, 0, 0, 0, 255, 0, 0, 0, 255]);
	});
});
