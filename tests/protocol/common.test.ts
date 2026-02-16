import { describe, it, expect } from "vitest";
import {
	freezeScreen,
	screenOn,
	screenOff,
	flipScreen,
	setBrightness,
	setSpeed,
	setTime,
	setPassword,
	reset,
} from "../../src/protocol/commands/common.ts";

describe("common commands", () => {
	it("freezeScreen", () => {
		expect(Array.from(freezeScreen())).toEqual([4, 0, 3, 0]);
	});

	it("screenOn", () => {
		expect(Array.from(screenOn())).toEqual([5, 0, 7, 1, 1]);
	});

	it("screenOff", () => {
		expect(Array.from(screenOff())).toEqual([5, 0, 7, 1, 0]);
	});

	it("flipScreen true", () => {
		expect(Array.from(flipScreen(true))).toEqual([5, 0, 6, 128, 1]);
	});

	it("flipScreen false", () => {
		expect(Array.from(flipScreen(false))).toEqual([5, 0, 6, 128, 0]);
	});

	it("setBrightness 50%", () => {
		expect(Array.from(setBrightness(50))).toEqual([5, 0, 4, 128, 50]);
	});

	it("setBrightness clamps low", () => {
		expect(Array.from(setBrightness(1))).toEqual([5, 0, 4, 128, 5]);
	});

	it("setBrightness clamps high", () => {
		expect(Array.from(setBrightness(200))).toEqual([5, 0, 4, 128, 100]);
	});

	it("setSpeed", () => {
		expect(Array.from(setSpeed(10))).toEqual([5, 0, 3, 1, 10]);
	});

	it("setTime", () => {
		// Tuesday, March 15, 2024, 14:30:45
		const date = new Date(2024, 2, 15, 14, 30, 45);
		const result = Array.from(setTime(date));
		expect(result).toEqual([11, 0, 1, 128, 24, 3, 15, 5, 14, 30, 45]);
		// 2024 % 100 = 24, month = 3, day = 15, Friday = 5, 14:30:45
	});

	it("setPassword", () => {
		const result = Array.from(setPassword(123456));
		// high = 123456 / 10000 = 12, mid = (123456 / 100) % 100 = 34, low = 123456 % 100 = 56
		expect(result).toEqual([8, 0, 4, 2, 1, 12, 34, 56]);
	});

	it("reset returns two packets", () => {
		const packets = reset();
		expect(packets.length).toBe(2);
		expect(Array.from(packets[0]!)).toEqual([0x04, 0x00, 0x03, 0x80]);
		expect(Array.from(packets[1]!)).toEqual([0x05, 0x00, 0x04, 0x80, 0x50]);
	});
});
