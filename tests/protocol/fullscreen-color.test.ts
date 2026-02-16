import { describe, it, expect } from "vitest";
import { setFullscreenColor } from "../../src/protocol/commands/fullscreen-color.ts";

describe("fullscreen color commands", () => {
	it("red", () => {
		expect(Array.from(setFullscreenColor({ r: 255, g: 0, b: 0 }))).toEqual([7, 0, 2, 2, 255, 0, 0]);
	});

	it("green", () => {
		expect(Array.from(setFullscreenColor({ r: 0, g: 255, b: 0 }))).toEqual([7, 0, 2, 2, 0, 255, 0]);
	});

	it("blue", () => {
		expect(Array.from(setFullscreenColor({ r: 0, g: 0, b: 255 }))).toEqual([7, 0, 2, 2, 0, 0, 255]);
	});
});
