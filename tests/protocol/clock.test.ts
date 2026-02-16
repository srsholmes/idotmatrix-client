import { describe, it, expect } from "vitest";
import { setTimeIndicator, setClockMode } from "../../src/protocol/commands/clock.ts";

describe("clock commands", () => {
	it("setTimeIndicator enabled", () => {
		expect(Array.from(setTimeIndicator(true))).toEqual([5, 0, 7, 128, 1]);
	});

	it("setTimeIndicator disabled", () => {
		expect(Array.from(setTimeIndicator(false))).toEqual([5, 0, 7, 128, 0]);
	});

	it("setClockMode style 0, white, date visible, 24h", () => {
		const result = Array.from(setClockMode(0, { r: 255, g: 255, b: 255 }, true, true));
		// flags = (0 | 128) | 64 = 192
		expect(result).toEqual([8, 0, 6, 1, 192, 255, 255, 255]);
	});

	it("setClockMode style 3, red, no date, 12h", () => {
		const result = Array.from(setClockMode(3, { r: 255, g: 0, b: 0 }, false, false));
		// flags = (3 | 0) | 0 = 3
		expect(result).toEqual([8, 0, 6, 1, 3, 255, 0, 0]);
	});

	it("setClockMode style 5, date visible, 12h", () => {
		const result = Array.from(setClockMode(5, { r: 0, g: 255, b: 0 }, true, false));
		// flags = (5 | 128) | 0 = 133
		expect(result).toEqual([8, 0, 6, 1, 133, 0, 255, 0]);
	});
});
