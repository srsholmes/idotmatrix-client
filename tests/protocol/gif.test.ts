import { describe, it, expect } from "vitest";
import { createGifPayloads } from "../../src/protocol/commands/gif.ts";
import { crc32 } from "../../src/utils/crc32.ts";

describe("gif commands", () => {
	it("single chunk GIF", () => {
		const data = new Uint8Array(100);
		for (let i = 0; i < 100; i++) data[i] = i;

		const payloads = createGifPayloads(data);
		expect(payloads.length).toBe(1);

		const payload = payloads[0]!;
		const view = new DataView(payload.buffer, payload.byteOffset);

		// chunk_len = 16 + 100 = 116
		expect(view.getUint16(0, true)).toBe(116);
		// static bytes
		expect(payload[2]).toBe(0x01);
		expect(payload[3]).toBe(0x00);
		// flag = 0 (first chunk)
		expect(payload[4]).toBe(0);
		// gif length = 100
		expect(view.getUint32(5, true)).toBe(100);
		// CRC32
		expect(view.getUint32(9, true)).toBe(crc32(data));
		// footer
		expect(payload[13]).toBe(0x05);
		expect(payload[14]).toBe(0x00);
		expect(payload[15]).toBe(0x0d);

		expect(payload.length).toBe(116);
	});

	it("multi-chunk GIF", () => {
		const data = new Uint8Array(5000);
		const payloads = createGifPayloads(data);
		expect(payloads.length).toBe(2);

		// First chunk flag = 0
		expect(payloads[0]![4]).toBe(0);
		// Second chunk flag = 2
		expect(payloads[1]![4]).toBe(2);

		// First chunk size = 16 + 4096 = 4112
		const view0 = new DataView(payloads[0]!.buffer, payloads[0]!.byteOffset);
		expect(view0.getUint16(0, true)).toBe(4112);

		// Second chunk size = 16 + 904 = 920
		const view1 = new DataView(payloads[1]!.buffer, payloads[1]!.byteOffset);
		expect(view1.getUint16(0, true)).toBe(920);
	});
});
