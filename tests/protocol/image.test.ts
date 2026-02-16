import { describe, it, expect } from "vitest";
import { setImageMode, createImagePayloads } from "../../src/protocol/commands/image.ts";

describe("image commands", () => {
	it("setImageMode enable", () => {
		expect(Array.from(setImageMode(1))).toEqual([5, 0, 4, 1, 1]);
	});

	it("setImageMode disable", () => {
		expect(Array.from(setImageMode(0))).toEqual([5, 0, 4, 1, 0]);
	});

	it("createImagePayloads with small data (single chunk)", () => {
		// 100 bytes of data = 1 chunk
		const data = new Uint8Array(100);
		for (let i = 0; i < 100; i++) data[i] = i;

		const payloads = createImagePayloads(data);
		expect(payloads.length).toBe(1);

		const payload = payloads[0]!;
		const view = new DataView(payload.buffer, payload.byteOffset);

		// bytes 0-1: header_size + chunk_size = 16 + 100 = 116
		expect(view.getUint16(0, true)).toBe(116);
		// byte 2: 0x01 (static)
		expect(payload[2]).toBe(0x01);
		// byte 3: 0x00 (static)
		expect(payload[3]).toBe(0x00);
		// byte 4: flag = 0 (first chunk)
		expect(payload[4]).toBe(0);
		// bytes 5-8: total PNG length = 100
		expect(view.getUint32(5, true)).toBe(100);
		// bytes 9-12: CRC32 (non-zero)
		expect(view.getUint32(9, true)).not.toBe(0);
		// bytes 13-15: static footer
		expect(payload[13]).toBe(0x05);
		expect(payload[14]).toBe(0x00);
		expect(payload[15]).toBe(0x0d);
		// data starts at offset 16
		expect(payload[16]).toBe(0);
		expect(payload[17]).toBe(1);
		// total length = 16 header + 100 data = 116
		expect(payload.length).toBe(116);
	});

	it("createImagePayloads with multi-chunk data", () => {
		// 5000 bytes = 2 chunks (4096 + 904)
		const data = new Uint8Array(5000);
		const payloads = createImagePayloads(data);
		expect(payloads.length).toBe(2);

		// First chunk
		const p1 = payloads[0]!;
		const v1 = new DataView(p1.buffer, p1.byteOffset);
		expect(v1.getUint16(0, true)).toBe(16 + 4096);
		expect(p1[4]).toBe(0); // first chunk flag
		expect(v1.getUint32(5, true)).toBe(5000); // total length
		expect(p1.length).toBe(16 + 4096);

		// Second chunk
		const p2 = payloads[1]!;
		const v2 = new DataView(p2.buffer, p2.byteOffset);
		expect(v2.getUint16(0, true)).toBe(16 + 904);
		expect(p2[4]).toBe(2); // continuation flag
		expect(v2.getUint32(5, true)).toBe(5000); // total length
		expect(p2.length).toBe(16 + 904);
	});
});
